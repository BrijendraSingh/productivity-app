# ─── Stage 1: Frontend Build ──────────────────────────────────────────────────
FROM node:20-alpine AS frontend-build

WORKDIR /app

COPY package.json package-lock.json* tsconfig.json ./
COPY shared/package.json shared/
COPY backend/package.json backend/
COPY frontend/package.json frontend/

RUN npm install

COPY shared/ shared/
RUN npm run build --workspace=shared

COPY frontend/ frontend/
RUN npm run build --workspace=frontend

# ─── Stage 2: Backend Build ──────────────────────────────────────────────────
FROM node:20-alpine AS backend-build

WORKDIR /app

COPY package.json package-lock.json* tsconfig.json ./
COPY shared/package.json shared/
COPY backend/package.json backend/
COPY frontend/package.json frontend/

RUN npm install

COPY shared/ shared/
RUN npm run build --workspace=shared

COPY backend/ backend/
RUN npm run build --workspace=backend

# ─── Stage 3: Production ─────────────────────────────────────────────────────
FROM node:20-alpine AS production

RUN apk add --no-cache sqlite curl

WORKDIR /app

RUN addgroup -g 1001 nodeuser && \
    adduser -u 1001 -G nodeuser -s /bin/sh -D nodeuser

COPY package.json package-lock.json* ./
COPY shared/package.json shared/
COPY backend/package.json backend/
COPY frontend/package.json frontend/

RUN npm install --omit=dev

COPY --from=backend-build /app/shared/dist shared/dist/
COPY --from=backend-build /app/backend/dist backend/dist/
COPY --from=frontend-build /app/frontend/dist backend/dist/public/

RUN mkdir -p /app/data && \
    chown -R nodeuser:nodeuser /app

ENV NODE_ENV=production
ENV PORT=3001
ENV DATABASE_PATH=/app/data/productivity_app.db

USER nodeuser

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

CMD ["npm", "start"]
