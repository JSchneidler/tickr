# Tickr — Full Project Refresher

## What Tickr Is

A cryptocurrency trading simulator where users get $100,000 of virtual money to trade 7 supported coins (Bitcoin, Ethereum, Ripple, Dogecoin, Binancecoin, Solana, Tron) with real-time prices from Finnhub. Market and limit orders are matched by a server-side trade engine as prices move.

---

## Repository Structure

**Two separate git repos** under one VS Code workspace — not a monorepo:

```
/tickr/
├── client/          ← separate .git, React frontend
├── server/          ← separate .git, Fastify backend
├── workspace.code-workspace
├── AGENTS.md
├── binance-tickers.json   (reference data)
└── exchanges.json         (reference data)
```

Each side has independent `pnpm-lock.yaml`, `node_modules/`, `.husky/`, `.github/workflows/`, and deploys independently.

---

## Server Architecture (`/server`)

**Stack:** Fastify 5 + Prisma (SQLite) + TypeBox + WebSocket + JWT

### Boot Sequence (`src/index.ts`)

1. Start **TradeFeed** — connects to Finnhub WebSocket for live crypto prices
2. Start **TradeEngine** — loads all unfilled orders from DB, begins matching
3. Register Swagger (OpenAPI docs at `/docs`)
4. Register Cookie + JWT auth plugins
5. Register WebSocket plugin
6. Register CORS (localhost:5173 + *.tickr.jschneidler.com)
7. Mount all API routes under `/api`
8. Listen on `0.0.0.0:3000`

### Feature-Based Module Pattern

Every feature follows the same structure:

```
feature/
├── feature.routes.ts      → Route definitions + TypeBox request/response schemas
├── feature.controller.ts  → Thin handlers: extract params, call service, return
├── feature.schema.ts      → TypeBox schemas (runtime validation + types)
└── feature.service.ts     → Business logic + Prisma DB calls
```

Modules: `auth/`, `user/`, `coin/`, `order/`, `holding/`, `token/`

### API Endpoints

| Area | Endpoint | Auth | Purpose |
|------|----------|------|---------|
| **Auth** | `POST /api/auth/register` | — | Create account ($100k starting balance) |
| | `POST /api/auth/login` | — | Login, get JWT cookie |
| | `POST /api/auth/logout` | User | Clear cookie (TODO: revoke token) |
| **Me** | `GET /api/me/` | User | Current user profile |
| | `GET /api/me/holdings` | User | My portfolio positions |
| | `GET /api/me/orders` | User | My orders |
| | `GET /api/me/tokens` | User | My API access tokens |
| **Coins** | `GET /api/coins/` | — | All coins with current prices (from CoinGecko) |
| | `GET /api/coins/:id` | — | Single coin details |
| | `GET /api/coins/:id/historical/:daysAgo` | — | Historical price/volume/mcap data |
| **Orders** | `POST /api/orders/` | User | Create buy/sell order |
| | `DELETE /api/orders/:id` | User | Cancel unfilled order |
| | `GET /api/orders/` | Admin | All orders |
| **Holdings** | `GET /api/holdings/` | Admin | All user holdings |
| **Tokens** | `POST /api/tokens/` | User | Create API access token |
| **Users** | `GET/PATCH/DELETE /api/users/:id` | Admin | User management |
| | Nested `/token/`, `/holding/`, `/order/` | Admin | Manage user sub-resources |
| **WebSocket** | `GET /api/ws` | User | Real-time price feed + order fill notifications |

### Authentication System

- **Password storage:** PBKDF2 with SHA-256, 310,000 iterations, 16-byte random salt per user, timing-safe comparison
- **JWT:** HS256, 7-day expiry, stored in signed httpOnly cookie
- **Route protection decorators:** `f.authenticate` (verifies JWT, loads user), `f.admin` (authenticate + role check)
- Token hash stored in `AccessToken` table; raw token only returned once at creation
- **Known gap:** Logout clears cookie but doesn't revoke the JWT server-side

### Database (Prisma + SQLite)

**Models:**
- **User** — email (unique), name, balance (Decimal), deposits (Decimal), role (USER/ADMIN), password_hash, salt
- **Coin** — externalId, name, displayName, imageUrl, description
- **Order** — userId, coinId, direction (BUY/SELL), type (MARKET/LIMIT), shares?, price?, filled, sharePrice, totalPrice
- **Holding** — userId, coinId (unique together), shares (Decimal), cost (Decimal) — tracks cost basis for P&L
- **AccessToken** — userId, name, token_hash, revokedAt
- **AdminAction** — actorId, targetUserId, type (VIEW_USER_HOLDINGS/BAN_USER) — exists but unused

