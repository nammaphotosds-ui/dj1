import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../../context/AuthContext';
import PinPad from './PinPad';

const PinDisplay: React.FC<{ pinLength: number; hasError: boolean }> = ({ pinLength, hasError }) => {
    const totalDots = 4;
    const errorClass = hasError ? 'animate-shake' : '';
    return (
        <div className={`flex justify-center items-center gap-4 my-6 ${errorClass}`}>
            {Array.from({ length: totalDots }).map((_, i) => (
                <div
                    key={i}
                    className={`w-4 h-4 rounded-full border-2 border-brand-charcoal transition-colors duration-200 ${
                        i < pinLength ? 'bg-brand-charcoal' : 'bg-transparent'
                    }`}
                ></div>
            ))}
        </div>
    );
};


const PinEntryScreen: React.FC<{ onBack: () => void; onSuccess: () => void; }> = ({ onBack, onSuccess }) => {
    const { verifyAdminPin } = useAuthContext();
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const pinLength = 4;

    useEffect(() => {
        if (pin.length === pinLength) {
            verifyPin();
        }
    }, [pin]);
    
    const verifyPin = async () => {
        setError('');
        setIsLoading(true);
        const isValid = await verifyAdminPin(pin);
        if (isValid) {
            onSuccess();
        } else {
            setError('Invalid PIN');
            setTimeout(() => {
                setPin('');
                setError('');
            }, 700);
        }
        setIsLoading(false);
    };

    const handlePinChange = (newPin: string) => {
        if (isLoading) return; // Don't allow changes while verifying
        setPin(newPin);
    }

    return (
        <div className="flex flex-col items-center justify-between h-full text-center p-4 pb-10">
            <div className="w-full">
                <img src="https://ik.imagekit.io/9y4qtxuo0/IMG_20250927_202057_913.png?updatedAt=1758984948163" alt="Logo" className="w-24 h-24 object-contain mx-auto mt-8 mb-4"/>
                <h2 className="text-2xl font-serif text-brand-charcoal mb-2">Enter Admin PIN</h2>
                <PinDisplay pinLength={pin.length} hasError={!!error} />
                <p className="text-red-500 text-sm h-5">{error || (isLoading ? 'Verifying...' : '')}</p>
            </div>
            
            <div className="w-full max-w-xs mx-auto">
                <PinPad 
                    onPinChange={handlePinChange}
                    currentPin={pin}
                    maxLength={pinLength}
                />
            </div>
            
            <button onClick={onBack} className="mt-4 mb-4 text-gray-600 text-sm">
                Back to Role Selection
            </button>
        </div>
    );
};

export default PinEntryScreen;