# Tickr - AI Agent Development Guide

## Project Overview

Tickr is a full-stack cryptocurrency trading simulation platform with TypeScript monorepo:
- **Client**: React 18 + Vite + Mantine UI + Redux Toolkit
- **Server**: Fastify + Prisma (SQLite) + WebSocket
- **Package Manager**: pnpm
- **Module System**: ESM (ES Modules)

---

## Build, Lint & Test Commands

### Client (`/client`)
```bash
pnpm dev              # Start dev server (Vite)
pnpm build            # Type check + production build
pnpm lint             # Type check + ESLint + format
pnpm format           # Format with Prettier
pnpm preview          # Preview production build
```

### Server (`/server`)
```bash
pnpm dev              # Start dev server with watch mode (tsx)
pnpm start            # Start production server
pnpm lint             # Type check + ESLint + format
pnpm format           # Format with Prettier
pnpm db:migrate       # Push Prisma schema changes
pnpm db:fetch_coins   # Fetch coin data (job)
```

### Testing
**⚠️ No test framework currently configured**
- Pre-commit hooks have commented-out test commands
- When implementing tests, use Vitest (compatible with Vite/TypeScript setup)

### Running Single Tests (Future)
When tests are implemented:
```bash
# Example with Vitest (recommended)
pnpm test -- path/to/file.test.ts
pnpm test -- --grep "test name pattern"
```

---

## Code Style Guidelines

### TypeScript Configuration

#### Strictness (ENFORCED)
- `strict: true` - All strict checks enabled
- `noUnusedLocals: true` - No unused variables
- `noUnusedParameters: true` - No unused function parameters
- `noFallthroughCasesInSwitch: true` - Explicit breaks in switches
- `noUncheckedIndexedAccess: true` - Array/object access returns `T | undefined`

#### Key Rules
- Always handle array/object access as potentially undefined
- Use explicit return types for exported functions
- Prefer type inference for local variables
- Use `skipToken` from RTK Query instead of conditional hooks

### ESLint Configuration

Both client and server use:
- TypeScript ESLint strict + stylistic rules
- Flat config format (eslint.config.js)
- Type-aware linting enabled

**Client-specific**: React, React Hooks, React Refresh plugins

### Import Organization

```typescript
// 1. External dependencies (node_modules)
import { FastifyReply, FastifyRequest } from "fastify";
import { Role } from "@prisma/client";

// 2. Internal modules (relative imports)
import { getUsers, getUser } from "./user.service";
import { GetUserParams } from "./user.schema";
```

**Conventions**:
- Group external before internal imports
- Use named imports (avoid `import *`)
- Relative paths with file extensions omitted
- Client uses `@/` aliasing not configured - use relative paths

### Naming Conventions

#### Files & Directories
- **Directories**: lowercase, feature-based (e.g., `user/`, `order/`, `auth/`)
- **React Components**: PascalCase files (e.g., `TradeForm.tsx`, `Header.tsx`)
- **TypeScript files**: camelCase (e.g., `user.service.ts`, `order.controller.ts`)
- **Hooks**: `use` prefix (e.g., `useLivePrice.ts`, `usePortfolioValue.ts`)

#### Code Patterns
```typescript
// Functions: camelCase
export async function getUserHandler() { }

// React Components: PascalCase
function TradeForm({ coinId }: Props) { }

// Constants/Enums: PascalCase or UPPER_SNAKE_CASE
enum OrderType { MARKET, LIMIT }

// Types/Interfaces: PascalCase
interface OrdersProps { coinId?: number; }
```

### Formatting (Prettier)

**Settings** (defaults used, no custom config):
- 2 spaces indentation
- No semicolons (ASI - Automatic Semicolon Insertion NOT used - semicolons present in codebase)
- Double quotes for strings
- Trailing commas: ES5 style
- Format on save enabled (VS Code)

**Actually**: Code uses semicolons everywhere - standard Prettier defaults apply.

### Architecture Patterns

#### Server (Fastify)
**Feature-based module structure**:
```
feature/
├── feature.controller.ts  # Request handlers
├── feature.routes.ts      # Route definitions with schemas
├── feature.schema.ts      # TypeBox schemas for validation
└── feature.service.ts     # Business logic & database calls
```

