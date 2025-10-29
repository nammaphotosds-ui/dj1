import React, { useState, useMemo, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { toast } from '../utils/toast';
import { useDataContext } from '../context/DataContext';
import { BillType, Page, JewelryCategory } from '../types';
import type { JewelryItem, BillItem, Customer, Bill } from '../types';
import { SendIcon } from './common/Icons';

const numberToWords = (num: number): string => {
    const integerPart = Math.floor(num);
    const decimalPart = Math.round((num - integerPart) * 100);

    const a = ['', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ', 'ten ', 'eleven ', 'twelve ', 'thirteen ', 'fourteen ', 'fifteen ', 'sixteen ', 'seventeen ', 'eighteen ', 'nineteen '];
    const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

    const toWords = (n: number): string => {
        if (n < 20) return a[n];
        const digit = n % 10;
        return b[Math.floor(n / 10)] + (digit !== 0 ? '' : '') + a[digit];
    };
    
    if (integerPart === 0) return 'Rupees Zero Only';

    let words = '';
    words += toWords(Math.floor(integerPart / 10000000) % 100) ? toWords(Math.floor(integerPart / 10000000) % 100) + 'crore ' : '';
    words += toWords(Math.floor(integerPart / 100000) % 100) ? toWords(Math.floor(integerPart / 100000) % 100) + 'lakh ' : '';
    words += toWords(Math.floor(integerPart / 1000) % 100) ? toWords(Math.floor(integerPart / 1000) % 100) + 'thousand ' : '';
    words += toWords(Math.floor(integerPart / 100) % 10) ? toWords(Math.floor(integerPart / 100) % 10) + 'hundred ' : '';
    if (integerPart > 100 && (integerPart % 100) > 0) words += 'and ';
    words += toWords(integerPart % 100);

    let result = `Rupees ${words.trim().replace(/\s+/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`;

    if (decimalPart > 0) {
        result += ` and ${toWords(decimalPart)}Paise`;
    }
    
    return result + ' Only';
};

// This is the template that will be rendered for PDF generation
const InvoiceTemplate: React.FC<{bill: Bill, customer: Customer}> = ({bill, customer}) => {
    const totalGrossWeight = bill.items.reduce((sum, item) => sum + (item.weight * (item.quantity || 1)), 0);
    const { grandTotal, netWeight, makingChargeAmount, wastageAmount, bargainedAmount, finalAmount, amountPaid, sgstPercentage, sgstAmount, cgstPercentage, cgstAmount } = bill;
    const logoUrl = "https://ik.imagekit.io/9y4qtxuo0/IMG_20250927_202057_913.png?updatedAt=1758984948163";

    const isCompact = bill.items.length > 8;
    const tableCellClasses = isCompact ? 'py-0.5 px-2' : 'py-1 px-2';
    const tableBaseFontSize = isCompact ? 'text-[11px]' : 'text-xs';
    const isPaid = grandTotal - amountPaid <= 0.01;

    return (
        <div className="bg-brand-cream text-brand-charcoal font-sans flex flex-col" style={{ width: '842px', minHeight: '595px', boxSizing: 'border-box' }}>
            <div className="flex-grow relative overflow-hidden p-8">
                {/* Decorative Border */}
                <div className="absolute inset-0 border-[1px] border-brand-gold-dark/30 z-0"></div>
                <div className="absolute inset-2 border-[8px] border-brand-pale-gold z-0"></div>
                <div className="absolute inset-4 border-[1px] border-brand-gold-dark/50 z-0"></div>

                {/* Watermark */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 opacity-[0.06]">
                    <img src={logoUrl} alt="Watermark" className="w-[350px]"/>
                </div>
                
                <div className="relative z-10 flex flex-col h-full">
                    {/* Header */}
                    <header className="flex justify-between items-start pb-2 mb-2 border-b border-brand-gold-dark/30">
                        <div className="flex items-center">
                            <img src={logoUrl} alt="Logo" className="w-16 h-16" />
                            <div className="ml-3">
                                <h2 className="text-5xl font-serif tracking-wider font-bold text-brand-charcoal">DEVAGIRIKAR</h2>
                                <p className="text-3xl text-brand-gold-dark tracking-[0.15em] -mt-1">JEWELLERYS</p>
                                <p className="text-[10px] tracking-widest text-brand-gray mt-1">Real Source of Purity</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <h1 className="text-2xl font-serif font-light text-brand-gold-dark tracking-widest">{bill.type}</h1>
                            <p className="text-xs mt-1 font-mono"><strong>Bill No:</strong> {bill.id}</p>
                            <p className="text-xs font-mono"><strong>GSTIN:</strong> 29BSWPD7616JZ0</p>
                            <p className="text-xs font-mono"><strong>Date:</strong> {new Date(bill.date).toLocaleDateString()}</p>
                        </div>
                    </header>

                    {/* Customer Details */}
                    <section className="text-xs mb-2">
                        <p className="text-brand-gray text-xs font-bold uppercase tracking-wider">Billed To</p>
                        <p className="font-bold text-base text-brand-charcoal font-serif">{customer.name} ({customer.id})</p>
                        <p className="text-brand-gray">{customer.phone}</p>
                    </section>

                    {/* Items Table */}
                    <main className="flex-grow">
                        <table className={`w-full border-collapse border border-brand-gold-dark/30 ${tableBaseFontSize}`} style={{ tableLayout: 'fixed' }}>
                            <thead className="border-b-2 border-brand-charcoal bg-brand-pale-gold/30">
                                <tr>
                                    <th className={`font-semibold text-left tracking-wider uppercase text-brand-charcoal w-[45%] border border-brand-gold-dark/30 ${tableCellClasses}`}>Item Name</th>
                                    <th className={`font-semibold text-left tracking-wider uppercase text-brand-charcoal w-[15%] border border-brand-gold-dark/30 ${tableCellClasses}`}>Item ID</th>
                                    <th className={`font-semibold text-right tracking-wider uppercase text-brand-charcoal w-[10%] border border-brand-gold-dark/30 ${tableCellClasses}`}>Weight (g)</th>
                                    <th className={`font-semibold text-right tracking-wider uppercase text-brand-charcoal w-[15%] border border-brand-gold-dark/30 ${tableCellClasses}`}>Rate/g (₹)</th>
                                    <th className={`font-semibold text-right tracking-wider uppercase text-brand-charcoal w-[15%] border border-brand-gold-dark/30 ${tableCellClasses}`}>Amount (₹)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bill.items.map((item: BillItem) => {
                                    const quantity = item.quantity || 1;
                                    const amount = item.price * quantity;
                                    const ratePerGram = item.weight > 0 ? item.price / item.weight : 0;
                                    return (
                                        <tr key={item.itemId} className="border-b border-brand-gold-dark/20">
                                            <td className={`font-medium border border-brand-gold-dark/30 ${tableCellClasses}`} style={{ wordBreak: 'break-word' }}>
                                                {item.name}
                                                {item.category && <span className="text-gray-500 font-normal"> ({item.category})</span>}
                                            </td>
                                            <td className={`font-mono text-xs border border-brand-gold-dark/30 ${tableCellClasses}`}>{item.serialNo}</td>
                                            <td className={`text-right font-mono border border-brand-gold-dark/30 ${tableCellClasses}`}>{item.weight.toFixed(4)}</td>
                                            <td className={`text-right font-mono border border-brand-gold-dark/30 ${tableCellClasses}`}>{ratePerGram.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            <td className={`text-right font-mono border border-brand-gold-dark/30 ${tableCellClasses}`}>{amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </main>

                    {/* Summary Section */}
                    <section className="mt-auto pt-2">
                        <div className="flex justify-between items-start pt-2 border-t border-brand-gold-dark/30">
                             <div className="w-1/2 pr-4 text-xs">
                                <p className="font-bold text-gray-700 capitalize">{numberToWords(grandTotal)}</p>
                                <div className="mt-4 text-[10px] text-brand-gray">
                                    <p className="font-bold">Terms & Conditions:</p>
                                    <p>1. Goods once sold will not be taken back.</p>
                                    <p>2. Physically damaged items are not replaced.</p>
                                    <p>3. Exchange available within 4 days.</p>
                                </div>
                            </div>
                            <div className="w-1/2 text-xs">
                                <div className="space-y-1">
                                    <div className="flex justify-between"><span>Gross Wt:</span><span>{totalGrossWeight.toFixed(4)} g</span></div>
                                    {bill.lessWeight > 0 && <div className="flex justify-between"><span>Less Wt:</span><span>- {bill.lessWeight.toFixed(4)} g</span></div>}
                                    <div className="flex justify-between font-bold border-t border-gray-200 mt-1 pt-1"><span>Net Wt:</span><span>{netWeight.toFixed(4)} g</span></div>
                                </div>
                                <div className="space-y-1 mt-2 pt-2 border-t border-gray-200">
                                    <div className="flex justify-between"><span>Subtotal:</span><span>₹{finalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
                                    {makingChargeAmount > 0 && <div className="flex justify-between"><span>Making Charges ({bill.makingChargePercentage}%):</span><span>+ ₹{makingChargeAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>}
                                    {wastageAmount > 0 && <div className="flex justify-between"><span>Wastage ({bill.wastagePercentage}%):</span><span>+ ₹{wastageAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>}
                                    {sgstAmount > 0 && <div className="flex justify-between"><span>SGST ({sgstPercentage}%):</span><span>+ ₹{sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>}
                                    {cgstAmount > 0 && <div className="flex justify-between"><span>CGST ({cgstPercentage}%):</span><span>+ ₹{cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>}
                                    {bill.oldItemBalance > 0 && <div className="flex justify-between text-green-600"><span>Return Items:</span><span>- ₹{bill.oldItemBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>}
                                    {bargainedAmount > 0 && <div className="flex justify-between text-green-600"><span>Discount:</span><span>- ₹{bargainedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>}
                                    <div className="flex justify-between text-base mt-1 pt-1 border-t-2 border-brand-charcoal">
                                        <span className="font-bold">Grand Total:</span>
                                        <span className="font-bold">₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                </div>
                                <div className="space-y-1 mt-2">
                                    <div className="flex justify-between">
                                        <span className="font-bold">Paid:</span>
                                        <span>₹{amountPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className={`flex justify-between ${isPaid ? 'text-green-700' : 'text-red-700'}`}>
                                        <span className="font-bold">Status:</span>
                                        <span className="font-bold">{isPaid ? 'Fully Paid' : 'Unpaid'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-between items-end mt-4">
                            <div className="flex items-center">
                                <img src="https://ik.imagekit.io/9y4qtxuo0/devagirikar_Social.png?updatedAt=1759337561869" alt="Social Media QR" className="w-16 h-16"/>
                                <p className="text-[10px] text-brand-gray ml-4">Thank you for your business!</p>
                            </div>
                            <div className="text-center">
                                <img 
                                    src="https://ik.imagekit.io/9y4qtxuo0/IMG-20251002-WA0002%20(1).png?updatedAt=1759414754055" 
                                    alt="Seal and Signature" 
                                    className="w-32 h-auto"
                                />
                            </div>
                        </div>
                    </section>
                </div>
            </div>
            <footer className="text-center text-brand-charcoal px-8 py-2 flex-shrink-0">
                <div className="border-t-2 border-brand-charcoal mb-2 mx-auto w-full"></div>
                <p className="font-bold text-xs">1st Floor, Stall No.1&2, A.C.O. Complex, Bus-Stand Road, ILKAL-587125. Dist : Bagalkot. | Phone: 9008604004 / 8618748300</p>
            </footer>
        </div>
    );
};


// A generic searchable select component
const SearchableSelect = <T extends { id: string; name: string; }>({
    options,
    placeholder,
    onSelect,
    renderOption,
    disabled = false
}: {
    options: T[];
    placeholder: string;
    onSelect: (item: T) => void;
    renderOption: (item: T) => React.ReactNode;
    disabled?: boolean;
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const filteredOptions = useMemo(() => {
        if (!searchTerm) return [];
        return options.filter(option =>
            option.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, options]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const handleSelect = (item: T) => {
        onSelect(item);
        setSearchTerm('');
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <input
                type="text"
                placeholder={placeholder}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onFocus={() => setIsOpen(true)}
                disabled={disabled}
                className="w-full p-2 border rounded"
            />
            {isOpen && searchTerm && (
                <ul className="absolute z-10 w-full bg-white border rounded-b-md shadow-lg max-h-60 overflow-y-auto mt-1">
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map(item => (
                            <li
                                key={item.id}
                                onClick={() => handleSelect(item)}
                                className="px-3 py-2 hover:bg-brand-gold-light cursor-pointer"
                            >
                                {renderOption(item)}
                            </li>
                        ))
                    ) : (
                        <li className="px-3 py-2 text-gray-500">No results found.</li>
                    )}
                </ul>
            )}
        </div>
    );
};


const BillingPage: React.FC<{setCurrentPage: (page: Page) => void}> = ({setCurrentPage}) => {
  const { inventory, customers, createBill, getCustomerById } = useDataContext();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<BillItem[]>([]);
  const [bargainedAmount, setBargainedAmount] = useState<string>('');
  const [billType, setBillType] = useState<BillType>(BillType.ESTIMATE);
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'processing' | 'success'>('idle');
  const [lessWeight, setLessWeight] = useState('');
  const [oldItemBalance, setOldItemBalance] = useState('');
  const [makingChargePercentage, setMakingChargePercentage] = useState('');
  const [wastagePercentage, setWastagePercentage] = useState('');
  const [sgstPercentage, setSgstPercentage] = useState('');
  const [cgstPercentage, setCgstPercentage] = useState('');
  const [goldRatePer10g, setGoldRatePer10g] = useState('');
  const [silverRatePer10g, setSilverRatePer10g] = useState('');
  const [platinumRatePer10g, setPlatinumRatePer10g] = useState('');
  
  const [showGoldRateInput, setShowGoldRateInput] = useState(false);
  const [showSilverRateInput, setShowSilverRateInput] = useState(false);
  const [showPlatinumRateInput, setShowPlatinumRateInput] = useState(false);
  
  const [lockedCategory, setLockedCategory] = useState<JewelryCategory | null>(null);
  const [weightInputs, setWeightInputs] = useState<Record<string, string>>({});

  const selectedCustomer = useMemo(() => {
    return customers.find(c => c.id === selectedCustomerId);
  }, [selectedCustomerId, customers]);

  const availableInventory = useMemo(() => {
    let filtered = inventory.filter(item => item.quantity > 0 && !selectedItems.some(si => si.itemId === item.id));
    if (lockedCategory) {
        filtered = filtered.filter(item => item.category === lockedCategory);
    }
    return filtered;
  }, [inventory, selectedItems, lockedCategory]);

  const calculations = useMemo(() => {
    const totalWeight = selectedItems.reduce((sum, item) => sum + (item.weight * item.quantity), 0);
    const subtotalBeforeLessWeight = selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const lw = parseFloat(lessWeight) || 0;
    const averageRate = totalWeight > 0 ? subtotalBeforeLessWeight / totalWeight : 0;
    const lessWeightValue = lw * averageRate;

    const actualSubtotal = subtotalBeforeLessWeight - lessWeightValue;

    const mcp = parseFloat(makingChargePercentage) || 0;
    const wp = parseFloat(wastagePercentage) || 0;
    const makingChargeAmount = actualSubtotal * (mcp / 100);
    const wastageAmount = actualSubtotal * (wp / 100);

    const taxableAmount = actualSubtotal + makingChargeAmount + wastageAmount;
    const sgstP = parseFloat(sgstPercentage) || 0;
    const cgstP = parseFloat(cgstPercentage) || 0;
    const sgstAmount = taxableAmount * (sgstP / 100);
    const cgstAmount = taxableAmount * (cgstP / 100);

    const ba = parseFloat(bargainedAmount) || 0;
    const oib = parseFloat(oldItemBalance) || 0;
    const grandTotal = taxableAmount + sgstAmount + cgstAmount - ba - oib;

    const netWeight = totalWeight - lw;

    return { 
        totalAmount: subtotalBeforeLessWeight,
        lessWeightValue,
        actualSubtotal,
        makingChargeAmount,
        wastageAmount,
        sgstAmount,
        cgstAmount,
        grandTotal, 
        totalWeight, 
        netWeight 
    };
  }, [selectedItems, bargainedAmount, oldItemBalance, makingChargePercentage, wastagePercentage, lessWeight, sgstPercentage, cgstPercentage]);

  const updatePricesForCategory = (category: JewelryCategory, rateStr: string, itemsToUpdate: BillItem[]) => {
    const rate = parseFloat(rateStr);
    if (isNaN(rate) || rate < 0) return itemsToUpdate; // Return original items if rate is invalid

    return itemsToUpdate.map(item => {
        const inventoryItem = inventory.find(i => i.id === item.itemId);
        if (inventoryItem && inventoryItem.category === category) {
            const newPrice = rate > 0 ? (item.weight / 10) * rate : 0;
            return { ...item, price: newPrice };
        }
        return item;
    });
  };

  useEffect(() => {
    setSelectedItems(prevItems => updatePricesForCategory(JewelryCategory.GOLD, goldRatePer10g, prevItems));
  }, [goldRatePer10g, inventory]);

  useEffect(() => {
    setSelectedItems(prevItems => updatePricesForCategory(JewelryCategory.SILVER, silverRatePer10g, prevItems));
  }, [silverRatePer10g, inventory]);
  
  useEffect(() => {
    setSelectedItems(prevItems => updatePricesForCategory(JewelryCategory.PLATINUM, platinumRatePer10g, prevItems));
  }, [platinumRatePer10g, inventory]);

  const handleAddItem = (item: JewelryItem) => {
    if (selectedItems.length === 0) {
        setLockedCategory(item.category as JewelryCategory);
    }

    if (item.category === JewelryCategory.GOLD) setShowGoldRateInput(true);
    if (item.category === JewelryCategory.SILVER) setShowSilverRateInput(true);
    if (item.category === JewelryCategory.PLATINUM) setShowPlatinumRateInput(true);

    let price = 0;
    let rateStr = '';
    if (item.category === JewelryCategory.GOLD) rateStr = goldRatePer10g;
    else if (item.category === JewelryCategory.SILVER) rateStr = silverRatePer10g;
    else if (item.category === JewelryCategory.PLATINUM) rateStr = platinumRatePer10g;

    const rate = parseFloat(rateStr);
    if (!isNaN(rate) && rate > 0) {
        price = (item.weight / 10) * rate;
    }

    setSelectedItems(prev => [...prev, { 
      itemId: item.id, 
      serialNo: item.serialNo, 
      name: item.name,
      category: item.category, 
      weight: item.weight, 
      price: price,
      quantity: 1
    }]);
  };

  const handleRemoveItem = (itemId: string) => {
    setSelectedItems(prev => {
        const newItems = prev.filter(item => item.itemId !== itemId);
        if (newItems.length === 0) {
            setLockedCategory(null);
            setShowGoldRateInput(false);
            setShowSilverRateInput(false);
            setShowPlatinumRateInput(false);
        } else {
            const remainingCategories = new Set(newItems.map(i => {
                const inventoryItem = inventory.find(invI => invI.id === i.itemId);
                return inventoryItem?.category;
            }));
            if (!remainingCategories.has(JewelryCategory.GOLD)) setShowGoldRateInput(false);
            if (!remainingCategories.has(JewelryCategory.SILVER)) setShowSilverRateInput(false);
            if (!remainingCategories.has(JewelryCategory.PLATINUM)) setShowPlatinumRateInput(false);
        }
        return newItems;
    });
  };

  const handleBillTypeChange = (newType: BillType) => {
    setBillType(newType);

    // Perform check for both ESTIMATE and INVOICE
    const adjustments: string[] = [];
    const updatedItems = selectedItems.map(item => {
        const inventoryItem = inventory.find(i => i.id === item.itemId);
        if (inventoryItem && item.quantity > inventoryItem.quantity) {
            adjustments.push(`Quantity for "${item.name}" was reduced to ${inventoryItem.quantity} (max stock).`);
            return { ...item, quantity: inventoryItem.quantity };
        }
        return item;
    });
    
    if (adjustments.length > 0) {
        toast.error(adjustments.join('\n'));
        setSelectedItems(updatedItems);
    }
  };

  const handleItemWeightChange = (index: number, newWeightStr: string) => {
    if (!/^\d*\.?\d*$/.test(newWeightStr)) {
        return;
    }

    const itemToUpdate = selectedItems[index];
    if (!itemToUpdate) return;
    const inventoryItem = inventory.find(i => i.id === itemToUpdate.itemId);
    if (!inventoryItem) return;

    let cappedWeightStr = newWeightStr;
    const numericValue = parseFloat(newWeightStr);
    if (!isNaN(numericValue) && numericValue > inventoryItem.weight) {
        cappedWeightStr = String(inventoryItem.weight);
        toast.error(`Sell weight cannot exceed stock weight of ${inventoryItem.weight}g.`, { duration: 2000 });
    }

    setWeightInputs(prev => ({ ...prev, [itemToUpdate.itemId]: cappedWeightStr }));

    const finalNumericWeight = parseFloat(cappedWeightStr) || 0;

    setSelectedItems(prevItems => {
        const newItems = [...prevItems];
        
        let ratePer10g = 0;
        if (inventoryItem.category === JewelryCategory.GOLD) ratePer10g = parseFloat(goldRatePer10g) || 0;
        else if (inventoryItem.category === JewelryCategory.SILVER) ratePer10g = parseFloat(silverRatePer10g) || 0;
        else if (inventoryItem.category === JewelryCategory.PLATINUM) ratePer10g = parseFloat(platinumRatePer10g) || 0;
        
        const newPrice = ratePer10g > 0 ? (finalNumericWeight / 10) * ratePer10g : 0;

        newItems[index] = {
            ...itemToUpdate,
            weight: finalNumericWeight,
            price: newPrice,
            quantity: 1, 
        };
        
        return newItems;
    });
  };
  
    const generatePdfBlob = (componentToRender: React.ReactElement): Promise<Blob | null> => {
        return new Promise(resolve => {
            // @ts-ignore
            const { jsPDF } = window.jspdf;
            // @ts-ignore
            const html2canvas = window.html2canvas;

            const tempContainer = document.createElement('div');
            tempContainer.style.position = 'absolute';
            tempContainer.style.left = '-9999px';
            tempContainer.style.top = '0';
            tempContainer.style.zIndex = '-1';
            document.body.appendChild(tempContainer);

            const root = ReactDOM.createRoot(tempContainer);

            const captureAndCleanup = async () => {
                try {
                    const elementToCapture = tempContainer.children[0] as HTMLElement;
                    if (!elementToCapture) {
                        console.error("PDF generation failed: Component did not render.");
                        resolve(null);
                        return;
                    }
                    
                    const images = Array.from(elementToCapture.getElementsByTagName('img'));
                    await Promise.all(images.map(img => new Promise<void>(res => {
                        if (img.complete) return res();
                        img.onload = () => res();
                        img.onerror = () => res();
                    })));

                    await new Promise(r => setTimeout(r, 200));

                    const canvas = await html2canvas(elementToCapture, { scale: 2, useCORS: true, windowWidth: elementToCapture.scrollWidth, windowHeight: elementToCapture.scrollHeight });
                    const imgData = canvas.toDataURL('image/jpeg', 0.95);
                    
                    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a5' });
                    const pdfWidth = pdf.internal.pageSize.getWidth();
                    const pdfHeight = pdf.internal.pageSize.getHeight();
                    
                    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
                    resolve(pdf.output('blob'));

                } catch (error) {
                    console.error("Error during PDF generation process:", error);
                    resolve(null);
                } finally {
                    root.unmount();
                    if (document.body.contains(tempContainer)) {
                        document.body.removeChild(tempContainer);
                    }
                }
            };

            root.render(componentToRender);
            setTimeout(captureAndCleanup, 500);
        });
    };
  
  const resetForm = () => {
    setSelectedCustomerId(null);
    setSelectedItems([]);
    setBargainedAmount('');
    setOldItemBalance('');
    setLessWeight('');
    setMakingChargePercentage('');
    setWastagePercentage('');
    setSgstPercentage('');
    setCgstPercentage('');
    setBillType(BillType.ESTIMATE);
    setSubmissionStatus('idle');
    setGoldRatePer10g('');
    setSilverRatePer10g('');
    setPlatinumRatePer10g('');
    setShowGoldRateInput(false);
    setShowSilverRateInput(false);
    setShowPlatinumRateInput(false);
    setLockedCategory(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCustomerId || selectedItems.length === 0) {
        toast.error("Please select a customer and at least one item.");
        return;
    }

    if (selectedItems.some(item => item.price <= 0 || item.quantity <= 0)) {
        toast.error("Please ensure all items have a price and quantity greater than zero.");
        return;
    }

    // Perform check for both ESTIMATE and INVOICE
    for (const item of selectedItems) {
      const inventoryItem = inventory.find(i => i.id === item.itemId);
      if (inventoryItem && item.quantity > inventoryItem.quantity) {
        toast.error(`Error: Quantity for "${item.name}" (${item.quantity}) exceeds available stock (${inventoryItem.quantity}).`);
        return;
      }
    }

    const action = ((e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement)?.value || 'download';
    
    setSubmissionStatus('processing');

    try {
        const bill = await createBill({
          customerId: selectedCustomerId,
          type: billType,
          items: selectedItems,
          totalAmount: calculations.totalAmount,
          bargainedAmount: parseFloat(bargainedAmount) || 0,
          oldItemBalance: parseFloat(oldItemBalance) || 0,
          lessWeight: parseFloat(lessWeight) || 0,
          makingChargePercentage: parseFloat(makingChargePercentage) || 0,
          wastagePercentage: parseFloat(wastagePercentage) || 0,
          sgstPercentage: parseFloat(sgstPercentage) || 0,
          cgstPercentage: parseFloat(cgstPercentage) || 0,
          amountPaid: calculations.grandTotal, // All bills are fully paid
        });
        
        const customer = getCustomerById(selectedCustomerId);
        if (!customer) throw new Error("Customer not found after creating bill.");

        const blob = await generatePdfBlob(<InvoiceTemplate bill={bill} customer={customer} />);
        if (!blob) throw new Error("Failed to generate PDF.");

        setSubmissionStatus('success');
        toast.success('Bill created successfully!');

        if (action === 'send') {
            const itemsSummary = bill.items.map(item => `- ${item.name} (Qty: ${item.quantity})`).join('\n');
            const textMessage = `*DEVAGIRIKAR JEWELLERYS*\n\nHello ${customer.name},\nHere is your bill summary:\n\n*Bill ID:* ${bill.id}\n*Type:* ${bill.type}\n*Date:* ${new Date(bill.date).toLocaleDateString()}\n\n*Items:*\n${itemsSummary}\n\n*Grand Total:* ${bill.grandTotal.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}\n\nThank you!`;
            
            const cleanPhone = customer.phone.replace(/\D/g, '');
            const whatsappPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
            const encodedMessage = encodeURIComponent(textMessage);
            const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodedMessage}`;
            window.open(whatsappUrl, '_blank');
        } else { // Default to download
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${bill.type.toLowerCase()}-${bill.id}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }

        setTimeout(() => {
          resetForm();
        }, 1000);

    } catch (error) {
        console.error("Error processing bill:", error);
        toast.error(`An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setSubmissionStatus('idle');
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md space-y-4">
            <h2 className="text-xl font-bold">1. Customer & Items</h2>
            <div>
                <label className="block text-sm font-medium mb-1">Select Customer</label>
                 {selectedCustomer ? (
                    <div className="flex items-center justify-between p-2 bg-gray-100 rounded">
                        <span>{selectedCustomer.name} ({selectedCustomer.id})</span>
                        <button type="button" onClick={() => setSelectedCustomerId(null)} className="text-red-500 hover:text-red-700 text-sm">Change</button>
                    </div>
                 ) : (
                    <SearchableSelect<Customer>
                        options={customers}
                        placeholder="Search by name or ID..."
                        onSelect={(customer) => setSelectedCustomerId(customer.id)}
                        renderOption={(customer) => <span>{customer.name} ({customer.id})</span>}
                    />
                 )}
            </div>
             
             {lockedCategory && (
                <div className="p-2 bg-blue-50 text-blue-800 rounded-lg text-sm text-center border border-blue-200">
                    <p>Adding items from the <strong>{lockedCategory}</strong> category only.</p>
                </div>
            )}

             {(showGoldRateInput || showSilverRateInput || showPlatinumRateInput) && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t">
                    {showGoldRateInput && (
                        <div>
                            <label htmlFor="goldRate" className="block text-sm font-medium mb-1 text-yellow-600">Gold Rate (per 10g)</label>
                            <input
                                id="goldRate" type="number" value={goldRatePer10g}
                                onChange={e => setGoldRatePer10g(e.target.value)}
                                className="w-full p-2 border rounded" placeholder="e.g. 75000"
                                disabled={!selectedCustomerId} step="0.01"
                            />
                        </div>
                    )}
                    {showSilverRateInput && (
                        <div>
                            <label htmlFor="silverRate" className="block text-sm font-medium mb-1 text-gray-600">Silver Rate (per 10g)</label>
                            <input
                                id="silverRate" type="number" value={silverRatePer10g}
                                onChange={e => setSilverRatePer10g(e.target.value)}
                                className="w-full p-2 border rounded" placeholder="e.g. 900"
                                disabled={!selectedCustomerId} step="0.01"
                            />
                        </div>
                    )}
                    {showPlatinumRateInput && (
                        <div>
                            <label htmlFor="platinumRate" className="block text-sm font-medium mb-1 text-blue-600">Platinum Rate (per 10g)</label>
                            <input
                                id="platinumRate" type="number" value={platinumRatePer10g}
                                onChange={e => setPlatinumRatePer10g(e.target.value)}
                                className="w-full p-2 border rounded" placeholder="e.g. 2500"
                                disabled={!selectedCustomerId} step="0.01"
                            />
                        </div>
                    )}
                </div>
            )}
            
             <div>
                <label className="block text-sm font-medium mb-1">Add Items</label>
                <SearchableSelect<JewelryItem>
                    options={availableInventory}
                    placeholder="Search by name or serial no..."
                    onSelect={handleAddItem}
                    disabled={!selectedCustomerId}
                    renderOption={(item) => (
                        <div className="flex justify-between">
                            <span>{item.name} ({item.serialNo})</span>
                            <span className="text-sm text-gray-600">{item.weight}g</span>
                        </div>
                    )}
                />
            </div>
            <div className="mt-4 max-h-72 overflow-y-auto pr-2">
                 {selectedItems.map((item, index) => {
                     const inventoryItem = inventory.find(i => i.id === item.itemId);
                     return (
                        <div key={item.itemId} className="bg-gray-50 p-3 rounded mb-2 border">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-semibold">{item.name}</p>
                                    <p className="text-xs text-gray-500">
                                        S/N: {item.serialNo} | Stock: {inventoryItem?.weight.toFixed(4)}g
                                    </p>
                                </div>
                                <button type="button" onClick={() => handleRemoveItem(item.itemId)} className="text-red-500 hover:text-red-700 font-bold text-xl leading-none -mt-1 -mr-1">&times;</button>
                            </div>
                            <div className="mt-2 grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-gray-600">
                                        Sell Weight (g)
                                    </label>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        value={weightInputs[item.itemId] !== undefined ? weightInputs[item.itemId] : (item.weight === 0 ? '' : item.weight)}
                                        onChange={(e) => handleItemWeightChange(index, e.target.value)}
                                        onBlur={() => {
                                            setWeightInputs(prev => {
                                                const newInputs = {...prev};
                                                delete newInputs[item.itemId];
                                                return newInputs;
                                            });
                                        }}
                                        className="w-full p-1.5 border rounded"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-600">Price (₹)</label>
                                    <input
                                        type="text"
                                        value={(item.price * item.quantity).toLocaleString('en-IN')}
                                        className="w-full p-1.5 border rounded bg-gray-100" readOnly
                                    />
                                </div>
                            </div>
                        </div>
                     )
                 })}
            </div>
        </div>

        {/* Right Side: Summary and Payment */}
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">2. Summary & Payment</h2>
            <div className="space-y-4">
                <div className="space-y-2 text-sm border-b pb-4">
                     <div className="flex justify-between font-semibold"><span>Total Gross Wt:</span><span>{calculations.totalWeight.toFixed(4)} g</span></div>
                     <div className="flex justify-between"><span>Less Weight:</span><span>- {(parseFloat(lessWeight) || 0).toFixed(4)} g</span></div>
                     <div className="flex justify-between font-bold text-base border-t pt-1 mt-1"><span>Net Weight:</span><span>{calculations.netWeight.toFixed(4)} g</span></div>
                </div>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span>Subtotal (Gross):</span><span>₹{calculations.totalAmount.toLocaleString('en-IN')}</span></div>
                    {calculations.lessWeightValue > 0 && (
                        <div className="flex justify-between text-red-600"><span>Less Weight Value:</span><span>- ₹{calculations.lessWeightValue.toLocaleString('en-IN')}</span></div>
                    )}
                    <div className="flex justify-between font-bold"><span>Subtotal (Net):</span><span>₹{calculations.actualSubtotal.toLocaleString('en-IN')}</span></div>
                </div>
                
                <div className="border-t pt-4 space-y-4">
                    <div>
                        <label htmlFor="lessWeight" className="block text-sm font-medium">Less Weight (g)</label>
                        <input id="lessWeight" type="number" step="0.0001" value={lessWeight} onChange={e => setLessWeight(e.target.value)} className="w-full p-2 border rounded mt-1" placeholder="e.g. 1.5" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="makingCharge" className="block text-sm font-medium">Making (%)</label>
                            <input id="makingCharge" type="number" value={makingChargePercentage} onChange={e => setMakingChargePercentage(e.target.value)} className="w-full p-2 border rounded mt-1" placeholder="e.g. 12" />
                        </div>
                        <div>
                            <label htmlFor="wastage" className="block text-sm font-medium">Wastage (%)</label>
                            <input id="wastage" type="number" value={wastagePercentage} onChange={e => setWastagePercentage(e.target.value)} className="w-full p-2 border rounded mt-1" placeholder="e.g. 3" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="sgstPercentage" className="block text-sm font-medium">SGST (%)</label>
                            <input id="sgstPercentage" type="number" value={sgstPercentage} onChange={e => setSgstPercentage(e.target.value)} className="w-full p-2 border rounded mt-1" placeholder="e.g. 1.5" />
                        </div>
                        <div>
                            <label htmlFor="cgstPercentage" className="block text-sm font-medium">CGST (%)</label>
                            <input id="cgstPercentage" type="number" value={cgstPercentage} onChange={e => setCgstPercentage(e.target.value)} className="w-full p-2 border rounded mt-1" placeholder="e.g. 1.5" />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="oldItemBalance" className="block text-sm font-medium">Return Items (₹)</label>
                        <input id="oldItemBalance" type="number" step="0.01" value={oldItemBalance} onChange={e => setOldItemBalance(e.target.value)} className="w-full p-2 border rounded mt-1" placeholder="e.g. 1000" />
                    </div>
                    <div>
                        <label htmlFor="bargainedAmount" className="block text-sm font-medium">Discount (₹)</label>
                        <input id="bargainedAmount" type="number" step="0.01" value={bargainedAmount} onChange={e => setBargainedAmount(e.target.value)} className="w-full p-2 border rounded mt-1" placeholder="e.g. 500" />
                    </div>
                </div>

                <div className="space-y-1 text-sm border-t pt-4">
                     <div className="flex justify-between"><span>Making Charges ({makingChargePercentage || 0}%):</span><span>+ ₹{calculations.makingChargeAmount.toLocaleString('en-IN')}</span></div>
                     <div className="flex justify-between"><span>Wastage ({wastagePercentage || 0}%):</span><span>+ ₹{calculations.wastageAmount.toLocaleString('en-IN')}</span></div>
                     <div className="flex justify-between"><span>SGST ({sgstPercentage || 0}%):</span><span>+ ₹{calculations.sgstAmount.toLocaleString('en-IN')}</span></div>
                     <div className="flex justify-between"><span>CGST ({cgstPercentage || 0}%):</span><span>+ ₹{calculations.cgstAmount.toLocaleString('en-IN')}</span></div>
                     <div className="flex justify-between text-green-600"><span>Return Items:</span><span>- ₹{(parseFloat(oldItemBalance) || 0).toLocaleString('en-IN')}</span></div>
                     <div className="flex justify-between text-green-600"><span>Discount:</span><span>- ₹{(parseFloat(bargainedAmount) || 0).toLocaleString('en-IN')}</span></div>
                     <div className="flex justify-between text-xl mt-2 pt-2 border-t-2 border-brand-charcoal">
                        <span className="font-bold">Grand Total:</span>
                        <span className="font-bold">₹{calculations.grandTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                     </div>
                </div>

                 <div className="border-t pt-4 space-y-2">
                    <div className="flex space-x-2">
                        <button type="button" onClick={() => handleBillTypeChange(BillType.ESTIMATE)} className={`w-full py-2 rounded-lg font-semibold ${billType === BillType.ESTIMATE ? 'bg-brand-gold text-brand-charcoal' : 'bg-gray-200'}`}>Estimate</button>
                        <button type="button" onClick={() => handleBillTypeChange(BillType.INVOICE)} className={`w-full py-2 rounded-lg font-semibold ${billType === BillType.INVOICE ? 'bg-brand-gold text-brand-charcoal' : 'bg-gray-200'}`}>Invoice</button>
                    </div>
                    <div className="flex space-x-2">
                        <button type="submit" value="download" disabled={submissionStatus !== 'idle'} className="w-full p-3 bg-brand-charcoal text-white rounded-lg font-semibold hover:bg-black transition disabled:opacity-50">
                           {submissionStatus === 'processing' ? 'Processing...' : submissionStatus === 'success' ? 'Done!' : `Save & Download ${billType}`}
                        </button>
                        <button type="submit" value="send" disabled={submissionStatus !== 'idle'} className="w-full p-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center">
                            <SendIcon /> Send
                        </button>
                    </div>
                </div>
            </div>
        </div>
      </form>
    </div>
  );
};

export default BillingPage;