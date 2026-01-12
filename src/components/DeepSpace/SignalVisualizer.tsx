import { calculateSignalTime, formatDuration } from '../../logic/physics';

interface SignalVisualizerProps {
    distanceKm: number;
    probeName: string;
    isActive: boolean;
    progress: number;
    onStartPing: () => void;
}

export const SignalVisualizer = ({ distanceKm, probeName, isActive, progress, onStartPing }: SignalVisualizerProps) => {
    // Calculations
    const { oneWay: oneWaySeconds, roundTrip: roundTripSeconds } = calculateSignalTime(distanceKm);

    // Derived State (Direct Calculation)
    const virtualTimeSeconds = (progress / 100) * roundTripSeconds;

    // Format virtual time for display
    const formatVirtualTime = () => {
        const hours = Math.floor(virtualTimeSeconds / 3600);
        const minutes = Math.floor((virtualTimeSeconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    };

    // Determine signal phase
    const isOutbound = progress < 50;
    const signalPhase = isOutbound
        ? `Signal traveling to ${probeName}`
        : `Signal returning to Earth`;

    return (
        <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 p-6 flex flex-col gap-6 font-mono text-sm max-w-lg mx-auto backdrop-blur-sm">

            {/* Header / Info */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <div className="text-slate-500 text-xs uppercase tracking-widest">Target Distance</div>
                    <div className="text-xl text-white font-bold tracking-tight">
                        {(distanceKm / 1e9).toFixed(3)} <span className="text-slate-500 text-base font-normal">Bn km</span>
                    </div>
                </div>
                <div className="space-y-1 text-right">
                    <div className="text-slate-500 text-xs uppercase tracking-widest">Comm Relay</div>
                    <div className={`font-bold ${isActive ? 'text-cyan-400 animate-pulse' : 'text-slate-400'}`}>
                        {isActive ? 'TRANSMITTING' : 'STANDBY'}
                    </div>
                </div>
            </div>

            {/* Timers */}
            <div className="bg-black/30 rounded-lg p-4 grid grid-cols-2 gap-8 relative overflow-hidden">
                <div>
                    <div className="text-slate-500 mb-1">One-Way Light Time</div>
                    <div className="text-white text-lg font-bold">{formatDuration(oneWaySeconds)}</div>
                </div>
                <div>
                    <div className="text-slate-500 mb-1">Round-Trip Time</div>
                    <div className="text-cyan-300 text-lg font-bold">{formatDuration(roundTripSeconds)}</div>
                </div>
            </div>

            {/* Live Virtual Timer */}
            <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-lg p-4 text-center">
                <div className="text-indigo-400 text-xs uppercase tracking-widest mb-2">Virtual Time Elapsed</div>
                <div className="text-white text-2xl font-bold tabular-nums">{formatVirtualTime()}</div>
                <div className="text-slate-400 text-xs mt-1">{signalPhase}</div>
            </div>

            {/* Visualizer / Ping Animation */}
            <div className="relative h-24 flex items-center justify-center border-t border-slate-800 pt-6">

                {/* Track */}
                <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-700 w-full" />

                {/* Earth Node */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)] z-10" />
                    <span className="mt-4 text-xs text-slate-400">EARTH</span>
                </div>

                {/* Probe Node */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col items-center">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full shadow-[0_0_10px_rgba(250,204,21,0.8)] z-10" />
                    <span className="mt-4 text-xs text-slate-400 uppercase">{probeName}</span>
                </div>

                {/* Signal Payload */}
                {isActive && (
                    <div
                        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-cyan-400 rounded-full blur-[2px] shadow-[0_0_15px_rgba(34,211,238,1)] z-20"
                        style={{
                            left: `${progress < 50 ? progress * 2 : 100 - (progress - 50) * 2}%`,
                            opacity: progress > 98 ? 0 : 1
                        }}
                    >
                        <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-75" />
                    </div>
                )}

                {/* Start Button */}
                {!isActive && (
                    <button
                        onClick={onStartPing}
                        className="relative z-30 px-6 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold rounded-full transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                    >
                        START SIGNAL
                    </button>
                )}
            </div>

            <div className="text-[10px] text-slate-600 text-center uppercase tracking-widest">
                Deep Space Network / Time Compression: 15s real = {formatDuration(roundTripSeconds)} virtual
            </div>
        </div>
    );
};
