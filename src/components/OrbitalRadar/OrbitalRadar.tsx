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
        <div className="w-full mx-auto p-4 flex flex-col items-center animate-slide-in relative">

            {/* Screen Reader Only: Live Summary */}
            <div className="sr-only" aria-live="polite">
                {visualObjects.length > 0
                    ? `Radar active. ${visualObjects.length} satellites visible above ${location?.name || 'current location'}.`
                    : 'Searching for satellites...'}
            </div>

            {/* Main Radar Container */}
            <div className="relative w-full max-w-[1200px] aspect-square md:aspect-[16/9] bg-slate-900 border border-slate-700/50 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/5 p-8">

                {/* 1. Header Bar (Glass Overlay) */}
                <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-slate-900/90 to-transparent z-20 flex items-start justify-between p-4 pointer-events-none">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]"></span>
                            ORBITAL RADAR
                        </h2>
                        <div className="text-[10px] text-cyan-500/70 font-mono tracking-widest uppercase mt-0.5">
                            Active Sensor Array • {location?.name || 'NO SIGNAL'}
                        </div>
                    </div>

                    {/* Search Bar (Floating) */}
                    <div className="pointer-events-auto">
                        <div className={`flex items-center bg-slate-800/60 backdrop-blur-md rounded-full border px-3 py-1.5 focus-within:ring-1 focus-within:ring-cyan-500/50 transition-all ${gpsError ? 'border-amber-500/50' : 'border-white/10 hover:border-white/20'}`}>
                            <svg className={`h-4 w-4 mr-2 ${gpsError ? 'text-amber-500' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                {gpsError ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                )}
                            </svg>
                            <input
                                type="text"
                                placeholder="Locate..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onFocus={() => setShowResults(true)}
                                className="bg-transparent border-none outline-none text-xs text-white placeholder-slate-500 w-32 focus:w-48 transition-all"
                            />
                            {isSearching && <div className="animate-spin h-3 w-3 border-2 border-cyan-500 rounded-full border-t-transparent mr-1"></div>}
                            {/* GPS Button */}
                            <button
                                onClick={() => detectLocation()}
                                disabled={isLocating}
                                className="ml-2 p-1 rounded-full hover:bg-white/10 text-slate-400 hover:text-cyan-400 transition-colors"
                                title="Auto-Detect Location"
                            >
                                {isLocating ? (
                                    <div className="animate-spin h-3 w-3 border-2 border-cyan-500 rounded-full border-t-transparent"></div>
                                ) : (
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                        {/* Results Dropdown */}
                        {showResults && searchResults.length > 0 && (
                            <div className="absolute top-14 right-4 w-64 bg-slate-900/95 border border-slate-700/50 rounded-lg shadow-xl overflow-hidden max-h-60 overflow-y-auto backdrop-blur-xl z-50">
                                {searchResults.map((res) => (
                                    <button
                                        key={res.place_id}
                                        onClick={() => handleSelectLocation(res)}
                                        className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-cyan-500/10 hover:text-cyan-400 transition-colors border-b border-white/5 last:border-0"
                                    >
                                        {res.display_name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. Canvas Area */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900/0 via-slate-900/50 to-slate-900">
                    {loading || !location ? (
                        <div className="flex items-center justify-center w-full h-full flex-col gap-4">
                            <div className="animate-spin h-8 w-8 border-2 border-cyan-500 rounded-full border-t-transparent shadow-[0_0_15px_rgba(6,182,212,0.5)]"></div>
                            <div className="text-cyan-400 text-sm font-mono animate-pulse">
                                {!location ? "INITIALIZING GPS..." : "ACQUIRING TARGETS..."}
                            </div>
                            {!location && (
                                <button
                                    onClick={() => setLocation({ name: 'Select Location', lat: 0, lng: 0 })}
                                    className="px-4 py-1.5 bg-slate-800 border border-slate-600 rounded text-xs text-slate-300 hover:text-white hover:border-cyan-500 transition-colors uppercase tracking-wider"
                                >
                                    Manual Override
                                </button>
                            )}
                        </div>
                    ) : (
                        <RadarCanvas
                            objects={visualObjects}
                            onSelect={handleSelectSat}
                            selectedSatId={selectedSatId}
                            orbitPath={orbitPath.filter(p => !p.time || p.time > new Date())}
                        />
                    )}
                </div>

                {/* 3. HUD Overlay (Bottom-Left: Selected Target) */}
                <div className="absolute bottom-4 left-4 z-20 max-w-sm pointer-events-none">
                    {selectedSatId && visualObjects.find(v => v.id === selectedSatId) ? (
                        (() => {
                            const sat = visualObjects.find(v => v.id === selectedSatId);
                            const satData = satellites.find(s => s.id === selectedSatId);
                            const pos = sat!.position;
                            const orbitalParams = satData ? getOrbitalParams(satData.line1, satData.line2) : null;

                            return (
                                <div className="bg-slate-900/80 backdrop-blur-md border-l-2 border-amber-500 p-4 rounded-r-lg shadow-lg animate-in slide-in-from-left-4 duration-300 pointer-events-auto">
                                    <div className="text-[10px] text-amber-500 uppercase tracking-widest font-bold mb-1">Target Locked</div>
                                    <h3 className="text-lg font-bold text-white leading-none mb-2">{sat!.name}</h3>

                                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs font-mono text-slate-300">
                                        <div>
                                            <span className="text-slate-500 block text-[9px] uppercase">Altitude</span>
                                            {Math.round(pos.height).toLocaleString()} km
                                        </div>
                                        <div>
                                            <span className="text-slate-500 block text-[9px] uppercase">Velocity</span>
                                            {pos.velocity.toFixed(2)} km/s
                                        </div>
                                        <div>
                                            <span className="text-slate-500 block text-[9px] uppercase">Azimuth</span>
                                            {pos.azimuth.toFixed(1)}°
                                        </div>
                                        <div>
                                            <span className="text-slate-500 block text-[9px] uppercase">Elevation</span>
                                            {pos.elevation.toFixed(1)}°
                                        </div>
                                    </div>

                                    {orbitalParams && (
                                        <div className="mt-2 pt-2 border-t border-white/10 grid grid-cols-3 gap-2 text-[9px] text-slate-400 font-mono">
                                            <div>
                                                <span className="block text-slate-600">PERIGEE</span>
                                                {Math.round(orbitalParams.perigee).toLocaleString()} km
                                            </div>
                                            <div>
                                                <span className="block text-slate-600">APOGEE</span>
                                                {Math.round(orbitalParams.apogee).toLocaleString()} km
                                            </div>
                                            <div>
                                                <span className="block text-slate-600">INCL</span>
                                                {orbitalParams.inclination.toFixed(1)}°
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between">
                                        <div className="text-[9px] text-slate-500">ID: {sat!.id}</div>
                                        <a href={`https://www.n2yo.com/satellite/?s=${sat!.id}`} target="_blank" rel="noreferrer" className="text-[9px] text-cyan-400 hover:text-white uppercase tracking-wider flex items-center gap-1 group">
                                            Full Telemetry
                                            <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </a>
                                    </div>
                                </div>
                            );
                        })()
                    ) : (
                        <div className="bg-slate-900/60 backdrop-blur-sm border-l-2 border-slate-600 p-3 rounded-r-lg">
                            <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">System Ready</div>
                            <div className="text-xs text-slate-400">Select a target to view telemetry</div>
                        </div>
                    )}
                </div>

                {/* 4. System Status (Bottom-Right) */}
                <div className="absolute bottom-4 right-4 z-20 pointer-events-none">
                    <div className="bg-slate-900/60 backdrop-blur-md rounded-lg p-2 border border-white/5 flex items-center gap-3 text-[10px] font-mono text-slate-400">
                        <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${dataSource === 'mirror' ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`}></span>
                            {dataSource === 'mirror' ? 'CELESTRAK: LIVE' : 'CELESTRAK: OFFLINE'}
                        </div>
                        <div className="w-px h-3 bg-white/10"></div>
                        <div>OBJ: {visualObjects.length}</div>
                    </div>
                </div>

                {/* Corner Accents */}
                <div className="absolute top-0 left-0 w-16 h-16 border-l-2 border-t-2 border-cyan-500/30 rounded-tl-2xl pointer-events-none"></div>
                <div className="absolute top-0 right-0 w-16 h-16 border-r-2 border-t-2 border-cyan-500/30 rounded-tr-2xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-16 h-16 border-l-2 border-b-2 border-cyan-500/30 rounded-bl-2xl pointer-events-none"></div>
                <div className="absolute bottom-0 right-0 w-16 h-16 border-r-2 border-b-2 border-cyan-500/30 rounded-br-2xl pointer-events-none"></div>

            </div >
        </div >
    );
};
