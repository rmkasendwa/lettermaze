# LetterMaze

## Product overview

LetterMaze is a standalone, mobile-first word puzzle inspired by grid-based word-finding games. This repository currently provides its production-minded application foundation; gameplay is not implemented.

## Technology stack

Next.js App Router, React, strict TypeScript, Tailwind CSS, PostgreSQL, Prisma, Zod, next-themes, Vitest, React Testing Library, ESLint, Prettier, pnpm, and Docker Compose.

## Prerequisites

- Node.js 24 or later
- Corepack and pnpm 11.9.0
- Docker with Docker Compose

## Local setup

```bash
corepack enable
pnpm install
cp .env.example .env
docker compose up -d
pnpm db:generate
pnpm db:migrate
pnpm dev
```

PowerShell: `Copy-Item .env.example .env`.

The development and production servers default to port `3000`. Set `PORT` in `.env` to use another port, and update `NEXT_PUBLIC_APP_URL` to match:

```dotenv
PORT=3100
NEXT_PUBLIC_APP_URL=http://localhost:3100
```

## Commands

`dev`, `build`, and `start` run Next.js. `typecheck`, `lint`, `lint:fix`, `format`, `format:check`, `test`, and `test:watch` cover code quality. `db:generate`, `db:migrate`, `db:deploy`, `db:studio`, and `db:validate` manage Prisma. `validate` runs the main checks.

## Database

Compose provides PostgreSQL 17 at `localhost:5432`, database/user/password `lettermaze`. Create development migrations with `pnpm db:migrate`, regenerate the client with `pnpm db:generate`, inspect data with `pnpm db:studio`, and deploy existing migrations with `pnpm db:deploy`.

## Directory structure

- `app`: thin routes, layouts, metadata, and route boundaries
- `features`: domain-owned modules exposed through intentional public exports
- `components`: shared UI primitives and application layout
- `hooks`: hydration-safe, app-wide React hooks
- `lib`: technical infrastructure, configuration, storage, and routes
- `server`: shared server-only concerns
- `providers`: the shallow application provider tree
- `prisma`: the minimal database schema
- `tests`: cross-cutting setup and foundation tests

## Architectural rules

Routes compose features and do not own business logic. A feature owns its internals and other features use its public export. Shared UI cannot import domain features. Server modules stay out of client components. Browser persistence is isolated behind an adapter and remains separate from future remote synchronization.

## Current project state

The responsive shell, navigation, theme selection, health endpoint, infrastructure, and quality tooling work. Gameplay, offline support, and synchronization are deliberately deferred.

## Recommended next step

Build a pure, testable game-domain foundation: board representation, tile coordinates, adjacency and path validation, plus a deterministic generator interface and unit tests. It should require no database, persistence, or substantial UI work.
