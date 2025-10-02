import React, { useState, useEffect, useRef } from 'react';
import type { Page, CurrentUser } from '../../types';
import { useUIContext } from '../../context/UIContext';
import { HomeIcon, UsersIcon, BillingIcon, InventoryIcon, ReportsIcon, SettingsIcon, AddUserIcon, LogoutIcon, PencilIcon, PendingIcon } from '../common/Icons';

const GlobalNavMenu: React.FC<{
    currentUser: CurrentUser;
    setCurrentPage: (page: Page) => void;
    onLogout: () => void;
}> = ({ currentUser, setCurrentPage, onLogout }) => {
    const { openAddCustomerModal } = useUIContext();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

     useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleAction = (action: () => void) => {
      action();
      setIsOpen(false);
    }

    const baseNavItems = [
        { page: 'DASHBOARD' as Page, label: 'Dashboard', icon: <HomeIcon /> },
        { page: 'CUSTOMERS' as Page, label: 'Customers', icon: <UsersIcon /> },
        { page: 'BILLING' as Page, label: 'Create Bill', icon: <BillingIcon /> },
    ];
    const adminNavItems = [
        ...baseNavItems,
        { page: 'INVENTORY' as Page, label: 'Inventory', icon: <InventoryIcon /> },
        { page: 'REPORTS' as Page, label: 'Reports', icon: <ReportsIcon /> },
        { page: 'PENDING_PAYMENTS' as Page, label: 'Pending Payments', icon: <PendingIcon /> },
        { page: 'SETTINGS' as Page, label: 'Settings', icon: <SettingsIcon /> },
    ];
    const navItems = currentUser.role === 'admin' ? adminNavItems : baseNavItems;

    const actionItems = [
        { label: 'Add Customer', icon: <AddUserIcon />, onClick: openAddCustomerModal },
        { label: 'Logout', icon: <LogoutIcon />, onClick: onLogout },
    ];

    return (
        <div ref={menuRef} className="fixed bottom-6 right-6 z-40" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px))' }}>
            {isOpen && (
                 <div className="absolute bottom-full mb-4 w-64 right-0 flex flex-col items-end gap-3">
                    {navItems.map(item => (
                         <button key={item.page} onClick={() => handleAction(() => setCurrentPage(item.page))} className="w-full flex items-center justify-start bg-white shadow-lg rounded-full text-left p-3 font-semibold hover:bg-gray-100 transition">
                            {item.icon} <span className="ml-3">{item.label}</span>
                        </button>
                    ))}
                    <div className="w-full border-t my-1"></div>
                     {actionItems.map(item => (
                         <button key={item.label} onClick={() => handleAction(item.onClick)} className="w-full flex items-center justify-start bg-white shadow-lg rounded-full text-left p-3 font-semibold hover:bg-gray-100 transition">
                            {item.icon} <span className="ml-3">{item.label}</span>
                        </button>
                    ))}
                </div>
            )}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-16 h-16 rounded-full bg-brand-gold text-brand-charcoal shadow-lg flex items-center justify-center transform transition-all duration-300 ${isOpen ? 'rotate-90' : ''}`}
                aria-label="Open navigation menu"
            >
               {isOpen ? <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg> : <PencilIcon />}
            </button>
        </div>
    );
};

export default GlobalNavMenu;