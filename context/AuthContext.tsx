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
  verifyAdminPin: (pin: string) => Promise<boolean>;
  updateAdminPin: (pin: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Pre-hashed default PIN '4004'
const DEFAULT_PIN_HASH = 'a2123545b78083c0f43b51904a433f446002f260ea321588c831b3433a5937a5';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tokenResponse, setTokenResponse] = useLocalStorage<GoogleTokenResponse | null>('googleTokenResponse', null);
  const [currentUser, setCurrentUser] = useLocalStorage<CurrentUser | null>('currentUser', null);
  const [adminPinHash, setAdminPinHash] = useLocalStorage<string | null>('adminPinHash', null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Set the default PIN hash if none exists.
    if (!adminPinHash) {
      setAdminPinHash(DEFAULT_PIN_HASH);
    }
  }, [adminPinHash, setAdminPinHash]);

  useEffect(() => {
    const initAuth = () => {
      setError(null);
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
    const staffMember = staffList.find(s => s.id.toLowerCase() === trimmedId.toLowerCase());
    if (!staffMember) return false;
    const hash = await hashPassword(trimmedPass);
    if (hash === staffMember.passwordHash) {
        setCurrentUser({ role: 'staff', id: staffMember.id });
        return true;
    }
    return false;
  };

  const verifyAdminPin = async (pin: string): Promise<boolean> => {
    const hash = await hashPassword(pin);
    return hash === adminPinHash;
  };

  const updateAdminPin = async (pin: string) => {
    if (pin.length < 4) throw new Error("PIN must be at least 4 digits.");
    const hash = await hashPassword(pin);
    setAdminPinHash(hash);
  };

  return (
    <AuthContext.Provider value={{ currentUser, setCurrentUser, isInitialized, loginAsStaff, error, tokenResponse, setTokenResponse, verifyAdminPin, updateAdminPin }}>
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
