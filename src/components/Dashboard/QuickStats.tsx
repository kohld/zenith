import { useEffect, useState } from 'react';

interface QuickStatsProps {
    insights: any;
}

export const QuickStats = ({ insights }: QuickStatsProps) => {
    const [nextLaunch, setNextLaunch] = useState<any>(null);
    const [currentKp, setCurrentKp] = useState<number | null>(null);

    useEffect(() => {
        const cacheBuster = Date.now();
        fetch(`${import.meta.env.BASE_URL}data/launches.json?t=${cacheBuster}`)
            .then(res => res.json())
            .then(data => {
                const upcoming = data.launches.find((l: any) => new Date(l.net) > new Date());
                setNextLaunch(upcoming);
            })
            .catch(err => console.error('Failed to load launches', err));

        fetch(`${import.meta.env.BASE_URL}data/aurora.json?t=${cacheBuster}`)
            .then(res => res.json())
            .then(data => {
                const now = new Date();
                const current = data.forecast.find((entry: any) => new Date(entry.time) > now);
                setCurrentKp(current?.kp || null);
            })
            .catch(err => console.error('Failed to load aurora data', err));
    }, []);

    const getTimeUntilLaunch = (netTime: string) => {
        const now = new Date();
        const launch = new Date(netTime);
        const diff = launch.getTime() - now.getTime();

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) return `${days}d ${hours}h`;
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    };

    const getKpStatus = (kp: number) => {
        if (kp >= 7) return { text: 'High Activity', color: 'text-emerald-400' };
        if (kp >= 5) return { text: 'Moderate', color: 'text-amber-400' };
        return { text: 'Low Activity', color: 'text-slate-400' };
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-800/40 backdrop-blur-md border border-white/5 hover:border-rose-500/30 transition-all group">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center text-white">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-white">Next Launch</h3>
                </div>
                {nextLaunch ? (
                    <>
                        <div className="text-sm text-slate-300 mb-2 line-clamp-2">
                            {nextLaunch.name}
                        </div>
                        <div className="text-2xl font-bold text-rose-400 mb-1">
                            {getTimeUntilLaunch(nextLaunch.net)}
                        </div>
                        <div className="text-xs text-slate-500">
                            {new Date(nextLaunch.net).toLocaleDateString(undefined, { 
                                month: 'short', 
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </div>
                    </>
                ) : (
                    <div className="text-slate-500">Loading...</div>
                )}
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/40 backdrop-blur-md border border-white/5 hover:border-emerald-500/30 transition-all group">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 6c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2M3 12c2 0 2-3 4-3s2 3 4 3 2-3 4-3 2 3 4 3M3 18c2 0 2-4 4-4s2 4 4 4 2-4 4-4 2 4 4 4" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-white">Aurora Now</h3>
                </div>
                {currentKp !== null ? (
                    <>
                        <div className="text-2xl font-bold text-emerald-400 mb-1">
                            Kp {currentKp.toFixed(1)}
                        </div>
                        <div className={`text-sm font-medium ${getKpStatus(currentKp).color}`}>
                            {getKpStatus(currentKp).text}
                        </div>
                        {insights?.aurora_insights?.current_conditions?.storm_level && (
                            <div className="text-xs text-slate-500 mt-2">
                                {insights.aurora_insights.current_conditions.storm_level}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-slate-500">Loading...</div>
                )}
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/40 backdrop-blur-md border border-white/5 hover:border-cyan-500/30 transition-all group">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-white">This Week</h3>
                </div>
                {insights?.daily_summary?.statistics ? (
                    <>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-400">Total Launches</span>
                                <span className="text-lg font-bold text-cyan-400">
                                    {insights.daily_summary.statistics.total_launches_this_week || 0}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-400">Aurora Events</span>
                                <span className="text-lg font-bold text-emerald-400">
                                    {insights.daily_summary.statistics.aurora_opportunities || 0}
                                </span>
                            </div>
                            {insights.daily_summary.statistics.crewed_missions > 0 && (
                                <div className="flex justify-between items-center pt-2 border-t border-white/5">
                                    <span className="text-sm text-slate-400">Crewed Missions</span>
                                    <span className="text-lg font-bold text-rose-400">
                                        {insights.daily_summary.statistics.crewed_missions}
                                    </span>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="text-slate-500">No statistics available</div>
                )}
            </div>
        </div>
    );
};
