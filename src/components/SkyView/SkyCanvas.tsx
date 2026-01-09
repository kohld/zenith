import { useRef, useEffect } from 'react';
import { SatellitePosition } from '../../utils/orbital';

interface VisualObject {
    name: string;
    position: SatellitePosition;
}

interface SkyCanvasProps {
    objects: VisualObject[]; // Satellites
}

export const SkyCanvas = ({ objects }: SkyCanvasProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;

        const render = () => {
            // Resize canvas to display size
            const { width, height } = canvas.getBoundingClientRect();
            // Handle high DPI
            const dpr = window.devicePixelRatio || 1;

            if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
                canvas.width = width * dpr;
                canvas.height = height * dpr;
            }

            ctx.scale(dpr, dpr);
            // From here on, use logical pixels

            const cx = width / 2;
            const cy = height / 2;
            const radius = Math.min(cx, cy) - 35; // Margin

            // Clear
            ctx.clearRect(0, 0, width, height);

            // Draw Background (Stars)
            // Ideally stars should be static or calculated once, but for now simple random
            ctx.fillStyle = '#0f172a'; // Slate-900 like
            // Actually the background is transparent so we see the app bg? 
            // Or we draw a dark circle for the sky?

            // Draw Sky Circle Background
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(15, 23, 42, 0.8)'; // Dark slate semi-transparent
            ctx.fill();
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)'; // Cyan-400 faint
            ctx.lineWidth = 1;
            ctx.stroke();

            // Draw Grid (Azimuth lines)
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.1)';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'rgba(148, 163, 184, 0.5)'; // Slate-400
            ctx.font = '10px Inter, sans-serif';

            const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
            for (let i = 0; i < 8; i++) {
                const angle = (i * 45) * (Math.PI / 180) - Math.PI / 2;
                const tx = cx + radius * Math.cos(angle);
                const ty = cy + radius * Math.sin(angle);

                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.lineTo(tx, ty);
                ctx.stroke();

                // Labels
                const lx = cx + (radius + 15) * Math.cos(angle);
                const ly = cy + (radius + 15) * Math.sin(angle);
                ctx.fillText(directions[i], lx, ly);
            }

            // Draw Elevation Rings (0, 30, 60)
            [0, 30, 60].forEach(el => {
                const r = radius * (1 - el / 90);
                ctx.beginPath();
                ctx.arc(cx, cy, r, 0, 2 * Math.PI);
                ctx.stroke();
                if (el > 0) {
                    ctx.fillText(`${el}°`, cx + 5, cy - r + 5);
                }
            });

            // Draw Satellites
            objects.forEach(obj => {
                if (obj.position.elevation < 0) return; // Below horizon

                // Convert Az/El to X/Y
                // Azimuth: 0 is North (Top). In canvas, 0 is Right. 
                // So -90 degrees offset.
                // Also Azimuth increases clockwise (N -> E -> S). Canvas angle increases clockwise.
                // So angle = (azimuth - 90) * degToRad

                const angle = (obj.position.azimuth - 90) * (Math.PI / 180);
                const dist = radius * (1 - obj.position.elevation / 90);

                const x = cx + dist * Math.cos(angle);
                const y = cy + dist * Math.sin(angle);

                // Draw Satellite Dot
                const isISS = obj.name.includes('ISS');
                const dotColor = isISS ? '#ffffff' : '#38bdf8';
                const dotSize = isISS ? 5 : 3;

                ctx.beginPath();
                ctx.arc(x, y, dotSize, 0, 2 * Math.PI);
                ctx.fillStyle = dotColor;
                ctx.fill();

                // Glow
                ctx.shadowBlur = isISS ? 15 : 8;
                ctx.shadowColor = dotColor;
                ctx.fill();
                ctx.shadowBlur = 0;

                // Label
                ctx.font = '10px Inter, sans-serif';
                ctx.fillStyle = '#e2e8f0'; // Slate-200
                ctx.fillText(obj.name, x, y - 8);
            });

            // Keep reference for cleanup if needed, but we rely on React state updates to drive this mostly.
            // Actually, if we want smooth animation of *time*, map needs to drive the loop.
            // Here we just render what we get.
            // If props update, we re-render? No, canvas should just be a dumb renderer called by effect.
            // But if we want 60fps local interpolation, this component should handle the loop.
            // For now, let's just render when props change or just once per frame if parent drives it.
            // Let's assume parent drives the data update at 1fps or higher.

            // To make it smooth, the parent should update positions frequently or we interpolate here.
            // Simpler: Parent updates.

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => cancelAnimationFrame(animationFrameId);
    }, [objects]);

    return (
        <canvas
            ref={canvasRef}
            className="w-full h-full"
            style={{ width: '100%', height: '100%' }}
        />
    );
};
