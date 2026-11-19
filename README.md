# TickerStorm - Real-Time Financial Market Dashboard

TickerStorm is a high-performance financial intelligence web application built with React, TypeScript, Tailwind CSS, Node.js/Express, WebSockets, Redis, and SQLite.

## Features

**Real-Time Market Data**
- 2,000+ instruments streaming at configurable rates (up to 5,000 updates/second)
- Sub-millisecond WebSocket feed with automatic backpressure coalescing
- Live price charts with multiple timeframes (1d, 7d, 1m, 1y, max)

**Portfolio Management**
- Live portfolio valuation with real-time P&L
- Asset allocation breakdown (equities, crypto, funds)
- Risk metrics: beta, Sharpe ratio, volatility
- Custom target goals with progress tracking

**Watchlist & Screening**
- Personal watchlist with star/unstar actions
- Full market screener (2,000+ symbols) with search, sort, and filter
- Top gainers/losers with real-time ranking

**Price Alerts**
- Configurable threshold alerts (above/below)
- Instant WebSocket notifications when triggered
- Custom labels for strategy notes

**Currency Support**
- Toggle between USD ($) and IDR (Rp)
- All prices convert in real-time across the dashboard

**Authentication**
- Secure user registration and login
- Password hashing with scrypt
- JWT-based session management
- Multi-account support

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Tailwind CSS, Vite |
| Backend | Node.js, Express, WebSocket (ws) |
| Real-Time State | Redis (hashes, sorted sets, streams, Lua scripts) |
| Database | SQLite (better-sqlite3) |
| Auth | crypto.scryptSync, Bearer tokens |

## Architecture

- **Market Simulator**: Generates synthetic ticks for 2,000 symbols
- **Redis Hot State**: Hashes for quotes, sorted sets for rankings, streams for event log
- **Alert Engine**: Atomic Lua scripts evaluate thresholds without duplicates
- **WebSocket Server**: Fans out updates with 64KB backpressure coalescing
- **SQLite**: Persistent storage for users, portfolios, alerts, fund data

## Getting Started

### Prerequisites
- Node.js 18+
- npm or bun

### Install Dependencies
```bash
npm install
```

### Run Development (Frontend + Backend)
```bash
# Terminal 1 - Backend API + WebSocket
npm run server

# Terminal 2 - Vite dev server with HMR
npm run dev
```

- Backend: http://localhost:8080
- Frontend (dev): http://localhost:3000 (proxies `/api` to backend)

### Production Build
```bash
npm run build
npm run server
```
Serves the built frontend from Express at http://localhost:8080

## Project Structure

```
src/
├── components/       # React components (dashboard, tables, modals, charts)
├── context/          # React context (Auth, Market data)
├── hooks/            # Custom hooks (virtual scroll)
├── services/         # WebSocket, mock data, mock server
├── types/            # TypeScript types
├── utils/            # Currency formatting, audio
├── App.tsx           # Main app with routing/layout
└── main.tsx          # Entry point

server/
├── server.js         # Express + WebSocket server
├── db.js             # SQLite schema and queries
├── redisLayer.js     # Redis hashes, sorted sets, streams, Lua alerts
└── simulator.js      # 2,000 symbol market simulator
```

## API Endpoints

### Market Data
- `GET /api/stocks` - Paginated catalog with search/sort/filter
- `GET /api/stocks/:symbol` - Deep quote with order book, fundamentals, technicals
- `GET /api/stocks/:symbol/history` - Historical candles
- `GET /api/stocks/search/autocomplete` - Fast symbol search

### Portfolio
- `GET /api/portfolio` - Overview metrics and target goals
- `POST /api/portfolio/targets` - Create target goal

### Fund Data
- `GET /api/fund/sectors` - Sector allocations
- `GET /api/fund/companies` - Top holdings

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Verify session
- `POST /api/auth/logout` - Logout

### Alerts
- `GET /api/alerts` - List alerts
- `POST /api/alerts` - Create alert
- `DELETE /api/alerts/:id` - Delete alert

### WebSocket
- `ws://localhost:8080` - Real-time feed (snapshot, ticker updates, top movers, alerts)

## Configuration

Environment variables (`.env`):
```
PORT=8080
REDIS_URL=redis://localhost:6379  # Optional, falls back to in-memory Redis
```

## License

MIT