/**
 * Utility for astronomical coordinate conversions.
 */

/**
 * Converts Right Ascension (RA) and Declination (Dec) to horizontal coordinates (Azimuth and Elevation)
 * for a given observer location and time.
 * 
 * @param raDeg - Right Ascension in degrees (0-360)
 * @param decDeg - Declination in degrees (-90 to +90)
 * @param lat - Observer latitude in degrees
 * @param lng - Observer longitude in degrees (East positive)
 * @param date - Current date/time
 * @returns { azimuth, elevation } in degrees
 */
export const raDecToAltAz = (
    raDeg: number,
    decDeg: number,
    lat: number,
    lng: number,
    date: Date = new Date()
) => {
    // 1. Precise Days since J2000.0
    const jd = (date.getTime() / 86400000) + 2440587.5;
    const d = jd - 2451545.0;

    // 2. Precise Greenwich Mean Sidereal Time (GMST) in degrees
    // Using the more accurate formula from Meeus
    const T = d / 36525.0;
    let gmstDeg = 280.46061837 + 360.98564736629 * d + 0.000387933 * T * T - (T * T * T) / 38710000.0;
    gmstDeg = gmstDeg % 360;
    if (gmstDeg < 0) gmstDeg += 360;
    const gmst = gmstDeg / 15; // Convert to hours

    // 3. Local Sidereal Time (LST) in hours
    let lst = gmst + lng / 15;
    while (lst < 0) lst += 24;
    while (lst >= 24) lst -= 24;

    // 4. Hour Angle (HA) in hours
    const raHours = raDeg / 15;
    let ha = lst - raHours;
    while (ha < 0) ha += 24;
    while (ha >= 24) ha -= 24;

    // 5. Convert to Radians for trigonometry
    const haRad = ha * 15 * (Math.PI / 180);
    const decRad = decDeg * (Math.PI / 180);
    const latRad = lat * (Math.PI / 180);

    // 6. Calculate Elevation (Altitude)
    const sinEl = Math.sin(decRad) * Math.sin(latRad) +
        Math.cos(decRad) * Math.cos(latRad) * Math.cos(haRad);
    const elRad = Math.asin(Math.max(-1, Math.min(1, sinEl)));
    let elevation = elRad * (180 / Math.PI);

    // Add Atmospheric Refraction correction (Bennett's formula)
    // Only if above horizon
    if (elevation > 0) {
        const h = elevation;
        const R = 1.02 / Math.tan((h + 10.3 / (h + 5.11)) * (Math.PI / 180));
        elevation = h + R / 60.0; // R is in arcminutes
    }

    // 7. Calculate Azimuth
    const denom = Math.cos(elRad) * Math.cos(latRad);
    let azimuth = 0;

    if (Math.abs(denom) > 1e-6) {
        const cosAz = (Math.sin(decRad) - Math.sin(elRad) * Math.sin(latRad)) / denom;
        let azRad = Math.acos(Math.max(-1, Math.min(1, cosAz)));
        azimuth = azRad * (180 / Math.PI);

        // Correct quadrant based on Hour Angle
        if (Math.sin(haRad) > 0) {
            azimuth = 360 - azimuth;
        }
    }

    return { azimuth, elevation };
};
