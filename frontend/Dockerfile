# ==========================================
# 1. BASE IMAGE
# ==========================================
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

# ==========================================
# 2. DEPENDENCIES STAGE
# ==========================================
FROM base AS deps
COPY package*.json ./
RUN npm ci

# ==========================================
# 3. BUILDER STAGE
# ==========================================
FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js statically bakes NEXT_PUBLIC_* variables into JS bundles during build time
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_RAZORPAY_KEY_ID
ARG NEXT_PUBLIC_SITE_URL
ARG BACKEND_URL

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_RAZORPAY_KEY_ID=$NEXT_PUBLIC_RAZORPAY_KEY_ID
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV BACKEND_URL=$BACKEND_URL
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ==========================================
# 4. PRODUCTION RUNNER STAGE
# ==========================================
FROM base AS runner

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

# Create unprivileged system group & user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy static assets and standalone server bundle
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Drop root privileges
USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]