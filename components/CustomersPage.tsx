import React, { useState, useMemo } from 'react';
import { useDataContext } from '../context/DataContext';
import { useUIContext } from '../context/UIContext';
import type { Customer } from '../types';
import Avatar from './common/Avatar';

// Simplified CustomerListItem for display
const CustomerListItem: React.FC<{ customer: Customer }> = ({ customer }) => {
    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border flex items-center justify-between transition-shadow hover:shadow-md">
            <div className="flex items-center">
                <Avatar name={customer.name} className="w-12 h-12 text-lg mr-4" />
                <div>
                    <p className="font-bold text-brand-charcoal">{customer.name}</p>
                    <p className="text-sm text-gray-600">{customer.phone}</p>
                </div>
            </div>
            <div>
                <p className="text-sm text-gray-500">Balance</p>
                <p className={`font-semibold text-right ${customer.pendingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ₹{customer.pendingBalance.toLocaleString('en-IN')}
                </p>
            </div>
        </div>
    );
};

export const CustomersPage: React.FC = () => {
    const { customers } = useDataContext();
    const { openAddCustomerModal } = useUIContext();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredCustomers = useMemo(() => {
        return customers.filter(c =>
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.phone.includes(searchTerm)
        ).sort((a,b) => a.name.localeCompare(b.name));
    }, [customers, searchTerm]);

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
                <input
                    type="text"
                    placeholder="Search customers by name or phone..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full md:w-1/2 p-2 border rounded-lg"
                />
                <button onClick={openAddCustomerModal} className="bg-brand-gold text-brand-charcoal px-6 py-2 rounded-lg font-semibold hover:bg-brand-gold-dark transition items-center shadow-md whitespace-nowrap">
                    Add New Customer
                </button>
            </div>
            <div className="space-y-3">
                {filteredCustomers.length > 0 ? (
                    filteredCustomers.map(customer => (
                        <CustomerListItem key={customer.id} customer={customer} />
                    ))
                ) : (
                    <div className="text-center py-16 bg-white rounded-lg shadow-md">
                        <p className="text-gray-500">No customers found.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
