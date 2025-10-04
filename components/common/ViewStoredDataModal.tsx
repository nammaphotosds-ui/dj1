import React, { useState, useEffect } from 'react';
import { toast } from '../../utils/toast';
import Modal from './Modal';

const ViewStoredDataModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const [storedData, setStoredData] = useState('');

    useEffect(() => {
        if (isOpen) {
            const data = localStorage.getItem('lastSyncDataPayload');
            setStoredData(data || '');
        }
    }, [isOpen]);

    const handleCopy = () => {
        if (storedData) {
            navigator.clipboard.writeText(storedData);
            toast.success("Data copied to clipboard!");
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Last Saved Sync Data">
            <div className="text-center">
                {storedData ? (
                    <>
                        <p className="text-gray-600 mb-4">
                            This is the last sync data that was generated and saved on this device.
                        </p>
                        <div className="w-full text-left my-4">
                           <textarea 
                                readOnly 
                                value={storedData}
                                className="w-full p-2 border rounded bg-gray-50 text-xs h-40"
                                onFocus={(e) => e.target.select()}
                            />
                            <button onClick={handleCopy} className="mt-3 w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition">
                                Copy Data
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg">
                        <p className="font-semibold">No sync data found.</p>
                        <p className="text-sm mt-1">No sync data has been saved on this device yet. An admin needs to generate and copy sync data first.</p>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default ViewStoredDataModal;