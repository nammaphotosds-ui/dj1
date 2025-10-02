import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useDataContext } from '../../context/DataContext';

const AddCustomerForm: React.FC<{onClose: () => void}> = ({ onClose }) => {
    const { addCustomer } = useDataContext();
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [dob, setDob] = useState('');
    const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !phone) {
            return;
        }
        setSubmissionStatus('saving');
        try {
            await addCustomer({
                name,
                phone,
                dob: dob || undefined,
            });
            setSubmissionStatus('saved');
            toast.success('Customer added successfully!');
            setTimeout(() => {
                onClose();
            }, 1000);
        } catch (error) {
            console.error("Failed to add customer:", error);
            toast.error("An error occurred while saving the customer. Please check your connection and try again.");
            setSubmissionStatus('idle');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" placeholder="Customer Name" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border rounded" required />
            <input type="tel" placeholder="Phone Number" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-2 border rounded" required />
            <div>
                <label htmlFor="dob" className="block text-sm font-medium text-gray-700">Date of Birth (Optional)</label>
                <input type="date" id="dob" value={dob} onChange={e => setDob(e.target.value)} className="w-full p-2 border rounded mt-1" />
            </div>
            <button
                type="submit"
                disabled={submissionStatus !== 'idle'}
                className={`w-full p-3 rounded-lg font-semibold transition ${
                    submissionStatus === 'saved'
                        ? 'bg-green-600 text-white'
                        : submissionStatus === 'saving'
                        ? 'bg-gray-400 text-white opacity-70'
                        : 'bg-brand-gold text-brand-charcoal hover:bg-brand-gold-dark'
                }`}
            >
              {submissionStatus === 'saving' ? 'Saving...' : submissionStatus === 'saved' ? 'Saved!' : 'Add Customer'}
            </button>
        </form>
    );
};

export default AddCustomerForm;