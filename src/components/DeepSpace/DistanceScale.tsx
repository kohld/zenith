import { SpacecraftData } from '../../lib/definitions';
import { useState } from 'react';

type ViewMode = 'linear' | 'radial';

interface DistanceScaleProps {
    spacecraft: SpacecraftData[];
    selectedId: string | null;
    onSelectSpacecraft: (id: string) => void;
    isPinging: boolean;
    pingProgress: number;
}

// Celestial reference points (distances from Earth in km)
const MILESTONES = [
    { name: 'Moon', distance: 384400, gradient: 'from-slate-300 to-slate-500', shadow: 'rgba(203,213,225,0.6)' },
    { name: 'Mars', distance: 225_000_000, gradient: 'from-red-400 to-orange-600', shadow: 'rgba(248,113,113,0.6)' }, // Average
    { name: 'Jupiter', distance: 628_000_000, gradient: 'from-amber-300 to-orange-500', shadow: 'rgba(251,191,36,0.6)' }, // Average
    { name: 'Pluto', distance: 5_900_000_000, gradient: 'from-cyan-300 to-blue-500', shadow: 'rgba(34,211,238,0.6)' }, // Average
];

export const DistanceScale = ({ spacecraft, selectedId, onSelectSpacecraft, isPinging, pingProgress }: DistanceScaleProps) => {
    const [viewMode, setViewMode] = useState<ViewMode>('linear');

    // Deterministic angle generator (hash from string)
    const getAngle = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        // Map to 0-360 degrees, offset by ID char code to spread them out
        return Math.abs(hash % 360);
    };
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
        <div className="w-full max-w-4xl mx-auto mb-12 p-6 bg-slate-900/30 rounded-xl border border-slate-700/50 transition-all duration-500">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-slate-400 text-xs uppercase tracking-widest">
                    Distance Scale ({viewMode === 'linear' ? 'Linear' : 'Radial Map'})
                </h3>
                <div className="flex bg-slate-800/50 rounded-lg p-1 border border-white/5">
                    <button
                        onClick={() => setViewMode('linear')}
                        className={`px-3 py-1 text-[10px] font-medium rounded-md transition-all ${viewMode === 'linear' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        Linear
                    </button>
                    <button
                        onClick={() => setViewMode('radial')}
                        className={`px-3 py-1 text-[10px] font-medium rounded-md transition-all ${viewMode === 'radial' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        Map
                    </button>
                </div>
            </div>

            {/* Scale Container */}
            <div className={`relative w-full mx-auto transition-all duration-500 ${viewMode === 'radial' ? 'aspect-square max-w-[600px] h-auto' : 'h-80 px-8'}`}>
                {viewMode === 'linear' ? (
                    // LINEAR VIEW
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
                        <div className="absolute left-0 top-1/2 flex flex-col items-center">
                            {/* Centered on line */}
                            <div className="absolute -translate-y-1/2 -translate-x-1/2 flex flex-col items-center">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 shadow-[0_0_15px_rgba(59,130,246,0.6)] border border-blue-300/20" />
                                <span className="absolute top-8 text-xs text-slate-400 font-mono" style={{ writingMode: 'vertical-rl', textOrientation: 'upright', letterSpacing: '-1px' }}>Earth</span>
                            </div>
                        </div>

                        {/* Milestones */}
                        {MILESTONES.map(milestone => {
                            const pos = getPosition(milestone.distance);
                            if (pos < 5 || pos > 95) return null; // Skip if too close to edges

                            return (
                                <div
                                    key={milestone.name}
                                    className="absolute top-1/2"
                                    style={{ left: `${pos}%` }}
                                >
                                    {/* Icon centered on line */}
                                    <div
                                        className={`absolute -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-gradient-to-br ${milestone.gradient} border border-white/10`}
                                        style={{ boxShadow: `0 0 10px ${milestone.shadow}` }}
                                    />

                                    {/* Vertical Label below */}
                                    <span
                                        className="absolute top-4 -translate-x-1/2 text-[10px] text-slate-500 font-mono whitespace-nowrap"
                                        style={{ writingMode: 'vertical-rl', textOrientation: 'upright', letterSpacing: '-1px' }}
                                    >
                                        {milestone.name}
                                    </span>
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
                ) : (
                    // RADIAL VIEW
                    <div className="relative w-full h-full rounded-full border border-slate-700/30 bg-slate-900/20 shadow-inner">

                        {/* Center Earth */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 shadow-[0_0_25px_rgba(59,130,246,0.8)] border border-blue-300/20" />
                            <span className="mt-1 text-[10px] text-blue-200 font-mono tracking-widest">EARTH</span>
                        </div>

                        {/* Moving Signal (Radial) */}
                        {isPinging && selectedId && (
                            (() => {
                                const target = spacecraft.find(s => s.id === selectedId);
                                if (!target) return null;
                                // Angle logic: Use RA if available, else deterministic hash
                                const angle = target.ra !== undefined ? target.ra : getAngle(target.name);

                                const currentPos = getSignalPosition(); // 0-100 scale
                                const radiusPercent = currentPos / 2; // 0-50% scale

                                const left = 50 + radiusPercent * Math.cos(angle * Math.PI / 180);
                                const top = 50 + radiusPercent * Math.sin(angle * Math.PI / 180);

                                return (
                                    <div
                                        className="absolute w-3 h-3 bg-cyan-400 rounded-full blur-[2px] shadow-[0_0_15px_rgba(34,211,238,1)] z-30 pointer-events-none"
                                        style={{ left: `${left}%`, top: `${top}%`, transform: 'translate(-50%, -50%)' }}
                                    >
                                        <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-75" />
                                    </div>
                                );
                            })()
                        )}

                        {/* Milestones (Rings) */}
                        {MILESTONES.filter(m => m.name !== 'Moon').map(milestone => {
                            const pos = getPosition(milestone.distance);



                            return (
                                <div
                                    key={milestone.name}
                                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed pointer-events-none"
                                    style={{
                                        width: `${pos}%`,
                                        height: `${pos}%`,
                                        borderColor: milestone.shadow,
                                        opacity: 0.3
                                    }}
                                >
                                    {/* Label on the ring (at 135deg) */}
                                    <div
                                        className="absolute top-[15%] left-[15%] px-1.5 py-0.5 rounded bg-slate-900/80 border border-slate-700/50 backdrop-blur-sm"
                                        style={{ transform: 'translate(-50%, -50%)' }}
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <div className={`w-2 h-2 rounded-full bg-gradient-to-br ${milestone.gradient}`} />
                                            <span className="text-[9px] text-slate-300 font-mono uppercase">{milestone.name}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Spacecrafts */}
                        {spacecraft.map((s) => {
                            const pos = getPosition(s.distanceKm);
                            const angle = s.ra !== undefined ? s.ra : getAngle(s.name);
                            const angleRad = (angle * Math.PI) / 180;

                            // Cartesian offset from center (50%, 50%) using % units
                            // We use 'pos' directly which is 0-100% of diameter? No, pos is 0-100 linear scale. 
                            // In radial, that maps to 0-50% radius.
                            // x = 50 + (pos/2) * cos(theta)
                            // y = 50 + (pos/2) * sin(theta)

                            const left = 50 + (pos / 2) * Math.cos(angleRad);
                            const top = 50 + (pos / 2) * Math.sin(angleRad);

                            const isSelected = s.id === selectedId;

                            return (
                                <button
                                    key={s.id}
                                    onClick={() => onSelectSpacecraft(s.id)}
                                    className="absolute group z-10"
                                    style={{ left: `${left}%`, top: `${top}%` }}
                                >
                                    <div className="relative -translate-x-1/2 -translate-y-1/2">
                                        {/* Dot */}
                                        <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${isSelected
                                            ? 'bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,1)] scale-150'
                                            : 'bg-purple-500 group-hover:bg-purple-400 group-hover:scale-125'}`}
                                        />

                                        {/* Tooltip Label */}
                                        <div className={`absolute top-4 left-1/2 -translate-x-1/2 transition-all ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} whitespace-nowrap z-20`}>
                                            <div className="px-2 py-1 rounded bg-slate-900/90 border border-cyan-500/30 backdrop-blur-md shadow-xl">
                                                <div className="text-[10px] text-cyan-400 font-bold">{s.name}</div>
                                                <div className="text-[9px] text-slate-400">{(s.distanceKm / 1e9).toFixed(1)}B km</div>
                                            </div>
                                        </div>

                                        {/* Pulse Effect if Selected */}
                                        {isSelected && (
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border border-cyan-500/30 animate-ping" />
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Legend */}
            <div className="mt-6 text-center text-[10px] text-slate-600 uppercase tracking-widest">
                Scale: Logarithmic • 1 Billion km = 1,000,000,000 km
            </div>
        </div>
    );
};
