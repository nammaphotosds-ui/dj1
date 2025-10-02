import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

const SYNC_API_URL = 'https://api.kvstore.io/collections/dj-sync/items/';

const SyncWithCodeScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const syncCode = code.replace(/-/g, '').trim();
        if (syncCode.length !== 6 || !/^\d+$/.test(syncCode)) {
            setError('Please enter a valid 6-digit sync code.');
            return;
        }

        setIsLoading(true);
        setError('');
        const loadingToast = toast.loading('Syncing data...');

        try {
            const response = await fetch(`${SYNC_API_URL}${syncCode}`);

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Invalid or expired sync code. Please try again.');
                }
                throw new Error(`Failed to fetch sync data. Status: ${response.status}`);
            }

            const data = await response.json();
            const appData = JSON.parse(data.value);

            if (typeof appData !== 'object' || !('inventory' in appData) || !('customers' in appData)) {
                throw new Error('Invalid sync data format.');
            }

            localStorage.setItem('appDataCache', JSON.stringify(appData));
            toast.dismiss(loadingToast);
            toast.success('Sync successful! Application will now reload.');
            
            // Attempt to delete the one-time code
            fetch(`${SYNC_API_URL}${syncCode}`, { method: 'DELETE' }).catch(err => console.warn("Could not delete sync code", err));

            setTimeout(() => {
               window.location.reload();
            }, 1500);

        } catch (err) {
            setIsLoading(false);
            toast.dismiss(loadingToast);
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(errorMessage);
            toast.error(errorMessage);
        }
    };

    const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/[^0-9]/g, '');
        if (value.length > 6) return;
        
        if (value.length > 3) {
            setCode(`${value.slice(0, 3)}-${value.slice(3)}`);
        } else {
            setCode(value);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <img src="https://ik.imagekit.io/9y4qtxuo0/IMG_20250927_202057_913.png?updatedAt=1758984948163" alt="Logo" className="w-32 h-32 object-contain mb-4"/>
            <h2 className="text-3xl font-serif text-brand-charcoal mb-2">Sync New Device</h2>
            <p className="text-gray-600 mb-8 max-w-sm">Enter the 6-digit code provided by an admin to load the store's data onto this device.</p>
            
            <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-4">
                <input
                    type="text"
                    value={code}
                    onChange={handleCodeChange}
                    placeholder="123-456"
                    className="w-full p-4 text-center text-3xl tracking-[0.2em] font-mono border-2 rounded-lg"
                    required
                    autoFocus
                />
                <button type="submit" disabled={isLoading} className="w-full p-3 bg-brand-gold text-brand-charcoal rounded-lg font-semibold hover:bg-brand-gold-dark transition disabled:opacity-70">
                    {isLoading ? 'Syncing...' : 'Sync Data'}
                </button>
                {error && <p className="text-red-600 text-sm">{error}</p>}
            </form>
            <button onClick={onBack} className="mt-8 text-gray-600 text-sm">Back to Login</button>
        </div>
    );
};

export default SyncWithCodeScreen;
