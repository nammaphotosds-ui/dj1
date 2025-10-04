import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import DashboardPage from './components/DashboardPage';
import InventoryPage from './components/InventoryPage';
import { CustomersPage } from './components/CustomersPage';
import BillingPage from './components/BillingPage';
import SettingsPage from './components/SettingsPage';
import ReportsPage from './components/ReportsPage';
import StaffManagementPage from './components/StaffManagementPage';
import DistributorManagementPage from './components/DistributorManagementPage';
import type { Page } from './types';
import { useAuthContext } from './context/AuthContext';
import { useUIContext } from './context/UIContext';
import { useDataContext } from './context/DataContext';
import LoginFlow, { WelcomeScreen } from './components/auth/LoginFlow';
import AppHeader from './components/common/AppHeader';
import Modal from './components/common/Modal';
import AddCustomerForm from './components/forms/AddCustomerForm';
import AddStaffForm from './components/forms/AddStaffForm';
import AddDistributorForm from './components/forms/AddDistributorForm';
import Sidebar from './components/Sidebar';
import BottomNavBar from './components/navigation/BottomNavBar';

const AppContent: React.FC = () => {
  const { isInitialized, currentUser, error, setCurrentUser } = useAuthContext();
  const { isLoading } = useDataContext();
  const { 
    isAddCustomerModalOpen, closeAddCustomerModal,
    isAddStaffModalOpen, closeAddStaffModal,
    isAddDistributorModalOpen, closeAddDistributorModal
  } = useUIContext();
  const [currentPage, setCurrentPage] = useState<Page>('DASHBOARD');

  const handleLogout = () => {
    setCurrentUser(null);
    window.location.reload();
  };

  if (!isInitialized) {
      return (
        <div className="h-full font-sans text-brand-charcoal bg-gradient-to-br from-brand-cream to-brand-bg">
          <WelcomeScreen />
        </div>
      );
  }
  
  if (error) {
      return (
           <div className="h-full w-full font-sans text-brand-charcoal bg-gradient-to-br from-brand-cream to-brand-bg flex items-center justify-center p-4">
              <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
                <h1 className="text-2xl font-bold text-red-700 mb-4">An Error Occurred</h1>
                <p className="text-red-600 mb-6">{error}</p>
                <p className="text-gray-600">Please check your internet connection and try refreshing the page. Ensure your Supabase configuration is correct.</p>
              </div>
            </div>
      );
  }

  if (!currentUser) {
      return (
        <div className="h-full font-sans text-brand-charcoal bg-gradient-to-br from-brand-cream to-brand-bg">
            <LoginFlow />
        </div>
      );
  }

  const renderPage = () => {
    const isStaff = currentUser.role === 'staff';
    
    // Staff restrictions
    if (isStaff && (currentPage === 'INVENTORY' || currentPage === 'REPORTS' || currentPage === 'SETTINGS' || currentPage === 'STAFF_MANAGEMENT' || currentPage === 'DISTRIBUTOR_MANAGEMENT')) {
        return <DashboardPage setCurrentPage={setCurrentPage} />;
    }

    switch (currentPage) {
      case 'DASHBOARD':
        return <DashboardPage setCurrentPage={setCurrentPage} />;
      case 'INVENTORY':
        return <InventoryPage />;
      case 'CUSTOMERS':
      	return <CustomersPage />;
      case 'BILLING':
        return <BillingPage setCurrentPage={setCurrentPage} />;
      case 'REPORTS':
        return <ReportsPage setCurrentPage={setCurrentPage} />;
      case 'SETTINGS':
        return <SettingsPage />;
      case 'STAFF_MANAGEMENT':
        return <StaffManagementPage />;
      case 'DISTRIBUTOR_MANAGEMENT':
        return <DistributorManagementPage />;
      default:
        return <DashboardPage setCurrentPage={setCurrentPage}/>;
    }
  };

  return (
    <div className="h-full font-sans text-brand-charcoal bg-gradient-to-br from-brand-cream to-brand-bg">
      <Toaster position="top-center" reverseOrder={false} />
      
      <Sidebar 
        currentUser={currentUser}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        onLogout={handleLogout}
      />

      <main className="h-full overflow-y-auto md:ml-64">
        <div 
          className="p-4 sm:p-6 lg:p-8"
           style={{ 
              paddingTop: `calc(1.5rem + env(safe-area-inset-top, 0px))`, 
              paddingBottom: `calc(5rem + env(safe-area-inset-bottom, 0px))` // Padding for bottom nav
          }}
         >
            <AppHeader
              currentPage={currentPage}
            />
            {isLoading ? (
                <div className="flex justify-center items-center h-[60vh]">
                    <div className="text-center">
                        <dotlottie-wc
                            src="https://lottie.host/218e4d29-9a0a-4a0a-ae44-cb4568650a74/N5SyJV5kwy.json"
                            autoplay
                            loop
                            style={{ width: '300px', height: '300px', margin: '0 auto' }}
                        ></dotlottie-wc>
                        <p className="-mt-4 text-lg font-semibold text-gray-700">Loading your store...</p>
                        <p className="text-sm text-gray-500">Please wait a moment.</p>
                    </div>
                </div>
            ) : (
                renderPage()
            )}
        </div>
      </main>

      <Modal isOpen={isAddCustomerModalOpen} onClose={closeAddCustomerModal} title="Add New Customer">
          <AddCustomerForm onClose={closeAddCustomerModal} />
      </Modal>

      <Modal isOpen={isAddStaffModalOpen} onClose={closeAddStaffModal} title="Add New Staff Member">
          <AddStaffForm onClose={closeAddStaffModal} />
      </Modal>

      <Modal isOpen={isAddDistributorModalOpen} onClose={closeAddDistributorModal} title="Add New Distributor">
          <AddDistributorForm onClose={closeAddDistributorModal} />
      </Modal>

      <BottomNavBar
        currentUser={currentUser}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        onLogout={handleLogout}
      />
    </div>
  );
};

const App: React.FC = () => {
    return <AppContent />;
}
export default App;