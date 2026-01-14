
import { useEffect, useState } from 'react';
import { LaunchDetailModalProps } from '../../lib/definitions';
import { getStatusColor } from './utils';
import { MissionPatch } from './MissionPatch';
import { RocketDetailModal } from './InfoModals/RocketDetailModal';
import { ProviderDetailModal } from './InfoModals/ProviderDetailModal';
import { LocationDetailModal } from './InfoModals/LocationDetailModal';

export const LaunchDetailModal = ({ launch, onClose }: LaunchDetailModalProps) => {
    const [activeModal, setActiveModal] = useState<'rocket' | 'provider' | 'location' | null>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Only close this modal if no child modal is open
            if (e.key === 'Escape' && !activeModal) {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose, activeModal]);

    if (!launch) return null;

    // Get patch
    const patch = launch.mission_patches?.sort((a, b) => b.priority - a.priority)[0];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="flex flex-col gap-6">
                    {/* Header */}
                    <div>
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                            <div className="text-xs font-mono text-cyan-500">
                                {new Date(launch.net).toLocaleString(undefined, {
                                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                })}
                            </div>
                            <div className={`px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider ${getStatusColor(launch.status.id)}`}>
                                {launch.status.name}
                            </div>
                        </div>

                        <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
                            {launch.name.split('|')[0].trim()}
                        </h2>
                        {launch.name.includes('|') && (
                            <h3 className="text-xl font-light text-slate-300">
                                {launch.name.split('|')[1].trim()}
                            </h3>
                        )}
                    </div>

                    {/* Description */}
                    <div className="space-y-4">
                        <p className="text-slate-400 text-sm leading-relaxed border-l-2 border-white/10 pl-4">
                            {launch.status.description}
                        </p>
                        {launch.mission?.description && (
                            <p className="text-slate-300 text-sm leading-relaxed pl-4">
                                {launch.mission.description}
                            </p>
                        )}
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {launch.mission?.type && (
                            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/5 border border-white/10">
                                <div className="p-2 bg-emerald-500/10 rounded-md text-emerald-400">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                    </svg>
                                </div>
                                <div>
                                    <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Type</div>
                                    <div className="text-sm text-slate-200 font-medium">{launch.mission.type}</div>
                                </div>
                            </div>
                        )}

                        <div
                            onClick={() => setActiveModal('rocket')}
                            className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 hover:border-blue-500/30 transition-all select-none group"
                        >
                            <div className="p-2 bg-blue-500/10 rounded-md text-blue-400 group-hover:scale-110 transition-transform">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                            </div>
                            <div>
                                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold group-hover:text-blue-400 transition-colors">Rocket</div>
                                <div className="text-sm text-slate-200 font-medium">{launch.rocket.configuration.name}</div>
                            </div>
                        </div>

                        <div
                            onClick={() => setActiveModal('provider')}
                            className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 hover:border-purple-500/30 transition-all select-none group"
                        >
                            <div className="p-2 bg-purple-500/10 rounded-md text-purple-400 group-hover:scale-110 transition-transform">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <div>
                                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold group-hover:text-purple-400 transition-colors">Provider</div>
                                <div className="text-sm text-slate-200 font-medium">{launch.launch_service_provider.name}</div>
                            </div>
                        </div>

                        <div
                            onClick={() => setActiveModal('location')}
                            className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 hover:border-slate-500/50 transition-all select-none group"
                        >
                            <div className="p-2 bg-slate-500/10 rounded-md text-slate-400 group-hover:scale-110 transition-transform">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <div className="flex-grow">
                                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold group-hover:text-slate-300 transition-colors">Location</div>
                                <div className="text-sm text-slate-200 font-medium">{launch.pad.location.name}</div>
                            </div>
                        </div>
                    </div>

                    {/* Mission Patch */}
                    {patch && (
                        <div className="w-full flex justify-center py-6 border-t border-white/5">
                            <MissionPatch
                                patch={patch}
                                missionName={launch.name}
                                className="w-48 h-48"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* NESTED MODALS */}
            {activeModal === 'rocket' && launch.rocket.configuration && (
                <RocketDetailModal
                    rocket={launch.rocket.configuration}
                    onClose={() => setActiveModal(null)}
                />
            )}
            {activeModal === 'provider' && launch.launch_service_provider && (
                <ProviderDetailModal
                    provider={launch.launch_service_provider}
                    onClose={() => setActiveModal(null)}
                />
            )}
            {activeModal === 'location' && launch.pad && (
                <LocationDetailModal
                    pad={launch.pad}
                    onClose={() => setActiveModal(null)}
                />
            )}
        </div>
    );
};

