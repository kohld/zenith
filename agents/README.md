# Zenith Intelligence Agent

Autonomous AI agent that enriches space data with actionable insights using OpenAI GPT-4o.

## Overview

The Zenith Intelligence Agent runs automatically every 6 hours via GitHub Actions, analyzing:
- **Rocket Launches**: Rates importance (1-10), extracts key facts, provides viewing recommendations
- **Aurora Forecasts**: Identifies optimal viewing windows, calculates visibility by latitude
- **Daily Summaries**: Curates top 3 space events with statistics
- **Alerts**: Generates time-sensitive notifications for exceptional events

## Setup

### 1. Install Dependencies

```bash
bun install openai
```

### 2. Configure OpenAI API Key

Add your OpenAI API key to GitHub Secrets:

1. Go to your repository → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: `OPENAI_API_KEY`
4. Value: Your OpenAI API key (starts with `sk-`)

### 3. Enable GitHub Actions

The workflow is located at `.github/workflows/run-agent.yml` and runs:
- **Automatically**: Every 12 hours
- **Manually**: Via "Actions" tab → "Run Zenith Intelligence Agent" → "Run workflow"

## Manual Execution

Run the agent locally:

```bash
# Set API key
export OPENAI_API_KEY="sk-..."

# Run agent
bun run agents/zenith-intelligence-agent.ts
```

## Output Files

The agent generates two files:

### `public/data/daily-insights.json`
Main output consumed by the Dashboard component:
- Daily summary with top 3 events
- Active alerts (high/medium/low priority)
- Aurora insights and opportunities
- Statistics (launches, crewed missions, etc.)

### `public/data/enriched-launches.json`
Enhanced launch data with AI analysis:
- Importance scores (1-10)
- Key facts and reasoning
- Viewing recommendations
- Photography tips
- Tags for filtering

## Architecture

```
agents/
├── zenith-intelligence-agent.ts    # Main agent orchestrator
├── prompts/
│   └── system-prompt.ts            # Agent instructions and guidelines
├── tools/
│   ├── analyze-launch.ts           # Launch importance scoring
│   └── evaluate-aurora.ts          # Aurora opportunity detection
└── types.ts                        # TypeScript interfaces
```

## Agent Workflow

1. **Load Data**: Reads `launches.json` and `aurora.json`
2. **Filter**: Selects next 10 launches and 72h aurora forecast
3. **Analyze**: Calls OpenAI with function calling tools
4. **Process Tools**: Executes `analyze_launch`, `evaluate_aurora_window`, etc.
5. **Generate Output**: Creates structured JSON with insights
6. **Save**: Writes to `daily-insights.json` and `enriched-launches.json`
7. **Commit**: GitHub Action commits changes to repository

## Cost Estimation

- **Model**: GPT-4o
- **Frequency**: 2 runs/day (every 12 hours)
- **Input**: ~2000 tokens/run (10 launches + 72 aurora entries)
- **Output**: ~1500 tokens/run (enriched data)
- **Cost**: ~$0.05/day = **$1.50/month**

## Customization

### Adjust Latitude

Change observer latitude in `zenith-intelligence-agent.ts`:

```typescript
functionResult = evaluateAurora(functionArgs.forecast, 60); // Change from 52 to your latitude
```

### Modify Scoring

Edit importance calculation in `agents/tools/analyze-launch.ts`:

```typescript
function calculateImportance(launch: Launch): number {
    let score = 5;
    // Add your custom scoring logic
    return score;
}
```

### Change Schedule

Edit `.github/workflows/run-agent.yml`:

```yaml
on:
  schedule:
    - cron: '0 */3 * * *'  # Every 3 hours instead of 12
```

## Troubleshooting

### Agent fails with "No API key"
- Ensure `OPENAI_API_KEY` is set in GitHub Secrets
- For local runs, export the environment variable

### No changes committed
- Check if data actually changed (agent skips commits if no changes)
- Verify GitHub Actions has write permissions

### High API costs
- Reduce run frequency in workflow schedule
- Limit number of launches analyzed (change `.slice(0, 10)` to `.slice(0, 5)`)

### Tool call errors
- Check OpenAI API status
- Verify tool function signatures match definitions
- Review agent logs in GitHub Actions

## Development

### Test Locally

```bash
# Run agent with debug output
bun run agents/zenith-intelligence-agent.ts

# Check generated files
cat public/data/daily-insights.json | jq .
```

### Add New Tools

1. Create tool file in `agents/tools/`
2. Export tool definition and function
3. Import and add to `tools` array in `zenith-intelligence-agent.ts`
4. Add case in tool execution switch statement
5. Update system prompt with tool usage guidelines

### Modify System Prompt

Edit `agents/prompts/system-prompt.ts` to change agent behavior, scoring criteria, or output format.

## License

Part of the Zenith project. See main repository for license information.
