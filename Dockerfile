# ── Stage 1: Build the React App ──────────────────────────────────
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files first for layer caching
COPY package*.json ./

# Install ALL deps (dev included) so vite/tailwind can run the build
RUN npm install --legacy-peer-deps --quiet

# Copy source and build
COPY . .
RUN npm run build

# ── Stage 2: Production Server (Express only) ─────────────────────
FROM node:20-slim AS runner

WORKDIR /app

# Only copy the built static files and the server
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.js ./server.js

# Create a minimal package.json for the 3 server deps
RUN echo '{"name":"linker-press","version":"1.0.0","type":"module"}' > package.json

# Install ONLY the three tiny server dependencies
RUN npm install express@^4.21.0 body-parser@^1.20.3 cors@^2.8.6 --quiet --no-save

# Railway assigns $PORT at runtime
EXPOSE 3000

# Node 20 has built-in fetch — use a single-line healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://localhost:'+(process.env.PORT||3000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
