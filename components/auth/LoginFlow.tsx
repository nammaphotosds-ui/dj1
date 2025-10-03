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
    const [isReady, setIsReady] = useState(false);
    const [isMedian, setIsMedian] = useState(false);
    const googleButtonRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // @ts-ignore
        if (window.median && window.median.socialLogin) {
            setIsMedian(true);
            setIsReady(true);
            return; 
        }

        const initializeGsi = async () => {
            try {
                // @ts-ignore
                const google = await window.gsiClientPromise;
                if (!google) {
                    throw new Error("Google Identity Services library failed to load.");
                }

                // This is the OAuth2 token client. It's responsible for getting the access token for Drive.
                const tokenClient = google.accounts.oauth2.initTokenClient({
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
                            console.log('Received Access Token via GSI.');
                            const tokenData = { ...tokenResponse, expires_at: Date.now() + (tokenResponse.expires_in * 1000) };
                            setTokenResponse(tokenData);
                            setCurrentUser({ role: 'admin', id: 'admin' });
                            setError(null);
                        }
                    },
                });

                // This initializes the "Sign In with Google" button.
                // Its callback will trigger the token client.
                google.accounts.id.initialize({
                    client_id: CLIENT_ID,
                    callback: () => {
                        // This callback fires after a successful sign-in from the button.
                        // We use it as the user-initiated gesture to request the access token for Drive.
                        setIsConnecting(true);
                        setError(null);
                        tokenClient.requestAccessToken({prompt: ''}); // prompt:'' prevents account chooser if already signed in.
                    },
                });

                // Render the button into our ref container.
                if (googleButtonRef.current) {
                    google.accounts.id.renderButton(
                        googleButtonRef.current,
                        { theme: 'outline', size: 'large', type: 'standard', text: 'signin_with' }
                    );
                    google.accounts.id.prompt(); // Display the One Tap prompt for returning users.
                    setIsReady(true);
                } else {
                    console.warn("Google button ref was not available for rendering.");
                }

            } catch (err) {
                console.error("GSI initialization failed:", err);
                setError("Could not initialize Google Sign-In. Please check your internet connection and try refreshing.");
                setIsReady(false);
            }
        };

        initializeGsi();
    }, [setTokenResponse, setCurrentUser]);

    // This function is now ONLY for the Median flow.
    const handleConnect = () => {
        if (!isMedian) return;

        setIsConnecting(true);
        setError(null);
        
        console.log('Median environment detected, using median.socialLogin');
        // @ts-ignore
        window.median.socialLogin.login({
            provider: 'google',
            scopes: ['https://www.googleapis.com/auth/drive.appdata']
        }).then((result: { accessToken: string }) => {
            setIsConnecting(false);
            if (result && result.accessToken) {
                console.log('Received Access Token via Median.');
                const tokenData: GoogleTokenResponse = {
                    access_token: result.accessToken,
                    expires_in: 3599,
                    scope: 'https://www.googleapis.com/auth/drive.appdata',
                    token_type: 'Bearer',
                    expires_at: Date.now() + (3599 * 1000)
                };
                setTokenResponse(tokenData);
                setCurrentUser({ role: 'admin', id: 'admin' });
            } else {
                console.error('Median social login failed, no access token:', result);
                setError('Login through Median failed. Please try again.');
            }
        }).catch((err: any) => {
            setIsConnecting(false);
            console.error('Median social login error:', err);
            setError(`Median Login Error: ${err.message || 'An unknown error occurred.'}`);
        });
    };

    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
             <img src="https://ik.imagekit.io/9y4qtxuo0/IMG_20250927_202057_913.png?updatedAt=1758984948163" alt="Logo" className="w-32 h-32 object-contain mb-4"/>
             <h2 className="text-3xl font-serif text-brand-charcoal mb-2">Admin Login</h2>
             <p className="text-gray-600 mb-6">Sign in with your Google account to manage the store.</p>

             <div className="flex flex-col items-center justify-center min-h-[50px]">
                {isMedian ? (
                    <button onClick={handleConnect} disabled={isConnecting || !isReady} className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-70">
                        {isConnecting ? 'Connecting...' : 'Connect with Google'}
                    </button>
                ) : isReady ? (
                    <div ref={googleButtonRef} className={isConnecting ? 'opacity-50 pointer-events-none' : ''}></div>
                ) : (
                    <p className="text-gray-500">Initializing Sign-In...</p>
                )}
                {isConnecting && <p className="text-gray-500 mt-2">Connecting...</p>}
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