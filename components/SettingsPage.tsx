import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useDataContext } from '../context/DataContext';
import { useAuthContext } from '../context/AuthContext';
import SyncDataModal from './settings/SyncDataModal';
import ImportDataModal from './settings/ImportDataModal';

const SettingsPage: React.FC = () => {
    const { tokenResponse, setCurrentUser, setTokenResponse } = useAuthContext();
    const { resetTransactions, adminProfile, updateAdminName } = useDataContext();
    const [adminName, setAdminName] = useState(adminProfile.name);
    const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

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

    const handleDisconnect = () => {
        if (tokenResponse) {
             // @ts-ignore
            if (window.google && window.google.accounts.oauth2.revoke) {
                 // @ts-ignore
                window.google.accounts.oauth2.revoke(tokenResponse.access_token, () => {});
            }
        }
        setTokenResponse(null);
        setCurrentUser(null);
        window.location.reload();
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
            
            <div className="bg-white p-6 rounded-lg shadow-md border grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h2 className="text-xl font-bold mb-2">Device Sync (Admin to Staff)</h2>
                    <p className="text-gray-600 mb-4">Generate a data string to set up or update a staff device.</p>
                    <button onClick={() => setIsSyncModalOpen(true)} className="bg-brand-gold text-brand-charcoal px-6 py-2 rounded-lg font-semibold hover:bg-brand-gold-dark transition">
                        Generate Sync Data
                    </button>
                    <SyncDataModal isOpen={isSyncModalOpen} onClose={() => setIsSyncModalOpen(false)} />
                </div>
                 <div>
                    <h2 className="text-xl font-bold mb-2">Import Staff Data</h2>
                    <p className="text-gray-600 mb-4">Paste the data string from a staff device to merge their changes.</p>
                    <button onClick={() => setIsImportModalOpen(true)} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition">
                        Import Data
                    </button>
                    <ImportDataModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} />
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border">
                <h2 className="text-xl font-bold mb-2">Google Drive Integration</h2>
                <p className="text-gray-600 mb-4">Your application data is securely stored and synced with your connected Google Drive account.</p>
                
                <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded-r-lg">
                    <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600 mr-3"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                        <div>
                            <h3 className="font-bold text-green-800">Successfully Connected to Google Drive!</h3>
                            <p className="text-sm text-green-700">Your data is being stored and synced automatically.</p>
                        </div>
                    </div>
                     <button onClick={handleDisconnect} className="mt-4 bg-yellow-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-yellow-600 transition text-sm">
                        Disconnect Google Account
                    </button>
                </div>
            </div>

            <div className="bg-red-50 p-6 rounded-lg shadow-inner border border-red-200">
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
