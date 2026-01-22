export interface Launch {
    id: string;
    name: string;
    net: string;
    rocket: {
        configuration: {
            full_name: string;
            maiden_flight?: string;
            reusable: boolean;
        };
    };
    pad: {
        location: {
            name: string;
        };
    };
    mission?: {
        description?: string;
        type?: string;
        orbit?: {
            name: string;
        };
    };
    program?: Array<{
        name: string;
    }>;
}

export interface KpEntry {
    time: string;
    kp: number;
    status: string;
    scale: string | null;
}

export interface AuroraForecast {
    updatedAt: string;
    forecast: KpEntry[];
}

export interface LaunchAnalysis {
    launch_id: string;
    importance_score: number;
    reasoning: string;
    key_facts: string[];
    viewing_info: {
        visible_from_europe: boolean;
        best_viewing_distance_km: number;
        live_stream_recommended: boolean;
        visibility_window: string;
    };
    tags: string[];
    user_recommendation: string;
    photography_tips?: string;
    special_notes?: string[];
}

export interface AuroraOpportunity {
    date: string;
    max_kp: number;
    storm_level: string;
    probability: string;
    time_window: {
        start: string;
        end: string;
    };
    duration_hours: number;
    recommendation: string;
    viewing_tips?: string[];
    locations_by_latitude?: Record<string, string>;
}

export interface AuroraAnalysis {
    opportunities: AuroraOpportunity[];
    best_window: {
        date: string;
        time: string;
        kp: number;
        visibility_range: string;
    } | null;
    total_viewing_hours: number;
}
