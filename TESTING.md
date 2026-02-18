# Testing & Seeding Setup for Tickr

## Context

No test infrastructure exists today. The goal is to add lightweight smoke/integration tests for the core server flows (register, login, buy, sell) plus a reusable seed script for bootstrapping data (admin user, etc.). This should stay simple — hobby-project appropriate.

## Recommendation: Bun Test + Fastify `inject()`

**Why Bun's built-in test runner:**
- Zero new dependencies — already the project runtime
- Jest-compatible API (`describe`, `test`, `expect`)
- Fast, native TypeScript support
- `bun test` just works

**Why Fastify `inject()`:**
- The canonical way to test Fastify — sends requests through the full plugin/hook pipeline without starting a real TCP server
- No port management, no network overhead, no flaky tests
- Returns response objects with status, headers (including `set-cookie`), and body

**Why NOT Vitest/Jest:** Extra dependency for no real benefit when Bun already provides the same API natively.

---

## Implementation Plan

### 1. Extract `buildApp()` from `index.ts`

Create `server/src/app.ts` — a reusable function that builds and configures the Fastify instance, without starting `tradeFeed`, `tradeEngine`, or calling `listen()`.

**`server/src/app.ts`** — new file:
- Moves the Fastify setup (cookie, JWT auth, CORS, routes) into an exported `buildApp()` function
- Skips swagger, graceful shutdown, tradeFeed, tradeEngine (not needed for tests, and these depend on external APIs)
- Returns the ready Fastify instance

**`server/src/index.ts`** — update to use `buildApp()`:
- Import and call `buildApp()`, then layer on swagger, graceful shutdown, tradeFeed/tradeEngine, and `listen()`

### 2. Test infrastructure

**`server/bunfig.toml`** — configure Bun test runner:
```toml
[test]
preload = ["./tests/setup.ts"]
```

**`server/tests/setup.ts`** — preload script:
- Sets `DATABASE_URL` to `file:./test.db`
- Runs `prisma db push` to sync schema to test DB (via shell exec)

**`server/tests/helpers.ts`** — shared test utilities:
- `getApp()` — calls `buildApp()`, returns ready instance
- `registerUser(app, overrides?)` — registers a user via `inject()`, returns response + parsed cookies
- `loginUser(app, email, password)` — logs in, returns response + cookies
- `authInject(app, cookie, method, url, body?)` — `inject()` wrapper that attaches auth cookie

### 3. Smoke tests

**`server/tests/auth.test.ts`**:
- Register a new user → 201, returns user object
- Register duplicate email → 409 (or appropriate error)
- Login with valid credentials → 200, sets cookie
- Login with wrong password → 401
- Access protected route without auth → 401

**`server/tests/orders.test.ts`**:
- Seed a coin in the DB directly (via Prisma)
- Register + login a user
- Create a BUY market order → 201
- Create a SELL order (after manually giving user a holding) → 201
- Create order without auth → 401

### 4. Seed script

**`server/src/seed.ts`** — standalone script (`bun seed`):
- Creates admin user (email, name, password from env or defaults)
- Creates a regular test user
- Ensures coins exist (or skip if already populated)
- Idempotent — safe to run multiple times (upserts)

**`server/package.json`** — add scripts:
```json
"test": "bun test",
"seed": "bun ./src/seed.ts"
```

### 5. Gitignore

Add `server/test.db` and `server/test.db-journal` to `.gitignore`.

---

## Files to create/modify

| Action | File |
|--------|------|
| **Create** | `server/src/app.ts` |
| **Modify** | `server/src/index.ts` (use `buildApp()`) |
| **Create** | `server/bunfig.toml` |
| **Create** | `server/tests/setup.ts` |
| **Create** | `server/tests/helpers.ts` |
| **Create** | `server/tests/auth.test.ts` |
| **Create** | `server/tests/orders.test.ts` |
| **Create** | `server/src/seed.ts` |
| **Modify** | `server/package.json` (add `test`, `seed` scripts) |
| **Modify** | `.gitignore` (add test.db) |

## Verification

1. `cd server && bun test` — all smoke tests pass
2. `cd server && bun seed` — creates admin + test user in dev DB
3. `cd server && bun dev` — server still starts normally (no regression from `buildApp()` refactor)
4. `bun lint` — no lint errors