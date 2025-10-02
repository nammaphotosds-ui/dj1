import React, { useState, useEffect } from 'react';
import useLocalStorage from '../../hooks/useLocalStorage';
import { useAuthContext } from '../../context/AuthContext';
import type { GoogleTokenResponse } from '../../types';
import Logo from '../common/Logo';

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
    const [gsiClient, setGsiClient] = useState<any>(null);
    const [, setTokenResponse] = useLocalStorage<GoogleTokenResponse | null>('googleTokenResponse', null);
    const { setCurrentUser } = useAuthContext();
    const [error, setError] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);

    useEffect(() => {
        if (gsiClient) return;
        const intervalId = setInterval(() => {
            // @ts-ignore
            if (window.google) {
                clearInterval(intervalId);
                // @ts-ignore
                const client = window.google.accounts.oauth2.initTokenClient({
                    client_id: CLIENT_ID,
                    scope: 'https://www.googleapis.com/auth/drive.appdata',
                    callback: (response: any) => {
                        setIsConnecting(false);
                        if (response.error) {
                             console.error('Error from Google:', response);
                             setError(`Failed to connect: ${response.error_description || response.error}. Please try again.`);
                             setTokenResponse(null);
                             return;
                        }
                        if (response.access_token) {
                            console.log('Received Access Token.');
                            const tokenData = { ...response, expires_at: Date.now() + (response.expires_in * 1000) };
                            setTokenResponse(tokenData);
                            setCurrentUser({ role: 'admin', id: 'admin' });
                            setError(null);
                            window.location.reload();
                        }
                    },
                });
                setGsiClient(client);
            }
        }, 200);
        return () => clearInterval(intervalId);
    }, [gsiClient, setTokenResponse, setCurrentUser]);

    const handleConnect = () => {
        if (gsiClient) {
            setIsConnecting(true);
            gsiClient.requestAccessToken();
        } else {
            setError('Google Sign-In is not ready. Please try again.');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
             <img src="https://ik.imagekit.io/9y4qtxuo0/IMG_20250927_202057_913.png?updatedAt=1758984948163" alt="Logo" className="w-32 h-32 object-contain mb-4"/>
             <h2 className="text-3xl font-serif text-brand-charcoal mb-2">Admin Login</h2>
             <p className="text-gray-600 mb-8">Sign in with your Google account to manage the store.</p>
             <button onClick={handleConnect} disabled={isConnecting} className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-70">
                {isConnecting ? 'Connecting...' : 'Connect with Google'}
             </button>
             {error && <p className="text-red-600 mt-4 text-sm">{error}</p>}
             <button onClick={onBack} className="mt-8 text-gray-600 text-sm">Back to main login</button>
        </div>
    );
};

const StaffLoginScreen: React.FC<{onBack: () => void}> = ({onBack}) => {
    const { loginAsStaff } = useAuthContext();
    const [staffId, setStaffId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        const success = await loginAsStaff(staffId, password);
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
            <button onClick={onBack} className="mt-8 text-gray-600 text-sm">Back to main login</button>
        </div>
    );
};

const LoginScreen: React.FC = () => {
    const [loginType, setLoginType] = useState<'chooser' | 'admin' | 'staff'>('chooser');

    const renderContent = () => {
        switch(loginType) {
            case 'admin':
                return <AdminLoginScreen onBack={() => setLoginType('chooser')} />;
            case 'staff':
                return <StaffLoginScreen onBack={() => setLoginType('chooser')} />;
            case 'chooser':
            default:
                 return (
                    <div className="flex h-full w-full flex-col items-center justify-center p-8 text-brand-charcoal">
                        <div className="flex flex-col items-center text-center mb-16">
                            <img src="https://ik.imagekit.io/9y4qtxuo0/IMG_20250927_202057_913.png?updatedAt=1758984948163" alt="Logo" className="w-40 h-40 object-contain mb-6"/>
                            <h1 className="text-5xl font-serif tracking-wider">DEVAGIRIKAR</h1>
                            <p className="text-2xl text-brand-gold-dark tracking-[0.2em]">JEWELLERYS</p>
                        </div>
                        <div className="flex flex-col gap-4 w-full max-w-xs">
                            <button onClick={() => setLoginType('admin')} className="w-full p-4 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition">Admin Login</button>
                            <button onClick={() => setLoginType('staff')} className="w-full p-4 bg-brand-gold text-brand-charcoal font-semibold rounded-lg shadow-md hover:bg-brand-gold-dark transition">Staff Login</button>
                        </div>
                    </div>
                );
        }
    };
    
    return renderContent();
};


const LoginFlow: React.FC = () => {
    return <LoginScreen />;
}

export default LoginFlow;