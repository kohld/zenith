import { useEffect, useState } from 'react';
import { DailyHighlights } from './DailyHighlights';
import { ActiveAlerts } from './ActiveAlerts';
import { QuickStats } from './QuickStats';

interface DailyInsights {
    generated_at: string;
    daily_summary: {
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
    };
    alerts: Array<{
        id: string;
        type: string;
        priority: 'high' | 'medium' | 'low';
        title: string;
        message: string;
        action_required: string;
        expires_at: string;
        tags: string[];
    }>;
    aurora_insights?: {
        current_conditions: {
            kp_index: number;
            storm_level: string;
            status: string;
        };
    };
}

interface DashboardProps {
    onViewChange: (view: 'dashboard' | 'orbital' | 'deepspace' | 'gateway' | 'weather') => void;
}

export const Dashboard = ({ onViewChange }: DashboardProps) => {
    const [insights, setInsights] = useState<DailyInsights | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const cacheBuster = Date.now();
        fetch(`${import.meta.env.BASE_URL}data/daily-insights.json?t=${cacheBuster}`)
            .then(res => res.json())
            .then(data => {
                setInsights(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to load daily insights', err);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin h-8 w-8 border-2 border-cyan-500 rounded-full border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-5xl mx-auto p-4 flex flex-col items-center animate-slide-in">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-6">
                Space Intelligence
            </h2>

            <div className="w-full space-y-8">
                <div>
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">
                        {insights?.daily_summary?.headline || 'Daily Overview'}
                    </h3>
                    <DailyHighlights data={insights?.daily_summary} onViewChange={onViewChange} />
                </div>

                {insights?.alerts && insights.alerts.length > 0 && (
                    <div>
                        <ActiveAlerts alerts={insights.alerts} />
                    </div>
                )}

                <div>
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">
                        Quick Stats
                    </h3>
                    <QuickStats insights={insights} />
                </div>
            </div>
        </div>
    );
};
