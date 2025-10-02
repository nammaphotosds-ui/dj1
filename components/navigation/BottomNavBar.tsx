import React, { useState } from 'react';
import type { Page, CurrentUser } from '../../types';
import { useUIContext } from '../../context/UIContext';
import { HomeIcon, UsersIcon, BillingIcon, InventoryIcon, LogoutIcon, AddUserIcon, DistributorIcon } from '../common/Icons';

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
            className={`flex flex-col items-center justify-center w-full pt-2 pb-1 transition-colors duration-200 ${
                isActive ? 'text-brand-gold-dark' : 'text-brand-gray'
            }`}
        >
            {icon}
            <span className="text-xs mt-1">{label}</span>
        </button>
    );
};

const MoreMenu: React.FC<{
    currentUser: CurrentUser;
    onLogout: () => void;
    onClose: () => void;
}> = ({ currentUser, onLogout, onClose }) => {
    const { openAddStaffModal, openAddDistributorModal } = useUIContext();
    
    const adminOnlyItems = [
        { label: 'Add Staff', icon: <AddUserIcon />, action: openAddStaffModal },
        { label: 'Add Distributor', icon: <DistributorIcon />, action: openAddDistributorModal },
    ];
    
    const handleAction = (action: () => void) => {
        action();
        onClose();
    };
    
    const handleLogout = () => {
        onLogout();
        onClose();
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose}>
            <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-4 pb-6 shadow-lg" onClick={e => e.stopPropagation()}>
                 <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4"></div>
                {currentUser.role === 'admin' && (
                    <div className="grid grid-cols-3 gap-4 text-center mb-4 pb-4 border-b">
                        {adminOnlyItems.map(item => (
                            <button key={item.label} onClick={() => handleAction(item.action)} className="flex flex-col items-center text-gray-700">
                                <div className="p-3 bg-gray-100 rounded-full">{item.icon}</div>
                                <span className="text-xs mt-1">{item.label}</span>
                            </button>
                        ))}
                    </div>
                )}
                <button onClick={handleLogout} className="w-full flex items-center justify-center p-3 bg-red-50 text-red-600 rounded-lg font-semibold mt-2">
                    <LogoutIcon />
                    <span className="ml-2">Logout</span>
                </button>
            </div>
        </div>
    );
};


const BottomNavBar: React.FC<{
    currentUser: CurrentUser;
    currentPage: Page;
    setCurrentPage: (page: Page) => void;
    onLogout: () => void;
}> = ({ currentUser, currentPage, setCurrentPage, onLogout }) => {
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
    const isStaff = currentUser.role === 'staff';

    const mainNavItems = isStaff
        ? [
            { page: 'DASHBOARD' as Page, label: 'Home', icon: <HomeIcon /> },
            { page: 'CUSTOMERS' as Page, label: 'Customers', icon: <UsersIcon /> },
            { page: 'BILLING' as Page, label: 'Billing', icon: <BillingIcon /> },
        ]
        : [
            { page: 'DASHBOARD' as Page, label: 'Home', icon: <HomeIcon /> },
            { page: 'CUSTOMERS' as Page, label: 'Customers', icon: <UsersIcon /> },
            { page: 'BILLING' as Page, label: 'Billing', icon: <BillingIcon /> },
            { page: 'INVENTORY' as Page, label: 'Inventory', icon: <InventoryIcon /> },
        ];
        
    return (
        <>
            <div
                className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30"
                style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
            >
                <div className="flex justify-around items-center h-16">
                    {mainNavItems.map(item => (
                        <NavItem key={item.page} {...item} currentPage={currentPage} setCurrentPage={setCurrentPage} />
                    ))}
                     <button
                        onClick={() => setIsMoreMenuOpen(true)}
                        className={`flex flex-col items-center justify-center w-full pt-2 pb-1 transition-colors duration-200 text-brand-gray`}
                    >
                        {isStaff ? (
                             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                        ) : <AddUserIcon />}
                        <span className="text-xs mt-1">{isStaff ? 'More' : 'Add Profiles'}</span>
                    </button>
                </div>
            </div>
            {isMoreMenuOpen && (
                <MoreMenu
                    currentUser={currentUser}
                    onLogout={onLogout}
                    onClose={() => setIsMoreMenuOpen(false)}
                />
            )}
        </>
    );
};

export default BottomNavBar;