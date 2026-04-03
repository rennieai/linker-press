# Stage 1: Build the React Application
FROM node:22-slim AS build-stage

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
RUN npm install --legacy-peer-deps --quiet

# Copy the rest of the source
COPY . .

RUN npm run build

# Stage 2: Serve with Express
FROM node:22-slim AS production-stage

WORKDIR /app

# Copy only the necessary files from the build stage
COPY --from=build-stage /app/dist ./dist
COPY --from=build-stage /app/server.js ./server.js
COPY --from=build-stage /app/package*.json ./

# Install ONLY production dependencies (Express, Body-parser)
RUN npm install --only=production --legacy-peer-deps --quiet

# Start the communal news relay
CMD ["node", "server.js"]
