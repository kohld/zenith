import { useEffect, useState } from 'react';
import { SpacecraftData } from '../../lib/definitions';

interface SignalAnalysisProps {
    spacecraft: SpacecraftData;
    onClose: () => void;
}

// MOCK DATABASE OF SPACECRAFT SYSTEMS
const SPACECRAFT_SPECS: Record<string, {
    power: string;
    antenna: string;
    instruments: Array<{ id: string, name: string, status: 'ON' | 'OFF' | 'STANDBY' }>
}> = {
    // Voyager 1
    '-31': {
        power: 'RTG (Plutonium-238)',
        antenna: '3.7m High-Gain Parabolic',
        instruments: [
            { id: 'MAG', name: 'Magnetometer', status: 'ON' },
            { id: 'CRS', name: 'Cosmic Ray Subsystem', status: 'ON' },
            { id: 'LECP', name: 'Low Energy Charged Particle', status: 'ON' },
            { id: 'PWS', name: 'Plasma Wave Subsystem', status: 'ON' },
            { id: 'ISS', name: 'Imaging Science Subsystem', status: 'OFF' },
            { id: 'IRIS', name: 'Infrared Interferometer', status: 'OFF' }
        ]
    },
    // Voyager 2
    '-32': {
        power: 'RTG (Plutonium-238)',
        antenna: '3.7m High-Gain Parabolic',
        instruments: [
            { id: 'MAG', name: 'Magnetometer', status: 'ON' },
            { id: 'CRS', name: 'Cosmic Ray Subsystem', status: 'ON' },
            { id: 'PLS', name: 'Plasma Science', status: 'ON' }, // V2 PLS still works, V1 died
            { id: 'PWS', name: 'Plasma Wave Subsystem', status: 'ON' },
            { id: 'ISS', name: 'Imaging Science Subsystem', status: 'OFF' }
        ]
    },
    // New Horizons
    '-98': {
        power: 'RTG (GPHS)',
        antenna: '2.1m High-Gain',
        instruments: [
            { id: 'LORRI', name: 'Long Range Recon Imager', status: 'STANDBY' },
            { id: 'RALPH', name: 'Color/IR Imager', status: 'STANDBY' },
            { id: 'ALICE', name: 'UV Spectrometer', status: 'OFF' },
            { id: 'REX', name: 'Radio Science Experiment', status: 'ON' },
            { id: 'SWAP', name: 'Solar Wind Around Pluto', status: 'ON' },
            { id: 'PEPSSI', name: 'Energetic Particle Spec', status: 'ON' }
        ]
    },
    // JWST
    '-170': {
        power: 'Solar Array + Li-Ion',
        antenna: 'Ka-Band High-Rate',
        instruments: [
            { id: 'NIRCam', name: 'Near-Infrared Camera', status: 'ON' },
            { id: 'NIRSpec', name: 'Near-Infrared Spectrograph', status: 'ON' },
            { id: 'MIRI', name: 'Mid-Infrared Instrument', status: 'ON' }, // Cryocooler active
            { id: 'FGS', name: 'Fine Guidance Sensor', status: 'ON' }
        ]
    },
    // Parker Solar Probe
    '-96': {
        power: 'Solar Array (Liquid Cooled)',
        antenna: 'Ka-Band Parabolic',
        instruments: [
            { id: 'FIELDS', name: 'Electromagnetic Fields', status: 'ON' },
            { id: 'WISPR', name: 'Wide-Field Imager', status: 'ON' },
            { id: 'SWEAP', name: 'Solar Wind Electrons Alphas', status: 'ON' },
            { id: 'ISOIS', name: 'Integrated Science Invest.', status: 'ON' }
        ]
    }
};

const DEFAULT_SPECS = {
    power: 'Solar Array / Battery',
    antenna: 'High-Gain Antenna',
    instruments: [
        { id: 'COM', name: 'Comms Subsystem', status: 'ON' as const },
        { id: 'GNC', name: 'Guidance & Navigation', status: 'ON' as const },
        { id: 'PWR', name: 'Power Bus Controller', status: 'ON' as const },
        { id: 'THERM', name: 'Thermal Control', status: 'ON' as const }
    ]
};

