import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useDataContext } from '../../context/DataContext';
import { JewelryCategory } from '../../types';

const AddInventoryItemForm: React.FC<{onClose: ()=>void}> = ({onClose}) => {
    const { addInventoryItem, distributors } = useDataContext();
    const [name, setName] = useState('');
    const [category, setCategory] = useState<string>(JewelryCategory.GOLD);
    const [distributorId, setDistributorId] = useState('');
    const [weight, setWeight] = useState('');
    const [purity, setPurity] = useState('');
    const [quantity, setQuantity] = useState('1');
    const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setSubmissionStatus('saving');
        try {
            await addInventoryItem({
                name,
                category,
                distributorId,
                weight: parseFloat(weight),
                purity: parseFloat(purity),
                quantity: parseInt(quantity, 10),
            });
            setSubmissionStatus('saved');
            toast.success('Item added successfully!');
            setTimeout(() => {
                onClose();
            }, 1000);
        } catch (error) {
            console.error("Failed to add inventory item:", error);
            toast.error("An error occurred while saving the item. Please check your connection and try again.");
            setSubmissionStatus('idle');
        }
    };
    

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" placeholder="Item Name" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border rounded" required/>
            <div className="grid grid-cols-2 gap-4">
                <select value={category} onChange={e => setCategory(e.target.value)} className="w-full p-2 border rounded">
                    {Object.values(JewelryCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                <select value={distributorId} onChange={e => setDistributorId(e.target.value)} className="w-full p-2 border rounded" required>
                    <option value="" disabled>Select Distributor</option>
                    {distributors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <input type="number" step="0.01" placeholder="Weight (grams)" value={weight} onChange={e => setWeight(e.target.value)} className="w-full p-2 border rounded" required/>
                <input type="number" step="0.1" placeholder="Purity (carat)" value={purity} onChange={e => setPurity(e.target.value)} className="w-full p-2 border rounded" required/>
            </div>
            <input type="number" placeholder="Quantity" value={quantity} onChange={e => setQuantity(e.target.value)} className="w-full p-2 border rounded" required min="1"/>
            <button
                type="submit"
                disabled={submissionStatus !== 'idle'}
                className={`w-full p-3 rounded-lg font-semibold transition ${
                    submissionStatus === 'saved'
                        ? 'bg-green-600 text-white'
                        : submissionStatus === 'saving'
                        ? 'bg-gray-400 text-white opacity-70'
                        : 'bg-brand-gold text-brand-charcoal hover:bg-brand-gold-dark'
                }`}
            >
              {submissionStatus === 'saving' ? 'Saving...' : submissionStatus === 'saved' ? 'Saved!' : 'Add Item'}
            </button>
        </form>
    );
};

export default AddInventoryItemForm;