
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
export const fetchDSNStatus = async (): Promise<Map<string, string>> => {
    const statusMap = new Map<string, string>();
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
            // Check for DOWN active="true"
            // <downSignal active="true" ... spacecraft="VGR1" ... />
            const rxDown = new RegExp(`downSignal\\s+active="true"[^>]*spacecraft="${sig.dsnName}"`, 'i');

            // Check for UP active="true"
            // <upSignal active="true" ... spacecraft="VGR1" ... />
            const rxUp = new RegExp(`upSignal\\s+active="true"[^>]*spacecraft="${sig.dsnName}"`, 'i');

            const isDown = rxDown.test(xmlText);
            const isUp = rxUp.test(xmlText);

            if (isDown && isUp) {
                statusMap.set(sig.id, "2-WAY CONTACT");
            } else if (isDown) {
                statusMap.set(sig.id, "DOWNLINK ACTIVE");
            } else if (isUp) {
                statusMap.set(sig.id, "UPLINK ACTIVE");
            }
        }
    } catch (e) {
        console.warn("⚠️ Failed to fetch DSN status, using defaults:", e);
    }
    return statusMap;
};
