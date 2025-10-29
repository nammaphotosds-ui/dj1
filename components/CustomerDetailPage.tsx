import React from 'react';
import { useDataContext } from '../context/DataContext';
import type { Customer, Bill, BillItem } from '../types';
import Avatar from './common/Avatar';

const BillListItem: React.FC<{ bill: Bill }> = ({ bill }) => {
    const formatItemSummary = (items: BillItem[]) => {
        const summary: Record<string, number> = {};
        items.forEach(item => {
            if (!summary[item.category]) {
                summary[item.category] = 0;
            }
            summary[item.category] += item.weight * item.quantity;
        });
        
        if (Object.keys(summary).length === 0) return <span className="text-gray-500">-</span>;

        return Object.entries(summary).map(([category, weight]) => (
            <span key={category} className="mr-2 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700 whitespace-nowrap">
                {category}: <span className="font-semibold">{weight.toFixed(4)}g</span>
            </span>
        ));
    };
    
    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border transition-shadow hover:shadow-md">
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-mono text-sm text-brand-charcoal">{bill.id}</p>
                    <p className="text-xs text-gray-500">{new Date(bill.date).toLocaleString()}</p>
                </div>
                <div className="text-right">
                    <p className="font-bold text-lg text-brand-charcoal">₹{bill.grandTotal.toLocaleString('en-IN')}</p>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${
                        bill.type === 'INVOICE' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                        {bill.type.toLowerCase()}
                    </span>
                </div>
            </div>
            <div className="mt-2 pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Items:</p>
                {formatItemSummary(bill.items)}
            </div>
        </div>
    );
};

const CustomerDetailPage: React.FC<{ customerId: string; onBack: () => void; }> = ({ customerId, onBack }) => {
    const { getCustomerById, getBillsByCustomerId } = useDataContext();
    const customer = getCustomerById(customerId);
    const bills = getBillsByCustomerId(customerId);

    if (!customer) {
        return (
            <div className="text-center py-10">
                <p className="text-red-500">Customer not found.</p>
                <button onClick={onBack} className="mt-4 bg-brand-gold text-brand-charcoal px-4 py-2 rounded-lg font-semibold">
                    Back to List
                </button>
            </div>
        );
    }
    
    return (
        <div className="animate-fade-in-up">
            <div className="mb-6">
                <button onClick={onBack} className="flex items-center text-sm text-gray-600 hover:text-brand-charcoal">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                    Back to Customer List
                </button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border mb-6">
                <div className="flex items-center">
                    <Avatar name={customer.name} className="w-16 h-16 text-2xl mr-4 flex-shrink-0" />
                    <div className="flex-grow">
                        <h1 className="text-2xl font-bold text-brand-charcoal">{customer.name}</h1>
                        <p className="text-gray-600">{customer.phone}</p>
                        <p className="text-xs text-gray-500 mt-1">Joined on {new Date(customer.joinDate).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                        <p className="text-sm text-gray-500">Pending Balance</p>
                        <p className={`text-2xl font-bold ${customer.pendingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                             ₹{customer.pendingBalance.toLocaleString('en-IN')}
                        </p>
                    </div>
                </div>
            </div>

            <h2 className="text-xl font-bold mb-4">Transaction History</h2>
            <div className="space-y-3">
                {bills.length > 0 ? (
                    bills.map(bill => <BillListItem key={bill.id} bill={bill} />)
                ) : (
                    <div className="text-center py-16 bg-white rounded-lg shadow-sm border">
                        <p className="text-gray-500">No transactions found for this customer.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomerDetailPage;