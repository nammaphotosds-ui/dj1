import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { BillType, JewelryCategory } from '../types';
import type { JewelryItem, Customer, Bill, Staff, Distributor, ActivityLog } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';
import * as drive from '../utils/googleDrive';
import { hashPassword } from '../utils/crypto';
import { useAuthContext } from './AuthContext';

interface DataContextType {
  inventory: JewelryItem[];
  customers: Customer[];
  bills: Bill[];
  staff: Staff[];
  distributors: Distributor[];
  activityLogs: ActivityLog[];
  addInventoryItem: (item: Omit<JewelryItem, 'id' | 'serialNo' | 'dateAdded'>) => Promise<void>;
  deleteInventoryItem: (itemId: string) => Promise<void>;
  addCustomer: (customer: Omit<Customer, 'id' | 'joinDate' | 'createdBy' | 'pendingBalance'>) => Promise<void>;
  deleteCustomer: (customerId: string) => Promise<void>;
  createBill: (bill: Omit<Bill, 'id' | 'date' | 'customerName' | 'finalAmount' | 'netWeight' | 'makingChargeAmount' | 'wastageAmount' | 'grandTotal' | 'createdBy'>) => Promise<Bill>;
  getCustomerById: (id: string) => Customer | undefined;
  getBillsByCustomerId: (id: string) => Bill[];
  getInventoryItemById: (id: string) => JewelryItem | undefined;
  getNextCustomerId: () => string;
  resetTransactions: () => Promise<void>;
  addStaff: (newStaff: Omit<Staff, 'passwordHash'>, password: string) => Promise<void>;
  deleteStaff: (staffId: string) => Promise<void>;
  addDistributor: (distributor: Omit<Distributor, 'id'>) => Promise<void>;
  deleteDistributor: (distributorId: string) => Promise<void>;
  recordPayment: (customerId: string, amount: number) => Promise<void>;
}

