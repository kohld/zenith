/**
 * Physical constants and calculations for Deep Space communications.
 */

/** Speed of light in kilometers per second */
export const SPEED_OF_LIGHT_KM_S = 299792.458;

/**
 * Calculate One-Way Light Time (OWLT) and Round-Trip Light Time (RTLT)
 * for a given distance from Earth.
 * 
 * @param distanceKm - Distance from Earth in kilometers
 *
 * @returns Object containing OWLT and RTLT in seconds
 */
export const calculateSignalTime = (distanceKm: number) => {
    const oneWaySeconds = distanceKm / SPEED_OF_LIGHT_KM_S;
    const roundTripSeconds = oneWaySeconds * 2;

    return {
        oneWay: oneWaySeconds,
        roundTrip: roundTripSeconds
    };
};

/**
 * Format duration in seconds to human-readable "Xh Ym Zs" format.
 * 
 * @param totalSeconds - Duration in seconds
 *
 * @returns Formatted string like "22h 40m 12s"
 */
export const formatDuration = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${hours}h ${minutes}m ${seconds}s`;
};
