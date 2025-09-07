# syntax=docker/dockerfile:1.18
FROM node:20-alpine AS base
WORKDIR /app

COPY package.json tsconfig.base.json ./
COPY packages ./packages
COPY services ./services
RUN npm install

RUN npm --workspace packages/common run build && npm --workspace services/matchmaking run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/services/matchmaking/dist ./services/matchmaking/dist

EXPOSE 4001
CMD ["node", "services/matchmaking/dist/index.js"]