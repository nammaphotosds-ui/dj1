import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useDataContext } from '../../context/DataContext';
import type { Customer } from '../../types';

interface RecordPaymentFormProps {
    customer: Customer;
    onClose: () => void;
    onSuccess: () => void;
}

const RecordPaymentForm: React.FC<RecordPaymentFormProps> = ({ customer, onClose, onSuccess }) => {
    const { recordPayment } = useDataContext();
    const [amount, setAmount] = useState(customer.pendingBalance.toString());
    const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

    useEffect(() => {
        setAmount(customer.pendingBalance.toString());
        setSubmissionStatus('idle');
    }, [customer]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const paymentAmount = parseFloat(amount);
        if (isNaN(paymentAmount) || paymentAmount <= 0 || paymentAmount > customer.pendingBalance) {
            toast.error('Please enter a valid amount greater than zero and not exceeding the pending balance.');
            return;
        }
        setSubmissionStatus('saving');
        try {
            await recordPayment(customer.id, paymentAmount);
            setSubmissionStatus('saved');
            toast.success('Payment recorded successfully!');
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 1000);
        } catch (error) {
            console.error("Failed to record payment:", error);
            toast.error("An error occurred while recording the payment. Please try again.");
            setSubmissionStatus('idle');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="paymentAmount" className="block text-sm font-medium text-gray-700">Payment Amount (₹)</label>
                <input
                    type="number"
                    id="paymentAmount"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm text-lg"
                    step="0.01"
                    max={customer.pendingBalance}
                    required
                    autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">Total pending: ₹{customer.pendingBalance.toLocaleString('en-IN')}</p>
            </div>
            <div className="flex justify-end gap-3">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button>
                <button type="submit" disabled={submissionStatus !== 'idle'} className="px-6 py-2 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:opacity-70">
                    {submissionStatus === 'saving' ? 'Saving...' : submissionStatus === 'saved' ? 'Saved!' : 'Submit'}
                </button>
            </div>
        </form>
    );
};

export default RecordPaymentForm;