export const SignalAnalysis = ({ spacecraft, onClose }: SignalAnalysisProps) => {

    const isConnected = spacecraft.status?.includes('ACTIVE');
    const specs = SPACECRAFT_SPECS[spacecraft.id] || DEFAULT_SPECS;

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300 font-mono">
            {/* CRT/Scanline Overlay */}
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] z-50 opacity-20" />

            <div className="relative w-full max-w-6xl bg-slate-900/90 border border-slate-700/50 shadow-2xl flex flex-col max-h-[90vh]"
                style={{ clipPath: 'polygon(0 0, 100% 0, 100% 85%, 95% 100%, 0 100%)' }}>

                {/* HUD Decoration Corners */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-500/50" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-500/50" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyan-500/50" />

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-cyan-900/40 bg-slate-900/80">
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-cyan-600 tracking-[0.2em] font-bold">MCRN TACTICAL // LINK TOPOLOGY</span>
                            <h2 className="text-2xl font-bold text-cyan-100 tracking-widest uppercase flex items-center gap-2">
                                <span className={`inline-block w-2 h-6 ${isConnected ? 'bg-cyan-500' : 'bg-red-500 animate-pulse'}`} />
                                {spacecraft.name}
                            </h2>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <div className="text-[10px] text-slate-500">SYSTEM TIME</div>
                            <div className="text-cyan-500/80">{new Date().toISOString().split('T')[1].replace('Z', '')}</div>
                        </div>
                        <button onClick={onClose} className="p-2 border border-cyan-900 hover:bg-cyan-900/30 hover:text-cyan-400 text-slate-500 transition-colors uppercase text-xs tracking-widest">
                            [ Close Term ]
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
                                        <stop offset="0%" stopColor="rgb(6,182,212)" stopOpacity="0" />
                                        <stop offset="10%" stopColor="rgb(6,182,212)" stopOpacity="0.1" />
                                        <stop offset="100%" stopColor="rgb(6,182,212)" stopOpacity="0.3" />
                                    </linearGradient>
                                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(6,182,212,0.1)" strokeWidth="0.5" />
                                    </pattern>
                                </defs>

                                {/* Background Grid */}
                                <rect width="100%" height="100%" fill="url(#grid)" />

                                {/* Earth Node (Left) */}
                                <g transform="translate(50, 150)">
                                    <circle r="20" fill="#1e293b" stroke="#0ea5e9" strokeWidth="2" />
                                    <text x="0" y="35" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="monospace">EARTH (DSN)</text>
                                    <circle r="4" fill="#0ea5e9" className="animate-pulse" />
                                </g>

                                {/* Spacecraft Node (Right) */}
                                <g transform="translate(750, 150)">
                                    <circle r="10" fill="#1e293b" stroke={isConnected ? "#22c55e" : "#ef4444"} strokeWidth="2" />
                                    <text x="0" y="25" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="monospace">TARGET</text>
                                    {isConnected && (
                                        <path d="M -15 -10 L 0 0 L -15 10" fill="none" stroke="#22c55e" strokeWidth="2" />
                                    )}
                                </g>

                                {/* Connection Line */}
                                <line x1="70" y1="150" x2="730" y2="150" stroke="#334155" strokeWidth="1" strokeDasharray="5,5" />

                                {/* Active Link Beam */}
                                {isConnected && (
                                    <>
                                        {/* Beam Cone */}
                                        <path d="M 740 150 L 70 120 L 70 180 Z" fill="url(#beamGradient)" />

                                        {/* Traveling Packets */}
                                        <circle r="3" fill="#ffffff" filter="drop-shadow(0 0 5px #fff)">
                                            <animate attributeName="cx" from="730" to="70" dur="3s" repeatCount="indefinite" />
                                            <animate attributeName="cy" from="150" to="150" dur="3s" repeatCount="indefinite" />
                                            <animate attributeName="opacity" values="0;1;1;0" dur="3s" repeatCount="indefinite" />
                                        </circle>
                                        <circle r="3" fill="#ffffff" filter="drop-shadow(0 0 5px #fff)">
                                            <animate attributeName="cx" from="730" to="70" dur="3s" begin="1.5s" repeatCount="indefinite" />
                                            <animate attributeName="cy" from="150" to="150" dur="3s" begin="1.5s" repeatCount="indefinite" />
                                            <animate attributeName="opacity" values="0;1;1;0" dur="3s" begin="1.5s" repeatCount="indefinite" />
                                        </circle>
                                    </>
                                )}

                                {/* Distance Markers */}
                                <g transform="translate(400, 150)">
                                    <text x="0" y="-10" textAnchor="middle" fill="#64748b" fontSize="10" fontFamily="monospace">
                                        {(spacecraft.distanceKm / 149597870.7).toFixed(2)} AU
                                    </text>
                                    <text x="0" y="20" textAnchor="middle" fill="#64748b" fontSize="10" fontFamily="monospace">
                                        {(spacecraft.distanceKm / 1e6).toFixed(1)} M km
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
                            <div className="bg-cyan-900/10 p-2 border-l-2 border-cyan-600">
                                <span className="block text-[10px] text-slate-500">EST. BANDWIDTH</span>
                                <span className="text-sm text-cyan-400">{dataRateLabel}</span>
                            </div>
                            <div className="bg-cyan-900/10 p-2 border-l-2 border-cyan-600">
                                <span className="block text-[10px] text-slate-500">ANTENNA CONFIG</span>
                                <span className="text-xs text-cyan-400 truncate" title={specs.antenna}>{specs.antenna}</span>
                            </div>
                            <div className="bg-cyan-900/10 p-2 border-l-2 border-cyan-600">
                                <span className="block text-[10px] text-slate-500">POWER SOURCE</span>
                                <span className="text-xs text-cyan-400 truncate" title={specs.power}>{specs.power}</span>
                            </div>
                        </div>
                    </div>

                    {/* Side Panel (Right Col) */}
                    <div className="lg:col-span-4 flex flex-col gap-6">

                        {/* Onboard Systems Status */}
                        <div className="bg-slate-950 border border-cyan-900/40 p-1">
                            <div className="bg-cyan-900/20 px-2 py-1 text-[10px] text-cyan-400 font-bold border-b border-cyan-900/40 flex justify-between">
                                <span>ONBOARD_SYSTEMS</span>
                                <span className={isConnected ? "text-cyan-400" : "text-amber-500"}>{isConnected ? "● ONLINE" : "○ LOW POWER"}</span>
                            </div>
                            <div className="p-2 h-48 overflow-y-auto font-mono text-xs">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="text-[9px] text-slate-600 border-b border-slate-800">
                                            <th className="pb-1">ID</th>
                                            <th className="pb-1">SYSTEM</th>
                                            <th className="pb-1 text-right">STATUS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {specs.instruments.map((inst) => (
                                            <tr key={inst.id} className="border-b border-slate-800/50 hover:bg-cyan-900/10 transition-colors">
                                                <td className="py-1.5 text-cyan-500/80 font-bold">{inst.id}</td>
                                                <td className="py-1.5 text-slate-400 truncate max-w-[120px]" title={inst.name}>{inst.name}</td>
                                                <td className="py-1.5 text-right">
                                                    <span className={`px-1 py-0.5 rounded text-[9px] ${inst.status === 'ON' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' :
                                                        inst.status === 'STANDBY' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30' :
                                                            'bg-red-500/10 text-red-500 border border-red-500/30'
                                                        }`}>
                                                        {inst.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Doppler & Signal */}
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                                    <span>DOPPLER SHIFT (Δf)</span>
                                    <span>{shiftHz > 0 ? '+' : ''}{(shiftHz / 1000).toFixed(3)} kHz</span>
                                </div>
                                <div className="h-4 bg-slate-900 border border-slate-700 relative overflow-hidden">
                                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/30 z-10" />
                                    {/* Bar growing from center */}
                                    <div
                                        className={`absolute top-0 bottom-0 transition-all duration-300 ${shiftHz > 0 ? 'bg-cyan-600 left-1/2' : 'bg-amber-600 right-1/2'}`}
                                        style={{ width: `${Math.min(Math.abs(shiftHz) / 1000, 50)}%` }}
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                                    <span>SIGNAL STRENGTH (Rx Power)</span>
                                    <span>{liveSignal.toFixed(1)} dBm</span>
                                </div>
                                <div className="flex gap-0.5">
                                    {Array.from({ length: 20 }).map((_, i) => (
                                        <div
                                            key={i}
                                            className={`h-3 w-full max-w-[10px] skew-x-[-20deg] ${i < (liveSignal + 160) / 2
                                                ? (i > 15 ? 'bg-amber-500' : 'bg-cyan-500')
                                                : 'bg-slate-800'
                                                }`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Latency Box */}
                        <div className="bg-slate-900/50 border-t border-cyan-900/40 pt-4">
                            <div className="text-[10px] text-slate-500 mb-2 tracking-widest uppercase">Light Delay Protocol</div>
                            <div className="flex justify-between items-center bg-black p-2 border border-slate-800">
                                <div className="text-right">
                                    <div className="text-[9px] text-cyan-700">TX_ORIGIN</div>
                                    <div className="text-sm text-cyan-500">{new Date(Date.now() - (spacecraft.distanceKm / 299792 * 1000)).toLocaleTimeString()}</div>
                                </div>
                                <div className="text-xs text-slate-600 font-bold">→ {(spacecraft.distanceKm / 299792 / 60).toFixed(1)}m →</div>
                                <div>
                                    <div className="text-[9px] text-cyan-700">RX_LOCAL</div>
                                    <div className="text-sm text-white">{new Date().toLocaleTimeString()}</div>
                                </div>
                            </div>
                        </div>

                    </div>

                </div>

                {/* Footer Deco */}
                <div className="p-2 border-t border-slate-800 flex justify-between text-[9px] text-slate-600 bg-slate-950 uppercase tracking-wider">
                    <span>UNCLASSIFIED // PUBLIC RELEASE</span>
                    <span>TCR-OV // 24.2.19.11</span>
                </div>
            </div>
        </div>
    );
};
