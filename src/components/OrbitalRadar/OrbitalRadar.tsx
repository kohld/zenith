import { useEffect, useState } from 'react';
import { getSatPosition, getSatellitePath } from '../../utils/orbital';
import { getOrbitalParams } from '../../utils/orbital-params';
import { fetchTLEs } from '../../api/celestrak';
import { RadarCanvas } from './RadarCanvas';
import { SatelliteData, SatellitePosition, VisualObject, ObserverLocation as Location, SearchResult } from '../../lib/definitions';

// Default to Berlin removed. Starting with null to trigger detection.

export const OrbitalRadar = () => {
    const [satellites, setSatellites] = useState<SatelliteData[]>([]);
    const [visualObjects, setVisualObjects] = useState<VisualObject[]>([]);

    const [loading, setLoading] = useState(true);
    const [selectedSatId, setSelectedSatId] = useState<string | null>(null); // Track ID
    const [orbitPath, setOrbitPath] = useState<SatellitePosition[]>([]);
    const [dataSource, setDataSource] = useState<'mirror' | 'fallback' | 'error'>('mirror');

    // Location State
    const [location, setLocation] = useState<Location | null>(() => {
        try {
            const saved = localStorage.getItem('zenith_location');
            if (saved) {
                const parsed = JSON.parse(saved);
                // Treat (0,0) as invalid/fallback and force re-detection
                if (parsed.lat === 0 && parsed.lng === 0) return null;
                return parsed;
            }
        } catch (e) {
            return null;
        }
        return null;
    });

    const [query, setQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const [gpsError, setGpsError] = useState<string | null>(null);

    // Initial Fetch (Satellites)
    useEffect(() => {
        const loadData = async () => {
            const { data, source } = await fetchTLEs();
            setSatellites(data);
            setDataSource(source);
            setLoading(false);
        };
        loadData();
    }, []);

    // Save location only if valid
    useEffect(() => {
        if (location) {
            localStorage.setItem('zenith_location', JSON.stringify(location));
        }
    }, [location]);

    // Reusable Detection Logic
    const detectLocation = () => {
        setIsLocating(true);
        setGpsError(null); // Reset error
        let gpsResolved = false;

        // 1. Trigger GPS (WiFi Triangulation / CoreLocation)
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    gpsResolved = true; // WINNER
                    const { latitude, longitude } = pos.coords;
                    try {
                        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
                        if (res.ok) {
                            const data = await res.json();
                            const name = data.address?.city || data.address?.town || data.address?.village || data.display_name.split(',')[0] || 'My Location';
                            setLocation({ name, lat: latitude, lng: longitude });
                        } else {
                            setLocation({ name: `GPS: ${latitude.toFixed(2)}, ${longitude.toFixed(2)}`, lat: latitude, lng: longitude });
                        }
                    } catch (e) {
                        setLocation({ name: `GPS Location`, lat: latitude, lng: longitude });
                    } finally {
                        setIsLocating(false);
                    }
                },
                (err) => {
                    console.warn("GPS Access denied/failed", err);
                    setGpsError(err.message || "Location Unavailable");

                    if (!gpsResolved) {
                        setIsLocating(false); // Fix: Stop spinner if GPS fails!
                        // GPS failed. If IP is done, stopping spinner is fine.
                        // If IP is NOT done, wait for it? 
                        // Actually, let's just ensure spinner stops eventually.
                        // But critical: We rely on IP now.
                    }
                },
                {
                    timeout: 10000,
                    maximumAge: 0, // Force fresh
                    enableHighAccuracy: false
                }
            );
        }

        // 2. Trigger IP Geolocation (Fast Fallback)
        fetch('https://ipapi.co/json/')
            .then(res => {
                if (!res.ok) throw new Error('IP API Error');
                return res.json();
            })
            .then(data => {
                // If we have data and assume GPS hasn't won yet
                if (!gpsResolved && data.latitude && data.longitude) {
                    const cityName = data.city || data.region || 'IP Location';
                    setLocation({
                        name: `${cityName} (IP)`,
                        lat: data.latitude,
                        lng: data.longitude
                    });
                }
            })
            .catch(err => console.warn("IP Geo failed", err))
            .finally(() => {
                // Always ensure spinner stops if we don't have GPS capability or if we are just done with this request
                if (!navigator.geolocation) setIsLocating(false);
                // If GPS failed fast, and this takes long, this finally will clean up. 
                // If GPS is hanging, this won't stop spinner (good, unless GPS hangs forever).
            });
    };

    // Trigger detection on mount if no valid location exists OR if saved location was approximating
    useEffect(() => {
        if (!location || location.name.includes('(IP)')) {
            detectLocation();
        }
    }, []);

    // Search Logic
    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;

        const timer = setTimeout(async () => {
            if (query.length < 3) {
                setSearchResults([]);
                setIsSearching(false);
                return;
            }

            setIsSearching(true);
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5`, { signal });
                if (res.ok) {
                    const data = await res.json();
                    if (!signal.aborted) {
                        setSearchResults(data);
                        setShowResults(true);
                    }
                }
            } catch (e: any) {
                if (e.name !== 'AbortError') {
                    console.error("Search failed", e);
                }
            } finally {
                if (!signal.aborted) {
                    setIsSearching(false);
                }
            }
        }, 500); // 500ms debounce

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [query]);

    // Handle Select
    const handleSelectLocation = (result: SearchResult) => {
        // Logic to extracting better short name using address details
        let name = result.display_name.split(',')[0];

        if (result.address && result.address.road) {
            const { road, house_number, country_code } = result.address;

            if (house_number) {
                // German-speaking countries usually put Number AFTER Street
                const isGermanic = ['de', 'at', 'ch'].includes(country_code?.toLowerCase() || '');
                name = isGermanic ? `${road} ${house_number}` : `${house_number} ${road}`;
            } else {
                name = road;
            }
        } else {
            // Fallback to previous heuristic if address details missing
            const parts = result.display_name.split(',').map(p => p.trim());
            if (/^\d+$/.test(parts[0]) && parts.length > 1) {
                name = `${parts[0]} ${parts[1]}`;
            }
        }

        const newLocation = {
            name: name,
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon)
        };
        setLocation(newLocation);
        setGpsError(null); // Clear error on manual select
        setQuery('');
        setIsSearching(false); // Force stop search spinner
        setIsLocating(false); // Force stop location spinner (if auto-detect was running)
        setShowResults(false);
    };

    const handleSelectSat = (satId: string | null) => { // Accept ID
        setSelectedSatId(satId);
        if (satId && location) {
            const sat = satellites.find(s => s.id === satId); // Find by ID
            if (sat) {
                const path = getSatellitePath(sat.line1, sat.line2, new Date(), 90, location.lat, location.lng, 0.2);
                setOrbitPath(path);
            }
        } else {
            setOrbitPath([]);
        }
    };

    // Update path if location/selection changes
    useEffect(() => {
        if (selectedSatId && location) {
            const sat = satellites.find(s => s.id === selectedSatId); // Find by ID
            if (sat) {
                const path = getSatellitePath(sat.line1, sat.line2, new Date(), 90, location.lat, location.lng, 0.2);
                setOrbitPath(path);
            }
        }
    }, [location, selectedSatId, satellites]);

    // Animation / Calculation Loop
    useEffect(() => {
        if (satellites.length === 0 || !location) return;

        let intervalId: ReturnType<typeof setInterval>;

        const updatePositions = () => {
            if (!location) return; // TS guard
            const now = new Date();
            const visible: VisualObject[] = [];

            satellites.forEach(sat => {
                const pos = getSatPosition(sat.line1, sat.line2, now, location.lat, location.lng);
                if (pos && pos.elevation > 0) { // Only calculate/show if above horizon
                    visible.push({
                        name: sat.name,
                        id: sat.id,
                        type: sat.type,
                        position: pos
                    });
                }
            });

            setVisualObjects(visible);
        };

        updatePositions();
        intervalId = setInterval(updatePositions, 500);

        return () => clearInterval(intervalId);
    }, [satellites, location]);


    return (
        <div className="w-full mx-auto p-4 flex flex-col items-center animate-slide-in">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-6">
                Orbital Radar
            </h2>

            {/* Screen Reader Only: Live Summary */}
            <div className="sr-only" aria-live="polite">
                {visualObjects.length > 0
                    ? `Radar active. ${visualObjects.length} satellites visible above ${location?.name || 'current location'}.`
                    : 'Searching for satellites...'}
            </div>

            {/* Location Search Control */}
            <div className="relative w-full max-w-[300px] mb-6 z-20">
                <div className={`flex items-center bg-slate-800/80 backdrop-blur-md rounded-lg border px-4 py-2 focus-within:ring-2 focus-within:ring-cyan-500/50 transition-all ${gpsError ? 'border-amber-500/50' : 'border-slate-700'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 ${gpsError ? 'text-amber-500' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {gpsError ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        )}
                        {!gpsError && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />}
                    </svg>
                    <input
                        type="text"
                        placeholder={location ? location.name : "Search location..."}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => setShowResults(true)}
                        className="bg-transparent border-none outline-none text-sm text-white placeholder-slate-400 w-full"
                        aria-label="Search for a location"
                        aria-expanded={showResults}
                        aria-controls="location-results"
                    />

                    {isSearching && <div className="animate-spin h-4 w-4 border-2 border-cyan-500 rounded-full border-t-transparent mr-2"></div>}

                    {/* Manual Detect Button */}
                    <button
                        onClick={() => detectLocation()}
                        disabled={isLocating}
                        className="p-1.5 rounded-full hover:bg-slate-700 text-slate-400 hover:text-cyan-400 transition-colors ml-2"
                        title="Auto-Detect Location"
                    >
                        {isLocating ? (
                            <div className="animate-spin h-4 w-4 border-2 border-cyan-500 rounded-full border-t-transparent"></div>
                        ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        )}
                    </button>
                </div>

                {/* Results Dropdown */}
                {showResults && searchResults.length > 0 && (
                    <div id="location-results" role="listbox" className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                        {searchResults.map((res) => (
                            <button
                                key={res.place_id}
                                onClick={() => handleSelectLocation(res)}
                                className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors border-b border-slate-700 last:border-0 focus:outline-none focus:bg-slate-700"
                                role="option"
                            >
                                {res.display_name}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="relative w-full aspect-square md:w-[50vw] md:max-w-none max-w-[600px] bg-slate-900/50 rounded-full border border-slate-700/50 backdrop-blur-sm shadow-[0_0_50px_rgba(56,189,248,0.1)] overflow-hidden">
                {loading || !location ? (
                    <div className="absolute inset-0 flex items-center justify-center flex-col gap-4 z-10 p-4">
                        <div className="animate-spin h-6 w-6 border-2 border-cyan-500 rounded-full border-t-transparent"></div>
                        <div className="text-cyan-400 text-sm text-center">
                            {!location ? "Detecting Location..." : "Loading Orbital Data..."}
                        </div>
                        {!location && (
                            <button
                                onClick={() => setLocation({ name: 'Select Location', lat: 0, lng: 0 })}
                                className="px-3 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-slate-300 hover:text-white hover:border-cyan-500 transition-colors"
                            >
                                Set Manually
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        <RadarCanvas
                            objects={visualObjects}
                            onSelect={handleSelectSat}
                            selectedSatId={selectedSatId} // Updated Prop
                            orbitPath={orbitPath.filter(p => !p.time || p.time > new Date())} // Filter past points
                        />

                    </>
                )}
            </div>

            {/* Selected Satellite Data Panel (Always Visible) */}
            <div className="w-full max-w-[600px] mt-4 p-4 bg-slate-800/80 backdrop-blur-md border border-slate-700/50 rounded-xl shadow-lg transition-all duration-300">
                {selectedSatId && visualObjects.find(v => v.id === selectedSatId) ? (
                    (() => {
                        const sat = visualObjects.find(v => v.id === selectedSatId); // Find by ID
                        const satData = satellites.find(s => s.id === selectedSatId); // Get full satellite data
                        const pos = sat!.position;
                        const orbitalParams = satData ? getOrbitalParams(satData.line1, satData.line2) : null;

                        return (
                            <div className="flex flex-col gap-3 animate-in fade-in duration-300">
                                {/* Header Row */}
                                <div className="flex flex-row items-center justify-between gap-4">
                                    <div className="flex-shrink-0">
                                        <div className="text-[10px] uppercase tracking-widest text-cyan-400 font-semibold mb-1">Target Lock</div>
                                        <a
                                            href={`https://www.n2yo.com/satellite/?s=${sat!.id}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="group flex items-center gap-2 cursor-pointer"
                                            title={`View ${sat!.name} on N2YO.com`}
                                        >
                                            <span className="text-xl font-bold text-white leading-none truncate max-w-[200px] border-b border-transparent group-hover:border-cyan-500/50 transition-all">
                                                {sat!.name}
                                            </span>
                                            <svg className="w-4 h-4 text-cyan-500 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                        </a>
                                        <div className="mt-2 text-[10px] text-slate-500 font-mono flex flex-col gap-0.5">
                                            <span>NORAD ID: <span className="text-slate-300">{sat!.id}</span></span>
                                            {satData?.cospar && (
                                                <span>COSPAR: <span className="text-slate-300">{satData.cospar}</span></span>
                                            )}
                                            <span className="text-cyan-500/80">{sat!.type}</span>
                                        </div>
                                    </div>

                                    <div className="h-10 w-px bg-slate-700/50 hidden sm:block" />

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs flex-grow">
                                        <div>
                                            <div className="text-slate-500 mb-0.5">Altitude</div>
                                            <div className="text-slate-200 font-mono text-sm">{Math.round(pos.height).toLocaleString()} <span className="text-[10px] text-slate-500">km</span></div>
                                        </div>
                                        <div>
                                            <div className="text-slate-500 mb-0.5">Velocity</div>
                                            <div className="text-slate-200 font-mono text-sm">{pos.velocity.toFixed(2)} <span className="text-[10px] text-slate-500">km/s</span></div>
                                        </div>
                                        <div>
                                            <div className="text-slate-500 mb-0.5">Elevation</div>
                                            <div className="text-slate-200 font-mono text-sm">{pos.elevation.toFixed(1)}°</div>
                                        </div>
                                        <div>
                                            <div className="text-slate-500 mb-0.5">Azimuth</div>
                                            <div className="text-slate-200 font-mono text-sm">{pos.azimuth.toFixed(1)}°</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Orbital Parameters Row */}
                                {orbitalParams && (
                                    <div className="pt-2 border-t border-slate-700/30">
                                        <div className="text-[10px] text-slate-500 mb-1">Orbit</div>
                                        <div className="text-sm text-slate-300 font-mono">
                                            {Math.round(orbitalParams.perigee)} × {Math.round(orbitalParams.apogee)} km; {orbitalParams.inclination.toFixed(1)}°
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })()
                ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-slate-500 animate-in fade-in duration-300">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 rounded-full bg-cyan-500/50 animate-pulse"></div>
                            <span className="text-xs font-medium uppercase tracking-widest">Radar Active</span>
                        </div>
                        <p className="text-sm">Select a satellite to view telemetry</p>
                    </div>
                )}
            </div>

            {location && (
                <div className="mt-4 text-center text-slate-400 text-sm">
                    <p>Showing {visualObjects.length} bright satellites above <span className="text-cyan-400 font-medium">{location.name}</span>.</p>
                    <div className="text-xs text-slate-500 mt-1 flex items-center justify-center gap-3">
                        <span>Lat: {location.lat.toFixed(2)}°</span>
                        <span>Lng: {location.lng.toFixed(2)}°</span>
                        <span className="w-px h-3 bg-slate-700"></span>
                        {/* Status Bubble Indicator */}
                        <div className="flex items-center gap-1.5" title={dataSource === 'mirror' ? 'Data Source: Primary Mirror (Active)' : 'Data Source: Fallback (Primary Limit Reached)'}>
                            <span aria-hidden="true">Data: CelesTrak</span>
                            <span className={`w-2 h-2 rounded-full ${dataSource === 'mirror' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`}></span>
                            <span className="sr-only">
                                {dataSource === 'mirror' ? 'System Status: Nominal, using primary mirror.' : 'System Status: Degraded, using fallback data.'}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
