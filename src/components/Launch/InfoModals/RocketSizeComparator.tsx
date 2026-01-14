
interface RocketSizeComparatorProps {
    length: number; // in meters
    diameter: number; // in meters
    name: string;
}

export const RocketSizeComparator = ({ length, diameter, name }: RocketSizeComparatorProps) => {
    // Reference: Human (1.8m)
    // We want to scale the view so the rocket fits nicely.
    // Padding: 5% top/bottom

    // Fallbacks if data is missing
    const safeHeight = length || 50;
    const safeWidth = diameter || 3.7;

    const humanPath = "M-0.3,-1.7 C-0.3,-1.9 0.3,-1.9 0.3,-1.7 L0.4,-1.1 L0.6,-0.6 L0.5,-0.3 L0.3,0 L-0.3,0 L-0.5,-0.3 L-0.6,-0.6 L-0.4,-1.1 Z";

    return (
        <div className="bg-white/5 border border-white/5 rounded-xl p-6 flex flex-col items-center">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 w-full text-left">Size Comparison</h3>

            <div className="relative w-full h-64 flex items-end justify-center border-b border-white/20 pb-0">
                <svg
                    viewBox={`${-10} ${-safeHeight - 5} ${20} ${safeHeight + 5}`}
                    className="h-full w-full overflow-visible"
                    preserveAspectRatio="xMidYMax meet"
                >
                    {/* Ground Line */}
                    <line x1="-50" y1="0" x2="50" y2="0" stroke="rgba(255,255,255,0.2)" strokeWidth="0.1" />

                    {/* Reference: Human (1.8m tall) placed to the left */}
                    <g transform={`translate(${-safeWidth / 2 - 4}, 0)`}>
                        <path d={humanPath} fill="#64748b" />
                        {/* Scale label for Human */}
                        <text x="0" y="2" fontSize="1" textAnchor="middle" fill="#64748b" className="font-mono text-[0.1px]">Human (1.8m)</text>
                    </g>

                    {/* Rocket Body */}
                    {/* Simplified as a cylinder with a nose cone */}
                    {/* Body */}
                    <rect
                        x={-safeWidth / 2}
                        y={-safeHeight + (safeWidth)} // Body starts below nosecone
                        width={safeWidth}
                        height={safeHeight - safeWidth}
                        fill="url(#rocketGradient)"
                        stroke="rgba(255,255,255,0.3)"
                        strokeWidth="0.1"
                    />

                    {/* Nose Cone (Triangle/Curve approximation) */}
                    <path
                        d={`M${-safeWidth / 2},${-safeHeight + safeWidth} Q${0},${-safeHeight} ${safeWidth / 2},${-safeHeight + safeWidth}`}
                        fill="url(#rocketGradient)"
                        stroke="rgba(255,255,255,0.3)"
                        strokeWidth="0.1"
                    />

                    {/* Engines / Exhaust Bell (Visual Flair) */}
                    <path
                        d={`M${-safeWidth / 2 + 0.2},0 L${-safeWidth / 2},${0.5} L${-safeWidth / 2 + 1},${0.5} L${-safeWidth / 2 + 0.8},0`}
                        fill="#334155"
                    />
                    <path
                        d={`M${safeWidth / 2 - 0.2},0 L${safeWidth / 2},${0.5} L${safeWidth / 2 - 1},${0.5} L${safeWidth / 2 - 0.8},0`}
                        fill="#334155"
                    />

                    {/* Gradient Definition */}
                    <defs>
                        <linearGradient id="rocketGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#cbd5e1" />
                            <stop offset="50%" stopColor="#f1f5f9" />
                            <stop offset="100%" stopColor="#94a3b8" />
                        </linearGradient>
                    </defs>

                    {/* Dimensions Label */}
                    <g transform={`translate(${safeWidth / 2 + 2}, ${-safeHeight / 2})`}>
                        <text x="0" y="0" fontSize={Math.max(1, safeHeight / 30)} fill="white" className="font-mono font-bold" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
                            {safeHeight}m
                        </text>
                    </g>

                    {/* Top Height Marker Line */}
                    <line x1={-safeWidth / 2 - 1} y1={-safeHeight} x2={safeWidth / 2 + 1} y2={-safeHeight} stroke="rgba(255,255,255,0.4)" strokeDasharray="0.5 0.5" strokeWidth="0.1" />
                </svg>
            </div>

            <div className="mt-4 text-center">
                <div className="text-white font-bold">{name}</div>
                <div className="text-xs text-slate-500">vs. Human (1.8m)</div>
            </div>
        </div>
    );
};
