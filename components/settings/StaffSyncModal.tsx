import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useDataContext } from '../../context/DataContext';
import Modal from '../common/Modal';

const StaffSyncModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const { getStaffChangesPayload, clearStaffChanges } = useDataContext();
    const [syncData, setSyncData] = useState<string | null>(null);
    const [changesCount, setChangesCount] = useState(0);

    useEffect(() => {
        if (isOpen) {
            const { payload, changesCount } = getStaffChangesPayload();
            setSyncData(payload);
            setChangesCount(changesCount);
        } else {
            setSyncData(null);
            setChangesCount(0);
        }
    }, [isOpen, getStaffChangesPayload]);

    const handleCopy = () => {
        if (syncData) {
            navigator.clipboard.writeText(syncData);
            toast.success("Data copied to clipboard!");
        }
    };
    
    const handleSyncComplete = () => {
        if (window.confirm("Have you successfully sent this data to the admin? This will clear your local changes to prevent duplicates on the next sync.")) {
            clearStaffChanges();
            toast.success("Local changes cleared. Ready for next sync.");
            onClose();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Sync Changes to Admin">
            <div className="text-center">
                {changesCount > 0 && syncData ? (
                    <>
                        <p className="text-gray-600 mb-4">
                            You have <span className="font-bold">{changesCount}</span> new change(s). Copy this text and send it to an admin to merge your work.
                        </p>
                        <div className="w-full text-left my-4">
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
                        <button onClick={handleSyncComplete} className="mt-4 w-full bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition">
                            I've Sent the Data, Clear My Changes
                        </button>
                    </>
                ) : (
                    <div className="p-4 bg-green-50 text-green-800 rounded-lg">
                        <p className="font-semibold">No new changes to sync!</p>
                        <p className="text-sm">All your work is up to date.</p>
                    </div>
                )}
                 <p className="text-xs text-gray-500 mt-6">
                    <strong>Note:</strong> After the admin merges your data, you will need to get a new data sync from them to see all changes from other staff.
                </p>
            </div>
        </Modal>
    );
};

export default StaffSyncModal;
