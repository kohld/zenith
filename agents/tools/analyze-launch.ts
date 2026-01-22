import { Launch, LaunchAnalysis } from '../types';

export const analyzeLaunchTool = {
    name: 'analyze_launch',
    description: 'Analyzes a rocket launch and returns importance score, key facts, and viewing recommendations',
    parameters: {
        type: 'object',
        properties: {
            launch_id: { type: 'string', description: 'Launch ID from launches.json' },
            launch_data: { 
                type: 'object', 
                description: 'Full launch object with name, rocket, mission, etc.' 
            }
        },
        required: ['launch_id', 'launch_data']
    }
};

export function analyzeLaunch(launch: any): LaunchAnalysis {
    // Defensive check for malformed launch objects
    if (!launch || typeof launch !== 'object') {
        return {
            launch_id: 'unknown',
            importance_score: 5,
            reasoning: 'Unable to analyze launch due to missing data',
            key_facts: [],
            viewing_info: {
                visible_from_europe: false,
                best_viewing_distance_km: 50,
                live_stream_recommended: true,
                visibility_window: '10 minutes before to 5 minutes after liftoff'
            },
            tags: [],
            user_recommendation: 'Standard mission'
        };
    }
    
    const importance = calculateImportance(launch);
    const keyFacts = extractKeyFacts(launch);
    const viewability = calculateViewability(launch);
    const tags = generateTags(launch);
    
    return {
        launch_id: launch.id || 'unknown',
        importance_score: importance,
        reasoning: generateReasoning(launch, importance),
        key_facts: keyFacts,
        viewing_info: viewability,
        tags,
        user_recommendation: generateRecommendation(launch, importance),
        photography_tips: importance >= 7 ? generatePhotographyTips(launch) : undefined,
        special_notes: importance >= 8 ? generateSpecialNotes(launch) : undefined
    };
}

function calculateImportance(launch: Launch): number {
    let score = 5;
    
    // Handle missing mission data
    if (!launch || !launch.mission) {
        return score;
    }
    
    const missionType = launch.mission.type?.toLowerCase() || '';
    if (missionType.includes('human') || missionType.includes('crew')) {
        score += 3;
    }
    
    const rocketName = launch.rocket?.configuration?.full_name?.toLowerCase() || '';
    if (rocketName.includes('heavy') || rocketName.includes('starship')) {
        score += 2;
    }
    
    if (launch.rocket?.configuration?.maiden_flight === launch.net) {
        score += 2;
    }
    
    if (launch.program?.some(p => p.name?.toLowerCase().includes('artemis'))) {
        score += 3;
    }
    
    const orbitName = launch.mission?.orbit?.name?.toLowerCase() || '';
    if (orbitName.includes('heliocentric') || orbitName.includes('lunar')) {
        score += 2;
    }
    
    const launchName = launch.name?.toLowerCase() || '';
    if (launchName.includes('test flight') && rocketName.includes('starship')) {
        score += 1;
    }
    
    return Math.min(10, score);
}

function extractKeyFacts(launch: Launch): string[] {
    const facts: string[] = [];
    
    if (launch.rocket?.configuration?.full_name) {
        facts.push(`Rocket: ${launch.rocket.configuration.full_name}`);
    }
    
    if (launch.pad?.location?.name) {
        facts.push(`Launch Site: ${launch.pad.location.name}`);
    }
    
    if (launch.mission?.orbit?.name) {
        facts.push(`Target Orbit: ${launch.mission.orbit.name}`);
    }
    
    if (launch.rocket?.configuration?.reusable) {
        facts.push('Reusable rocket design');
    }
    
    if (launch.mission?.type) {
        facts.push(`Mission Type: ${launch.mission.type}`);
    }
    
    if (launch.program && launch.program.length > 0) {
        facts.push(`Program: ${launch.program.map(p => p.name).join(', ')}`);
    }
    
    return facts;
}

function calculateViewability(launch: Launch): LaunchAnalysis['viewing_info'] {
    const locationName = launch.pad?.location?.name?.toLowerCase() || '';
    const visibleFromEurope = locationName.includes('kennedy') || 
                              locationName.includes('cape canaveral') ||
                              locationName.includes('vandenberg');
    
    return {
        visible_from_europe: visibleFromEurope,
        best_viewing_distance_km: 50,
        live_stream_recommended: true,
        visibility_window: '10 minutes before to 5 minutes after liftoff'
    };
}

