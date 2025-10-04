import React, { createContext, useContext, useState, ReactNode, useEffect, useRef, useMemo, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { BillType, JewelryCategory } from '../types';
import type { JewelryItem, Customer, Bill, Staff, Distributor, ActivityLog, BillItem, StaffSyncRequest } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';
import * as drive from '../utils/googleDrive';
import { hashPassword } from '../utils/crypto';
import { useAuthContext } from './AuthContext';
import { supabase } from '../utils/supabase';

interface DataContextType {
  inventory: JewelryItem[];
  customers: Customer[];
  rawCustomers: Omit<Customer, 'pendingBalance'>[];
  bills: Bill[];
  staff: Staff[];
  distributors: Distributor[];
  activityLogs: ActivityLog[];
  adminProfile: { name: string };
  userNameMap: Map<string, string>;
  updateAdminName: (name: string) => Promise<void>;
  addInventoryItem: (item: Omit<JewelryItem, 'id' | 'serialNo' | 'dateAdded'>) => Promise<void>;
  updateInventoryItem: (itemId: string, updates: Partial<Omit<JewelryItem, 'id' | 'serialNo' | 'dateAdded'>>) => Promise<void>;
  deleteInventoryItem: (itemId: string) => Promise<void>;
  addCustomer: (customer: Omit<Customer, 'id' | 'joinDate' | 'createdBy' | 'pendingBalance'>) => Promise<void>;
  deleteCustomer: (customerId: string) => Promise<void>;
  createBill: (bill: Omit<Bill, 'id' | 'date' | 'customerName' | 'finalAmount' | 'netWeight' | 'makingChargeAmount' | 'wastageAmount' | 'sgstAmount' | 'cgstAmount' | 'grandTotal' | 'createdBy'>) => Promise<Bill>;
  getCustomerById: (id: string) => Customer | undefined;
  getBillsByCustomerId: (id: string) => Bill[];
  getInventoryItemById: (id: string) => JewelryItem | undefined;
  getNextCustomerId: () => string;
  resetTransactions: () => Promise<void>;
  addStaff: (newStaff: Omit<Staff, 'passwordHash'>, password: string) => Promise<void>;
  updateStaff: (staffId: string, newDetails: { id: string; name: string; password?: string }) => Promise<void>;
  deleteStaff: (staffId: string) => Promise<void>;
  addDistributor: (distributor: Omit<Distributor, 'id'>) => Promise<void>;
  deleteDistributor: (distributorId: string) => Promise<void>;
  recordPaymentForBill: (billId: string, amount: number) => Promise<void>;
  recordPayment: (customerId: string, amount: number) => Promise<void>;
  getSyncDataPayload: () => string;
  getStaffChangesPayload: () => { payload: string; changesCount: number };
  clearStaffChanges: () => void;
  pendingSyncRequests: StaffSyncRequest[];
  processSyncRequest: (requestId: number, payload: string, action: 'merge' | 'reject') => Promise<{ customersAdded: number; billsAdded: number; }>;
  refreshPendingSyncRequests: () => Promise<void>;
  mergeStaffData: (payload: string) => Promise<{ customersAdded: number; billsAdded: number; }>;
  refreshDataFromAdmin: (silent?: boolean) => Promise<void>;
  forceSaveAdminData: () => Promise<void>;
}

export const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser, tokenResponse, isInitialized: isAuthInitialized, setCurrentUser } = useAuthContext();

  const [inventory, setInventory] = useState<JewelryItem[]>([]);
  const [rawCustomers, setRawCustomers] = useState<Omit<Customer, 'pendingBalance'>[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [adminProfile, setAdminProfile] = useState<{ name: string }>({ name: 'Admin' });

  const [staffChanges, setStaffChanges] = useLocalStorage<{ customers: Omit<Customer, 'pendingBalance'>[]; bills: Bill[] }>('staffChangesCache', { customers: [], bills: [] });
  
  const [driveFileId, setDriveFileId] = useLocalStorage<string | null>('driveFileId', null);
  const [lastSyncedAt, setLastSyncedAt] = useLocalStorage<string | null>('lastSyncedAt', null);
  const [error, setError] = useState<string | null>(null);
  const isInitialLoad = useRef(true);
  const debounceTimer = useRef<number | null>(null);
  const [pendingSyncRequests, setPendingSyncRequests] = useState<StaffSyncRequest[]>([]);
  
  const customers: Customer[] = useMemo(() => {
    const billsByCustomer = new Map<string, Bill[]>();
    bills.forEach(bill => {
        if (!billsByCustomer.has(bill.customerId)) {
            billsByCustomer.set(bill.customerId, []);
        }
        billsByCustomer.get(bill.customerId)!.push(bill);
    });

    return rawCustomers.map(customer => {
        const customerBills = billsByCustomer.get(customer.id) || [];
        const pendingBalance = customerBills.reduce((total, bill) => total + (bill.grandTotal - bill.amountPaid), 0);
        return { ...customer, pendingBalance: pendingBalance < 0.01 ? 0 : pendingBalance };
    });
  }, [rawCustomers, bills]);

  const userNameMap = useMemo(() => {
    const map = new Map<string, string>();
    staff.forEach(s => map.set(s.id, s.name));
    map.set('admin', adminProfile.name || 'Admin');
    return map;
  }, [staff, adminProfile]);

  const refreshPendingSyncRequests = useCallback(async () => {
    if (currentUser?.role !== 'admin') {
      setPendingSyncRequests([]);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('staff_sync_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });
      if (error) throw error;
      setPendingSyncRequests(data || []);
    } catch (e) {
      console.error('Failed to fetch sync requests:', e);
      toast.error('Could not fetch pending staff sync requests.');
    }
  }, [currentUser?.role]);


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

  const loadAndSetData = useCallback((content: any) => {
    // If content has our metadata wrapper, use the data inside. Otherwise, use content directly for backward compatibility.
    const actualData = content?._metadata ? {
        inventory: content.inventory,
        customers: content.customers,
        bills: content.bills,
        staff: content.staff,
        distributors: content.distributors,
        activityLogs: content.activityLogs,
        adminProfile: content.adminProfile,
    } : content;

    const inventoryData = actualData.inventory || [];
    const inventoryMap = new Map(inventoryData.map((item: JewelryItem) => [item.id, item]));

    const migratedBills = (actualData.bills || []).map((bill: Bill) => {
        if (!bill || !Array.isArray(bill.items)) {
            return bill;
        }
        const items = (bill.items || []).map((item: unknown) => {
            if (typeof item !== 'object' || item === null) {
                return item;
            }
            if ('category' in item && typeof (item as { category: unknown }).category === 'string') {
                return item as BillItem;
            }
            let inventoryItem;
            if ('itemId' in item && typeof (item as { itemId: unknown }).itemId === 'string') {
                inventoryItem = inventoryMap.get((item as { itemId: string }).itemId);
            }
            return {
                ...(item as object),
                category: inventoryItem ? inventoryItem.category : 'N/A',
            };
        });
        return { ...bill, items };
    });

    setInventory(inventoryData);
    setRawCustomers(actualData.customers || []);
    setBills(migratedBills);
    setStaff(actualData.staff || []);
    setDistributors(actualData.distributors || []);
    setActivityLogs(actualData.activityLogs || []);
    setAdminProfile(actualData.adminProfile || { name: 'Admin' });
  }, []);

  const uploadMasterData = useCallback(async () => {
    if (currentUser?.role !== 'admin') return;
    
    const lastUpdated = new Date().toISOString();
    const dataToSave = { 
      _metadata: { lastUpdated },
      inventory, customers: rawCustomers, bills, staff, distributors, activityLogs, adminProfile 
    };
    const jsonString = JSON.stringify(dataToSave);

    const { error } = await supabase.storage
        .from('master-data')
        .upload('data.json', jsonString, {
            cacheControl: '0', // No cache to ensure staff always get the latest version
            upsert: true,
            contentType: 'application/json'
        });

    if (error) {
        console.error('Failed to upload master data to Supabase Storage:', error);
        const detailedError = `Failed to save master data. Reason: ${error.message}`;
        toast.error(detailedError);
        throw new Error(detailedError);
    } else {
        console.log('Master data uploaded to storage successfully.');
    }
}, [inventory, rawCustomers, bills, staff, distributors, activityLogs, adminProfile, currentUser?.role]);

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

        // Staff members save their changes to their local cache, not Drive.
        if (currentUser.role === 'staff') {
            const dataToCache = { inventory, customers: rawCustomers, bills, staff, distributors, activityLogs, adminProfile };
            localStorage.setItem('appDataCache', JSON.stringify(dataToCache));
            return;
        }

        if (!driveFileId || !tokenResponse || !tokenResponse.access_token) {
            return;
        }

        if (tokenResponse.expires_at && tokenResponse.expires_at < Date.now()) {
            setError("Cannot save. Ask an admin to log in to refresh the connection.");
            return;
        }

        try {
            const dataToSave = { inventory, customers: rawCustomers, bills, staff, distributors, activityLogs, adminProfile };
            await drive.updateFile(tokenResponse.access_token, driveFileId, dataToSave);
            localStorage.setItem('appDataCache', JSON.stringify(dataToSave));
            if (error) setError(null);

            if (debounceTimer.current) clearTimeout(debounceTimer.current);
            debounceTimer.current = window.setTimeout(() => {
                uploadMasterData().catch(e => console.error("Debounced master data upload failed:", e));
            }, 2000);

        } catch(e) {
            console.error("Failed to save data to drive", e);
            setError("Failed to save data. Please check your connection.");
        }
    };
    
    saveDataToDrive();
    
    return () => {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
    }
  }, [inventory, rawCustomers, bills, staff, distributors, activityLogs, adminProfile, uploadMasterData]);

  const refreshDataFromAdmin = useCallback(async (silent = false) => {
    if (currentUser?.role !== 'staff') return;
    const toastId = silent ? null : toast.loading('Checking for updates...');
    try {
        const { data: fileList, error: listError } = await supabase.storage
            .from('master-data')
            .list('', { search: 'data.json', limit: 1 });

        if (listError || !fileList || fileList.length === 0) {
            console.error("Failed to find master data file:", listError);
            throw new Error('Could not find admin data file. The admin may need to save data first.');
        }
        
        const fileMetadata = fileList[0];
        const newTimestamp = fileMetadata.updated_at;

        if (!newTimestamp) {
          throw new Error("Master data is missing a timestamp. Sync aborted.");
        }

        if (!lastSyncedAt || new Date(newTimestamp) > new Date(lastSyncedAt)) {
            const { data: publicUrlData } = supabase.storage
              .from('master-data')
              .getPublicUrl('data.json');
            
            const url = `${publicUrlData.publicUrl}?t=${new Date().getTime()}`;
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to download data file (status: ${response.status}).`);
            }
            const newData = await response.json();
            
            loadAndSetData(newData);
            localStorage.setItem('appDataCache', JSON.stringify(newData));
            setLastSyncedAt(newTimestamp);
            if (toastId) toast.success('Data refreshed successfully!', { id: toastId });
            else toast.success('Data automatically updated from admin.');
        } else {
            if (toastId) toast.success('You already have the latest data.', { id: toastId });
        }
    } catch (e) {
        const msg = e instanceof Error ? e.message : 'Unknown error';
        if (toastId) toast.error(`Failed to refresh: ${msg}`, { id: toastId });
        else console.error(`Silent refresh failed: ${msg}`);
    }
  }, [currentUser?.role, lastSyncedAt, setLastSyncedAt, loadAndSetData]);


  // Data Loading Effect
  useEffect(() => {
    const initData = async () => {
        isInitialLoad.current = true;
        setError(null);
        
        const localData = localStorage.getItem('appDataCache');
        if (localData) {
            const data = JSON.parse(localData);
            loadAndSetData(data);
        }

        if (currentUser?.role !== 'admin' || !tokenResponse || !tokenResponse.access_token) {
            return;
        }

        try {
            const fileId = await drive.getFileId(tokenResponse.access_token);
            if (fileId) {
                const content = await drive.getFileContent(tokenResponse.access_token, fileId);
                loadAndSetData(content);
                setDriveFileId(fileId);
                localStorage.setItem('appDataCache', JSON.stringify(content));
                setStaffChanges({ customers: [], bills: [] }); // Clear local changes on successful admin sync
            } else {
                const initialState = { inventory: [], customers: [], bills: [], staff: [], distributors: [], activityLogs: [], adminProfile: { name: 'Admin'} };
                const newFileId = await drive.createFile(tokenResponse.access_token, initialState);
                setDriveFileId(newFileId);
                setInventory([]); setRawCustomers([]); setBills([]); setStaff([]); setDistributors([]); setActivityLogs([]); setAdminProfile({ name: 'Admin' });
                localStorage.setItem('appDataCache', JSON.stringify(initialState));
            }
            await refreshPendingSyncRequests();
        } catch (e: any) {
            console.error("Google Drive initialization failed", e);
            setError("Failed to connect to Google Drive. The token might be invalid.");
            setCurrentUser(null);
        }
    };
    if (isAuthInitialized) {
        initData();
    }
  }, [isAuthInitialized, tokenResponse, currentUser?.role, setDriveFileId, setCurrentUser, refreshPendingSyncRequests, loadAndSetData, setStaffChanges]);

   useEffect(() => {
    if (isAuthInitialized && currentUser?.role === 'staff') {
      refreshDataFromAdmin(true);
    }
  }, [isAuthInitialized, currentUser?.role, refreshDataFromAdmin]);

  const applyBillToInventory = useCallback(
    (
      currentInventory: JewelryItem[],
      bill: { items: BillItem[] }
    ): { updatedInventory: JewelryItem[]; errors: string[] } => {
      const inventoryMap = new Map<string, JewelryItem>(
        currentInventory.map((i) => [i.id, { ...i }])
      );
      const newItemsToAdd: JewelryItem[] = [];
      const errors: string[] = [];

      for (const billItem of bill.items) {
        const inventoryItem = inventoryMap.get(billItem.itemId);

        if (!inventoryItem || inventoryItem.quantity < billItem.quantity) {
          errors.push(
            `Not enough stock for ${inventoryItem?.name || billItem.name}.`
          );
          continue;
        }

        if (inventoryItem.quantity === 1) {
          if (billItem.weight > inventoryItem.weight + 0.001) {
            errors.push(
              `Sell weight for ${inventoryItem.name} exceeds stock weight.`
            );
            continue;
          }
          const remainingWeight = inventoryItem.weight - billItem.weight;
          if (remainingWeight < 0.001) {
            inventoryItem.quantity = 0;
            inventoryItem.weight = 0;
          } else {
            inventoryItem.weight = remainingWeight;
          }
        }
        else if (inventoryItem.quantity > 1) {
          inventoryItem.quantity -= billItem.quantity;
          
          const weightDifference = inventoryItem.weight - billItem.weight;

          if (billItem.quantity === 1 && weightDifference > 0.001) {
            const allCurrentItems = [
              ...Array.from(inventoryMap.values()),
              ...newItemsToAdd,
            ];
            const categoryItems = allCurrentItems.filter(
              (i) => i.category === inventoryItem.category
            );
            const maxSerial = Math.max(
              0,
              ...categoryItems.map((i) => {
                const serial = parseInt(i.serialNo, 10);
                return isNaN(serial) ? 0 : serial;
              })
            );
            const newSerialNo = (maxSerial + 1).toString().padStart(5, '0');

            const remnantItem: JewelryItem = {
              ...inventoryItem,
              id: `ITEM-${Date.now()}-${Math.random()
                .toString(36)
                .substr(2, 9)}`,
              serialNo: newSerialNo,
              name: `${inventoryItem.name} (Remnant)`,
              weight: weightDifference,
              quantity: 1,
            };
            newItemsToAdd.push(remnantItem);
          }
        }
        inventoryMap.set(inventoryItem.id, inventoryItem);
      }

      return {
        updatedInventory: [
          ...Array.from(inventoryMap.values()),
          ...newItemsToAdd,
        ],
        errors,
      };
    },
    []
  );
  
  const forceSaveAdminData = async () => {
    if (currentUser?.role !== 'admin') {
        toast.error("Only admins can save data.");
        return;
    }

    const toastId = toast.loading('Saving data & syncing for staff...');

    try {
        // First, save to Google Drive for backup
        if (driveFileId && tokenResponse?.access_token) {
            const dataToSaveForDrive = { inventory, customers: rawCustomers, bills, staff, distributors, activityLogs, adminProfile };
            await drive.updateFile(tokenResponse.access_token, driveFileId, dataToSaveForDrive);
            localStorage.setItem('appDataCache', JSON.stringify(dataToSaveForDrive));
        } else {
            throw new Error('Google Drive connection not found.');
        }

        // Then, save to Supabase Storage for staff sync
        await uploadMasterData();
        toast.success('Data saved and available for staff to sync.', { id: toastId });
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
        toast.error(`Save failed: ${errorMessage}`, { id: toastId });
    }
  };

  const getNextCustomerId = () => {
      const allCustomers = [...rawCustomers, ...staffChanges.customers];
      return `DJ${(allCustomers.length + 1).toString().padStart(5, '0')}`;
  }
  
  const updateAdminName = async (name: string) => {
    if (currentUser?.role !== 'admin') throw new Error("Permission denied");
    setAdminProfile({ name });
    logActivity(`Updated admin display name to: ${name}`);
  };

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

  const updateInventoryItem = async (itemId: string, updates: Partial<Omit<JewelryItem, 'id' | 'serialNo' | 'dateAdded'>>) => {
    if (currentUser?.role !== 'admin') throw new Error("Permission denied");

    setInventory(prev =>
      prev.map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, ...updates };
          logActivity(`Updated inventory item: ${updatedItem.name} (S/N: ${updatedItem.serialNo}).`);
          return updatedItem;
        }
        return item;
      })
    );
  };
  
  const deleteInventoryItem = async (itemId: string) => {
    if (currentUser?.role !== 'admin') throw new Error("Permission denied");
    const itemToDelete = inventory.find(i => i.id === itemId);
    setInventory(prev => prev.filter(item => item.id !== itemId));
    if (itemToDelete) logActivity(`Deleted inventory item: ${itemToDelete.name}`);
  };

  const addCustomer = async (customer: Omit<Customer, 'id' | 'joinDate' | 'createdBy' | 'pendingBalance'>) => {
    if (!currentUser) throw new Error("User not logged in");
    const newCustomer: Omit<Customer, 'pendingBalance'> = {
      ...customer, id: getNextCustomerId(), joinDate: new Date().toISOString(), createdBy: currentUser.id,
    };
    if (currentUser.role === 'staff') {
        setStaffChanges(prev => ({ ...prev, customers: [...prev.customers, newCustomer] }));
    }
    setRawCustomers(prev => [...prev, newCustomer]);
    logActivity(`Added new customer: ${newCustomer.name}`);
  };
  
  const deleteCustomer = async (customerId: string) => {
    if (currentUser?.role !== 'admin') throw new Error("Permission denied");
    const customerToDelete = rawCustomers.find(c => c.id === customerId);
    setRawCustomers(prev => prev.filter(c => c.id !== customerId));
    setBills(prev => prev.filter(b => b.customerId !== customerId));
    if (customerToDelete) logActivity(`Deleted customer: ${customerToDelete.name}`);
  };

  const createBill = async (billData: Omit<Bill, 'id' | 'date' | 'customerName' | 'finalAmount' | 'netWeight' | 'makingChargeAmount' | 'wastageAmount' | 'sgstAmount' | 'cgstAmount' | 'grandTotal' | 'createdBy'>): Promise<Bill> => {
    if (!currentUser) throw new Error("User not logged in");
    const totalGrossWeight = billData.items.reduce((sum, item) => sum + (item.weight * item.quantity), 0);
    const subtotalBeforeLessWeight = billData.totalAmount; 
    const averageRatePerGram = totalGrossWeight > 0 ? subtotalBeforeLessWeight / totalGrossWeight : 0;
    const lessWeightValue = billData.lessWeight * averageRatePerGram;
    const finalAmount = subtotalBeforeLessWeight - lessWeightValue;
    const makingChargeAmount = finalAmount * (billData.makingChargePercentage / 100);
    const wastageAmount = finalAmount * (billData.wastagePercentage / 100);

    const taxableAmount = finalAmount + makingChargeAmount + wastageAmount;
    const sgstAmount = taxableAmount * (billData.sgstPercentage / 100);
    const cgstAmount = taxableAmount * (billData.cgstPercentage / 100);
    const grandTotal = taxableAmount + sgstAmount + cgstAmount - billData.bargainedAmount;
    
    const amountPaid = billData.amountPaid;
    const netWeight = totalGrossWeight - billData.lessWeight;
    const customer = customers.find(c => c.id === billData.customerId);
    if(!customer) throw new Error("Customer not found");
    
    const today = new Date();
    const datePrefix = `${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}`;
    const todayISO = today.toISOString().slice(0, 10);

    const allBills = [...bills, ...staffChanges.bills];
    const todaysBills = allBills.filter(bill => new Date(bill.date).toISOString().slice(0, 10) === todayISO);

    const maxSeq = todaysBills.reduce((max, bill) => {
        if (bill.id.startsWith(datePrefix)) {
            const seq = parseInt(bill.id.slice(8), 10);
            if (!isNaN(seq)) {
               return Math.max(max, seq);
            }
        }
        return max;
    }, 0);

    const nextSeq = (maxSeq + 1).toString().padStart(3, '0');
    const newBillId = `${datePrefix}${nextSeq}`;

    const newBill: Bill = {
      ...billData, id: newBillId, customerName: customer.name, finalAmount, netWeight, makingChargeAmount, wastageAmount, sgstAmount, cgstAmount, grandTotal, amountPaid, date: new Date().toISOString(), createdBy: currentUser.id,
    };

    setInventory(prevInventory => {
      const { updatedInventory, errors } = applyBillToInventory(prevInventory, newBill);
      if (errors.length > 0) {
        toast.error(errors.join('\n'));
      }
      return updatedInventory;
    });

    if (currentUser.role === 'staff') {
        setStaffChanges(prev => ({ ...prev, bills: [...prev.bills, newBill] }));
    }
    
    setBills(prev => [...prev, newBill]);
    logActivity(`Created ${newBill.type} for ${customer.name} (Total: ₹${grandTotal.toFixed(2)})`);
    return newBill;
  };

  const recordPaymentForBill = async (billId: string, amount: number) => {
    if (!currentUser) throw new Error("User not logged in");

    setBills(prevBills => {
        return prevBills.map(bill => {
            if (bill.id === billId) {
                const due = bill.grandTotal - bill.amountPaid;
                if (amount > due + 0.01) { 
                    toast.error(`Payment cannot exceed the due amount of ${due.toFixed(2)}.`);
                    return bill;
                }
                const newAmountPaid = bill.amountPaid + amount;
                const customer = customers.find(c => c.id === bill.customerId);
                logActivity(`Recorded payment of ₹${amount.toLocaleString('en-IN')} for ${customer?.name} (Bill: ${bill.id})`);
                return { ...bill, amountPaid: newAmountPaid };
            }
            return bill;
        });
    });
  };
  
  const recordPayment = async (customerId: string, amount: number) => {
    if (!currentUser) throw new Error("User not logged in");

    setBills(prevBills => {
        let amountToApply = amount;

        const unpaidBillIds = prevBills
            .filter(b => b.customerId === customerId && (b.grandTotal - b.amountPaid) > 0.01)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map(b => b.id);

        const newBills = prevBills.map(bill => {
            if (unpaidBillIds.includes(bill.id) && amountToApply > 0.01) {
                const due = bill.grandTotal - bill.amountPaid;
                const paymentForThisBill = Math.min(amountToApply, due);
                amountToApply -= paymentForThisBill;
                return { ...bill, amountPaid: bill.amountPaid + paymentForThisBill };
            }
            return bill;
        });

        if (amountToApply > 0.01) {
            toast.error(`Overpayment of ₹${amountToApply.toFixed(2)} could not be applied as all dues are cleared.`);
        }
        
        const customer = rawCustomers.find(c => c.id === customerId);
        logActivity(`Recorded payment of ₹${amount.toLocaleString('en-IN')} for ${customer?.name} clearing outstanding dues.`);

        return newBills;
    });
  };

  const resetTransactions = async () => {
    if (currentUser?.role !== 'admin') throw new Error("Permission denied");
    setBills([]);
    logActivity('Reset all transaction data.');
  };

  const addStaff = async (newStaff: Omit<Staff, 'passwordHash'>, password: string) => {
    if (currentUser?.role !== 'admin') throw new Error("Permission denied");
    const trimmedId = newStaff.id.trim();
    if (!trimmedId) throw new Error("Staff ID cannot be empty.");

    if (staff.some(s => s.id.toLowerCase() === trimmedId.toLowerCase())) {
        throw new Error("Staff ID already exists.");
    }

    const passwordHash = await hashPassword(password);
    const staffMember: Staff = { ...newStaff, id: trimmedId, passwordHash };
    setStaff(prev => [...prev, staffMember]);
    logActivity(`Added new staff member: ${staffMember.name} (${staffMember.id})`);
  };

  const updateStaff = async (staffId: string, newDetails: { id: string; name: string; password?: string }) => {
    if (currentUser?.role !== 'admin') throw new Error("Permission denied");

    if (newDetails.id !== staffId && staff.some(s => s.id === newDetails.id)) {
        throw new Error(`Staff ID "${newDetails.id}" is already in use.`);
    }

    let newPasswordHash: string | undefined;
    if (newDetails.password) {
        newPasswordHash = await hashPassword(newDetails.password);
    }

    setStaff(prev => {
        return prev.map(s => {
            if (s.id === staffId) {
                return {
                    id: newDetails.id,
                    name: newDetails.name,
                    passwordHash: newPasswordHash || s.passwordHash,
                };
            }
            return s;
        });
    });

    logActivity(`Updated details for staff member: ${newDetails.name} (${newDetails.id})`);
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
  
  const getSyncDataPayload = (): string => {
    if (currentUser?.role !== 'admin') {
      throw new Error("Only an admin can create a sync session.");
    }
    const dataPayload = { inventory, customers: rawCustomers, bills, staff, distributors, adminProfile };
    const jsonString = JSON.stringify(dataPayload);
    try {
        return btoa(jsonString);
    } catch(e) {
        console.error("Encoding failed", e);
        return "";
    }
  };

  const getStaffChangesPayload = (): { payload: string; changesCount: number } => {
    if (currentUser?.role !== 'staff') {
      throw new Error("Only staff can generate a changes payload.");
    }
    const changesCount = staffChanges.customers.length + staffChanges.bills.length;
    const jsonString = JSON.stringify(staffChanges);
    try {
        return { payload: btoa(jsonString), changesCount };
    } catch(e) {
        console.error("Encoding failed", e);
        return { payload: "", changesCount: 0 };
    }
  };

  const clearStaffChanges = () => {
    if (currentUser?.role === 'staff') {
        setStaffChanges({ customers: [], bills: [] });
    }
  };

  const mergeStaffData = async (payload: string): Promise<{ customersAdded: number; billsAdded: number }> => {
    if (currentUser?.role !== 'admin') throw new Error("Permission denied");
    
    const jsonString = atob(payload);
    const changes = JSON.parse(jsonString);
    
    const newCustomers: Omit<Customer, 'pendingBalance'>[] = changes.customers || [];
    const newBills: Bill[] = changes.bills || [];

    const uniqueNewCustomers = newCustomers.filter((c) => !rawCustomers.some(rc => rc.id === c.id || rc.phone === c.phone));
    setRawCustomers(prev => [...prev, ...uniqueNewCustomers]);

    const uniqueNewBills = newBills.filter((b) => !bills.some(rb => rb.id === b.id));
    setBills(prev => [...prev, ...uniqueNewBills].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    
    setInventory(prevInventory => {
      let currentInventory = [...prevInventory];
      for (const bill of uniqueNewBills) {
        if (bill.type === BillType.INVOICE || bill.type === BillType.ESTIMATE) { // Deduct inventory for invoices and estimates from staff
            const { updatedInventory: nextInventoryState, errors } = applyBillToInventory(
                currentInventory,
                bill
            );
            if (errors.length > 0) {
                toast.error(
                    `Inventory merge conflict for staff bill ${bill.id}: ${errors.join(
                        ', '
                    )}. Inventory may be inaccurate.`
                );
            }
            currentInventory = nextInventoryState;
        }
      }
      return currentInventory;
    });

    logActivity(`Merged data from staff: ${uniqueNewCustomers.length} customers, ${uniqueNewBills.length} bills.`);
    return { customersAdded: uniqueNewCustomers.length, billsAdded: uniqueNewBills.length };
  };

  const processSyncRequest = async (requestId: number, payload: string, action: 'merge' | 'reject'): Promise<{ customersAdded: number; billsAdded: number; }> => {
    if (currentUser?.role !== 'admin') throw new Error("Permission denied");
    
    let result = { customersAdded: 0, billsAdded: 0 };
    if (action === 'merge') {
        result = await mergeStaffData(payload);
    }

    const newStatus = action === 'merge' ? 'merged' : 'rejected';
    const { error } = await supabase
        .from('staff_sync_requests')
        .update({ status: newStatus })
        .eq('id', requestId);
    
    if (error) {
        console.error("Failed to update sync request status:", error);
        toast.error("Data was processed but failed to update sync status. Please check for duplicates.");
        throw new Error("Failed to update sync request status.");
    }
    
    refreshPendingSyncRequests();
    
    return result;
  };

  const getCustomerById = (id: string) => customers.find(c => c.id === id);
  const getBillsByCustomerId = (id: string) => bills.filter(b => b.customerId === id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const getInventoryItemById = (id: string) => inventory.find(i => i.id === id);

  return (
    <DataContext.Provider value={{ inventory, customers, rawCustomers, bills, staff, distributors, activityLogs, adminProfile, userNameMap, updateAdminName, addInventoryItem, updateInventoryItem, deleteInventoryItem, addCustomer, deleteCustomer, createBill, getCustomerById, getBillsByCustomerId, getInventoryItemById, getNextCustomerId, resetTransactions, addStaff, updateStaff, deleteStaff, addDistributor, deleteDistributor, recordPaymentForBill, recordPayment, getSyncDataPayload, getStaffChangesPayload, clearStaffChanges, pendingSyncRequests, processSyncRequest, refreshPendingSyncRequests, mergeStaffData, refreshDataFromAdmin, forceSaveAdminData }}>
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