import React, { useState, useEffect } from 'react';
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
    const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

    useEffect(() => {
        if (category !== JewelryCategory.GOLD) {
            setPurity('');
        }
    }, [category]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (category === JewelryCategory.GOLD && !purity.trim()) {
            toast.error("Purity is required for Gold items.");
            return;
        }
        
        setSubmissionStatus('saving');
        const savingToast = toast.loading('Saving item...');

        try {
            await addInventoryItem({
                name,
                category,
                distributorId,
                weight: parseFloat(weight),
                purity: category === JewelryCategory.GOLD ? parseFloat(purity) : 0,
                quantity: 1,
            });

            toast.dismiss(savingToast);
            setSubmissionStatus('saved');
            toast.success('Item added successfully!');
            setTimeout(() => {
                onClose();
            }, 1000);

        } catch (error) {
            toast.dismiss(savingToast);
            console.error("Failed to add inventory item:", error);
            toast.error("An error occurred. Please try again.");
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
            <div className={`grid ${category === JewelryCategory.GOLD ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
                <input type="number" step="0.001" placeholder="Weight (grams)" value={weight} onChange={e => setWeight(e.target.value)} className="w-full p-2 border rounded" required/>
                {category === JewelryCategory.GOLD && (
                    <input type="number" step="0.1" placeholder="Purity (carat)" value={purity} onChange={e => setPurity(e.target.value)} className="w-full p-2 border rounded" required/>
                )}
            </div>
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