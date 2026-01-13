import { Map, Marker } from "pigeon-maps";
import { useState, useRef, useEffect } from 'react';
import { LaunchMapProps } from '../../lib/definitions';

export const LaunchMap = ({ latitude, longitude, zoom = 10, height = 300, className = "", autoHeight = false }: LaunchMapProps) => {
    // State to track responsive height if autoHeight is enabled
    const [containerHeight, setContainerHeight] = useState(height);
    const containerRef = useRef<HTMLDivElement>(null);

    // CartoDB Dark Matter Tiles (High Res)
    const mapProvider = (x: number, y: number, z: number, dpr?: number) => {
        return `https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/${z}/${x}/${y}${dpr && dpr >= 2 ? '@2x' : ''}.png`;
    };

    // Handle auto-resizing
    useEffect(() => {
        if (!autoHeight || !containerRef.current) return;

        const updateHeight = () => {
            if (containerRef.current) {
                setContainerHeight(containerRef.current.clientHeight);
            }
        };

        // Initial measurement
        updateHeight();

        // Observer for changes
        const observer = new ResizeObserver(updateHeight);
        observer.observe(containerRef.current);

        return () => observer.disconnect();
    }, [autoHeight]);

    // Determine final style - either fixed height or full height for flex containers
    const style = autoHeight ? { height: '100%', minHeight: '150px' } : { height: `${height}px` };
    // Map needs explicit pixel height usually, so we use the measured one OR the fixed one
    const mapHeight = autoHeight ? containerHeight : height;

    return (
        <div
            ref={containerRef}
            className={`relative rounded-xl overflow-hidden border border-white/10 shadow-2xl bg-slate-900 group ${className}`}
            style={style}
        >
            {/* Map Layer - Interaction Disabled via CSS/Props */}
            <div className="absolute inset-0 grayscale-[50%] transition-all duration-700 group-hover:grayscale-0">
                <Map
                    height={mapHeight}
                    center={[latitude, longitude]}
                    zoom={zoom}
                    provider={mapProvider}
                    dprs={[1, 2]}
                    mouseEvents={false}
                    touchEvents={false}
                    metaWheelZoom={false}
                    twoFingerDrag={false}
                >
                    <Marker width={40} anchor={[latitude, longitude]} color="#22d3ee" />
                </Map>
            </div>

            {/* Premium Overlay Effects */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Vignette - Lighter */}
                <div className="absolute inset-0 bg-radial-gradient from-transparent to-black/40"></div>
                {/* Tech Grid Overlay */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgMWgydjJIMUMxeiIgZmlsbD0iI2ZmZiIgZmlsbC1vcGFjaXR5PSIwLjA1Ii8+PC9zdmc+')] opacity-20"></div>
                {/* Crosshairs */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center opacity-50">
                    <div className="absolute w-full h-[1px] bg-cyan-500/50"></div>
                    <div className="absolute h-full w-[1px] bg-cyan-500/50"></div>
                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.8)]"></div>
                </div>
                {/* Corner Accents */}
                <div className="absolute top-2 left-2 w-2 h-2 border-l border-t border-white/30"></div>
                <div className="absolute top-2 right-2 w-2 h-2 border-r border-t border-white/30"></div>
                <div className="absolute bottom-2 left-2 w-2 h-2 border-l border-b border-white/30"></div>
                <div className="absolute bottom-2 right-2 w-2 h-2 border-r border-b border-white/30"></div>
            </div>
        </div>
    );
};
