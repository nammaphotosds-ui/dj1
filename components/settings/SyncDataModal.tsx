import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useDataContext } from '../../context/DataContext';
import Modal from '../common/Modal';
import { supabase } from '../../utils/supabase';

// Helper function to generate a random code
const generateRandomCode = (length = 6) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

const SyncDataModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const { getSyncDataPayload } = useDataContext();
    const [syncCode, setSyncCode] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isOpen) {
            const timer = setTimeout(() => {
                setSyncCode(null);
                setIsLoading(false);
                setError('');
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    const generateSyncSession = async () => {
        setIsLoading(true);
        setError('');
        setSyncCode(null);

        try {
            const payload = getSyncDataPayload();
            if (!payload) throw new Error("Could not generate data payload.");
            
            const code = generateRandomCode();
            const expiration = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

            const { error: insertError } = await supabase
                .from('sync_sessions')
                .insert({
                    sync_code: code,
                    data_payload: payload,
                    expires_at: expiration.toISOString(),
                });

            if (insertError) {
                console.error("Supabase insert error:", insertError);
                throw new Error("Could not create sync session. Please check your Supabase setup and connection.");
            }

            setSyncCode(code);
            toast.success("Sync code generated! It expires in 15 minutes.");
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleCopy = () => {
        if (syncCode) {
            navigator.clipboard.writeText(syncCode);
            toast.success("Code copied to clipboard!");
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Generate Device Sync Code">
            <div className="text-center">
                <p className="text-gray-600 mb-4">
                    Generate a short, temporary code to set up a new staff device. This action uploads the current data snapshot.
                </p>
                <div className="p-4 bg-gray-100 rounded-lg my-4 min-h-[12rem] flex items-center justify-center">
                    {isLoading ? (
                        <p className="text-gray-500">Generating code...</p>
                    ) : error ? (
                        <p className="text-red-500">{error}</p>
                    ) : syncCode ? (
                        <div className="w-full text-center">
                           <p className="text-sm text-gray-600 mb-2">Share this code with the staff member:</p>
                           <div className="my-4 p-3 bg-white border-2 border-dashed rounded-lg">
                               <p className="text-4xl font-bold font-mono tracking-widest text-brand-charcoal">{syncCode}</p>
                           </div>
                            <button onClick={handleCopy} className="mt-3 w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition">
                                Copy Code
                            </button>
                        </div>
                    ) : (
                        <button onClick={generateSyncSession} className="bg-brand-gold text-brand-charcoal px-6 py-2 rounded-lg font-semibold hover:bg-brand-gold-dark transition">
                            Generate Code
                        </button>
                    )}
                </div>
                 <p className="text-xs text-gray-500 mt-6">
                    <strong>Note:</strong> The sync code is valid for 15 minutes and should only be used once.
                </p>
            </div>
        </Modal>
    );
};

export default SyncDataModal;