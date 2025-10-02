import React from 'react';
import { useDataContext } from '../context/DataContext';
import { useUIContext } from '../context/UIContext';
import { DistributorIcon } from './common/Icons';

const DistributorManagementPage: React.FC = () => {
    const { distributors, deleteDistributor } = useDataContext();
    const { openAddDistributorModal } = useUIContext();

    const handleDelete = async (id: string, name: string) => {
        if (window.confirm(`Are you sure you want to delete distributor "${name}"?`)) {
            await deleteDistributor(id);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md border">
            <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 gap-4">
                <h2 className="text-xl font-bold">Manage Distributors</h2>
                <button 
                    onClick={openAddDistributorModal}
                    className="flex items-center justify-center px-4 py-2 bg-brand-gold text-brand-charcoal rounded-lg font-semibold hover:bg-brand-gold-dark transition whitespace-nowrap"
                >
                    <DistributorIcon /> <span className="ml-2">Add New Distributor</span>
                </button>
            </div>
            <div className="space-y-3 max-h-[65vh] overflow-y-auto">
                {distributors.length > 0 ? distributors.map(d => (
                    <div key={d.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border">
                        <div>
                            <p className="font-semibold text-brand-charcoal">{d.name}</p>
                            <p className="text-sm text-gray-500 font-mono">{d.id}</p>
                        </div>
                        <button 
                            onClick={() => handleDelete(d.id, d.name)} 
                            className="bg-red-100 text-red-700 px-3 py-1 rounded-md text-sm font-medium hover:bg-red-200 transition"
                        >
                            Delete
                        </button>
                    </div>
                )) : (
                     <div className="text-center py-16">
                        <p className="text-gray-500">No distributors found. Add one to get started.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DistributorManagementPage;