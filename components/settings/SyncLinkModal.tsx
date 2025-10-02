import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useDataContext } from '../../context/DataContext';
import Modal from '../common/Modal';
import { SendIcon } from '../common/Icons';

const SyncLinkModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const { createSyncSession } = useDataContext();
    const [syncLink, setSyncLink] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            generateSyncLink();
        } else {
            setSyncLink(null);
            setError('');
        }
    }, [isOpen]);

    const generateSyncLink = async () => {
        setIsLoading(true);
        setError('');
        setSyncLink(null);

        try {
            const syncId = await createSyncSession();
            const appUrl = window.location.origin + window.location.pathname;
            setSyncLink(`${appUrl}#sync-drive=${syncId}`);
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
            toast.success('Link copied to clipboard!');
        }
    };
    
    const handleShare = () => {
        if (syncLink) {
            const message = `Here is the one-time sync link to set up your device for DEVAGIRIKAR JEWELLERYS:\n\n${syncLink}`;
            const encodedMessage = encodeURIComponent(message);
            const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
            window.open(whatsappUrl, '_blank');
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create Device Sync Link">
            <div className="text-center">
                <p className="text-gray-600 mb-4">
                    Share this unique link with a staff member. When they open it on their new device, the app data will be synced automatically.
                </p>
                <div className="p-4 bg-gray-100 rounded-lg my-4 min-h-[8rem] flex items-center justify-center">
                    {isLoading ? (
                        <p className="text-gray-500">Generating secure link from your Google Drive...</p>
                    ) : error ? (
                        <p className="text-red-500">{error}</p>
                    ) : syncLink ? (
                        <div className="w-full">
                            <input
                                type="text"
                                value={syncLink}
                                readOnly
                                className="w-full p-2 border rounded-md text-center text-sm bg-white"
                                onFocus={(e) => e.target.select()}
                            />
                            <div className="flex gap-2 mt-3">
                                <button onClick={handleCopy} className="w-full px-4 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700">Copy Link</button>
                                <button onClick={handleShare} className="w-full px-4 py-2 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700 flex items-center justify-center gap-2">
                                    <SendIcon /> Share
                                </button>
                            </div>
                        </div>
                    ) : null}
                </div>
                <button
                    onClick={generateSyncLink}
                    disabled={isLoading}
                    className="text-sm text-blue-600 hover:underline disabled:text-gray-400"
                >
                    {isLoading ? 'Generating...' : 'Generate New Link'}
                </button>
                 <p className="text-xs text-gray-500 mt-6">
                    <strong>Note:</strong> This provides a one-time copy of the data. Changes made by staff on their device will not be saved back to your Google Drive.
                </p>
            </div>
        </Modal>
    );
};

export default SyncLinkModal;