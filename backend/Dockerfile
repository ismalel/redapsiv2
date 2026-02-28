# Development stage
FROM node:20-alpine AS development

WORKDIR /app

# Install dependencies needed for some native modules
RUN apk add --no-cache libc6-compat curl openssl

# Copy package.json and package-lock.json if they exist
COPY package*.json ./

# Install all dependencies (including dev)
RUN npm install

# Copy source code
COPY . .

# Ensure prisma client is generated
RUN npx prisma generate

# Expose the port
EXPOSE 3000

# Start in development mode
CMD ["npm", "run", "dev"]

# Production build stage
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build

# Production runtime stage
FROM node:20-alpine AS production

WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
RUN npx prisma generate

EXPOSE 3000
CMD ["npm", "run", "start"]
