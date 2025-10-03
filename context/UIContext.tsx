import React, { createContext, useContext, useState, ReactNode } from 'react';

interface UIContextType {
  isAddCustomerModalOpen: boolean;
  openAddCustomerModal: () => void;
  closeAddCustomerModal: () => void;
  isAddStaffModalOpen: boolean;
  openAddStaffModal: () => void;
  closeAddStaffModal: () => void;
  isAddDistributorModalOpen: boolean;
  openAddDistributorModal: () => void;
  closeAddDistributorModal: () => void;
  initialInventoryFilter: string | null;
  setInitialInventoryFilter: (category: string | null) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [isAddDistributorModalOpen, setIsAddDistributorModalOpen] = useState(false);
  const [initialInventoryFilter, setInitialInventoryFilter] = useState<string | null>(null);

  const openAddCustomerModal = () => setIsAddCustomerModalOpen(true);
  const closeAddCustomerModal = () => setIsAddCustomerModalOpen(false);

  const openAddStaffModal = () => setIsAddStaffModalOpen(true);
  const closeAddStaffModal = () => setIsAddStaffModalOpen(false);

  const openAddDistributorModal = () => setIsAddDistributorModalOpen(true);
  const closeAddDistributorModal = () => setIsAddDistributorModalOpen(false);

  return (
    <UIContext.Provider value={{ 
        isAddCustomerModalOpen, openAddCustomerModal, closeAddCustomerModal, 
        isAddStaffModalOpen, openAddStaffModal, closeAddStaffModal,
        isAddDistributorModalOpen, openAddDistributorModal, closeAddDistributorModal,
        initialInventoryFilter, setInitialInventoryFilter 
    }}>
      {children}
    </UIContext.Provider>
  );
};

export const useUIContext = () => {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUIContext must be used within a UIProvider');
  }
  return context;
};