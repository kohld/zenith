interface DailySummary {
    headline: string;
    top_events: Array<{
        rank: number;
        title: string;
        description: string;
        importance: number;
        date: string;
        type: string;
        action: string;
    }>;
    statistics: {
        total_launches_this_week: number;
        crewed_missions: number;
        historic_events: number;
        aurora_opportunities: number;
    };
}

interface DailyHighlightsProps {
    data?: DailySummary;
    onViewChange: (view: 'dashboard' | 'orbital' | 'deepspace' | 'gateway' | 'weather') => void;
}

export const DailyHighlights = ({ data, onViewChange }: DailyHighlightsProps) => {
    if (!data) return null;

    const handleEventClick = (eventType: string) => {
        switch (eventType) {
            case 'launch':
                onViewChange('gateway');
                break;
            case 'aurora':
                onViewChange('weather');
                break;
            case 'satellite':
                onViewChange('orbital');
                break;
            default:
                break;
        }
    };

    const getEventIcon = (type: string) => {
        switch (type) {
            case 'launch':
                return (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                    </svg>
                );
            case 'aurora':
                return (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 6c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2M3 12c2 0 2-3 4-3s2 3 4 3 2-3 4-3 2 3 4 3M3 18c2 0 2-4 4-4s2 4 4 4 2-4 4-4 2 4 4 4" />
                    </svg>
                );
            case 'satellite':
                return (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                    </svg>
                );
            default:
                return (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                );
        }
    };

    const getImportanceColor = (importance: number) => {
        if (importance >= 9) return 'from-rose-500 to-orange-500';
        if (importance >= 7) return 'from-cyan-400 to-blue-500';
        return 'from-emerald-400 to-teal-500';
    };

    return (
        <div className="p-6 rounded-2xl bg-slate-800/40 backdrop-blur-md border border-white/5">

            <div className="space-y-4">
                {data.top_events.map((event) => (
                    <div
                        key={event.rank}
                        onClick={() => handleEventClick(event.type)}
                        className="p-4 rounded-xl bg-slate-900/50 border border-white/5 hover:border-cyan-500/30 transition-all group cursor-pointer"
                    >
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getImportanceColor(event.importance)} flex items-center justify-center text-white`}>
                                    {getEventIcon(event.type)}
                                </div>
                            </div>
                            <div className="flex-grow">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-bold text-slate-500">#{event.rank}</span>
                                    <h3 className="text-lg font-bold text-white">{event.title}</h3>
                                </div>
                                <p className="text-slate-300 text-sm mb-3">{event.description}</p>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs text-slate-500 font-mono">{new Date(event.date).toLocaleDateString()}</span>
                                    <span className="text-xs px-2 py-1 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                        {event.action}
                                    </span>
                                </div>
                            </div>
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-slate-400 group-hover:text-cyan-400 group-hover:border-cyan-500/50 transition-all">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6 pt-6 border-t border-white/5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-cyan-400">{data.statistics.total_launches_this_week}</div>
                        <div className="text-xs text-slate-500 uppercase tracking-wider">Launches This Week</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-rose-400">{data.statistics.crewed_missions}</div>
                        <div className="text-xs text-slate-500 uppercase tracking-wider">Crewed Missions</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-purple-400">{data.statistics.historic_events}</div>
                        <div className="text-xs text-slate-500 uppercase tracking-wider">Historic Events</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-emerald-400">{data.statistics.aurora_opportunities}</div>
                        <div className="text-xs text-slate-500 uppercase tracking-wider">Aurora Opportunities</div>
                    </div>
                </div>
            </div>
        </div>
    );
};
