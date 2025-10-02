import React from 'react';
import type { Page, CurrentUser } from '../types';
import Logo from './common/Logo';
import { HomeIcon, UsersIcon, BillingIcon, InventoryIcon, ReportsIcon, SettingsIcon, LogoutIcon, StaffIcon, DistributorIcon } from './common/Icons';

const NavItem: React.FC<{
    page: Page;
    label: string;
    icon: React.ReactNode;
    currentPage: Page;
    setCurrentPage: (page: Page) => void;
}> = ({ page, label, icon, currentPage, setCurrentPage }) => {
    const isActive = currentPage === page;
    return (
        <button
            onClick={() => setCurrentPage(page)}
            className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                isActive
                    ? 'bg-brand-gold text-brand-charcoal'
                    : 'text-gray-300 hover:bg-brand-charcoal-light hover:text-white'
            }`}
        >
            {icon}
            <span className="ml-4">{label}</span>
        </button>
    );
};

const Sidebar: React.FC<{
    currentUser: CurrentUser;
    currentPage: Page;
    setCurrentPage: (page: Page) => void;
    onLogout: () => void;
}> = ({ currentUser, currentPage, setCurrentPage, onLogout }) => {
    
    const navItems = currentUser.role === 'admin'
        ? [
            { page: 'DASHBOARD' as Page, label: 'Dashboard', icon: <HomeIcon /> },
            { page: 'INVENTORY' as Page, label: 'Inventory', icon: <InventoryIcon /> },
            { page: 'CUSTOMERS' as Page, label: 'Customers', icon: <UsersIcon /> },
            { page: 'BILLING' as Page, label: 'Create Bill', icon: <BillingIcon /> },
            { page: 'REPORTS' as Page, label: 'Reports', icon: <ReportsIcon /> },
            { page: 'STAFF_MANAGEMENT' as Page, label: 'Manage Staff', icon: <StaffIcon /> },
            { page: 'DISTRIBUTOR_MANAGEMENT' as Page, label: 'Manage Distributors', icon: <DistributorIcon /> },
            { page: 'SETTINGS' as Page, label: 'Settings', icon: <SettingsIcon /> },
        ]
        : [
            { page: 'DASHBOARD' as Page, label: 'Dashboard', icon: <HomeIcon /> },
            { page: 'CUSTOMERS' as Page, label: 'Customers', icon: <UsersIcon /> },
            { page: 'BILLING' as Page, label: 'Create Bill', icon: <BillingIcon /> },
        ];

    return (
        <aside className="hidden md:flex flex-col w-64 bg-brand-charcoal text-white h-full fixed z-20">
            <div className="px-6 py-4 border-b border-brand-charcoal-light">
                <Logo />
            </div>
            <nav className="flex-grow p-4 space-y-2">
                {navItems.map(item => (
                    <NavItem key={item.page} {...item} currentPage={currentPage} setCurrentPage={setCurrentPage} />
                ))}
            </nav>
            <div className="p-4 border-t border-brand-charcoal-light">
                <div className="flex items-center mb-4">
                    <div className="w-10 h-10 rounded-full bg-brand-gold-dark flex items-center justify-center font-bold">
                        {currentUser.id.charAt(0).toUpperCase()}
                    </div>
                    <div className="ml-3">
                        <p className="font-semibold text-sm capitalize">{currentUser.id}</p>
                        <p className="text-xs text-gray-400 capitalize">{currentUser.role}</p>
                    </div>
                </div>
                <button
                    onClick={onLogout}
                    className="flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg text-gray-300 hover:bg-brand-charcoal-light hover:text-white"
                >
                    <LogoutIcon />
                    <span className="ml-4">Logout</span>
                </button>
            </div>
        </aside>
    );
};

// FIX: Add default export to resolve import error
export default Sidebar;
