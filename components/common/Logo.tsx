import React from 'react';

const Logo: React.FC<{ className?: string; simple?: boolean }> = ({ className, simple = false }) => {
  const logoUrl = "https://ik.imagekit.io/9y4qtxuo0/IMG_20250927_202057_913.png?updatedAt=1758984948163";
  return (
    <div className={`flex items-center justify-center text-white ${className}`}>
        <img src={logoUrl} alt="DEVAGIRIKAR JEWELLERYS Logo" className="w-10 h-10 object-contain" />
      <div className="ml-3">
        {simple ? (
          <h1 className="text-xl font-bold font-serif tracking-wider text-brand-gold-dark" style={{ textShadow: '0px 1px 1px rgba(0,0,0,0.1)' }}>DEVAGIRIKAR</h1>
        ) : (
          <h1 className="text-xl font-bold font-serif tracking-wider bg-gradient-to-r from-brand-gold-light via-brand-gold to-brand-gold-dark bg-clip-text text-transparent" style={{ textShadow: '0px 1px 1px rgba(0,0,0,0.2)' }}>DEVAGIRIKAR</h1>
        )}
        <p className="text-xs text-brand-gold-light -mt-1">JEWELLERYS</p>
      </div>
    </div>
  );
};

export default Logo;