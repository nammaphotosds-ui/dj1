import React, { useState } from 'react';
import { useDataContext } from '../context/DataContext';
import type { Customer } from '../types';
import Avatar from './common/Avatar';
import Modal from './common/Modal';
import RecordPaymentForm from './forms/RecordPaymentForm';


const PendingPaymentDetailsView: React.FC<{
    customer: Customer;
    onBack: () => void;
    onDelete: () => Promise<void>;
}> = ({ customer, onBack, onDelete }) => {
    const { recordPayment } = useDataContext(); 
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    
    const handleDelete = async () => {
        if (window.confirm(`Are you sure you want to delete ${customer.name}? This will remove the customer and all their transaction history.`)) {
            setIsDeleting(true);
            await onDelete();
            setIsDeleting(false);
            onBack();
        }
    };

    return (
        <div>
            <button onClick={onBack} className="flex items-center text-gray-600 hover:text-brand-charcoal transition mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                Back to Pending List
            </button>
            <div className="bg-white p-6 rounded-lg shadow-md border text-center">
                 <Avatar name={customer.name} className="w-24 h-24 mx-auto !text-5xl border-4 border-red-200" />
                 <h2 className="text-3xl font-bold font-serif text-brand-charcoal mt-4">{customer.name}</h2>
                 <p className="text-gray-600 mt-1">{customer.phone}</p>
                 <p className="font-mono text-sm text-gray-500">{customer.id}</p>

                 <div className="mt-6 bg-red-50 p-6 rounded-lg">
                    <p className="text-sm font-semibold text-red-700 uppercase">Pending Balance</p>
                    <p className="text-5xl font-bold text-red-600 my-2">₹{customer.pendingBalance.toLocaleString('en-IN')}</p>
                 </div>

                 <div className="mt-6 flex flex-col md:flex-row justify-center gap-4">
                     <button onClick={() => setIsPaymentModalOpen(true)} disabled={isDeleting} className="w-full md:w-auto bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition flex items-center justify-center shadow-md disabled:bg-gray-400">
                         <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                         Record Payment
                     </button>
                     <button onClick={handleDelete} disabled={isDeleting} className="w-full md:w-auto bg-red-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-red-700 transition flex items-center justify-center shadow-md disabled:bg-gray-400">
                         <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                         {isDeleting ? 'Deleting...' : 'Delete Customer'}
                     </button>
                 </div>
            </div>
             <Modal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                title={`Record Payment for ${customer.name}`}
            >
                <RecordPaymentForm 
                    customer={customer}
                    onClose={() => setIsPaymentModalOpen(false)}
                    onSuccess={() => {
                        // If balance is cleared, go back to the list
                        if (customer.pendingBalance <= 0) {
                            onBack();
                        }
                    }}
                />
            </Modal>
        </div>
    );
};


const PendingPaymentsPage: React.FC = () => {
  const { customers, deleteCustomer } = useDataContext();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const customersWithPendingBalance = customers
    .filter(customer => customer.pendingBalance >= 1)
    .sort((a, b) => b.pendingBalance - a.pendingBalance);
    
  if (selectedCustomer) {
      const customerDetails = customers.find(c => c.id === selectedCustomer.id);
      if (customerDetails) {
          return <PendingPaymentDetailsView
                    customer={customerDetails}
                    onBack={() => setSelectedCustomer(null)}
                    onDelete={() => deleteCustomer(customerDetails.id)}
                 />
      }
  }

  return (
    <div>
        {/* Desktop Table View */}
        <div className="hidden md:block bg-white p-6 rounded-lg shadow-md">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b">
                            <th className="p-4">Customer</th>
                            <th className="p-4">Phone</th>
                            <th className="p-4 text-right">Pending Amount (₹)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {customersWithPendingBalance.map((customer) => (
                            <tr key={customer.id} onClick={() => setSelectedCustomer(customer)} className="border-b hover:bg-gray-50 cursor-pointer">
                                <td className="p-4">
                                    <div className="flex items-center">
                                        <Avatar name={customer.name} className="w-10 h-10 mr-4"/>
                                        <div>
                                            <p className="font-semibold">{customer.name}</p>
                                            <p className="text-xs font-mono text-gray-500">{customer.id}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">{customer.phone}</td>
                                <td className="p-4 text-right font-bold text-red-600">
                                    {customer.pendingBalance.toLocaleString('en-IN')}
                                </td>
                            </tr>
                        ))}
                         {customersWithPendingBalance.length === 0 && (
                            <tr>
                                <td colSpan={4} className="text-center p-8 text-gray-500">No pending payments. Well done!</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
            {customersWithPendingBalance.map((customer) => (
                <div key={customer.id} onClick={() => setSelectedCustomer(customer)} className="bg-white p-4 rounded-lg shadow-md border active:scale-95 transition-transform cursor-pointer">
                    <div className="flex items-center">
                         <Avatar name={customer.name} className="w-12 h-12 mr-4"/>
                         <div className="flex-1">
                            <p className="font-bold text-lg">{customer.name}</p>
                            <p className="text-sm text-gray-500">{customer.phone}</p>
                         </div>
                         <div className="text-right">
                             <p className="text-xs text-red-500">Pending</p>
                             <p className="font-bold text-lg text-red-600">
                                ₹{customer.pendingBalance.toLocaleString('en-IN')}
                            </p>
                        </div>
                    </div>
                </div>
            ))}
            {customersWithPendingBalance.length === 0 && (
                <div className="text-center p-16 bg-white rounded-lg shadow-md">
                    <p className="text-gray-500">No pending payments. Well done!</p>
                </div>
            )}
        </div>
    </div>
  );
};

export default PendingPaymentsPage;