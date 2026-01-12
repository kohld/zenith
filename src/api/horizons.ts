/**
 * API interface for NASA JPL Horizons data.
 * 
 * Since we pre-fetch spacecraft data via GitHub Actions (scripts/fetch-spacecraft.ts),
 * this module provides a typed wrapper around the static JSON file.
 */

import { SpacecraftData } from '../lib/definitions';

/**
 * Fetch Deep Space spacecraft data from the local mirror.
 * 
 * Data is updated every 6 hours via GitHub Actions.
 * 
 * @returns Promise resolving to array of spacecraft with distances and velocities
 *
 * @throws Error if fetch fails or data is invalid
 */
export const fetchSpacecraftData = async (): Promise<SpacecraftData[]> => {
    const response = await fetch(`${import.meta.env.BASE_URL}data/spacecraft.json?t=${Date.now()}`);

    if (!response.ok) {
        throw new Error(`Failed to load spacecraft data: ${response.statusText}`);
    }

    const data: SpacecraftData[] = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
        throw new Error('Invalid spacecraft data format');
    }

    return data;
};
