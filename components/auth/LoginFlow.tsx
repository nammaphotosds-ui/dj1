import React, { useState, useEffect, useRef } from 'react';
import { useAuthContext } from '../../context/AuthContext';
import { useDataContext } from '../../context/DataContext';
import Logo from '../common/Logo';
import PinEntryScreen from './PinEntryScreen';
// FIX: Side-effect import to ensure global type declarations from types.ts are loaded.
import '../../types';
import type { UserRole } from '../../types';
import CreatorFooter from '../common/CreatorFooter';

export const WelcomeScreen: React.FC = () => (
    <div className="flex h-full w-full items-center justify-center">
      <div className="text-center">
        <dotlottie-wc
            src="https://lottie.host/218e4d29-9a0a-4a0a-ae44-cb4568650a74/N5SyJV5kwy.json"
            autoplay
            loop
            style={{ width: '300px', height: '300px', margin: '0 auto' }}
        ></dotlottie-wc>
        <h1 className="text-5xl font-serif tracking-wider text-gray-300 md:text-brand-charcoal -mt-8" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.1)' }}>
          DEVAGIRIKAR
        </h1>
        <p className="text-2xl text-brand-gold-light md:text-brand-gold-dark tracking-[0.2em]">JEWELLERYS</p>
      </div>
    </div>
);

// --- Login Screens ---

const StaffLoginScreen: React.FC<{onBack: () => void}> = ({onBack}) => {
    const { loginAsStaff } = useAuthContext();
    const { staff, isInitialStaffListLoaded } = useDataContext();
    const [staffId, setStaffId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        const success = await loginAsStaff(staff, staffId, password);
        if (!success) {
            setError('Invalid Staff ID or Password.');
        }
        setIsLoading(false);
    };

    const isLoginDisabled = isLoading || !isInitialStaffListLoaded;

    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4 pb-10">
            <img src="https://ik.imagekit.io/9y4qtxuo0/IMG_20250927_202057_913.png?updatedAt=1758984948163" alt="Logo" className="w-32 h-32 object-contain mb-4"/>
            <h2 className="text-3xl font-serif text-gray-300 md:text-brand-charcoal mb-2">Staff Login</h2>
            <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-4">
                <input type="text" value={staffId} onChange={e => setStaffId(e.target.value)} placeholder="Staff ID" className="w-full p-3 border rounded" required disabled={isLoginDisabled} />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className="w-full p-3 border rounded" required disabled={isLoginDisabled} />
                <button type="submit" disabled={isLoginDisabled} className="w-full p-3 bg-brand-gold text-brand-charcoal rounded-lg font-semibold hover:bg-brand-gold-dark transition disabled:opacity-70">
                    {isLoading ? 'Logging in...' : !isInitialStaffListLoaded ? 'Loading...' : 'Login'}
                </button>
                {error && <p className="text-red-600 text-sm">{error}</p>}
            </form>
            <button onClick={onBack} className="mt-8 text-gray-300 md:text-gray-600 text-sm">Back to Role Selection</button>
        </div>
    );
};

const LoginChooserScreen: React.FC<{ 
    onSelectRole: (role: UserRole) => void;
    isLoadingAdmin: boolean;
}> = ({ onSelectRole, isLoadingAdmin }) => {
     return (
        <div className="flex h-full w-full flex-col items-center justify-center p-8 text-gray-300 md:text-brand-charcoal">
            <div 
                className="flex flex-col items-center text-center mb-12"
            >
                <img src="https://ik.imagekit.io/9y4qtxuo0/IMG_20250927_202057_913.png?updatedAt=1758984948163" alt="Logo" className="w-40 h-40 object-contain mb-6"/>
                <h1 className="text-5xl font-serif tracking-wider">DEVAGIRIKAR</h1>
                <p className="text-2xl text-brand-gold-light md:text-brand-gold-dark tracking-[0.2em]">JEWELLERYS</p>
            </div>
            <div className="flex flex-col gap-6 w-full max-w-sm items-center">
                <button
                    onClick={() => onSelectRole('admin')}
                    disabled={isLoadingAdmin}
                    className="w-full focus:outline-none focus:ring-4 focus:ring-yellow-300 rounded-full disabled:opacity-60 disabled:cursor-wait transition-transform duration-200 ease-in-out transform hover:scale-105 relative"
                    aria-label="Admin Login"
                >
                    <img src="https://ik.imagekit.io/9y4qtxuo0/admin_login_lux.png?updatedAt=1759695000000" alt="Admin Login" className="w-full h-auto object-contain" />
                    {isLoadingAdmin && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                            <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>
                    )}
                </button>
                <button
                    onClick={() => onSelectRole('staff')}
                    className="w-full focus:outline-none focus:ring-4 focus:ring-yellow-300 rounded-full transition-transform duration-200 ease-in-out transform hover:scale-105"
                    aria-label="Staff Login"
                >
                    <img src="https://ik.imagekit.io/9y4qtxuo0/staff_login_lux.png?updatedAt=1759695000001" alt="Staff Login" className="w-full h-auto object-contain" />
                </button>
            </div>
        </div>
    );
};


const LoginFlow: React.FC = () => {
    const { fetchAdminPin, setCurrentUser } = useAuthContext();
    const [loginType, setLoginType] = useState<'chooser' | 'staff' | 'pin'>('chooser');
    const [isLoadingAdmin, setIsLoadingAdmin] = useState(false);
    
    const handleSelectRole = async (role: UserRole) => {
        if (role === 'admin') {
            setIsLoadingAdmin(true);
            await fetchAdminPin();
            setLoginType('pin');
            setIsLoadingAdmin(false);
        } else {
            setLoginType('staff');
        }
    };

    const handlePinSuccess = () => {
        setCurrentUser({ role: 'admin', id: 'admin' });
    };

    return (
        <>
            {(() => {
                switch(loginType) {
                    case 'pin':
                        return <PinEntryScreen onBack={() => setLoginType('chooser')} onSuccess={handlePinSuccess} />;
                    case 'staff':
                        return <StaffLoginScreen onBack={() => setLoginType('chooser')} />;
                    case 'chooser':
                    default:
                         return <LoginChooserScreen 
                                    onSelectRole={handleSelectRole} 
                                    isLoadingAdmin={isLoadingAdmin}
                                />;
                }
            })()}
            <CreatorFooter />
        </>
    )
}

export default LoginFlow;
