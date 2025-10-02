import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface UIContextType {
  isAddCustomerModalOpen: boolean;
  openAddCustomerModal: () => void;
  closeAddCustomerModal: () => void;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  initialInventoryFilter: string | null;
  setInitialInventoryFilter: (category: string | null) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);
  const [initialInventoryFilter, setInitialInventoryFilter] = useState<string | null>(null);

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);
  
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => console.error(`Fullscreen error: ${err.message}`));
    } else if (document.exitFullscreen) {
        document.exitFullscreen();
    }
  };
  
  const openAddCustomerModal = () => setIsAddCustomerModalOpen(true);
  const closeAddCustomerModal = () => setIsAddCustomerModalOpen(false);

  return (
    <UIContext.Provider value={{ isAddCustomerModalOpen, openAddCustomerModal, closeAddCustomerModal, isFullscreen, toggleFullscreen, initialInventoryFilter, setInitialInventoryFilter }}>
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