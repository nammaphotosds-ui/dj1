import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import DashboardPage from './components/DashboardPage';
import InventoryPage from './components/InventoryPage';
import { CustomersPage } from './components/CustomersPage';
import BillingPage from './components/BillingPage';
import SettingsPage from './components/SettingsPage';
import ReportsPage from './components/ReportsPage';
import PendingPaymentsPage from './components/PendingPaymentsPage';
import type { Page } from './types';
import { useAuthContext } from './context/AuthContext';
import { useUIContext } from './context/UIContext';
import LoginFlow, { WelcomeScreen } from './components/auth/LoginFlow';
import AppHeader from './components/common/AppHeader';
import Modal from './components/common/Modal';
import AddCustomerForm from './components/forms/AddCustomerForm';
import GlobalNavMenu from './components/navigation/GlobalNavMenu';

const AppContent: React.FC = () => {
  const { isInitialized, currentUser, error, setCurrentUser } = useAuthContext();
  const { isAddCustomerModalOpen, closeAddCustomerModal } = useUIContext();
  const [currentPage, setCurrentPage] = useState<Page>('DASHBOARD');

  const handleLogout = () => {
    setCurrentUser(null);
    window.location.reload();
  };

  if (!isInitialized) {
      return <WelcomeScreen />;
  }

  if (error) {
      return (
           <div className="flex h-full w-full items-center justify-center p-4">
              <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
                <h1 className="text-2xl font-bold text-red-700 mb-4">An Error Occurred</h1>
                <p className="text-red-600 mb-6">{error}</p>
                <p className="text-gray-600">Please try refreshing the page. If you are an admin, try reconnecting to Google Drive from the settings menu.</p>
              </div>
            </div>
      );
  }

  if (!currentUser) {
      return <LoginFlow />;
  }

  const renderPage = () => {
    const isStaff = currentUser.role === 'staff';
    
    // Staff restrictions
    if (isStaff && (currentPage === 'INVENTORY' || currentPage === 'REPORTS' || currentPage === 'SETTINGS' || currentPage === 'PENDING_PAYMENTS')) {
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
      case 'PENDING_PAYMENTS':
        return <PendingPaymentsPage />;
      default:
        return <DashboardPage setCurrentPage={setCurrentPage}/>;
    }
  };

  return (
    <div className="h-full font-sans text-brand-charcoal">
      <Toaster position="top-center" reverseOrder={false} />
      <main className="h-full overflow-y-auto">
        <div 
          className="px-4 md:p-8"
           style={{ 
              paddingTop: `calc(1rem + env(safe-area-inset-top, 0px))`, 
              paddingBottom: `calc(6rem + env(safe-area-inset-bottom, 0px))`
          }}
         >
            <AppHeader
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
            />
            {renderPage()}
        </div>
      </main>
      <Modal isOpen={isAddCustomerModalOpen} onClose={closeAddCustomerModal} title="Add New Customer">
          <AddCustomerForm onClose={closeAddCustomerModal} />
      </Modal>
      <GlobalNavMenu
        currentUser={currentUser}
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