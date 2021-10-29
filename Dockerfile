FROM cloudron/base:3.0.0@sha256:455c70428723e3a823198c57472785437eb6eab082e79b3ff04ea584faf46e92

ARG N8N_VERSION=0.146.0
ARG NODE_VERSION=14.17.0

ENV N8N_CUSTOM_EXTENSIONS="/app/data/custom-extensions" \
    N8N_USER_FOLDER="/app/data" \
    N8N_CONFIG_FILES="/app/data/configs/default.json" \
    N8N_VERSION_NOTIFICATIONS_ENABLED="false" \
    N8N_LOG_OUTPUT="console"

RUN mkdir -p /app/pkg /app/code
WORKDIR /app/code
COPY start.sh sample.env /app/pkg/

RUN apt-get update && \
    apt-get -y install graphicsmagick && \
    rm -rf /var/cache/apt /var/lib/apt/lists

RUN mkdir -p /usr/local/node-${NODE_VERSION} && \
    curl -L https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.gz | tar zxf - --strip-components 1 -C /usr/local/node-${NODE_VERSION}

ENV PATH="/usr/local/node-${NODE_VERSION}/bin:$PATH"

RUN npm install n8n@${N8N_VERSION}

CMD [ "/app/pkg/start.sh" ]
