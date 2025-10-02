import React, { useState, useMemo } from 'react';
import { useDataContext } from '../context/DataContext';
import { Page, Bill, JewelryItem } from '../types';
import { RevenueIcon, BillingIcon, AvgIcon, DownloadIcon, InventoryIcon, WeightIcon, DistributorIcon } from './common/Icons';

declare const XLSX: any; // Declare XLSX from the script tag in index.html

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-white p-4 rounded-lg shadow-md flex items-center border border-gray-100">
        <div className="p-3 bg-brand-gold-light text-brand-gold-dark rounded-full mr-4">{icon}</div>
        <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-brand-charcoal">{value}</p>
        </div>
    </div>
);

const ReportsPage: React.FC<{ setCurrentPage: (page: Page) => void }> = ({ setCurrentPage }) => {
    const { bills, staff, inventory, distributors } = useDataContext();
    const today = new Date().toISOString().split('T')[0];

    const [reportType, setReportType] = useState<'customers' | 'distribution'>('customers');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });
    
    const staffNameMap = useMemo(() => {
        const map = new Map<string, string>();
        staff.forEach(s => map.set(s.id, s.name));
        map.set('admin', 'Admin');
        return map;
    }, [staff]);

    const distributorNameMap = useMemo(() => {
        const map = new Map<string, string>();
        distributors.forEach(d => map.set(d.id, d.name));
        return map;
    }, [distributors]);

    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN', {
        style: 'currency', currency: 'INR', minimumFractionDigits: 2,
    }).format(amount);

    const setDateRange = (preset: 'today' | 'week' | 'month' | 'year') => {
        const today = new Date();
        let start = new Date();
        let end = new Date();

        switch (preset) {
            case 'today':
                start = end;
                break;
            case 'week':
                start.setDate(today.getDate() - today.getDay());
                break;
            case 'month':
                start = new Date(today.getFullYear(), today.getMonth(), 1);
                break;
            case 'year':
                start = new Date(today.getFullYear(), 0, 1);
                break;
        }
        setStartDate(start.toISOString().split('T')[0]);
        setEndDate(end.toISOString().split('T')[0]);
    };
    
    const handleSort = (key: string) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc',
        }));
    };
    
    const SortIndicator = ({ columnKey }: { columnKey: string }) => {
        if (sortConfig.key !== columnKey) return null;
        return sortConfig.direction === 'desc' ? ' ▼' : ' ▲';
    };

    // Memoized data for Customer reports
    const filteredAndSortedBills = useMemo(() => {
        let filtered = [...bills];
        if (startDate) {
            filtered = filtered.filter(bill => new Date(bill.date) >= new Date(startDate));
        }
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            filtered = filtered.filter(bill => new Date(bill.date) <= end);
        }
        return filtered.sort((a, b) => {
            const aVal = a[sortConfig.key as keyof Bill];
            const bVal = b[sortConfig.key as keyof Bill];
            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [bills, startDate, endDate, sortConfig]);

    const customerReportStats = useMemo(() => ({
        totalRevenue: filteredAndSortedBills.reduce((sum, bill) => sum + bill.grandTotal, 0),
        billCount: filteredAndSortedBills.length,
        averageBill: filteredAndSortedBills.length > 0 ? filteredAndSortedBills.reduce((sum, bill) => sum + bill.grandTotal, 0) / filteredAndSortedBills.length : 0,
    }), [filteredAndSortedBills]);

    // Memoized data for Distribution reports
    const filteredAndSortedInventory = useMemo(() => {
        let filtered = [...inventory];
        if (startDate) {
            filtered = filtered.filter(item => new Date(item.dateAdded) >= new Date(startDate));
        }
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            filtered = filtered.filter(item => new Date(item.dateAdded) <= end);
        }
        return filtered.sort((a, b) => {
            const aVal = a[sortConfig.key as keyof JewelryItem];
            const bVal = b[sortConfig.key as keyof JewelryItem];
            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [inventory, startDate, endDate, sortConfig]);

    const distributionReportStats = useMemo(() => ({
        totalItems: filteredAndSortedInventory.reduce((sum, item) => sum + item.quantity, 0),
        totalWeight: filteredAndSortedInventory.reduce((sum, item) => sum + (item.weight * item.quantity), 0),
        uniqueSKUs: filteredAndSortedInventory.length,
    }), [filteredAndSortedInventory]);
    
    const handleExcelExport = () => {
        let data, sheetName, fileName;

        if (reportType === 'customers') {
            data = filteredAndSortedBills.map(bill => ({
                'Customer': bill.customerName,
                'Created By': staffNameMap.get(bill.createdBy) || bill.createdBy,
                'Date': new Date(bill.date).toLocaleDateString(),
                'Amount (INR)': bill.grandTotal,
                'Type': bill.type,
                'Bill ID': bill.id
            }));
            sheetName = 'Sales Report';
            fileName = 'sales_report.xlsx';
        } else {
            data = filteredAndSortedInventory.map(item => ({
              'Distributor': distributorNameMap.get(item.distributorId) || 'Unknown',
              'Item Name': item.name,
              'Serial No': item.serialNo,
              'Category': item.category,
              'Weight (g)': item.weight,
              'Quantity': item.quantity,
              'Date Added': new Date(item.dateAdded).toLocaleDateString()
            }));
            sheetName = 'Distribution Report';
            fileName = 'distribution_report.xlsx';
        }

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        XLSX.writeFile(wb, fileName);
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-4 md:p-6 rounded-lg shadow-md border space-y-4">
                <div className="flex flex-col md:flex-row justify-between md:items-center">
                    <h2 className="text-xl font-bold">Filter Reports</h2>
                    <button onClick={handleExcelExport} className="mt-2 md:mt-0 bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition flex items-center self-start md:self-center">
                        <DownloadIcon/> Download Excel
                    </button>
                </div>
                 <div>
                    <label className="text-sm font-medium">Report Type</label>
                    <div className="flex items-center gap-4 mt-1">
                       <label className="flex items-center"><input type="radio" name="reportType" value="customers" checked={reportType === 'customers'} onChange={() => setReportType('customers')} className="mr-2"/> Customers</label>
                       <label className="flex items-center"><input type="radio" name="reportType" value="distribution" checked={reportType === 'distribution'} onChange={() => setReportType('distribution')} className="mr-2"/> Distribution</label>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div>
                        <label htmlFor="startDate" className="text-sm font-medium">Start Date</label>
                        <input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-2 border rounded mt-1" max={today} />
                    </div>
                    <div>
                        <label htmlFor="endDate" className="text-sm font-medium">End Date</label>
                        <input type="date" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-2 border rounded mt-1" max={today}/>
                    </div>
                    <div className="col-span-1 md:col-span-2 lg:col-span-2">
                        <div className="flex flex-wrap gap-2">
                           <button onClick={() => setDateRange('today')} className="px-3 py-2 text-sm bg-gray-200 rounded hover:bg-gray-300">Today</button>
                           <button onClick={() => setDateRange('week')} className="px-3 py-2 text-sm bg-gray-200 rounded hover:bg-gray-300">This Week</button>
                           <button onClick={() => setDateRange('month')} className="px-3 py-2 text-sm bg-gray-200 rounded hover:bg-gray-300">This Month</button>
                           <button onClick={() => setDateRange('year')} className="px-3 py-2 text-sm bg-gray-200 rounded hover:bg-gray-300">This Year</button>
                           <button onClick={() => { setStartDate(''); setEndDate(''); }} className="px-3 py-2 text-sm bg-red-200 rounded hover:bg-red-300">Clear</button>
                        </div>
                    </div>
                </div>
            </div>
            
            {reportType === 'customers' ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <StatCard title="Total Revenue" value={formatCurrency(customerReportStats.totalRevenue)} icon={<RevenueIcon />} />
                        <StatCard title="Number of Bills" value={customerReportStats.billCount} icon={<BillingIcon />} />
                        <StatCard title="Average Bill Value" value={formatCurrency(customerReportStats.averageBill)} icon={<AvgIcon />} />
                    </div>
                    <div className="bg-white p-4 md:p-6 rounded-lg shadow-md border">
                        <h2 className="text-xl font-bold mb-4">Customer Transactions</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b">
                                        <th className="p-3 cursor-pointer" onClick={() => handleSort('customerName')}>Customer <SortIndicator columnKey="customerName"/></th>
                                        <th className="p-3 cursor-pointer hidden md:table-cell" onClick={() => handleSort('createdBy')}>Created By <SortIndicator columnKey="createdBy"/></th>
                                        <th className="p-3 cursor-pointer" onClick={() => handleSort('date')}>Date <SortIndicator columnKey="date"/></th>
                                        <th className="p-3 text-right cursor-pointer" onClick={() => handleSort('grandTotal')}>Amount <SortIndicator columnKey="grandTotal"/></th>
                                        <th className="p-3 hidden md:table-cell">Type</th>
                                        <th className="p-3 hidden md:table-cell">Bill ID</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAndSortedBills.map(bill => (
                                        <tr key={bill.id} className="border-b hover:bg-gray-50">
                                            <td className="p-3 font-semibold">{bill.customerName}</td>
                                            <td className="p-3 hidden md:table-cell">{staffNameMap.get(bill.createdBy) || bill.createdBy}</td>
                                            <td className="p-3 text-sm text-gray-600">{new Date(bill.date).toLocaleDateString()}</td>
                                            <td className="p-3 text-right font-medium">{formatCurrency(bill.grandTotal)}</td>
                                            <td className="p-3 hidden md:table-cell text-xs"><span className={`px-2 py-1 rounded-full ${bill.type === 'INVOICE' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>{bill.type}</span></td>
                                            <td className="p-3 hidden md:table-cell font-mono text-xs">{bill.id}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filteredAndSortedBills.length === 0 && <div className="text-center py-16 text-gray-500"><p>No transactions found for the selected criteria.</p></div>}
                        </div>
                    </div>
                </>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <StatCard title="Total Items Purchased" value={distributionReportStats.totalItems} icon={<InventoryIcon />} />
                        <StatCard title="Total Weight (g)" value={distributionReportStats.totalWeight.toFixed(3)} icon={<WeightIcon />} />
                        <StatCard title="Unique SKUs" value={distributionReportStats.uniqueSKUs} icon={<DistributorIcon />} />
                    </div>
                    <div className="bg-white p-4 md:p-6 rounded-lg shadow-md border">
                        <h2 className="text-xl font-bold mb-4">Distribution / Purchase Report</h2>
                        <div className="overflow-x-auto">
                           <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b">
                                        <th className="p-3 cursor-pointer" onClick={() => handleSort('distributorId')}>Distributor <SortIndicator columnKey="distributorId"/></th>
                                        <th className="p-3 cursor-pointer" onClick={() => handleSort('name')}>Item Name <SortIndicator columnKey="name"/></th>
                                        <th className="p-3 cursor-pointer hidden md:table-cell" onClick={() => handleSort('weight')}>Weight (g) <SortIndicator columnKey="weight"/></th>
                                        <th className="p-3 cursor-pointer text-right" onClick={() => handleSort('quantity')}>Qty <SortIndicator columnKey="quantity"/></th>
                                        <th className="p-3 cursor-pointer" onClick={() => handleSort('dateAdded')}>Date Added <SortIndicator columnKey="dateAdded"/></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAndSortedInventory.map(item => (
                                        <tr key={item.id} className="border-b hover:bg-gray-50">
                                            <td className="p-3 font-semibold">{distributorNameMap.get(item.distributorId) || 'Unknown'}</td>
                                            <td className="p-3">{item.name}</td>
                                            <td className="p-3 hidden md:table-cell">{item.weight.toFixed(3)}</td>
                                            <td className="p-3 text-right">{item.quantity}</td>
                                            <td className="p-3 text-sm text-gray-600">{new Date(item.dateAdded).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                             {filteredAndSortedInventory.length === 0 && <div className="text-center py-16 text-gray-500"><p>No items found for the selected criteria.</p></div>}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default ReportsPage;