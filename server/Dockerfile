# Dockerfile for the server (works for both development and production)
FROM node:18-alpine

WORKDIR /app

# Install Prisma CLI globally
RUN npm install -g prisma

# Copy package files
COPY package*.json ./

# Install dependencies (docker-compose will override command for dev/prod)
RUN npm install

# Copy server source code
COPY . ./

# Generate Prisma Client
RUN npx prisma generate

# Create uploads directory
RUN mkdir -p uploads/rooms

# Expose server port
EXPOSE 3000

# Default command (production) - can be overridden in docker-compose
CMD ["node", "src/server.js"]
