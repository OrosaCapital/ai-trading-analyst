# Documentation Index

## Active Documentation

### AI Assistant
- **LOVABLE_ROLE.md** - AI assistant directives and role definition (auto-heal + auto-optimize mode)

### Architecture
- **SIMPLE_MODE_ARCHITECTURE.md** - Core architecture overview, data sources, and development guidelines

### Library Reference
- **LIBRARY_REFERENCE.md** - Library versions and API patterns (lightweight-charts, React, etc.)

## Project Overview

This is a **Simple Mode Trading Dashboard** built with:
- React + TypeScript
- TradingView Lightweight Charts
- Local technical indicators
- Minimal external APIs (Tatum + WebSocket only)

All external derivative APIs (CoinGlass, CoinMarketCap, etc.) have been removed in favor of local chart-based analysis.

## Quick Start

1. Review `SIMPLE_MODE_ARCHITECTURE.md` for system overview
2. Check `LIBRARY_REFERENCE.md` for library API patterns
3. Main entry point: `src/pages/TradingDashboard.tsx`
4. Local indicators: `src/components/trading/LocalIndicatorsPanel.tsx`

## Key Principles

- **Local-first**: All indicators calculated from chart data
- **No derivatives**: No external derivative data integrations
- **WebSocket-only**: Real-time updates via WebSocket
- **Simple & fast**: Minimal architecture, maximum performance
