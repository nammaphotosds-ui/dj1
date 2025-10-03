import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useDataContext } from '../../context/DataContext';
import type { StaffSyncRequest } from '../../types';

const SyncRequestCard: React.FC<{ request: StaffSyncRequest; onProcess: (id: number, payload: string, action: 'merge' | 'reject') => Promise<void>; isProcessing: boolean; }> = ({ request, onProcess, isProcessing }) => {
    return (
        <div className="p-4 bg-gray-50 rounded-lg border flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div>
                <p className="font-bold">{request.staff_name} <span className="font-normal text-gray-600">({request.staff_id})</span></p>
                <p className="text-sm text-gray-500">
                    <span className="font-semibold">{request.changes_count} changes</span> sent on {new Date(request.created_at).toLocaleString()}
                </p>
            </div>
            <div className="flex gap-2 self-end sm:self-center">
                <button 
                    onClick={() => onProcess(request.id, request.data_payload, 'merge')} 
                    disabled={isProcessing}
                    className="px-4 py-2 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700 transition text-sm disabled:bg-gray-400"
                >
                    Merge
                </button>
                <button 
                    onClick={() => onProcess(request.id, request.data_payload, 'reject')} 
                    disabled={isProcessing}
                    className="px-4 py-2 bg-red-600 text-white rounded-md font-semibold hover:bg-red-700 transition text-sm disabled:bg-gray-400"
                >
                    Reject
                </button>
            </div>
        </div>
    );
};

const ManageSyncRequests: React.FC = () => {
    const { pendingSyncRequests, processSyncRequest } = useDataContext();
    const [processingId, setProcessingId] = useState<number | null>(null);

    const handleProcessRequest = async (id: number, payload: string, action: 'merge' | 'reject') => {
        setProcessingId(id);
        const toastId = toast.loading(`${action === 'merge' ? 'Merging' : 'Rejecting'} changes...`);
        try {
            const result = await processSyncRequest(id, payload, action);
            if (action === 'merge') {
                toast.success(`Successfully merged ${result.customersAdded} customers and ${result.billsAdded} bills.`, { id: toastId });
            } else {
                toast.success('Request rejected.', { id: toastId });
            }
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            toast.error(`Failed to ${action} changes: ${errorMessage}`, { id: toastId });
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md border">
            <h2 className="text-xl font-bold mb-2">Staff Sync Requests</h2>
            <p className="text-gray-600 mb-4">Review and merge changes submitted by staff members.</p>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {pendingSyncRequests.length > 0 ? (
                    pendingSyncRequests.map(req => (
                        <SyncRequestCard 
                            key={req.id} 
                            request={req} 
                            onProcess={handleProcessRequest} 
                            isProcessing={processingId === req.id}
                        />
                    ))
                ) : (
                    <div className="text-center py-10 bg-gray-50 rounded-lg">
                        <p className="text-gray-500">No pending sync requests from staff.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManageSyncRequests;
