import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

const SyncWithCodeScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [code, setCode] = useState('');
    const [status, setStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
    const [error, setError] = useState('');

    const handleSync = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (code.replace(/-/g, '').length !== 6) {
            setError('Please enter a valid 6-digit code.');
            return;
        }
        
        setStatus('syncing');
        
        // In a real app, this would be a network request.
        // Here, we simulate it by reading from localStorage where the admin's device "uploaded" it.
        setTimeout(() => {
            const syncData = localStorage.getItem(`sync_session_${code.replace(/-/g, '')}`);
            if (syncData) {
                try {
                    const data = JSON.parse(syncData);
                    if (data && typeof data === 'object' && 'inventory' in data && 'rawCustomers' in data) {
                        localStorage.setItem('appDataCache', syncData);
                        setStatus('success');
                        toast.success('Sync successful! Application will now reload.');
                        
                        // Clean up the temporary sync data
                        localStorage.removeItem(`sync_session_${code.replace(/-/g, '')}`);

                        setTimeout(() => window.location.reload(), 1500);
                    } else {
                        throw new Error("Data format is invalid.");
                    }
                } catch (err) {
                    setStatus('error');
                    setError('Failed to process synced data. The code might be corrupted.');
                    toast.error('Failed to process synced data.');
                }
            } else {
                setStatus('error');
                setError('Invalid or expired sync code. Please try again.');
                toast.error('Invalid or expired sync code.');
            }
        }, 1000); // Simulate network latency
    };

    const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/[^0-9]/g, '');
        if (value.length <= 6) {
            // Add hyphen for better readability
            if (value.length > 3) {
                setCode(`${value.slice(0, 3)}-${value.slice(3)}`);
            } else {
                setCode(value);
            }
        }
    };
    
    return (
        <div className="flex flex-col items-center justify-center h-full p-4">
            <h1 className="text-2xl font-bold mb-2">Sync with Admin Device</h1>
            <p className="text-gray-600 text-center mb-8">Enter the 6-digit sync code displayed on the admin's device.</p>

            <form onSubmit={handleSync} className="w-full max-w-xs space-y-4">
                <input
                    type="text"
                    value={code}
                    onChange={handleCodeChange}
                    placeholder="123-456"
                    className="w-full p-4 border rounded-lg text-center text-3xl font-mono tracking-widest"
                    required
                    autoFocus
                    inputMode="numeric"
                    maxLength={7}
                />
                <button 
                    type="submit"
                    disabled={status === 'syncing' || status === 'success'}
                    className="w-full p-3 bg-brand-gold text-brand-charcoal rounded-lg font-semibold hover:bg-brand-gold-dark transition disabled:opacity-70"
                >
                    {status === 'syncing' ? 'Syncing...' : status === 'success' ? 'Success!' : 'Sync Data'}
                </button>
            </form>
            
            {error && <p className="text-red-600 text-sm mt-4">{error}</p>}

            <button
                onClick={onBack}
                className="mt-8 px-8 py-3 bg-gray-200 text-brand-charcoal rounded-lg font-semibold hover:bg-gray-300 transition"
            >
                Back to PIN Entry
            </button>
        </div>
    );
};

export default SyncWithCodeScreen;
