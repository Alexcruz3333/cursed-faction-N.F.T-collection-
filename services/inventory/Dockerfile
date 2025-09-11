# syntax=docker/dockerfile:1.18
FROM node:20-alpine AS base
WORKDIR /app

COPY package.json tsconfig.base.json ./
COPY packages ./packages
COPY services ./services
RUN npm install

RUN npm --workspace packages/common run build && npm --workspace services/inventory run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/services/inventory/dist ./services/inventory/dist

EXPOSE 4003
CMD ["node", "services/inventory/dist/index.js"]