All financial fields use Prisma's `Decimal` type. Migrations via `prisma db push` (not Prisma migrate).

---

## Real-Time System — The Core of Tickr

This is the most architecturally interesting part. Three subsystems work together:

### 1. TradeFeed (`src/apis/tradeFeed.ts`)

- Opens a single WebSocket to `wss://ws.finnhub.io`
- Subscribes to `BINANCE:{COIN}USDT` symbols for 7 coins
- Maintains in-memory OHLC summaries per coin (high, low, last price)
- **Every 1 second:** publishes current summaries to all subscribers, then resets high/low
- Subscribers are the TradeEngine and the WebSocket handler
- Known TODOs: possible race condition in publish cycle; wants to publish immediately instead of on interval

### 2. TradeEngine (`src/tradeEngine/index.ts`)

Singleton that matches orders against live prices:

- **On startup:** loads all unfilled orders from DB, subscribes each to its coin's price feed
- **On new order:** subscribes to coin feed if not already
- **On each price update** from TradeFeed, runs `processOrders()`:

**Market orders:**
- BUY → executes at `summary.low` (best buy price in interval)
- SELL → executes at `summary.high` (best sell price in interval)

**Limit orders:**
- BUY → executes if `summary.low ≤ limit price`
- SELL → executes if `summary.high ≥ limit price`

**Fill process (BUY):**
1. Verify user balance ≥ cost
2. Calculate shares (if order specified dollar amount instead of share count)
3. Upsert Holding — increment shares and cost basis
4. Decrement user balance
5. Mark order as filled with sharePrice + totalPrice
6. Notify user via WebSocket if connected

**Fill process (SELL):**
1. Verify user has enough shares in holding
2. Decrement holding shares + cost; delete holding if emptied
3. Increment user balance
4. Mark order filled, notify via WebSocket

- Known TODO: possible Decimal precision errors in balance updates
- Known gap: no DB transactions — a crash mid-fill could leave inconsistent state

### 3. WebSocket Handler (`src/websocketHandler.ts`)

- Client connects to `GET /api/ws` (requires auth)
- Registers user in TradeEngine's `liveUsers` map
- **Every 1 second:** sends `WATCH` message with all current live prices
- **On order fill:** sends `ORDER_FILLED` message with the complete Order object
- On disconnect: removes from liveUsers (orders still execute; user just misses the notification)

**Message formats:**
```
{ type: "WATCH", payload: [{ coinId: number, price: string }, ...] }
{ type: "ORDER_FILLED", payload: Order }
```

### Order Lifecycle Summary

```
User creates order (POST /api/orders)
  → Validation (sell: check sufficient shares minus pending sells)
  → Save to DB (filled=false)
  → Add to TradeEngine
  → TradeEngine subscribes to coin's price feed
  → Price updates arrive every ~1s from Finnhub
  → TradeEngine checks if conditions met
  → If matched: fill order, update DB, notify via WebSocket
  → Client receives ORDER_FILLED, refreshes portfolio data
```

---

## Client Architecture (`/client`)

**Stack:** React 18 + Vite 6 (SWC) + Redux Toolkit + RTK Query + Mantine 7 + Decimal.js

### State Management

```
Redux Store
├── api          ← RTK Query (all server data: user, coins, holdings, orders)
├── livePrices   ← Entity Adapter slice (real-time prices from WebSocket)
└── theme        ← UI theme (primary color)
```

**Key architectural decision:** Live prices live in a separate Redux slice, not RTK Query, because they update every second from WebSocket and don't follow request/response patterns.

### WebSocket Middleware (`store/webSocketMiddleware.ts`)

Custom Redux middleware that:
- Creates a `WebSocketClient` instance on load
- **On login/register/logout fulfilled:** disconnects and reconnects WebSocket (new auth context)
- Attaches two listeners:
  - **WATCH** → dispatches `pricesUpdated()` to livePrices slice
  - **ORDER_FILLED** → shows Mantine notification + invalidates User/Holding/Order RTK Query tags

### RTK Query (`store/api/index.ts`)

- Base URL: `http://{hostname}:3000/api`, credentials: include
- Cache tags: `User`, `Coin`, `Holding`, `Order`
- **Optimistic updates:** `createOrder` adds placeholder to cache; `deleteOrder` removes immediately
- **Logout:** calls `api.util.resetApiState()` to wipe all cached data
- **Lazy queries:** Holdings and Orders use lazy queries, triggered only when user is logged in

### Component Tree

