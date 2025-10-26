# Use Node.js 22 base image
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package.json pnpm-lock.yaml* ./

# Install pnpm globally
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the app
COPY . .

# Expose internal port 8110
EXPOSE 8110

# Start the app
CMD ["pnpm", "start"]
