# ---------- Backend Stage ----------
FROM oven/bun:1 AS backend
WORKDIR /usr/src/app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

EXPOSE 4000
CMD ["bun",  "start"] 


# ---------- Frontend Stage ----------
FROM nginx:1.27-alpine AS frontend

# Copy nginx config into container
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built frontend into nginx html folder
COPY --from=backend /usr/src/app/dist /usr/share/nginx/html
