# Architecture Improvements Plan

## Context

Tickr's dependency upgrades are already tracked in `MODERNIZE.md`. This plan covers **architecture and correctness issues** — bugs, missing safety guarantees, and structural improvements that create a solid foundation before building more features.

---

## Tier 1: Bugs (fix first)

### 1.1 `fillSellOrder` queries wrong user's holding
- **File**: `server/src/tradeEngine/index.ts:159`
- **Bug**: `db.holding.findFirstOrThrow({ where: { coinId: order.coinId } })` has no `userId` filter. Could match a different user's holding.
- **Fix**: Use the composite unique index like `fillBuyOrder` already does:
  ```ts
  db.holding.findUniqueOrThrow({
    where: { userId_coinId: { userId: order.userId, coinId: order.coinId } },
  })
  ```

### 1.2 `me.controller.ts` passes wrong arguments
- **File**: `server/src/user/me.controller.ts:33,42`
- **Bug**: `getHolding(req.user!.id)` and `getOrder(req.user!.id)` pass the user's ID instead of `req.params.holdingId` / `req.params.orderId`. These endpoints always return wrong data or 500.
- **Fix**: Change to `req.params.holdingId` and `req.params.orderId`.
- **Also**: `me.routes.ts` is missing `params` schemas on lines 47, 74, 102. Without them, Fastify passes route params as raw strings. Add `params: getTokenParams`, `params: getHoldingParams`, `params: getOrderParams` to the respective route definitions.

### 1.3 Resource ownership not verified on `/me` sub-routes
- **File**: `server/src/user/me.controller.ts`
- **Bug**: Even with 1.2 fixed, `getHolding(holdingId)` returns any user's holding. No ownership check.
- **Fix**: Filter by userId in the service call (e.g., `findUniqueOrThrow({ where: { id, userId } })`) or add a guard in the controller that verifies `resource.userId === req.user.id`.

### 1.4 `PATCH /:orderId` has empty body schema
- **File**: `server/src/order/order.routes.ts:71`
- **Bug**: Body schema is `Type.Object({})`. Fastify strips all properties. The update endpoint is a no-op.
- **Fix**: Replace with the existing `updateOrderRequestBody` from `order.schema.ts`.

### 1.5 WebSocket interval leaks on disconnect
- **File**: `server/src/websocketHandler.ts:24`
- **Bug**: `setInterval` is never cleared. Each connection leaks an interval that sends to a closed socket forever.
- **Fix**: Store the interval ID and `clearInterval` in the `close` handler.

### 1.6 `admin` decorator doesn't await `authenticate`
- **File**: `server/src/auth/index.ts:127`
- **Bug**: `f.authenticate(req, rep)` called without `await`. The role check on line 128 runs before the user is loaded. Currently masked by the global `onRequest` hook (line 98-105) which also loads `req.user`, but fragile — would break if the global hook is removed.
- **Fix**: Add `await`.

---

## Tier 2: Architecture (data integrity, error handling)

### 2.1 Wrap order fills in database transactions
- **Files**: `server/src/tradeEngine/index.ts` (`fillBuyOrder`, `fillSellOrder`), `server/src/user/user.service.ts` (`createUser`)
- **Problem**: `fillBuyOrder` does 3 sequential writes (update order, upsert holding, update balance). A failure between writes leaves data inconsistent — e.g., order marked filled but balance not deducted.
- **Fix**: Wrap the DB writes in `db.$transaction()`. Keep side effects (in-memory map removal, WebSocket notifications) outside the transaction. Also wrap user+token creation in `user.service.ts:19` (existing TODO).

### 2.2 Centralized error handling
- **Files**: New `server/src/errors.ts`, `server/src/index.ts`, `server/src/error_responses.schema.ts`, all controllers and services
- **Problem**: Services throw raw `Error("message")`. Controllers return plain text (`rep.code(401).send("Unauthorized")`). No `setErrorHandler`. Prisma "not found" errors leak internal details. Error format varies.
- **Fix**:
  1. Create custom error classes (`NotFoundError`, `UnauthorizedError`, `ForbiddenError`, `ValidationError`) in `errors.ts`
  2. Add `setErrorHandler` on the Fastify instance that maps error types to status codes and a consistent JSON shape: `{ error: string, statusCode: number }`
  3. Update `error_responses.schema.ts` to match the JSON error shape
  4. Replace `throw Error(...)` in services and `rep.code(...).send(...)` in controllers with `throw new CustomError(...)` — let errors propagate to the handler
