import { useRef, useEffect } from 'react';
import { VisualObject } from '../../lib/definitions';
import { projectAzElToCartesian } from '../../utils/projection';

interface RadarCanvasProps {
    objects: VisualObject[];
    onSelect?: (id: string | null) => void;
    selectedSatId?: string | null;
    orbitPath?: { azimuth: number; elevation: number }[];
}

export const RadarCanvas = ({ objects, onSelect, selectedSatId, orbitPath }: RadarCanvasProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const sweepRef = useRef(0); // Current angle of the radar sweep

    // Refs for props to access inside animation loop without restarting it
    const objectsRef = useRef(objects);
    const selectedSatIdRef = useRef(selectedSatId);
    const orbitPathRef = useRef(orbitPath);
    const onSelectRef = useRef(onSelect);

    // Update refs when props change
    useEffect(() => {
        objectsRef.current = objects;
    }, [objects]);

    useEffect(() => {
        selectedSatIdRef.current = selectedSatId;
    }, [selectedSatId]);

    useEffect(() => {
        orbitPathRef.current = orbitPath;
    }, [orbitPath]);

    useEffect(() => {
        onSelectRef.current = onSelect;
    }, [onSelect]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let lastTime = performance.now();

        // Mobile detection
        const isMobile = window.innerWidth < 768;
        const touchTargetRadius = isMobile ? 30 : 10;

        // Hit detection state
        let hoverSatId: string | null = null;
        let lastMouseX = 0;
        let lastMouseY = 0;

        // Sweep pulse tracking: Map<satId, timestamp when sweep touched it>
        const sweepPulses = new Map<string, number>();

        const handleMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            // Use client coordinates directly (already in CSS pixels)
            lastMouseX = e.clientX - rect.left;
            lastMouseY = e.clientY - rect.top;
        };

        const handleClick = () => {
            if (hoverSatId && onSelectRef.current) {
                onSelectRef.current(hoverSatId);
            } else if (onSelectRef.current) {
                onSelectRef.current(null);
            }
        };

        const handleTouchStart = (e: TouchEvent) => {
            // Prevent scrolling when touching the radar
            if (e.cancelable) e.preventDefault();

            const rect = canvas.getBoundingClientRect();
            lastMouseX = e.touches[0].clientX - rect.left;
            lastMouseY = e.touches[0].clientY - rect.top;

            // Immediately check for hit
            const currentObjects = objectsRef.current;
            const cx = rect.width / 2;
            const cy = rect.height / 2;
            // Radius calculation must match render loop (which uses radius = Math.min(cx, cy) - 65)
            const radius = Math.min(cx, cy) - 65;

            let touchedId: string | null = null;
            currentObjects.forEach(sat => {
                if (sat.position.elevation < 0) return;
                const { x, y } = projectAzElToCartesian(sat.position.azimuth, sat.position.elevation, cx, cy, radius);
                const dist = Math.hypot(x - lastMouseX, y - lastMouseY);
                if (dist < touchTargetRadius) {
                    touchedId = sat.id;
                }
            });

            if (touchedId && onSelectRef.current) {
                onSelectRef.current(touchedId);
            } else if (onSelectRef.current) {
                onSelectRef.current(null);
            }
        };

        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('click', handleClick);
        canvas.addEventListener('touchstart', handleTouchStart);

        const render = (time: number) => {
            // Time delta for consistent animation speed regardless of frame rate
            const dt = (time - lastTime) / 1000;
            lastTime = time;

            // Resize canvas
            const { width, height } = canvas.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;

            if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
                canvas.width = width * dpr;
                canvas.height = height * dpr;
            }

            // Always reset transform before clearing
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            // Use refs for data
            const currentObjects = objectsRef.current;
            const currentSelectedSatId = selectedSatIdRef.current;
            const currentOrbitPath = orbitPathRef.current;

            const cx = width / 2;
            const cy = height / 2;
            const radius = Math.min(cx, cy) - 65; // Increased from 50 to 65 for more label spacing

            // Update Sweep Angle (based on time)
            // 0.8 rad/s -> ~7.8s per rotation (Smoother, easier to read)
            sweepRef.current = (sweepRef.current + 0.8 * dt) % (Math.PI * 2);

            // Clear
            ctx.clearRect(0, 0, width, height);

            // --- 1. Radar Background & Grid ---

            // Base fill
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(15, 23, 42, 0.6)'; // Dark Slate
            ctx.fill();

            // Glowing Outer Ring
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
            ctx.strokeStyle = 'rgba(6, 182, 212, 0.5)'; // Cyan
            ctx.lineWidth = 2;
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'rgba(6, 182, 212, 0.5)';
            ctx.stroke();
            ctx.shadowBlur = 0; // Reset

            // Inner Grid Rings (30°, 60°)
            [30, 60].forEach(el => {
                const r = radius * (1 - el / 90);
                ctx.beginPath();
                ctx.arc(cx, cy, r, 0, 2 * Math.PI);
                ctx.strokeStyle = 'rgba(6, 182, 212, 0.1)';
                ctx.lineWidth = 1;
                ctx.stroke();

                // Label
                ctx.fillStyle = 'rgba(6, 182, 212, 0.4)';
                ctx.font = '9px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(`${el}°`, cx, cy - r + 10);
            });

            // Crosshairs / Azimuth Lines
            const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
            for (let i = 0; i < 8; i++) {
                const angle = (i * 45) * (Math.PI / 180) - Math.PI / 2;
                const isCardinal = i % 2 === 0;

                const tx = cx + radius * Math.cos(angle);
                const ty = cy + radius * Math.sin(angle);

                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.lineTo(tx, ty);
                ctx.strokeStyle = isCardinal ? 'rgba(6, 182, 212, 0.15)' : 'rgba(6, 182, 212, 0.05)';
                ctx.stroke();

                // Cardinal Labels
                if (isCardinal) {
                    const lx = cx + (radius + 22) * Math.cos(angle); // Increased from 15 to 22
                    const ly = cy + (radius + 22) * Math.sin(angle);
                    ctx.fillStyle = 'rgba(34, 211, 238, 0.8)'; // Cyan-400
                    ctx.font = 'bold 10px Inter';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(directions[i], lx, ly);
                }
            }

            // --- 2. Orbit Path (if available) ---
            if (currentOrbitPath && currentOrbitPath.length > 1) {
                ctx.beginPath();
                let first = true;
                currentOrbitPath.forEach(pt => {
                    if (pt.elevation > 0) { // Only draw points above horizon
                        const xy = projectAzElToCartesian(pt.azimuth, pt.elevation, cx, cy, radius);
                        if (first) {
                            ctx.moveTo(xy.x, xy.y);
                            first = false;
                        } else {
                            ctx.lineTo(xy.x, xy.y);
                        }
                    } else {
                        first = true; // Reset if path goes below horizon
                    }
                });
                ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)'; // Amber path
                ctx.setLineDash([4, 4]);
                ctx.lineWidth = 1.5;
                ctx.stroke();
                ctx.setLineDash([]);
            }

            // --- 3. Satellites ---
            let detectedHover: string | null = null; // Local hit detection for this frame

            if (currentObjects) {
                currentObjects.forEach(sat => {
                    if (sat.position.elevation < 0) return; // Don't draw if below horizon

                    // Convert Az/El to X/Y
                    // Elevation: 90 is center (r=0), 0 is horizon (r=radius)
                    const { x, y } = projectAzElToCartesian(sat.position.azimuth, sat.position.elevation, cx, cy, radius);

                    const isSelected = sat.id === currentSelectedSatId;
                    const isISS = sat.name.includes("ISS") || sat.name.includes("STATION");
                    const isHovered = hoverSatId === sat.id;

                    // Hit Detect (larger radius on mobile for easier tapping)
                    const dist = Math.hypot(x - lastMouseX, y - lastMouseY);
                    if (dist < touchTargetRadius) {
                        detectedHover = sat.id;
                    }

                    // Sweep Detection: Check if sweep line is near this satellite's angle
                    const satAngle = (sat.position.azimuth - 90) * (Math.PI / 180); // Convert to radians matching projection
                    const sweepAngle = sweepRef.current;

                    // Calculate angular difference (accounting for wrap-around)
                    let angleDiff = Math.abs(satAngle - sweepAngle);
                    if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

                    // If sweep is within ~1.5 degrees of satellite, mark it as touched
                    const sweepThreshold = (1.5 * Math.PI) / 180; // 1.5 degrees - tighter sync
                    if (angleDiff < sweepThreshold && !sweepPulses.has(sat.id)) {
                        sweepPulses.set(sat.id, time);
                    }

                    // Calculate pulse intensity (fades over 1 second)
                    let pulseIntensity = 0;
                    if (sweepPulses.has(sat.id)) {
                        const touchTime = sweepPulses.get(sat.id)!;
                        const elapsed = time - touchTime;
                        const pulseDuration = 1000; // 1 second

                        if (elapsed < pulseDuration) {
                            pulseIntensity = 1 - (elapsed / pulseDuration); // Fade from 1 to 0
                        } else {
                            sweepPulses.delete(sat.id); // Clean up old pulses
                        }
                    }

                    // Pulse effect for selected
                    // Larger dots on mobile for better visibility and touch targets
                    const baseSizeISS = isMobile ? 6 : 4;
                    const baseSizeRegular = isMobile ? 5 : 3;
                    let size = isISS ? baseSizeISS : baseSizeRegular;
                    let color = isISS ? '#F59E0B' : '#38bdf8'; // Amber for ISS, Sky-400 for others

                    // Apply sweep pulse to non-selected satellites
                    if (!isSelected && pulseIntensity > 0) {
                        size += pulseIntensity * 2; // Grow by up to 2px
                    }

                    if (isSelected) {
                        color = '#fbbf24'; // Amber-400 for Selection
                        size = 5;

                        // Pulsing ring
                        const pulse = 10 + Math.sin(time / 200) * 4;
                        ctx.beginPath();
                        ctx.arc(x, y, pulse, 0, 2 * Math.PI);
                        ctx.strokeStyle = `rgba(251, 191, 36, ${0.4 + Math.sin(time / 200) * 0.2})`; // Amber pulse
                        ctx.stroke();

                        // Crosshair / Reticle effect
                        ctx.beginPath();
                        ctx.moveTo(x - 8, y);
                        ctx.lineTo(x - 4, y);
                        ctx.moveTo(x + 8, y);
                        ctx.lineTo(x + 4, y);
                        ctx.moveTo(x, y - 8);
                        ctx.lineTo(x, y - 4);
                        ctx.moveTo(x, y + 8);
                        ctx.lineTo(x, y + 4);
                        ctx.strokeStyle = '#fbbf24';
                        ctx.stroke();

                    } else if (isHovered) {
                        color = '#FFFFFF';
                        size = 4;
                    }

                    // Draw Marker Body
                    ctx.beginPath();
                    if (isISS) {
                        // ISS Icon (Square)
                        ctx.rect(x - 4, y - 4, 8, 8);
                        ctx.fillStyle = '#ffffff';
                        ctx.shadowBlur = 10;
                        ctx.shadowColor = 'white';
                    } else {
                        // Generic Dot
                        ctx.arc(x, y, size, 0, 2 * Math.PI);
                        ctx.fillStyle = color;
                        ctx.shadowBlur = isSelected ? 8 : 4;
                        ctx.shadowColor = color;
                    }
                    ctx.fill();
                    ctx.shadowBlur = 0;

                    // Draw Label
                    // Fixed: ensure label stays close to dot
                    if (isISS || isSelected || isHovered) {
                        ctx.font = isSelected ? 'bold 11px Inter, monospace' : '9px Inter';
                        ctx.fillStyle = isSelected ? '#fbbf24' : '#ffffff';
                        ctx.textAlign = 'left';
                        const text = sat.name;
                        const metrics = ctx.measureText(text);
                        const textWidth = metrics.width;
                        const padding = 3;

                        // Position: above when selected, right otherwise
                        let lx = x + 10;
                        let ly = y;

                        if (isSelected) {
                            lx = x - textWidth / 2;
                            ly = y - 22;
                            ctx.textBaseline = 'top';
                        } else {
                            ctx.textBaseline = 'middle';
                        }

                        // Background box
                        const boxHeight = 14;
                        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
                        ctx.fillRect(lx - padding, ly - (isSelected ? padding : boxHeight / 2), textWidth + padding * 2, boxHeight);

                        // Text
                        ctx.fillStyle = isSelected ? '#fbbf24' : '#ffffff';
                        ctx.fillText(text, lx, ly);

                        // Optional: Draw line to label if crowded? 
                        // For now keep simple
                    }
                });
            }

            // Update hover state
            if (detectedHover !== hoverSatId) {
                hoverSatId = detectedHover;
                canvas.style.cursor = hoverSatId ? 'pointer' : 'default';
            }

            // --- 4. Radar Sweep Animation ---

            // Sweep Line
            const angle = sweepRef.current;
            const sx = cx + radius * Math.cos(angle);
            const sy = cy + radius * Math.sin(angle);

            // Gradient Sweep Sector
            try {
                const gradient = ctx.createConicGradient(angle, cx, cy);
                gradient.addColorStop(0, 'rgba(6, 182, 212, 0)');
                gradient.addColorStop(0.85, 'rgba(6, 182, 212, 0)');
                gradient.addColorStop(1, 'rgba(6, 182, 212, 0.3)');

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
                ctx.fill();
            } catch (e) {
                // Fallback
            }

            // Bright leading line
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(sx, sy);
            ctx.strokeStyle = 'rgba(103, 232, 249, 0.8)'; // Cyan-200
            ctx.lineWidth = 1.5;
            ctx.shadowColor = 'rgba(6, 182, 212, 1)';
            ctx.shadowBlur = 10;
            ctx.stroke();
            ctx.shadowBlur = 0;

            animationFrameId = requestAnimationFrame(render);
        };

        // Start Loop
        animationFrameId = requestAnimationFrame(render);

        return () => {
            cancelAnimationFrame(animationFrameId);
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('click', handleClick);
            canvas.removeEventListener('touchstart', handleTouchStart);
        };
    }, []); // Empty dependency array - loop runs forever

    return (
        <canvas
            ref={canvasRef}
            className="w-full h-full cursor-pointer touch-none"
            style={{ width: '100%', height: '100%' }}
            role="img"
            aria-label="Orbital Radar"
        />
    );
};
