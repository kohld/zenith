interface Alert {
    id: string;
    type: string;
    priority: 'high' | 'medium' | 'low';
    title: string;
    message: string;
    action_required: string;
    expires_at: string;
    tags: string[];
}

interface ActiveAlertsProps {
    alerts: Alert[];
}

export const ActiveAlerts = ({ alerts }: ActiveAlertsProps) => {
    if (!alerts || alerts.length === 0) return null;

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return 'border-rose-500/50 bg-rose-500/10';
            case 'medium': return 'border-amber-500/50 bg-amber-500/10';
            case 'low': return 'border-emerald-500/50 bg-emerald-500/10';
            default: return 'border-slate-500/50 bg-slate-500/10';
        }
    };

    const getPriorityIcon = (priority: string) => {
        switch (priority) {
            case 'high':
                return (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                );
            case 'medium':
                return (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            case 'low':
                return (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            default:
                return (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
        }
    };

    const getTimeRemaining = (expiresAt: string) => {
        const now = new Date();
        const expires = new Date(expiresAt);
        const diff = expires.getTime() - now.getTime();
        
        if (diff < 0) return 'Expired';
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days}d`;
        if (hours > 0) return `${hours}h`;
        return '<1h';
    };

    return (
        <div className="p-6 rounded-2xl bg-slate-800/40 backdrop-blur-md border border-white/5">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-3">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    Active Alerts
                    <span className="text-sm font-normal text-slate-500 ml-2">({alerts.length})</span>
                </h3>
            </div>

            <div className="space-y-3">
                {alerts.map((alert) => (
                    <div
                        key={alert.id}
                        className={`p-4 rounded-xl border ${getPriorityColor(alert.priority)} transition-all hover:scale-[1.01]`}
                    >
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5 text-white">
                                {getPriorityIcon(alert.priority)}
                            </div>
                            <div className="flex-grow">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-base font-bold text-white">{alert.title}</h3>
                                </div>
                                <p className="text-sm text-slate-300 mb-2">{alert.message}</p>
                                <div className="flex items-center gap-3 flex-wrap">
                                    <span className="text-xs px-2 py-1 rounded bg-slate-900/50 text-slate-400 border border-white/10">
                                        {alert.action_required}
                                    </span>
                                    <span className="text-xs text-slate-500 font-mono">
                                        Expires: {getTimeRemaining(alert.expires_at)}
                                    </span>
                                    {alert.tags.slice(0, 2).map(tag => (
                                        <span key={tag} className="text-xs px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
