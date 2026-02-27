# Base stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

# Install dependencies (including devDependencies for build)
RUN npm install

COPY . .

# Build the project
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

COPY package*.json ./

# Install only production dependencies
RUN npm install --only=production

# Copy built assets from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 5000

# Start command with memory limit
CMD ["node", "--max-old-space-size=512", "dist/server.js"]
