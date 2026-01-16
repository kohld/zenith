
import { useState } from 'react';
import { Launch } from '../../lib/definitions';
import { getStatusColor } from './utils';
import { MissionPatch } from './MissionPatch';
import { RocketDetailModal } from './InfoModals/RocketDetailModal';
import { ProviderDetailModal } from './InfoModals/ProviderDetailModal';
import { LocationDetailModal } from './InfoModals/LocationDetailModal';
import { MissionDetailModal } from './InfoModals/MissionDetailModal';

interface LaunchHeroProps {
    nextLaunch: Launch | null;
    timeLeft: { d: number; h: number; m: number; s: number };
}

export const LaunchHero = ({ nextLaunch, timeLeft }: LaunchHeroProps) => {
    const [activeModal, setActiveModal] = useState<'rocket' | 'provider' | 'location' | 'mission' | null>(null);
    const allVideos = [...(nextLaunch?.vidURLs || []), ...(nextLaunch?.vid_urls || [])];
    const bestVideo = allVideos.sort((a, b) => b.priority - a.priority)[0];
    const streamUrl = bestVideo?.url;

    // Get patch (priority sorted)
    const patch = nextLaunch?.mission_patches?.sort((a, b) => b.priority - a.priority)[0];

    return (
        <div className="flex-grow h-full relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-md p-6 sm:p-10 shadow-2xl flex flex-col">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

            {nextLaunch ? (
                <div className="relative z-10 flex flex-col flex-grow">
                    <div className="flex flex-wrap items-center gap-2 mb-6">
                        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full w-fit">
                            <span className="animate-pulse w-2 h-2 rounded-full bg-cyan-400"></span>
                            <span className="text-cyan-400 text-[10px] font-mono uppercase tracking-widest">Next Mission</span>
                        </div>
                        <div className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${getStatusColor(nextLaunch.status.id)}`}>
                            {nextLaunch.status.name}
                        </div>
                    </div>

                    {nextLaunch.name.includes('|') ? (
                        <>
                            <h2 className="text-4xl sm:text-6xl font-black text-white leading-tight tracking-tight">
                                {nextLaunch.name.split('|')[0].trim()}
                            </h2>
                            <h3 className="text-2xl sm:text-3xl font-light text-slate-300 mb-4">
                                {nextLaunch.name.split('|')[1].trim()}
                            </h3>
                        </>
                    ) : (
                        <h2 className="text-4xl sm:text-6xl font-black text-white mb-4 leading-tight tracking-tight">
                            {nextLaunch.name}
                        </h2>
                    )}


                    <p className="text-slate-400 text-sm max-w-2xl mb-4 leading-relaxed border-l-2 border-white/10 pl-6">
                        {nextLaunch.status.description}
                    </p>

                    {nextLaunch.mission?.description && (
                        <p className="text-slate-300 text-sm max-w-2xl mb-8 leading-relaxed pl-6 line-clamp-4 overflow-hidden text-ellipsis">
                            {nextLaunch.mission.description}
                        </p>
                    )}

                    <div className="flex flex-col lg:flex-row gap-8 justify-between items-start mb-10">
                        {/* Info Boxes */}
                        <div className="flex flex-col gap-4">
                            {nextLaunch.mission?.type && (
                                <div
                                    onClick={() => setActiveModal('mission')}
                                    className="flex items-center gap-4 px-4 py-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm w-fit cursor-pointer hover:bg-white/10 hover:border-emerald-500/30 transition-all select-none group"
                                >
                                    <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 group-hover:scale-110 transition-transform">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold group-hover:text-emerald-400 transition-colors">Mission</div>
                                        <div className="text-lg text-slate-200 font-medium">{nextLaunch.mission.type}</div>
                                    </div>
                                </div>
                            )}

                            <div
                                onClick={() => setActiveModal('rocket')}
                                className="flex items-center gap-4 px-4 py-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm w-fit cursor-pointer hover:bg-white/10 hover:border-blue-500/30 transition-all select-none group"
                            >
                                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 group-hover:scale-110 transition-transform">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                </div>
                                <div className="pr-4">
                                    <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold group-hover:text-blue-400 transition-colors">Rocket</div>
                                    <div className="text-lg text-slate-200 font-medium">{nextLaunch.rocket.configuration.name}</div>
                                </div>
                            </div>

                            <div
                                onClick={() => setActiveModal('provider')}
                                className="flex items-center gap-4 px-4 py-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm w-fit cursor-pointer hover:bg-white/10 hover:border-purple-500/30 transition-all select-none group"
                            >
                                <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400 group-hover:scale-110 transition-transform">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                </div>
                                <div className="pr-4">
                                    <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold group-hover:text-purple-400 transition-colors">Provider</div>
                                    <div className="text-lg text-slate-200 font-medium">{nextLaunch.launch_service_provider.name}</div>
                                </div>
                            </div>
                        </div>

                        {/* Mission Patch */}
                        <div className="hidden sm:block relative z-20">
                            {patch ? (
                                <MissionPatch
                                    patch={patch}
                                    missionName={nextLaunch.name}
                                    className="w-48 h-48 drop-shadow-[0_0_30px_rgba(34,211,238,0.2)]"
                                />
                            ) : (
                                <div className="w-48 h-48 flex items-center justify-center opacity-5">
                                    <svg className="w-32 h-32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                                    </svg>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-auto">
                        {/* COUNTDOWN */}
                        <div className="grid grid-cols-4 gap-4 sm:gap-6 mb-8 max-w-2xl">
                            {Object.entries(timeLeft).map(([unit, value]) => (
                                <div key={unit} className="flex flex-col items-center p-4 bg-black/20 rounded-xl border border-white/5">
                                    <span className="text-3xl sm:text-5xl font-mono font-bold text-white tabular-nums">
                                        {value.toString().padStart(2, '0')}
                                    </span>
                                    <span className="text-xs text-slate-500 uppercase tracking-widest mt-1">
                                        {unit === 'd' ? 'Days' : unit === 'h' ? 'Hours' : unit === 'm' ? 'Minutes' : 'Seconds'}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-col gap-6 items-start">
                            {streamUrl ? (
                                <a
                                    href={streamUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group flex items-center gap-3 px-8 py-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all hover:scale-105 shadow-[0_0_20px_rgba(220,38,38,0.4)]"
                                >
                                    <svg className="w-6 h-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    WATCH LIVE
                                </a>
                            ) : (
                                <div className="flex items-center gap-3 px-8 py-4 bg-slate-800 text-slate-500 font-bold rounded-xl border border-white/5 uppercase tracking-wider text-sm opacity-50">
                                    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                    </svg>
                                    No Stream Yet
                                </div>
                            )}

                            <div
                                onClick={() => setActiveModal('location')}
                                className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-xl text-slate-300 font-mono text-sm flex items-center cursor-pointer hover:bg-white/10 hover:border-slate-500/50 transition-colors select-none"
                            >
                                <svg className="w-5 h-5 mr-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {nextLaunch.pad.location.name}
                            </div>
                        </div>
                    </div>

                    {/* MODALS */}
                    {activeModal === 'rocket' && nextLaunch.rocket.configuration && (
                        <RocketDetailModal
                            rocket={nextLaunch.rocket.configuration}
                            onClose={() => setActiveModal(null)}
                        />
                    )}
                    {activeModal === 'provider' && nextLaunch.launch_service_provider && (
                        <ProviderDetailModal
                            provider={nextLaunch.launch_service_provider}
                            onClose={() => setActiveModal(null)}
                        />
                    )}
                    {activeModal === 'location' && nextLaunch.pad && (
                        <LocationDetailModal
                            pad={nextLaunch.pad}
                            weather={{
                                probability: nextLaunch.probability,
                                concerns: nextLaunch.weather_concerns
                            }}
                            onClose={() => setActiveModal(null)}
                        />
                    )}
                    {activeModal === 'mission' && nextLaunch.mission && (
                        <MissionDetailModal
                            mission={nextLaunch.mission}
                            updates={nextLaunch.updates}
                            timeline={nextLaunch.timeline}
                            onClose={() => setActiveModal(null)}
                        />
                    )}
                </div>
            ) : (
                <div className="flex items-center justify-center h-full text-slate-500">No upcoming launches found.</div>
            )}
        </div>
    );
};
