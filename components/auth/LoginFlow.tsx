import React, { useState, useEffect, useRef } from 'react';
import { useAuthContext } from '../../context/AuthContext';
import { useDataContext } from '../../context/DataContext';
import type { GoogleTokenResponse } from '../../types';
import Logo from '../common/Logo';
import PinEntryScreen from './PinEntryScreen';

const CLIENT_ID = "439419338091-qfb0i2fdjhkbgovuo7q28m6eqa5mr8ko.apps.googleusercontent.com";


export const WelcomeScreen: React.FC = () => (
    <div className="flex h-full w-full items-center justify-center">
      <div className="text-center">
        <div className="relative w-40 h-40 mx-auto mb-8">
          <div className="absolute inset-0 border-2 border-brand-gold/30 rounded-full animate-ping"></div>
          <div className="absolute inset-2 border-2 border-brand-gold/50 rounded-full animate-ping [animation-delay:-0.5s]"></div>
          <Logo simple className="w-40 h-40"/>
        </div>
        <h1 className="text-5xl font-serif tracking-wider text-brand-charcoal" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.1)' }}>
          DEVAGIRIKAR
        </h1>
        <p className="text-2xl text-brand-gold-dark tracking-[0.2em]">JEWELLERYS</p>
      </div>
    </div>
);

// --- Login Screens ---

const AdminLoginScreen: React.FC<{onBack: () => void}> = ({onBack}) => {
    const { setCurrentUser, setTokenResponse } = useAuthContext();
    const [error, setError] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isGsiReady, setIsGsiReady] = useState(false);
    
    const tokenClient = useRef<any>(null);

    // Initialize the GSI client
    useEffect(() => {
        const initializeGsi = async () => {
            try {
                // @ts-ignore
                const google = await window.gsiClientPromise;
                if (!google) {
                    throw new Error("Google Identity Services library failed to load.");
                }

                tokenClient.current = google.accounts.oauth2.initTokenClient({
                    client_id: CLIENT_ID,
                    scope: 'https://www.googleapis.com/auth/drive.appdata',
                    callback: (tokenResponse: any) => {
                        setIsConnecting(false);
                        if (tokenResponse.error) {
                             console.error('Error from Google:', tokenResponse);
                             setError(`Failed to connect: ${tokenResponse.error_description || tokenResponse.error}. Please try again.`);
                             setTokenResponse(null);
                             return;
                        }
                        if (tokenResponse.access_token) {
                            const tokenData = { ...tokenResponse, expires_at: Date.now() + (tokenResponse.expires_in * 1000) };
                            setTokenResponse(tokenData);
                            setCurrentUser({ role: 'admin', id: 'admin' });
                            setError(null);
                        }
                    },
                });
                setIsGsiReady(true);
            } catch (err) {
                console.error("GSI initialization failed:", err);
                setError("Could not initialize Google Sign-In. Please check your internet connection and try refreshing.");
                setIsGsiReady(false);
            }
        };

        initializeGsi();
    }, [setTokenResponse, setCurrentUser]);
    
    const handleLoginClick = () => {
        if (!tokenClient.current) {
            setError("Google Sign-In is not ready yet.");
            return;
        }
        setIsConnecting(true);
        setError(null);
        // This MUST be called from a user-initiated event like a click.
        tokenClient.current.requestAccessToken({ prompt: '' });
    };

    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
             <img src="https://ik.imagekit.io/9y4qtxuo0/IMG_20250927_202057_913.png?updatedAt=1758984948163" alt="Logo" className="w-32 h-32 object-contain mb-4"/>
             <h2 className="text-3xl font-serif text-brand-charcoal mb-2">Admin Login</h2>
             <p className="text-gray-600 mb-6">Sign in with your Google account to manage the store.</p>

             <div className="w-full max-w-xs">
                <button 
                    onClick={handleLoginClick} 
                    disabled={!isGsiReady || isConnecting}
                    className="w-full flex items-center justify-center gap-3 p-3 bg-white border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
                >
                    <svg className="w-6 h-6" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.42-4.55H24v8.51h13.04c-.57 3.32-2.31 6.17-4.79 7.99l7.98 6.19C45.27 38.91 48 32.16 48 24c0-.73-.07-1.44-.19-2.13l-1.01-1.32z"></path><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.98-6.19c-2.17 1.45-4.92 2.3-8.02 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path><path fill="none" d="M0 0h48v48H0z"></path></svg>
                    <span>{isConnecting ? 'Connecting...' : (isGsiReady ? 'Sign in with Google' : 'Initializing...')}</span>
                </button>
             </div>
             
             {error && <p className="text-red-600 mt-4 text-sm">{error}</p>}
             <button onClick={onBack} className="mt-8 text-gray-600 text-sm">Back to PIN Entry</button>
        </div>
    );
};


