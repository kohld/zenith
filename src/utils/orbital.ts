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
import { SatellitePosition } from '../lib/definitions';

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


// End of Physics/Math Logic
