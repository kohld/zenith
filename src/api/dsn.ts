
/**
 * API interface for NASA Deep Space Network (DSN) data.
 * Source: https://eyes.nasa.gov/dsn/data/dsn.xml
 */

import { DSNTarget } from '../lib/definitions';

/**
 * Fetches real-time status from DSN XML feed.
 * 
 * Note: This endpoint often has CORS restrictions in browsers,
 * so it is primarily used by the build script (fetch-spacecraft.ts).
 */
export const fetchDSNStatus = async (): Promise<Map<string, DSNTarget>> => {
    const statusMap = new Map<string, DSNTarget>();
    try {
        console.log("📡 Fetching real-time DSN status...");
        const response = await fetch("https://eyes.nasa.gov/dsn/data/dsn.xml");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const xmlText = await response.text();

        // Define mapping from Horizons ID to DSN Name
        const signals = [
            { id: "-31", dsnName: "VGR1" },
            { id: "-32", dsnName: "VGR2" },
            { id: "-98", dsnName: "NHPC" },
            { id: "-170", dsnName: "JWST" },
            { id: "-96", dsnName: "PSP" }
        ];

        for (const sig of signals) {
            // Regex to extract DownSignal attributes
            // <downSignal ... spacecraft="VGR1" ... dataRate="160.0" ... power="-155.0" ... frequency="8415000000" ... active="true" />
            // Note: Regex is brittle but sufficient for this specific XML schema if simple
            // We look for a <downSignal ...> tag containing spacecraft="NAME" and then extract attributes

            // Matches the whole tag for this spacecraft
            const downSignalRegex = new RegExp(`<downSignal[^>]*?spacecraft="${sig.dsnName}"[^>]*?>`, 'i');
            const match = xmlText.match(downSignalRegex);

            let dsnData: DSNTarget = {
                id: sig.id,
                name: sig.dsnName,
                upSignal: false,
                downSignal: false,
                dataRate: 0,
                power: 0,
                frequency: 0
            };

            if (match) {
                const tag = match[0];

                // Parse attributes
                const active = /active="true"/i.test(tag);
                if (active) {
                    dsnData.downSignal = true;

                    const drMatch = tag.match(/dataRate="([\d.-]+)"/);
                    if (drMatch) dsnData.dataRate = parseFloat(drMatch[1]);

                    const pwrMatch = tag.match(/power="([\d.-]+)"/);
                    if (pwrMatch) dsnData.power = parseFloat(pwrMatch[1]);

                    const freqMatch = tag.match(/frequency="([\d.-]+)"/);
                    if (freqMatch) dsnData.frequency = parseFloat(freqMatch[1]);
                }
            }

            // Check Uplink too
            const upSignalRegex = new RegExp(`<upSignal[^>]*?spacecraft="${sig.dsnName}"[^>]*?active="true"`, 'i');
            if (upSignalRegex.test(xmlText)) {
                dsnData.upSignal = true;
            }

            // Only add if there is some activity or at least parsed structure
            if (dsnData.downSignal || dsnData.upSignal) {
                statusMap.set(sig.id, dsnData);
            }
        }
    } catch (e) {
        console.warn("⚠️ Failed to fetch DSN status, using defaults:", e);
    }
    return statusMap;
};
