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

EXPOSE 8080
