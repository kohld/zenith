import { KpEntry, AuroraAnalysis, AuroraOpportunity } from '../types';

export const evaluateAuroraTool = {
    name: 'evaluate_aurora_window',
    description: 'Evaluates aurora forecast and identifies best viewing opportunities',
    parameters: {
        type: 'object',
        properties: {
            forecast: { 
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        time: { type: 'string' },
                        kp: { type: 'number' },
                        status: { type: 'string' },
                        scale: { type: 'string' }
                    }
                },
                description: 'Aurora forecast entries with time, kp, status, scale' 
            },
            latitude: { 
                type: 'number', 
                description: 'Observer latitude (default: 52 for Central Europe)' 
            }
        },
        required: ['forecast']
    }
};

export function evaluateAurora(forecast: KpEntry[], latitude: number = 52): AuroraAnalysis {
    const threshold = getVisibilityThreshold(latitude);
    const opportunities: AuroraOpportunity[] = [];
    
    const grouped = groupByDate(forecast);
    
    for (const [date, entries] of Object.entries(grouped)) {
        const highKpEntries = entries.filter(e => e.kp >= threshold);
        
        if (highKpEntries.length > 0) {
            const maxKp = Math.max(...highKpEntries.map(e => e.kp));
            const timeWindow = {
                start: highKpEntries[0].time,
                end: highKpEntries[highKpEntries.length - 1].time
            };
            
            const stormLevel = highKpEntries.find(e => e.scale)?.scale || determineStormLevel(maxKp);
            
            opportunities.push({
                date,
                max_kp: maxKp,
                storm_level: stormLevel,
                probability: calculateProbability(maxKp, latitude),
                time_window: timeWindow,
                duration_hours: calculateDuration(timeWindow),
                recommendation: generateRecommendation(maxKp, latitude),
                viewing_tips: maxKp >= 7 ? generateViewingTips(maxKp) : undefined,
                locations_by_latitude: maxKp >= 7 ? generateLocationGuide() : undefined
            });
        }
    }
    
    const bestWindow = opportunities.length > 0 
        ? opportunities.sort((a, b) => b.max_kp - a.max_kp)[0]
        : null;
    
    const totalHours = opportunities.reduce((sum, o) => sum + o.duration_hours, 0);
    
    return {
        opportunities,
        best_window: bestWindow ? {
            date: bestWindow.date,
            time: formatTimeWindow(bestWindow.time_window),
            kp: bestWindow.max_kp,
            visibility_range: getVisibilityRange(bestWindow.max_kp)
        } : null,
        total_viewing_hours: Math.round(totalHours)
    };
}

function getVisibilityThreshold(lat: number): number {
    const absLat = Math.abs(lat);
    if (absLat >= 65) return 1;
    if (absLat >= 60) return 2;
    if (absLat >= 55) return 3;
    if (absLat >= 52) return 4;
    if (absLat >= 50) return 5;
    if (absLat >= 45) return 7;
    return 9;
}

function calculateProbability(kp: number, lat: number): string {
    const threshold = getVisibilityThreshold(lat);
    const diff = kp - threshold;
    
    if (diff >= 3) return 'Very High (90%+)';
    if (diff >= 2) return 'High (70-90%)';
    if (diff >= 1) return 'Moderate (50-70%)';
    if (diff >= 0) return 'Low (30-50%)';
    return 'Very Low (<30%)';
}

function generateRecommendation(kp: number, lat: number): string {
    if (kp >= 8) {
        return '⭐ EXCEPTIONAL CONDITIONS! This is a rare G4+ storm. Aurora will be visible across most of Europe and northern USA. Head to the darkest location you can find immediately after sunset.';
    }
    if (kp >= 7) {
        return 'Excellent viewing opportunity! Strong geomagnetic activity. Aurora visible at mid-latitudes. Find a dark location away from city lights.';
    }
    if (kp >= 5) {
        return 'Good viewing opportunity for high-latitude observers. Worth checking if you\'re above 60° latitude and skies are clear.';
    }
    if (kp >= 3) {
        return 'Possible aurora at high latitudes. Best for northern locations (65°+). Worth checking if conditions are optimal.';
    }
    return 'Low activity. Best for polar regions only.';
}

function generateViewingTips(kp: number): string[] {
    const tips: string[] = [
        'Look north (Northern Hemisphere) or south (Southern Hemisphere)',
        'Best time: 22:00-02:00 local time',
        'Avoid light pollution - drive 30+ km from cities',
        'Let your eyes adjust to darkness (15-20 minutes)',
        'Check weather forecast for clear skies'
    ];
    
    if (kp >= 7) {
        tips.push('Camera settings: ISO 3200, f/2.8, 10-15s exposure');
        tips.push('Bring wide-angle lens (14-24mm)');
        tips.push('Dress warmly - you\'ll be outside for hours');
        tips.push('Bring extra batteries (cold drains them fast)');
    } else {
        tips.push('Camera settings: ISO 1600, f/2.8, 15-20s exposure');
        tips.push('Use tripod for long exposures');
    }
    
    return tips;
}

function generateLocationGuide(): Record<string, string> {
    return {
        '65+': 'Guaranteed visibility - overhead aurora likely',
        '60-65': 'Very high probability - bright displays expected',
        '55-60': 'High probability - visible on northern horizon',
        '50-55': 'Moderate probability - faint glow possible',
        '45-50': 'Low probability - only during peak activity',
        '<45': 'Very low probability - exceptional storms only'
    };
}

function determineStormLevel(kp: number): string {
    if (kp >= 9) return 'G5 (Extreme)';
    if (kp >= 8) return 'G4 (Severe)';
    if (kp >= 7) return 'G3 (Strong)';
    if (kp >= 6) return 'G2 (Moderate)';
    if (kp >= 5) return 'G1 (Minor)';
    return 'G0 (Quiet)';
}

function groupByDate(entries: KpEntry[]): Record<string, KpEntry[]> {
    return entries.reduce((acc, entry) => {
        const date = entry.time.split(' ')[0];
        if (!acc[date]) acc[date] = [];
        acc[date].push(entry);
        return acc;
    }, {} as Record<string, KpEntry[]>);
}

function calculateDuration(window: { start: string; end: string }): number {
    const start = new Date(window.start);
    const end = new Date(window.end);
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60));
}

function formatTimeWindow(window: { start: string; end: string }): string {
    const start = new Date(window.start);
    const end = new Date(window.end);
    return `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')}-${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')} UTC`;
}

function getVisibilityRange(kp: number): string {
    if (kp >= 9) return 'Down to 40° latitude';
    if (kp >= 8) return 'Down to 45° latitude';
    if (kp >= 7) return 'Down to 50° latitude';
    if (kp >= 6) return 'Down to 55° latitude';
    if (kp >= 5) return 'Down to 60° latitude';
    return 'Above 65° latitude';
}
