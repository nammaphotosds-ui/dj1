import React, { useState, useMemo, useEffect } from 'react';
import { useDataContext } from '../context/DataContext';
import { useUIContext } from '../context/UIContext';
import { JewelryCategory } from '../types';
import type { JewelryItem } from '../types';
import Modal from './common/Modal';
import AddInventoryItemForm from './forms/AddInventoryItemForm';
import EditInventoryItemForm from './forms/EditInventoryItemForm';
import { WeightIcon } from './common/Icons';


const InventoryStatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-white p-4 rounded-lg shadow-md flex items-center border border-gray-100">
        <div className="p-3 bg-brand-gold-light text-brand-gold-dark rounded-full mr-4">{icon}</div>
        <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-brand-charcoal">{value}</p>
        </div>
    </div>
);

const InventoryListItem: React.FC<{ item: JewelryItem; onDelete: (itemId: string, itemName: string) => void; onEdit: (item: JewelryItem) => void; }> = ({ item, onDelete, onEdit }) => {
    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border flex items-center justify-between transition-shadow hover:shadow-md">
            <div className="flex-grow mr-4">
                <p className="font-bold text-brand-charcoal truncate">{item.name}</p>
                <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 mt-1">
                    <span>ID: <span className="font-mono">{item.serialNo}</span></span>
                    <span>Wt: <span className="font-mono">{item.weight.toFixed(4)}g</span></span>
                    {item.category === JewelryCategory.GOLD && <span>Purity: <span className="font-mono">{item.purity}ct</span></span>}
                </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                 <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    In Stock
                 </span>
                 <button 
                    onClick={() => onEdit(item)} 
                    className="text-blue-500 rounded-full p-1.5 hover:bg-blue-100"
                    aria-label={`Edit ${item.name}`}
                 >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                 <button 
                    onClick={() => onDelete(item.id, item.name)} 
                    className="text-red-500 rounded-full p-1.5 hover:bg-red-100"
                    aria-label={`Delete ${item.name}`}
                 >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                </button>
            </div>
        </div>
    );
};

const InventoryPage: React.FC = () => {
    const { inventory, deleteInventoryItem } = useDataContext();
    const { initialInventoryFilter, setInitialInventoryFilter } = useUIContext();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<JewelryItem | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>(JewelryCategory.GOLD);

    useEffect(() => {
        if (initialInventoryFilter) {
            const validCategories = Object.values(JewelryCategory) as string[];
            if (validCategories.includes(initialInventoryFilter)) {
                setSelectedCategory(initialInventoryFilter);
            }
            setInitialInventoryFilter(null);
        }
    }, [initialInventoryFilter, setInitialInventoryFilter]);

    const categories = [...Object.values(JewelryCategory)];

    const filteredInventory = useMemo(() => {
        return inventory.filter(item => item.category === selectedCategory && item.quantity > 0);
    }, [inventory, selectedCategory]);

    const inventoryStats = useMemo(() => {
        const totalStock = filteredInventory.reduce((sum, item) => sum + item.quantity, 0);
        const totalWeight = filteredInventory.reduce((sum, item) => sum + (item.weight * item.quantity), 0);
        return {
            uniqueItemCount: filteredInventory.length,
            totalStock,
            totalWeight
        };
    }, [filteredInventory]);
    
    const handleDelete = (itemId: string, itemName: string) => {
        if (window.confirm(`Are you sure you want to delete "${itemName}"? This action cannot be undone.`)) {
            deleteInventoryItem(itemId);
        }
    };

    return (
    <div>
        <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
            <div className="flex space-x-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:pb-0">
                {categories.map(category => (
                    <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition ${
                            selectedCategory === category
                                ? 'bg-brand-gold text-brand-charcoal shadow'
                                : 'bg-white text-gray-700 border hover:bg-gray-100'
                        }`}
                    >
                        {category}
                    </button>
                ))}
            </div>
             <button onClick={() => setIsAddModalOpen(true)} className="hidden md:flex bg-brand-gold text-brand-charcoal px-6 py-2 rounded-lg font-semibold hover:bg-brand-gold-dark transition items-center shadow-md whitespace-nowrap">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                Add New Item
            </button>
        </div>
        
        <button onClick={() => setIsAddModalOpen(true)} className="md:hidden fixed bottom-24 right-6 bg-brand-gold text-brand-charcoal w-14 h-14 rounded-full shadow-lg flex items-center justify-center z-20">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
        </button>

        <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Inventory Item">
            <AddInventoryItemForm onClose={() => setIsAddModalOpen(false)} />
        </Modal>

        <Modal isOpen={!!editingItem} onClose={() => setEditingItem(null)} title="Edit Inventory Item">
            {editingItem && <EditInventoryItemForm item={editingItem} onClose={() => setEditingItem(null)} />}
        </Modal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <InventoryStatCard title="Unique Items" value={inventoryStats.uniqueItemCount} icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>} />
            <InventoryStatCard title="Total Weight" value={`${inventoryStats.totalWeight.toFixed(4)} g`} icon={<WeightIcon />} />
        </div>

        <div className="space-y-3">
            {filteredInventory.length > 0 ? (
                filteredInventory.map(item => (
                    <InventoryListItem 
                        key={item.id} 
                        item={item} 
                        onDelete={handleDelete}
                        onEdit={(itemToEdit) => setEditingItem(itemToEdit)}
                    />
                ))
            ) : (
                <div className="text-center py-16 bg-white rounded-lg shadow-md col-span-full">
                    <p className="text-gray-500">
                        {inventory.length === 0
                            ? 'No items in inventory. Add one to get started!'
                            : `No items found in the "${selectedCategory}" category.`}
                    </p>
                </div>
            )}
        </div>
    </div>
    );
};

export default InventoryPage;