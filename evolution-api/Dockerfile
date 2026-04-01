FROM atendai/evolution-api:v2.2.3

ENV SERVER_PORT=8080
ENV DOCKER_ENV=true

# Persistence
ENV STORE_CLEANING_INTERVAL=7200
ENV STORE_CLEANING_TERMINAL=7200

# Database (PostgreSQL from Railway)
ENV DATABASE_ENABLED=true
ENV DATABASE_PROVIDER=postgresql
# DATABASE_CONNECTION_URI is set via Railway variables

# Redis disabled (single instance)
ENV CACHE_REDIS_ENABLED=false

# RabbitMQ disabled
ENV RABBITMQ_ENABLED=false

# Websocket
ENV WEBSOCKET_ENABLED=false

# Chatwoot disabled
ENV CHATWOOT_ENABLED=false

# Typebot disabled
ENV TYPEBOT_ENABLED=false

# --- Fix Baileys connection timeout on Railway ---
# Increase connection timeout for Baileys WebSocket
ENV WA_BAILEYS_TIMEOUT_MS=120000
ENV QRCODE_EXPIRATION_TIME=60
# Keep connection alive
ENV WA_BAILEYS_KEEP_ALIVE_INTERVAL_MS=25000
# Retry connection on failure
ENV CONFIG_SESSION_PHONE_CLIENT="ClaudioBot"
ENV CONFIG_SESSION_PHONE_NAME="Chrome"
# Node.js network settings to prevent premature timeout
ENV NODE_OPTIONS="--max-http-header-size=16384"
ENV UV_THREADPOOL_SIZE=16

EXPOSE 8080
