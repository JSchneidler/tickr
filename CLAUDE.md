# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tickr is a full-stack cryptocurrency trading simulation platform. Users simulate buying/selling crypto with virtual currency, with real-time price feeds via WebSocket.

- **Client** (`/client`): React 18 + Vite + Mantine UI + Redux Toolkit
- **Server** (`/server`): Fastify 5 + Prisma (SQLite) + WebSocket
- **Package Manager**: bun (separate installs per directory, not a bun workspace)
- **Module System**: ESM throughout
- **Deployed at**: tickr.jschneidler.com via Docker

## Commands

### Client (`/client`)

```bash
bun dev          # Vite dev server (localhost:5173)
bun build        # tsc -b && vite build
bun lint         # tsc --noEmit + eslint + prettier
bun format       # prettier . --write
```

### Server (`/server`)

```bash
bun dev          # tsx watch ./src/index.ts
bun start        # tsx ./src/index.ts
bun lint         # tsc + eslint + prettier
bun format       # prettier src/ --write
bun db:migrate   # prisma db push
bun db:fetch_coins  # fetch coin data from CoinGecko
```

### Testing

No test framework is configured. Pre-commit hooks (Husky) run `bun lint` only.

## Architecture

### Server — Feature-Based Modules

Each feature follows this pattern in `server/src/`:

```
feature/
├── feature.controller.ts  # Request handlers (extract params, call services)
├── feature.routes.ts      # Route definitions with TypeBox schemas
├── feature.schema.ts      # TypeBox validation schemas
└── feature.service.ts     # Business logic & database calls
```

Modules: `auth/`, `user/`, `coin/`, `order/`, `holding/`, `token/`

Routes are registered in `api.ts`. Auth uses JWT in httpOnly cookies with `f.authenticate` and `f.admin` decorators for route protection.

### Client — Redux + RTK Query

- **RTK Query** (`store/api/index.ts`): All API calls (auth, coins, orders, holdings). Types in `store/api/schema.ts`.
- **livePrices slice** (`store/livePrices.ts`): Real-time prices from WebSocket — stored in a Redux slice, NOT in RTK Query.
- **webSocketMiddleware** (`store/webSocketMiddleware.ts`): Manages WS connection lifecycle, dispatches price updates, shows Mantine notifications on order fills.
- **webSocketClient** (`webSocketClient.ts`): Typed WS client with message listeners.

### Real-Time Data Flow

1. Server connects to Finnhub WebSocket (`apis/tradeFeed.ts`) for live crypto prices
2. Trade engine (`tradeEngine/index.ts`) monitors pending orders against live prices, executes fills
3. Server sends `WATCH` (price updates) and `ORDER_FILLED` messages to connected clients
4. Client middleware updates Redux store and invalidates RTK Query cache on fills

### Database

Prisma + SQLite. Key models: User, Coin, Order (BUY/SELL, MARKET/LIMIT), Holding (shares + cost basis), AccessToken. Financial fields use Prisma Decimal type.

## Code Conventions

- **Strict TypeScript**: Both client and server have `strict: true` and `noUncheckedIndexedAccess: true` — always handle array/object access as potentially undefined
- **ESLint**: Flat config, `strictTypeChecked` + `stylisticTypeChecked` on both sides
- **Financial math**: Always use `Decimal.js` (client) and Prisma Decimal (server) — never JavaScript floating point
- **Server schemas**: TypeBox for all API endpoint validation and response types
- **Client data fetching**: RTK Query exclusively — use `skipToken` for conditional queries
- **Imports**: External deps first, then internal. Named imports only (no `import *`). No path aliases.
- **Naming**: PascalCase for React components/files, camelCase for other TS files (`user.service.ts`), feature directories lowercase
- **Exports**: Named exports preferred. Keep controllers thin, business logic in services.
