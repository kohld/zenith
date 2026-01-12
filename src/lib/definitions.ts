/**
 * Represents the calculated position of a satellite relative to an observer.
 */
export interface SatellitePosition {
    /** Azimuth angle in degrees (0-360, North=0, East=90). */
    azimuth: number;
    /** Elevation angle in degrees (Horizon=0, Zenith=90). */
    elevation: number;
    /** Distance from observer to satellite in kilometers. */
    range: number;
    /** Altitude above Earth's surface in kilometers. */
    height: number;
    /** Geographic latitude of the satellite's ground track in degrees. */
    latitude: number;
    /** Geographic longitude of the satellite's ground track in degrees. */
    longitude: number;
    /** Orbital velocity in km/s. */
    velocity: number;
    /** Optional timestamp for path history/pruning. */
    time?: Date;
}

/**
 * Raw satellite data parsed from TLE source.
 */
export interface SatelliteData {
    /** Unique NORAD Catalog Number (e.g., "25544" for ISS). */
    id: string;
    /** Common name of the satellite (e.g., "ISS (ZARYA)"). */
    name: string;
    /** Inferred object type (e.g., "Space Station", "Weather"). */
    type: string;
    /** First line of TLE set. */
    line1: string;
    /** Second line of TLE set. */
    line2: string;
}

/**
 * An object ready to be rendered on the SkyCanvas.
 * Combines identity metadata with calculated real-time position.
 */
export interface VisualObject {
    /** Name to display on the chart. */
    name: string;
    /** Unique NORAD ID for selection tracking. */
    id: string;
    /** Classification for filtering or coloring. */
    type: string;
    /** Real-time calculated coordinates. */
    position: SatellitePosition;
}

/**
 * Geographic location of the ground observer.
 */
export interface ObserverLocation {
    /** Display name (City, Custom Name). */
    name: string;
    /** Latitude in degrees. */
    lat: number;
    /** Longitude in degrees. */
    lng: number;
}

/**
 * Geocoding search result from OpenStreetMap/Nominatim.
 */
export interface SearchResult {
    /** Unique OpenStreetMap place ID. */
    place_id: number;
    /** Latitude string (needs parsing). */
    lat: string;
    /** Longitude string (needs parsing). */
    lon: string;
    /** Full formatted address string. */
    display_name: string;
}
