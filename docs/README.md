# Documentation Index

## Active Documentation

### AI Assistant
- **LOVABLE_ROLE.md** - AI assistant directives and role definition (auto-heal + auto-optimize mode)

### Architecture
- **SIMPLE_MODE_ARCHITECTURE.md** - Core architecture overview, data sources, and development guidelines

### API Integration
- **COINGLASS_API.md** - CoinGlass API integration guide, endpoints, and usage patterns

### Library Reference
- **LIBRARY_REFERENCE.md** - Library versions and API patterns (lightweight-charts, React, etc.)

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
