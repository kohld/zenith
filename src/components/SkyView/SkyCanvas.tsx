import { useRef, useEffect } from 'react';
import { VisualObject } from '../../lib/definitions';

interface SkyCanvasProps {
    objects: VisualObject[];
    onSelect?: (id: string | null) => void;
    selectedSatId?: string | null; // Changed from selectedSat (name)
    orbitPath?: { azimuth: number; elevation: number }[];
}

export const SkyCanvas = ({ objects, onSelect, selectedSatId, orbitPath }: SkyCanvasProps) => { // Updated props
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;

        const render = () => {
            // Resize canvas
            const { width, height } = canvas.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;

            if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
                canvas.width = width * dpr;
                canvas.height = height * dpr;
            }

            ctx.scale(dpr, dpr);
            // Logic pixels

            const cx = width / 2;
            const cy = height / 2;
            const radius = Math.min(cx, cy) - 35;

            // Helper for projection
            const project = (az: number, el: number) => {
                const r = radius * (1 - el / 90);
                const angle = (az - 90) * (Math.PI / 180);
                return {
                    x: cx + r * Math.cos(angle),
                    y: cy + r * Math.sin(angle)
                };
            };

            // Clear
            ctx.clearRect(0, 0, width, height);

            // Sky Circle
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Grid (Azimuth)
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.1)';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
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

                const lx = cx + (radius + 20) * Math.cos(angle);
                const ly = cy + (radius + 20) * Math.sin(angle);
                ctx.fillText(directions[i], lx, ly);
            }

            // Elevation Rings
            [0, 30, 60].forEach(el => {
                const r = radius * (1 - el / 90);
                ctx.beginPath();
                ctx.arc(cx, cy, r, 0, 2 * Math.PI);
                ctx.stroke();
                if (el > 0) {
                    ctx.fillText(`${el}°`, cx + 5, cy - r + 5);
                }
            });

            // Draw Orbit Path
            if (orbitPath && orbitPath.length > 0) {
                ctx.beginPath();
                ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)'; // Cyan-400 transparent
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);

                // Determine start point (Satellite position or first point)
                let started = false;

                // If we have a selected satellite that matches, start from it to connect the line
                if (selectedSatId) {
                    const sat = objects.find(o => o.id === selectedSatId); // Use ID
                    if (sat && sat.position.elevation > 0) {
                        const { x, y } = project(sat.position.azimuth, sat.position.elevation);
                        ctx.moveTo(x, y);
                        started = true;
                    }
                }

                orbitPath.forEach(pt => {
                    if (pt.elevation > 0) {
                        const { x, y } = project(pt.azimuth, pt.elevation);
                        if (!started) {
                            ctx.moveTo(x, y);
                            started = true;
                        } else {
                            ctx.lineTo(x, y);
                        }
                    } else {
                        started = false; // Break line if below horizon
                    }
                });
                ctx.stroke();
                ctx.setLineDash([]);
            }

            // Draw Satellites
            objects.forEach(obj => {
                if (obj.position.elevation < 0) return;

                const { x, y } = project(obj.position.azimuth, obj.position.elevation);

                const isISS = obj.name.includes('ISS');
                const isSelected = selectedSatId === obj.id; // Use ID

                let dotColor = '#38bdf8';
                let dotSize = 3;
                let shadowBlur = 8;

                if (isISS) {
                    dotColor = '#ffffff';
                    dotSize = 5;
                    shadowBlur = 15;
                }

                if (isSelected) {
                    dotColor = '#fbbf24'; // Amber
                    dotSize = 5;
                    shadowBlur = 15;

                    // Selection Ring
                    ctx.beginPath();
                    ctx.arc(x, y, 10, 0, 2 * Math.PI);
                    ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }

                ctx.beginPath();
                ctx.arc(x, y, dotSize, 0, 2 * Math.PI);
                ctx.fillStyle = dotColor;
                ctx.shadowBlur = shadowBlur;
                ctx.shadowColor = dotColor;
                ctx.fill();
                ctx.shadowBlur = 0;

                // Label
                if (isISS || isSelected) {
                    ctx.fillStyle = isSelected ? '#fbbf24' : '#ffffff';
                    ctx.font = isSelected ? 'bold 12px Inter' : '10px Inter';
                    ctx.fillText(obj.name, x, y - 12);
                } else {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                    ctx.font = '10px Inter';
                    ctx.fillText(obj.name, x, y - 8);
                }
            });
        }; // End of render function

        animationFrameId = requestAnimationFrame(render);

        return () => cancelAnimationFrame(animationFrameId);
    }, [objects, selectedSatId, orbitPath]); // Updated dep

    const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!onSelect) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const width = rect.width;
        const height = rect.height;
        const cx = width / 2;
        const cy = height / 2;
        const radius = Math.min(cx, cy) - 35;

        let closestId: string | null = null; // Use ID
        let minDist = 20; // Hit radius

        objects.forEach(obj => {
            if (obj.position.elevation < 0) return;

            // Project again to get screen coords
            const r = radius * (1 - obj.position.elevation / 90);
            const angle = (obj.position.azimuth - 90) * (Math.PI / 180);
            const ox = cx + r * Math.cos(angle);
            const oy = cy + r * Math.sin(angle);

            const dx = x - ox;
            const dy = y - oy;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < minDist) {
                minDist = dist;
                closestId = obj.id;
            }
        });

        onSelect(closestId);
    };

    return (
        <canvas
            ref={canvasRef}
            className="w-full h-full cursor-pointer"
            style={{ width: '100%', height: '100%' }}
            onClick={handleClick}
        />
    );
};
