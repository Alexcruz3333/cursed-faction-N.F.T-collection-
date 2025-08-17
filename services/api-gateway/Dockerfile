# syntax=docker/dockerfile:1.6
FROM node:20-alpine AS base
WORKDIR /app

# Install deps monorepo-wide
COPY package.json tsconfig.base.json ./
COPY packages ./packages
COPY services ./services
RUN npm install

# Build common and service
RUN npm --workspace packages/common run build && npm --workspace services/api-gateway run build

# Runtime image
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/services/api-gateway/dist ./services/api-gateway/dist

EXPOSE 8080
CMD ["node", "services/api-gateway/dist/index.js"]