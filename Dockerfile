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

# Copy server + its package files (already has express/cors/body-parser listed)
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json

# Install only the 3 production deps - express, cors, body-parser
RUN npm install --omit=dev --legacy-peer-deps --quiet

# Railway injects $PORT automatically at runtime
EXPOSE 3000

CMD ["node", "server.js"]
