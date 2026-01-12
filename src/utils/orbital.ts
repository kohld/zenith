import {
    twoline2satrec,
    propagate,
    gstime,
    eciToGeodetic,
    eciToEcf,
    ecfToLookAngles,
    degreesToRadians,
    radiansToDegrees
} from 'satellite.js';
import { SatellitePosition, SatelliteData } from '../lib/definitions';

/**
 * Calculates the current geodetic position and look angles for a satellite relative to an observer.
 * 
 * @param tle1 - The first line of the TLE (Two-Line Element) set.
 * @param tle2 - The second line of the TLE set.
 * @param date - The date/time for which to calculate the position.
 * @param observerLat - The observer's latitude in degrees.
 * @param observerLng - The observer's longitude in degrees.
 *
 * @returns A generic SatellitePosition object, or null if propagation fails.
 */
export const getSatPosition = (
    tle1: string,
    tle2: string,
    date: Date,
    observerLat: number,
    observerLng: number
): SatellitePosition | null => {
    const satrec = twoline2satrec(tle1, tle2);
    if (!satrec) return null; // Safety check

    const positionAndVelocity = propagate(satrec, date);
    if (!positionAndVelocity || !positionAndVelocity.position || typeof positionAndVelocity.position !== 'object') {
        return null;
    }

    const positionEci = positionAndVelocity.position;
    const velocityEci = positionAndVelocity.velocity;

    // Calculate velocity magnitude (km/s)
    let velocity = 0;
    if (velocityEci && typeof velocityEci === 'object' && 'x' in velocityEci) {
        const v = velocityEci as { x: number, y: number, z: number };
        velocity = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    }

    const gmst = gstime(date);

    // Geodetic coordinates (lat, lng, height)
    // Casting to any because satellite.js types can be tricky with ECI/Vector3D structures
    const positionGd = eciToGeodetic(positionEci as any, gmst);

    const observerGd = {
        latitude: degreesToRadians(observerLat),
        longitude: degreesToRadians(observerLng),
        height: 0
    };

    const positionEcf = eciToEcf(positionEci as any, gmst);
    const lookAngles = ecfToLookAngles(observerGd, positionEcf);

    return {
        azimuth: radiansToDegrees(lookAngles.azimuth),
        elevation: radiansToDegrees(lookAngles.elevation),
        range: lookAngles.rangeSat,
        height: positionGd.height,
        latitude: radiansToDegrees(positionGd.latitude),
        longitude: radiansToDegrees(positionGd.longitude),
        velocity: velocity
    };
};

/**
 * Generates a series of future positions for a satellite to visualize its predicted path.
 * 
 * @param tle1 - The first line of the TLE set.
 * @param tle2 - The second line of the TLE set.
 * @param startTime - The starting time for the path calculation.
 * @param durationMinutes - How many minutes into the future to calculate (e.g., 90 for one orbit).
 * @param observerLat - The observer's latitude.
 * @param observerLng - The observer's longitude.
 * @param stepMinutes - The interval between calculate points (default: 1 minute).
 *
 * @returns Array of SatellitePosition objects representing the path.
 */
export const getSatellitePath = (
    tle1: string,
    tle2: string,
    startTime: Date,
    durationMinutes: number,
    observerLat: number,
    observerLng: number,
    stepMinutes: number = 1
): SatellitePosition[] => {
    const satrec = twoline2satrec(tle1, tle2);
    if (!satrec) return [];

    const path: SatellitePosition[] = [];

    for (let i = 0; i <= durationMinutes; i += stepMinutes) {
        const date = new Date(startTime.getTime() + i * 60000);

        const positionAndVelocity = propagate(satrec, date);
        if (!positionAndVelocity || !positionAndVelocity.position || typeof positionAndVelocity.position !== 'object') continue;

        const positionEci = positionAndVelocity.position;
        const gmst = gstime(date);

        try {
            const positionGd = eciToGeodetic(positionEci as any, gmst);
            const observerGd = {
                latitude: degreesToRadians(observerLat),
                longitude: degreesToRadians(observerLng),
                height: 0
            };
            const positionEcf = eciToEcf(positionEci as any, gmst);
            const lookAngles = ecfToLookAngles(observerGd, positionEcf);

            path.push({
                azimuth: radiansToDegrees(lookAngles.azimuth),
                elevation: radiansToDegrees(lookAngles.elevation),
                range: lookAngles.rangeSat,
                height: positionGd.height,
                latitude: radiansToDegrees(positionGd.latitude),
                longitude: radiansToDegrees(positionGd.longitude),
                velocity: 0, // Velocity not strictly needed for path visualization
                time: date // Store time for path pruning
            });
        } catch (e) {
            continue;
        }
    }
    return path;
};


