import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useDataContext } from '../../context/DataContext';
import Modal from '../common/Modal';

const SyncCodeModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const dataContext = useDataContext();
    const [syncCode, setSyncCode] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds

    useEffect(() => {
        let timer: number;
        if (isOpen) {
            generateSyncCode();
        } else {
            setSyncCode(null);
            setError('');
            setTimeLeft(600);
        }
        
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [isOpen]);

    useEffect(() => {
        let timer: number;
        if (syncCode && timeLeft > 0) {
            timer = window.setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            // Code expired, clean up
            localStorage.removeItem(`sync_session_${syncCode}`);
            setSyncCode(null);
        }
        
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [syncCode, timeLeft]);


    const generateSyncCode = () => {
        setIsLoading(true);
        setError('');

        // Simulate an async operation
        setTimeout(() => {
            try {
                const { inventory, rawCustomers, bills, staff, distributors, adminProfile } = dataContext;
                const dataToSync = { inventory, rawCustomers, bills, staff, distributors, adminProfile };
                const jsonString = JSON.stringify(dataToSync);

                // This is a simplified simulation. A real implementation would use a secure server.
                const code = Math.floor(100000 + Math.random() * 900000).toString();
                localStorage.setItem(`sync_session_${code}`, jsonString);
                
                setSyncCode(code);
                setTimeLeft(600);
            } catch (e) {
                setError("Failed to prepare data for syncing.");
                toast.error("Failed to prepare data for syncing.");
            } finally {
                setIsLoading(false);
            }
        }, 500);
    };

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const formattedCode = syncCode ? `${syncCode.slice(0, 3)}-${syncCode.slice(3)}` : '';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create Device Sync Code">
            <div className="text-center">
                <p className="text-gray-600 mb-4">
                    Share this temporary code with a staff member. They can enter it on their new device to sync the application data.
                </p>
                <div className="p-6 bg-gray-100 rounded-lg my-4">
                    {isLoading ? (
                        <p className="text-gray-500">Generating code...</p>
                    ) : error ? (
                        <p className="text-red-500">{error}</p>
                    ) : syncCode ? (
                        <div>
                            <p className="text-5xl font-mono font-bold tracking-widest text-brand-charcoal">{formattedCode}</p>
                            <p className="text-sm text-red-600 mt-2 font-semibold">Expires in: {formatTime(timeLeft)}</p>
                        </div>
                    ) : (
                        <p className="text-gray-500">Code has expired.</p>
                    )}
                </div>
                {syncCode && (
                    <button
                        onClick={generateSyncCode}
                        className="text-sm text-blue-600 hover:underline"
                    >
                        Generate New Code
                    </button>
                )}
                 <p className="text-xs text-gray-500 mt-6">
                    <strong>Note:</strong> This provides a one-time copy of the data. Changes made by staff on their device will not be saved back to your Google Drive.
                </p>
            </div>
        </Modal>
    );
};

export default SyncCodeModal;
