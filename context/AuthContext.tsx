import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { CurrentUser, GoogleTokenResponse, Staff } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';
import { hashPassword } from '../utils/crypto';

interface AuthContextType {
  currentUser: CurrentUser | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<CurrentUser | null>>;
  isInitialized: boolean;
  loginAsStaff: (staffList: Staff[], id: string, pass: string) => Promise<boolean>;
  error: string | null;
  tokenResponse: GoogleTokenResponse | null;
  setTokenResponse: React.Dispatch<React.SetStateAction<GoogleTokenResponse | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tokenResponse, setTokenResponse] = useLocalStorage<GoogleTokenResponse | null>('googleTokenResponse', null);
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
  
  const loginAsStaff = async (staffList: Staff[], id: string, pass: string): Promise<boolean> => {
    const trimmedId = id.trim();
    const trimmedPass = pass.trim();

    if (!trimmedId || !trimmedPass) return false;

    // Case-insensitive find
    const staffMember = staffList.find(s => s.id.toLowerCase() === trimmedId.toLowerCase());
    if (!staffMember) return false;
    
    const hash = await hashPassword(trimmedPass);
    if (hash === staffMember.passwordHash) {
        // Use the correctly-cased ID from the database
        setCurrentUser({ role: 'staff', id: staffMember.id });
        return true;
    }
    return false;
  };

  return (
    <AuthContext.Provider value={{ currentUser, setCurrentUser, isInitialized, loginAsStaff, error, tokenResponse, setTokenResponse }}>
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