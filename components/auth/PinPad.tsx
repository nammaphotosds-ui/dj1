import React from 'react';
import { BackspaceIcon } from '../common/Icons';

interface PinPadProps {
    onPinChange: (pin: string) => void;
    currentPin: string;
    maxLength: number;
}

const PinButton: React.FC<{
    value: string | React.ReactNode;
    onClick: () => void;
    className?: string;
}> = ({ value, onClick, className }) => (
    <button
        type="button"
        onClick={onClick}
        className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl font-light bg-brand-pale-gold/30 text-brand-charcoal transition-colors duration-200 active:bg-brand-gold-light ${className}`}
    >
        {value}
    </button>
);

const PinPad: React.FC<PinPadProps> = ({ onPinChange, currentPin, maxLength }) => {
    
    const handleNumberClick = (num: string) => {
        if (currentPin.length < maxLength) {
            onPinChange(currentPin + num);
        }
    };

    const handleBackspaceClick = () => {
        if (currentPin.length > 0) {
            onPinChange(currentPin.slice(0, -1));
        }
    };

    const numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

    return (
        <div className="grid grid-cols-3 gap-4 justify-items-center">
            {numbers.map(num => (
                <PinButton key={num} value={num} onClick={() => handleNumberClick(num)} />
            ))}
            <div className="w-20 h-20"></div> {/* Placeholder for alignment */}
            <PinButton value="0" onClick={() => handleNumberClick('0')} />
            <PinButton
                value={<BackspaceIcon />}
                onClick={handleBackspaceClick}
                className="bg-transparent"
            />
        </div>
    );
};

export default PinPad;