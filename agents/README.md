# Zenith Intelligence Agent

Autonomous AI agent that enriches space data with actionable insights using OpenAI GPT-4.1.

## Overview

The Zenith Intelligence Agent runs automatically every 12 hours via GitHub Actions, analyzing:
- **Rocket Launches**: Rates importance (1-10), extracts key facts, provides viewing recommendations
- **Aurora Forecasts**: Identifies optimal viewing windows, calculates visibility by latitude
- **Daily Summaries**: Curates top 3 space events with statistics
- **Alerts**: Generates time-sensitive notifications for exceptional events

## Setup

### 1. Install Dependencies

```bash
bun install openai
```

### 2. Configure Environment Variables

Add secrets to GitHub:

1. Go to your repository → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add the following secrets:
   - `OPENAI_API_KEY`: Your OpenAI API key (starts with `sk-`)
   - `MODEL_NAME` (optional): Model to use (default: `gpt-4.1`)

### 3. Enable GitHub Actions

The workflow is located at `.github/workflows/run-agent.yml` and runs:
- **Automatically**: Every 12 hours
- **Manually**: Via "Actions" tab → "Run Zenith Intelligence Agent" → "Run workflow"

## Manual Execution

Run the agent locally:

```bash
# Set environment variables
export OPENAI_API_KEY="sk-..."
export MODEL_NAME="gpt-4.1"  # Optional, defaults to gpt-4.1

# Run agent
bun agent:run
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
│   └── system-prompt.md            # Agent instructions (Markdown)
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

- **Model**: GPT-4.1 (configurable via `MODEL_NAME`)
- **Frequency**: 2 runs/day (every 12 hours)
- **Input**: ~2000 tokens/run (5 launches + 72 aurora entries)
- **Output**: ~1500 tokens/run (enriched data)
- **Cost**: ~$0.04/day = **$1.20/month** (GPT-4.1 is 20% cheaper than GPT-4o)

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

Edit `agents/prompts/system-prompt.md` to change agent behavior, scoring criteria, or output format.

### Change Model

Set `MODEL_NAME` environment variable or edit default in `zenith-intelligence-agent.ts`:

```typescript
const MODEL_NAME = process.env.MODEL_NAME || 'gpt-4.1';
```

Supported models: `gpt-4.1`, `gpt-4o`, `gpt-4-turbo`

## License

Part of the Zenith project. See main repository for license information.
