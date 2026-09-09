# syntax=docker/dockerfile:1

# ── base ──────────────────────────────────────────────────────
FROM node:22-alpine AS base
WORKDIR /usr/src/app
RUN apk add --no-cache python3 make g++ # dependências nativas (argon2)
COPY package*.json ./

# ── development ───────────────────────────────────────────────
FROM base AS development
RUN npm ci
COPY . .
CMD ["npm", "run", "start:dev"]

# ── build ────────────────────────────────────────────────────
FROM base AS build
RUN npm ci
COPY . .
RUN npm run build
RUN npm prune --omit=dev

# ── production ───────────────────────────────────────────────
FROM node:22-alpine AS production
WORKDIR /usr/src/app
ENV NODE_ENV=production
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/web ./web
COPY --from=build /usr/src/app/package.json ./package.json
EXPOSE 3000
CMD ["node", "dist/main.js"]
