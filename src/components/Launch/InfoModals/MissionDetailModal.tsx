import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Mission, Update, TimelineNode } from '../../../lib/definitions';

interface MissionDetailModalProps {
    mission: Mission;
    updates?: Update[];
    timeline?: TimelineNode[];
    onClose: () => void;
}

// Helper to format ISO duration (PT1M12S) to T+MM:SS
const formatDuration = (duration: string) => {
    if (!duration.startsWith('P')) return duration;

    // Simple regex to parse PT#M#S
    const minutesMatch = duration.match(/(\d+)M/);
    const secondsMatch = duration.match(/(\d+)S/);

    const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
    const seconds = secondsMatch ? parseInt(secondsMatch[1]) : 0;

    return `T+${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export const MissionDetailModal = ({ mission, updates, timeline, onClose }: MissionDetailModalProps) => {
    const hasUpdates = updates && updates.length > 0;
    const hasTimeline = timeline && timeline.length > 0;

    // Default to Live Feed if available, otherwise Plan
    const [activeTab, setActiveTab] = useState<'live' | 'plan'>(() => {
        if (hasUpdates) return 'live';
        return 'plan';
    });

    // Handle ESC key to close
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    if (!mission) return null;

    return createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">

                {/* Header - Matching Other Modals */}
                <div className="relative p-6 border-b border-white/5 bg-gradient-to-r from-emerald-900/20 to-slate-900/0">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">{mission.name}</h2>
                            <p className="text-sm text-emerald-400 font-mono">Mission Profile</p>
                        </div>
                    </div>
                </div>

                {/* Content Body */}
                <div className="p-6 overflow-y-auto custom-scrollbar space-y-8">

                    {/* Mission Overview Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg bg-white/5 border border-white/5">
                            <div className="text-xs text-slate-500 uppercase tracking-wider mb-2 font-bold">Category</div>
                            <div className="text-lg text-slate-200 font-medium">{mission.type}</div>
                        </div>

                        {mission.orbit && (
                            <div className="p-4 rounded-lg bg-white/5 border border-white/5">
                                <div className="text-xs text-slate-500 uppercase tracking-wider mb-2 font-bold">Target Orbit</div>
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full border-2 border-slate-600 flex items-center justify-center relative">
                                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full absolute -top-0.5 right-0.5"></div>
                                    </div>
                                    <div>
                                        <div className="text-white font-medium">{mission.orbit.name}</div>
                                        <div className="text-xs text-slate-500">{mission.orbit.abbrev}</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Description</h3>
                        <p className="text-slate-300 text-sm leading-relaxed p-4 rounded-lg bg-white/5 border border-white/5">
                            {mission.description || "No detailed description available for this mission."}
                        </p>
                    </div>

                    {/* Dynamic Content Area */}
                    <div className="pt-4 border-t border-white/10">
                        {/* Title Row & Toggle Switch */}
                        <div className="flex items-center justify-between pb-6">
                            <div className="flex items-center gap-3">
                                {activeTab === 'live' ? (
                                    <>
                                        <span className="relative flex h-3 w-3">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                                        </span>
                                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Mission Updates</h3>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Planned Timeline</h3>
                                    </>
                                )}
                            </div>

                            {/* Toggle Switch */}
                            {(hasUpdates && hasTimeline) && (
                                <div className="flex bg-white/5 rounded-lg p-1 border border-white/5">
                                    {hasUpdates && (
                                        <button
                                            onClick={() => setActiveTab('live')}
                                            className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'live'
                                                ? 'bg-emerald-500 text-white shadow-lg'
                                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                                                }`}
                                        >
                                            Live
                                        </button>
                                    )}
                                    {hasTimeline && (
                                        <button
                                            onClick={() => setActiveTab('plan')}
                                            className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'plan'
                                                ? 'bg-blue-600 text-white shadow-lg'
                                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                                                }`}
                                        >
                                            Plan
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* LIVE CONTENT */}
                        {activeTab === 'live' && updates && (
                            <div className="relative pl-4 ml-2 space-y-6 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-px before:bg-slate-700">
                                {updates.map((update) => (
                                    <div key={update.id} className="relative pl-6">
                                        {/* Dot */}
                                        <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-slate-900 border-2 border-emerald-500"></div>

                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                                                <span>{new Date(update.created_on).toLocaleString()}</span>
                                                {update.created_by && <span>• by {update.created_by}</span>}
                                            </div>

                                            <div className="bg-white/5 p-4 rounded-lg border border-white/5">
                                                <div className="flex gap-4">
                                                    {update.profile_image && (
                                                        <img
                                                            src={update.profile_image}
                                                            alt={update.created_by}
                                                            className="w-10 h-10 rounded-full object-cover border border-white/10"
                                                        />
                                                    )}
                                                    <div className="text-sm text-slate-300 leading-relaxed">
                                                        {update.comment}
                                                    </div>
                                                </div>
                                                {update.info_url && (
                                                    <a
                                                        href={update.info_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-block mt-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                                                    >
                                                        Source ↗
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* PLAN CONTENT */}
                        {activeTab === 'plan' && timeline && (
                            <div className="relative pl-4 ml-2 space-y-6 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-px before:bg-slate-700">
                                {timeline.map((event, i) => (
                                    <div key={i} className="relative pl-6">
                                        {/* Dot */}
                                        <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-slate-900 border-2 border-blue-500"></div>

                                        <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
                                            <span className="font-mono text-blue-400 font-bold w-20 flex-shrink-0 text-sm">
                                                {formatDuration(event.relative_time)}
                                            </span>
                                            <div>
                                                <div className="text-slate-200 font-medium text-sm">{event.type.description || event.type.abbrev}</div>
                                                <div className="text-xs text-slate-500 font-mono mt-0.5">{event.type.abbrev}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
