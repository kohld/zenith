
import { useEffect, useState } from 'react';
import { Launch, LaunchData } from '../../lib/definitions';
import { getStatusColor } from './utils';
import { LaunchDetailModal } from './LaunchDetailModal';
import { LaunchMap } from './LaunchMap';

export const LaunchGateway = () => {
    const [launches, setLaunches] = useState<Launch[]>([]);
    const [loading, setLoading] = useState(true);
    const [nextLaunch, setNextLaunch] = useState<Launch | null>(null);
    const [selectedLaunch, setSelectedLaunch] = useState<Launch | null>(null);
    const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number }>({ d: 0, h: 0, m: 0, s: 0 });

    useEffect(() => {
        fetch(`${import.meta.env.BASE_URL}data/launches.json`)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                return res.json();
            })
            .then((data: LaunchData) => {
                const upcoming = data.launches.filter(l => new Date(l.net).getTime() > Date.now());
                setLaunches(upcoming);
                if (upcoming.length > 0) {
                    setNextLaunch(upcoming[0]);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load launches", err);
                setLoading(false);
            });
    }, []);

    // Countdown Timer
    useEffect(() => {
        if (!nextLaunch) return;

        const interval = setInterval(() => {
            const now = new Date().getTime();
            const launchTime = new Date(nextLaunch.net).getTime();
            const distance = launchTime - now;

            if (distance < 0) {
                // Launch passed
                setTimeLeft({ d: 0, h: 0, m: 0, s: 0 });
            } else {
                setTimeLeft({
                    d: Math.floor(distance / (1000 * 60 * 60 * 24)),
                    h: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                    m: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                    s: Math.floor((distance % (1000 * 60)) / 1000)
                });
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [nextLaunch]);

    if (loading) return <div className="flex items-center justify-center h-full"><div className="animate-spin h-8 w-8 border-2 border-cyan-500 rounded-full border-t-transparent"></div></div>;

    const streamUrl = nextLaunch?.vidURLs?.[0]?.url || nextLaunch?.vid_urls?.[0]?.url;

    return (
        <div className="w-full max-w-7xl mx-auto p-4 flex flex-col items-center animate-in fade-in duration-500">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-rose-400 to-red-500 bg-clip-text text-transparent mb-6">
                Launch Gateway
            </h2>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* HERO: Next Launch */}
                <div className="lg:w-2/3 flex flex-col gap-4">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Next Mission</h3>
                    <div className="flex-grow relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-md p-8 sm:p-12 shadow-2xl flex flex-col justify-center">
                        {/* Background Glow */}
                        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

                        {nextLaunch ? (
                            <div className="relative z-10 flex flex-col h-full justify-center">
                                <div className="flex flex-wrap items-center gap-3 mb-4">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full w-fit">
                                        <span className="animate-pulse w-2 h-2 rounded-full bg-cyan-400"></span>
                                        <span className="text-cyan-400 text-xs font-mono uppercase tracking-widest">Next Mission</span>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider ${getStatusColor(nextLaunch.status.id)}`}>
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


                                <p className="text-slate-400 text-sm max-w-2xl mb-4 leading-relaxed border-l-2 border-white/10 pl-4">
                                    {nextLaunch.status.description}
                                </p>

                                {nextLaunch.mission?.description && (
                                    <p className="text-slate-300 text-sm max-w-2xl mb-8 leading-relaxed pl-4">
                                        {nextLaunch.mission.description}
                                    </p>
                                )}

                                {/* Details & Map Row - Stretch Alignment for Equal Height */}
                                <div className="flex flex-col xl:flex-row gap-6 justify-between items-stretch mb-8">
                                    {/* Left Side: Info Boxes Group */}
                                    <div className="flex-grow flex flex-col justify-between gap-4">
                                        {nextLaunch.mission?.type && (
                                            <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm w-fit">
                                                <div className="p-2 bg-emerald-500/10 rounded-md text-emerald-400">
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Type</div>
                                                    <div className="text-lg text-slate-200 font-medium">{nextLaunch.mission.type}</div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm w-fit">
                                            <div className="p-2 bg-blue-500/10 rounded-md text-blue-400">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Rocket</div>
                                                <div className="text-lg text-slate-200 font-medium">{nextLaunch.rocket.configuration.name}</div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm w-fit">
                                            <div className="p-2 bg-purple-500/10 rounded-md text-purple-400">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                </svg>
                                            </div>
                                            <div>
                                                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Provider</div>
                                                <div className="text-lg text-slate-200 font-medium">{nextLaunch.launch_service_provider.name}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* HERO MAP INTEGRATION - Auto Height to Match Left Side */}
                                    <div className="hidden xl:block relative z-20 pointer-events-none flex-shrink-0">
                                        <LaunchMap
                                            latitude={parseFloat(nextLaunch.pad.latitude)}
                                            longitude={parseFloat(nextLaunch.pad.longitude)}
                                            autoHeight={true}
                                            zoom={5}
                                            className="w-72 shadow-[0_8px_32px_rgba(0,0,0,0.5)] !border-white/20 h-full"
                                        />
                                    </div>
                                </div>

                                {/* COUNTDOWN */}
                                <div className="grid grid-cols-4 gap-2 sm:gap-4 mb-10 max-w-2xl">
                                    {Object.entries(timeLeft).map(([unit, value]) => (
                                        <div key={unit} className="flex flex-col items-center p-4 bg-black/20 rounded-lg border border-white/5">
                                            <span className="text-3xl sm:text-5xl font-mono font-bold text-white tabular-nums">
                                                {value.toString().padStart(2, '0')}
                                            </span>
                                            <span className="text-xs text-slate-500 uppercase tracking-widest mt-1">
                                                {unit === 'd' ? 'Days' : unit === 'h' ? 'Hours' : unit === 'm' ? 'Minutes' : 'Seconds'}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex flex-col gap-4 items-start">
                                    {streamUrl ? (
                                        <a
                                            href={streamUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group flex items-center gap-3 px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-all hover:scale-105 shadow-[0_0_20px_rgba(220,38,38,0.4)]"
                                        >
                                            <svg className="w-5 h-5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            WATCH LIVE
                                        </a>
                                    ) : (
                                        <button disabled className="flex items-center gap-3 px-6 py-3 bg-slate-800 text-slate-500 font-bold rounded-lg cursor-not-allowed">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                            </svg>
                                            NO STREAM YET
                                        </button>
                                    )}

                                    <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-lg text-slate-300 font-mono text-sm flex items-center">
                                        <svg className="w-4 h-4 mr-2 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        {nextLaunch.pad.location.name}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-500">No upcoming launches found.</div>
                        )}
                    </div>
                </div>

                {/* SIDEBAR: Upcoming List */}
                <div className="lg:w-1/3 flex flex-col gap-4">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Upcoming Schedule</h3>

                    <div className="flex-grow space-y-4">
                        {launches.slice(1, 6).map((launch) => (
                            <div
                                key={launch.id}
                                onClick={() => setSelectedLaunch(launch)}
                                className="p-4 rounded-xl bg-slate-800/30 border border-white/5 hover:bg-slate-800/50 hover:border-cyan-500/30 transition-all group cursor-pointer"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="text-xs font-mono text-cyan-500/80">
                                        {new Date(launch.net).toLocaleString(undefined, {
                                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                        })}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {(launch.webcast_live || (launch.vidURLs?.length ?? 0) > 0 || (launch.vid_urls?.length ?? 0) > 0) && (
                                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-wider animate-pulse">
                                                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                                Live
                                            </div>
                                        )}
                                        <div className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border ${getStatusColor(launch.status.id)}`}>
                                            {launch.status.abbrev}
                                        </div>
                                    </div>
                                </div>

                                <h4 className="font-bold text-white group-hover:text-cyan-400 transition-colors truncate" title={launch.name}>
                                    {launch.name}
                                </h4>

                                <div className="text-sm text-slate-400 mt-1 truncate">
                                    {launch.launch_service_provider.name}
                                </div>

                                {launch.mission?.type && (
                                    <div className="mt-2 text-[10px] w-fit px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/5 uppercase tracking-wide">
                                        {launch.mission.type}
                                    </div>
                                )}

                                <div className="mt-3 flex items-center text-xs text-slate-500">
                                    <span className="truncate max-w-[200px]">{launch.pad.name}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div >

            {/* MODAL */}
            {selectedLaunch && <LaunchDetailModal launch={selectedLaunch} onClose={() => setSelectedLaunch(null)} />}
        </div >
    );
};
