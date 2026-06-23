# Multi-stage production build for Vite SPA
# Stage 1: Install dependencies and build static assets
FROM node:20-alpine AS build
WORKDIR /app

# Copy package manifests for efficient cache layer caching
COPY package*.json ./
RUN npm ci

# Copy the rest of the workspace files
COPY . .

# Build the client SPA into the static './dist/' directory
RUN npm run build

# Stage 2: Serve the build artifact output using lightweight Nginx
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration supporting React/Vite router fallbacks
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
