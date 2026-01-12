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

export interface SatellitePosition {
    azimuth: number;   // Degrees
    elevation: number; // Degrees
    range: number;     // km
    height: number;    // km
    latitude: number;  // Degrees
    longitude: number; // Degrees
    velocity: number;  // km/s
    time?: Date;       // Timestamp for path pruning
}

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

// Calculate orbital path for the next `durationMinutes`
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

export interface SatelliteData {
    id: string;
    name: string;
    type: string; // Add type
    line1: string;
    line2: string;
}

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

export const fetchTLEs = async (): Promise<SatelliteData[]> => {
    try {
        // 100 brightest satellites
        const response = await fetch('https://celestrak.org/NORAD/elements/gp.php?GROUP=visual&FORMAT=tle');
        if (!response.ok) throw new Error('Failed to fetch TLEs');
        const text = await response.text();
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const satellites: SatelliteData[] = [];

        for (let i = 0; i < lines.length; i += 3) {
            if (lines[i] && lines[i + 1] && lines[i + 2]) {
                const line2 = lines[i + 2];
                const id = line2.length >= 7 ? line2.substring(2, 7).trim() : '00000';
                const name = lines[i];

                satellites.push({
                    id: id,
                    name: name,
                    type: getSatelliteType(name),
                    line1: lines[i + 1],
                    line2: line2
                });
            }
        }
        return satellites;
    } catch (e) {
        console.error("Error fetching TLEs:", e);
        return [];
    }
};
