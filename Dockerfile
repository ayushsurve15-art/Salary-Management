# syntax=docker/dockerfile:1

# Build stage: install everything, then compile the server and bundle the client.
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY server/package.json server/
COPY client/package.json client/
RUN npm ci
COPY tsconfig.base.json ./
COPY server server
COPY client client
RUN npm run build

# Runtime stage: production dependencies of the server only, plus the built output.
FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production \
    PORT=4000 \
    DATABASE_PATH=/app/data/salary.db
WORKDIR /app
COPY package.json package-lock.json ./
COPY server/package.json server/
COPY client/package.json client/
RUN npm ci --omit=dev --workspace server && npm cache clean --force
COPY --from=build /app/server/dist server/dist
COPY server/migrations server/migrations
COPY --from=build /app/client/dist client/dist
RUN mkdir -p /app/data && chown node:node /app/data
USER node
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=3s --start-period=20s \
  CMD node -e "fetch('http://localhost:'+process.env.PORT+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server/dist/index.js"]
