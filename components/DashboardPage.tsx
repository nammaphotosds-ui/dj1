

import React, { useMemo, useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useDataContext } from '../context/DataContext';
import { useAuthContext } from '../context/AuthContext';
import { Page, JewelryCategory, Bill, BillItem, Staff } from '../types';
import { UsersIcon, BillingIcon, RevenueIcon, WeightIcon, StaffIcon } from './common/Icons';

declare const Chart: any;

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode, onClick?: () => void }> = ({ title, value, icon, onClick }) => {
    const isClickable = !!onClick;
    const baseClasses = "bg-white p-4 rounded-lg shadow-md flex items-center border border-gray-100";
    const interactiveClasses = isClickable ? "transition-transform transform hover:scale-105 cursor-pointer" : "";

    return (
      <div className={`${baseClasses} ${interactiveClasses}`} onClick={onClick}>
          <div className="p-3 bg-brand-gold-light text-brand-gold-dark rounded-full mr-4">
            {icon}
          </div>
          <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-brand-charcoal">{value}</p>
          </div>
      </div>
    );
};

const CategoryWeights: React.FC = () => {
    const { inventory } = useDataContext();
    const weights = useMemo(() => {
        const result: Record<string, number> = {
            [JewelryCategory.GOLD]: 0,
            [JewelryCategory.SILVER]: 0,
            [JewelryCategory.PLATINUM]: 0,
        };
        inventory.forEach(item => {
            if (result.hasOwnProperty(item.category)) {
                result[item.category] += item.weight * item.quantity;
            }
        });
        return result;
    }, [inventory]);

    const categoryStyles = {
        [JewelryCategory.GOLD]: { color: 'bg-yellow-400', name: 'Gold' },
        [JewelryCategory.SILVER]: { color: 'bg-gray-400', name: 'Silver' },
        [JewelryCategory.PLATINUM]: { color: 'bg-blue-300', name: 'Platinum' },
    };

    return (
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-md border border-gray-100 h-full">
            <h2 className="text-xl font-bold mb-4 flex items-center"><WeightIcon /> <span className="ml-2">Weight by Category</span></h2>
            <div className="space-y-4">
                {Object.keys(weights).map((category) => (
                    <div key={category} className="flex items-center justify-between text-lg">
                        <div className="flex items-center">
                            <span className={`w-4 h-4 rounded-full mr-3 shadow-inner ${categoryStyles[category as JewelryCategory].color}`}></span>
                            <span className="font-semibold">{categoryStyles[category as JewelryCategory].name}</span>
                        </div>
                        <span className="font-bold text-brand-charcoal">{weights[category as JewelryCategory].toFixed(4)} g</span>
                    </div>
                ))}
            </div>
        </div>
    );
};


const SalesChart: React.FC = () => {
    const { bills } = useDataContext();
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstanceRef = useRef<any>(null);

    useEffect(() => {
        if (!chartRef.current) return;

        const processData = () => {
            // Get the last 7 days as YYYY-MM-DD strings in the local timezone
            const last7Days = Array.from({ length: 7 }, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - i);
                // Format to YYYY-MM-DD in local timezone
                const year = d.getFullYear();
                const month = (d.getMonth() + 1).toString().padStart(2, '0');
                const day = d.getDate().toString().padStart(2, '0');
                return `${year}-${month}-${day}`;
            }).reverse();

            // Group bills by their local date
            const salesByDate: Record<string, number> = {};
            bills.forEach(bill => {
                const billDate = new Date(bill.date); // Parses ISO string to local Date object
                const year = billDate.getFullYear();
                const month = (billDate.getMonth() + 1).toString().padStart(2, '0');
                const day = billDate.getDate().toString().padStart(2, '0');
                const localDateStr = `${year}-${month}-${day}`;
                salesByDate[localDateStr] = (salesByDate[localDateStr] || 0) + bill.grandTotal;
            });

            const salesData = last7Days.map(dateStr => salesByDate[dateStr] || 0);

            return {
                labels: last7Days.map(d => {
                    // Adding T00:00:00 ensures it's parsed as a local date, not UTC.
                    // This prevents timezone-related off-by-one-day errors for the label.
                    const date = new Date(`${d}T00:00:00`);
                    return date.toLocaleDateString('en-US', { weekday: 'short' });
                }),
                data: salesData,
            };
        };

        const { labels, data } = processData();
        const ctx = chartRef.current.getContext('2d');

        if (chartInstanceRef.current) {
            chartInstanceRef.current.destroy();
        }

        chartInstanceRef.current = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Revenue',
                    data: data,
                    backgroundColor: 'rgba(218, 165, 32, 0.6)',
                    borderColor: 'rgba(218, 165, 32, 1)',
                    borderWidth: 1,
                    borderRadius: 4,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value: number) => `₹${value / 1000}k`
                        }
                    },
                    x: {
                        grid: {
                            display: false,
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false,
                    },
                    tooltip: {
                         callbacks: {
                            label: (context: any) => `Revenue: ₹${context.raw.toLocaleString('en-IN')}`
                        }
                    }
                }
            }
        });

        return () => {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
            }
        };
    }, [bills]);

    return (
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-md border border-gray-100 h-80">
            <h2 className="text-xl font-bold mb-4">7-Day Sales Overview</h2>
            <div className="relative h-64">
                <canvas ref={chartRef}></canvas>
            </div>
        </div>
    );
};

