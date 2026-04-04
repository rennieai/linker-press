# ── Stage 1: Build the React App ──────────────────────────────────
FROM node:20-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps --quiet

COPY . .
RUN npm run build

# ── Stage 2: Lean Production Server ───────────────────────────────
FROM node:20-slim AS runner

WORKDIR /app

# Copy built frontend
COPY --from=builder /app/dist ./dist

# Copy server entrypoint
COPY --from=builder /app/server.js ./server.js

# Create minimal package.json to ONLY install server deps and avoid frontend bloat
RUN echo '{"type":"module","dependencies":{"express":"^4.21.0","cors":"^2.8.6","body-parser":"^1.20.3"}}' > package.json

# Install only the 3 production deps
RUN npm install --quiet

# Railway injects $PORT automatically at runtime
EXPOSE 3000

CMD ["node", "server.js"]
