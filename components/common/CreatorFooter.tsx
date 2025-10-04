import React, { useState } from 'react';

interface CreatorFooterProps {
    withNavBar?: boolean;
}

const CreatorFooter: React.FC<CreatorFooterProps> = ({ withNavBar = false }) => {
    const [isCardVisible, setIsCardVisible] = useState(false);

    const footerClasses = withNavBar 
        ? "absolute bottom-16 md:bottom-0 left-0 right-0 p-2 text-center text-xs z-30 cursor-pointer"
        : "absolute bottom-0 left-0 right-0 p-2 text-center text-xs z-30 cursor-pointer";

    return (
        <>
            <footer 
                className={footerClasses}
                onClick={() => setIsCardVisible(true)}
            >
                <p className="text-gray-400 md:text-gray-500 hover:text-white md:hover:text-brand-charcoal transition-colors">
                    created by <span className="font-semibold">Nano Neptune</span>
                </p>
            </footer>

            {isCardVisible && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4"
                    onClick={() => setIsCardVisible(false)}
                >
                    <div 
                        className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-xs text-center transform transition-all animate-fade-in-up"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-xl font-bold text-brand-charcoal mb-1">Sangamesh Soppimath</h2>
                        <p className="text-sm text-gray-500 mb-4">Nano Neptune</p>
                        <a 
                            href="tel:8310674145" 
                            className="inline-block w-full bg-brand-gold text-brand-charcoal px-4 py-3 rounded-lg font-semibold hover:bg-brand-gold-dark transition text-lg"
                        >
                            8310674145
                        </a>
                        <button onClick={() => setIsCardVisible(false)} className="mt-4 text-sm text-gray-500 hover:text-gray-800">
                            Close
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default CreatorFooter;