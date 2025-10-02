import React from 'react';
import type { Page } from '../../types';
import { useUIContext } from '../../context/UIContext';
import { CompressIcon, ExpandIcon } from './Icons';

const PAGE_TITLES: Record<Page, string> = {
    DASHBOARD: 'Dashboard',
    INVENTORY: 'Inventory Management',
    CUSTOMERS: 'Customer Directory',
    BILLING: 'Create New Bill',
    SETTINGS: 'Application Settings',
    REPORTS: 'Reports & Analytics',
    PENDING_PAYMENTS: 'Pending Payments'
};

const AppHeader: React.FC<{ currentPage: Page; }> = ({ currentPage }) => {
    const { isFullscreen, toggleFullscreen } = useUIContext();
    const pageTitle = PAGE_TITLES[currentPage] || 'Dashboard';
    
    return (
        <div className="flex justify-between items-center mb-6">
            <div>
                 <h1 className="text-2xl md:text-3xl font-bold text-brand-charcoal">{pageTitle}</h1>
                 <p className="text-sm text-gray-500 hidden sm:block">Welcome, manage your store with ease.</p>
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={toggleFullscreen}
                    className="p-3 bg-white/60 backdrop-blur-md rounded-full shadow-md text-brand-charcoal hover:bg-white transition"
                    aria-label={isFullscreen ? 'Exit full-screen' : 'Enter full-screen'}
                >
                    {isFullscreen ? <CompressIcon /> : <ExpandIcon />}
                </button>
            </div>
        </div>
    );
};

export default AppHeader;