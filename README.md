# ⚡ TickerStorm - Real-Time Financial Market Intelligence & Investment Portfolio Dashboard

**TickerStorm** is a production-grade, high-performance financial intelligence web application engineered with **React**, **TypeScript**, **Tailwind CSS**, a **Node.js + Express + WebSocket backend**, an atomic **Redis Hot State and Stream Layer**, and a durable **SQLite database** (via `better-sqlite3`).

Styled precisely after institutional light-mode financial layouts, TickerStorm features clean white/grey surfaces, emerald green graphs, rounded cards, dark purple/slate collapsible icon sidebar navigation, and sub-millisecond real-time market streaming.

---

## 🎨 UI/UX Layout & Sections (Matching Reference Design)

1. **Global Shell & Sidebar Navigation:**
   - **Left Sidebar (Collapsible):** Dark purple/slate (`#1E1638`) vertical navigation bar containing Home, Portfolio, Analytics, Watchlist, Settings, and Notifications.
   - **Top Header Bar:** Global search (`⌘K`), real-time WebSocket connection state, ticks/second telemetry, currency toggle (`IDR (Rp)` / `USD ($)`), simulator controls, alert creator, notification center, light/dark theme switch, and user profile avatar.

2. **Top Metric Overview Cards (Row 1):**
   - **Market Overview Card:** S&P benchmark index value (`60,021.21`, `+1.42%`) with mini emerald line graph.
   - **Your Investment Card:** Total invested capital (`$8,032`).
   - **Current Value Card:** Total portfolio valuation (`$10,125`).
   - **ROI Card:** Net Return on Investment with positive emerald badge (`+28.2%`).

3. **Investment Growth & Portfolio Distribution (Row 2):**
   - **Investment Growth Area Chart:** Emerald-green gradient area chart tracking historical portfolio value over months (May through Nov) with interactive hover tooltips and timeframe selectors (`1M`, `6M`, `1Y`, `ALL`).
   - **Your Portfolio Donut Chart:** Visual breakdown of fund distribution:
     - Large Cap Funds (45% - `$4,556.25`)
     - Diversified Funds (35% - `$3,543.75`)
     - Debt Funds (20% - `$2,025.00`)
   - **Target Portfolio Cards:** Stacked cards for custom goals:
     - **"Dream House"**: `$545,569` with `+2.5%` profit and progress bar towards $700k goal.
     - **"My Travel"**: `$345,155` with `+4.5%` profit and progress bar towards $500k goal.

4. **Interactive Stock Watchlists & Crypto Cards (Row 3):**
   - **Main Watchlist Panel:** Major indices/stocks like **S&P 500** (`4,500.48`), **NASDAQ**, **NVDA**, **AAPL**, **MSFT**, **TSLA** with live updating prices, timeframe tabs (`1d`, `7d`, `1m`, `1y`, `max`), and large live-updating area chart reflecting real-time WebSocket ticks.
   - **Side Crypto Cards:**
     - **Bitcoin (BTC):** `Rp 459,852` (or `$64,850 USD`), `+4.95%`, mini live green sparkline, `24h` badge.
     - **Dogecoin (DOGE):** `Rp 987,226` (or `$0.1425 USD`), `+7.85%`, mini live green sparkline, `24h` badge.

5. **Schemes Managed By (Row 4):**
   - Horizontal card list displaying professional fund managers:
     - **Kevin Black - Manager** (Alpha Growth Opportunity Scheme, `$1.2B AUM`, `★ 4.9`, `+24.6%` 3Y Return, `14 yrs exp`).
     - **Sarah Jenkins - Senior Portfolio Lead** (Horizon Bluechip Innovation Scheme, `$950M AUM`, `★ 4.8`, `+22.1%` 3Y Return).
     - **David Chen - Quantitative Lead** (Apex Global Macro Strategies, `$1.8B AUM`, `★ 5.0`, `+28.4%` 3Y Return).
     - **Elena Rostova - Director of Equities** (Clean Planet & Emerging Tech Scheme, `$740M AUM`, `★ 4.7`, `+19.8%` 3Y Return).

6. **Detailed Fund Tables (Row 5):**
   - **"Sectors Holding In This Online Fund":** Technology (`XLK`, 38.5%, `$3,898.12`), Financial Services (`XLF`, 22.1%, `$2,237.62`), Healthcare & Biotech (`XLV`, 16.4%, `$1,660.50`), Energy & Clean Tech (`XLE`, 12.2%, `$1,235.25`), Consumer Discretionary (`XLY`, 10.8%, `$1,093.51`).
   - **"Companies Holding in This Online Fund":**
     - **Layzoo Ltd.** (`LYZ`, 24.2%, `$1,420.50`)
     - **NightBlink Ltd.** (`NBL`, 20.1%, `$1,180.20`)
     - **Lcyflame Ltd.** (`LCY`, 16.1%, `$945.80`)
     - **Feelopie Services Ltd.** (`FLP`, 13.9%, `$820.00`)
     - **Grofler Ltd.** (`GRF`, 11.6%, `$685.40`)

