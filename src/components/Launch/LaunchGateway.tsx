
import { useEffect, useState, useMemo } from 'react';
import { Launch, LaunchData } from '../../lib/definitions';
import { LaunchDetailModal } from './LaunchDetailModal';
import { LaunchHero } from './LaunchHero';
import { UpcomingLaunches } from './UpcomingLaunches';

type FilterType = 'artemis' | 'heavy' | 'crewed' | null;

// --- Filter Icons ---
const Icons = {
    Crewed: ({ className }: { className?: string }) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M19 16l-2 3 5 0-3-3" />
        </svg>
    ),
    Moon: ({ className }: { className?: string }) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
    ),
    Rocket: ({ className }: { className?: string }) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
            <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
            <path d="M9 12H4s.5-1 1-4c1.5 0 3 .5 3 .5L12 3c1 1.5 1.5 3 1.5 3L11 9c0 1.5.5 3 .5 3" />
        </svg>
    )
};

export const LaunchGateway = () => {
    const [allUpcoming, setAllUpcoming] = useState<Launch[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLaunch, setSelectedLaunch] = useState<Launch | null>(null);
    const [activeFilter, setActiveFilter] = useState<FilterType>(null);
    const [excludeStarlink, setExcludeStarlink] = useState(false);
    const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number }>({ d: 0, h: 0, m: 0, s: 0 });

    useEffect(() => {
        fetch(`${import.meta.env.BASE_URL}data/launches.json`)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                return res.json();
            })
            .then((data: LaunchData) => {
                const upcoming = data.launches.filter(l => new Date(l.net).getTime() > Date.now());
                setAllUpcoming(upcoming);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load launches", err);
                setLoading(false);
            });
    }, []);

    const filteredLaunches = useMemo(() => {
        return allUpcoming.filter(launch => {
            // DNR Filter: Starlink
            if (excludeStarlink && (launch.name.includes('Starlink') || launch.mission?.name?.includes('Starlink'))) {
                return false;
            }

            // Categorical Filters
            if (!activeFilter) return true;
            if (activeFilter === 'artemis') return launch.program?.some(p => p.name.includes('Artemis'));
            if (activeFilter === 'heavy') return launch.rocket.configuration.full_name.includes('Falcon Heavy');
            if (activeFilter === 'crewed') {
                const type = launch.mission?.type?.toLowerCase() || '';
                return type.includes('human');
            }
            return true;
        });
    }, [allUpcoming, activeFilter, excludeStarlink]);

    const nextLaunch = filteredLaunches[0] || null;

    // Countdown Timer for the (potentially filtered) next launch
    useEffect(() => {
        if (!nextLaunch) {
            setTimeLeft({ d: 0, h: 0, m: 0, s: 0 });
            return;
        }

        const interval = setInterval(() => {
            const now = new Date().getTime();
            const launchTime = new Date(nextLaunch.net).getTime();
            const distance = launchTime - now;

            if (distance < 0) {
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

    const toggleFilter = (filter: FilterType) => {
        setActiveFilter(prev => prev === filter ? null : filter);
    };

    return (
        <div className="w-full max-w-7xl mx-auto p-4 flex flex-col items-center animate-in fade-in duration-500">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-rose-400 to-red-500 bg-clip-text text-transparent mb-6">
                Launch Gateway
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full items-stretch">
                {/* HERO: Next Launch */}
                <div className="lg:col-span-2 min-w-0 flex flex-col gap-4">
                    <div className="h-8 flex items-center">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                            {activeFilter ? `Next ${activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)} Mission` : "Next Mission"}
                        </h3>
                    </div>
                    {nextLaunch ? (
                        <div className="flex-grow">
                            <LaunchHero nextLaunch={nextLaunch} timeLeft={timeLeft} />
                        </div>
                    ) : (
                        <div className="flex-grow p-12 rounded-2xl bg-slate-900/50 border border-white/5 flex flex-col items-center justify-center text-center">
                            <div className="text-4xl mb-4">🔭</div>
                            <h4 className="text-xl font-bold text-white mb-2">No matching missions found</h4>
                            <p className="text-slate-400 max-w-md">Try adjusting your filters to see more upcoming space adventures.</p>
                            <button
                                onClick={() => { setActiveFilter(null); setExcludeStarlink(false); }}
                                className="mt-6 px-6 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium transition-colors"
                            >
                                Reset Filters
                            </button>
                        </div>
                    )}
                </div>

                {/* SIDEBAR: Upcoming List */}
                <div className="lg:col-span-1 min-w-0 flex flex-col gap-4">
                    <div className="h-8 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Upcoming Schedule</h3>

                        {/* Filter Bar */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => toggleFilter('artemis')}
                                title="Filter for Artemis Program"
                                className={`transition-all hover:scale-110 p-0.5 ${activeFilter === 'artemis' ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]' : 'text-slate-600 hover:text-slate-400'}`}
                            >
                                <Icons.Moon className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => toggleFilter('crewed')}
                                title="Filter for Crewed Missions"
                                className={`transition-all hover:scale-110 p-0.5 ${activeFilter === 'crewed' ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]' : 'text-slate-600 hover:text-slate-400'}`}
                            >
                                <Icons.Crewed className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => toggleFilter('heavy')}
                                title="Filter for Heavy Lift Rockets"
                                className={`transition-all hover:scale-110 p-0.5 ${activeFilter === 'heavy' ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]' : 'text-slate-600 hover:text-slate-400'}`}
                            >
                                <Icons.Rocket className="w-4 h-4" />
                            </button>

                            <div className="w-[1px] h-4 bg-white/10 mx-1"></div>

                            <button
                                onClick={() => setExcludeStarlink(!excludeStarlink)}
                                title={excludeStarlink ? "Show Starlink Missions" : "Hide Starlink Missions"}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${excludeStarlink ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400' : 'border-slate-700 text-slate-500'}`}
                            >
                                NO SL
                            </button>
                        </div>
                    </div>
                    <div className="flex-grow flex flex-col">
                        <UpcomingLaunches
                            launches={filteredLaunches}
                            onSelectLaunch={(launch) => setSelectedLaunch(launch)}
                        />
                    </div>
                </div>
            </div>
            {/* MODAL */}
            {selectedLaunch && <LaunchDetailModal launch={selectedLaunch} onClose={() => setSelectedLaunch(null)} />}
        </div >
    );
};