**Example**:
```typescript
// Routes: Define schema + handlers
f.get("/:userId", {
  onRequest: [f.admin],
  schema: {
    params: getUserParams,
    response: { 200: userResponse, ...errorResponseSchemas }
  }
}, getUserHandler);

// Controllers: Extract params, call services
export async function getUserHandler(
  req: FastifyRequest<{ Params: GetUserParams }>,
  rep: FastifyReply
) {
  if (req.user?.role === Role.ADMIN) return await getUser(req.params.userId);
  else rep.code(403).send("Insufficient permission");
}

// Services: Business logic only
export async function getUser(id: number) {
  return await db.user.findUniqueOrThrow({ where: { id } });
}
```

#### Client (React)
**Structure**:
```
src/
├── components/        # UI components (feature folders)
├── hooks/            # Custom React hooks
├── store/            # Redux Toolkit (slices + RTK Query APIs)
│   └── api/         # RTK Query endpoint definitions
└── App.tsx          # Main app with routing
```

**Redux Patterns**:
```typescript
// Use typed hooks
import { useAppSelector, useAppDispatch } from "../store/hooks";

// RTK Query with skipToken for conditional fetching
const { data: coin } = useGetCoinQuery(coinId ?? skipToken);

// Selectors for derived state
const holding = selectHoldingForCoin(result, coinId);
```

### Error Handling

#### Server
```typescript
// Use Prisma's findUniqueOrThrow for required entities
const user = await db.user.findUniqueOrThrow({ where: { id } });

// Throw errors with descriptive messages
if (holding.shares.lessThan(orderInput.shares))
  throw Error("Insufficient shares in holding");

// Authorization checks return 403
if (req.user?.role !== Role.ADMIN)
  rep.code(403).send("Insufficient permission");
```

#### Client
```typescript
// Handle undefined with optional chaining
const price = livePrice?.price ?? coin.currentPrice;

// Try-catch for parsing operations
try {
  const decimal = new Decimal(value);
  setQuantity(decimal);
} catch {
  setQuantity(undefined);
}
```

### Type Safety

#### Server (TypeBox + Prisma)
```typescript
import { Type } from "@sinclair/typebox";

// Define schemas for runtime validation
export const getUserParams = Type.Object({
  userId: Type.Number(),
});

// Use Prisma types for database operations
import { Prisma } from "@prisma/client";
export async function updateOrder(id: number, data: Prisma.OrderUpdateInput) {
  return await db.order.update({ where: { id }, data });
}
```

#### Client (TypeScript + RTK Query)
```typescript
// Define API types in schema.ts
export interface User { id: number; email: string; balance: string; }

// Use with RTK Query builders
login: builder.mutation<User, LoginRequest>({
  query: (credentials) => ({
    url: "/auth/login",
    method: "POST",
    body: credentials,
  }),
})
```

---

## Git Workflow

### Pre-commit Hooks (Husky)
- Automatically runs `pnpm lint` before commits
- Must pass type checking, ESLint, and Prettier
- Tests currently commented out

### CI/CD
- **Client**: Build + lint on every push, deploy to production on main
- **Server**: Lint on every push, deploy via Docker on main

---

## Key Technologies & Gotchas

### Decimal Precision
**Use `Decimal.js` for all financial calculations**:
```typescript
import Decimal from "decimal.js";
const cost = new Decimal(quantity).mul(coin.currentPrice);
```

### Database (Prisma + SQLite)
- Prisma Decimal type for precision (shares, prices, balances)
- Use `findUniqueOrThrow` for required entities
- Migrations via `pnpm db:migrate` (db push, not migrations)

### WebSocket (Real-time Prices)
- Server: Fastify WebSocket plugin
- Client: Redux middleware handles WS connections
- Live prices stored in Redux slice, not RTK Query

### Authentication
- JWT tokens via Fastify JWT plugin
- Cookies with `httpOnly` flag
- Admin authorization via `f.admin` hook

---

## Best Practices for AI Agents

1. **Always run lint before committing** - Pre-commit hooks enforce this
2. **Use TypeScript strictly** - Handle `noUncheckedIndexedAccess` properly
3. **Follow feature-based architecture** - Don't create flat file structures
4. **Use Prisma for all DB operations** - Never write raw SQL
5. **Decimal.js for money/shares** - Never use JavaScript numbers for financial data
6. **Export named functions** - Avoid default exports except for components/routes
7. **Write schemas for all API endpoints** - TypeBox schemas provide runtime validation
8. **Keep controllers thin** - Business logic belongs in services
9. **Use RTK Query for all API calls** - Don't use fetch/axios directly
10. **Handle errors explicitly** - No silent failures

---

*Last updated: 2026-02-09*
