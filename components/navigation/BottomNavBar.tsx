import React, { useState } from 'react';
import type { Page, CurrentUser } from '../../types';
import { HomeIcon, UsersIcon, BillingIcon, InventoryIcon, LogoutIcon, StaffIcon, DistributorIcon, SettingsIcon, SyncIcon, UploadIcon } from '../common/Icons';
import StaffSyncModal from '../settings/StaffSyncModal';
import { useDataContext } from '../../context/DataContext';

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
    setCurrentPage: (page: Page) => void;
    onLogout: () => void;
    onClose: () => void;
    onOpenStaffSync: () => void;
}> = ({ currentUser, setCurrentPage, onLogout, onClose, onOpenStaffSync }) => {
    const { refreshDataFromAdmin, forceSaveAdminData } = useDataContext();

    const handleRefresh = () => {
        refreshDataFromAdmin();
        onClose();
    };
    
    const handleForceSave = () => {
        forceSaveAdminData();
        onClose();
    };

    const adminNavItems = [
        { label: 'Save & Sync Data', icon: <UploadIcon />, action: handleForceSave },
        { label: 'Manage Staff', icon: <StaffIcon />, page: 'STAFF_MANAGEMENT' as Page, action: () => handleNav('STAFF_MANAGEMENT') },
        { label: 'Manage Distributors', icon: <DistributorIcon />, page: 'DISTRIBUTOR_MANAGEMENT' as Page, action: () => handleNav('DISTRIBUTOR_MANAGEMENT') },
        { label: 'Settings', icon: <SettingsIcon />, page: 'SETTINGS' as Page, action: () => handleNav('SETTINGS') },
    ];

    const staffNavItems = [
        { label: 'Refresh Data from Admin', icon: <SyncIcon />, action: handleRefresh },
        { label: 'Sync Changes to Admin', icon: <UploadIcon />, action: onOpenStaffSync },
    ];

    const menuItems = currentUser.role === 'admin' ? adminNavItems : staffNavItems;
    
    const handleNav = (page: Page) => {
        setCurrentPage(page);
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
                <div className="space-y-2 mb-4 pb-4 border-b">
                    {menuItems.map(item => (
                        <button key={item.label} onClick={item.action} className="w-full flex items-center p-3 hover:bg-gray-100 rounded-lg">
                            {item.icon}
                            <span className="ml-3 font-semibold">{item.label}</span>
                        </button>
                    ))}
                </div>
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
    const [isStaffSyncModalOpen, setIsStaffSyncModalOpen] = useState(false);
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
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                        <span className="text-xs mt-1">{isStaff ? 'More' : 'Manage'}</span>
                    </button>
                </div>
            </div>
            {isMoreMenuOpen && (
                <MoreMenu
                    currentUser={currentUser}
                    setCurrentPage={setCurrentPage}
                    onLogout={onLogout}
                    onClose={() => setIsMoreMenuOpen(false)}
                    onOpenStaffSync={() => {
                        setIsMoreMenuOpen(false);
                        setIsStaffSyncModalOpen(true);
                    }}
                />
            )}
            {isStaff && (
                <StaffSyncModal 
                    isOpen={isStaffSyncModalOpen}
                    onClose={() => setIsStaffSyncModalOpen(false)}
                />
            )}
        </>
    );
};

export default BottomNavBar;