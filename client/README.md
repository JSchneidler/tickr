# Tickr Client

React SPA for the Tickr trading simulator. Provides real-time price display, order placement, and portfolio management.

## Tech Stack

- **React 19** with Vite 7 (SWC plugin)
- **Mantine 8** — UI components, charts, forms, notifications
- **Redux Toolkit** — State management + RTK Query for API caching
- **React Router 7** — Client-side routing
- **Recharts 3** — Price chart visualization
- **Decimal.js** — Precise financial math (no floating point)
- **TypeScript** — Strict mode with `noUncheckedIndexedAccess`

## Commands

```bash
bun install      # Install dependencies
bun dev          # Vite dev server (localhost:5173)
bun build        # Type-check + production build
bun preview      # Preview production build
bun lint         # ESLint + Prettier check
bun format       # Auto-format with Prettier
```

## Architecture

### State Management

All server data flows through **RTK Query** (`store/api/`). API responses are cached and automatically invalidated when orders fill.

Real-time prices live in a separate **Redux slice** (`store/livePrices.ts`) — updated every second via WebSocket, independent of the API cache.

### WebSocket

A custom **Redux middleware** (`store/webSocketMiddleware.ts`) manages the WebSocket lifecycle:

1. Connects on login, disconnects on logout
2. Dispatches `WATCH` messages to the `livePrices` slice (price updates every ~1s)
3. Handles `ORDER_FILLED` messages — invalidates RTK Query cache and shows a Mantine notification

The WebSocket client (`webSocketClient.ts`) provides typed message handling.

### Key Components

```
src/
├── components/
│   ├── Trade/           # Main trading interface
│   │   ├── index.tsx    # Trade page layout
│   │   ├── TradeForm    # Order form (BUY/SELL, MARKET/LIMIT)
│   │   ├── Chart        # Price history chart
│   │   ├── Orders       # Active/filled orders list
│   │   └── Holding      # Current position display
│   ├── CoinSelector/    # Cryptocurrency dropdown
│   ├── Header/          # Nav bar, auth controls, portfolio summary
│   ├── Gain.tsx         # Gain/loss formatting (green/red)
│   └── Dollars.tsx      # Currency display formatting
├── hooks/
│   ├── useLivePrice     # Access real-time price for a coin
│   └── usePortfolioValue # Calculate total portfolio value
└── store/
    ├── api/             # RTK Query endpoints + response types
    ├── livePrices.ts    # Real-time price slice
    ├── webSocketMiddleware.ts
    └── themeSlice.ts    # Dark/light mode
```

### API Endpoints Consumed

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/me` | Current user profile |
| GET | `/api/coins` | List all coins |
| GET | `/api/coins/:id` | Coin detail with quote |
| GET | `/api/coins/:id/historical/:days` | Historical price data |
| GET | `/api/me/holdings` | User holdings |
| GET | `/api/me/orders` | User orders |
| POST | `/api/orders` | Place order |
| PATCH | `/api/orders/:id` | Update order |
| DELETE | `/api/orders/:id` | Cancel order |

## Deployment

The client builds to static files and is served via Nginx:

```bash
bun build
docker compose up -d
```

Nginx serves the `dist/` directory on port 80.
