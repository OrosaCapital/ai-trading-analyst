# AI Trading Analyst — Docs Index

This folder contains operational and developer documentation for the `ai-trading-analyst` relay backend and adapters.

Available documents
- `backend.md` — Architecture overview and components
- `setup.md` — Installation and run instructions (macOS / zsh focused)
- `troubleshooting.md` — Common errors and how to resolve them
- `tests.md` — How to run the smoke and unit tests

If you need a printable or condensed README for hand-offs, copy the sections you need.
# Documentation Index

## Active Documentation

### AI Assistant
- **LOVABLE_ROLE.md** - AI assistant directives and role definition (auto-heal + auto-optimize mode)

### Architecture
- **SIMPLE_MODE_ARCHITECTURE.md** - Core architecture overview, data sources, and development guidelines
- **DATA_FLOW_DIAGRAM.md** - Visual data flow from APIs through database to AI analysis

### API Integration
- **COINGLASS_API.md** - CoinGlass API integration guide, endpoints, and usage patterns

### Library Reference
- **LIBRARY_REFERENCE.md** - Library versions and API patterns (lightweight-charts, React, etc.)

### Fixes & Maintenance
- **fixes/CHANGELOG.md** - Complete history of bug fixes, optimizations, and system improvements
- **fixes/KNOWN_ISSUES.md** - Active and resolved issues with detailed tracking
- **fixes/SYSTEM_SUMMARY.md** - High-level overview of how the system works (start here for new developers/AI)

## Project Overview

This is a **Simple Mode Trading Dashboard** built with:
- React + TypeScript
- TradingView Lightweight Charts
- Local technical indicators
- Minimal external APIs (CoinMarketCap + WebSocket + CoinGlass)

CoinGlass API provides real-time market data including funding rates, exchange coverage, and derivatives metrics.

## Quick Start

1. Review `SIMPLE_MODE_ARCHITECTURE.md` for system overview
2. Check `COINGLASS_API.md` for API integration patterns
3. Check `LIBRARY_REFERENCE.md` for library API patterns
4. Main entry point: `src/pages/TradingDashboard.tsx`
5. Local indicators: `src/components/trading/LocalIndicatorsPanel.tsx`

## Key Principles

- **Local-first**: All technical indicators calculated from chart data
- **CoinGlass integration**: Real-time funding rates, exchange pairs, market coverage
- **WebSocket-only**: Real-time price updates via WebSocket
- **Simple & fast**: Minimal architecture, maximum performance
