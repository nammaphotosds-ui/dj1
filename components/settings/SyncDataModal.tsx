import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useDataContext } from '../../context/DataContext';
import Modal from '../common/Modal';

const SyncDataModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const { getSyncDataPayload } = useDataContext();
    const [syncData, setSyncData] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const generateSyncData = () => {
        setIsLoading(true);
        setError('');
        setSyncData(null);
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
            toast.success("Data copied to clipboard!");
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Generate Device Sync Data">
            <div className="text-center">
                <p className="text-gray-600 mb-4">
                    Copy this entire block of text and send it to the staff member. They will paste it into their app to sync the data.
                </p>
                <div className="p-4 bg-gray-100 rounded-lg my-4 min-h-[12rem] flex items-center justify-center">
                    {isLoading ? (
                        <p className="text-gray-500">Generating data...</p>
                    ) : error ? (
                        <p className="text-red-500">{error}</p>
                    ) : syncData ? (
                        <div className="w-full text-left">
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