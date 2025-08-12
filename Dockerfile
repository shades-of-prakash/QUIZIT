# Stage 1 — Build the React app
FROM oven/bun:1.2 AS build

WORKDIR /app

# Copy dependency files first for better cache
COPY package.json bun.lockb* ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy the rest of the project
COPY . .

# Build React app
RUN bun run build

# Stage 2 — Serve with Nginx
FROM nginx:1.27-alpine AS production

# Copy build output from Bun stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 8080
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