- **Do together with 2.1** — transaction failures need proper error responses.

### 2.3 Client API error handling
- **Files**: `client/src/components/Header/index.tsx`, `client/src/components/Trade/TradeForm.tsx`
- **Problem**: No error feedback anywhere. Failed login closes the modal silently (line 74). Failed `createOrder` shows an optimistic update that quietly vanishes. Failed `deleteOrder` has no feedback.
- **Fix**:
  1. `await` mutations, check for errors, only proceed on success
  2. Show errors via Mantine notifications or `form.setErrors()`
  3. Depends on 2.2 — needs consistent error format from the server

---

## Tier 3: Structural / Design Patterns

### 3.1 Redundant auth: global hook + per-route decorator
- **File**: `server/src/auth/index.ts:98-105`
- **Problem**: A global `onRequest` hook runs JWT verify + `getUser()` DB lookup on **every** request (including unauthenticated ones like `/auth/register`). Routes with `f.authenticate` then do the same JWT verify + `getUser()` again. Authenticated routes hit the database twice per request.
- **Fix**: Remove the global `onRequest` hook. The purpose (optional user loading for routes that don't require auth but want to know who's calling) can be handled by a separate `f.optionalAuth` decorator used only on routes that need it (e.g., the WebSocket endpoint). This also makes the auth flow easier to trace — auth only happens when explicitly declared on a route.

### 3.2 Authorization scattered in controllers instead of route hooks
- **Files**: `server/src/order/order.controller.ts`, `server/src/user/user.controller.ts`
- **Problem**: Controllers manually check `req.user?.role === Role.ADMIN` and return 403. But some of these routes already use `onRequest: [f.admin]` in the route definition, making the controller check redundant. Others use `onRequest: [f.authenticate]` but the controller still checks admin — meaning the route hook and controller disagree about who's authorized.
- **Fix**: Move all authorization into route-level hooks. Controllers should only call services and return results. For owner-or-admin patterns (like `deleteOrderHandler`), create an `f.ownerOrAdmin` hook or keep a simple guard, but be consistent.

### 3.3 Singletons make testing and dependency injection impossible
- **Files**: `server/src/tradeEngine/index.ts`, `server/src/apis/tradeFeed.ts`, `server/src/db.ts`
- **Problem**: `tradeEngine`, `tradeFeed`, and `db` are all `export default new Class()` singletons. They can't be mocked, can't have dependencies injected, and create hidden coupling (e.g., `tradeEngine` imports `tradeFeed` directly, `websocketHandler` imports both).
- **Fix**: Instantiate in `index.ts` and pass via Fastify decorators (`f.decorate('tradeEngine', tradeEngine)`). Routes and handlers access them through the Fastify instance. This is already how auth works (`f.authenticate`). When you add a test framework later, you can pass mock instances instead.

### 3.4 WebSocket middleware leaks listeners on reconnect
- **File**: `client/src/store/webSocketMiddleware.ts:43-56`
- **Problem**: Every auth state change (register/login/logout) calls `disconnect()`, `connect()`, then adds a **new** `open` event listener. Previous listeners are never removed. After N logins, there are N+1 `open` listeners, each calling `attachListeners()`, which adds duplicate `WATCH` and `ORDER_FILLED` handlers. Price updates dispatch N+1 times.
- **Fix**: Store the cleanup functions from `webSocketClient.listen()` and call them before reconnecting. Or restructure so `attachListeners` is only called once and reconnect reuses the existing listeners.

