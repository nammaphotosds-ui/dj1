import React, { useState, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { toast } from 'react-hot-toast';
import { useDataContext } from '../context/DataContext';
import { useUIContext } from '../context/UIContext';
import { useAuthContext } from '../context/AuthContext';
import type { Customer, Bill, BillItem } from '../types';
import Avatar from './common/Avatar';
import Modal from './common/Modal';
import { AddUserIcon, SendIcon } from './common/Icons';

// --- Helper Functions & Components (Copied from BillingPage for PDF Generation) ---

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

const InvoiceTemplate: React.FC<{bill: Bill, customer: Customer}> = ({bill, customer}) => {
    const totalGrossWeight = bill.items.reduce((sum, item) => sum + (item.weight * (item.quantity || 1)), 0);
    const { grandTotal, netWeight, makingChargeAmount, wastageAmount, bargainedAmount, finalAmount, amountPaid } = bill;
    const logoUrl = "https://ik.imagekit.io/9y4qtxuo0/IMG_20250927_202057_913.png?updatedAt=1758984948163";

    const isCompact = bill.items.length > 8;
    const tableCellClasses = isCompact ? 'py-0.5 px-2' : 'py-1 px-2';
    const tableBaseFontSize = isCompact ? 'text-[11px]' : 'text-xs';
    const isPaid = grandTotal - amountPaid <= 0.01;

    return (
        <div className="bg-brand-cream text-brand-charcoal font-sans flex flex-col" style={{ width: '842px', minHeight: '595px', boxSizing: 'border-box' }}>
            <div className="flex-grow relative overflow-hidden p-8">
                <div className="absolute inset-0 border-[1px] border-brand-gold-dark/30 z-0"></div>
                <div className="absolute inset-2 border-[8px] border-brand-pale-gold z-0"></div>
                <div className="absolute inset-4 border-[1px] border-brand-gold-dark/50 z-0"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 opacity-[0.06]">
                    <img src={logoUrl} alt="Watermark" className="w-[350px]"/>
                </div>
                <div className="relative z-10 flex flex-col h-full">
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
                    <section className="text-xs mb-2">
                        <p className="text-brand-gray text-xs font-bold uppercase tracking-wider">Billed To</p>
                        <p className="font-bold text-base text-brand-charcoal font-serif">{customer.name} ({customer.id})</p>
                        <p className="text-brand-gray">{customer.phone}</p>
                    </section>
                    <main className="flex-grow">
                        <table className={`w-full border-collapse border border-brand-gold-dark/30 ${tableBaseFontSize}`} style={{ tableLayout: 'fixed' }}>
                            <thead className="border-b-2 border-brand-charcoal bg-brand-pale-gold/30">
                                <tr>
                                    <th className={`font-semibold text-left tracking-wider uppercase text-brand-charcoal w-[45%] border border-brand-gold-dark/30 ${tableCellClasses}`}>Item Name</th>
                                    <th className={`font-semibold text-left tracking-wider uppercase text-brand-charcoal w-[15%] border border-brand-gold-dark/30 ${tableCellClasses}`}>Item ID</th>
                                    <th className={`font-semibold text-right tracking-wider uppercase text-brand-charcoal w-[10%] border border-brand-gold-dark/30 ${tableCellClasses}`}>Weight (g)</th>
                                    <th className={`font-semibold text-right tracking-wider uppercase text-brand-charcoal w-[15%] border border-brand-gold-dark/30 ${tableCellClasses}`}>Rate (₹)</th>
                                    <th className={`font-semibold text-right tracking-wider uppercase text-brand-charcoal w-[15%] border border-brand-gold-dark/30 ${tableCellClasses}`}>Amount (₹)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bill.items.map((item: BillItem) => {
                                    const quantity = item.quantity || 1;
                                    const amount = item.price * quantity;
                                    return (
                                        <tr key={item.itemId} className="border-b border-brand-gold-dark/20">
                                            <td className={`font-medium border border-brand-gold-dark/30 ${tableCellClasses}`} style={{ wordBreak: 'break-word' }}>
                                                {item.name}
                                                {item.category && <span className="text-gray-500 font-normal"> ({item.category})</span>}
                                            </td>
                                            <td className={`font-mono text-xs border border-brand-gold-dark/30 ${tableCellClasses}`}>{item.serialNo}</td>
                                            <td className={`text-right font-mono border border-brand-gold-dark/30 ${tableCellClasses}`}>{item.weight.toFixed(3)}</td>
                                            <td className={`text-right font-mono border border-brand-gold-dark/30 ${tableCellClasses}`}>{item.price.toLocaleString('en-IN')}</td>
                                            <td className={`text-right font-mono border border-brand-gold-dark/30 ${tableCellClasses}`}>{amount.toLocaleString('en-IN')}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </main>
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
                                    src="https://ik.imagekit.io/9y4qtxuo0/IMG-20251002-WA0002%20(1).png?updatedAt=1759414755" 
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

const CustomerProfileTemplate: React.FC<{ customer: Customer; bills: Bill[] }> = ({ customer, bills }) => {
    const totalSpent = bills.reduce((sum, bill) => sum + bill.grandTotal, 0);
    const lastTransactionDate = bills.length > 0 ? new Date(bills[0].date).toLocaleDateString() : 'N/A';
    const logoUrl = "https://ik.imagekit.io/9y4qtxuo0/IMG_20250927_202057_913.png?updatedAt=1758984948163";

    return (
        <div className="bg-brand-cream text-brand-charcoal font-sans flex flex-col p-8" style={{ width: '842px', minHeight: '595px', boxSizing: 'border-box' }}>
            {/* Header */}
            <header className="flex justify-between items-start pb-4 mb-4 border-b border-brand-gold-dark/30">
                <div className="flex items-center">
                    <img src={logoUrl} alt="Logo" className="w-16 h-16" />
                    <div className="ml-3">
                        <h2 className="text-3xl font-serif tracking-wider font-bold text-brand-charcoal">DEVAGIRIKAR</h2>
                        <p className="text-lg text-brand-gold-dark tracking-[0.15em] -mt-1">JEWELLERYS</p>
                    </div>
                </div>
                <div className="text-right">
                    <h1 className="text-4xl font-serif font-light text-brand-gold-dark tracking-widest">Customer Profile</h1>
                    <p className="text-xs mt-1 font-mono"><strong>Generated:</strong> {new Date().toLocaleDateString()}</p>
                </div>
            </header>

            {/* Customer Details */}
            <section className="mb-6">
                <h3 className="text-xl font-bold font-serif mb-2">Customer Information</h3>
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                    <div><strong>Name:</strong> <span className="font-medium">{customer.name}</span></div>
                    <div><strong>Customer ID:</strong> <span className="font-mono">{customer.id}</span></div>
                    <div><strong>Phone:</strong> <span className="font-medium">{customer.phone}</span></div>
                    <div><strong>Join Date:</strong> <span className="font-mono">{new Date(customer.joinDate).toLocaleDateString()}</span></div>
                </div>
            </section>

            {/* Summary */}
            <section className="mb-6">
                <h3 className="text-xl font-bold font-serif mb-2">Transaction Summary</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-white p-4 rounded-lg shadow-md border">
                        <p className="text-sm text-gray-500">Total Spent</p>
                        <p className="text-2xl font-bold">₹{totalSpent.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-md border">
                        <p className="text-sm text-gray-500">Total Invoices</p>
                        <p className="text-2xl font-bold">{bills.length}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-md border">
                        <p className="text-sm text-gray-500">Last Purchase</p>
                        <p className="text-2xl font-bold">{lastTransactionDate}</p>
                    </div>
                </div>
            </section>

            {/* Transaction History */}
            <section>
                <h3 className="text-xl font-bold font-serif mb-2">Transaction History</h3>
                <table className="w-full border-collapse border border-brand-gold-dark/30 text-xs">
                    <thead className="border-b-2 border-brand-charcoal bg-brand-pale-gold/30">
                        <tr>
                            <th className="font-semibold text-left p-2">Bill ID</th>
                            <th className="font-semibold text-left p-2">Date</th>
                            <th className="font-semibold text-left p-2">Type</th>
                            <th className="font-semibold text-right p-2">Amount (₹)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bills.map(bill => (
                            <tr key={bill.id} className="border-b border-brand-gold-dark/20">
                                <td className="p-2 font-mono">{bill.id}</td>
                                <td className="p-2">{new Date(bill.date).toLocaleDateString()}</td>
                                <td className="p-2">{bill.type}</td>
                                <td className="p-2 text-right font-mono">{bill.grandTotal.toLocaleString('en-IN')}</td>
                            </tr>
                        ))}
                         {bills.length === 0 && (
                            <tr>
                                <td colSpan={4} className="text-center p-8 text-gray-500">No transactions found for this customer.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </section>
        </div>
    );
};

// --- Page Components ---

const BillPaymentForm: React.FC<{
    bill: Bill;
    onClose: () => void;
    recordPaymentForBill: (billId: string, amount: number) => Promise<void>;
}> = ({ bill, onClose, recordPaymentForBill }) => {
    const dueAmount = bill.grandTotal - bill.amountPaid;
    const [amount, setAmount] = useState(dueAmount.toFixed(2));
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const paymentAmount = parseFloat(amount);
        if (isNaN(paymentAmount) || paymentAmount <= 0) {
            toast.error("Please enter a valid positive amount.");
            return;
        }
        if (paymentAmount > dueAmount + 0.01) {
             toast.error(`Payment cannot exceed the due amount of ₹${dueAmount.toFixed(2)}.`);
            return;
        }
        
        setIsSaving(true);
        try {
            await recordPaymentForBill(bill.id, paymentAmount);
            toast.success("Payment recorded successfully!");
            onClose();
        } catch (error) {
            toast.error("Failed to record payment.");
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <p><strong>Customer:</strong> {bill.customerName}</p>
                <p><strong>Total Bill:</strong> ₹{bill.grandTotal.toLocaleString('en-IN')}</p>
                <p><strong>Amount Paid:</strong> ₹{bill.amountPaid.toLocaleString('en-IN')}</p>
                <p className="font-bold text-red-600"><strong>Amount Due:</strong> ₹{dueAmount.toLocaleString('en-IN')}</p>
            </div>
            <div>
                <label htmlFor="paymentAmount" className="block text-sm font-medium text-gray-700">Payment Amount (₹)</label>
                <input
                    type="number"
                    id="paymentAmount"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm text-lg"
                    step="0.01"
                    max={dueAmount.toFixed(2)}
                    required
                    autoFocus
                />
            </div>
            <div className="flex justify-end gap-3">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button>
                <button type="submit" disabled={isSaving} className="px-6 py-2 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700 disabled:bg-gray-400">
                    {isSaving ? 'Saving...' : 'Submit Payment'}
                </button>
            </div>
        </form>
    );
};

const BirthdayReminders: React.FC = () => {
    const { customers } = useDataContext();

    const upcomingBirthdays = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30);
        
        return customers
            .filter(c => !!c.dob)
            .map(c => {
                const dob = new Date(c.dob + 'T00:00:00');
                let nextBirthday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
                
                if (nextBirthday < today) {
                    nextBirthday.setFullYear(today.getFullYear() + 1);
                }
                
                return { ...c, nextBirthday };
            })
            .filter(c => c.nextBirthday >= today && c.nextBirthday <= thirtyDaysFromNow)
            .sort((a, b) => a.nextBirthday.getTime() - b.nextBirthday.getTime());

    }, [customers]);

    const handleSendWish = (customer: Customer) => {
        const message = `🎉 Happy Birthday, ${customer.name}! 🎂\n\nWishing you a day filled with joy and a year full of success. Best wishes from all of us at DEVAGIRIKAR JEWELLERYS! ✨`;
        const cleanPhone = customer.phone.replace(/\D/g, '');
        const whatsappPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodedMessage}`;
        window.open(whatsappUrl, '_blank');
        toast.success(`Opening WhatsApp for ${customer.name}...`);
    };

    if (upcomingBirthdays.length === 0) {
        return null;
    }

    return (
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-md border border-gray-100">
            <h2 className="text-xl font-bold mb-4">Upcoming Birthdays</h2>
            <div className="space-y-3 max-h-72 overflow-y-auto">
                {upcomingBirthdays.map(customer => (
                    <div key={customer.id} className="flex items-center justify-between text-sm p-2 rounded-md hover:bg-gray-50">
                        <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full mr-3 bg-brand-gold-light flex items-center justify-center font-bold text-brand-gold-dark text-lg flex-shrink-0">
                                🎂
                            </div>
                            <div>
                                <p className="font-semibold">{customer.name}</p>
                                <p className="text-xs text-gray-500">{customer.nextBirthday.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}</p>
                            </div>
                        </div>
                        <button onClick={() => handleSendWish(customer)} className="bg-green-100 text-green-800 px-3 py-1 rounded-md text-xs font-semibold hover:bg-green-200 transition">
                            Send Wish
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

const FestivalGreetings: React.FC = () => {
    const { customers } = useDataContext();
    const [message, setMessage] = useState("Warm festival greetings from DEVAGIRIKAR JEWELLERYS! ✨\n\nMay this festive season bring you and your family joy, prosperity, and good fortune.");
    const [searchTerm, setSearchTerm] = useState('');

    const filteredCustomers = useMemo(() => {
        if (!searchTerm) return customers;
        return customers.filter(c =>
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.phone.includes(searchTerm)
        );
    }, [customers, searchTerm]);
    
    const handleSendGreeting = (customer: Customer) => {
        if (!message.trim()) {
            toast.error("Please write a greeting message first.");
            return;
        }
        const cleanPhone = customer.phone.replace(/\D/g, '');
        const whatsappPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodedMessage}`;
        window.open(whatsappUrl, '_blank');
    };

    return (
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-md border border-gray-100">
            <h2 className="text-xl font-bold mb-4">Send Festival Greetings</h2>
            <div>
                <label htmlFor="festivalMessage" className="block text-sm font-medium text-gray-700 mb-1">Greeting Message</label>
                <textarea
                    id="festivalMessage"
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full p-2 border rounded-md"
                    placeholder="Enter your festival greeting message here..."
                />
            </div>
            <div className="mt-4">
                <input
                    type="text"
                    placeholder="Search customers to send greetings..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-2 border rounded-md"
                />
            </div>
            <div className="mt-4 max-h-60 overflow-y-auto space-y-2 pr-2">
                {filteredCustomers.map(customer => (
                    <div key={customer.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                        <div>
                            <p className="font-semibold">{customer.name}</p>
                            <p className="text-xs text-gray-500">{customer.phone}</p>
                        </div>
                        <button 
                            onClick={() => handleSendGreeting(customer)} 
                            disabled={!message.trim()}
                            className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-md text-xs font-semibold hover:bg-blue-200 transition disabled:bg-gray-200 disabled:text-gray-500"
                        >
                            <SendIcon /> Send
                        </button>
                    </div>
                ))}
                 {filteredCustomers.length === 0 && <p className="text-center text-gray-500 py-4">No customers found.</p>}
            </div>
        </div>
    );
}


const CustomerDetailView: React.FC<{ customer: Customer, onBack: () => void }> = ({ customer, onBack }) => {
    const { getBillsByCustomerId, deleteCustomer, userNameMap, recordPaymentForBill } = useDataContext();
    const bills = getBillsByCustomerId(customer.id);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [generatingPdfForBillId, setGeneratingPdfForBillId] = useState<string | null>(null);
    const [billToPay, setBillToPay] = useState<Bill | null>(null);

    const generatePdf = async (componentToRender: React.ReactElement, fileName: string) => {
        // @ts-ignore
        const { jsPDF } = window.jspdf;
        // @ts-ignore
        const html2canvas = window.html2canvas;

        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        document.body.appendChild(tempContainer);
        const root = ReactDOM.createRoot(tempContainer);
        
        root.render(componentToRender);
        
        await new Promise(resolve => setTimeout(resolve, 500)); 

        try {
            const elementToCapture = tempContainer.children[0] as HTMLElement;
            const canvas = await html2canvas(elementToCapture, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            
            const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a5' });
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(fileName);
        } finally {
            root.unmount();
            document.body.removeChild(tempContainer);
        }
    };

    const handleDownloadProfile = async () => {
        setIsGeneratingPdf(true);
        await generatePdf(<CustomerProfileTemplate customer={customer} bills={bills} />, `customer-profile-${customer.id}.pdf`);
        setIsGeneratingPdf(false);
    }
    
    const handleDownloadBill = async (bill: Bill) => {
        setGeneratingPdfForBillId(bill.id);
        await generatePdf(<InvoiceTemplate bill={bill} customer={customer} />, `${bill.type.toLowerCase()}-${bill.id}.pdf`);
        setGeneratingPdfForBillId(null);
    }
    
    const handleDelete = () => {
        if (window.confirm(`Are you sure you want to delete ${customer.name}? This will remove all associated bills and cannot be undone.`)) {
            deleteCustomer(customer.id);
            onBack();
        }
    };

    return (
        <div>
            <button onClick={onBack} className="flex items-center text-gray-600 hover:text-brand-charcoal transition mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                Back to Customer List
            </button>
            <div className="bg-white p-6 rounded-lg shadow-md border">
                <div className="flex flex-col md:flex-row justify-between md:items-center">
                    <div className="flex items-center mb-4 md:mb-0">
                        <Avatar name={customer.name} className="w-16 h-16 text-3xl" />
                        <div className="ml-4">
                            <h2 className="text-2xl font-bold">{customer.name}</h2>
                            <p className="text-gray-600">{customer.phone}</p>
                            <p className="text-sm font-mono text-gray-500">{customer.id}</p>
                            <p className="text-xs text-gray-500 mt-1 capitalize">
                                Created by: <span className="font-semibold">{userNameMap.get(customer.createdBy) || customer.createdBy}</span>
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleDownloadProfile} disabled={isGeneratingPdf} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400">
                            {isGeneratingPdf ? 'Generating...' : 'Download Profile'}
                        </button>
                        <button onClick={handleDelete} className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition">
                            Delete
                        </button>
                    </div>
                </div>

                <div className="mt-6 border-t pt-4">
                    <h3 className="text-lg font-bold mb-2">Transaction History</h3>
                    <div className="max-h-96 overflow-y-auto">
                        {bills.length > 0 ? (
                            <div className="space-y-2">
                            {bills.map(bill => {
                                const dueAmount = bill.grandTotal - bill.amountPaid;
                                const isUnpaid = dueAmount > 0.01;

                                return (
                                    <div key={bill.id} className="border-b p-3 flex flex-col sm:flex-row justify-between sm:items-center hover:bg-gray-50 rounded-md transition cursor-pointer" onClick={() => handleDownloadBill(bill)}>
                                        <div className="flex-1 mb-2 sm:mb-0">
                                            <p className="font-semibold">{bill.type} - {new Date(bill.date).toLocaleDateString()}</p>
                                            <p className="text-xs text-gray-500 font-mono">{bill.id}</p>
                                            <p className="text-xs text-gray-500 capitalize">Billed by: {userNameMap.get(bill.createdBy) || bill.createdBy}</p>
                                        </div>
                                        <div className="text-right flex flex-col items-end gap-2">
                                            <p className="font-bold">₹{bill.grandTotal.toLocaleString('en-IN')}</p>
                                            {isUnpaid ? (
                                                <>
                                                    <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded-full">
                                                        Due: ₹{dueAmount.toLocaleString('en-IN')}
                                                    </span>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); setBillToPay(bill); }}
                                                        className="text-xs bg-green-600 text-white px-3 py-1 rounded-md font-semibold hover:bg-green-700 transition"
                                                    >
                                                        Record Payment
                                                    </button>
                                                </>
                                            ) : (
                                                <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded-full">
                                                    ✓ Fully Paid
                                                </span>
                                            )}
                                            
                                        </div>
                                    </div>
                                );
                            })}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center py-8">No transactions found.</p>
                        )}
                    </div>
                </div>
            </div>

            <Modal isOpen={!!billToPay} onClose={() => setBillToPay(null)} title={`Record Payment for Bill ${billToPay?.id}`}>
                {billToPay && (
                    <BillPaymentForm 
                        bill={billToPay} 
                        onClose={() => setBillToPay(null)}
                        recordPaymentForBill={recordPaymentForBill}
                    />
                )}
            </Modal>
        </div>
    );
};

const CustomerListView: React.FC<{ onCustomerSelect: (customer: Customer) => void }> = ({ onCustomerSelect }) => {
    const { customers } = useDataContext();
    const [searchTerm, setSearchTerm] = useState('');
    const { openAddCustomerModal } = useUIContext();

    const filteredCustomers = useMemo(() => {
        return customers.filter(c =>
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.phone.includes(searchTerm) ||
            c.id.toLowerCase().includes(searchTerm.toLowerCase())
        ).sort((a,b) => new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime());
    }, [customers, searchTerm]);

    return (
        <div className="bg-white p-6 rounded-lg shadow-md border">
            <div className="flex flex-col md:flex-row gap-4 mb-4">
                <input
                    type="text"
                    placeholder="Search customers by name, phone, or ID..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full p-3 border rounded-lg flex-grow"
                />
                 <button 
                    onClick={openAddCustomerModal}
                    className="hidden md:flex items-center justify-center px-4 py-2 bg-brand-gold text-brand-charcoal rounded-lg font-semibold hover:bg-brand-gold-dark transition whitespace-nowrap"
                >
                    <AddUserIcon /> <span className="ml-2">Add Customer</span>
                </button>
            </div>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {filteredCustomers.map(customer => (
                    <div key={customer.id} onClick={() => onCustomerSelect(customer)} className="flex items-center p-3 hover:bg-brand-gold-light rounded-lg cursor-pointer transition">
                        <Avatar name={customer.name} className="w-12 h-12 mr-4" />
                        <div className="flex-grow">
                            <p className="font-bold">{customer.name}</p>
                            <p className="text-sm text-gray-600">{customer.phone}</p>
                        </div>
                        <p className="text-sm font-mono text-gray-500">{customer.id}</p>
                    </div>
                ))}
                {filteredCustomers.length === 0 && (
                    <p className="text-center py-8 text-gray-500">No customers found.</p>
                )}
            </div>
        </div>
    );
};

export const CustomersPage: React.FC = () => {
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const { openAddCustomerModal } = useUIContext();
    const { currentUser } = useAuthContext();
    const isAdmin = currentUser?.role === 'admin';

    return (
        <div>
            {selectedCustomer ? (
                <CustomerDetailView customer={selectedCustomer} onBack={() => setSelectedCustomer(null)} />
            ) : (
                <div className="space-y-6">
                    {isAdmin && <BirthdayReminders />}
                    {isAdmin && <FestivalGreetings />}
                    <CustomerListView onCustomerSelect={setSelectedCustomer} />
                </div>
            )}

            {!selectedCustomer && (
                 <button 
                    onClick={openAddCustomerModal}
                    className="md:hidden fixed bottom-24 right-6 bg-brand-gold text-brand-charcoal w-14 h-14 rounded-full shadow-lg flex items-center justify-center z-20"
                    aria-label="Add new customer"
                >
                    <AddUserIcon />
                </button>
            )}
        </div>
    );
};