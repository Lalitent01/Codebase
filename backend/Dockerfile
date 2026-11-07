# ==========================================
# 1. DEPENDENCY & BUILD STAGE
# ==========================================
FROM node:20-slim AS builder

# Install OpenSSL for Prisma engine binary compilation
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./
COPY prisma ./prisma/

# Clean install including devDependencies
RUN npm ci

# Generate Prisma Client code
RUN npx prisma generate

# Copy source code
COPY . .

# Build NestJS production bundle
RUN npm run build

# Prune devDependencies to keep image lean
RUN npm prune --omit=dev

# Re-run prisma generate to guarantee binaries reside in pruned node_modules
RUN npx prisma generate

# ==========================================
# 2. PRODUCTION RUNNER STAGE
# ==========================================
FROM node:20-slim AS runner

# Install OpenSSL runtime dependency required by Prisma
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001
ENV TRANSFORMERS_CACHE=/app/.cache

# Copy files from builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# Create cache directory with correct permissions for non-root user
RUN mkdir -p /app/.cache && chown -R node:node /app

# Drop root privileges
USER node

EXPOSE 3001

# Healthcheck to verify NestJS is up and serving requests
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {if (r.statusCode !== 200) process.exit(1)})"

# Start the application
CMD ["sh", "-c", "if [ -f dist/main.js ]; then node dist/main.js; else node dist/src/main.js; fi"]