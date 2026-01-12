/**
 * Converts Azimuth and Elevation (Polar coordinates relative to observer) 
 * into Cartesian X/Y coordinates for drawing on a 2D canvas (Sky Plot).
 * 
 * Projection logic: Linear mapping where Zenith (90° El) is center, and Horizon (0° El) is at radius.
 * 
 * @param azimuth - Azimuth in degrees (0-360).
 * @param elevation - Elevation in degrees (0-90).
 * @param centerX - The X coordinate of the circle's center.
 * @param centerY - The Y coordinate of the circle's center.
 * @param radius - The radius of the sky chart (distance from center to horizon).
 *
 * @returns {x, y} - Screen coordinates.
 */
export const projectAzElToCartesian = (
    azimuth: number,
    elevation: number,
    centerX: number,
    centerY: number,
    radius: number
): { x: number, y: number } => {
    // 1. Calculate radial distance from center (90° = 0 distance, 0° = radius distance)
    const r = radius * (1 - elevation / 90);

    // 2. Convert Azimuth to math angle (0° Azimuth = North/Up = -90° in math radians)
    // Math 0 is usually East. We want North (Up) to be -PI/2.
    // However, in the canvas code we saw: angle = (az - 90) * (Math.PI / 180).
    const angleRad = (azimuth - 90) * (Math.PI / 180);

    return {
        x: centerX + r * Math.cos(angleRad),
        y: centerY + r * Math.sin(angleRad)
    };
};
