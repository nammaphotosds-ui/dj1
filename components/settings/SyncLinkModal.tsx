import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useDataContext } from '../../context/DataContext';
import Modal from '../common/Modal';

const SyncLinkModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const { createSyncSession } = useDataContext();
    const [syncLink, setSyncLink] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isOpen) {
            setSyncLink(null);
            setError('');
        }
    }, [isOpen]);

    const generateSyncLink = async () => {
        setIsLoading(true);
        setError('');
        setSyncLink(null);

        try {
            const fileId = await createSyncSession();
            const link = `${window.location.origin}${window.location.pathname}#sync-drive=${fileId}`;
            setSyncLink(link);
            toast.success("Sync link created successfully!");
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleCopy = () => {
        if (syncLink) {
            navigator.clipboard.writeText(syncLink);
            toast.success("Link copied to clipboard!");
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create Device Sync Link">
            <div className="text-center">
                <p className="text-gray-600 mb-4">
                    Share this secure link with a staff member. When they open it on a new device, the app data will be synced automatically.
                </p>
                <div className="p-4 bg-gray-100 rounded-lg my-4 min-h-[8rem] flex items-center justify-center">
                    {isLoading ? (
                        <p className="text-gray-500">Generating secure link...</p>
                    ) : error ? (
                        <p className="text-red-500">{error}</p>
                    ) : syncLink ? (
                        <div className="w-full text-left">
                           <input 
                                type="text" 
                                readOnly 
                                value={syncLink}
                                className="w-full p-2 border rounded bg-gray-50 text-sm"
                                onFocus={(e) => e.target.select()}
                            />
                            <button onClick={handleCopy} className="mt-3 w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition">
                                Copy Link
                            </button>
                        </div>
                    ) : (
                        <button onClick={generateSyncLink} className="bg-brand-gold text-brand-charcoal px-6 py-2 rounded-lg font-semibold hover:bg-brand-gold-dark transition">
                            Generate Link
                        </button>
                    )}
                </div>
                 <p className="text-xs text-gray-500 mt-6">
                    <strong>Note:</strong> This link is temporary and provides a read-only copy of the current data. It should only be shared with trusted staff.
                </p>
            </div>
        </Modal>
    );
};

export default SyncLinkModal;