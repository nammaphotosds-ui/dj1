import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { CurrentUser, GoogleTokenResponse, Staff } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';
import { hashPassword } from '../utils/crypto';
import { DataContext } from './DataContext';

interface AuthContextType {
  currentUser: CurrentUser | null;
  setCurrentUser: (user: CurrentUser | null) => void;
  isInitialized: boolean;
  loginAsStaff: (id: string, pass: string) => Promise<boolean>;
  error: string | null;
  tokenResponse: GoogleTokenResponse | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tokenResponse] = useLocalStorage<GoogleTokenResponse | null>('googleTokenResponse', null);
  const [currentUser, setCurrentUser] = useLocalStorage<CurrentUser | null>('currentUser', null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // This effect primarily handles the initialization signal and admin token validation.
  useEffect(() => {
    const initAuth = () => {
      setError(null);
      // If there's an admin user but the token is expired/missing, log them out.
      if (currentUser?.role === 'admin' && (!tokenResponse || !tokenResponse.expires_at || tokenResponse.expires_at < Date.now())) {
        setCurrentUser(null);
      }
      setIsInitialized(true);
    };
    initAuth();
  }, [tokenResponse, currentUser, setCurrentUser]);
  
  // We need to get staff data to perform login.
  // This feels a bit like a circular dependency, but auth naturally depends on user data.
  // DataContext will handle loading staff data. We just use it here.
  const dataContext = useContext(DataContext);
  
  const loginAsStaff = async (id: string, pass: string): Promise<boolean> => {
    if (!dataContext) {
      console.error("DataContext not available for login");
      setError("Application is not ready. Please try again.");
      return false;
    }
    const staffMember = dataContext.staff.find(s => s.id === id);
    if (!staffMember) return false;
    
    const hash = await hashPassword(pass);
    if (hash === staffMember.passwordHash) {
        setCurrentUser({ role: 'staff', id });
        return true;
    }
    return false;
  };

  return (
    <AuthContext.Provider value={{ currentUser, setCurrentUser, isInitialized, loginAsStaff, error, tokenResponse }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};