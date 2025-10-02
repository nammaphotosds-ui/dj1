import React, { useState, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { useDataContext } from '../context/DataContext';
import type { Customer, Bill } from '../types';
import Avatar from './common/Avatar';

// --- Helper Functions & Components ---

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

const CustomerProfileTemplate: React.FC<{ customer: Customer; bills: Bill[] }> = ({ customer, bills }) => {
    const logoUrl = "https://ik.imagekit.io/9y4qtxuo0/IMG_20250927_202057_913.png?updatedAt=1758984948163";
    const totalSpent = bills.reduce((sum, bill) => sum + bill.grandTotal, 0);

    return (
        <div className="bg-brand-cream text-brand-charcoal font-sans flex flex-col" style={{ width: '1123px', height: '794px', boxSizing: 'border-box' }}>
            <div className="flex-grow relative overflow-hidden p-8">
                {/* Decorative Border */}
                <div className="absolute inset-0 border-[1px] border-brand-gold-dark/30 z-0"></div>
                <div className="absolute inset-2 border-[8px] border-brand-pale-gold z-0"></div>
                <div className="absolute inset-4 border-[1px] border-brand-gold-dark/50 z-0"></div>

                <div className="relative z-10 flex flex-col h-full">
                    {/* Header */}
                    <header className="flex justify-between items-center pb-4 mb-4 border-b-2 border-brand-gold-dark/30">
                        <div className="flex items-center">
                            <img src={logoUrl} alt="Logo" className="w-20 h-20" />
                            <div className="ml-4">
                                <h2 className="text-4xl font-serif tracking-wider font-bold text-brand-charcoal">DEVAGIRIKAR</h2>
                                <p className="text-xl text-brand-gold-dark tracking-[0.15em] -mt-1">JEWELLERYS</p>
                            </div>
                        </div>
                        <h1 className="text-6xl font-serif font-light text-brand-gold-dark tracking-widest">CUSTOMER PROFILE</h1>
                    </header>
                    
                    {/* Customer Info */}
                    <section className="flex justify-between items-start mb-6">
                        <div>
                            <p className="text-sm text-gray-600">Name</p>
                            <p className="text-2xl font-serif font-bold">{customer.name}</p>
                            <p className="text-sm text-gray-600 mt-2">Customer ID</p>
                            <p className="text-lg font-mono">{customer.id}</p>
                        </div>
                        <div className="text-right">
                             <p className="text-sm text-gray-600">Phone</p>
                             <p className="text-lg font-semibold">{customer.phone}</p>
                             <p className="text-sm text-gray-600 mt-2">Member Since</p>
                             <p className="text-lg">{new Date(customer.joinDate).toLocaleDateString()}</p>
                        </div>
                    </section>
                    
                    {/* Transaction Summary */}
                     <div className="bg-brand-pale-gold/30 p-4 rounded-lg flex justify-around mb-6 text-center">
                        <div>
                            <p className="text-sm text-gray-600 uppercase tracking-wider">Total Transactions</p>
                            <p className="text-3xl font-bold">{bills.length}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 uppercase tracking-wider">Total Spent</p>
                            <p className="text-3xl font-bold">₹{totalSpent.toLocaleString('en-IN')}</p>
                        </div>
                    </div>

                    {/* Transaction History */}
                    <main className="flex-grow overflow-y-auto">
                        <h3 className="text-xl font-bold mb-2">Transaction History</h3>
                        <table className="w-full text-sm">
                            <thead className="border-b-2 border-brand-charcoal">
                                <tr>
                                    <th className="text-left p-2">Date</th>
                                    <th className="text-left p-2">Bill ID</th>
                                    <th className="text-left p-2">Type</th>
                                    <th className="text-right p-2">Items</th>
                                    <th className="text-right p-2">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bills.map(bill => (
                                    <tr key={bill.id} className="border-b border-brand-gold-dark/20">
                                        <td className="p-2">{new Date(bill.date).toLocaleDateString()}</td>
                                        <td className="p-2 font-mono">{bill.id}</td>
                                        <td className="p-2">{bill.type}</td>
                                        <td className="text-right p-2">{bill.items.length}</td>
                                        <td className="text-right p-2 font-semibold">₹{bill.grandTotal.toLocaleString('en-IN')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {bills.length === 0 && <p className="text-center py-8 text-gray-500">No transactions found for this customer.</p>}
                    </main>

                     <footer className="flex justify-between items-center text-xs text-brand-gray pt-4 mt-auto">
                        <img src="https://ik.imagekit.io/9y4qtxuo0/devagirikar_Social.png?updatedAt=1759337561869" alt="Social Media QR" className="w-20 h-20"/>
                        <div className="text-center">
                            <p>This is a computer-generated document.</p>
                            <p>For inquiries, contact us at 9008604004 / 8618748300.</p>
                        </div>
                        <div className="w-20"></div>
                    </footer>
                </div>
            </div>
        </div>
    );
};

// --- Page Components ---

const CustomerDetailView: React.FC<{ customer: Customer, onBack: () => void }> = ({ customer, onBack }) => {
    const { getBillsByCustomerId, deleteCustomer } = useDataContext();
    const bills = getBillsByCustomerId(customer.id);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    const generatePdf = async () => {
        setIsGeneratingPdf(true);
        // @ts-ignore
        const { jsPDF } = window.jspdf;
        // @ts-ignore
        const html2canvas = window.html2canvas;

        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        document.body.appendChild(tempContainer);
        const root = ReactDOM.createRoot(tempContainer);
        
        root.render(<CustomerProfileTemplate customer={customer} bills={bills} />);
        
        // Wait for render
        await new Promise(resolve => setTimeout(resolve, 500)); 

        const elementToCapture = tempContainer.children[0] as HTMLElement;
        const canvas = await html2canvas(elementToCapture, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`customer-profile-${customer.id}.pdf`);

        root.unmount();
        document.body.removeChild(tempContainer);
        setIsGeneratingPdf(false);
    };
    
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
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={generatePdf} disabled={isGeneratingPdf} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400">
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
                            bills.map(bill => (
                                <div key={bill.id} className="border-b p-3 flex justify-between items-center hover:bg-gray-50">
                                    <div>
                                        <p className="font-semibold">{bill.type} - {new Date(bill.date).toLocaleDateString()}</p>
                                        <p className="text-xs text-gray-500 font-mono">{bill.id}</p>
                                    </div>
                                    <p className="font-bold">₹{bill.grandTotal.toLocaleString('en-IN')}</p>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 text-center py-8">No transactions found.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const CustomerListView: React.FC<{ onCustomerSelect: (customer: Customer) => void }> = ({ onCustomerSelect }) => {
    const { customers } = useDataContext();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredCustomers = useMemo(() => {
        return customers.filter(c =>
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.phone.includes(searchTerm) ||
            c.id.toLowerCase().includes(searchTerm.toLowerCase())
        ).sort((a,b) => new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime());
    }, [customers, searchTerm]);

    return (
        <div className="bg-white p-6 rounded-lg shadow-md border">
            <input
                type="text"
                placeholder="Search customers by name, phone, or ID..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full p-3 border rounded-lg mb-4"
            />
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

    return (
        <div>
            {selectedCustomer ? (
                <CustomerDetailView customer={selectedCustomer} onBack={() => setSelectedCustomer(null)} />
            ) : (
                <CustomerListView onCustomerSelect={setSelectedCustomer} />
            )}
        </div>
    );
};