function generateTags(launch: Launch): string[] {
    const tags: string[] = [];
    
    const rocketName = launch.rocket?.configuration?.full_name?.toLowerCase() || '';
    if (rocketName.includes('falcon')) tags.push('SpaceX');
    if (rocketName.includes('starship')) tags.push('SpaceX', 'Starship');
    if (rocketName.includes('sls')) tags.push('NASA');
    if (rocketName.includes('ariane')) tags.push('ESA');
    
    const missionType = launch.mission?.type?.toLowerCase() || '';
    if (missionType.includes('human') || missionType.includes('crew')) {
        tags.push('Crewed');
    }
    
    if (launch.program?.some(p => p.name?.toLowerCase().includes('artemis'))) {
        tags.push('Artemis', 'Moon');
    }
    
    if (launch.rocket?.configuration?.reusable) {
        tags.push('Reusable');
    }
    
    if (launch.rocket?.configuration?.maiden_flight === launch.net) {
        tags.push('Maiden Flight', 'Historic');
    }
    
    const launchName = launch.name?.toLowerCase() || '';
    if (launchName.includes('test')) {
        tags.push('Test Flight');
    }
    
    return [...new Set(tags)];
}

function generateReasoning(launch: Launch, importance: number): string {
    const reasons: string[] = [];
    
    if (importance >= 9) {
        if (launch.mission?.type?.toLowerCase().includes('human')) {
            reasons.push('Historic crewed mission');
        }
        if (launch.program?.some(p => p.name.toLowerCase().includes('artemis'))) {
            reasons.push('Part of Artemis lunar program');
        }
        if (launch.rocket.configuration.maiden_flight === launch.net) {
            reasons.push('First flight of new rocket');
        }
    } else if (importance >= 7) {
        if (launch.rocket.configuration.full_name.toLowerCase().includes('starship')) {
            reasons.push('Starship test flight advancing Mars mission capabilities');
        }
        if (launch.rocket.configuration.full_name.toLowerCase().includes('heavy')) {
            reasons.push('Heavy-lift launch vehicle');
        }
    } else if (importance >= 5) {
        reasons.push('Standard operational mission');
    } else {
        reasons.push('Routine launch');
    }
    
    return reasons.join('. ') + '.';
}

function generateRecommendation(launch: Launch, importance: number): string {
    if (importance >= 9) {
        return '⭐ UNMISSABLE EVENT! This is a historic mission. Clear your schedule and watch live.';
    } else if (importance >= 7) {
        return 'Highly recommended! This is a significant mission worth watching.';
    } else if (importance >= 5) {
        return 'Worth watching if you\'re interested in space launches.';
    } else {
        return 'Standard mission. Skip unless you\'re a completionist or near the launch site.';
    }
}

function generatePhotographyTips(launch: Launch): string {
    const tips: string[] = [];
    
    tips.push('Telephoto lens (200-400mm) recommended');
    tips.push('Tripod essential for stability');
    tips.push('Remote trigger to avoid camera shake');
    tips.push('Shoot in RAW format');
    tips.push('Bracket exposures for HDR');
    
    if (launch.rocket.configuration.full_name.toLowerCase().includes('starship')) {
        tips.push('Wide-angle lens (14-24mm) for full vehicle capture');
        tips.push('ND filter for flame closeups');
    }
    
    return tips.join('. ') + '.';
}

function generateSpecialNotes(launch: Launch): string[] {
    const notes: string[] = [];
    
    if (launch.mission?.type?.toLowerCase().includes('human')) {
        notes.push('Crewed mission - extra safety protocols in place');
        notes.push('Launch window may be more constrained');
    }
    
    if (launch.program?.some(p => p.name.toLowerCase().includes('artemis'))) {
        notes.push('Part of NASA\'s Artemis program to return humans to the Moon');
        notes.push('Mission duration and milestones will be announced closer to launch');
    }
    
    if (launch.rocket.configuration.maiden_flight === launch.net) {
        notes.push('First flight - higher risk of delays or scrubs');
        notes.push('Extensive testing and checkouts expected');
    }
    
    return notes;
}
