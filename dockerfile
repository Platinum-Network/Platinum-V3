# Use Node.js 22 base image
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy dependency files
COPY package.json pnpm-lock.yaml* ./

# Enable and install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install --frozen-lockfile

# Copy all project files
COPY . .

# Expose internal port (matches app.js -> 8110)
EXPOSE 8110

# Start your app
CMD ["pnpm", "start"]
