# Stage 1: Build the React Application
FROM node:22-slim AS build-stage

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
RUN npm ci --quiet

# Copy the rest of the source
COPY . .

# Build the Vite application (generates /dist)
RUN npm run build

# Stage 2: Serve with Express
FROM node:22-slim AS production-stage

WORKDIR /app

# Copy only the necessary files from the build stage
COPY --from=build-stage /app/dist ./dist
COPY --from=build-stage /app/server.js ./server.js
COPY --from=build-stage /app/package*.json ./

# Install ONLY production dependencies (Express, Body-parser)
RUN npm install --only=production --quiet

# Define the Railway port
ENV PORT=3000
EXPOSE 3000

# Start the communal news relay
CMD ["node", "server.js"]
