
import { KpEntry } from '../src/lib/definitions';
import { writeFile } from 'fs/promises';
import { resolve } from 'path';

// NOAA Planetary K-index Forecast
const API_URL = "https://services.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json";
const OUT_FILE = resolve(process.cwd(), 'public/data/aurora.json');

async function fetchAurora() {
    console.log(`🌌 Fetching aurora forecast from ${API_URL}...`);

    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const rawData: any[][] = await response.json();

        // Skip header row
        const rows = rawData.slice(1);

        const forecast: KpEntry[] = rows.map(row => ({
            time: row[0],
            kp: parseFloat(row[1]),
            status: row[2] as 'observed' | 'estimated' | 'predicted',
            scale: row[3] || null
        }));

        console.log(`✅ Received ${forecast.length} forecast data points.`);

        const outputData = {
            updatedAt: new Date().toISOString(),
            forecast
        };

        await writeFile(OUT_FILE, JSON.stringify(outputData, null, 2));
        console.log(`💾 Saved to ${OUT_FILE}`);

    } catch (error) {
        console.error("❌ Failed to fetch/save aurora data:", error);
        process.exit(1);
    }
}

fetchAurora();
