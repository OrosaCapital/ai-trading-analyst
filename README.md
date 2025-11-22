# AI Trading Analyst — Indicator Library

Quick notes for running the indicator demos and tests included in this workspace.

Prerequisites
- Node.js (14+ recommended)

Run the demo that computes indicators on synthetic candles:

```bash
node ai-trading-analyst/scripts/demo_indicators_run.js
```

Load indicator presets (quick check):

```bash
node ai-trading-analyst/scripts/demo_presets_run.js
```

Run unit tests (lightweight runner included):

```bash
cd "Dev Environment/websites/cc.com" || true
node ../ai-trading-analyst/test/run_tests.js
```

Or from workspace root:

```bash
node ai-trading-analyst/test/run_tests.js
```

Files of interest
- `src/lib/indicators.js` — indicator implementations (SMA, EMA, RSI, MACD, VWAP, ATR, Bollinger, Stochastic, CCI, ROC, OBV, CMF, ADX, Parabolic SAR, TRIX, Keltner)
- `src/config/indicator-presets.json` — UI presets and timeframe presets
- `scripts/demo_indicators_run.js` — demo runner computing indicators on synthetic candles
- `test/` — simple unit tests and runner

Notes
- Implementations are intentionally clear and readable for demo and UI purposes; production use should consider numeric stability and edge-case handling.
# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/62734819-b350-4551-a8d6-394251dec173

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/62734819-b350-4551-a8d6-394251dec173) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/62734819-b350-4551-a8d6-394251dec173) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
