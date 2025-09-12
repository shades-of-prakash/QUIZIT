# ---------- Build Stage ----------
FROM oven/bun:1 AS build

# Set working directory
WORKDIR /usr/src/app

# Copy dependency files
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy the full project
COPY . .

# Build the app (this runs your "build" script in package.json)
RUN bun run build


# ---------- Runtime Stage ----------
FROM oven/bun:1 AS runtime

WORKDIR /usr/src/app

# Copy only what's needed from build stage
COPY --from=build /usr/src/app ./

# Expose app port
EXPOSE 4000

# Start the app (uses "start" script from package.json)
CMD ["bun", "start"]
