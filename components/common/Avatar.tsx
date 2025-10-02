import React from 'react';

const Avatar: React.FC<{ name: string; className?: string }> = ({ name, className = '' }) => {
    const initial = name ? name.charAt(0).toUpperCase() : '?';
    return (
        <div className={`flex items-center justify-center rounded-full bg-brand-gold-light text-brand-gold-dark ${className}`}>
            <span className="font-serif text-xl">{initial}</span>
        </div>
    );
};

export default Avatar;