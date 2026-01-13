import { useEffect, useState } from 'react';
import { SpacecraftData, SPACECRAFT_SPECS, DEFAULT_SPECS } from '../../lib/definitions';

interface SignalAnalysisProps {
    spacecraft: SpacecraftData;
    onClose: () => void;
}

export const SignalAnalysis = ({ spacecraft, onClose }: SignalAnalysisProps) => {

    const isConnected = spacecraft.status?.includes('ACTIVE');
    const specs = SPACECRAFT_SPECS[spacecraft.id] || DEFAULT_SPECS;

    // Mission Clock (UTC with Milliseconds)
    const [timeStr, setTimeStr] = useState("");
    const [msStr, setMsStr] = useState("000");

    useEffect(() => {
        let frameId: number;

        const updateClock = () => {
            const now = new Date();
            // Using UTC for Spacecraft operations
            const h = now.getUTCHours().toString().padStart(2, '0');
            const m = now.getUTCMinutes().toString().padStart(2, '0');
            const s = now.getUTCSeconds().toString().padStart(2, '0');

            setTimeStr(`${h}:${m}:${s}`);
            setMsStr(now.getUTCMilliseconds().toString().padStart(3, '0'));

            frameId = requestAnimationFrame(updateClock);
        };

        frameId = requestAnimationFrame(updateClock);
        return () => cancelAnimationFrame(frameId);
    }, []);


    // PHYSICS CALCULATIONS

    // 1. Doppler Shift (Δf)
    // f_obs = f_src * (1 - v/c) approx for v << c
    // We assume X-Band (8.4 GHz) as baseline frequency
    const FREQUENCY_HZ = 8.4e9;
    const C_KMS = 299792;
    const shiftHz = -(spacecraft.velocityKmS / C_KMS) * FREQUENCY_HZ; // Negative if moving away

    // 2. Signal Strength (Free Space Path Loss)
    // FSPL = 20log(d) + 20log(f) + 92.45 (d in km, f in GHz)
    // Link Budget: TxPower + TxGain + RxGain - FSPL
    const calculateSignalStrength = (distKm: number) => {
        // PREFER REAL DSN DATA
        if (spacecraft.dsnSignal?.downSignal && spacecraft.dsnSignal.power) {
            return spacecraft.dsnSignal.power;
        }

        const fGHz = 8.4;
        // Standard: FSPL(dB) = 20log10(d_km) + 20log10(f_GHz) + 92.45
        const fsplReal = 20 * Math.log10(distKm) + 20 * Math.log10(fGHz) + 92.45;

        const txPower = 43; // ~20W (Typical deep space TWT)
        const txGain = 48; // Spacecraft HGA
        const rxGain = 74; // DSN 70m Dish

        return (txPower + txGain + rxGain) - fsplReal;
    };

    const signalStrengthDiff = calculateSignalStrength(spacecraft.distanceKm);
    // Add micro-fluctuation for "live" feel
    const [liveSignal, setLiveSignal] = useState(signalStrengthDiff);

    useEffect(() => {
        const interval = setInterval(() => {
            setLiveSignal(signalStrengthDiff + (Math.random() * 0.4 - 0.2));
        }, 200);
        return () => clearInterval(interval);
    }, [signalStrengthDiff]);


    // 3. Data Rate Estimation (Inverse Square Law scaling)
    const estimateDataRate = (distKm: number) => {
        // PREFER REAL DSN DATA
        if (spacecraft.dsnSignal?.downSignal && spacecraft.dsnSignal.dataRate) {
            const rate = spacecraft.dsnSignal.dataRate;
            if (rate > 1e6) return (rate / 1e6).toFixed(2) + " Mbps (LIVE)";
            if (rate > 1000) return (rate / 1000).toFixed(2) + " kbps (LIVE)";
            return Math.round(rate) + " bps (LIVE)";
        }

        // Fallback: Inverse Square Law scaling
        // Baseline: Voyager 1 at 24B km is ~160 bps
        const voyagerDist = 24e9;
        const voyagerRate = 160;

        const ratio = Math.pow(voyagerDist / distKm, 2);
        const rate = voyagerRate * ratio;

        if (rate > 1e6) return (rate / 1e6).toFixed(2) + " Mbps (EST)";
        if (rate > 1000) return (rate / 1000).toFixed(2) + " kbps (EST)";
        return Math.round(rate) + " bps (EST)";
    };

    // Dynamic text for decoder
    const dataRateLabel = estimateDataRate(spacecraft.distanceKm);

    // Handle Escape Key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    // Link Topology Animation
    // We visualize the signal traveling from Probe to Earth
    // Total distance pixel width = 800px (or 100%)
    // Speed: We want to show the packet moving. 
    // Real light speed is instantaneous on human scale for short distances, but for Voyager it's 22 hours.
    // We will animate a "Ping" packet that moves across the line.

    // We can use a simple CSS animation for the packet, but let's derive the duration 
    // from the actual One-Way Light Time (OWLT) purely for "flavor" scaling (e.g. 1hr = 1sec animation?)
    // Actually, let's just make it a steady flow to show "ACQUIRING".

    const owltSeconds = spacecraft.distanceKm / 299792;
    const owltMinutes = owltSeconds / 60;
    const owltHours = owltMinutes / 60;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 font-sans">

            <div className="relative w-full max-w-6xl bg-slate-900/80 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl flex flex-col max-h-[90vh] overflow-hidden ring-1 ring-white/5">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5">
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-indigo-400 font-medium tracking-widest uppercase">Deep Space Network // Analysis</span>
                            <h2 className="text-2xl font-light text-white tracking-wide flex items-center gap-3">
                                <span className={`inline-block w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-amber-500 animate-pulse'}`} />
                                {spacecraft.name}
                            </h2>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-right hidden sm:block">
                            <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Mission Time (UTC)</div>
                            <div className="text-slate-200 font-mono text-sm">
                                {timeStr}<span className="text-slate-500 text-xs">.{msStr}</span>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* Main Visual: Link Geometry (Replaces Waterfall) */}
                    <div className="lg:col-span-8 flex flex-col gap-1">
                        <div className="flex justify-between items-end mb-1 px-1">
                            <span className="text-[10px] text-cyan-600">LINK GEOMETRY // SCALE 1:{Math.round(spacecraft.distanceKm / 1e6)}M</span>
                            <span className="text-[10px] text-cyan-600">OWLT: {owltHours.toFixed(2)}h {Math.round(owltMinutes % 60)}m</span>
                        </div>

                        <div className="relative bg-slate-950 border border-cyan-900/40 h-80 lg:h-96 w-full overflow-hidden flex items-center justify-center p-8 select-none">
                            {/* SVG Topology Diagram */}
                            <svg className="w-full h-full" viewBox="0 0 800 300">
                                <defs>
                                    <linearGradient id="beamGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#818cf8" stopOpacity="0" />
                                        <stop offset="10%" stopColor="#818cf8" stopOpacity="0.05" />
                                        <stop offset="100%" stopColor="#818cf8" stopOpacity="0.2" />
                                    </linearGradient>
                                    {/* Vertical dashed guides instead of grid */}
                                    <pattern id="guides" width="100" height="300" patternUnits="userSpaceOnUse">
                                        <line x1="0" y1="0" x2="0" y2="300" stroke="white" strokeOpacity="0.03" strokeDasharray="4,4" />
                                    </pattern>
                                </defs>

                                {/* Background Guides */}
                                <rect width="100%" height="100%" fill="url(#guides)" />

                                {/* Earth Node (Left) */}
                                <g transform="translate(50, 150)">
                                    <circle r="20" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
                                    <text x="0" y="40" textAnchor="middle" fill="#94a3b8" fontSize="11" fontFamily="sans-serif" fontWeight="300">EARTH</text>
                                    <circle r="4" fill="#38bdf8" className="animate-pulse" />
                                </g>

                                {/* Spacecraft Node (Right) */}
                                <g transform="translate(750, 150)">
                                    <circle r="12" fill="#0f172a" stroke={isConnected ? "#34d399" : "#f43f5e"} strokeWidth="1.5" />
                                    <text x="0" y="32" textAnchor="middle" fill="#94a3b8" fontSize="11" fontFamily="sans-serif" fontWeight="300">TARGET</text>
                                    {isConnected && (
                                        <path d="M -15 -10 L 0 0 L -15 10" fill="none" stroke="#34d399" strokeWidth="1.5" />
                                    )}
                                </g>

                                {/* Connection Line */}
                                {/* Connection Line */}
                                <line x1="70" y1="150" x2="730" y2="150" stroke="#475569" strokeWidth="1" strokeDasharray="3,3" opacity="0.5" />

                                {/* Active Link Beam */}
                                {isConnected && (
                                    <>
                                        {/* Beam Cone */}
                                        <path d="M 740 150 L 70 120 L 70 180 Z" fill="url(#beamGradient)" />

                                        {/* Traveling Packets - Softer glow */}
                                        <circle r="3" fill="#ffffff" opacity="0.8">
                                            <animate attributeName="cx" from="730" to="70" dur="3s" repeatCount="indefinite" />
                                            <animate attributeName="cy" from="150" to="150" dur="3s" repeatCount="indefinite" />
                                            <animate attributeName="opacity" values="0;0.8;0.8;0" dur="3s" repeatCount="indefinite" />
                                        </circle>
                                        <circle r="3" fill="#ffffff" opacity="0.8">
                                            <animate attributeName="cx" from="730" to="70" dur="3s" begin="1.5s" repeatCount="indefinite" />
                                            <animate attributeName="cy" from="150" to="150" dur="3s" begin="1.5s" repeatCount="indefinite" />
                                            <animate attributeName="opacity" values="0;0.8;0.8;0" dur="3s" begin="1.5s" repeatCount="indefinite" />
                                        </circle>
                                    </>
                                )}

                                {/* Distance Markers */}
                                <g transform="translate(400, 130)">
                                    <text x="0" y="0" textAnchor="middle" fill="#64748b" fontSize="12" fontFamily="monospace">
                                        {(spacecraft.distanceKm / 149597870.7).toFixed(2)} AU
                                    </text>
                                    <text x="0" y="16" textAnchor="middle" fill="#475569" fontSize="10" fontFamily="sans-serif">
                                        {(spacecraft.distanceKm / 1e6).toFixed(1)} million km
                                    </text>
                                </g>
                            </svg>

                            {/* Overlay Stats */}
                            <div className="absolute top-2 right-2 text-right">
                                <div className="text-[10px] text-cyan-600">LIGHT DELAY</div>
                                <div className="text-xl font-bold text-cyan-400">-{owltHours.toFixed(0)}h {(owltMinutes % 60).toFixed(0)}m</div>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-1 mt-2">
                            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                <span className="block text-xs text-indigo-300 mb-1 font-medium">Est. Bandwidth</span>
                                <span className="text-lg text-white font-light">{dataRateLabel}</span>
                            </div>
                            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                <span className="block text-xs text-indigo-300 mb-1 font-medium">Antenna Config</span>
                                <span className="text-sm text-slate-200 truncate leading-6" title={specs.antenna}>{specs.antenna}</span>
                            </div>
                            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                <span className="block text-xs text-indigo-300 mb-1 font-medium">Power Source</span>
                                <span className="text-sm text-slate-200 truncate leading-6" title={specs.power}>{specs.power}</span>
                            </div>
                        </div>
                    </div>

                    {/* Side Panel (Right Col) */}
                    <div className="lg:col-span-4 flex flex-col gap-6">

                        {/* Onboard Systems Status */}
                        <div className="bg-white/5 rounded-xl border border-white/5 overflow-hidden flex flex-col">
                            <div className="px-4 py-3 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                                <span className="text-xs text-indigo-200 font-medium uppercase tracking-wider">System Status</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${isConnected ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}>
                                    {isConnected ? "ONLINE" : "LOW POWER"}
                                </span>
                            </div>
                            <div className="p-0 overflow-y-auto">
                                <table className="w-full text-left">
                                    <tbody className="divide-y divide-white/5">
                                        {specs.instruments.map((inst) => (
                                            <tr key={inst.id} className="hover:bg-white/5 transition-colors group">
                                                <td className="py-3 pl-4 text-xs font-mono text-indigo-300/80">{inst.id}</td>
                                                <td className="py-3 px-2 text-sm text-slate-300 font-light truncate max-w-[140px]" title={inst.name}>{inst.name}</td>
                                                <td className="py-3 pr-4 text-right">
                                                    <span className={`w-1.5 h-1.5 rounded-full inline-block ${inst.status === 'ON' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' :
                                                        inst.status === 'STANDBY' ? 'bg-amber-400' :
                                                            'bg-slate-600'
                                                        }`} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Doppler & Signal */}
                        <div className="space-y-4">
                            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                <div className="flex justify-between text-xs mb-3">
                                    <span className="text-slate-400 font-medium uppercase tracking-wider">Doppler Shift (Δf)</span>
                                    <span className="text-white font-mono">{shiftHz > 0 ? '+' : ''}{(shiftHz / 1000).toFixed(3)} kHz</span>
                                </div>
                                <div className="h-2 bg-slate-800 rounded-full relative overflow-hidden">
                                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/20 z-10" />
                                    {/* Bar growing from center */}
                                    <div
                                        className={`absolute top-0 bottom-0 transition-all duration-500 rounded-full ${shiftHz > 0 ? 'bg-indigo-500 left-1/2' : 'bg-amber-500 right-1/2'}`}
                                        style={{ width: `${Math.min(Math.abs(shiftHz) / 1000, 50)}%` }}
                                    />
                                </div>
                            </div>

                            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                <div className="flex justify-between text-xs mb-3">
                                    <span className="text-slate-400 font-medium uppercase tracking-wider">Signal Strength</span>
                                    <span className="text-white font-mono">{liveSignal.toFixed(1)} dBm</span>
                                </div>
                                <div className="flex gap-1 h-8 items-end">
                                    {Array.from({ length: 24 }).map((_, i) => (
                                        <div
                                            key={i}
                                            className={`flex-1 rounded-sm transition-all duration-300 ${i < (liveSignal + 165) / 1.5
                                                ? (i > 18 ? 'bg-indigo-400' : 'bg-indigo-500/50')
                                                : 'bg-slate-800/50'
                                                }`}
                                            style={{ height: `${20 + Math.random() * 80}%` }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Latency Box */}
                        <div className="bg-white/5 rounded-xl border border-white/5 p-5">
                            <div className="text-xs text-indigo-200 font-medium uppercase tracking-wider mb-4 text-center">Protocol Timing</div>
                            <div className="flex justify-between items-center relative">
                                {/* Connecting line */}
                                <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                                <div className="relative bg-slate-900 border border-white/10 px-3 py-2 rounded-lg z-10 text-center min-w-[80px]">
                                    <div className="text-[10px] text-slate-500 mb-1">TX ORIGIN</div>
                                    <div className="text-sm text-indigo-300 font-mono">{new Date(Date.now() - (spacecraft.distanceKm / 299792 * 1000)).toLocaleTimeString()}</div>
                                </div>

                                <div className="relative z-10 bg-slate-950 rounded-full p-1.5 border border-white/10 text-slate-500 text-xs font-mono">
                                    {(spacecraft.distanceKm / 299792 / 60).toFixed(0)}m
                                </div>

                                <div className="relative bg-slate-900 border border-white/10 px-3 py-2 rounded-lg z-10 text-center min-w-[80px]">
                                    <div className="text-[10px] text-slate-500 mb-1">RX LOCAL</div>
                                    <div className="text-sm text-white font-mono">{new Date().toLocaleTimeString()}</div>
                                </div>
                            </div>
                        </div>

                    </div>

                </div>

                {/* Footer Deco */}
                <div className="p-4 border-t border-white/5 flex justify-between text-[10px] text-slate-500 font-medium tracking-widest uppercase">
                    <span>Zenith Deep Space Network</span>
                    <span>Scientific Analysis Terminal // V0.1.0</span>
                </div>
            </div>
        </div>
    );
};
