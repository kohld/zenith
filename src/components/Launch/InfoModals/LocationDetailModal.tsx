
import { useEffect } from 'react';
import { Pad } from '../../../lib/definitions';
import { LaunchMap } from '../LaunchMap';

interface LocationDetailModalProps {
    pad: Pad;
    weather?: {
        probability: number | null;
        concerns: string | null;
    };
    onClose: () => void;
}

export const LocationDetailModal = ({ pad, weather, onClose }: LocationDetailModalProps) => {
    // Handle ESC key to close
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    // Donut Chart Helper
    const probability = weather?.probability ?? null;
    const probabilityColor = probability
        ? probability >= 80 ? 'text-emerald-500'
            : probability >= 50 ? 'text-amber-500'
                : 'text-red-500'
        : 'text-slate-500';

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="relative p-6 border-b border-white/5 bg-gradient-to-r from-slate-800/50 to-slate-900/0">
                    {/* ... header content ... */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-slate-500/10 rounded-xl text-slate-400">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">{pad.location.name}</h2>
                            <div className="flex items-center gap-2 text-sm text-slate-400 font-mono">
                                <span>{pad.name}</span>
                                {pad.country_code && (
                                    <>
                                        <span>•</span>
                                        <span>{pad.country_code}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto custom-scrollbar">

                    {/* Launch Conditions Widget */}
                    {(probability !== null || weather?.concerns) && (
                        <div className="mb-6 bg-white/5 border border-white/5 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-6">

                            {/* Probability Donut */}
                            {probability !== null && (
                                <div className="flex items-center gap-4">
                                    <div className="relative w-16 h-16 flex items-center justify-center">
                                        <svg className="w-full h-full transform -rotate-90">
                                            <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-700" />
                                            <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent"
                                                className={probabilityColor}
                                                strokeDasharray={`${probability * 1.75} 175`}
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center font-bold text-sm text-white">
                                            {probability}%
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-500 uppercase tracking-wider font-bold">Probability</div>
                                        <div className={`text-lg font-bold ${probabilityColor}`}>
                                            {probability >= 90 ? 'GO' : probability >= 50 ? 'Likely' : 'Concerning'}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Separator */}
                            {probability !== null && weather?.concerns && (
                                <div className="hidden sm:block w-px h-10 bg-white/10"></div>
                            )}

                            {/* Weather Concerns */}
                            {weather?.concerns && (
                                <div className="flex-1 text-center sm:text-left">
                                    <div className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Weather Concerns</div>
                                    <div className="text-slate-300 text-sm italic">
                                        "{weather.concerns}"
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Location Description */}
                    {pad.location.description && (
                        <div className="mb-6">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Location Info</h3>
                            <p className="text-slate-300 text-sm leading-relaxed">
                                {pad.location.description}
                            </p>
                        </div>
                    )}

                    {/* Pad Description (if distinctive) */}
                    {pad.description && pad.description !== pad.location.description && (
                        <div className="mb-6">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Pad Info</h3>
                            <p className="text-slate-300 text-sm leading-relaxed">
                                {pad.description}
                            </p>
                        </div>
                    )}

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="p-4 rounded-lg bg-white/5 border border-white/5 text-center">
                            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total Location Launches</div>
                            <div className="text-2xl font-mono text-white">{pad.location.total_launch_count || 'N/A'}</div>
                        </div>
                        <div className="p-4 rounded-lg bg-white/5 border border-white/5 text-center">
                            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total Pad Launches</div>
                            <div className="text-2xl font-mono text-white">{pad.total_launch_count || 'N/A'}</div>
                        </div>
                    </div>

                    {/* Map */}
                    <div className="rounded-xl overflow-hidden border border-white/10 h-64 shadow-lg mb-6 relative group">
                        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                            {pad.map_url && (
                                <a href={pad.map_url} target="_blank" rel="noopener noreferrer" className="px-3 py-1 bg-black/60 text-white text-xs rounded backdrop-blur-md hover:bg-black/80">
                                    Open in Google Maps
                                </a>
                            )}
                        </div>
                        <LaunchMap
                            latitude={parseFloat(pad.latitude)}
                            longitude={parseFloat(pad.longitude)}
                            height={256}
                        />
                    </div>

                    {/* Map Image (Satellite/Aerial View) -> Optional 
                       The API provides `map_image` which is often a static map. 
                       Since we use an interactive map, we might display this as a "Satellite View" if different?
                       Usually the interactive map is better, so skipping for now to rely on LaunchMap.
                    */}

                </div>
            </div>
        </div>
    );
};
