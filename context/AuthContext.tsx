import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { CurrentUser, GoogleTokenResponse, Staff } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';
import { hashPassword } from '../utils/crypto';
import { supabase } from '../utils/supabase';
import { toast } from 'react-hot-toast';

interface AuthContextType {
  currentUser: CurrentUser | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<CurrentUser | null>>;
  isInitialized: boolean;
  loginAsStaff: (staffList: Staff[], id: string, pass: string) => Promise<boolean>;
  error: string | null;
  tokenResponse: GoogleTokenResponse | null;
  setTokenResponse: React.Dispatch<React.SetStateAction<GoogleTokenResponse | null>>;
  verifyAdminPin: (pin: string) => Promise<boolean>;
  updateAdminPin: (newPin: string) => Promise<void>;
  resetAdminPin: () => Promise<void>;
  fetchAdminPin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hashed version of the default PIN "4004"
const DEFAULT_PIN_HASH = '3142751528642a8a80a2211933a362334a625451259543163b01f3916295c5c0';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tokenResponse, setTokenResponse] = useLocalStorage<GoogleTokenResponse | null>('googleTokenResponse', null);
  const [currentUser, setCurrentUser] = useLocalStorage<CurrentUser | null>('currentUser', null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adminPinHash, setAdminPinHash] = useState<string | null>(null);

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

  const fetchAdminPin = async () => {
     try {
        const { data, error } = await supabase
            .from('admin_config')
            .select('pin_hash')
            .eq('id', 1)
            .single();

        if (error || !data) {
            console.warn("No PIN found in Supabase, using default. If this is the first run, this is expected.");
            setAdminPinHash(DEFAULT_PIN_HASH);
            return;
        }

        setAdminPinHash(data.pin_hash);

     } catch (e) {
        console.error("Failed to fetch PIN from Supabase:", e);
        toast.error("Could not fetch PIN. Using default.");
        setAdminPinHash(DEFAULT_PIN_HASH);
     }
  };
  
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
    const incomingPinHash = await hashPassword(pin);
    // If PIN hash hasn't been fetched, use the default hash for comparison
    return incomingPinHash === (adminPinHash || DEFAULT_PIN_HASH);
  };

  const updateAdminPin = async (newPin: string) => {
    const newPinHash = await hashPassword(newPin);
    const { error } = await supabase
        .from('admin_config')
        .update({ pin_hash: newPinHash, updated_at: new Date().toISOString() })
        .eq('id', 1);
    
    if (error) {
        console.error("Supabase update error:", error);
        throw new Error("Failed to update PIN in the database.");
    }
    setAdminPinHash(newPinHash);
  };

  const resetAdminPin = async () => {
    const { error } = await supabase
        .from('admin_config')
        .update({ pin_hash: DEFAULT_PIN_HASH, updated_at: new Date().toISOString() })
        .eq('id', 1);
    
    if (error) {
        console.error("Supabase reset error:", error);
        throw new Error("Failed to reset PIN in the database.");
    }
    setAdminPinHash(DEFAULT_PIN_HASH);
  };

  return (
    <AuthContext.Provider value={{ currentUser, setCurrentUser, isInitialized, loginAsStaff, error, tokenResponse, setTokenResponse, verifyAdminPin, updateAdminPin, resetAdminPin, fetchAdminPin }}>
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