const StaffLoginScreen: React.FC<{onBack: () => void}> = ({onBack}) => {
    const { loginAsStaff } = useAuthContext();
    const { staff } = useDataContext();
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

    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <img src="https://ik.imagekit.io/9y4qtxuo0/IMG_20250927_202057_913.png?updatedAt=1758984948163" alt="Logo" className="w-32 h-32 object-contain mb-4"/>
            <h2 className="text-3xl font-serif text-brand-charcoal mb-2">Staff Login</h2>
            <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-4">
                <input type="text" value={staffId} onChange={e => setStaffId(e.target.value)} placeholder="Staff ID" className="w-full p-3 border rounded" required />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className="w-full p-3 border rounded" required />
                <button type="submit" disabled={isLoading} className="w-full p-3 bg-brand-gold text-brand-charcoal rounded-lg font-semibold hover:bg-brand-gold-dark transition disabled:opacity-70">
                    {isLoading ? 'Logging in...' : 'Login'}
                </button>
                {error && <p className="text-red-600 text-sm">{error}</p>}
            </form>
            <button onClick={onBack} className="mt-8 text-gray-600 text-sm">Back to Role Selection</button>
        </div>
    );
};

const LoginChooserScreen: React.FC<{ 
    onSelectRole: (role: 'admin' | 'staff') => void;
    onSync: () => void;
}> = ({ onSelectRole, onSync }) => {
     return (
        <div className="flex h-full w-full flex-col items-center justify-center p-8 text-brand-charcoal">
            <div 
                className="flex flex-col items-center text-center mb-16"
            >
                <img src="https://ik.imagekit.io/9y4qtxuo0/IMG_20250927_202057_913.png?updatedAt=1758984948163" alt="Logo" className="w-40 h-40 object-contain mb-6"/>
                <h1 className="text-5xl font-serif tracking-wider">DEVAGIRIKAR</h1>
                <p className="text-2xl text-brand-gold-dark tracking-[0.2em]">JEWELLERYS</p>
            </div>
            <div className="flex flex-col gap-4 w-full max-w-xs">
                <button onClick={() => onSelectRole('admin')} className="w-full p-4 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition">Admin Login</button>
                <button onClick={() => onSelectRole('staff')} className="w-full p-4 bg-brand-gold text-brand-charcoal font-semibold rounded-lg shadow-md hover:bg-brand-gold-dark transition">Staff Login</button>
            </div>
             <div className="mt-8 text-center">
                 <button onClick={onSync} className="text-sm text-gray-600 hover:text-brand-charcoal underline">
                    First time on a new device? Sync with data from an admin.
                </button>
            </div>
        </div>
    );
};


const LoginFlow: React.FC<{onSync: () => void}> = ({ onSync }) => {
    const { fetchAdminPin } = useAuthContext();
    const [loginType, setLoginType] = useState<'chooser' | 'admin' | 'staff' | 'pin'>('chooser');
    
    const handleSelectRole = (role: 'admin' | 'staff') => {
        if (role === 'admin') {
            fetchAdminPin(); // Fetch the pin from supabase before showing the screen
            setLoginType('pin');
        } else {
            setLoginType('staff');
        }
    };

    return (
        <>
            {(() => {
                switch(loginType) {
                    case 'pin':
                        return <PinEntryScreen onBack={() => setLoginType('chooser')} onSuccess={() => setLoginType('admin')} />;
                    case 'admin':
                        return <AdminLoginScreen onBack={() => setLoginType('pin')} />;
                    case 'staff':
                        return <StaffLoginScreen onBack={() => setLoginType('chooser')} />;
                    case 'chooser':
                    default:
                         return <LoginChooserScreen 
                                    onSelectRole={handleSelectRole} 
                                    onSync={onSync} 
                                />;
                }
            })()}
        </>
    )
}

export default LoginFlow;