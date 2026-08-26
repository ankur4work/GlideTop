# ---------------------------------------------------------------------------
# GlideTop production image
#
# Two stages so the runtime layer carries no build toolchain and no frontend
# dev dependencies. The heap ceiling on the build stage is deliberate: the
# deploy host runs close to its memory limit, and an unbounded V8 heap gets the
# build container OOM-killed with a bare "exit code 255" and no error message.
# ---------------------------------------------------------------------------

FROM node:18-alpine AS builder

WORKDIR /app

# Baked into the frontend bundle at build time, so these must be build args —
# setting them only as runtime variables silently produces a broken bundle.
ARG SHOPIFY_API_KEY
ARG GLIDETOP_EXTENSION_UUID
ARG GLIDETOP_SUPPORT_EMAIL

ENV SHOPIFY_API_KEY=$SHOPIFY_API_KEY \
    GLIDETOP_EXTENSION_UUID=$GLIDETOP_EXTENSION_UUID \
    GLIDETOP_SUPPORT_EMAIL=$GLIDETOP_SUPPORT_EMAIL \
    NODE_OPTIONS=--max-old-space-size=1536

# Install dependencies first so edits to source don't invalidate the layer.
COPY web/package.json ./
RUN npm install --omit=dev

COPY web/frontend/package.json ./frontend/
RUN cd frontend && npm install

COPY web/ ./
RUN cd frontend && npm run build


# ---------------------------------------------------------------------------

FROM node:18-alpine AS runtime

WORKDIR /app

# Coolify runs its container health check by exec'ing curl inside the image.
# Slim Node bases ship neither curl nor a full wget, so without this the deploy
# fails as "unhealthy" and rolls back even though the app started correctly.
RUN apk add --no-cache curl

ENV NODE_ENV=production \
    PORT=8081

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/frontend/dist ./frontend/dist
COPY web/package.json ./
COPY web/*.js ./
COPY web/lib ./lib

EXPOSE 8081

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fsS http://127.0.0.1:8081/health || exit 1

CMD ["npm", "run", "serve"]
