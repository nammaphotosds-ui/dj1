import React from 'react';
import type { Page } from '../../types';

const PAGE_TITLES: Record<Page, string> = {
    DASHBOARD: 'Dashboard',
    INVENTORY: 'Inventory Management',
    CUSTOMERS: 'Customer Directory',
    BILLING: 'Create New Bill',
    SETTINGS: 'Application Settings',
    REPORTS: 'Reports & Analytics',
    STAFF_MANAGEMENT: 'Manage Staff',
    DISTRIBUTOR_MANAGEMENT: 'Manage Distributors',
};

const AppHeader: React.FC<{ currentPage: Page; }> = ({ currentPage }) => {
    const pageTitle = PAGE_TITLES[currentPage] || 'Dashboard';
    
    return (
        <div className="flex justify-between items-center mb-6">
            <div>
                 <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{pageTitle}</h1>
                 <p className="text-sm text-gray-600 hidden sm:block">Welcome, manage your store with ease.</p>
            </div>
        </div>
    );
};

export default AppHeader;