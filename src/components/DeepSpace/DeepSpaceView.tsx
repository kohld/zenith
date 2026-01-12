import { useState, useEffect } from 'react';
import { SignalVisualizer } from './SignalVisualizer';
import { DistanceScale } from './DistanceScale';
import { usePingAnimation } from '../../hooks/usePingAnimation';
import { SpacecraftData } from '../../lib/definitions';
import { fetchSpacecraftData } from '../../api/horizons';

export const DeepSpaceView = () => {
    const [spacecraft, setSpacecraft] = useState<SpacecraftData[]>([]);
    const [selectedSpacecraftId, setSelectedSpacecraftId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Ping Animation Hook
    const { isPinging, progress: pingProgress, startPing, stopPing } = usePingAnimation(15000);

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

    const selectedSpacecraft = spacecraft.find(s => s.id === selectedSpacecraftId);

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
        <div className="w-full max-w-4xl mx-auto p-4 flex flex-col items-center animate-in fade-in duration-500">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent mb-8">
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
                <div className="w-full">
                    <SignalVisualizer
                        key={selectedSpacecraft.id} // Reset state on change
                        distanceKm={selectedSpacecraft.distanceKm}
                        probeName={selectedSpacecraft.name}
                        isActive={isPinging}
                        progress={pingProgress}
                        onStartPing={startPing}
                    />

                    {/* Additional Metadata */}
                    <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-slate-800/30 rounded-lg border border-white/5">
                            <div className="text-slate-500 text-xs uppercase mb-1">Mission Type</div>
                            <div className="text-white font-mono text-sm">{selectedSpacecraft.missionType}</div>
                        </div>
                        <div className="p-4 bg-slate-800/30 rounded-lg border border-white/5">
                            <div className="text-slate-500 text-xs uppercase mb-1">Velocity (Rel. Sun)</div>
                            <div className="text-white font-mono">{selectedSpacecraft.velocityKmS.toFixed(2)} km/s</div>
                        </div>
                        <div className="p-4 bg-slate-800/30 rounded-lg border border-white/5">
                            <div className="text-slate-500 text-xs uppercase mb-1">Data Timestamp</div>
                            <div className="text-white font-mono text-xs">{new Date(selectedSpacecraft.date).toLocaleDateString()}</div>
                        </div>
                        <div className="p-4 bg-slate-800/30 rounded-lg border border-white/5">
                            <div className="text-slate-500 text-xs uppercase mb-1">Status</div>
                            <div className="text-green-400 font-mono text-xs">● TRACKING ACTIVE</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
