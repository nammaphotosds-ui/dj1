import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useDataContext } from '../../context/DataContext';

const AddStaffForm: React.FC<{onClose: () => void}> = ({ onClose }) => {
    const { addStaff } = useDataContext();
    const [name, setName] = useState('');
    const [staffId, setStaffId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !staffId || !password) {
            setError("All fields are required.");
            return;
        }
        setError('');
        setIsSaving(true);
        try {
            await addStaff({ id: staffId, name }, password);
            toast.success('Staff added successfully!');
            onClose();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border rounded" required />
            <input type="text" placeholder="Staff ID (e.g., staff01)" value={staffId} onChange={e => setStaffId(e.target.value)} className="w-full p-2 border rounded" required />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-2 border rounded" required />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button type="submit" disabled={isSaving} className="w-full p-3 bg-brand-gold text-brand-charcoal rounded-lg font-semibold hover:bg-brand-gold-dark transition disabled:opacity-70">
                {isSaving ? 'Saving...' : 'Add Staff'}
            </button>
        </form>
    );
};

export default AddStaffForm;