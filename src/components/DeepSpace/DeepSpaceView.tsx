import { useState, useEffect } from 'react';
import { SignalVisualizer } from './SignalVisualizer';
import { SignalAnalysis } from './SignalAnalysis';
import { DistanceScale } from './DistanceScale';
import { usePingAnimation } from '../../hooks/usePingAnimation';
import { SpacecraftData } from '../../lib/definitions';
import { fetchSpacecraftData } from '../../api/horizons';
import { SPACECRAFT_SPECS } from '../../lib/definitions';

export const DeepSpaceView = () => {
    const [spacecraft, setSpacecraft] = useState<SpacecraftData[]>([]);
    const [selectedSpacecraftId, setSelectedSpacecraftId] = useState<string | null>(null);
    const [showSigInt, setShowSigInt] = useState(false);
    const [loading, setLoading] = useState(true);

    const selectedSpacecraft = spacecraft.find(s => s.id === selectedSpacecraftId);

    // Calculate Round-Trip Time (RTT) in milliseconds
    // Speed of Light ≈ 300,000 km/s
    const SPEED_OF_LIGHT = 299_792.458;
    const rttMs = selectedSpacecraft
        ? (selectedSpacecraft.distanceKm * 2 / SPEED_OF_LIGHT) * 1000
        : 15000;

    // Logic: Use RTT, but cap at 15 seconds (15000ms) for very distant objects
    // "15s timer only applies if RTT > 15s, otherwise use RTT"
    const pingDuration = Math.min(rttMs, 15000);

    // Ping Animation Hook
    const { isPinging, progress: pingProgress, startPing, stopPing } = usePingAnimation(pingDuration);

    useEffect(() => {
        fetchSpacecraftData()
            .then((data) => {
                setSpacecraft(data);
                // Auto-select Voyager 1
                const v1 = data.find(s => s.name.includes("Voyager 1"));
                if (v1) setSelectedSpacecraftId(v1.id);
                else if (data.length > 0) setSelectedSpacecraftId(data[0].id);
            })
            .catch(err => console.warn("Deep Space Data Error:", err))
            .finally(() => setLoading(false));
    }, []);

    // Helper to stop ping on selection change
    useEffect(() => {
        stopPing();
    }, [selectedSpacecraftId]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-cyan-500">
                <div className="animate-spin h-8 w-8 border-2 border-cyan-500 rounded-full border-t-transparent mb-4"></div>
                <div className="text-sm font-mono tracking-widest uppercase">Establishing Link...</div>
            </div>
        );
    }

    if (spacecraft.length === 0) {
        return (
            <div className="text-center text-slate-500 mt-20">
                <p>Deep Space Network Offline.</p>
                <p className="text-xs mt-2">No telemetry data found locally.</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto p-4 flex flex-col items-center animate-slide-in">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent mb-6">
                Deep Space Network
            </h2>

            {/* Distance Scale */}
            <DistanceScale
                spacecraft={spacecraft}
                selectedId={selectedSpacecraftId}
                onSelectSpacecraft={setSelectedSpacecraftId}
                isPinging={isPinging}
                pingProgress={pingProgress}
            />

            {/* Spacecraft Selector */}
            <div className="flex flex-wrap justify-center gap-2 mb-8">
                {spacecraft.map(s => (
                    <button
                        key={s.id}
                        onClick={() => setSelectedSpacecraftId(s.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedSpacecraftId === s.id
                            ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.5)]'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                            }`}
                    >
                        {s.name}
                    </button>
                ))}
            </div>

            {selectedSpacecraft && (
                <div className="w-full flex flex-col lg:flex-row gap-8">
                    {/* Signal Visualizer Panel */}
                    <div className="flex-1">
                        <SignalVisualizer
                            key={selectedSpacecraft.id} // Reset state on change
                            distanceKm={selectedSpacecraft.distanceKm}
                            probeName={selectedSpacecraft.name}
                            isActive={isPinging}
                            progress={pingProgress}
                            onStartPing={startPing}
                        />
                    </div>

                    {/* Additional Metadata */}
                    <div className="grid grid-cols-2 lg:grid-cols-1 gap-4 lg:w-80">

                        <button
                            onClick={() => setShowSigInt(true)}
                            className="col-span-2 p-3 bg-cyan-900/30 border border-cyan-500/30 rounded-lg text-cyan-400 text-sm font-mono tracking-wider hover:bg-cyan-500/20 transition-all flex items-center justify-center gap-2 group"
                        >
                            <svg className="w-5 h-5 group-hover:animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            SIGNAL ANALYSIS
                        </button>

                        <div className="p-4 bg-slate-800/30 rounded-lg border border-white/5">
                            <div className="text-slate-500 text-xs uppercase mb-1">Mission Type</div>
                            <a
                                href={SPACECRAFT_SPECS[selectedSpacecraft.id]?.missionUrl || (parseInt(selectedSpacecraft.id) > 0 ? `https://www.n2yo.com/satellite/?s=${selectedSpacecraft.id}` : '#')}
                                target="_blank"
                                rel="noreferrer"
                                className={`font-mono text-sm flex items-center gap-2 group transition-colors ${SPACECRAFT_SPECS[selectedSpacecraft.id]?.missionUrl || parseInt(selectedSpacecraft.id) > 0
                                    ? "text-indigo-400 hover:text-indigo-300 hover:underline hover:underline-offset-4 cursor-pointer"
                                    : "text-white"
                                    }`}
                                onClick={e => (!SPACECRAFT_SPECS[selectedSpacecraft.id]?.missionUrl && isNaN(parseInt(selectedSpacecraft.id))) && e.preventDefault()}
                            >
                                {selectedSpacecraft.missionType}
                                {(SPACECRAFT_SPECS[selectedSpacecraft.id]?.missionUrl || parseInt(selectedSpacecraft.id) > 0) && (
                                    <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                )}
                            </a>
                        </div>
                        <div className="p-4 bg-slate-800/30 rounded-lg border border-white/5">
                            <div className="text-slate-500 text-xs uppercase mb-1">Velocity (Rel. Sun)</div>
                            <div className="text-white font-mono">{selectedSpacecraft.velocityKmS.toFixed(2)} km/s</div>
                        </div>
                        <div className="p-4 bg-slate-800/30 rounded-lg border border-white/5">
                            <div className="text-slate-500 text-xs uppercase mb-1">Data Timestamp</div>
                            <div className="text-white font-mono text-xs">
                                {new Date(selectedSpacecraft.date).toLocaleString([], {
                                    year: 'numeric', month: '2-digit', day: '2-digit',
                                    hour: '2-digit', minute: '2-digit',
                                    timeZoneName: 'short'
                                })}
                            </div>
                        </div>
                        <div className="p-4 bg-slate-800/30 rounded-lg border border-white/5">
                            <div className="text-slate-500 text-xs uppercase mb-1">Status</div>
                            <div className={`font-mono text-xs uppercase ${selectedSpacecraft.status?.includes('ACTIVE') ? 'text-green-400' :
                                selectedSpacecraft.status === 'POWER SAVING' ? 'text-amber-400' :
                                    'text-slate-400'
                                }`}>
                                ● {selectedSpacecraft.status || 'UNKNOWN'}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showSigInt && selectedSpacecraft && (
                <SignalAnalysis
                    spacecraft={selectedSpacecraft}
                    onClose={() => setShowSigInt(false)}
                />
            )}
        </div>
    );
};
