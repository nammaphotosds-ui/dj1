import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import useLocalStorage from '../hooks/useLocalStorage';
import type { GoogleTokenResponse } from '../types';
import { useDataContext } from '../context/DataContext';
import { useAuthContext } from '../context/AuthContext';

const DistributorManagement: React.FC = () => {
    const { distributors, addDistributor, deleteDistributor } = useDataContext();
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSaving(true);
        try {
            await addDistributor({ name });
            setName('');
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred.");
        }
        setIsSaving(false);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md border">
            <h2 className="text-xl font-bold mb-4">Distributor Management</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h3 className="text-lg font-semibold mb-2">Add New Distributor</h3>
                    <form onSubmit={handleSubmit} className="space-y-3">
                        <input type="text" placeholder="Distributor Name" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border rounded" required />
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <button type="submit" disabled={isSaving} className="w-full p-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-70">
                            {isSaving ? 'Saving...' : 'Add Distributor'}
                        </button>
                    </form>
                </div>
                <div>
                    <h3 className="text-lg font-semibold mb-2">Current Distributors</h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {distributors.length > 0 ? distributors.map(d => (
                            <div key={d.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                <p className="font-semibold">{d.name}</p>
                                <button onClick={() => deleteDistributor(d.id)} className="text-red-500 hover:text-red-700">Delete</button>
                            </div>
                        )) : <p className="text-gray-500">No distributors found.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}

const StaffManagement: React.FC = () => {
    const { staff, addStaff, deleteStaff } = useDataContext();
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
            setName('');
            setStaffId('');
            setPassword('');
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred.");
        }
        setIsSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm(`Are you sure you want to delete staff member ${id}?`)) {
            await deleteStaff(id);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md border">
            <h2 className="text-xl font-bold mb-4">Staff Management</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h3 className="text-lg font-semibold mb-2">Add New Staff</h3>
                    <form onSubmit={handleSubmit} className="space-y-3">
                        <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border rounded" required />
                        <input type="text" placeholder="Staff ID (e.g., staff01)" value={staffId} onChange={e => setStaffId(e.target.value)} className="w-full p-2 border rounded" required />
                        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-2 border rounded" required />
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <button type="submit" disabled={isSaving} className="w-full p-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-70">
                            {isSaving ? 'Saving...' : 'Add Staff'}
                        </button>
                    </form>
                </div>
                <div>
                    <h3 className="text-lg font-semibold mb-2">Current Staff</h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {staff.length > 0 ? staff.map(s => (
                            <div key={s.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                <div>
                                    <p className="font-semibold">{s.name}</p>
                                    <p className="text-sm text-gray-500 font-mono">{s.id}</p>
                                </div>
                                <button onClick={() => handleDelete(s.id)} className="text-red-500 hover:text-red-700">Delete</button>
                            </div>
                        )) : <p className="text-gray-500">No staff members found.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}


const SettingsPage: React.FC = () => {
    const [, setTokenResponse] = useLocalStorage<GoogleTokenResponse | null>('googleTokenResponse', null);
    const { tokenResponse, setCurrentUser } = useAuthContext();
    const { resetTransactions } = useDataContext();


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
            <DistributorManagement />
            <StaffManagement />

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