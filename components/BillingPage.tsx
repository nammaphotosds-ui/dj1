import React, { useState, useMemo, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { toast } from 'react-hot-toast';
import { useDataContext } from '../context/DataContext';
import { BillType, Page } from '../types';
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
    const { grandTotal, netWeight, makingChargeAmount, wastageAmount, bargainedAmount, finalAmount, amountPaid } = bill;
    const logoUrl = "https://ik.imagekit.io/9y4qtxuo0/IMG_20250927_202057_913.png?updatedAt=1758984948163";

    const isCompact = bill.items.length > 8;
    const tableCellClasses = isCompact ? 'py-0.5 px-2' : 'py-1 px-2';
    const tableBaseFontSize = isCompact ? 'text-[11px]' : 'text-xs';
    const isPaid = grandTotal - amountPaid <= 0.01;

    return (
        <div className="bg-brand-cream text-brand-charcoal font-sans flex flex-col" style={{ width: '842px', height: '595px', boxSizing: 'border-box' }}>
            <div className="flex-grow relative overflow-hidden">
                {/* Decorative Border */}
                <div className="absolute inset-0 border-[1px] border-brand-gold-dark/30 z-0"></div>
                <div className="absolute inset-2 border-[8px] border-brand-pale-gold z-0"></div>
                <div className="absolute inset-4 border-[1px] border-brand-gold-dark/50 z-0"></div>

                {/* Watermark */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 opacity-[0.06]">
                    <img src={logoUrl} alt="Watermark" className="w-[350px]"/>
                </div>
                
                <div className="relative z-10 p-8 flex flex-col h-full">
                    {/* Header */}
                    <header className="flex justify-between items-start pb-2 mb-2 border-b border-brand-gold-dark/30">
                        <div className="flex items-center">
                            <img src={logoUrl} alt="Logo" className="w-16 h-16" />
                            <div className="ml-3">
                                <h2 className="text-3xl font-serif tracking-wider font-bold text-brand-charcoal">DEVAGIRIKAR</h2>
                                <p className="text-lg text-brand-gold-dark tracking-[0.15em] -mt-1">JEWELLERYS</p>
                                <p className="text-[10px] tracking-widest text-brand-gray mt-1">Real Source of Purity</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <h1 className="text-5xl font-serif font-light text-brand-gold-dark tracking-widest">{bill.type}</h1>
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
                    <main>
                        <table className={`w-full border-collapse border border-brand-gold-dark/30 ${tableBaseFontSize}`} style={{ tableLayout: 'fixed' }}>
                            <thead className="border-b-2 border-brand-charcoal bg-brand-pale-gold/30">
                                <tr>
                                    <th className={`font-semibold text-left tracking-wider uppercase text-brand-charcoal w-[35%] border border-brand-gold-dark/30 ${tableCellClasses}`}>Item Name</th>
                                    <th className={`font-semibold text-left tracking-wider uppercase text-brand-charcoal w-[15%] border border-brand-gold-dark/30 ${tableCellClasses}`}>Item ID</th>
                                    <th className={`font-semibold text-right tracking-wider uppercase text-brand-charcoal w-[10%] border border-brand-gold-dark/30 ${tableCellClasses}`}>Weight (g)</th>
                                    <th className={`font-semibold text-right tracking-wider uppercase text-brand-charcoal w-[10%] border border-brand-gold-dark/30 ${tableCellClasses}`}>Qty</th>
                                    <th className={`font-semibold text-right tracking-wider uppercase text-brand-charcoal w-[15%] border border-brand-gold-dark/30 ${tableCellClasses}`}>Rate (₹)</th>
                                    <th className={`font-semibold text-right tracking-wider uppercase text-brand-charcoal w-[15%] border border-brand-gold-dark/30 ${tableCellClasses}`}>Amount (₹)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bill.items.map(item => {
                                    const quantity = item.quantity || 1;
                                    const amount = item.price * quantity;
                                    return (
                                        <tr key={item.itemId} className="border-b border-brand-gold-dark/20">
                                            <td className={`font-medium border border-brand-gold-dark/30 ${tableCellClasses}`} style={{ wordBreak: 'break-word' }}>{item.name}</td>
                                            <td className={`font-mono text-xs border border-brand-gold-dark/30 ${tableCellClasses}`}>{item.itemId}</td>
                                            <td className={`text-right font-mono border border-brand-gold-dark/30 ${tableCellClasses}`}>{item.weight.toFixed(3)}</td>
                                            <td className={`text-right font-mono border border-brand-gold-dark/30 ${tableCellClasses}`}>{quantity}</td>
                                            <td className={`text-right font-mono border border-brand-gold-dark/30 ${tableCellClasses}`}>{item.price.toLocaleString('en-IN')}</td>
                                            <td className={`text-right font-mono border border-brand-gold-dark/30 ${tableCellClasses}`}>{amount.toLocaleString('en-IN')}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </main>

                    {/* Summary Section */}
                    <section className="mt-auto pt-2 border-t border-brand-gold-dark/30">
                        <div className="flex justify-between items-start">
                             <div className="w-1/2 pr-4 text-xs">
                                <p className="font-bold text-gray-700 capitalize">{numberToWords(grandTotal)}</p>
                                <div className="mt-4 text-[10px] text-brand-gray">
                                    <p className="font-bold">Terms & Conditions:</p>
                                    <p>1. Goods once sold will not be taken back.</p>
                                </div>
                            </div>
                            <div className="w-1/2 text-xs">
                                <div className="space-y-1">
                                    <div className="flex justify-between"><span>Gross Wt:</span><span>{totalGrossWeight.toFixed(3)} g</span></div>
                                    {bill.lessWeight > 0 && <div className="flex justify-between"><span>Less Wt:</span><span>- {bill.lessWeight.toFixed(3)} g</span></div>}
                                    <div className="flex justify-between font-bold border-t border-gray-200 mt-1 pt-1"><span>Net Wt:</span><span>{netWeight.toFixed(3)} g</span></div>
                                </div>
                                <div className="space-y-1 mt-2 pt-2 border-t border-gray-200">
                                    <div className="flex justify-between"><span>Subtotal:</span><span>₹{finalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
                                    {makingChargeAmount > 0 && <div className="flex justify-between"><span>Making Charges ({bill.makingChargePercentage}%):</span><span>+ ₹{makingChargeAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>}
                                    {wastageAmount > 0 && <div className="flex justify-between"><span>Wastage ({bill.wastagePercentage}%):</span><span>+ ₹{wastageAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>}
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
                                        <span className="font-bold">{isPaid ? 'Fully Paid' : 'Partial Payment'}</span>
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
                                <div className="w-40 border-t border-brand-charcoal pt-1"></div>
                                <p className="text-[10px]">Authorised Signatory</p>
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
  const [makingChargePercentage, setMakingChargePercentage] = useState('');
  const [wastagePercentage, setWastagePercentage] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  
  const selectedCustomer = useMemo(() => {
    return customers.find(c => c.id === selectedCustomerId);
  }, [selectedCustomerId, customers]);

  const availableInventory = useMemo(() => {
    return inventory.filter(item => item.quantity > 0 && !selectedItems.some(si => si.itemId === item.id));
  }, [inventory, selectedItems]);

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

    const ba = parseFloat(bargainedAmount) || 0;
    const grandTotal = actualSubtotal + makingChargeAmount + wastageAmount - ba;

    const netWeight = totalWeight - lw;

    return { 
        totalAmount: subtotalBeforeLessWeight,
        lessWeightValue,
        actualSubtotal,
        makingChargeAmount,
        wastageAmount,
        grandTotal, 
        totalWeight, 
        netWeight 
    };
  }, [selectedItems, bargainedAmount, makingChargePercentage, wastagePercentage, lessWeight]);

  useEffect(() => {
      if (calculations.grandTotal > 0) {
          setAmountPaid(calculations.grandTotal.toFixed(2));
      } else {
          setAmountPaid('');
      }
  }, [calculations.grandTotal]);

  const handleAddItem = (item: JewelryItem) => {
      setSelectedItems(prev => [...prev, { itemId: item.id, name: item.name, weight: item.weight, price: 0, quantity: 1 }]);
  };

  const handleRemoveItem = (itemId: string) => {
    setSelectedItems(prev => prev.filter(item => item.itemId !== itemId));
  };

  const handleBillTypeChange = (newType: BillType) => {
    setBillType(newType);

    if (newType === BillType.INVOICE) {
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
            toast.warn(adjustments.join('\n'));
            setSelectedItems(updatedItems);
        }
    }
  };
  
  const handleQuantityChange = (itemId: string, newQuantityStr: string) => {
    const newQuantity = parseInt(newQuantityStr, 10);
    const inventoryItem = inventory.find(i => i.id === itemId);

    if (!inventoryItem) return;

    if (isNaN(newQuantity) || newQuantity < 1) {
        setSelectedItems(prev => prev.map(item => item.itemId === itemId ? { ...item, quantity: 1 } : item));
        return;
    }
    
    if (billType === BillType.INVOICE && newQuantity > inventoryItem.quantity) {
        toast.error(`Cannot add more than available stock (${inventoryItem.quantity}). Adjusting quantity to max available.`);
        setSelectedItems(prev => prev.map(item => item.itemId === itemId ? { ...item, quantity: inventoryItem.quantity } : item));
        return;
    }

    setSelectedItems(prev => prev.map(item => item.itemId === itemId ? { ...item, quantity: newQuantity } : item));
  };
  
  const handleItemPriceChange = (itemId: string, newPriceStr: string) => {
    const newPrice = parseFloat(newPriceStr);
    setSelectedItems(prev => prev.map(item => item.itemId === itemId ? { ...item, price: isNaN(newPrice) ? 0 : newPrice } : item));
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
                    const margin = 8;
                    const pdfWidth = pdf.internal.pageSize.getWidth();
                    const pdfHeight = pdf.internal.pageSize.getHeight();
                    const contentWidth = pdfWidth - margin * 2;
                    const contentHeight = pdfHeight - margin * 2;
                    
                    pdf.addImage(imgData, 'JPEG', margin, margin, contentWidth, contentHeight);
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
    setLessWeight('');
    setMakingChargePercentage('');
    setWastagePercentage('');
    setAmountPaid('');
    setBillType(BillType.ESTIMATE);
    setSubmissionStatus('idle');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCustomerId || selectedItems.length === 0) {
        toast.error("Please select a customer and at least one item.");
        return;
    }

    if (selectedItems.some(item => item.price <= 0)) {
        toast.error("Please ensure all items have a price greater than zero.");
        return;
    }

    if (billType === BillType.INVOICE) {
      for (const item of selectedItems) {
        const inventoryItem = inventory.find(i => i.id === item.itemId);
        if (inventoryItem && item.quantity > inventoryItem.quantity) {
          toast.error(`Error: Quantity for "${item.name}" (${item.quantity}) exceeds available stock (${inventoryItem.quantity}).`);
          return;
        }
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
          lessWeight: parseFloat(lessWeight) || 0,
          makingChargePercentage: parseFloat(makingChargePercentage) || 0,
          wastagePercentage: parseFloat(wastagePercentage) || 0,
          amountPaid: parseFloat(amountPaid) || 0,
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
            <div className="mt-4 max-h-64 overflow-y-auto pr-2">
                 {selectedItems.map(item => (
                    <div key={item.itemId} className="bg-gray-50 p-3 rounded mb-2 border">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-semibold">{item.name}</p>
                                <p className="text-xs text-gray-500">{item.itemId} | {item.weight.toFixed(3)}g</p>
                            </div>
                            <button type="button" onClick={() => handleRemoveItem(item.itemId)} className="text-red-500 hover:text-red-700 font-bold text-xl leading-none -mt-1 -mr-1">&times;</button>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor={`price-${item.itemId}`} className="text-xs font-medium text-gray-600">Price (₹)</label>
                                <input id={`price-${item.itemId}`} type="number" value={item.price} onChange={(e) => handleItemPriceChange(item.itemId, e.target.value)} className="w-full p-1.5 border rounded" placeholder="0.00" step="0.01" min="0" required />
                            </div>
                            <div>
                                <label htmlFor={`qty-${item.itemId}`} className="text-xs font-medium text-gray-600">Quantity</label>
                                <input id={`qty-${item.itemId}`} type="number" value={item.quantity} onChange={e => handleQuantityChange(item.itemId, e.target.value)} className="w-full p-1.5 border rounded" min="1" step="1" required />
                            </div>
                        </div>
                    </div>
                 ))}
            </div>
        </div>

        {/* Right Side: Summary and Payment */}
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">2. Summary & Payment</h2>
            <div className="space-y-4">
                <div className="space-y-2 text-sm border-b pb-4">
                     <div className="flex justify-between font-semibold"><span>Total Gross Wt:</span><span>{calculations.totalWeight.toFixed(3)} g</span></div>
                     <div className="flex justify-between"><span>Less Weight:</span><span>- {(parseFloat(lessWeight) || 0).toFixed(3)} g</span></div>
                     <div className="flex justify-between font-bold text-base border-t pt-1 mt-1"><span>Net Weight:</span><span>{calculations.netWeight.toFixed(3)} g</span></div>
                </div>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span>Subtotal (Gross):</span><span>₹{calculations.totalAmount.toLocaleString('en-IN')}</span></div>
                    {calculations.lessWeightValue > 0 && (
                        <div className="flex justify-between text-blue-600"><span>Less Weight Value:</span><span>- ₹{calculations.lessWeightValue.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></div>
                    )}
                    <div className="flex justify-between font-semibold border-t pt-1 mt-1"><span>Net Amount:</span><span>₹{calculations.actualSubtotal.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></div>
                    <div className="flex justify-between"><span>Making Charges ({(parseFloat(makingChargePercentage) || 0)}%):</span><span className="text-orange-600">+ ₹{calculations.makingChargeAmount.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></div>
                    <div className="flex justify-between"><span>Wastage ({(parseFloat(wastagePercentage) || 0)}%):</span><span className="text-orange-600">+ ₹{calculations.wastageAmount.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></div>
                    <div className="flex justify-between"><span>Discount:</span><span className="text-green-600">- ₹{(parseFloat(bargainedAmount) || 0).toLocaleString('en-IN')}</span></div>
                    <div className="flex justify-between font-bold text-lg border-t-2 border-brand-charcoal pt-2 mt-2"><span>Grand Total:</span><span className="text-brand-gold-dark">₹{calculations.grandTotal.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium">Less Weight (g)</label><input type="number" step="0.001" value={lessWeight} onChange={e => setLessWeight(e.target.value)} className="w-full p-2 border rounded" placeholder="0.000"/></div>
                    <div><label className="block text-sm font-medium">Discount (₹)</label><input type="number" value={bargainedAmount} onChange={e => setBargainedAmount(e.target.value)} className="w-full p-2 border rounded" placeholder="0.00"/></div>
                </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium">Making Charge (%)</label><input type="number" value={makingChargePercentage} onChange={e => setMakingChargePercentage(e.target.value)} className="w-full p-2 border rounded" placeholder="0"/></div>
                    <div><label className="block text-sm font-medium">Wastage (%)</label><input type="number" value={wastagePercentage} onChange={e => setWastagePercentage(e.target.value)} className="w-full p-2 border rounded" placeholder="0"/></div>
                </div>
                 <div>
                    <label className="block text-sm font-medium">Amount Paid (₹)</label>
                    <input type="number" value={amountPaid} onChange={e => setAmountPaid(e.target.value)} className="w-full p-2 border rounded" placeholder="0.00" required />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Bill Type</label>
                    <div className="flex gap-4">
                        <label className="flex items-center"><input type="radio" name="billType" value={BillType.ESTIMATE} checked={billType === BillType.ESTIMATE} onChange={() => handleBillTypeChange(BillType.ESTIMATE)} className="mr-2"/> Estimate</label>
                        <label className="flex items-center"><input type="radio" name="billType" value={BillType.INVOICE} checked={billType === BillType.INVOICE} onChange={() => handleBillTypeChange(BillType.INVOICE)} className="mr-2"/> Invoice</label>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">An 'Invoice' will deduct items from inventory. An 'Estimate' will not.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                    <button type="submit" value="download" disabled={submissionStatus !== 'idle'} className="w-full bg-brand-gold text-brand-charcoal p-3 rounded-lg font-semibold hover:bg-brand-gold-dark transition disabled:bg-gray-400 disabled:opacity-70">
                        {submissionStatus === 'processing' ? 'Processing...' : submissionStatus === 'success' ? 'Success!' : 'Create & Download PDF'}
                    </button>
                    <button type="submit" value="send" disabled={submissionStatus !== 'idle'} className="w-full flex items-center justify-center bg-green-600 text-white p-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-gray-400 disabled:opacity-70">
                        <SendIcon />
                        {submissionStatus === 'processing' ? 'Processing...' : submissionStatus === 'success' ? 'Success!' : 'Create & Send'}
                    </button>
                </div>
            </div>
        </div>
      </form>
    </div>
  );
};

export default BillingPage;