---

## ⚡ Backend & Real-Time Engineering

1. **Stock & Market Simulator:**
   - Background Node.js process simulating 2,000 instruments at up to 5,000 updates/second.
   - Event payload: `{ symbol, price, previousClose, change, changePercent, sequenceNumber, timestamp, volume, high, low }`.

2. **Redis Hot State & Stream Layer:**
   - **Hashes (`price:<symbol>`):** Constant-time lookup of latest ticker quotes.
   - **Sorted Sets (`rank:gainers`, `rank:losers`):** Instant top movers calculation using Redis `ZREVRANGE` and `ZRANGE`.
   - **Redis Streams (`prices:events`):** High-throughput log of all price updates.
   - **Atomic Lua Script Threshold Alerts:** Redis Lua script atomically checks price crossings without duplicate alerts on consecutive ticks and publishes to `alerts:events`.
   - **Dual-Mode Engine:** Connects to live Redis if available; automatically provides a high-performance in-memory Redis implementation if running standalone on Windows without Redis installed.

3. **WebSocket Fan-Out & Slow-Client Backpressure Coalescing:**
   - Stateless WebSocket connections with automatic backpressure detection: if `socket.bufferedAmount > 64KB`, the server coalesces updates per symbol and flushes only the latest pending tick.

4. **Durable Relational DB (SQLite):**
   - Tables: `users`, `portfolios`, `watchlists`, `alerts`, `fund_sectors`, `fund_companies`, `fund_managers`.

---

## 🔐 User Authentication & Registration

TickerStorm includes a full-stack, secure authentication and user management system:
- **Sign In & User Registration Modal (`AuthModal.tsx`):**
  - Seamless tab toggle between **Sign In** and **Create Account**.
  - One-click **Demo Login** auto-fill (`alex.morgan@tickerstorm.io` / `password123`).
  - Interactive **Password Strength Meter** during registration.
  - Password visibility toggle (show/hide).
- **Backend Security & Relational Persistence:**
  - Password hashing via Node.js built-in `crypto.scryptSync` with cryptographic salt.
  - Automatic initialization of starter portfolios and watchlists in SQLite upon registration.
  - REST endpoints:
    - `POST /api/auth/register` - Create user account and receive token
    - `POST /api/auth/login` - Authenticate with email/password
    - `GET /api/auth/me` - Verify active bearer session
    - `POST /api/auth/logout` - Invalidate active session
- **User Account Switcher:**
  - Integrated profile dropdown in the top Navbar and Sidebar allowing users to switch accounts, register a new account, or log out.

---

## 🚀 Running the Application

### 1. Start the Full-Stack Server
```bash
# Starts both Express API, WebSocket Server, and serves production frontend
npm run server
```
Access the dashboard at: `http://localhost:8080`

### 2. Run with Vite Frontend Dev Server (HMR)
```bash
# In another terminal:
npm run dev
```
Access Vite HMR at: `http://localhost:5173`

---

## 📡 REST API & WebSocket Reference

### Real-Time Stock Market APIs:
- `GET /api/stocks` - Paginated 2,000 symbol market catalog with filters (`?search=...&limit=50&offset=0&sortBy=volume&order=desc&minPrice=...&maxPrice=...`)
- `GET /api/stocks/:symbol` - Deep single stock intelligence (live quote, Level 2 order book depth, market cap, P/E ratio, Beta, 52-week range, and RSI/MACD technical signals)
- `GET /api/stocks/:symbol/history` - Historical timeframe data points (`?timeframe=1d|7d|1m|1y`)
- `GET /api/stocks/search/autocomplete` - Fast symbol & company search lookup (`?q=...`)

### Portfolio & Fund APIs:
- `GET /api/health` - Server health, client count, sequence watermark
- `GET /api/portfolio` - Top metrics and target portfolios ("Dream House", "My Travel")
- `POST /api/portfolio/targets` - Create dynamic target portfolio goal
- `GET /api/fund/sectors` - Sectors holding in online fund
- `GET /api/fund/companies` - Companies holding in online fund (Layzoo, NightBlink, etc.)
- `GET /api/fund/managers` - Fund managers metadata

### Authentication & Alerts:
- `POST /api/auth/register` - Create user account
- `POST /api/auth/login` - User authentication
- `GET /api/auth/me` - Active session profile verification
- `POST /api/auth/logout` - Session invalidation
- `GET /api/alerts` & `POST /api/alerts` & `DELETE /api/alerts/:id` - Price threshold alert management
- `WS ws://localhost:8080` - Real-time market feed with backpressure coalescing
