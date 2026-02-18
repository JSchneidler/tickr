# Monorepo Migration: Merge Client into Server Repo

## Context

Client and server are currently **separate git repos** under `/Users/jordan/code/tickr/`. The root directory is not a git repo — it just contains both repos side by side plus docs. The goal is to consolidate into a single monorepo using **bun workspaces**, using the server repo as the base and copying client files in (client git history is dropped; server history preserved).

## Current state

- `server/` — independent git repo, Fastify 5 + Prisma + SQLite
- `client/` — independent git repo, React 19 + Vite 7 + Mantine + Redux
- Both use bun, separate `bun.lock` files, separate `.husky/` dirs
- Shared devDependencies: `typescript ~5.9.3`, `eslint ^9.39.2`, `prettier ^3.8.1`, `husky ^9.1.7`, `typescript-eslint ^8.55.0`
- Separate but near-identical CI workflows (`client/.github/workflows/build.yml`, `server/.github/workflows/build.yml`)
- Docker only in server (still references pnpm — needs fixing)
- No shared code/types between client and server today

---

## Plan

### 1. Restructure the server repo to be the monorepo root

Working inside the `server/` git repo, move all server files into a `server/` subdirectory so the git root becomes the monorepo root.

- `mkdir server/` inside the repo
- Move all server source files into it: `src/`, `prisma/`, `package.json`, `tsconfig.json`, `eslint.config.js`, `Dockerfile`, `docker-compose.yml`, `.env`, etc.
- Keep `.github/` at the repo root
- Delete `server/.husky/` (replaced by root-level hooks in step 4)

### 2. Copy client files in

- Copy everything from the client repo (excluding `.git/`, `.husky/`, `node_modules/`, `bun.lock`) into `client/` at the monorepo root
- Remove `"prepare": "husky"` and `husky` devDependency from `client/package.json`

### 3. Create root `package.json` with bun workspaces

```json
{
  "name": "tickr",
  "private": true,
  "workspaces": ["client", "server"],
  "scripts": {
    "dev": "bun --filter '*' dev",
    "dev:client": "bun --filter tickr-client dev",
    "dev:server": "bun --filter tickr-server dev",
    "build": "bun --filter '*' build",
    "lint": "bun --filter '*' lint",
    "format": "bun --filter '*' format"
  },
  "devDependencies": {
    "husky": "^9.1.7"
  }
}
```

- `bun install` at root creates a single `bun.lock`
- Delete old `client/bun.lock` and `server/bun.lock`
- Remove `husky` and `"prepare": "husky"` from `server/package.json`

### 4. Root-level `.husky/` and `.gitignore`

**`.husky/pre-commit`**:
```bash
bun --filter '*' lint
```

**`.gitignore`** — merged from both:
```gitignore
node_modules
dist
*.log
.DS_Store
.vscode/*
!.vscode/extensions.json
.idea

# Server
server/.env*
server/*.db
server/*.db-journal
server/src/generated
```

Delete `client/.gitignore` and `server/.gitignore`.

### 5. Consolidate CI workflow

Single `.github/workflows/build.yml`:

```yaml
name: Build
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install --frozen-lockfile
      - run: DATABASE_URL="file:./dev.db" bun --filter tickr-server db:migrate
      - run: bun run build
      - run: bun run lint
```

### 6. Fix Dockerfile

`server/Dockerfile` currently uses `pnpm` — switch to bun:
- Use `oven/bun` base image (or install bun in node image)
- Update `COPY` paths for monorepo context
- Replace `pnpm i` / `pnpm start` with `bun install` / `bun start`
- Update `docker-compose.yml` build context to root if needed

### 7. Move root-level docs into the repo

Move `CLAUDE.md`, `ARCHITECTURE.md`, `TODO.md`, `FEATURES.md`, etc. from the current non-git root into the monorepo root.

### 8. Clean up VS Code workspace

Delete or simplify `workspace.code-workspace` — with a single repo root, VS Code can just open the root directory directly.

---

## Files to create/modify

| Action | File |
|--------|------|
| **Create** | `package.json` (root workspaces config) |
| **Create** | `.gitignore` (root, merged) |
| **Create** | `.husky/pre-commit` (root) |
| **Move** | All server files → `server/` subdirectory |
| **Copy** | All client files → `client/` subdirectory |
| **Modify** | `client/package.json` (remove husky/prepare) |
| **Modify** | `server/package.json` (remove husky/prepare) |
| **Modify** | `.github/workflows/build.yml` (consolidated) |
| **Modify** | `server/Dockerfile` (switch pnpm → bun, fix paths) |
| **Delete** | `client/.gitignore`, `server/.gitignore` |
| **Delete** | `client/.husky/`, `server/.husky/` |
| **Delete** | `client/bun.lock`, `server/bun.lock` |
| **Move** | `CLAUDE.md`, docs → repo root |
| **Delete** | `workspace.code-workspace` |

## Verification

1. `bun install` at root — single lockfile, no errors
2. `bun run dev:client` — Vite dev server starts on :5173
3. `bun run dev:server` — Fastify server starts on :3000
4. `bun run build` — both build successfully
5. `bun run lint` — both lint cleanly
6. `git log` — server history preserved
