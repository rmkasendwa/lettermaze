# LetterMaze

LetterMaze is a standalone, mobile-first word puzzle inspired by grid-based word-finding games. This repository is the production foundation; gameplay has not been implemented.

## Workspace architecture

- `apps/web` — Next.js App Router browser UI, rendering, routes, themes, and browser-specific behavior.
- `apps/api` — independently runnable NestJS REST API and the sole runtime owner of Prisma/database access.
- `packages/contracts` — framework-independent Zod schemas and API types reusable by web, API, and a future mobile application.
- `prisma` — repository-level schema and migration history, operated through root commands.
- `scripts` — production process supervision and explicit migration deployment.

The browser normally calls relative `/api/*` URLs. Next.js proxies those requests to the separate API process, matching the single-origin production topology. Neither application imports the other application's internals.

## Technology stack

Next.js, React, NestJS, strict TypeScript, Tailwind CSS, PostgreSQL 17, Prisma, Zod, next-themes, Vitest, React Testing Library, ESLint, Prettier, pnpm, and Docker Compose.

## Prerequisites

- Node.js 24+
- Corepack and pnpm 11.9.0
- Docker with Docker Compose

## Environment setup

```bash
corepack enable
pnpm install
cp .env.example .env
cp apps/web/.env.example apps/web/.env
cp apps/api/.env.example apps/api/.env
```

PowerShell:

```powershell
Copy-Item .env.example .env
Copy-Item apps/web/.env.example apps/web/.env
Copy-Item apps/api/.env.example apps/api/.env
```

The root `.env` owns `DATABASE_URL` for Prisma commands. Web variables are `PORT` (default `3000`), `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_API_URL` (normally `/api`), and server-only `INTERNAL_API_URL`. API variables are `API_PORT` (default `4000`), `DATABASE_URL`, and comma-separated `CORS_ORIGINS`.

For local development, each application falls back to its committed `.env.example` when its `.env` file is absent. Copying the examples is still recommended before changing any values. Production never relies on these fallback files.

When changing the web port, update its public origin and API CORS allowlist. When changing the API port, update `INTERNAL_API_URL`.

## Local development

```bash
docker compose up -d postgres
pnpm db:generate
pnpm db:migrate
pnpm dev
```

Default addresses:

- Web: `http://localhost:3000`
- API: `http://localhost:4000`
- Proxied health endpoint: `http://localhost:3000/api/health`
- Direct API health endpoint: `http://localhost:4000/api/health`

Run applications independently with `pnpm dev:web` and `pnpm dev:api`. Production builds use `pnpm build`; built applications can be run separately with `pnpm start:web` and `pnpm start:api`.

## Database

Local credentials are database/user/password `lettermaze` on port `5432`. Use `pnpm db:generate`, `pnpm db:migrate`, `pnpm db:validate`, `pnpm db:studio`, and `pnpm db:deploy` for Prisma workflows. Existing migration history must be preserved; production uses `migrate deploy`, never development migrations.

## Combined production image

`docker build -t lettermaze .` creates one image containing both independently built applications. Only port `3000` is exposed. A small Node supervisor starts the API, waits for a database-connected API health response, starts Next.js, forwards termination signals, and stops the container if either process exits.

Run migrations exactly once as an explicit release step before starting the application:

```bash
docker run --rm --env-file .env lettermaze node scripts/deploy-migrations.mjs
docker run --rm --env-file .env -p 3000:3000 lettermaze
```

For a production-like local Compose run, use `docker compose --profile production up --build`. The API remains internal; `/api/health` traverses Next.js, NestJS, and PostgreSQL.

## Validation commands

Use `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test`, `pnpm build`, or the combined `pnpm validate`. CI also validates Prisma and builds the combined Docker image.

## Architectural boundaries

Web routes remain thin and contain no Prisma access. API database access is injectable through its database module. Contracts depend only on Zod and contain no React, Next.js, NestJS, Prisma, Node-only, or browser-only APIs. Browser persistence remains separate from future server synchronization. Shared UI stays web-local.

A future `apps/mobile` consumer can reuse contracts and future framework-independent game logic without importing either application. `packages/game-core` will be created only when real pure gameplay logic exists.

## Current status and next step

The workspace, web shell, API health path, contracts, database infrastructure, tests, CI, and combined deployment image are established. Gameplay, authentication, accounts, synchronization, offline support, leaderboards, and mobile code are intentionally deferred. The recommended next milestone is a pure, tested game-domain foundation for board representation, coordinates, adjacency, path validation, and deterministic generation.