const RecentTransactions: React.FC = () => {
    const { bills, inventory } = useDataContext();

    const recentBills = useMemo(() => {
        return [...bills].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
    }, [bills]);

    const inventoryMap = useMemo(() => {
        return new Map(inventory.map(item => [item.id, item]));
    }, [inventory]);

    const formatItemSummary = (items: BillItem[]) => {
        const summary: Record<string, number> = {};
        items.forEach(item => {
            const inventoryItem = inventoryMap.get(item.itemId);
            if (inventoryItem) {
                if (!summary[inventoryItem.category]) {
                    summary[inventoryItem.category] = 0;
                }
                summary[inventoryItem.category] += item.weight * item.quantity;
            }
        });
        
        if (Object.keys(summary).length === 0) return <span className="text-gray-500">No items</span>;

        return Object.entries(summary).map(([category, weight]) => (
            <span key={category} className="mr-2 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700">
                {category}: <span className="font-semibold">{weight.toFixed(4)}g</span>
            </span>
        ));
    };

    return (
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-md border border-gray-100 h-full">
          <h2 className="text-xl font-bold mb-4">Recent Transactions</h2>
          <div className="space-y-3 max-h-72 overflow-y-auto">
            {recentBills.map(bill => (
              <div key={bill.id} className="border-b pb-2 last:border-b-0">
                <div className="flex justify-between items-center text-sm">
                    <div>
                        <p className="font-semibold">{bill.customerName}</p>
                        <p className="text-xs text-gray-400">{new Date(bill.date).toLocaleString()}</p>
                    </div>
                    <p className="font-bold text-brand-charcoal">₹{bill.grandTotal.toLocaleString('en-IN')}</p>
                </div>
                <div className="mt-2 text-xs">
                    {formatItemSummary(bill.items)}
                </div>
              </div>
            ))}
             {recentBills.length === 0 && <p className="text-gray-500 text-center py-4">No recent transactions.</p>}
          </div>
        </div>
    )
}

const StaffPerformance: React.FC<{ setCurrentPage: (page: Page) => void }> = ({ setCurrentPage }) => {
    const { staff, customers, bills, userNameMap } = useDataContext();

    const staffStats = useMemo(() => {
        return staff.map(s => {
            const customersAdded = customers.filter(c => c.createdBy === s.id).length;
            const billsCreated = bills.filter(b => b.createdBy === s.id);
            const revenueGenerated = billsCreated.reduce((sum, bill) => sum + bill.grandTotal, 0);
            return {
                id: s.id,
                name: userNameMap.get(s.id) || s.name,
                customersAdded,
                billsCreatedCount: billsCreated.length,
                revenueGenerated,
            };
        }).sort((a,b) => b.revenueGenerated - a.revenueGenerated);
    }, [staff, customers, bills, userNameMap]);

    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN', {
        style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(amount);

    if (staff.length === 0) {
        return (
            <div className="bg-white p-4 md:p-6 rounded-lg shadow-md border border-gray-100 h-full flex flex-col justify-center items-center">
                <h2 className="text-xl font-bold mb-2">Staff Performance</h2>
                <p className="text-gray-500">No staff members have been added yet.</p>
                <button 
                    onClick={() => setCurrentPage('STAFF_MANAGEMENT')}
                    className="mt-4 bg-brand-gold text-brand-charcoal px-4 py-2 rounded-lg font-semibold hover:bg-brand-gold-dark transition text-sm"
                >
                    Manage Staff
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-md border border-gray-100 h-full">
             <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold flex items-center">
                    <StaffIcon />
                    <span className="ml-2">Staff Performance</span>
                </h2>
            </div>
            <div className="space-y-3 max-h-72 overflow-y-auto">
                {staffStats.map(stat => {
                    return (
                        <div key={stat.id} className="border-b pb-2 last:border-b-0">
                             <div className="flex justify-between items-center">
                                <p className="font-semibold">{stat.name}</p>
                                <p className="font-bold text-brand-charcoal">{formatCurrency(stat.revenueGenerated)}</p>
                            </div>
                            <div className="flex items-center gap-x-4 text-xs text-gray-500 mt-1">
                                <span>Customers: <span className="font-medium text-gray-700">{stat.customersAdded}</span></span>
                                <span>Bills: <span className="font-medium text-gray-700">{stat.billsCreatedCount}</span></span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};


const DashboardPage: React.FC<{setCurrentPage: (page: Page) => void}> = ({setCurrentPage}) => {
  const { customers, bills } = useDataContext();
  const { currentUser } = useAuthContext();

  const isStaff = currentUser?.role === 'staff';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
  };

  // Admin stats
  const totalRevenue = bills.reduce((sum, bill) => sum + bill.amountPaid, 0);

  // Staff stats
  const staffCustomers = customers.filter(c => c.createdBy === currentUser?.id);
  const staffBills = bills.filter(b => b.createdBy === currentUser?.id);


  return (
    <div className="space-y-6">
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 md:gap-6`}>
        {isStaff ? (
          <>
            <StatCard title="Customers Added By You" value={staffCustomers.length} icon={<UsersIcon />} onClick={() => setCurrentPage('CUSTOMERS')} />
            <StatCard title="Bills Created By You" value={staffBills.length} icon={<BillingIcon />} onClick={() => setCurrentPage('BILLING')} />
          </>
        ) : (
          <>
            <CategoryWeights />
            <StatCard title="Revenue" value={formatCurrency(totalRevenue)} icon={<RevenueIcon />} onClick={() => setCurrentPage('REPORTS')} />
          </>
        )}
      </div>

      {!isStaff && (
          <>
            <div className="grid grid-cols-1">
                <SalesChart />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-3">
                  <RecentTransactions />
              </div>
              <div className="lg:col-span-2">
                  <StaffPerformance setCurrentPage={setCurrentPage} />
              </div>
            </div>
          </>
      )}
    </div>
  );
};

export default DashboardPage;