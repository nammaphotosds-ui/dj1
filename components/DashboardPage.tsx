import React, { useMemo, useEffect, useRef } from 'react';
import { useDataContext } from '../context/DataContext';
import { useUIContext } from '../context/UIContext';
import { useAuthContext } from '../context/AuthContext';
import { Page, ActivityLog } from '../types';
import { UsersIcon, BillingIcon, InventoryIcon, RevenueIcon, ChevronRightIcon, PendingIcon } from './common/Icons';

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

const SalesChart: React.FC = () => {
    const { bills } = useDataContext();
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstanceRef = useRef<any>(null);

    useEffect(() => {
        if (!chartRef.current) return;

        const processData = () => {
            const last7Days = Array.from({ length: 7 }, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - i);
                return d.toISOString().split('T')[0];
            }).reverse();

            const salesData = last7Days.map(dateStr => {
                const daySales = bills
                    .filter(bill => bill.date.startsWith(dateStr))
                    .reduce((sum, bill) => sum + bill.grandTotal, 0);
                return daySales;
            });

            return {
                labels: last7Days.map(d => new Date(d).toLocaleDateString('en-US', { weekday: 'short' })),
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

const ActivityLogFeed: React.FC = () => {
    const { activityLogs, staff } = useDataContext();
    
    const staffNameMap = useMemo(() => {
        const map = new Map<string, string>();
        staff.forEach(s => map.set(s.id, s.name));
        map.set('admin', 'Admin');
        return map;
    }, [staff]);

    return (
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-md border border-gray-100">
          <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
          <div className="space-y-3 max-h-72 overflow-y-auto">
            {activityLogs.slice(0, 10).map(log => (
              <div key={log.id} className="flex items-start text-sm">
                 <div className="w-10 h-10 rounded-full mr-3 bg-brand-gold-light flex items-center justify-center font-bold text-brand-gold-dark text-xs flex-shrink-0">
                    {staffNameMap.get(log.userId)?.substring(0,2) || log.userId.substring(0,2)}
                 </div>
                <div>
                  <p><span className="font-semibold">{staffNameMap.get(log.userId) || log.userId}</span> {log.message.split(staffNameMap.get(log.userId) || log.userId)[1]}</p>
                  <p className="text-xs text-gray-400">{new Date(log.timestamp).toLocaleString()}</p>
                </div>
              </div>
            ))}
             {activityLogs.length === 0 && <p className="text-gray-500 text-center py-4">No recent activity.</p>}
          </div>
        </div>
    )
}

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

    if (upcomingBirthdays.length === 0) {
        return null;
    }

    return (
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-md border border-gray-100">
            <h2 className="text-xl font-bold mb-4">Upcoming Birthdays</h2>
            <div className="space-y-3 max-h-72 overflow-y-auto">
                {upcomingBirthdays.map(customer => (
                    <div key={customer.id} className="flex items-center text-sm p-2 rounded-md hover:bg-gray-50">
                        <div className="w-10 h-10 rounded-full mr-3 bg-brand-gold-light flex items-center justify-center font-bold text-brand-gold-dark text-lg flex-shrink-0">
                            🎂
                        </div>
                        <div>
                            <p className="font-semibold">{customer.name}</p>
                            <p className="text-xs text-gray-500">{customer.nextBirthday.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};


const DashboardPage: React.FC<{setCurrentPage: (page: Page) => void}> = ({setCurrentPage}) => {
  const { inventory, customers, bills } = useDataContext();
  const { currentUser } = useAuthContext();
  const { setInitialInventoryFilter } = useUIContext();

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
  const totalStock = inventory.reduce((sum, item) => sum + item.quantity, 0);
  const pendingPayments = useMemo(() => {
    return customers.reduce((acc, customer) => {
        if (customer.pendingBalance > 0) {
            acc.total += customer.pendingBalance;
            acc.count += 1;
        }
        return acc;
    }, { total: 0, count: 0 });
  }, [customers]);


  // Staff stats
  const staffCustomers = customers.filter(c => c.createdBy === currentUser?.id);
  const staffBills = bills.filter(b => b.createdBy === currentUser?.id);


  const handleCategoryClick = (category: string) => {
    setInitialInventoryFilter(category);
    setCurrentPage('INVENTORY');
  };

  const categoryStats = useMemo(() => {
    const stats: { [key: string]: { count: number; color: string } } = {
        Gold: { count: 0, color: 'bg-yellow-400' },
        Silver: { count: 0, color: 'bg-gray-400' },
        Platinum: { count: 0, color: 'bg-slate-300' },
    };
    inventory.forEach(item => {
        if (item.category in stats) {
            stats[item.category].count += item.quantity;
        }
    });
    return stats;
  }, [inventory]);

  return (
    <div className="space-y-6">
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${isStaff ? 'lg:grid-cols-2' : 'lg:grid-cols-4'} gap-4 md:gap-6`}>
        {isStaff ? (
          <>
            <StatCard title="Customers Added By You" value={staffCustomers.length} icon={<UsersIcon />} onClick={() => setCurrentPage('CUSTOMERS')} />
            <StatCard title="Bills Created By You" value={staffBills.length} icon={<BillingIcon />} onClick={() => setCurrentPage('BILLING')} />
          </>
        ) : (
          <>
            <StatCard title="Customers" value={customers.length} icon={<UsersIcon />} onClick={() => setCurrentPage('CUSTOMERS')} />
            <StatCard title="In Stock" value={totalStock} icon={<InventoryIcon />} onClick={() => setCurrentPage('INVENTORY')} />
            <StatCard title="Revenue" value={formatCurrency(totalRevenue)} icon={<RevenueIcon />} onClick={() => setCurrentPage('REPORTS')} />
            <StatCard 
                title={`Pending (${pendingPayments.count} customers)`} 
                value={formatCurrency(pendingPayments.total)} 
                icon={<PendingIcon />} 
                onClick={() => setCurrentPage('PENDING_PAYMENTS')} 
            />
          </>
        )}
      </div>

      {!isStaff && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3">
                <SalesChart />
            </div>
            <div className="lg:col-span-2">
                <ActivityLogFeed />
            </div>
          </div>
      )}
      
      {!isStaff && <BirthdayReminders />}

      {!isStaff && (
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-md border border-gray-100">
          <h2 className="text-xl font-bold mb-4">Stock by Category</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* FIX: Cast statsData to a specific type because Object.entries infers it as 'unknown' with an index signature. */}
            {Object.entries(categoryStats).map(([name, statsData]) => {
              const stats = statsData as { count: number; color: string };
              return (
                <div
                  key={name}
                  onClick={() => handleCategoryClick(name)}
                  className="flex items-center p-4 rounded-lg hover:bg-gray-100 cursor-pointer transition border"
                >
                  <div className={`w-8 h-8 rounded-full ${stats.color} mr-4 border border-black/10`}></div>
                  <div className="flex-grow">
                    <p className="font-semibold text-brand-charcoal">{name}</p>
                    <p className="text-sm text-gray-500">{stats.count} items in stock</p>
                  </div>
                  <ChevronRightIcon />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;