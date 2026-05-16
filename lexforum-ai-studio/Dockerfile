# ── Stage 1: build ──────────────────────────────────────────────────────────
FROM node:20-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Stage 2: runtime ─────────────────────────────────────────────────────────
FROM node:20-slim AS runner

WORKDIR /app

# Install only production dependencies (esbuild bundled with --packages=external
# so external node_modules are still resolved at runtime)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist

# Cloud Run injects PORT=8080; server.ts already reads process.env.PORT
EXPOSE 8080

CMD ["node", "dist/server.cjs"]
