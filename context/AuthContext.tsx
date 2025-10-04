import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { CurrentUser, Staff } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';
import { supabase } from '../utils/supabase';
import { toast } from 'react-hot-toast';

interface AuthContextType {
  currentUser: CurrentUser | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<CurrentUser | null>>;
  isInitialized: boolean;
  loginAsStaff: (staffList: Staff[], id: string, pass: string) => boolean;
  error: string | null;
  verifyAdminPin: (pin: string) => boolean;
  updateAdminPin: (newPin: string) => Promise<void>;
  resetAdminPin: () => Promise<void>;
  fetchAdminPin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// The default PIN is "4004"
const DEFAULT_PIN = '4004';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useLocalStorage<CurrentUser | null>('currentUser', null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adminPin, setAdminPin] = useState<string | null>(null);

  useEffect(() => {
    const initAuth = () => {
      setError(null);
      setIsInitialized(true);
    };
    initAuth();
  }, [currentUser]);

  const fetchAdminPin = async () => {
     try {
        const { data, error } = await supabase
            .from('admin_config')
            .select('pin')
            .eq('id', 1)
            .single();

        if (error || !data || !data.pin) {
            console.warn("No PIN found in Supabase, using default. If this is the first run, this is expected.");
            setAdminPin(DEFAULT_PIN);
            return;
        }
        
        // Stores the raw PIN from the database
        setAdminPin(data.pin);

     } catch (e) {
        console.error("Failed to fetch PIN from Supabase:", e);
        toast.error("Could not fetch PIN. Using default.");
        setAdminPin(DEFAULT_PIN);
     }
  };
  
  const loginAsStaff = (staffList: Staff[], id: string, pass: string): boolean => {
    const trimmedId = id.trim();
    const trimmedPass = pass.trim();
    if (!trimmedId || !trimmedPass) return false;
    const staffMember = staffList.find(s => s.id.toLowerCase() === trimmedId.toLowerCase());
    if (!staffMember) return false;
    
    // Direct password comparison (no hashing)
    if (trimmedPass === staffMember.password) {
        setCurrentUser({ role: 'staff', id: staffMember.id });
        return true;
    }
    return false;
  };

  const verifyAdminPin = (pin: string): boolean => {
    // Direct PIN comparison (no hashing)
    return pin === (adminPin || DEFAULT_PIN);
  };

  const updateAdminPin = async (newPin: string) => {
    // Store the new PIN directly (no hashing)
    const { data, error } = await supabase
        .from('admin_config')
        .upsert({ id: 1, pin: newPin, updated_at: new Date().toISOString() })
        .select()
        .single();
    
    if (error || !data) {
        console.error("Supabase update error:", error);
        throw new Error("Failed to update PIN in the database.");
    }
    setAdminPin(newPin);
  };

  const resetAdminPin = async () => {
    // Store the default PIN directly (no hashing)
    const { error } = await supabase
        .from('admin_config')
        .update({ pin: DEFAULT_PIN, updated_at: new Date().toISOString() })
        .eq('id', 1);
    
    if (error) {
        console.error("Supabase reset error:", error);
        throw new Error("Failed to reset PIN in the database.");
    }
    setAdminPin(DEFAULT_PIN);
  };

  return (
    <AuthContext.Provider value={{ currentUser, setCurrentUser, isInitialized, loginAsStaff, error, verifyAdminPin, updateAdminPin, resetAdminPin, fetchAdminPin }}>
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