export const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser, tokenResponse, isInitialized: isAuthInitialized, setCurrentUser } = useAuthContext();

  const [inventory, setInventory] = useState<JewelryItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  
  const [driveFileId, setDriveFileId] = useLocalStorage<string | null>('driveFileId', null);
  const [error, setError] = useState<string | null>(null); // This might be better in AuthContext
  const isInitialLoad = useRef(true);

  // Activity Logger
  const logActivity = (message: string) => {
    if (!currentUser) return;
    const newLog: ActivityLog = {
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      message,
    };
    setActivityLogs(prev => [newLog, ...prev].slice(0, 50)); // Keep last 50 logs
  };


  // Centralized data saving effect
  useEffect(() => {
    if (isInitialLoad.current) {
        if (isAuthInitialized) { // Use auth init signal
            isInitialLoad.current = false;
        }
        return;
    }

    const saveDataToDrive = async () => {
        if (!currentUser || !isAuthInitialized) return;

        if (!driveFileId || !tokenResponse || !tokenResponse.access_token) {
            if (currentUser.role === 'staff') setError("Cannot save data. An admin must log in.");
            return;
        }

        if (tokenResponse.expires_at && tokenResponse.expires_at < Date.now()) {
            if (currentUser.role === 'staff') setError("Cannot save. Ask an admin to log in to refresh the connection.");
            return;
        }

        try {
            const dataToSave = { inventory, customers, bills, staff, distributors, activityLogs };
            await drive.updateFile(tokenResponse.access_token, driveFileId, dataToSave);
            localStorage.setItem('appDataCache', JSON.stringify(dataToSave));
            if (error) setError(null);
        } catch(e) {
            console.error("Failed to save data to drive", e);
            setError("Failed to save data. Please check your connection.");
        }
    };
    
    saveDataToDrive();
  }, [inventory, customers, bills, staff, distributors, activityLogs]);

  // Data Loading Effect
  useEffect(() => {
    const initData = async () => {
        isInitialLoad.current = true;
        setError(null);
        
        // Use cached data for any user initially, prevents blank screen on reload
        const localData = localStorage.getItem('appDataCache');
        if (localData) {
            const data = JSON.parse(localData);
            setInventory(data.inventory || []);
            setCustomers(data.customers || []);
            setBills(data.bills || []);
            setStaff(data.staff || []);
            setDistributors(data.distributors || []);
            setActivityLogs(data.activityLogs || []);
        }

        // Only admins can fetch from Drive
        if (currentUser?.role !== 'admin' || !tokenResponse || !tokenResponse.access_token) {
            return;
        }

        try {
            const fileId = await drive.getFileId(tokenResponse.access_token);
            if (fileId) {
                const content = await drive.getFileContent(tokenResponse.access_token, fileId);
                setInventory(content.inventory || []);
                setCustomers(content.customers || []);
                setBills(content.bills || []);
                setStaff(content.staff || []);
                setDistributors(content.distributors || []);
                setActivityLogs(content.activityLogs || []);
                setDriveFileId(fileId);
                localStorage.setItem('appDataCache', JSON.stringify(content));
            } else {
                const initialState = { inventory: [], customers: [], bills: [], staff: [], distributors: [], activityLogs: [] };
                const newFileId = await drive.createFile(tokenResponse.access_token, initialState);
                setDriveFileId(newFileId);
                setInventory([]); setCustomers([]); setBills([]); setStaff([]); setDistributors([]); setActivityLogs([]);
                localStorage.setItem('appDataCache', JSON.stringify(initialState));
            }
        } catch (e: any) {
            console.error("Google Drive initialization failed", e);
            setError("Failed to connect to Google Drive. The token might be invalid.");
            setCurrentUser(null);
        }
    };
    if (isAuthInitialized) {
        initData();
    }
  }, [isAuthInitialized, tokenResponse, currentUser?.role]);

  const getNextCustomerId = () => `DJ${(customers.length + 1).toString().padStart(5, '0')}`;

  const addInventoryItem = async (item: Omit<JewelryItem, 'id' | 'serialNo' | 'dateAdded'>) => {
    if (currentUser?.role !== 'admin') throw new Error("Permission denied");
    const categoryItems = inventory.filter(i => i.category === item.category);
    const maxSerial = Math.max(0, ...categoryItems.map(i => parseInt(i.serialNo, 10)));
    const newSerialNo = (maxSerial + 1).toString().padStart(5, '0');

    const newItem: JewelryItem = {
      ...item, id: `ITEM-${Date.now()}`, serialNo: newSerialNo, dateAdded: new Date().toISOString(),
    };
    setInventory(prev => [...prev, newItem]);
    logActivity(`Added inventory item: ${newItem.name} (S/N: ${newItem.serialNo})`);
  };
  
  const deleteInventoryItem = async (itemId: string) => {
    if (currentUser?.role !== 'admin') throw new Error("Permission denied");
    const itemToDelete = inventory.find(i => i.id === itemId);
    setInventory(prev => prev.filter(item => item.id !== itemId));
    if (itemToDelete) logActivity(`Deleted inventory item: ${itemToDelete.name}`);
  };

  const addCustomer = async (customer: Omit<Customer, 'id' | 'joinDate' | 'createdBy' | 'pendingBalance'>) => {
    if (!currentUser) throw new Error("User not logged in");
    const newCustomer: Customer = {
      ...customer, id: getNextCustomerId(), joinDate: new Date().toISOString(), createdBy: currentUser.id, pendingBalance: 0,
    };
    setCustomers(prev => [...prev, newCustomer]);
    logActivity(`Added new customer: ${newCustomer.name}`);
  };
  
  const deleteCustomer = async (customerId: string) => {
    if (currentUser?.role !== 'admin') throw new Error("Permission denied");
    const customerToDelete = customers.find(c => c.id === customerId);
    setCustomers(prev => prev.filter(c => c.id !== customerId));
    setBills(prev => prev.filter(b => b.customerId !== customerId));
    if (customerToDelete) logActivity(`Deleted customer: ${customerToDelete.name}`);
  };

  const createBill = async (billData: Omit<Bill, 'id' | 'date' | 'customerName' | 'finalAmount' | 'netWeight' | 'makingChargeAmount' | 'wastageAmount' | 'grandTotal' | 'createdBy'>): Promise<Bill> => {
    if (!currentUser) throw new Error("User not logged in");
    const totalGrossWeight = billData.items.reduce((sum, item) => sum + (item.weight * item.quantity), 0);
    const subtotalBeforeLessWeight = billData.totalAmount; 
    const averageRatePerGram = totalGrossWeight > 0 ? subtotalBeforeLessWeight / totalGrossWeight : 0;
    const lessWeightValue = billData.lessWeight * averageRatePerGram;
    const finalAmount = subtotalBeforeLessWeight - lessWeightValue;
    const makingChargeAmount = finalAmount * (billData.makingChargePercentage / 100);
    const wastageAmount = finalAmount * (billData.wastagePercentage / 100);
    const grandTotal = finalAmount + makingChargeAmount + wastageAmount - billData.bargainedAmount;
    const amountPaid = billData.amountPaid;
    const netWeight = totalGrossWeight - billData.lessWeight;
    const customer = customers.find(c => c.id === billData.customerId);
    if(!customer) throw new Error("Customer not found");

    const newBill: Bill = {
      ...billData, id: `BILL-${Date.now()}`, customerName: customer.name, finalAmount, netWeight, makingChargeAmount, wastageAmount, grandTotal, amountPaid, date: new Date().toISOString(), createdBy: currentUser.id,
    };

    if (billData.type === 'INVOICE') {
        setInventory(prevInventory => {
            const inventoryMap = new Map<string, JewelryItem>(prevInventory.map(i => [i.id, i]));
            for (const billItem of billData.items) {
                const item = inventoryMap.get(billItem.itemId);
                if (item) {
                    const updatedItem = { ...item, quantity: Math.max(0, item.quantity - billItem.quantity) };
                    inventoryMap.set(item.id, updatedItem);
                }
            }
            return Array.from(inventoryMap.values());
        });
        
        const pendingForThisBill = grandTotal - amountPaid;
        if (pendingForThisBill > 0.01) {
            setCustomers(prev => prev.map(c => 
                c.id === billData.customerId 
                ? { ...c, pendingBalance: c.pendingBalance + pendingForThisBill } 
                : c
            ));
        }
    }
    
    setBills(prev => [...prev, newBill]);
    logActivity(`Created ${newBill.type} for ${customer.name} (Total: ₹${grandTotal.toFixed(2)})`);
    return newBill;
  };

  const recordPayment = async (customerId: string, amount: number) => {
    if (!currentUser) throw new Error("User not logged in");
    setCustomers(prev =>
      prev.map(c =>
        c.id === customerId
          ? { ...c, pendingBalance: Math.max(0, c.pendingBalance - amount) }
          : c
      )
    );
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      logActivity(`Recorded payment of ₹${amount.toLocaleString()} for ${customer.name}.`);
    }
  };
  
  const resetTransactions = async () => {
    if (currentUser?.role !== 'admin') throw new Error("Permission denied");
    setBills([]);
    logActivity('Reset all transaction data.');
  };

  const addStaff = async (newStaff: Omit<Staff, 'passwordHash'>, password: string) => {
    if (currentUser?.role !== 'admin') throw new Error("Permission denied");
    if (staff.some(s => s.id === newStaff.id)) throw new Error("Staff ID already exists.");
    const passwordHash = await hashPassword(password);
    const staffMember: Staff = { ...newStaff, passwordHash };
    setStaff(prev => [...prev, staffMember]);
    logActivity(`Added new staff member: ${staffMember.name} (${staffMember.id})`);
  };

  const deleteStaff = async (staffId: string) => {
    if (currentUser?.role !== 'admin') throw new Error("Permission denied");
    const staffToDelete = staff.find(s => s.id === staffId);
    setStaff(prev => prev.filter(s => s.id !== staffId));
    if (staffToDelete) logActivity(`Deleted staff member: ${staffToDelete.name} (${staffToDelete.id})`);
  };
  
  const addDistributor = async (distributor: Omit<Distributor, 'id'>) => {
    if (currentUser?.role !== 'admin') throw new Error("Permission denied");
    if (distributors.some(d => d.name.toLowerCase() === distributor.name.toLowerCase())) throw new Error("Distributor name already exists.");
    const newDistributor: Distributor = { ...distributor, id: `DIST-${Date.now()}`};
    setDistributors(prev => [...prev, newDistributor]);
    logActivity(`Added new distributor: ${newDistributor.name}`);
  };

  const deleteDistributor = async (distributorId: string) => {
    if (currentUser?.role !== 'admin') throw new Error("Permission denied");
    const distToDelete = distributors.find(d => d.id === distributorId);
    setDistributors(prev => prev.filter(d => d.id !== distributorId));
    if (distToDelete) logActivity(`Deleted distributor: ${distToDelete.name}`);
  };

  const getCustomerById = (id: string) => customers.find(c => c.id === id);
  const getBillsByCustomerId = (id: string) => bills.filter(b => b.customerId === id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const getInventoryItemById = (id: string) => inventory.find(i => i.id === id);

  return (
    <DataContext.Provider value={{ inventory, customers, bills, staff, distributors, activityLogs, addInventoryItem, deleteInventoryItem, addCustomer, deleteCustomer, createBill, getCustomerById, getBillsByCustomerId, getInventoryItemById, getNextCustomerId, resetTransactions, addStaff, deleteStaff, addDistributor, deleteDistributor, recordPayment }}>
      {children}
    </DataContext.Provider>
  );
};

export const useDataContext = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useDataContext must be used within a DataProvider');
  }
  return context;
};