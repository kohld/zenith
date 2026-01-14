
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { LaunchServiceProvider } from '../../../lib/definitions';

interface ProviderDetailModalProps {
    provider: LaunchServiceProvider;
    onClose: () => void;
}

export const ProviderDetailModal = ({ provider, onClose }: ProviderDetailModalProps) => {
    // Handle ESC key to close
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    // Calculate success rate
    const total = provider.total_launch_count || 0;
    const success = provider.successful_launches || 0;
    const rate = total > 0 ? Math.round((success / total) * 100) : 0;

    return createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="relative p-6 border-b border-white/5 bg-gradient-to-r from-purple-900/20 to-slate-900/0">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <div className="flex items-center gap-4 mb-2">
                        {provider.logo_url ? (
                            <img src={provider.logo_url} alt={provider.name} className="w-16 h-16 object-contain bg-white/5 rounded-xl p-2" />
                        ) : (
                            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                        )}
                        <div>
                            <h2 className="text-xl font-bold text-white">{provider.name}</h2>
                            <div className="flex items-center gap-2 text-sm text-purple-400 font-mono">
                                {provider.country_code && <span>{provider.country_code}</span>}
                                <span>•</span>
                                <span>{provider.type}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    {provider.description && (
                        <p className="text-slate-300 text-sm leading-relaxed mb-6">
                            {provider.description}
                        </p>
                    )}

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                        <div className="p-3 rounded-lg bg-white/5 border border-white/5 text-center">
                            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total</div>
                            <div className="text-2xl font-mono text-white">{total}</div>
                        </div>
                        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
                            <div className="text-xs text-emerald-500/70 uppercase tracking-wider mb-1">Success</div>
                            <div className="text-2xl font-mono text-emerald-400">{success}</div>
                        </div>
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
                            <div className="text-xs text-red-500/70 uppercase tracking-wider mb-1">Failed</div>
                            <div className="text-2xl font-mono text-red-400">{provider.failed_launches || 0}</div>
                        </div>
                        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-center">
                            <div className="text-xs text-blue-500/70 uppercase tracking-wider mb-1">Rate</div>
                            <div className="text-2xl font-mono text-blue-400">{rate}%</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-400">
                        {provider.administrator && (
                            <div className="flex flex-col">
                                <span className="text-xs text-slate-500 uppercase tracking-wider mb-1">Administrator</span>
                                <span className="text-white">{provider.administrator}</span>
                            </div>
                        )}
                        {provider.founding_year && (
                            <div className="flex flex-col">
                                <span className="text-xs text-slate-500 uppercase tracking-wider mb-1">Founded</span>
                                <span className="text-white">{provider.founding_year}</span>
                            </div>
                        )}
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                        {provider.info_url && (
                            <a href={provider.info_url} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-wider transition-colors border border-white/10">
                                Website
                            </a>
                        )}
                        {provider.wiki_url && (
                            <a href={provider.wiki_url} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-wider transition-colors border border-white/10">
                                Wikipedia
                            </a>
                        )}
                    </div>

                </div>
            </div>
        </div>,
        document.body
    );
};
