import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useDataContext } from '../../context/DataContext';
import Modal from '../common/Modal';

const SYNC_API_URL = 'https://api.kvstore.io/collections/dj-sync/items';

const SyncCodeModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const { getSyncDataPayload } = useDataContext();
    const [syncCode, setSyncCode] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            generateSyncCode();
        } else {
            setSyncCode(null);
            setError('');
        }
    }, [isOpen]);

    const generateSyncCode = async () => {
        setIsLoading(true);
        setError('');
        setSyncCode(null);

        try {
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            const dataPayload = getSyncDataPayload();
            
            const response = await fetch(SYNC_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    key: code,
                    value: JSON.stringify(dataPayload),
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create sync session.');
            }
            
            setSyncCode(`${code.slice(0, 3)}-${code.slice(3)}`);

        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create Device Sync Code">
            <div className="text-center">
                <p className="text-gray-600 mb-4">
                    Provide this temporary code to a staff member. When they enter it on their new device, the app data will be synced automatically.
                </p>
                <div className="p-4 bg-gray-100 rounded-lg my-4 min-h-[8rem] flex items-center justify-center">
                    {isLoading ? (
                        <p className="text-gray-500">Generating secure code...</p>
                    ) : error ? (
                        <p className="text-red-500">{error}</p>
                    ) : syncCode ? (
                        <div className="w-full">
                           <p className="text-5xl font-mono tracking-[0.2em] text-brand-charcoal p-4 bg-white rounded-lg border-2 border-gray-300">
                               {syncCode}
                           </p>
                        </div>
                    ) : null}
                </div>
                <button
                    onClick={generateSyncCode}
                    disabled={isLoading}
                    className="text-sm text-blue-600 hover:underline disabled:text-gray-400"
                >
                    {isLoading ? 'Generating...' : 'Generate New Code'}
                </button>
                 <p className="text-xs text-gray-500 mt-6">
                    <strong>Note:</strong> This code is for one-time use and provides a copy of the current data. Staff changes are not saved back to your Google Drive.
                </p>
            </div>
        </Modal>
    );
};

export default SyncCodeModal;