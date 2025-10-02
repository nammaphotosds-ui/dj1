import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useDataContext } from '../../context/DataContext';

const AddDistributorForm: React.FC<{onClose: () => void}> = ({ onClose }) => {
    const { addDistributor } = useDataContext();
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSaving(true);
        try {
            await addDistributor({ name });
            toast.success('Distributor added successfully!');
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
            <input type="text" placeholder="Distributor Name" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border rounded" required />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button type="submit" disabled={isSaving} className="w-full p-3 bg-brand-gold text-brand-charcoal rounded-lg font-semibold hover:bg-brand-gold-dark transition disabled:opacity-70">
                {isSaving ? 'Saving...' : 'Add Distributor'}
            </button>
        </form>
    );
};

export default AddDistributorForm;