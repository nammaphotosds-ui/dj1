export enum JewelryCategory {
  GOLD = 'Gold',
  SILVER = 'Silver',
  PLATINUM = 'Platinum',
}

export interface JewelryItem {
  id: string;
  name: string;
  category: string;
  serialNo: string;
  weight: number;
  purity: number;
  quantity: number;
  dateAdded: string;
  distributorId: string;
}

export interface Customer {
  id:string;
  name: string;
  phone: string;
  joinDate: string;
  dob?: string;
  createdBy: string; // 'admin' or staff ID
  // FIX: Added pendingBalance to track outstanding amounts.
  pendingBalance: number;
}

export interface BillItem {
  itemId: string;
  serialNo: string;
  name: string;
  category: string;
  weight: number;
  price: number;
  quantity: number;
}

export enum BillType {
  ESTIMATE = 'ESTIMATE',
  INVOICE = 'INVOICE',
}

export interface Bill {
  id: string;
  customerId: string;
  customerName: string;
  type: BillType;
  items: BillItem[];
  totalAmount: number; // Subtotal of items
  bargainedAmount: number; // Discount
  finalAmount: number; // totalAmount - lessWeightValue
  lessWeight: number;
  netWeight: number;
  makingChargePercentage: number;
  wastagePercentage: number;
  makingChargeAmount: number;
  wastageAmount: number;
  sgstPercentage: number;
  cgstPercentage: number;
  sgstAmount: number;
  cgstAmount: number;
  grandTotal: number; // finalAmount + makingChargeAmount + wastageAmount + sgstAmount + cgstAmount - bargainedAmount
  amountPaid: number; // Should be equal to grandTotal
  date: string;
  createdBy: string; // 'admin' or staff ID
}

export interface Staff {
  id: string; // User-facing ID, e.g., "staff01"
  name: string;
  passwordHash: string; // Store a hash of the password
}

export interface Distributor {
  id: string;
  name: string;
}

export interface ActivityLog {
    id: string;
    timestamp: string;
    userId: string;
    message: string;
}


export type Page = 'DASHBOARD' | 'INVENTORY' | 'CUSTOMERS' | 'BILLING' | 'SETTINGS' | 'REPORTS' | 'STAFF_MANAGEMENT' | 'DISTRIBUTOR_MANAGEMENT';

export interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  expires_at?: number;
}

export type CurrentUser = {
  role: 'admin' | 'staff';
  id: string; // 'admin' for admin, staff ID for staff
};

export interface StaffSyncRequest {
  id: number;
  created_at: string;
  staff_id: string;
  staff_name: string;
  data_payload: string;
  status: 'pending' | 'merged' | 'rejected';
  changes_count: number;
}