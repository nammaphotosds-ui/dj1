import React, { useState, useMemo, useEffect } from 'react';
import { useDataContext } from '../context/DataContext';
import { useUIContext } from '../context/UIContext';
import { JewelryCategory } from '../types';
import type { JewelryItem } from '../types';
import Modal from './common/Modal';
import AddInventoryItemForm from './forms/AddInventoryItemForm';
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

const ProductCard: React.FC<{ item: JewelryItem; onDelete: (itemId: string, itemName: string) => void; }> = ({ item, onDelete }) => {
    const { distributors } = useDataContext();
    const distributorName = distributors.find(d => d.id === item.distributorId)?.name || 'Unknown';
    return (
        <div className="bg-white rounded-lg shadow-md border overflow-hidden group relative transition-shadow hover:shadow-xl">
            <div className="aspect-square w-full overflow-hidden bg-gray-100 flex items-center justify-center">
                 <img src={`https://via.placeholder.com/300/D4AF37/FFFFFF?text=${item.name.charAt(0)}`} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
            </div>
            <div className="p-3 text-sm">
                <h3 className="font-bold text-brand-charcoal truncate" title={item.name}>{item.name}</h3>
                <p className="text-xs text-gray-500 truncate" title={distributorName}>From: {distributorName}</p>
                <div className="flex justify-between items-center mt-2">
                    <p className="text-gray-500">{item.category}</p>
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${item.quantity > 0 ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>
                        {item.quantity > 0 ? `Qty: ${item.quantity}` : 'Sold Out'}
                    </span>
                </div>
            </div>
             <button 
                onClick={() => onDelete(item.id, item.name)} 
                className="absolute top-2 right-2 bg-white/70 backdrop-blur-sm text-red-500 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                aria-label={`Delete ${item.name}`}
             >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
            </button>
        </div>
    );
};

const InventoryPage: React.FC = () => {
    const { inventory, deleteInventoryItem } = useDataContext();
    const { initialInventoryFilter, setInitialInventoryFilter } = useUIContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>('All');

    useEffect(() => {
        if (initialInventoryFilter) {
            const validCategories = Object.values(JewelryCategory) as string[];
            if (validCategories.includes(initialInventoryFilter)) {
                setSelectedCategory(initialInventoryFilter);
            }
            setInitialInventoryFilter(null);
        }
    }, [initialInventoryFilter, setInitialInventoryFilter]);

    const categories = ['All', ...Object.values(JewelryCategory)];

    const filteredInventory = useMemo(() => {
        if (selectedCategory === 'All') {
            return inventory;
        }
        return inventory.filter(item => item.category === selectedCategory);
    }, [inventory, selectedCategory]);

    const inventoryStats = useMemo(() => {
        const totalStock = inventory.reduce((sum, item) => sum + item.quantity, 0);
        const totalWeight = inventory.reduce((sum, item) => sum + (item.weight * item.quantity), 0);
        return {
            uniqueItemCount: inventory.filter(item => item.quantity > 0).length,
            totalStock,
            totalWeight
        };
    }, [inventory]);
    
    const handleDelete = (itemId: string, itemName: string) => {
        if (window.confirm(`Are you sure you want to delete "${itemName}"? This action cannot be undone.`)) {
            deleteInventoryItem(itemId);
        }
    };

    return (
    <div>
        <div className="flex flex-col md:flex-row justify-end md:items-center mb-6 gap-4">
            <button onClick={() => setIsModalOpen(true)} className="hidden md:flex bg-brand-gold text-brand-charcoal px-6 py-2 rounded-lg font-semibold hover:bg-brand-gold-dark transition items-center shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                Add New Item
            </button>
        </div>
        
        <button onClick={() => setIsModalOpen(true)} className="md:hidden fixed bottom-28 right-6 bg-brand-gold text-brand-charcoal w-14 h-14 rounded-full shadow-lg flex items-center justify-center z-20">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
        </button>

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Inventory Item">
            <AddInventoryItemForm onClose={() => setIsModalOpen(false)} />
        </Modal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <InventoryStatCard title="Unique Items" value={inventoryStats.uniqueItemCount} icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>} />
            <InventoryStatCard title="Total Weight" value={`${inventoryStats.totalWeight.toFixed(3)} g`} icon={<WeightIcon />} />
            <InventoryStatCard title="Total Stock" value={inventoryStats.totalStock} icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>} />
        </div>

        {/* Category Filters */}
        <div className="mb-6">
            <div className="flex space-x-2 overflow-x-auto pb-2 -mx-4 px-4">
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
        </div>

        {/* Inventory Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredInventory.length > 0 ? (
                filteredInventory.map(item => (
                    <ProductCard key={item.id} item={item} onDelete={handleDelete} />
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