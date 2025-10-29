// FIX: Replaced 'import React from "react"' with a side-effect import 'import "react"' and specific type imports. The side-effect import guarantees that React's global JSX typings are loaded before the augmentation happens, which fixes widespread 'Property does not exist on type JSX.IntrinsicElements' errors. The previous full import was likely being optimized away by the compiler because it was only used for type information, causing the 'dotlottie-wc' augmentation to overwrite the intrinsic elements instead of merging with them.
import 'react';
import type { DetailedHTMLProps, HTMLAttributes, CSSProperties } from 'react';

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
  oldItemBalance: number;
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
  grandTotal: number; // finalAmount + makingChargeAmount + wastageAmount + sgstAmount + cgstAmount - bargainedAmount - oldItemBalance
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

// FIX: Added global declaration for 'dotlottie-wc' to be available across the application.
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'dotlottie-wc': DetailedHTMLProps<HTMLAttributes<HTMLElement> & { src: string; autoplay?: boolean; loop?: boolean; style?: CSSProperties }, HTMLElement>;
    }
  }
}
