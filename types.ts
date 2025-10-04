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
  password: string; // Store raw password
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

// FIX: Add StaffSyncRequest interface to resolve import error. This type defines the shape of sync requests from staff members.
export interface StaffSyncRequest {
    id: number;
    staff_id: string;
    staff_name: string;
    data_payload: string;
    changes_count: number;
    status: 'pending' | 'merged' | 'rejected';
    created_at: string;
}


export type Page = 'DASHBOARD' | 'INVENTORY' | 'CUSTOMERS' | 'BILLING' | 'SETTINGS' | 'REPORTS' | 'STAFF_MANAGEMENT' | 'DISTRIBUTOR_MANAGEMENT';

// FIX: Extracted UserRole to be used for role definitions and to be imported in LoginFlow.tsx
export type UserRole = 'admin' | 'staff';

export type CurrentUser = {
  role: UserRole;
  id: string; // 'admin' for admin, staff ID for staff
};
// FIX: Centralized the global declaration for 'dotlottie-wc' to fix TypeScript JSX parser errors across the application.
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'dotlottie-wc': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { src: string; autoplay?: boolean; loop?: boolean; style?: React.CSSProperties }, HTMLElement>;
    }
  }
}
