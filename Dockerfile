# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Route modules create OpenAI/Pinecone clients at import time, so `next build`
# needs real env values. Mounted as a secret so it never lands in an image layer.
RUN --mount=type=secret,id=dotenv,target=/app/.env \
    npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

# Full node_modules is kept: the worker runs through tsx
COPY --from=build --chown=node:node /app ./

USER node
EXPOSE 3000

CMD ["node_modules/.bin/next", "start", "-H", "0.0.0.0", "-p", "3000"]
