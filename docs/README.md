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
- Minimal external APIs (Tatum + WebSocket + CoinGlass only)

CoinGlass API is used exclusively for Trading Dashboard sidebar market metrics (funding rate, open interest, liquidations, long/short ratio).

## Quick Start

1. Review `SIMPLE_MODE_ARCHITECTURE.md` for system overview
2. Check `LIBRARY_REFERENCE.md` for library API patterns
3. Main entry point: `src/pages/TradingDashboard.tsx`
4. Local indicators: `src/components/trading/LocalIndicatorsPanel.tsx`

## Key Principles

- **Local-first**: All technical indicators calculated from chart data
- **CoinGlass metrics**: Market data for Trading Dashboard sidebar only
- **WebSocket-only**: Real-time price updates via WebSocket
- **Simple & fast**: Minimal architecture, maximum performance
