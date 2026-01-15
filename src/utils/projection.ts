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
    radius: number,
    skyView: boolean = false
): { x: number, y: number } => {
    // 1. Calculate radial distance from center (90° = 0 distance, 0° = radius distance)
    const r = radius * (1 - elevation / 90);

    // 2. Convert Azimuth to math angle
    // Map View: 0° Azimuth = North/Up = -90° (270°) in math radians. East is 0° (Right).
    // Sky View: Mirrored. North is still Up, but West is Right (0°) and East is Left (180°).
    const angleRad = skyView
        ? (270 - azimuth) * (Math.PI / 180)
        : (azimuth - 90) * (Math.PI / 180);

    return {
        x: centerX + r * Math.cos(angleRad),
        y: centerY + r * Math.sin(angleRad)
    };
};
