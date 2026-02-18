# Tickr Server

Fastify API server for the Tickr trading simulator. Handles authentication, order management, real-time price feeds, and trade execution.

## Tech Stack

- **Fastify 5** — HTTP framework with TypeBox schema validation
- **Prisma 7** — ORM with SQLite (LibSQL adapter)
- **@fastify/jwt** — JWT authentication via httpOnly cookies
- **@fastify/websocket** — Real-time client communication
- **@fastify/swagger** — Auto-generated API documentation
- **Pino** — Structured logging
- **TypeScript** — Strict mode with `noUncheckedIndexedAccess`

## Commands

```bash
bun install          # Install dependencies
bun dev              # Dev server with hot reload + pretty logging
bun start            # Production start
bun build            # Build to dist/
bun lint             # ESLint + Prettier check
bun format           # Auto-format with Prettier
bun db:migrate       # Push Prisma schema to database + generate client
bun db:fetch_coins   # Seed coin data from CoinGecko API
```

## Architecture

### Feature-Based Modules

Each feature follows a consistent pattern:

```
src/feature/
├── feature.controller.ts   # Request handlers (extract params, delegate to service)
├── feature.routes.ts        # Route definitions with TypeBox schemas
├── feature.schema.ts        # TypeBox validation/response schemas
└── feature.service.ts       # Business logic + database queries
```

**Modules:** `auth/`, `user/`, `coin/`, `order/`, `holding/`, `token/`, `admin/`

### Authentication

- Passwords hashed with bcrypt (via Bun's `password.hash()`)
- JWT issued on login, stored in an httpOnly cookie
- Route protection via `f.authenticate` and `f.admin` `onRequest` hooks
- Access tokens (API keys) supported for programmatic access

### Real-Time Pipeline

The server maintains a pipeline from external price feeds to connected clients:

```
Finnhub WebSocket
    → TradeFeed (apis/tradeFeed.ts)
        → aggregates trades into 1-second price summaries (high/low/last)
    → TradeEngine (tradeEngine/index.ts)
        → matches pending orders against live prices
        → executes fills (updates holdings, balances)
        → notifies connected clients
    → WebSocket Handler (websocketHandler.ts)
        → authenticates client connections
        → streams WATCH messages (price updates) every 1s
        → sends ORDER_FILLED messages on execution
```

### Order Execution

The trade engine processes orders based on type and direction:

| Order | Fill Condition |
|---|---|
| Market Buy | Fills immediately at the current low price |
| Market Sell | Fills immediately at the current high price |
| Limit Buy | Fills when price drops to or below the limit |
| Limit Sell | Fills when price rises to or above the limit |

On fill, the engine updates the user's holdings (shares + cost basis), adjusts their balance, and sends a WebSocket notification.

### Database Schema

Prisma with SQLite. Key models:

- **User** — Email, password hash, balance, deposits, role (USER/ADMIN)
- **Coin** — External ID, display name, image URL, description
- **Order** — Direction (BUY/SELL), type (MARKET/LIMIT), shares, price, fill status
- **Holding** — Per-user per-coin position (shares + total cost basis)
- **AccessToken** — API keys with hashed tokens
- **AdminAction** — Audit log for admin operations

All financial fields use Prisma's `Decimal` type.

### API Routes

Routes are registered in `api.ts` under the `/api` prefix:

```
/api/ws                  WebSocket — real-time prices + order fills
/api/auth/*              Register, login, logout
/api/me                  Current user profile
/api/me/holdings         Current user's holdings
/api/me/orders           Current user's orders
/api/coins               List coins, get coin details + historical data
/api/orders              Create, update, cancel orders
/api/tokens              Manage access tokens
/api/users               User management (admin)
```

Swagger UI is available at `/documentation` in development.

## Deployment

```bash
docker compose up -d --build
```

Runs on port 3000. The Docker image handles database migration and coin seeding on startup.
