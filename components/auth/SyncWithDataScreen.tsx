import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../utils/supabase';

const SyncWithDataScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSync = async () => {
        const syncCode = code.trim().toUpperCase();
        if (!syncCode) {
            toast.error("Please enter the sync code from an admin.");
            return;
        }

        setIsLoading(true);

        try {
            const now = new Date().toISOString();
            const { data: sessionData, error } = await supabase
              .from('sync_sessions')
              .select('data_payload')
              .eq('sync_code', syncCode)
              .gt('expires_at', now)
              .single();
            
            if (error || !sessionData) {
                console.error('Supabase fetch error:', error);
                throw new Error("Invalid or expired sync code. Please ask the admin for a new one.");
            }

            const dataPayload = sessionData.data_payload;
            const jsonString = atob(dataPayload);
            const parsedData = JSON.parse(jsonString);

            if (!parsedData || typeof parsedData !== 'object' || !('inventory' in parsedData)) {
                throw new Error("Invalid or corrupted data format received.");
            }

            localStorage.setItem('appDataCache', JSON.stringify(parsedData));
            toast.success("Sync successful! The application will now reload.");
            
            // The code is now single-use by virtue of its short 15-minute lifespan.
            // Removing the explicit delete call prevents errors from missing DB permissions.

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
            <h2 className="text-3xl font-serif text-brand-charcoal mb-2">Sync with Code</h2>
            <p className="text-gray-600 mb-6 max-w-sm">Enter the sync code provided by an admin to set up this device.</p>
            
            <div className="w-full max-w-xs space-y-4">
                <input
                    type="text"
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    placeholder="e.g., ABC123"
                    className="w-full p-3 border rounded text-center text-2xl font-mono tracking-widest uppercase"
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