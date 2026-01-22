import OpenAI from 'openai';
import { readFile, writeFile } from 'fs/promises';
import { analyzeLaunchTool, analyzeLaunch } from './tools/analyze-launch';
import { evaluateAuroraTool, evaluateAurora } from './tools/evaluate-aurora';
import type { Launch, AuroraForecast } from './types';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const MODEL_NAME = process.env.MODEL_NAME || 'gpt-4.1';

const tools = [
    analyzeLaunchTool,
    evaluateAuroraTool,
    {
        name: 'create_daily_summary',
        description: 'Creates a daily summary of top space events with statistics',
        parameters: {
            type: 'object',
            properties: {
                headline: { type: 'string', description: 'Catchy headline for the day' },
                top_events: {
                    type: 'array',
                    description: 'Top 3 most significant events',
                    items: {
                        type: 'object',
                        properties: {
                            rank: { type: 'number' },
                            title: { type: 'string' },
                            description: { type: 'string' },
                            importance: { type: 'number' },
                            date: { type: 'string' },
                            type: { type: 'string', enum: ['launch', 'aurora', 'satellite'] },
                            action: { type: 'string' }
                        }
                    }
                },
                statistics: {
                    type: 'object',
                    properties: {
                        total_launches_this_week: { type: 'number' },
                        crewed_missions: { type: 'number' },
                        historic_events: { type: 'number' },
                        aurora_opportunities: { type: 'number' }
                    }
                }
            }
        }
    },
    {
        name: 'create_alert',
        description: 'Creates a structured alert for time-sensitive events',
        parameters: {
            type: 'object',
            properties: {
                type: { type: 'string', enum: ['launch', 'aurora', 'satellite'] },
                priority: { type: 'string', enum: ['high', 'medium', 'low'] },
                title: { type: 'string' },
                message: { type: 'string' },
                action_required: { type: 'string' },
                expires_at: { type: 'string', format: 'date-time' },
                tags: { type: 'array', items: { type: 'string' } }
            },
            required: ['type', 'priority', 'title', 'message', 'action_required', 'expires_at', 'tags']
        }
    }
];

