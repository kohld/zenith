import { SatelliteData } from '../lib/definitions';

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
                    const line1 = lines[i + 1];
                    const line2 = lines[i + 2];
                    const id = line2.length >= 7 ? line2.substring(2, 7).trim() : '00000';
                    const name = lines[i];

                    // Parse COSPAR designation from TLE line 1 (columns 10-17, 1-indexed)
                    // Example: "1 25544U 98067A   ..." -> "1998-067-A"
                    let cospar: string | undefined;
                    if (line1.length >= 17) {
                        const cosparRaw = line1.substring(9, 17).trim(); // 0-indexed: 9-16
                        if (cosparRaw.length >= 5) {
                            // Format: "98067A" -> "1998-067-A"
                            const year = cosparRaw.substring(0, 2);
                            const launch = cosparRaw.substring(2, 5);
                            const piece = cosparRaw.substring(5);
                            const fullYear = parseInt(year) < 57 ? `20${year}` : `19${year}`; // Y2K pivot
                            cospar = `${fullYear}-${launch}${piece ? `-${piece}` : ''}`;
                        }
                    }

                    // Deduplicate
                    if (!satMap.has(id)) {
                        satMap.set(id, {
                            id: id,
                            name: name,
                            type: getSatelliteType(name),
                            line1: line1,
                            line2: line2,
                            cospar: cospar
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
