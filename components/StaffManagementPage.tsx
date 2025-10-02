import React, { useState } from 'react';
import { useDataContext } from '../context/DataContext';
import { useUIContext } from '../context/UIContext';
import type { Staff } from '../types';
import Modal from './common/Modal';
import EditStaffForm from './forms/EditStaffForm';
import { AddUserIcon } from './common/Icons';

const StaffManagementPage: React.FC = () => {
    const { staff, deleteStaff } = useDataContext();
    const { openAddStaffModal } = useUIContext();
    const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

    const handleDelete = async (id: string, name: string) => {
        if (window.confirm(`Are you sure you want to delete staff member "${name}"?`)) {
            await deleteStaff(id);
        }
    };

    return (
        <>
            <div className="bg-white p-6 rounded-lg shadow-md border">
                <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 gap-4">
                    <h2 className="text-xl font-bold">Manage Staff Members</h2>
                    <button 
                        onClick={openAddStaffModal}
                        className="flex items-center justify-center px-4 py-2 bg-brand-gold text-brand-charcoal rounded-lg font-semibold hover:bg-brand-gold-dark transition whitespace-nowrap"
                    >
                        <AddUserIcon /> <span className="ml-2">Add New Staff</span>
                    </button>
                </div>
                <div className="space-y-3 max-h-[65vh] overflow-y-auto">
                    {staff.length > 0 ? staff.map(s => (
                        <div key={s.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border">
                            <div>
                                <p className="font-semibold text-brand-charcoal">{s.name}</p>
                                <p className="text-sm text-gray-500 font-mono">{s.id}</p>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setEditingStaff(s)}
                                    className="bg-blue-100 text-blue-700 px-3 py-1 rounded-md text-sm font-medium hover:bg-blue-200 transition"
                                >
                                    Edit
                                </button>
                                <button 
                                    onClick={() => handleDelete(s.id, s.name)} 
                                    className="bg-red-100 text-red-700 px-3 py-1 rounded-md text-sm font-medium hover:bg-red-200 transition"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-16">
                            <p className="text-gray-500">No staff members found. Add one to get started.</p>
                        </div>
                    )}
                </div>
            </div>

            {editingStaff && (
                <Modal
                    isOpen={!!editingStaff}
                    onClose={() => setEditingStaff(null)}
                    title={`Edit Staff: ${editingStaff.name}`}
                >
                    <EditStaffForm
                        staffMember={editingStaff}
                        onClose={() => setEditingStaff(null)}
                    />
                </Modal>
            )}
        </>
    );
};

export default StaffManagementPage;