export async function runZenithAgent() {
    console.log('Starting Zenith Intelligence Agent...');
    console.log(`Timestamp: ${new Date().toISOString()}`);
    
    try {
        const SYSTEM_PROMPT = await readFile('./agents/prompts/system-prompt.md', 'utf-8');
        const launchesData = JSON.parse(await readFile('./public/data/launches.json', 'utf-8'));
        const auroraData: AuroraForecast = JSON.parse(await readFile('./public/data/aurora.json', 'utf-8'));
        
        const now = new Date();
        const upcomingLaunches = launchesData.launches
            .filter((l: Launch) => new Date(l.net) > now)
            .slice(0, 5);
        
        const relevantAuroraData = auroraData.forecast
            .filter(entry => new Date(entry.time) > now)
            .slice(0, 24);
        
        console.log(`Analyzing ${upcomingLaunches.length} launches and ${relevantAuroraData.length} aurora entries...`);
        
        const userMessage = `
Analyze space data for ${now.toISOString().split('T')[0]}:

LAUNCHES: ${JSON.stringify(upcomingLaunches)}
AURORA: ${JSON.stringify(relevantAuroraData)}

Tasks:
1. Use analyze_launch for each launch (rate 1-10)
2. Use evaluate_aurora_window (lat 52°)
3. Use create_daily_summary (top 3 events)
4. Use create_alert for high-priority events (importance 8+, Kp 7+)

Return JSON: {enrichedLaunches, auroraInsights, dailySummary, alerts, specialEvents}
`;

        const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userMessage }
        ];
        
        let response = await openai.chat.completions.create({
            model: MODEL_NAME,
            messages,
            tools: tools.map(t => ({ type: 'function' as const, function: t })),
            tool_choice: 'auto',
            temperature: 0.3,
            response_format: { type: 'json_object' }
        });
        
        let iterationCount = 0;
        const maxIterations = 20;
        
        while (response.choices[0].finish_reason === 'tool_calls' && iterationCount < maxIterations) {
            iterationCount++;
            const toolCalls = response.choices[0].message.tool_calls || [];
            
            console.log(`Processing ${toolCalls.length} tool calls (iteration ${iterationCount})...`);
            
            messages.push(response.choices[0].message);
            
            for (const toolCall of toolCalls) {
                const functionName = toolCall.function.name;
                const functionArgs = JSON.parse(toolCall.function.arguments);
                
                let functionResult;
                
                try {
                    switch (functionName) {
                        case 'analyze_launch':
                            functionResult = analyzeLaunch(functionArgs.launch_data);
                            const launchName = functionArgs.launch_data?.name || functionArgs.launch_id || 'Unknown';
                            console.log(`  ✓ Analyzed launch: ${launchName} (score: ${functionResult.importance_score})`);
                            break;
                        case 'evaluate_aurora_window':
                            functionResult = evaluateAurora(functionArgs.forecast, functionArgs.latitude || 52);
                            console.log(`  ✓ Evaluated aurora: ${functionResult.opportunities.length} opportunities found`);
                            break;
                        case 'create_daily_summary':
                            functionResult = functionArgs;
                            console.log(`  ✓ Created daily summary: "${functionArgs.headline}"`);
                            break;
                        case 'create_alert':
                            functionResult = { ...functionArgs, id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` };
                            console.log(`  ✓ Created alert: ${functionArgs.title} (${functionArgs.priority})`);
                            break;
                        default:
                            functionResult = { error: `Unknown function: ${functionName}` };
                            console.log(`  ✗ Unknown function: ${functionName}`);
                    }
                } catch (error) {
                    functionResult = { error: String(error) };
                    console.error(`  ✗ Error in ${functionName}:`, error);
                }
                
                messages.push({
                    role: 'tool',
                    tool_call_id: toolCall.id,
                    content: JSON.stringify(functionResult)
                });
            }
            
            response = await openai.chat.completions.create({
                model: MODEL_NAME,
                messages,
                tools: tools.map(t => ({ type: 'function' as const, function: t })),
                tool_choice: 'auto',
                temperature: 0.3,
                response_format: { type: 'json_object' }
            });
        }
        
        if (iterationCount >= maxIterations) {
            console.warn('Warning: Reached maximum iterations');
        }
        
        const finalContent = response.choices[0].message.content;
        if (!finalContent) {
            throw new Error('No final response from agent');
        }
        
        console.log('Parsing final response...');
        const enrichedData = JSON.parse(finalContent);
        
        const output = {
            generated_at: new Date().toISOString(),
            daily_summary: enrichedData.dailySummary || {
                headline: 'Space Activity Overview',
                top_events: [],
                statistics: {
                    total_launches_this_week: 0,
                    crewed_missions: 0,
                    historic_events: 0,
                    aurora_opportunities: 0
                }
            },
            alerts: enrichedData.alerts || [],
            aurora_insights: enrichedData.auroraInsights || {
                current_conditions: {
                    kp_index: relevantAuroraData[0]?.kp || 0,
                    storm_level: relevantAuroraData[0]?.scale || 'G0',
                    status: 'Active'
                },
                opportunities: [],
                best_window: null,
                total_viewing_hours_this_week: 0
            },
            special_events: enrichedData.specialEvents || [],
            agent_metadata: {
                model: MODEL_NAME,
                total_launches_analyzed: upcomingLaunches.length,
                total_aurora_entries_analyzed: relevantAuroraData.length,
                processing_time_seconds: 0,
                iterations: iterationCount
            }
        };
        
        await writeFile(
            './public/data/daily-insights.json',
            JSON.stringify(output, null, 2)
        );
        
        if (enrichedData.enrichedLaunches && enrichedData.enrichedLaunches.length > 0) {
            const enrichedLaunchesData = {
                generated_at: new Date().toISOString(),
                launches: upcomingLaunches.map((launch: Launch) => {
                    const enrichment = enrichedData.enrichedLaunches.find(
                        (e: any) => e.launch_id === launch.id
                    );
                    return {
                        ...launch,
                        ai_enrichment: enrichment || null
                    };
                })
            };
            
            await writeFile(
                './public/data/enriched-launches.json',
                JSON.stringify(enrichedLaunchesData, null, 2)
            );
            
            console.log('Saved enriched launches data');
        }
        
        console.log('Agent completed successfully');
        console.log(`Results:`);
        console.log(`   - Analyzed ${upcomingLaunches.length} launches`);
        console.log(`   - Found ${output.aurora_insights.opportunities?.length || 0} aurora opportunities`);
        console.log(`   - Generated ${output.alerts.length} alerts`);
        console.log(`   - Top events: ${output.daily_summary.top_events.length}`);
        console.log(`Output saved to: public/data/daily-insights.json`);
        
    } catch (error) {
        console.error('Agent failed:', error);
        throw error;
    }
}

if (require.main === module) {
    runZenithAgent()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}
