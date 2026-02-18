# Tickr

A full-stack cryptocurrency trading simulator with real-time price feeds. Practice trading crypto with virtual currency — no real money, real market data.

**Live at [tickr.jschneidler.com](https://tickr.jschneidler.com)**

## Features

- **Real-Time Prices** — Live cryptocurrency prices streamed via WebSocket from Finnhub
- **Market & Limit Orders** — Place buy/sell orders that execute against real price movements
- **Portfolio Tracking** — Monitor holdings, cost basis, and gain/loss in real time
- **Instant Order Fills** — Market orders fill immediately; limit orders trigger when price targets are hit
- **Price Charts** — Historical price data visualization powered by Recharts
- **Live Notifications** — Get notified in-app when your limit orders fill

## How It Works

1. Register an account and receive virtual funds
2. Browse available cryptocurrencies with live prices
3. Place market orders (instant) or limit orders (conditional)
4. Watch your portfolio update in real time as prices move and orders fill

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, Mantine UI, Redux Toolkit |
| Backend | Fastify, Prisma, SQLite |
| Real-Time | WebSocket (Finnhub for prices, custom for client sync) |
| Language | TypeScript (strict mode, ESM) |
| Infrastructure | Docker, GitHub Actions CI |

## Project Structure

```
tickr/
├── client/     # React SPA — see client/README.md
├── server/     # Fastify API + WebSocket — see server/README.md
└── .github/    # CI workflows
```

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) runtime
- A [Finnhub](https://finnhub.io) API key (free tier works)

### Setup

```bash
# Install dependencies
cd client && bun install
cd ../server && bun install

# Configure environment
cp server/.env.example server/.env
# Add your Finnhub API key to server/.env

# Initialize the database
cd server && bun db:migrate && bun db:fetch_coins

# Start both client and server
cd .. && bun dev
```

The client runs on `localhost:5173` and the server on `localhost:3000`.

## Deployment

Both client and server ship with Docker configurations and deploy via `docker-compose`. See the individual READMEs for details.
