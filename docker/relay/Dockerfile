FROM node:18-alpine

# Minimal image to run the relay service located in ai-trading-analyst
WORKDIR /app

# Copy project folder (only ai-trading-analyst) into the image
COPY ai-trading-analyst/ ./ai-trading-analyst/

WORKDIR /app/ai-trading-analyst

# Install dependencies
RUN npm ci --no-audit --no-fund || npm install --no-audit --no-fund

# Set sensible defaults; in docker-compose we wire REDIS_URL
ENV PORT=4000
ENV REDIS_URL=redis://redis:6379

EXPOSE 4000

CMD ["node", "server/relay.js"]
