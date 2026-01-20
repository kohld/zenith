
import { useEffect, useState, useMemo } from 'react';
import { AuroraForecast, KpEntry, ObserverLocation as Location, SearchResult } from '../../lib/definitions';


export const SpaceWeather = () => {
    const [forecastData, setForecastData] = useState<AuroraForecast | null>(null);
    const [loading, setLoading] = useState(true);
    const [location, setLocation] = useState<Location | null>(() => {
        try {
            const saved = localStorage.getItem('zenith_location');
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            return null;
        }
    });

    const [query, setQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);

    useEffect(() => {
        fetch(`${import.meta.env.BASE_URL}data/aurora.json`)
            .then(res => res.json())
            .then(data => {
                setForecastData(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load aurora data", err);
                setLoading(false);
            });
    }, []);

    // Save location to localStorage when it changes
    useEffect(() => {
        if (location) {
            localStorage.setItem('zenith_location', JSON.stringify(location));
        }
    }, [location]);

    // Simple Visibility Logic
    const getVisibilityThreshold = (lat: number) => {
        const absLat = Math.abs(lat);
        if (absLat >= 65) return 1;
        if (absLat >= 60) return 2;
        if (absLat >= 55) return 3;
        if (absLat >= 52) return 4;
        if (absLat >= 50) return 5;
        if (absLat >= 45) return 7;
        return 9;
    };

    const currentKp = useMemo(() => {
        if (!forecastData) return null;
        const now = new Date();
        // Find the closest entry (NOAA usually has 3h steps)
        return forecastData.forecast.find(entry => new Date(entry.time) > now) || forecastData.forecast[0];
    }, [forecastData]);

    const threshold = location ? getVisibilityThreshold(location.lat) : 5;
    const isVisibleNow = currentKp ? currentKp.kp >= threshold : false;

    // Search Logic (Subset of OrbitalRadar logic for consistency)
    useEffect(() => {
        if (query.length < 3) {
            setSearchResults([]);
            return;
        }
        const timer = setTimeout(async () => {
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
        }, 500);
        return () => clearTimeout(timer);
    }, [query]);

    const handleSelectLocation = (result: SearchResult) => {
        const newLocation = {
            name: result.display_name.split(',')[0],
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon)
        };
        setLocation(newLocation);
        setQuery('');
        setShowResults(false);
    };

    if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-2 border-emerald-500 rounded-full border-t-transparent"></div></div>;

    const groupedForecast = forecastData ? forecastData.forecast.reduce((acc, entry) => {
        const date = entry.time.split(' ')[0];
        if (!acc[date]) acc[date] = [];
        acc[date].push(entry);
        return acc;
    }, {} as Record<string, KpEntry[]>) : {};


    return (
        <div className="w-full max-w-5xl mx-auto p-4 flex flex-col items-center animate-slide-in">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent mb-6">
                Aurora Monitor
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full">
                {/* LEFT: Current Status & Location */}
                <div className="lg:col-span-1 flex flex-col">
                    {/* Aligned Header */}
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2 mb-3">
                        <span className="w-1 h-1 bg-emerald-500 rounded-full"></span>
                        Current Outlook
                    </h3>

                    <div className="flex flex-col gap-6 h-full lg:justify-between">
                        <div className="p-6 rounded-2xl bg-slate-800/40 backdrop-blur-md border border-white/5 relative overflow-hidden group flex-grow flex flex-col justify-center min-h-[300px]">
                            <div className={`absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl -mr-16 -mt-16 transition-opacity ${isVisibleNow ? 'opacity-100' : 'opacity-0'}`}></div>

                            <div className="flex flex-col items-center text-center">
                                <div className={`text-6xl font-bold mb-2 ${isVisibleNow ? 'text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]' : 'text-slate-600'}`}>
                                    Kp {currentKp?.kp.toFixed(1) || '--'}
                                </div>
                                <div className={`text-sm font-medium px-4 py-1.5 rounded-full border mb-8 ${isVisibleNow
                                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                                    : 'bg-slate-800/50 border-white/5 text-slate-500'
                                    }`}>
                                    {isVisibleNow ? 'Aurora Likely Visible' : 'Low Probability'}
                                </div>
                            </div>

                            <div className="space-y-4 border-t border-white/5 pt-6 mt-auto">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-500">Your latitude</span>
                                    <span className="text-white font-mono">{location?.lat.toFixed(2) || '??'}°</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-500">Your longitude</span>
                                    <span className="text-white font-mono">{location?.lng.toFixed(2) || '??'}°</span>
                                </div>
                                <div className="flex justify-between items-center text-xs border-t border-white/5 pt-4">
                                    <span className="text-slate-500">Visibility Threshold</span>
                                    <span className="text-emerald-400 font-mono">Kp {threshold}+</span>
                                </div>
                            </div>
                        </div>

                        {/* Location Override */}
                        <div className="p-6 rounded-2xl bg-slate-800/20 border border-white/5">
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Observer Location</div>
                            <div className="relative">
                                <div className="flex items-center bg-slate-900/50 rounded-lg border border-white/10 px-3 py-2">
                                    <svg className="h-4 w-4 text-slate-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    </svg>
                                    <input
                                        type="text"
                                        placeholder={location?.name || "Search city..."}
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        className="bg-transparent border-none outline-none text-sm text-white placeholder-slate-600 w-full"
                                    />
                                    {isSearching && <div className="animate-spin h-3 w-3 border-2 border-emerald-500 rounded-full border-t-transparent ml-2"></div>}
                                </div>

                                {showResults && searchResults.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700/50 rounded-lg shadow-xl z-50 overflow-hidden">
                                        {searchResults.map((res) => (
                                            <button
                                                key={res.place_id}
                                                onClick={() => handleSelectLocation(res)}
                                                className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-emerald-500/10 hover:text-emerald-400 transition-colors border-b border-white/5 last:border-0"
                                            >
                                                {res.display_name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT: 3-Day Forecast */}
                <div className="lg:col-span-2">
                    <div className="flex flex-col gap-6">
                        {Object.entries(groupedForecast).slice(0, 3).map(([date, entries]) => (
                            <div key={date} className="flex flex-col gap-3">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <span className="w-1 h-1 bg-emerald-500 rounded-full"></span>
                                    {new Date(date).toLocaleDateString(undefined, { weekday: 'long', day: '2-digit', month: 'long' })}
                                </h3>
                                <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                                    {entries.map((entry, idx) => {
                                        const time = entry.time.split(' ')[1].substring(0, 5);
                                        const isHigh = entry.kp >= threshold;
                                        return (
                                            <div
                                                key={idx}
                                                className={`p-2 rounded-lg border flex flex-col items-center transition-all ${isHigh
                                                    ? 'bg-emerald-500/10 border-emerald-500/40'
                                                    : 'bg-slate-800/20 border-white/5'
                                                    }`}
                                            >
                                                <div className="text-[10px] text-slate-500 mb-1 font-mono">{time}</div>
                                                <div className={`text-base font-bold ${isHigh ? 'text-emerald-400' : 'text-slate-300'}`}>
                                                    {entry.kp.toFixed(1)}
                                                </div>
                                                {entry.scale && (
                                                    <div className="text-[8px] bg-red-900/30 text-red-400 px-1 rounded mt-1 font-bold">
                                                        {entry.scale}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-12 w-full h-px bg-white/5"></div>
            <div className="mt-6 text-[10px] text-slate-500 font-mono text-center">
                DATA SOURCE: NOAA SPACE WEATHER PREDICTION CENTER (SWPC) • UPDATED: {new Date(forecastData?.updatedAt || '').toLocaleString()}
            </div>
        </div>
    );
};
