import React, { useState, useEffect } from 'react';
import { toast } from '../utils/toast';
import { useDataContext } from '../context/DataContext';
import { useAuthContext } from '../context/AuthContext';

const AdminPinManagement: React.FC = () => {
    const { updateAdminPin, resetAdminPin } = useAuthContext();
    const [newPin, setNewPin] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handlePinSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
            toast.error("PIN must be exactly 4 digits.");
            return;
        }
        setIsSaving(true);
        try {
            await updateAdminPin(newPin);
            toast.success("Admin PIN updated successfully.");
            setNewPin('');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to update PIN.");
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleReset = async () => {
        if (window.confirm("Are you sure you want to reset the admin PIN to the default '4004'?")) {
            try {
                await resetAdminPin();
                toast.success("PIN has been reset to 4004.");
            } catch (error) {
                 toast.error(error instanceof Error ? error.message : "Failed to reset PIN.");
            }
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md border">
            <h2 className="text-xl font-bold mb-4">Admin PIN Management</h2>
            <form onSubmit={handlePinSubmit} className="flex flex-col sm:flex-row items-end gap-4">
                <div className="flex-grow w-full">
                    <label htmlFor="newPin" className="block text-sm font-medium text-gray-700">New 4-Digit PIN</label>
                    <input
                        type="password"
                        id="newPin"
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value)}
                        className="w-full p-2 border rounded mt-1"
                        maxLength={4}
                        pattern="\d{4}"
                        inputMode="numeric"
                        required
                    />
                </div>
                <button type="submit" disabled={isSaving} className="bg-brand-gold text-brand-charcoal px-6 py-2 rounded-lg font-semibold hover:bg-brand-gold-dark transition w-full sm:w-auto disabled:opacity-50">
                    {isSaving ? 'Saving...' : 'Save New PIN'}
                </button>
            </form>
             <button onClick={handleReset} className="mt-4 text-sm text-blue-600 hover:underline">
                Reset PIN to 4004
            </button>
        </div>
    );
};


const SettingsPage: React.FC = () => {
    const { resetTransactions, adminProfile, updateAdminName } = useDataContext();
    const [adminName, setAdminName] = useState(adminProfile.name);

    useEffect(() => {
        setAdminName(adminProfile.name);
    }, [adminProfile]);

    const handleNameSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!adminName.trim()) {
            toast.error("Admin name cannot be empty.");
            return;
        }
        try {
            await updateAdminName(adminName);
            toast.success("Admin name updated successfully.");
        } catch (error) {
            toast.error("Failed to update admin name.");
        }
    };

    const handleResetTransactions = async () => {
        if (window.confirm("Are you sure you want to delete ALL bills and transaction history? This will reset all revenue to zero. This action CANNOT be undone.")) {
            try {
                await resetTransactions();
                toast.success("All transaction data has been reset successfully.");
            } catch (error) {
                toast.error("An error occurred while resetting data. Please try again.");
                console.error("Reset data error:", error);
            }
        }
    };

    return (
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-lg shadow-md border">
                <h2 className="text-xl font-bold mb-4">Admin Profile</h2>
                <form onSubmit={handleNameSubmit} className="flex items-end gap-4">
                    <div className="flex-grow">
                        <label htmlFor="adminName" className="block text-sm font-medium text-gray-700">Display Name</label>
                        <input
                            type="text"
                            id="adminName"
                            value={adminName}
                            onChange={(e) => setAdminName(e.target.value)}
                            className="w-full p-2 border rounded mt-1"
                            required
                        />
                    </div>
                    <button type="submit" className="bg-brand-gold text-brand-charcoal px-6 py-2 rounded-lg font-semibold hover:bg-brand-gold-dark transition">
                        Save
                    </button>
                </form>
            </div>

            <AdminPinManagement />

            <div className="hidden md:block bg-red-50 p-6 rounded-lg shadow-inner border border-red-200">
                <h2 className="text-xl font-bold text-red-800 mb-2">Danger Zone</h2>
                <p className="text-red-700 mb-4">Permanently delete all transaction data. This will reset revenue to zero. This action cannot be undone.</p>
                <button 
                    onClick={handleResetTransactions} 
                    className="bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700 transition"
                >
                    Reset All Transactions
                </button>
            </div>
        </div>
    );
};

export default SettingsPage;