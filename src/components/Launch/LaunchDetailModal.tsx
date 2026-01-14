import { useState, useEffect } from 'react';
import { Launch } from '../../lib/definitions';
import { getStatusColor } from './utils';
import { MissionPatch } from './MissionPatch';
import { RocketDetailModal } from './InfoModals/RocketDetailModal';
import { ProviderDetailModal } from './InfoModals/ProviderDetailModal';
import { LocationDetailModal } from './InfoModals/LocationDetailModal';
import { MissionDetailModal } from './InfoModals/MissionDetailModal';

interface LaunchDetailModalProps {
    launch: Launch;
    onClose: () => void;
}

export const LaunchDetailModal = ({ launch, onClose }: LaunchDetailModalProps) => {
    const [activeModal, setActiveModal] = useState<'rocket' | 'provider' | 'location' | 'mission' | null>(null);

    // Handle ESC key to close (only if no sub-modal is open)
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && activeModal === null) onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose, activeModal]);

    const allVideos = [...(launch.vidURLs || []), ...(launch.vid_urls || [])];
    const bestVideo = allVideos.sort((a, b) => b.priority - a.priority)[0];
    const streamUrl = bestVideo?.url;

    const patch = launch.mission_patches?.sort((a, b) => b.priority - a.priority)[0];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            <div className="relative w-full max-w-4xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
                {/* Header Image / Pattern */}
                <div className="h-48 bg-gradient-to-br from-slate-900 via-blue-900/40 to-slate-900 relative overflow-hidden flex-shrink-0">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>

                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white/50 hover:text-white transition-all backdrop-blur-sm z-10"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <div className="absolute bottom-6 left-6 right-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(launch.status.id)}`}>
                                {launch.status.abbrev}
                            </div>
                            <span className="text-slate-400 text-sm font-mono">{new Date(launch.net).toLocaleString()}</span>
                        </div>
                        <h2 className="text-3xl font-black text-white leading-tight">{launch.name}</h2>
                    </div>
                </div>

                {/* Content Scroll Area */}
                <div className="overflow-y-auto p-6 space-y-8">

                    {/* Info Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Mission Type Box - First to match Hero */}
                        {launch.mission?.type && (
                            <div
                                onClick={() => setActiveModal('mission')}
                                className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 hover:border-emerald-500/50 transition-all select-none group"
                            >
                                <div className="p-2 bg-emerald-500/10 rounded-md text-emerald-400 group-hover:scale-110 transition-transform">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div className="min-w-0">
                                    <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold group-hover:text-emerald-400 transition-colors">Mission</div>
                                    <div className="text-white font-medium truncate">{launch.mission.type}</div>
                                </div>
                            </div>
                        )}

                        <div
                            onClick={() => setActiveModal('rocket')}
                            className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 hover:border-blue-500/50 transition-all select-none group"
                        >
                            <div className="p-2 bg-blue-500/10 rounded-md text-blue-400 group-hover:scale-110 transition-transform">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <div className="min-w-0">
                                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold group-hover:text-blue-400 transition-colors">Rocket</div>
                                <div className="text-white font-medium truncate">{launch.rocket.configuration.name}</div>
                            </div>
                        </div>

                        <div
                            onClick={() => setActiveModal('provider')}
                            className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 hover:border-purple-500/50 transition-all select-none group"
                        >
                            <div className="p-2 bg-purple-500/10 rounded-md text-purple-400 group-hover:scale-110 transition-transform">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <div className="min-w-0">
                                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold group-hover:text-purple-400 transition-colors">Provider</div>
                                <div className="text-white font-medium truncate">{launch.launch_service_provider.name}</div>
                            </div>
                        </div>

                        <div
                            onClick={() => setActiveModal('location')}
                            className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 hover:border-slate-500/50 transition-all select-none group"
                        >
                            <div className="p-2 bg-slate-700/50 rounded-md text-slate-300 group-hover:scale-110 transition-transform">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <div className="min-w-0">
                                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold group-hover:text-amber-400 transition-colors">Location</div>
                                <div className="text-white font-medium truncate">{launch.pad.location.name}</div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <span className="w-1 h-6 bg-cyan-500 rounded-full"></span>
                            Mission Overview
                        </h3>
                        <p className="text-slate-300 leading-relaxed">
                            {launch.mission?.description || launch.status.description || "No specific mission details available."}
                        </p>
                    </div>

                    {/* Mission Patch Display */}
                    {patch && (
                        <div className="flex justify-center py-6 border-t border-white/5">
                            <MissionPatch
                                patch={patch}
                                missionName={launch.name}
                                className="w-64 h-64 max-h-64 object-contain"
                            />
                        </div>
                    )}

                    {streamUrl && (
                        <div className="pt-4 border-t border-white/10">
                            <a
                                href={streamUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 w-full py-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all hover:scale-[1.02] shadow-lg shadow-red-900/20"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Watch Launch Stream
                            </a>
                        </div>
                    )}
                </div>

                {/* Modals Layer */}
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
                {activeModal === 'mission' && launch.mission && (
                    <MissionDetailModal
                        mission={launch.mission}
                        timeline={launch.timeline}
                        onClose={() => setActiveModal(null)}
                    />
                )}
            </div>
        </div>
    );
};
