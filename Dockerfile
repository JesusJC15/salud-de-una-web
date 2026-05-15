# Multi-stage Dockerfile for SaludDeUna Web (Node 22 + Next.js 16)
# Usamos alpine3.21 + apk upgrade para parchear vulnerabilidades de sistema conocidas

# Stage 1: Install dependencies
FROM node:22-alpine3.21 AS deps
WORKDIR /app

RUN apk upgrade --no-cache && \
    apk add --no-cache libc6-compat

COPY package*.json ./
RUN npm ci --ignore-scripts

# Stage 2: Build
FROM node:22-alpine3.21 AS builder
WORKDIR /app

RUN apk upgrade --no-cache

# ARGs de build — se inyectan en CI/CD. NEXT_PUBLIC_* quedan bakeados en el bundle.
# No tienen valor sensible: son URLs públicas de la app.
ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
ARG NEXT_PUBLIC_AUTH0_DOMAIN=placeholder.auth0.com
ARG NEXT_PUBLIC_AUTH0_CLIENT_ID=placeholder
ARG NEXT_PUBLIC_AUTH0_AUDIENCE=https://api.salud-de-una.com
ARG NEXT_PUBLIC_AUTH0_REDIRECT_URI=http://localhost:3001/callback
ARG NEXT_PUBLIC_ENABLE_LEGACY_SESSION_STORAGE=false
ARG NEXT_OUTPUT=standalone

ENV NODE_ENV=production
ENV NEXT_OUTPUT=${NEXT_OUTPUT}
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
ENV NEXT_PUBLIC_AUTH0_DOMAIN=${NEXT_PUBLIC_AUTH0_DOMAIN}
ENV NEXT_PUBLIC_AUTH0_CLIENT_ID=${NEXT_PUBLIC_AUTH0_CLIENT_ID}
ENV NEXT_PUBLIC_AUTH0_AUDIENCE=${NEXT_PUBLIC_AUTH0_AUDIENCE}
ENV NEXT_PUBLIC_AUTH0_REDIRECT_URI=${NEXT_PUBLIC_AUTH0_REDIRECT_URI}
ENV NEXT_PUBLIC_ENABLE_LEGACY_SESSION_STORAGE=${NEXT_PUBLIC_ENABLE_LEGACY_SESSION_STORAGE}

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# Stage 3: Runner — imagen mínima sin herramientas de build
FROM node:22-alpine3.21 AS runner
WORKDIR /app

RUN apk upgrade --no-cache

ENV NODE_ENV=production
ENV PORT=3001

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "server.js"]
