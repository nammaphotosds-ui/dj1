import React, { useState } from 'react';
import { toast } from '../../utils/toast';
import { useDataContext } from '../../context/DataContext';
import type { Staff } from '../../types';

interface EditStaffFormProps {
    staffMember: Staff;
    onClose: () => void;
}

const EditStaffForm: React.FC<EditStaffFormProps> = ({ staffMember, onClose }) => {
    const { updateStaff } = useDataContext();
    const [name, setName] = useState(staffMember.name);
    const [staffId, setStaffId] = useState(staffMember.id);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !staffId) {
            setError("Name and Staff ID are required.");
            return;
        }
        setError('');
        setIsSaving(true);
        try {
            await updateStaff(staffMember.id, { 
                id: staffId, 
                name, 
                ...(password && { password })
            });
            toast.success('Staff details updated successfully!');
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
            <div>
                <label htmlFor="edit-staff-name" className="block text-sm font-medium text-gray-700">Full Name</label>
                <input id="edit-staff-name" type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border rounded mt-1" required />
            </div>
             <div>
                <label htmlFor="edit-staff-id" className="block text-sm font-medium text-gray-700">Staff ID</label>
                <input id="edit-staff-id" type="text" value={staffId} onChange={e => setStaffId(e.target.value)} className="w-full p-2 border rounded mt-1" required />
            </div>
             <div>
                <label htmlFor="edit-staff-pass" className="block text-sm font-medium text-gray-700">New Password</label>
                <input id="edit-staff-pass" type="password" placeholder="Leave blank to keep unchanged" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-2 border rounded mt-1" />
            </div>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <button type="submit" disabled={isSaving} className="w-full p-3 bg-brand-gold text-brand-charcoal rounded-lg font-semibold hover:bg-brand-gold-dark transition disabled:opacity-70">
                {isSaving ? 'Saving...' : 'Update Staff'}
            </button>
        </form>
    );
};

export default EditStaffForm;