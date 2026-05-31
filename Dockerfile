FROM node:22-bookworm-slim AS deps
WORKDIR /app

RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci


FROM node:22-bookworm-slim AS builder
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build-time placeholders.
# Real runtime values are passed from /opt/demos/infra/envs/plan-track.env
ENV DB_HOST=postgres
ENV DB_PORT=5432
ENV DB_USERNAME=admin
ENV DB_PASSWORD=build_time_placeholder
ENV DB_DATABASE=plantrack_db
ENV DB_SSL=false

ENV JWTSECRET=build_time_placeholder
ENV JWTREFRESHSECRET=build_time_placeholder
ENV APP_BASE_URL=http://localhost:3000
ENV NEXT_PUBLIC_URL=http://localhost:3000
ENV NEXT_PUBLIC_POLL_INTERVAL_MINUTES=1

ENV RESEND_API_KEY=build_time_placeholder
ENV MAIL_FROM=build@example.com

ENV STRIPE_SECRET_KEY=sk_test_build_time_placeholder
ENV STRIPE_WEBHOOK_SECRET=whsec_build_time_placeholder

ENV JOBS_ENABLED=false
ENV JOB_TICK_MS=30000
ENV CLEANUP_UNCONFIRMED_USERS_DAYS=7

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build


FROM node:22-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/db ./db
COPY --from=builder /app/job ./job
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/types ./types
COPY --from=builder /app/next.config.mjs ./next.config.mjs

EXPOSE 3000

CMD ["npm", "start"]