
import { Launch } from '../src/lib/definitions';
import { writeFile } from 'fs/promises';
import { resolve } from 'path';

// Space Devs API Endpoint
const API_URL = "https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=150&mode=detailed";
const OUT_FILE = resolve(process.cwd(), 'public/data/launches.json');

async function fetchLaunches() {
    console.log(`🚀 Fetching upcoming launches from ${API_URL}...`);

    try {
        const response = await fetch(API_URL, {
            headers: {
                'User-Agent': 'Zenith-Mirror/1.0 (github.com/kohld/zenith)'
            }
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const launches: Launch[] = data.results;

        console.log(`✅ Received ${launches.length} launches.`);

        // Basic validation/structure check (optional, but good for logs)
        launches.forEach((l, i) => {
            console.log(`   ${i + 1}. [${l.net}] ${l.name} (${l.rocket.configuration.name})`);
        });

        const outputData = {
            updatedAt: new Date().toISOString(),
            launches
        };

        await writeFile(OUT_FILE, JSON.stringify(outputData, null, 2));
        console.log(`💾 Saved to ${OUT_FILE}`);

    } catch (error) {
        console.error("❌ Failed to fetch/save launches:", error);
        process.exit(1);
    }
}

fetchLaunches();