```
App (MantineProvider, Router, ErrorBoundary)
├── Header
│   ├── Auth Modal (Login / Register forms)
│   ├── User info: balance, portfolio value, P&L
│   └── Theme toggle (dark/light)
└── Trade (main page, "/" route)
    ├── CoinSelector (segmented control showing all coins with live prices)
    └── [when coin selected]
        ├── Coin info (name, live price, change)
        ├── Price range (day high/low)
        ├── Chart (historical data OR live streaming chart)
        ├── TradeForm (if logged in)
        │   ├── Quantity input (toggle: shares or dollars)
        │   ├── Buy / Sell buttons (with balance/holding validation)
        │   └── "All" quick-fill button
        ├── Holding (current position: shares, value, cost avg)
        └── Orders (unfilled orders with cancel buttons)
```

**Other routes** (`/trade`, `/portfolio`, `/account`, `/settings`) exist in the router but render placeholder content.

### Key Custom Hooks

**`useLivePrice(coinId)`** — Returns `{ price, change, changePercent }` by combining RTK Query coin data with Redux live price. Falls back to `coin.currentPrice` when no live price available. Change is calculated against `dayLow` (TODO: should use 24h-ago price).

**`usePortfolioValue()`** — Returns `{ value, change, changePercent }`. Sums `user.balance` + each holding's `shares * livePrice`. P&L = value - deposits.

### Data Flow: Price Update → UI

```
Finnhub WS → TradeFeed (server) → WebSocket WATCH message
  → WebSocketClient (browser) → WebSocket middleware
  → dispatch(pricesUpdated()) → livePrices Redux slice
  → useLivePrice hook re-evaluates → components re-render
  → Dollars/Gain/Chart components show new price
```

### Data Flow: Order Fill → UI

```
TradeEngine fills order → WebSocket ORDER_FILLED message
  → WebSocket middleware
  → Shows Mantine notification ("BUY@$45,000 0.5 of Bitcoin")
  → Invalidates User + Holding + Order RTK Query tags
  → RTK Query re-fetches: new balance, updated holdings, order marked filled
  → Components re-render with fresh data
```

---

## External API Integrations

### Finnhub (`src/apis/finnhub_api.ts` + `tradeFeed.ts`)
- **WebSocket:** `wss://ws.finnhub.io` — real-time trade data for crypto pairs
- **REST:** `https://finnhub.io/api/v1` — quotes, exchange/coin listings (partially used)

### CoinGecko (`src/apis/coingecko_api.ts`)
- Coin metadata (name, description, image)
- Current prices (`/simple/price`)
- OHLC data (`/coins/{id}/ohlc`)
- Historical charts (`/coins/{id}/market_chart`)
- Auth: `x-cg-demo-api-key` header

---

## Known TODOs & Gaps in the Code

| Location | Issue |
|----------|-------|
| `tradeEngine/index.ts:141` | "Causing precision errors?" — Decimal arithmetic in balance updates |
| `tradeFeed.ts:99` | "Race condition?" — publish may not finish before next publish |
| `tradeFeed.ts:43` | Wants to publish immediately instead of on 1s interval |
| `user.service.ts:11` | DEFAULT_BALANCE hardcoded, wants DB-configurable |
| `user.service.ts:19` | User+token creation should be a transaction |
| `auth.controller.ts:46` | Logout doesn't actually revoke JWT |
| `webSocketMiddleware.ts:24` | ORDER_FILLED notification may fail if coin not in RTK cache |
| `useLivePrice.ts:22` | Change should use 24h-ago price, not dayLow |
| `Chart.tsx:55` | Unclear why useLayoutEffect prevents chart flashing |
| `Header.tsx:103` | Auth modal closes even if login/register fails |
| `api/index.ts:50` | Logout should manually clear private Redux state |
| `AdminAction` model | Exists in schema but never used |
| `BAN_USER` enum | Defined but not implemented |
| `LIMIT` order type | Defined in TradeForm UI toggle but input not fully wired |
| No test framework | Pre-commit hooks have `pnpm test` commented out |
| No auto-reconnect | WebSocket doesn't reconnect on unexpected disconnect |
| No DB transactions | Order fills aren't wrapped in transactions |

---

## Development Commands

```bash
# Server
cd server
pnpm install
pnpm db:migrate        # Push Prisma schema to SQLite
pnpm db:fetch_coins    # Seed coins from CoinGecko
pnpm dev               # tsx watch on :3000

# Client
cd client
pnpm install
pnpm dev               # Vite on :5173

# Linting (both sides)
pnpm lint              # tsc + eslint + prettier

# Production build (client only)
pnpm build             # tsc -b && vite build → dist/
```

---

## Deployment

Both deploy to `tickr.jschneidler.com` via GitHub Actions on push to `main`:

- **Server:** SSH → `git pull` → `docker compose up --build -d` (Fastify on port 3000)
- **Client:** Build in CI → SCP `dist/` → nginx serves static files on port 80
