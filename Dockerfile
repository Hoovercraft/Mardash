# Stage 1: Build Frontend
FROM node:20-bookworm-slim AS frontend-builder
LABEL org.opencontainers.image.source="https://github.com/Hoovercraft/Mardash"
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi
COPY frontend/ ./
RUN npm run build

# Stage 2: Build Backend
FROM node:20-bookworm-slim AS backend-builder
WORKDIR /app/backend
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY backend/package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi
COPY backend/ ./
RUN npm run build

# Stage 3: Production Image
FROM node:20-bookworm-slim AS production
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ curl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Install production backend dependencies inside the final image
COPY backend/package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

# Copy built backend + built frontend
COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=frontend-builder /app/frontend/dist ./public

RUN mkdir -p /data

ENV NODE_ENV=production \
    PORT=8282 \
    DATA_DIR=/data \
    LOG_LEVEL=info

EXPOSE 8282

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -fsS http://127.0.0.1:8282/api/health || exit 1

CMD ["node", "dist/server.js"]
