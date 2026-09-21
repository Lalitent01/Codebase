# ==========================================
# 1. BUILD STAGE
# ==========================================
FROM node:20-slim AS builder

# Install OpenSSL (required by Prisma engine)
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency manifests and Prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Install ALL dependencies (including devDependencies for building)
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Copy the rest of the application source code
COPY . .

# Build the NestJS application
RUN npm run build

# Remove development dependencies to keep the final image small
RUN npm prune --omit=dev

# ==========================================
# 2. PRODUCTION RUNNER STAGE
# ==========================================
FROM node:20-slim AS runner

# Install OpenSSL for Prisma runtime
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy only production dependencies, build output, and prisma files
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# Set production environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Set cache path for Xenova/transformers embedding models
ENV TRANSFORMERS_CACHE=/app/.cache
RUN mkdir -p /app/.cache && chown -R node:node /app

# Expose backend port
EXPOSE 3001

# Switch to non-root user for security
USER node

# Start NestJS (checks if compiled to dist/main.js or dist/src/main.js)
CMD ["sh", "-c", "if [ -f dist/main.js ]; then node dist/main.js; else node dist/src/main.js; fi"]