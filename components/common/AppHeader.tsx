import React from 'react';
import type { Page } from '../../types';
import { useUIContext } from '../../context/UIContext';
import { CompressIcon, ExpandIcon, ExitIcon } from './Icons';
import Logo from './Logo';

const AppHeader: React.FC<{
    currentPage: Page;
    setCurrentPage: (page: Page) => void;
}> = ({ currentPage, setCurrentPage }) => {
    const { isFullscreen, toggleFullscreen } = useUIContext();
    return (
        <div className="flex justify-between items-start mb-6">
            <div className="flex items-center" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>
                <Logo simple />
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={toggleFullscreen}
                    className="p-3 bg-white/40 backdrop-blur-md rounded-full shadow-md text-brand-charcoal opacity-50 hover:opacity-100 transition"
                    aria-label={isFullscreen ? 'Exit full-screen' : 'Enter full-screen'}
                >
                    {isFullscreen ? <CompressIcon /> : <ExpandIcon />}
                </button>
                {currentPage !== 'DASHBOARD' && (
                    <button
                        onClick={() => setCurrentPage('DASHBOARD')}
                        className="p-3 bg-white/60 backdrop-blur-md rounded-full shadow-md text-brand-charcoal hover:bg-white transition"
                        aria-label="Go to Dashboard"
                    >
                        <ExitIcon />
                    </button>
                )}
            </div>
        </div>
    );
};

export default AppHeader;