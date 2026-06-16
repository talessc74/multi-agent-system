# ── Stage 1: build ──────────────────────────────────────────────────────────
FROM node:20-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .
ARG VITE_GIT_HASH=dev
ENV VITE_GIT_HASH=$VITE_GIT_HASH
ARG VITE_LIQUID_GLASS=false
ENV VITE_LIQUID_GLASS=$VITE_LIQUID_GLASS
RUN npm run build

# ── Stage 2: runtime ─────────────────────────────────────────────────────────
FROM node:20-slim AS runner

ENV NODE_ENV=production

WORKDIR /app

# Install only production dependencies
COPY package.json package-lock.json ./
RUN npm install --omit=dev

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/agents ./agents
COPY --from=builder /app/registry ./registry

# Cloud Run injects PORT=8080; server.ts already reads process.env.PORT
EXPOSE 8080

CMD ["node", "dist/server.cjs"]
