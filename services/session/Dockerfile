# syntax=docker/dockerfile:1.18
FROM node:22-alpine AS base
WORKDIR /app

COPY package.json tsconfig.base.json ./
COPY packages ./packages
COPY services ./services
RUN npm install

RUN npm --workspace packages/common run build && npm --workspace services/session run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/services/session/dist ./services/session/dist

EXPOSE 4002
CMD ["node", "services/session/dist/index.js"]