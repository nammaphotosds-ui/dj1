import React, { useState, useEffect } from 'react';
import { toast } from '../../utils/toast';
import { useDataContext } from '../../context/DataContext';
import { useAuthContext } from '../../context/AuthContext';
import Modal from '../common/Modal';
import { supabase } from '../../utils/supabase';

const StaffSyncModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const { getStaffChangesPayload, clearStaffChanges, userNameMap } = useDataContext();
    const { currentUser } = useAuthContext();
    const [changesCount, setChangesCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const { changesCount: count } = getStaffChangesPayload();
            setChangesCount(count);
        } else {
            setIsLoading(false);
        }
    }, [isOpen, getStaffChangesPayload]);

    const handleSendChanges = async () => {
        if (!currentUser || currentUser.role !== 'staff') {
            toast.error("Authentication error.");
            return;
        }

        setIsLoading(true);
        const { payload } = getStaffChangesPayload();
        
        const syncRequest = {
            staff_id: currentUser.id,
            staff_name: userNameMap.get(currentUser.id) || currentUser.id,
            data_payload: payload,
            changes_count: changesCount,
            status: 'pending'
        };

        const { error } = await supabase
            .from('staff_sync_requests')
            .insert(syncRequest);

        if (error) {
            toast.error("Failed to send changes. Please try again.");
            console.error("Supabase insert error:", error);
            setIsLoading(false);
            return;
        }

        toast.success("Changes sent to admin for review!");
        clearStaffChanges();
        setIsLoading(false);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Sync Changes to Admin">
            <div className="text-center">
                {changesCount > 0 ? (
                    <>
                        <p className="text-gray-600 mb-4">
                            You have <span className="font-bold text-lg text-brand-charcoal">{changesCount}</span> new change(s) ready to send to the admin for merging.
                        </p>
                        <button 
                            onClick={handleSendChanges} 
                            disabled={isLoading}
                            className="w-full p-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-70"
                        >
                            {isLoading ? 'Sending...' : 'Send Changes to Admin'}
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