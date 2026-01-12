import { write, file } from "bun";

// Configuration for NASA JPL Horizons API
const API_URL = "https://ssd.jpl.nasa.gov/api/horizons.api";
const OUTPUT_FILE = "./public/data/spacecraft.json";

// Deep Space Objects to track
// ID format: Negative numbers are usually spacecraft in Horizons
const SPACECRAFT = [
    { name: "Voyager 1", id: "-31", missionType: "Interstellar Probe" },
    { name: "Voyager 2", id: "-32", missionType: "Interstellar Probe" },
    { name: "New Horizons", id: "-98", missionType: "Pluto/Kuiper Belt" },
    { name: "James Webb", id: "-170", missionType: "Space Telescope" }, // L2 Halo Orbit
];

interface SpacecraftData {
    name: string;
    id: string;
    distanceKm: number; // Distance from Earth
    velocityKmS: number; // Relative velocity to Earth
    missionType: string;
    date: string;
}

// Helper to format date as YYYY-MM-DD for API
const getToday = () => new Date().toISOString().split('T')[0];
const getTomorrow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
};

async function fetchSpacecraftData(spacecraft: typeof SPACECRAFT[0]): Promise<SpacecraftData | null> {
    console.log(`📡 Contacting NASA JPL for ${spacecraft.name} (ID: ${spacecraft.id})...`);

    // Construct params for Ephemeris query
    // COMMAND: Object ID
    // CENTER: '500@399' (Earth center)
    // MAKE_EPHEM: 'YES'
    // EPHEM_TYPE: 'VECTORS' (state vectors) or 'OBSERVER' (observer variables). 
    // OBSERVER is easier for "distance" (range).
    // QUANTITIES: '20' (Range and Range-rate)

    // Using OBSERVER mode with QUANTITIES='20' to get range (delta) in AU or KM
    const params = new URLSearchParams({
        format: "text",
        COMMAND: `'${spacecraft.id}'`,
        OBJ_DATA: "'NO'", // Don't need object physical data
        MAKE_EPHEM: "'YES'",
        EPHEM_TYPE: "'OBSERVER'",
        CENTER: "'500@399'", // Earth (Geocentric)
        START_TIME: `'${getToday()}'`,
        STOP_TIME: `'${getTomorrow()}'`,
        STEP_SIZE: "'1d'",
        QUANTITIES: "'20'", // 20 = Range (distance) & Range-rate (velocity)
        CSV_FORMAT: "'YES'"
    });

    try {
        const response = await fetch(`${API_URL}?${params.toString()}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const text = await response.text();

        // Parse CSV Output
        // Horizons CSV is usually between $$SOE and $$EOE markers
        const soeIndex = text.indexOf("$$SOE");
        const eoeIndex = text.indexOf("$$EOE");

        if (soeIndex === -1 || eoeIndex === -1) {
            console.error(`❌ Bad data format for ${spacecraft.name}`);
            return null;
        }

        const dataBlock = text.substring(soeIndex + 5, eoeIndex).trim();
        // Example Line: 2025-01-01 00:00, 1.632E+11, 2.345E+01
        // CSV columns depend on QUANTITIES. 
        // For Q=20 (Observer Range), standard CSV output is: Date, Range (AU), Range-rate (km/s)
        // Wait, default units for range are usually AU. We check headers or assume AU.
        // Let's verify via 'RANGE_UNITS' param or usually it defaults to AU.

        const lines = dataBlock.split('\n');
        const firstLine = lines[0];
        const parts = firstLine.split(',');

        // CSV Structure for QUANTITIES='20': Date, [empty], [empty], Range(AU), Velocity(km/s)
        const rangeAU = parseFloat(parts[3]);
        const velocity = parseFloat(parts[4]);

        // 1 AU = 149,597,870.7 km
        const AU_IN_KM = 149597870.7;
        const distanceKm = rangeAU * AU_IN_KM;

        console.log(`✅ ${spacecraft.name}: ${distanceKm.toLocaleString()} km`);

        return {
            name: spacecraft.name,
            id: spacecraft.id,
            distanceKm: distanceKm,
            velocityKmS: velocity,
            missionType: spacecraft.missionType,
            date: new Date().toISOString()
        };

    } catch (e) {
        console.error(`❌ Failed fetching ${spacecraft.name}:`, e);
        return null;
    }
}

async function main() {
    console.log("🚀 Starting Deep Space Network Data Fetch...");

    const results: SpacecraftData[] = [];

    for (const spacecraft of SPACECRAFT) {
        const data = await fetchSpacecraftData(spacecraft);
        if (data) results.push(data);
        // Be nice to NASA API
        await new Promise(r => setTimeout(r, 500));
    }

    if (results.length > 0) {
        await write(OUTPUT_FILE, JSON.stringify(results, null, 2));
        console.log(`\n✨ Successfully wrote ${results.length} spacecraft to ${OUTPUT_FILE}`);
    } else {
        console.error("\n⚠️ No data collected!");
        process.exit(1);
    }
}

main();
