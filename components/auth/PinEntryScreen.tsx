import React, { useState, useEffect } from 'react';
import useLocalStorage from '../../hooks/useLocalStorage';
import Logo from '../common/Logo';

const BackspaceIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"></path>
        <line x1="18" y1="9" x2="12" y2="15"></line>
        <line x1="12" y1="9" x2="18" y2="15"></line>
    </svg>
);

interface PinEntryScreenProps {
  onPinSuccess: (role: 'admin' | 'staff') => void;
  onProceedToLogin: () => void;
}

const PinEntryScreen: React.FC<PinEntryScreenProps> = ({ onPinSuccess, onProceedToLogin }) => {
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [isShaking, setIsShaking] = useState(false);
    const [adminPin] = useLocalStorage('adminPin', '4145');
    const [staffPin] = useLocalStorage('staffPin', '4004');

    useEffect(() => {
        if (pin.length === 4) {
            if (pin === adminPin) {
                onPinSuccess('admin');
            } else if (pin === staffPin) {
                onPinSuccess('staff');
            } else {
                setError('Incorrect PIN');
                setIsShaking(true);
                setTimeout(() => {
                    setPin('');
                    setError('');
                    setIsShaking(false);
                }, 800);
            }
        }
    }, [pin, adminPin, staffPin, onPinSuccess]);

    const handleKeyClick = (key: string) => {
        if (pin.length < 4) {
            setPin(p => p + key);
        }
    };

    const handleBackspace = () => {
        setPin(p => p.slice(0, -1));
    };

    const pinDots = Array(4).fill(0).map((_, i) => (
        <div key={i} className={`w-4 h-4 rounded-full border-2 border-brand-charcoal transition-colors ${i < pin.length ? 'bg-brand-charcoal' : 'bg-transparent'}`}></div>
    ));

    const keypadLayout = [
        '1', '2', '3',
        '4', '5', '6',
        '7', '8', '9',
        '', '0', '<'
    ];
    
    const shakeClass = isShaking ? 'animate-shake' : '';

    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
             <style>{`
                @keyframes shake {
                  10%, 90% { transform: translate3d(-1px, 0, 0); }
                  20%, 80% { transform: translate3d(2px, 0, 0); }
                  30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
                  40%, 60% { transform: translate3d(4px, 0, 0); }
                }
                .animate-shake {
                  animation: shake 0.82s cubic-bezier(.36,.07,.19,.97) both;
                }
            `}</style>
            <div className="mb-8">
                <Logo />
            </div>
            <h2 className="text-2xl font-semibold text-brand-charcoal mb-4">Enter PIN</h2>
            <div className={`flex gap-4 mb-4 ${shakeClass}`}>
                {pinDots}
            </div>
            {error ? 
                <p className="text-red-600 h-6 mb-2 text-sm font-medium">{error}</p> :
                <div className="h-6 mb-2"></div>
            }
            
            <div className="grid grid-cols-3 gap-4 w-full max-w-xs">
                {keypadLayout.map((key, index) => (
                    <button
                        key={index}
                        onClick={() => {
                            if (key === '<') handleBackspace();
                            else if (key) handleKeyClick(key);
                        }}
                        className={`
                            h-16 text-3xl font-light rounded-full flex items-center justify-center
                            ${key ? 'bg-white/50 hover:bg-white/80 active:bg-white/90 shadow-sm' : 'bg-transparent'}
                            transition-colors
                        `}
                        disabled={!key}
                        aria-label={key === '<' ? 'Backspace' : `Number ${key}`}
                    >
                        {key === '<' ? <BackspaceIcon /> : key}
                    </button>
                ))}
            </div>
            
            <div className="mt-8">
                 <button onClick={onProceedToLogin} className="text-gray-600 text-sm hover:underline">
                    Proceed to Login Chooser
                </button>
            </div>
        </div>
    );
};

export default PinEntryScreen;