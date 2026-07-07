# Gaia Vault — Cloud Run container.
# Served on gaiaapp.net via a Firebase Hosting rewrite (/vault-app/** -> this
# service), so the app is built with a matching basePath. NEXT_PUBLIC_* values
# are baked in at build time; override with --build-arg if the path or mode
# changes. Demo mode stays on until the production database is configured
# (see docs/DEPLOY-FIREBASE.md).

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
ARG NEXT_PUBLIC_BASE_PATH=/vault-app
ARG NEXT_PUBLIC_DEMO_MODE=true
ENV NEXT_PUBLIC_BASE_PATH=$NEXT_PUBLIC_BASE_PATH \
    NEXT_PUBLIC_DEMO_MODE=$NEXT_PUBLIC_DEMO_MODE \
    NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production \
    PORT=8080 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
EXPOSE 8080
USER node
CMD ["node", "server.js"]
