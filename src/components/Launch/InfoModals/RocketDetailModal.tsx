
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { RocketConfiguration } from '../../../lib/definitions';
import { RocketSizeComparator } from './RocketSizeComparator';

interface RocketDetailModalProps {
    rocket: RocketConfiguration;
    onClose: () => void;
}

export const RocketDetailModal = ({ rocket, onClose }: RocketDetailModalProps) => {
    // Handle ESC key to close
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    return createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="relative w-full max-w-4xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="relative p-6 border-b border-white/5 bg-gradient-to-r from-blue-900/20 to-slate-900/0">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">{rocket.full_name}</h2>
                            <p className="text-sm text-blue-400 font-mono">{rocket.family} Family</p>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    {rocket.description && (
                        <p className="text-slate-300 text-sm leading-relaxed mb-6">
                            {rocket.description}
                        </p>
                    )}

                    {/* Specs Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                        <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Height</div>
                            <div className="text-lg font-mono text-white">{rocket.length ? `${rocket.length} m` : 'N/A'}</div>
                        </div>
                        <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Diameter</div>
                            <div className="text-lg font-mono text-white">{rocket.diameter ? `${rocket.diameter} m` : 'N/A'}</div>
                        </div>
                        <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Mass</div>
                            <div className="text-lg font-mono text-white">{rocket.launch_mass ? `${rocket.launch_mass} t` : 'N/A'}</div>
                        </div>
                        <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Thrust</div>
                            <div className="text-lg font-mono text-white">{rocket.to_thrust ? `${rocket.to_thrust} kN` : 'N/A'}</div>
                        </div>
                        <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">LEO Cap</div>
                            <div className="text-lg font-mono text-white">{rocket.leo_capacity ? `${rocket.leo_capacity} kg` : 'N/A'}</div>
                        </div>
                        <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">GTO Cap</div>
                            <div className="text-lg font-mono text-white">{rocket.gto_capacity ? `${rocket.gto_capacity} kg` : 'N/A'}</div>
                        </div>
                    </div>

                    {/* Size Comparator */}
                    {(rocket.length && rocket.diameter) && (
                        <div className="mt-6 border-t border-white/10 pt-4">
                            <RocketSizeComparator
                                length={rocket.length}
                                diameter={rocket.diameter}
                                name={rocket.full_name}
                            />
                        </div>
                    )}

                    {rocket.manufacturer && (
                        <div className="mt-6 border-t border-white/10 pt-4">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Manufacturer</h3>
                            <div className="flex items-center gap-3">
                                {rocket.manufacturer.logo_url && (
                                    <img src={rocket.manufacturer.logo_url} alt={rocket.manufacturer.name} className="w-12 h-12 object-contain bg-white/5 rounded-lg p-1" />
                                )}
                                <div>
                                    <div className="text-white font-medium">{rocket.manufacturer.name}</div>
                                    <div className="text-xs text-slate-500">{rocket.manufacturer.country_code} • {rocket.manufacturer.type}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};
