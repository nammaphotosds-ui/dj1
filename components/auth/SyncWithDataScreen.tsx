import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

const SyncWithDataScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [data, setData] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSync = () => {
        if (!data.trim()) {
            toast.error("Please paste the sync data from an admin.");
            return;
        }

        setIsLoading(true);

        try {
            // Decode the Base64 string
            const jsonString = atob(data.trim());
            // Parse the JSON
            const parsedData = JSON.parse(jsonString);

            // Basic validation to ensure it's our app data
            if (!parsedData || typeof parsedData !== 'object' || !('inventory' in parsedData) || !('customers' in parsedData)) {
                throw new Error("Invalid or corrupted data format.");
            }

            // Save to local storage and reload
            localStorage.setItem('appDataCache', JSON.stringify(parsedData));
            toast.success("Sync successful! The application will now reload.");
            
            setTimeout(() => {
                window.location.reload();
            }, 1000);

        } catch (error) {
            console.error(error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            toast.error(`Sync failed: ${errorMessage}`);
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <img src="https://ik.imagekit.io/9y4qtxuo0/IMG_20250927_202057_913.png?updatedAt=1758984948163" alt="Logo" className="w-32 h-32 object-contain mb-4"/>
            <h2 className="text-3xl font-serif text-brand-charcoal mb-2">Sync Device Data</h2>
            <p className="text-gray-600 mb-6 max-w-sm">Paste the data string provided by an admin to set up this device.</p>
            
            <div className="w-full max-w-md space-y-4">
                <textarea
                    value={data}
                    onChange={e => setData(e.target.value)}
                    placeholder="Paste the sync data here..."
                    className="w-full p-3 border rounded h-40"
                    required
                />
                <button 
                    onClick={handleSync} 
                    disabled={isLoading} 
                    className="w-full p-3 bg-brand-gold text-brand-charcoal rounded-lg font-semibold hover:bg-brand-gold-dark transition disabled:opacity-70"
                >
                    {isLoading ? 'Syncing...' : 'Sync Data & Reload'}
                </button>
            </div>
            
            <button onClick={onBack} className="mt-8 text-gray-600 text-sm">
                Back to Login
            </button>
        </div>
    );
};

export default SyncWithDataScreen;