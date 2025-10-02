import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useDataContext } from '../../context/DataContext';
import Modal from '../common/Modal';

const ImportDataModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const { mergeStaffData } = useDataContext();
    const [data, setData] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState<{ customersAdded: number; billsAdded: number } | null>(null);

    const handleImport = async () => {
        if (!data.trim()) {
            toast.error("Please paste the sync data from a staff member.");
            return;
        }
        setIsLoading(true);
        setError('');
        setResult(null);

        try {
            const importResult = await mergeStaffData(data.trim());
            setResult(importResult);
            toast.success("Data imported successfully!");
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
            setError(`Import failed: ${errorMessage}`);
            toast.error(`Import failed: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleClose = () => {
        setData('');
        setError('');
        setResult(null);
        setIsLoading(false);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Import Staff Data">
            <div>
                <p className="text-gray-600 mb-4">
                    Paste the data string provided by a staff member to merge their new customers and bills.
                </p>
                
                {result ? (
                     <div className="text-center p-4 bg-green-50 text-green-800 rounded-lg">
                        <h3 className="font-bold text-lg">Import Successful!</h3>
                        <p>{result.customersAdded} new customer(s) added.</p>
                        <p>{result.billsAdded} new bill(s) added.</p>
                        <button onClick={handleClose} className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition">
                            Done
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <textarea
                            value={data}
                            onChange={e => setData(e.target.value)}
                            placeholder="Paste staff data here..."
                            className="w-full p-3 border rounded h-40"
                            required
                            disabled={isLoading}
                        />
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <button 
                            onClick={handleImport} 
                            disabled={isLoading} 
                            className="w-full p-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-70"
                        >
                            {isLoading ? 'Importing...' : 'Import & Merge Data'}
                        </button>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default ImportDataModal;
