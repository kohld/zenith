# Stage 1: Base image
FROM oven/bun:1.2-slim AS base

WORKDIR /app

# Pre-create node_modules and set permissions
RUN mkdir -p /app/node_modules && chown -R bun:bun /app

# Stage 2: Development & Build
FROM base AS development

# Switch to non-root user
USER bun

# Install dependencies
COPY --chown=bun:bun package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy application source
COPY --chown=bun:bun . .

EXPOSE 5173

CMD ["bun", "run", "dev", "--host"]
