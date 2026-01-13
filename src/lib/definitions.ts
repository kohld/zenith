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
    /** COSPAR designation (International Designator, e.g., "1998-067-A"). */
    cospar?: string;
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
    /** Detailed address components (if requested). */
    address?: {
        house_number?: string;
        road?: string;
        city?: string;
        town?: string;
        village?: string;
        country_code?: string;
        [key: string]: string | undefined;
    };
}

/**
 * Deep Space spacecraft data from NASA JPL Horizons.
 */
export interface SpacecraftData {
    /** Spacecraft name (e.g., "Voyager 1"). */
    name: string;
    /** NASA Horizons ID (e.g., "-31"). */
    id: string;
    /** Distance from Earth in kilometers. */
    distanceKm: number;
    /** Velocity relative to Sun in km/s. */
    velocityKmS: number;
    /** Mission type / Description (e.g. "Interstellar Probe"). */
    missionType: string;
    /** Right Ascension in degrees (0-360). */
    ra?: number;
    /** Declination in degrees (+/- 90). */
    dec?: number;
    /** Timestamp when data was fetched. */
    date: string;
    /** Current mission status (e.g. "Active", "Hibernate"). */
    status?: string;
    /** Real-time DSN signal data (Power, Data Rate) if available. */
    dsnSignal?: DSNTarget;
}

/**
 * DSN Target status from NASA Eyes XML.
 */
export interface DSNTarget {
    name: string; // e.g. "VGR1"
    id: string;   // e.g. "31"
    upSignal: boolean;
    downSignal: boolean;
    dataRate: number; // b/s
    frequency: number; // Hz
    power: number; // dBm
}

export const SPACECRAFT_SPECS: Record<string, {
    power: string;
    antenna: string;
    type: string;
    missionUrl?: string;
    instruments: Array<{ id: string, name: string, status: 'ON' | 'OFF' | 'STANDBY' }>
}> = {
    // Voyager 1
    '-31': {
        power: 'RTG (Plutonium-238)',
        antenna: '3.7m High-Gain Parabolic',
        type: 'Interstellar Probe',
        missionUrl: 'https://science.nasa.gov/mission/voyager/',
        instruments: [
            { id: 'MAG', name: 'Magnetometer', status: 'ON' },
            { id: 'CRS', name: 'Cosmic Ray Subsystem', status: 'ON' },
            { id: 'LECP', name: 'Low Energy Charged Particle', status: 'ON' },
            { id: 'PWS', name: 'Plasma Wave Subsystem', status: 'ON' },
            { id: 'ISS', name: 'Imaging Science Subsystem', status: 'OFF' },
            { id: 'IRIS', name: 'Infrared Interferometer', status: 'OFF' }
        ]
    },
    // Voyager 2
    '-32': {
        power: 'RTG (Plutonium-238)',
        antenna: '3.7m High-Gain Parabolic',
        type: 'Interstellar Probe',
        missionUrl: 'https://science.nasa.gov/mission/voyager-2/',
        instruments: [
            { id: 'MAG', name: 'Magnetometer', status: 'ON' },
            { id: 'CRS', name: 'Cosmic Ray Subsystem', status: 'ON' },
            { id: 'PLS', name: 'Plasma Science', status: 'ON' }, // V2 PLS still works, V1 died
            { id: 'PWS', name: 'Plasma Wave Subsystem', status: 'ON' },
            { id: 'ISS', name: 'Imaging Science Subsystem', status: 'OFF' }
        ]
    },
    // New Horizons
    '-98': {
        power: 'RTG (GPHS)',
        antenna: '2.1m High-Gain',
        type: 'Kuiper Belt Explorer',
        missionUrl: 'https://science.nasa.gov/mission/new-horizons/',
        instruments: [
            { id: 'LORRI', name: 'Long Range Recon Imager', status: 'STANDBY' },
            { id: 'RALPH', name: 'Color/IR Imager', status: 'STANDBY' },
            { id: 'ALICE', name: 'UV Spectrometer', status: 'OFF' },
            { id: 'REX', name: 'Radio Science Experiment', status: 'ON' },
            { id: 'SWAP', name: 'Solar Wind Around Pluto', status: 'ON' },
            { id: 'PEPSSI', name: 'Energetic Particle Spec', status: 'ON' }
        ]
    },
    // JWST
    '-170': {
        power: 'Solar Array + Li-Ion',
        antenna: 'Ka-Band High-Rate',
        type: 'Space Observatory',
        missionUrl: 'https://science.nasa.gov/mission/webb/',
        instruments: [
            { id: 'NIRCam', name: 'Near-Infrared Camera', status: 'ON' },
            { id: 'NIRSpec', name: 'Near-Infrared Spectrograph', status: 'ON' },
            { id: 'MIRI', name: 'Mid-Infrared Instrument', status: 'ON' }, // Cryocooler active
            { id: 'FGS', name: 'Fine Guidance Sensor', status: 'ON' }
        ]
    },
    // Parker Solar Probe
    '-96': {
        power: 'Solar Array (Liquid Cooled)',
        antenna: 'Ka-Band Parabolic',
        type: 'Heliophysics Orbiter',
        missionUrl: 'https://science.nasa.gov/mission/parker-solar-probe/',
        instruments: [
            { id: 'FIELDS', name: 'Electromagnetic Fields', status: 'ON' },
            { id: 'WISPR', name: 'Wide-Field Imager', status: 'ON' },
            { id: 'SWEAP', name: 'Solar Wind Electrons Alphas', status: 'ON' },
            { id: 'ISOIS', name: 'Integrated Science Invest.', status: 'ON' }
        ]
    }
};

export const DEFAULT_SPECS = {
    power: 'Solar Array / Battery',
    antenna: 'High-Gain Antenna',
    type: 'Deep Space Explorer',
    instruments: [
        { id: 'COM', name: 'Comms Subsystem', status: 'ON' as const },
        { id: 'GNC', name: 'Guidance & Navigation', status: 'ON' as const },
        { id: 'PWR', name: 'Power Bus Controller', status: 'ON' as const },
        { id: 'THERM', name: 'Thermal Control', status: 'ON' as const }
    ]
};
