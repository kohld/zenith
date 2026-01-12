import { write } from "bun";
import { fetchDSNStatus } from "../src/api/dsn";

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
    { name: "Parker Solar Probe", id: "-96", missionType: "Heliophysics" }, // Solar Orbit
];

import { SpacecraftData } from "../src/lib/definitions";

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
    // QUANTITIES: '1,20' 
    // 1 = Astrometric RA & DEC (ICRF) 
    // 20 = Range & Range-rate
    const params = new URLSearchParams({
        format: "text",
        COMMAND: `'${spacecraft.id}'`,
        OBJ_DATA: "'NO'",
        MAKE_EPHEM: "'YES'",
        EPHEM_TYPE: "'OBSERVER'",
        CENTER: "'500@399'", // Earth (Geocentric)
        START_TIME: `'${getToday()}'`,
        STOP_TIME: `'${getTomorrow()}'`,
        STEP_SIZE: "'1d'",
        QUANTITIES: "'1,20'",
        CSV_FORMAT: "'YES'"
    });

    try {
        const response = await fetch(`${API_URL}?${params.toString()}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const text = await response.text();

        // Parse CSV Output
        const soeIndex = text.indexOf("$$SOE");
        const eoeIndex = text.indexOf("$$EOE");

        if (soeIndex === -1 || eoeIndex === -1) {
            console.error(`❌ Bad data format for ${spacecraft.name}`);
            return null;
        }

        const dataBlock = text.substring(soeIndex + 5, eoeIndex).trim();
        // Standard Columns for Q=1,20:
        // Date__(UT)__HR:MN, R.A._(ICRF), DEC_(ICRF), Range, Range-rate

        // Example Line:
        // 2025-01-12 00:00, 290.12345, -12.34567, 1.5E+9, 12.34

        const lines = dataBlock.split('\n');
        const firstLine = lines[0];
        const parts = firstLine.split(',').map(p => p.trim());

        // Helper to parse Sexagesimal to Decimal
        // RA: "HH MM SS.SS" -> Degrees (x15)
        // DEC: "DD MM SS.SS" -> Degrees
        const parseCoordinate = (str: string, isRA: boolean) => {
            if (!str) return 0;
            const parts = str.trim().split(' ').map(parseFloat);
            if (parts.length < 3) return parseFloat(str) || 0; // Fallback if already decimal

            let val = Math.abs(parts[0]) + parts[1] / 60 + parts[2] / 3600;
            if (parts[0] < 0 || str.trim().startsWith('-')) val *= -1;

            return isRA ? val * 15 : val;
        };

        // CSV Indices for Q=1,20:
        // [0]=Date, [1]=Empty, [2]=Empty, [3]=RA(HMS), [4]=DEC(DMS), [5]=Range(AU), [6]=Rate
        const raRaw = parts[3];
        const decRaw = parts[4];
        const rangeRaw = parts[5];
        const rateRaw = parts[6];

        const ra = parseCoordinate(raRaw, true);
        const dec = parseCoordinate(decRaw, false);
        const rangeAU = parseFloat(rangeRaw);
        const velocity = parseFloat(rateRaw);

        // 1 AU = 149,597,870.7 km
        const AU_IN_KM = 149597870.7;
        const distanceKm = rangeAU * AU_IN_KM;

        console.log(`✅ ${spacecraft.name}: ${distanceKm.toLocaleString()} km | RA: ${ra}° DEC: ${dec}°`);

        return {
            name: spacecraft.name,
            id: spacecraft.id,
            distanceKm: distanceKm,
            velocityKmS: velocity,
            missionType: spacecraft.missionType,
            ra,
            dec,
            date: new Date().toISOString()
        };

    } catch (e) {
        console.error(`❌ Failed fetching ${spacecraft.name}:`, e);
        return null;
    }
}

// Main execution
async function main() {
    console.log("🚀 Starting Deep Space Network Data Fetch...");

    const dsnStatus = await fetchDSNStatus();
    const results: SpacecraftData[] = [];

    for (const spacecraft of SPACECRAFT) {
        const data = await fetchSpacecraftData(spacecraft);
        if (data) {
            // Apply DSN status if available
            if (dsnStatus.has(spacecraft.id)) {
                data.status = dsnStatus.get(spacecraft.id);
            } else {
                data.status = "AWAITING SIGNAL"; // Default when not currently talking to DSN
            }
            results.push(data);
        }
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
