FROM cloudron/base:3.0.0@sha256:455c70428723e3a823198c57472785437eb6eab082e79b3ff04ea584faf46e92

ARG N8N_VERSION=0.141.1
ARG NODE_VERSION=14.17.0

ENV N8N_CUSTOM_EXTENSIONS="/app/data/custom" \
    N8N_USER_FOLDER="/app/data" \
    N8N_CONFIG_FILES="/app/data/.n8n/app-config.json" \
    N8N_VERSION_NOTIFICATIONS_ENABLED="false" \
    N8N_LOG_OUTPUT="console"

RUN mkdir -p /app/pkg
COPY start.sh sample.env /app/pkg/

RUN apt-get update && \
    apt-get -y install graphicsmagick && \
    rm -rf /var/cache/apt /var/lib/apt/lists

RUN mkdir -p /usr/local/node-${NODE_VERSION} && \
    curl -L https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.gz | tar zxf - --strip-components 1 -C /usr/local/node-${NODE_VERSION} && \
    chown -R cloudron:cloudron /usr/local/node-${NODE_VERSION}

ENV PATH="/usr/local/node-${NODE_VERSION}/bin:$PATH" \
    NPM_CONFIG_USER=cloudron

RUN npm install -g n8n@${N8N_VERSION}

RUN crudini --set /etc/supervisor/supervisord.conf supervisord logfile /run/supervisord.log && \
	crudini --set /etc/supervisor/supervisord.conf supervisord logfile_backups 0

# Fixes:
#   * Error: EROFS: read-only file system, mkdir '/root/.cache'
#   * Error: EROFS: read-only file system, mkdir '/root/.n8n'
# For runner processes, which don't seem to run as the configured user
RUN rm -rf /root/ && \
    ln -s /app/data/root /root
#    ln -s /app/data/.n8n /root/.n8n

WORKDIR /app/data

CMD [ "/app/pkg/start.sh" ]
