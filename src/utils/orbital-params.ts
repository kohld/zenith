import { twoline2satrec } from 'satellite.js';

/**
 * Orbital parameters extracted from TLE data.
 */
export interface OrbitalParams {
    /** Perigee altitude in kilometers (lowest point of orbit). */
    perigee: number;
    /** Apogee altitude in kilometers (highest point of orbit). */
    apogee: number;
    /** Orbital inclination in degrees. */
    inclination: number;
}

/**
 * Extracts orbital parameters from TLE data using satellite.js.
 * 
 * @param line1 - First line of TLE set.
 * @param line2 - Second line of TLE set.
 * @returns Orbital parameters or null if parsing fails.
 */
export const getOrbitalParams = (line1: string, line2: string): OrbitalParams | null => {
    try {
        const satrec = twoline2satrec(line1, line2);
        if (!satrec) return null;

        // Constants
        const EARTH_RADIUS_KM = 6371.0; // Mean Earth radius in km
        const MU = 398600.4418; // Earth's gravitational parameter (km³/s²)

        // Extract from satrec
        // satrec.no = mean motion (radians/minute)
        // satrec.ecco = eccentricity
        // satrec.inclo = inclination (radians)

        const meanMotionRadPerMin = satrec.no;
        const eccentricity = satrec.ecco;
        const inclinationRad = satrec.inclo;

        // Convert mean motion to radians/second
        const meanMotionRadPerSec = meanMotionRadPerMin / 60;

        // Calculate semi-major axis (a) from mean motion
        // n = sqrt(μ / a³) => a = (μ / n²)^(1/3)
        const semiMajorAxis = Math.pow(MU / (meanMotionRadPerSec * meanMotionRadPerSec), 1 / 3);

        // Calculate perigee and apogee distances from Earth's center
        const perigeeDistance = semiMajorAxis * (1 - eccentricity);
        const apogeeDistance = semiMajorAxis * (1 + eccentricity);

        // Convert to altitude above Earth's surface
        const perigee = perigeeDistance - EARTH_RADIUS_KM;
        const apogee = apogeeDistance - EARTH_RADIUS_KM;

        // Convert inclination to degrees
        const inclination = inclinationRad * (180 / Math.PI);

        return {
            perigee: Math.max(0, perigee), // Ensure non-negative
            apogee: Math.max(0, apogee),
            inclination
        };
    } catch (e) {
        console.warn('Failed to extract orbital parameters:', e);
        return null;
    }
};
