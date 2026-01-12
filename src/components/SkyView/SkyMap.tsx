import { useEffect, useState } from 'react';
import { fetchTLEs, getSatPosition, SatelliteData, SatellitePosition, getSatellitePath } from '../../utils/orbital';
import { SkyCanvas } from './SkyCanvas';

interface VisualObject {
    name: string;
    id: string;
    type: string; // Add type
    position: SatellitePosition;
}

interface Location {
    name: string;
    lat: number;
    lng: number;
}

// Default to Berlin removed. Starting with null to trigger detection.

interface SearchResult {
    place_id: number;
    lat: string;
    lon: string;
    display_name: string;
}

export const SkyMap = () => {
    const [satellites, setSatellites] = useState<SatelliteData[]>([]);
    const [visualObjects, setVisualObjects] = useState<VisualObject[]>([]);

    const [loading, setLoading] = useState(true);
    const [selectedSat, setSelectedSat] = useState<string | null>(null);
    const [orbitPath, setOrbitPath] = useState<SatellitePosition[]>([]);

    // Location State - start as null to show loading/detection
    const [location, setLocation] = useState<Location | null>(() => {
        const saved = localStorage.getItem('zenith_location');
        return saved ? JSON.parse(saved) : null;
    });
    const [query, setQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);

    // Initial Fetch
    useEffect(() => {
        const loadData = async () => {
            const data = await fetchTLEs();
            setSatellites(data);
            setLoading(false);
        };
        loadData();
    }, []);

    // Save location
    useEffect(() => {
        localStorage.setItem('zenith_location', JSON.stringify(location));
    }, [location]);

    // Try to get user location on first load if not set
    useEffect(() => {
        let isMounted = true;
        const saved = localStorage.getItem('zenith_location');

        if (!saved) {
            // GLOBAL FAILSAFE: If nothing works after 3 seconds, unlock the UI
            const fallbackTimer = setTimeout(() => {
                if (isMounted) {
                    setLocation(prev => prev || { name: 'Select Location', lat: 0, lng: 0 });
                }
            }, 3000);

            // IP Fetch with 2s timeout
            const controller = new AbortController();
            const ipTimeout = setTimeout(() => controller.abort(), 2000);

            // 1. Try IP Geolocation first
            fetch('https://ipapi.co/json/', { signal: controller.signal })
                .then(res => {
                    if (!res.ok) throw new Error('IP API Error');
                    return res.json();
                })
                .then(data => {
                    if (isMounted && data.latitude && data.longitude) {
                        setLocation({
                            name: data.city || data.region || 'IP Location',
                            lat: data.latitude,
                            lng: data.longitude
                        });
                    } else {
                        throw new Error('Invalid IP Data');
                    }
                })
                .catch(err => {
                    if (isMounted) console.warn("IP Geo/Fetch failed", err);
                })
                .finally(() => {
                    clearTimeout(ipTimeout);
                    // 2. Try precise Browser Geolocation (with 4s timeout)
                    if (isMounted && navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                            async (pos) => {
                                if (!isMounted) return;
                                const { latitude, longitude } = pos.coords;
                                try {
                                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
                                    if (res.ok) {
                                        const data = await res.json();
                                        const name = data.address?.city || data.address?.town || data.address?.village || data.display_name.split(',')[0] || 'My Location';
                                        if (isMounted) {
                                            setLocation({ name, lat: latitude, lng: longitude });
                                        }
                                    } else {
                                        if (isMounted) {
                                            setLocation(_ => {
                                                const displayName = `Lat: ${latitude.toFixed(2)}`;
                                                return { name: displayName, lat: latitude, lng: longitude };
                                            });
                                        }
                                    }
                                } catch (e) {
                                    if (isMounted) {
                                        setLocation({ name: `GPS Location`, lat: latitude, lng: longitude });
                                    }
                                }
                            },
                            (err) => {
                                if (isMounted) console.warn("GPS Access denied/failed", err);
                            },
                            { timeout: 4000 }
                        );
                    }
                });

            return () => {
                isMounted = false;
                controller.abort();
                clearTimeout(fallbackTimer);
                clearTimeout(ipTimeout);
            };
        }
    }, []);

    // Search Logic
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.length < 3) {
                setSearchResults([]);
                return;
            }

            setIsSearching(true);
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`);
                if (res.ok) {
                    const data = await res.json();
                    setSearchResults(data);
                    setShowResults(true);
                }
            } catch (e) {
                console.error("Search failed", e);
            } finally {
                setIsSearching(false);
            }
        }, 500); // 500ms debounce

        return () => clearTimeout(timer);
    }, [query]);

    // Handle Select
    const handleSelectLocation = (result: SearchResult) => {
        const newLocation = {
            name: result.display_name.split(',')[0], // Take first part as short name
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon)
        };
        setLocation(newLocation);
        setQuery('');
        setShowResults(false);
    };

    const handleSelectSat = (satName: string | null) => {
        setSelectedSat(satName);
        if (satName && location) {
            const sat = satellites.find(s => s.name === satName);
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
        if (selectedSat && location) {
            const sat = satellites.find(s => s.name === selectedSat);
            if (sat) {
                const path = getSatellitePath(sat.line1, sat.line2, new Date(), 90, location.lat, location.lng, 0.2);
                setOrbitPath(path);
            }
        }
    }, [location, selectedSat, satellites]);

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
        <div className="w-full max-w-4xl mx-auto p-4 flex flex-col items-center">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-6">
                Orbital Radar
            </h2>

            {/* Location Search Control */}
            <div className="relative w-full max-w-[300px] mb-6 z-20">
                <div className="flex items-center bg-slate-800/80 backdrop-blur-md rounded-lg border border-slate-700 px-4 py-2 focus-within:ring-2 focus-within:ring-cyan-500/50 transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder={location ? location.name : "Search location..."}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => setShowResults(true)}
                        className="bg-transparent border-none outline-none text-sm text-white placeholder-slate-400 w-full"
                    />
                    {isSearching && <div className="animate-spin h-4 w-4 border-2 border-cyan-500 rounded-full border-t-transparent"></div>}
                </div>

                {/* Results Dropdown */}
                {showResults && searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                        {searchResults.map((res) => (
                            <button
                                key={res.place_id}
                                onClick={() => handleSelectLocation(res)}
                                className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors border-b border-slate-700 last:border-0"
                            >
                                {res.display_name}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="relative w-full aspect-square max-w-[600px] bg-slate-900/50 rounded-full border border-slate-700/50 backdrop-blur-sm shadow-[0_0_50px_rgba(56,189,248,0.1)] overflow-hidden">
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
                        <SkyCanvas
                            objects={visualObjects}
                            onSelect={handleSelectSat}
                            selectedSat={selectedSat}
                            orbitPath={orbitPath.filter(p => !p.time || p.time > new Date())} // Filter past points
                        />

                    </>
                )}
            </div>

            {/* Selected Satellite Data Panel (Always Visible) */}
            <div className="w-full max-w-[600px] mt-4 p-4 bg-slate-800/80 backdrop-blur-md border border-slate-700/50 rounded-xl shadow-lg min-h-[120px] flex flex-col justify-center transition-all duration-300">
                {selectedSat && visualObjects.find(v => v.name === selectedSat) ? (
                    (() => {
                        const sat = visualObjects.find(v => v.name === selectedSat);
                        const pos = sat!.position;
                        return (
                            <div className="flex flex-row items-center justify-between gap-4 animate-in fade-in duration-300">
                                <div className="flex-shrink-0">
                                    <div className="text-[10px] uppercase tracking-widest text-cyan-400 font-semibold mb-1">Target Lock</div>
                                    <div className="text-xl font-bold text-white leading-none truncate max-w-[200px]" title={sat!.name}>
                                        {sat!.name}
                                    </div>
                                    <div className="mt-2 text-[10px] text-slate-500 font-mono flex flex-col gap-0.5">
                                        <span>NORAD ID: <span className="text-slate-300">{sat!.id}</span></span>
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
                        );
                    })()
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 animate-in fade-in duration-300">
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
                    <div className="text-xs text-slate-500 mt-1 space-x-2">
                        <span>Lat: {location.lat.toFixed(2)}°</span>
                        <span>Lng: {location.lng.toFixed(2)}°</span>
                        <span>•</span>
                        <span>Data: CelesTrak</span>
                    </div>
                </div>
            )}
        </div>
    );
};
