# Tickr Modernization Plan

## Context
Project untouched for ~1 year (early 2025). Now on Node 25. Many dependencies have major version bumps available. This plan orders changes by dependency chain — earlier steps unblock later ones.

---

## Phase 1: Foundational Tooling (no app code changes)

### 1a. TypeScript 5.6 → 5.9
- **Client**: `~5.6.2` → `^5.9.3`
- **Server**: `^5.7.3` → `^5.9.3`
- Likely no code changes needed. Run `tsc --noEmit` to verify.

### 1b. ESLint 9 → 10 + related packages
- **Both**: `eslint` 9 → 10, `@eslint/js` 9 → 10, `typescript-eslint` 8.18/8.19 → 8.55
- **Client**: `eslint-plugin-react-hooks` 5 → 7, `eslint-plugin-react-refresh` 0.4 → 0.5, `globals` 15 → 17
- ESLint 10 changes config file lookup (starts from linted file, not cwd). Existing flat configs should mostly work but may need minor adjustments.
- The `eslint-plugin-react` package can also bump 7.37.4 → 7.37.5 (patch).

### 1c. Prettier 3.4 → 3.8
- **Both**: patch bump, no breaking changes expected.

### 1d. Vite 6 → 7, plugin-react-swc 3 → 4
- Requires Node 20.19+ (we're on 25, fine).
- Sass legacy API removed (not using Sass, no impact).
- Default browser targets updated (fine for this app).
- PostCSS 8.4 → 8.5 (minor bump, do alongside).

### 1e. Server tsconfig: `@tsconfig/node22` → `@tsconfig/node22` latest (22.0.5)
- No `@tsconfig/node25` package exists yet. Stay on node22 base but bump to 22.0.5.
- Update `@types/node` from 22.10 → 25.x to match actual runtime.
- Consider changing `moduleResolution` from `"node"` → `"bundler"` or `"nodenext"` (currently `"node"` which is legacy).

---

## Phase 2: Server Dependency Upgrades

### 2a. Prisma 6 → 7 (biggest server change)
- **New `prisma.config.ts`** file at server root with `defineConfig()` for DB URL config.
- **Schema change**: generator `provider` from `"prisma-client-js"` → `"prisma-client"`, add mandatory `output = "./generated/prisma"`.
- **Driver adapter required**: Install `@prisma/adapter-better-sqlite3` + `better-sqlite3`. Update `db.ts` to instantiate with adapter.
- **Import path changes**: `@prisma/client` → the generated output path.
- `dotenv` no longer auto-loaded by Prisma CLI — handled by `prisma.config.ts`'s `env()` helper.
- `prisma generate` must be run explicitly (no longer auto-runs with `db push`).
- Update `db:migrate` script to chain: `prisma db push && prisma generate`.

### 2b. Fastify ecosystem bumps
- `fastify` 5.2 → 5.7 (minor, non-breaking)
- `@fastify/cors` 10 → 11 (major — check for API changes)
- `@fastify/jwt` 9 → 10 (major — check for API changes)
- `@fastify/type-provider-typebox` 5 → 6 (major)
- `@fastify/websocket` 11.0 → 11.2, `@fastify/swagger` 9.4 → 9.7, `@fastify/swagger-ui` 5.2 → 5.2.5 (minors)
- `fastify-plugin` 5.0 → 5.1 (minor)

### 2c. Other server deps
- `@sinclair/typebox` 0.34.13 → 0.34.48 (patch range)
- `fast-jwt` 5 → 6 (major — used in `auth/index.ts` for `createSigner`)
- `dotenv` 16 → 17 (major — or remove entirely, see 2d)
- `uuid` 11 → 13 (major — or replace with `crypto.randomUUID()`, see 2d)
- `ws` 8.18 → 8.19, `tsx` 4.19 → 4.21 (minors)
- `bufferutil` 4.0 → 4.1 (optional, minor)

### 2d. Remove unnecessary dependencies
- **`dotenv`**: Node 25 has stable `--env-file` flag and `process.loadEnvFile()`. Can replace `dotenv.config()` in `env.ts` with `process.loadEnvFile()` or add `--env-file .env` to scripts. Prisma 7's `prisma.config.ts` handles its own env loading via `env()` helper.
- **`uuid`**: Only used in a few places. `crypto.randomUUID()` is built-in since Node 19. Search for usage and replace.
- **`@types/jsonwebtoken`**: Listed in devDeps but `jsonwebtoken` is not a dependency (project uses `fast-jwt` and `@fastify/jwt`). Remove this unused type package.

### 2e. Dockerfile update
- `node:22-slim` → `node:25-slim` (match runtime)
- Update `pnpm i` command if needed for Prisma 7 changes (explicit `prisma generate`).

---

## Phase 3: Client Dependency Upgrades

### 3a. React 18 → 19
- Remove `@types/react` and `@types/react-dom` (React 19 ships its own types).
- `react-dom/client` API unchanged (`createRoot` already used).
- `forwardRef` no longer needed (but only refactor if actively using it).
- Check all deps for React 19 compatibility before upgrading.

### 3b. Mantine 7 → 8
- Requires React 18 or 19 (compatible with both).
- `@mantine/dates`: now uses string-based dates instead of `Date` objects. Check usage.
- `postcss-preset-mantine` 1.17 → 1.18.
- Portal `reuseTargetNode` now default true (should be fine).
- Popover `hideDetached` now default true.
- Menu `data-hovered` removed (use `:hover`/`:focus`).
- Switch visual update (thumb indicator).
- No import changes if using `@mantine/core/styles.css` (we are).

### 3c. Redux Toolkit 2.5 → 2.11
- Minor version bump, non-breaking. RTK Query API unchanged.

### 3d. Recharts 2 → 3
- `accessibilityLayer` now true by default.
- `Customized` component API changed (lost access to internal state, use hooks instead).
- Check `Chart.tsx` for any usage of removed APIs.

### 3e. Other client deps
- `react-router` 7.1 → 7.13 (minor bumps, non-breaking)
- `react-error-boundary` 5 → 6 (major — check API changes)
- `react-icons` 5.4 → 5.5, `react-select` 5.9 → 5.10, `react-svg` 16.3 → 16.4 (minors)
- `decimal.js` 10.4 → 10.6, `dayjs` 1.11.13 → 1.11.19 (minors)
- `autoprefixer` 10.4.20 → 10.4.24, `postcss-import` 16.1.0 → 16.1.1 (patches)

---

## Phase 4: Code Quality / Config Modernization

### 4a. Server `tsconfig.json` cleanup
- Change `moduleResolution: "node"` → `"nodenext"` (modern Node ESM resolution).
- May require adding `.js` extensions to relative imports (standard for ESM Node).

### 4b. Clean up eslint-disable comments
- Multiple `// eslint-disable-line @typescript-eslint/no-non-null-assertion` in server code. Refactor to use proper null checks or Map `.get()` patterns.
- `// eslint-disable-next-line @typescript-eslint/no-empty-object-type` in client middleware — may be resolved by newer typescript-eslint rules.

### 4c. WebSocket handler interval leak
- `websocketHandler.ts:24`: `setInterval` is never cleared on socket close — memory leak per connection. Store interval ID and `clearInterval` in the `close` handler.

### 4d. Remove dead code
- `api.ts:6,19`: Commented-out admin routes import/registration.
- `tradeFeed.ts`: Multiple commented-out subscribe/unsubscribe blocks.

---

## Suggested Execution Order

1. **Phase 1** (tooling) — safe, no app logic changes
2. **Phase 2a** (Prisma 7) — most complex, do alone and verify DB operations
3. **Phase 2b-2e** (other server deps) — can batch together
4. **Phase 3a** (React 19) — do before Mantine 8
5. **Phase 3b** (Mantine 8) — depends on React 19
6. **Phase 3c-3e** (other client deps) — can batch together
7. **Phase 4** (code quality) — lowest risk, do last

---

## Verification

After each phase:
- **Server**: `cd server && pnpm lint && pnpm dev` (verify startup, Finnhub connection, DB operations)
- **Client**: `cd client && pnpm lint && pnpm build && pnpm dev` (verify UI renders, WS connects, trading works)
- **Docker**: `docker build` the server Dockerfile to verify production build still works
