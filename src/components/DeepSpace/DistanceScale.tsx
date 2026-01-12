import { SpacecraftData } from '../../lib/definitions';

interface DistanceScaleProps {
    spacecraft: SpacecraftData[];
    selectedId: string | null;
    onSelectSpacecraft: (id: string) => void;
    isPinging: boolean;
    pingProgress: number;
}

// Celestial reference points (distances from Earth in km)
const MILESTONES = [
    { name: 'Moon', distance: 384400, icon: '🌕' },
    { name: 'Mars', distance: 225_000_000, icon: '♂️' }, // Average
    { name: 'Jupiter', distance: 628_000_000, icon: '♃' }, // Average
    { name: 'Pluto', distance: 5_900_000_000, icon: '♇' }, // Average
];

export const DistanceScale = ({ spacecraft, selectedId, onSelectSpacecraft, isPinging, pingProgress }: DistanceScaleProps) => {
    // Find max distance for scale
    const maxDistance = Math.max(...spacecraft.map(s => s.distanceKm));

    // Logarithmic position calculator (0-100%)
    const getPosition = (distanceKm: number) => {
        if (distanceKm <= 0) return 0;
        // Log scale from Moon (384,400 km) to max spacecraft distance
        const minLog = Math.log10(384400);
        const maxLog = Math.log10(maxDistance);
        const posLog = Math.log10(distanceKm);
        return ((posLog - minLog) / (maxLog - minLog)) * 100;
    };

    // Calculate signal position
    const getSignalPosition = () => {
        if (!selectedId || !isPinging) return 0;
        const target = spacecraft.find(s => s.id === selectedId);
        if (!target) return 0;

        const targetPos = getPosition(target.distanceKm);

        // Outbound (0-50%) or Inbound (50-100%)
        if (pingProgress < 50) {
            return (pingProgress * 2 / 100) * targetPos;
        } else {
            return targetPos - ((pingProgress - 50) * 2 / 100) * targetPos;
        }
    };

    const signalLeft = getSignalPosition();

    return (
        <div className="w-full max-w-4xl mx-auto mb-12 p-6 bg-slate-900/30 rounded-xl border border-slate-700/50">
            <h3 className="text-center text-slate-400 text-xs uppercase tracking-widest mb-6">
                Distance Scale from Earth (Logarithmic)
            </h3>

            {/* Scale Container */}
            <div className="relative w-full h-80 mx-auto px-8 overflow-hidden">
                <div className="relative w-full h-full">
                    {/* Base Line */}
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-30" />

                    {/* Moving Signal */}
                    {isPinging && selectedId && (
                        <div
                            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-cyan-400 rounded-full blur-[2px] shadow-[0_0_15px_rgba(34,211,238,1)] z-20 pointer-events-none"
                            style={{ left: `${signalLeft}%` }}
                        >
                            <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-75" />
                        </div>
                    )}

                    {/* Earth (Start Point) */}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col items-center">
                        <div className="w-6 h-6 mb-2 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 shadow-[0_0_15px_rgba(59,130,246,0.6)] border border-blue-300/20" />
                        <span className="text-xs text-slate-400 font-mono">Earth</span>
                    </div>

                    {/* Milestones */}
                    {MILESTONES.map(milestone => {
                        const pos = getPosition(milestone.distance);
                        if (pos < 5 || pos > 95) return null; // Skip if too close to edges

                        return (
                            <div
                                key={milestone.name}
                                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center"
                                style={{ left: `${pos}%` }}
                            >
                                <div className="text-lg mb-1 opacity-60">{milestone.icon}</div>
                                <span className="text-[10px] text-slate-500 font-mono whitespace-nowrap">{milestone.name}</span>
                            </div>
                        );
                    })}

                    {/* Spacecraft Markers */}
                    {spacecraft.map((s, index) => {
                        const pos = getPosition(s.distanceKm);
                        const isSelected = s.id === selectedId;
                        const isTooClose = s.distanceKm < 384400; // Closer than Moon
                        const isAbove = index % 2 === 0; // Alternate above/below

                        if (isTooClose) {
                            // Show annotation for JWST
                            return (
                                <div
                                    key={s.id}
                                    className="absolute left-2 top-0 text-[10px] text-amber-400 font-mono"
                                >
                                    ← {s.name} (too close for scale)
                                </div>
                            );
                        }

                        return (
                            <button
                                key={s.id}
                                onClick={() => onSelectSpacecraft(s.id)}
                                title={`${s.name} - ${s.missionType}`}
                                className={`absolute -translate-x-1/2 flex items-center group cursor-pointer ${isAbove ? 'bottom-1/2 flex-col-reverse pb-2' : 'top-1/2 flex-col pt-2'
                                    }`}
                                style={{ left: `${pos}%` }}
                            >
                                <div className={`w-3 h-3 rounded-full ${isAbove ? 'mt-1' : 'mb-1'} transition-all ${isSelected
                                    ? 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,1)] scale-125'
                                    : 'bg-purple-500 group-hover:bg-purple-400 group-hover:scale-110'
                                    }`} />
                                <span
                                    className={`text-[10px] font-mono transition-colors ${isSelected ? 'text-cyan-400 font-bold' : 'text-slate-400 group-hover:text-white'
                                        }`}
                                    style={{ writingMode: 'vertical-rl', textOrientation: 'upright', letterSpacing: '-1px' }}
                                >
                                    {s.name}
                                </span>
                                <span className={`text-[9px] text-slate-600 font-mono ${isAbove ? 'mb-1' : 'mt-1'}`}>
                                    {(s.distanceKm / 1e9).toFixed(1)}B
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Legend */}
            <div className="mt-6 text-center text-[10px] text-slate-600 uppercase tracking-widest">
                Scale: Logarithmic • 1 Billion km = 1,000,000,000 km
            </div>
        </div>
    );
};
