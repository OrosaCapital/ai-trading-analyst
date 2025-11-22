FROM node:18-alpine
WORKDIR /app
COPY ai-trading-analyst/scripts ./scripts
WORKDIR /app/scripts
RUN npm init -y && npm i ioredis ws --no-audit --no-fund || true
CMD ["node", "live_xrp_relay.cjs"]
