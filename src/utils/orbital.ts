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
    if (!positionAndVelocity || !positionAndVelocity.position) {
        return null;
    }

    const positionEci = positionAndVelocity.position;

    if (typeof positionEci !== 'object') {
        return null;
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
        longitude: radiansToDegrees(positionGd.longitude)
    };
};

export interface SatelliteData {
    name: string;
    line1: string;
    line2: string;
}

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
                satellites.push({
                    name: lines[i],
                    line1: lines[i + 1],
                    line2: lines[i + 2]
                });
            }
        }
        return satellites;
    } catch (e) {
        console.error("Error fetching TLEs:", e);
        return [];
    }
};