/**
 * Infers the satellite type based on common naming patterns in the TLE name.
 * 
 * @param name - The satellite name (e.g., "STARLINK-123", "ISS (ZARYA)").
 *
 * @returns A classified string like "Space Station", "Communication", or "Satellite".
 */
const getSatelliteType = (name: string): string => {
    const n = name.toUpperCase();
    if (n.includes('ISS') || n.includes('ZARYA') || n.includes('CSS') || n.includes('TIANGONG')) return 'Space Station';
    if (n.includes('STARLINK')) return 'Communication';
    if (n.includes('HST') || n.includes('TELESCOPE')) return 'Space Telescope';
    if (n.includes('ONEWEB')) return 'Communication';
    if (n.includes('IRIDIUM')) return 'Communication';
    if (n.includes('GPS') || n.includes('GLONASS') || n.includes('GALILEO') || n.includes('BEIDOU')) return 'Navigation';
    if (n.includes('GOES') || n.includes('METEOSAT') || n.includes('HIMAWARI')) return 'Weather';
    if (n.includes('R/B') || n.includes('ROCKET')) return 'Rocket Body';
    if (n.includes('DEB')) return 'Debris';
    return 'Satellite';
};

/**
 * Fetches Two-Line Element (TLE) data from configured sources with fallback logic.
 * 
 * Strategy:
 * 1. Try Local Mirror (`/data/tles.txt`) - Populated by GitHub Actions (prevents rate limits).
 * 2. Fallback to ARISS (`live.ariss.org`) - Ensures at least ISS is visible if mirror fails.
 * 
 * @returns Object containing parsed satellite data and source metadata.
 */
export const fetchTLEs = async (): Promise<{ data: SatelliteData[], source: 'mirror' | 'fallback' | 'error' }> => {
    const satMap = new Map<string, SatelliteData>();

    // Priority: Local Mirror (updated by GitHub Actions), Fallback: ARISS
    // We use import.meta.env.BASE_URL to ensure this works even if the app is served from a subdirectory (like /zenith/)
    const sources = [
        { url: `${import.meta.env.BASE_URL}data/tles.txt`, type: 'mirror' },
        { url: 'https://live.ariss.org/iss.txt', type: 'fallback' }
    ];

    console.log("Fetching TLEs from local mirror...");

    let usedSource: 'mirror' | 'fallback' | 'error' = 'error';

    for (const source of sources) {
        try {
            const res = await fetch(source.url);
            if (!res.ok) {
                console.warn(`Failed to fetch ${source.url}: ${res.status}`);
                continue;
            }
            const text = await res.text();

            // Should contain lines, ignore HTML errors or empty responses
            if (!text || text.trim().length === 0 || text.includes('<!DOCTYPE')) {
                console.warn(`Invalid TLE content from ${source.url}`);
                continue;
            }

            const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

            let loadedCount = 0;
            for (let i = 0; i < lines.length; i += 3) {
                if (lines[i] && lines[i + 1] && lines[i + 2]) {
                    const line2 = lines[i + 2];
                    const id = line2.length >= 7 ? line2.substring(2, 7).trim() : '00000';
                    const name = lines[i];

                    // Deduplicate
                    if (!satMap.has(id)) {
                        satMap.set(id, {
                            id: id,
                            name: name,
                            type: getSatelliteType(name),
                            line1: lines[i + 1],
                            line2: line2
                        });
                        loadedCount++;
                    }
                }
            }
            console.log(`Fetched ${loadedCount} satellites from ${source.url}`);

            // If we successfully loaded data from the primary mirror, we can stop.
            if (satMap.size > 0) {
                usedSource = source.type as 'mirror' | 'fallback';
                if (usedSource === 'mirror') break;
            }

        } catch (e) {
            console.warn(`Error fetching ${source.url}:`, e);
        }
    }

    const results = Array.from(satMap.values());
    console.log(`Total satellites loaded: ${results.length} (Source: ${usedSource})`);
    return { data: results, source: usedSource };
};