### 3.5 Client/server types are manually duplicated
- **Files**: `client/src/store/api/schema.ts` vs all `server/src/*.schema.ts`
- **Problem**: The client manually defines TypeScript interfaces (`User`, `Coin`, `Order`, `Holding`) that must match the server's TypeBox response schemas. No mechanism keeps them in sync — a server schema change silently breaks the client.
- **Suggestion**: This is a known trade-off of not using a monorepo. Two options to consider (neither is urgent, but worth choosing a direction):
  - **Option A**: Generate types from the OpenAPI spec (the server already has `@fastify/swagger`). Use a tool like `openapi-typescript` to auto-generate client types from `/docs/json`.
  - **Option B**: Share a small `types` package between client and server (doesn't require a full monorepo — just a local `file:../shared` dependency).

---

## Tier 4: Code Quality

### 4.1 Eliminate non-null assertions
- **Files**: `tradeEngine/index.ts`, `tradeFeed.ts`, `me.controller.ts`, `auth/index.ts`, `order.controller.ts`, `token.controller.ts` (22 instances across 6 files)
- **Problem**: `!` assertions bypass strict null checking. Most are `Map.get()!` after `Map.has()`.
- **Fix**: Use the result of `Map.get()` directly with a conditional:
  ```ts
  const sub = this.orders.get(coin.name);
  if (sub) { sub.orders.push(order); } else { ... }
  ```
  For `req.user!` in controllers: add a guard function that throws a typed `UnauthorizedError` if undefined (pairs with 2.2).

### 4.2 Replace console.log with Fastify's pino logger
- **Files**: `websocketHandler.ts`, `tradeFeed.ts`, `auth.controller.ts`, `fetch_coins.ts`
- **Problem**: 8 active `console.log`/`console.error` calls. No timestamps, log levels, or request context. Fastify already initializes pino with `{ logger: true }`.
- **Fix**: Use `req.log` in request handlers. Pass the Fastify logger to standalone classes (`TradeFeed`, `TradeEngine`) via constructor/init.

### 4.3 WebSocket auto-reconnect on client
- **Files**: `client/src/webSocketClient.ts`, `client/src/store/webSocketMiddleware.ts`
- **Problem**: If the WebSocket connection drops, live prices and order fill notifications are lost until page refresh.
- **Fix**: Add reconnection with exponential backoff (1s, 2s, 4s... up to 30s) in `WebSocketClient`. Re-attach listeners on reconnect.

### 4.4 Chart.tsx state-during-render
- **File**: `client/src/components/Trade/Chart.tsx:80-97`
- **Problem**: Calls `setState` in the render body. Causes double renders every second (live prices update every 1s).
- **Fix**: Move live price accumulation and coinId reset into `useEffect` hooks.

### 4.5 Remove dead code and unused dependencies
- **Server**: Commented-out admin routes in `api.ts:6,19`, commented `console.log` blocks in `tradeEngine/index.ts:46-49,74-76,110-112`
- **Client**: `pnpm remove react-select @mantine/dates js-cookie @types/js-cookie`

---

## Recommended Order

| Step | Items | Notes |
|------|-------|-------|
| 1 | 1.5, 1.6 | One-line fixes, no dependencies |
| 2 | 1.1 | Critical financial correctness |
| 3 | 1.2 + 1.4 | Fix broken endpoints |
| 4 | 1.3 | Ownership verification (depends on 1.2) |
| 5 | 2.2 then 2.1 | Error handling first, then transactions |
| 6 | 2.3 | Client error UI (depends on 2.2) |
| 7 | 3.1, 3.2 | Auth refactor (do together — removing global hook + moving auth to route hooks) |
| 8 | 3.3 | Singleton → Fastify decorators (do after 3.1/3.2 since decorators touch the same init code) |
| 9 | 3.4 | WebSocket middleware listener leak fix |
| 10 | 3.5 | Type sync strategy (choose direction, implement later) |
| 11 | 4.1-4.5 | Independent, any order |

## Verification

After each tier:
- **Server**: `cd server && pnpm lint && pnpm dev` — verify startup, WebSocket connects, create/fill orders
- **Client**: `cd client && pnpm lint && pnpm build && pnpm dev` — verify UI renders, prices stream, trading works
- **Manual test**: Register user, place a market buy, verify holding appears and balance decrements correctly. Place a limit order, wait for fill, verify notification appears.
