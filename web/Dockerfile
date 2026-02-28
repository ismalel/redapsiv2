FROM node:20-alpine AS development

WORKDIR /app

# Install dependencies needed for some native modules
RUN apk add --no-cache libc6-compat openssl

# Copy package.json and package-lock.json if they exist
COPY package*.json ./

# Install all dependencies (including dev)
RUN npm install

# Copy source code
COPY . .

# Expose the port (Vite default)
EXPOSE 5173

# Start Vite dev server
# --host 0.0.0.0 is needed for Docker to expose correctly
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# Production build stage
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production runtime stage (using Nginx)
FROM nginx:alpine AS production

COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
