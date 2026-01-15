import { useRef, useEffect } from 'react';
import { VisualObject, ObserverLocation, Star, ConstellationLine } from '../../lib/definitions';
import { projectAzElToCartesian } from '../../utils/projection';
import { raDecToAltAz } from '../../utils/astro';

interface RadarCanvasProps {
    objects: VisualObject[];
    onSelect?: (id: string | null) => void;
    selectedSatId?: string | null;
    orbitPath?: { azimuth: number; elevation: number }[];
    location?: ObserverLocation | null;
    stars?: Star[];
    constellations?: ConstellationLine[];
    skyView?: boolean;
}

export const RadarCanvas = ({ objects, onSelect, selectedSatId, orbitPath, location, stars = [], constellations = [], skyView = false }: RadarCanvasProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const sweepRef = useRef(0); // Current angle of the radar sweep

    // Refs for props to access inside animation loop without restarting it
    const objectsRef = useRef(objects);
    const selectedSatIdRef = useRef(selectedSatId);
    const orbitPathRef = useRef(orbitPath);
    const onSelectRef = useRef(onSelect);
    const locationRef = useRef(location);
    const starsRef = useRef(stars);
    const constellationsRef = useRef(constellations);
    const skyViewRef = useRef(skyView);

    // Update refs when props change
    useEffect(() => {
        objectsRef.current = objects;
        selectedSatIdRef.current = selectedSatId;
        orbitPathRef.current = orbitPath;
        onSelectRef.current = onSelect;
        locationRef.current = location;
        starsRef.current = stars;
        constellationsRef.current = constellations;
        skyViewRef.current = skyView;
    }, [objects, selectedSatId, orbitPath, onSelect, location, stars, constellations, skyView]);


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

        // Star data cache (Calculated periodically)
        let starAzEls: { azimuth: number; elevation: number; mag: number; name: string }[] = [];
        let constellationLinesAzEls: { points: { azimuth: number; elevation: number }[] }[] = [];
        let lastAstroUpdate = 0;
        let lastLat = 0;
        let lastLng = 0;
        let lastSkyView = skyViewRef.current;

        // Sweep pulse tracking: Map<satId, timestamp when sweep touched it>
        const sweepPulses = new Map<string, number>();

        // Trail history tracking: Map<satId, {x, y}[]>
        const trailHistory = new Map<string, { x: number; y: number }[]>();
        const MAX_TRAIL_LENGTH = isMobile ? 12 : 20;
        let lastTrailUpdate = 0;

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
                const { x, y } = projectAzElToCartesian(sat.position.azimuth, sat.position.elevation, cx, cy, radius, skyViewRef.current);
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

            // Clear trails if projection mode changed (avoids "stretching" effect)
            if (lastSkyView !== skyViewRef.current) {
                lastSkyView = skyViewRef.current;
                trailHistory.clear();
            }

            // Update Sweep Angle (based on time)
            sweepRef.current = (sweepRef.current + 0.8 * dt) % (Math.PI * 2);

            // Clear
            ctx.clearRect(0, 0, width, height);

            // --- 1. Radar Background & Grid ---

            // Base fill
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(15, 23, 42, 0.6)'; // Dark Slate
            ctx.fill();

            // --- 0. BACKGROUND STARS & CONSTELLATIONS ---
            const observer = locationRef.current;
            if (observer) {
                const locationChanged = observer.lat !== lastLat || observer.lng !== lastLng;
                const starsAvailable = starsRef.current.length > 0;
                const needsAstroUpdate = time - lastAstroUpdate > 30000 || (starAzEls.length === 0 && starsAvailable) || locationChanged;

                if (needsAstroUpdate && starsAvailable) {
                    lastAstroUpdate = time;
                    lastLat = observer.lat;
                    lastLng = observer.lng;
                    const now = new Date();

                    starAzEls = starsRef.current.map(star => {
                        const coords = raDecToAltAz(star.ra, star.dec, observer.lat, observer.lng, now);
                        return { ...coords, mag: star.mag, name: star.name };
                    });

                    constellationLinesAzEls = constellationsRef.current.map(line => ({
                        points: line.points.map(pt => raDecToAltAz(pt[0], pt[1], observer.lat, observer.lng, now))
                    }));
                }

                // --- CLIP TO RADAR CIRCLE ---
                ctx.save();
                ctx.beginPath();
                ctx.arc(cx, cy, radius, 0, Math.PI * 2);
                ctx.clip();

                // Draw Constellations
                ctx.beginPath();
                ctx.strokeStyle = 'rgba(6, 182, 212, 0.2)';
                ctx.lineWidth = 1;
                constellationLinesAzEls.forEach(line => {
                    let first = true;
                    line.points.forEach(pt => {
                        if (pt.elevation > 0) {
                            const { x, y } = projectAzElToCartesian(pt.azimuth, pt.elevation, cx, cy, radius, skyViewRef.current);
                            if (first) {
                                ctx.moveTo(x, y);
                                first = false;
                            } else {
                                ctx.lineTo(x, y);
                            }
                        } else {
                            first = true;
                        }
                    });
                });
                ctx.stroke();

                // Draw Stars
                starAzEls.forEach(star => {
                    if (star.elevation > 0) {
                        const { x, y } = projectAzElToCartesian(star.azimuth, star.elevation, cx, cy, radius, skyViewRef.current);
                        const size = Math.max(0.6, 2.8 - star.mag * 0.4);
                        const baseOpacity = Math.max(0.3, 0.9 - star.mag * 0.15);
                        const twinkle = Math.sin(time / 2000 + star.azimuth) * 0.2 + 0.8;
                        const opacity = baseOpacity * twinkle;

                        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
                        ctx.beginPath();
                        ctx.arc(x, y, size, 0, Math.PI * 2);
                        ctx.fill();

                        // Labels with safety margin
                        const labelMargin = 30;
                        const distFromCenter = Math.hypot(x - cx, y - cy);
                        if (star.name && distFromCenter < radius - labelMargin) {
                            ctx.font = '500 10px "Inter", sans-serif';
                            ctx.fillStyle = `rgba(148, 163, 184, ${opacity * 0.6})`;
                            ctx.textAlign = 'left';
                            ctx.fillText(star.name, x + size + 4, y + 3);
                        }
                    }
                });

                ctx.restore();
            }

            // --- 1.5 MOTION TRAILS ---
            const shouldUpdateTrails = (time - lastTrailUpdate) > 1000;
            if (shouldUpdateTrails) {
                lastTrailUpdate = time;
                currentObjects.forEach(sat => {
                    const { x, y } = projectAzElToCartesian(sat.position.azimuth, sat.position.elevation, cx, cy, radius, skyViewRef.current);
                    const history = trailHistory.get(sat.id) || [];
                    const lastPos = history[history.length - 1];
                    if (!lastPos || Math.hypot(x - lastPos.x, y - lastPos.y) > 0.1) {
                        history.push({ x, y });
                        if (history.length > MAX_TRAIL_LENGTH) history.shift();
                        trailHistory.set(sat.id, history);
                    }
                });
                if (currentObjects.length > 0) {
                    const currentIds = new Set(currentObjects.map(s => s.id));
                    Array.from(trailHistory.keys()).forEach(id => {
                        if (!currentIds.has(id)) trailHistory.delete(id);
                    });
                }
            }

            trailHistory.forEach((history, id) => {
                const sat = currentObjects.find(s => s.id === id);
                if (!sat || history.length < 2) return;
                const isSelected = id === currentSelectedSatId;
                const isISS = sat.name.includes("ISS") || sat.name.includes("STATION");
                const baseColor = (isISS || isSelected) ? '245, 158, 11' : '56, 189, 248';
                ctx.lineWidth = isMobile ? 1 : 2;
                ctx.lineCap = 'round';
                for (let i = 0; i < history.length - 1; i++) {
                    const alpha = Math.pow(i / history.length, 2) * 0.5;
                    ctx.strokeStyle = `rgba(${baseColor}, ${alpha})`;
                    ctx.beginPath();
                    ctx.moveTo(history[i].x, history[i].y);
                    ctx.lineTo(history[i + 1].x, history[i + 1].y);
                    ctx.stroke();
                }
            });

            // --- 2. GRID & LABELS ---
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
            ctx.strokeStyle = 'rgba(6, 182, 212, 0.5)';
            ctx.lineWidth = 2;
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'rgba(6, 182, 212, 0.5)';
            ctx.stroke();
            ctx.shadowBlur = 0;

            [30, 60].forEach(el => {
                const r = radius * (1 - el / 90);
                ctx.beginPath();
                ctx.arc(cx, cy, r, 0, 2 * Math.PI);
                ctx.strokeStyle = 'rgba(6, 182, 212, 0.1)';
                ctx.stroke();
                ctx.fillStyle = 'rgba(6, 182, 212, 0.4)';
                ctx.font = '9px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(`${el}°`, cx, cy - r + 10);
            });

            const directions = skyViewRef.current ? ['N', 'NW', 'W', 'SW', 'S', 'SE', 'E', 'NE'] : ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
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
                if (isCardinal) {
                    const lx = cx + (radius + 22) * Math.cos(angle);
                    const ly = cy + (radius + 22) * Math.sin(angle);
                    ctx.fillStyle = 'rgba(34, 211, 238, 0.8)';
                    ctx.font = 'bold 10px Inter';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(directions[i], lx, ly);
                }
            }

            // --- 3. ORBIT PATH ---
            if (currentOrbitPath && currentOrbitPath.length > 1) {
                ctx.beginPath();
                let first = true;
                currentOrbitPath.forEach(pt => {
                    if (pt.elevation > 0) {
                        const xy = projectAzElToCartesian(pt.azimuth, pt.elevation, cx, cy, radius, skyViewRef.current);
                        if (first) { ctx.moveTo(xy.x, xy.y); first = false; }
                        else ctx.lineTo(xy.x, xy.y);
                    } else first = true;
                });
                ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)';
                ctx.setLineDash([4, 4]);
                ctx.lineWidth = 1.5;
                ctx.stroke();
                ctx.setLineDash([]);
            }

            // --- 4. SATELLITES ---
            let detectedHover: string | null = null;
            if (currentObjects) {
                currentObjects.forEach(sat => {
                    if (sat.position.elevation < 0) return;
                    const { x, y } = projectAzElToCartesian(sat.position.azimuth, sat.position.elevation, cx, cy, radius, skyViewRef.current);
                    const isSelected = sat.id === currentSelectedSatId;
                    const isISS = sat.name.includes("ISS") || sat.name.includes("STATION");
                    const isHovered = hoverSatId === sat.id;

                    const dist = Math.hypot(x - lastMouseX, y - lastMouseY);
                    if (dist < touchTargetRadius) detectedHover = sat.id;

                    const satAngle = skyViewRef.current ? (270 - sat.position.azimuth) * (Math.PI / 180) : (sat.position.azimuth - 90) * (Math.PI / 180);
                    const sweepAngle = sweepRef.current;
                    let angleDiff = Math.abs(satAngle - sweepAngle);
                    if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
                    if (angleDiff < (1.5 * Math.PI) / 180 && !sweepPulses.has(sat.id)) sweepPulses.set(sat.id, time);

                    let pulseIntensity = 0;
                    if (sweepPulses.has(sat.id)) {
                        const elapsed = time - sweepPulses.get(sat.id)!;
                        if (elapsed < 1000) pulseIntensity = 1 - (elapsed / 1000);
                        else sweepPulses.delete(sat.id);
                    }

                    let size = isISS ? (isMobile ? 6 : 4) : (isMobile ? 5 : 3);
                    let color = isISS ? '#F59E0B' : '#38bdf8';
                    if (!isSelected && pulseIntensity > 0) size += pulseIntensity * 2;
                    if (isSelected) {
                        color = '#fbbf24'; size = 5;
                        const pulse = 10 + Math.sin(time / 200) * 4;
                        ctx.beginPath(); ctx.arc(x, y, pulse, 0, 2 * Math.PI);
                        ctx.strokeStyle = `rgba(251, 191, 36, ${0.4 + Math.sin(time / 200) * 0.2})`; ctx.stroke();
                        ctx.beginPath(); ctx.moveTo(x - 8, y); ctx.lineTo(x - 4, y); ctx.moveTo(x + 8, y); ctx.lineTo(x + 4, y);
                        ctx.moveTo(x, y - 8); ctx.lineTo(x, y - 4); ctx.moveTo(x, y + 8); ctx.lineTo(x, y + 4);
                        ctx.strokeStyle = '#fbbf24'; ctx.stroke();
                    } else if (isHovered) { color = '#FFFFFF'; size = 4; }

                    ctx.beginPath();
                    if (isISS) ctx.rect(x - 4, y - 4, 8, 8); else ctx.arc(x, y, size, 0, 2 * Math.PI);
                    ctx.fillStyle = isISS ? '#ffffff' : color;
                    ctx.shadowBlur = isSelected ? 8 : (isISS ? 10 : 4);
                    ctx.shadowColor = isISS ? 'white' : color;
                    ctx.fill(); ctx.shadowBlur = 0;

                    if (isISS || isSelected || isHovered) {
                        ctx.font = isSelected ? 'bold 11px Inter, monospace' : '9px Inter';
                        ctx.fillStyle = isSelected ? '#fbbf24' : '#ffffff';
                        ctx.textAlign = isSelected ? 'center' : 'left';
                        ctx.textBaseline = isSelected ? 'top' : 'middle';
                        const text = sat.name;
                        const metrics = ctx.measureText(text);
                        const lx = isSelected ? x : x + 10;
                        const ly = isSelected ? y - 22 : y;
                        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
                        ctx.fillRect(lx - (isSelected ? metrics.width / 2 + 3 : 3), ly - (isSelected ? 3 : 7), metrics.width + 6, 14);
                        ctx.fillStyle = isSelected ? '#fbbf24' : '#ffffff';
                        ctx.fillText(text, lx, ly);
                    }
                });
            }

            if (detectedHover !== hoverSatId) {
                hoverSatId = detectedHover;
                canvas.style.cursor = hoverSatId ? 'pointer' : 'default';
            }

            // --- 5. SWEEP ANIMATION ---
            const sweepAngle = sweepRef.current;
            try {
                const gradient = ctx.createConicGradient(sweepAngle, cx, cy);
                gradient.addColorStop(0, 'rgba(6, 182, 212, 0)');
                gradient.addColorStop(0.85, 'rgba(6, 182, 212, 0)');
                gradient.addColorStop(1, 'rgba(6, 182, 212, 0.3)');
                ctx.fillStyle = gradient;
                ctx.beginPath(); ctx.arc(cx, cy, radius, 0, 2 * Math.PI); ctx.fill();
            } catch (e) { }

            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + radius * Math.cos(sweepAngle), cy + radius * Math.sin(sweepAngle));
            ctx.strokeStyle = 'rgba(103, 232, 249, 0.8)';
            ctx.lineWidth = 1.5;
            ctx.shadowColor = 'rgba(6, 182, 212, 1)'; ctx.shadowBlur = 10;
            ctx.stroke(); ctx.shadowBlur = 0;

            animationFrameId = requestAnimationFrame(render);
        };

        animationFrameId = requestAnimationFrame(render);

        return () => {
            cancelAnimationFrame(animationFrameId);
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('click', handleClick);
            canvas.removeEventListener('touchstart', handleTouchStart);
        };
    }, []);

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
