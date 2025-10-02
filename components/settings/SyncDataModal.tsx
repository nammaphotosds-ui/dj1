import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useDataContext } from '../../context/DataContext';
import Modal from '../common/Modal';

const SyncDataModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const { getSyncDataPayload } = useDataContext();
    const [syncData, setSyncData] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showData, setShowData] = useState(false);

    // Reset internal state when the modal is closed to ensure it's fresh on reopen.
    useEffect(() => {
        if (!isOpen) {
            // Add a small delay to prevent visual glitch during closing animation
            const timer = setTimeout(() => {
                setSyncData(null);
                setIsLoading(false);
                setError('');
                setShowData(false);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    const generateSyncData = () => {
        setIsLoading(true);
        setError('');
        setSyncData(null);
        setShowData(false); // Hide previous data when generating new data
        try {
            const payload = getSyncDataPayload();
            if (!payload) throw new Error("Could not generate data payload.");
            setSyncData(payload);
            toast.success("Sync data generated successfully!");
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleCopy = () => {
        if (syncData) {
            navigator.clipboard.writeText(syncData);
            localStorage.setItem('lastSyncDataPayload', syncData);
            toast.success("Data copied & saved locally!");
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Generate Device Sync Data">
            <div className="text-center">
                <p className="text-gray-600 mb-4">
                    Generate an encrypted data string to set up a new staff device. This string contains all necessary application data.
                </p>
                <div className="p-4 bg-gray-100 rounded-lg my-4 min-h-[12rem] flex items-center justify-center">
                    {isLoading ? (
                        <p className="text-gray-500">Generating data...</p>
                    ) : error ? (
                        <p className="text-red-500">{error}</p>
                    ) : syncData ? (
                        <div className="w-full text-center">
                            {showData ? (
                                <div className="w-full text-left">
                                   <p className="text-sm text-gray-600 mb-2">Copy this entire block of text and send it to the staff member.</p>
                                   <textarea 
                                        readOnly 
                                        value={syncData}
                                        className="w-full p-2 border rounded bg-gray-50 text-xs h-32"
                                        onFocus={(e) => e.target.select()}
                                    />
                                    <button onClick={handleCopy} className="mt-3 w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition">
                                        Copy Data
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-green-700 font-semibold mb-4">Sync data has been generated successfully.</p>
                                    <button onClick={() => setShowData(true)} className="bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-700 transition">
                                        View Data
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <button onClick={generateSyncData} className="bg-brand-gold text-brand-charcoal px-6 py-2 rounded-lg font-semibold hover:bg-brand-gold-dark transition">
                            Generate Data
                        </button>
                    )}
                </div>
                 <p className="text-xs text-gray-500 mt-6">
                    <strong>Note:</strong> This is a snapshot of the current data. It should only be shared with trusted staff.
                </p>
            </div>
        </Modal>
    );
};

export default SyncDataModal;