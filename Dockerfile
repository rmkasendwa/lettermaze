# syntax=docker/dockerfile:1.7
FROM node:24-alpine AS dependencies
WORKDIR /workspace
RUN corepack enable && corepack prepare pnpm@11.9.0 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json
COPY apps/api/package.json apps/api/package.json
COPY packages/contracts/package.json packages/contracts/package.json
RUN pnpm install --frozen-lockfile

FROM dependencies AS build
COPY . .
ARG NEXT_PUBLIC_APP_NAME=LetterMaze
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ARG NEXT_PUBLIC_API_URL=/api
ENV DATABASE_URL=postgresql://lettermaze:lettermaze@localhost:5432/lettermaze \
    NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME \
    NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    INTERNAL_API_URL=http://127.0.0.1:3001
RUN pnpm db:generate && pnpm build
RUN pnpm --filter @lettermaze/api --prod deploy --legacy /prod/api

FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production PORT=3000 API_PORT=3001 INTERNAL_API_URL=http://127.0.0.1:3001 NEXT_PUBLIC_API_URL=/api
RUN addgroup --system --gid 1001 lettermaze && adduser --system --uid 1001 --ingroup lettermaze lettermaze
COPY --from=build --chown=lettermaze:lettermaze /workspace/apps/web/.next/standalone ./apps/web/.next/standalone
COPY --from=build --chown=lettermaze:lettermaze /workspace/apps/web/.next/static ./apps/web/.next/standalone/apps/web/.next/static
COPY --from=build --chown=lettermaze:lettermaze /workspace/apps/web/public ./apps/web/.next/standalone/apps/web/public
COPY --from=build --chown=lettermaze:lettermaze /workspace/apps/api/dist ./apps/api/dist
COPY --from=build --chown=lettermaze:lettermaze /workspace/apps/api/generated ./apps/api/generated
COPY --from=build --chown=lettermaze:lettermaze /prod/api/node_modules ./apps/api/node_modules
COPY --from=build --chown=lettermaze:lettermaze /workspace/prisma ./prisma
COPY --from=build --chown=lettermaze:lettermaze /workspace/scripts/start-production.mjs /workspace/scripts/deploy-migrations.mjs ./scripts/
USER lettermaze
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 CMD ["node", "-e", "fetch('http://127.0.0.1:3000/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"]
CMD ["node", "scripts/start-production.mjs"]
