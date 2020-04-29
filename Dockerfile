FROM cloudron/base:1.0.0

ARG N8N_VERSION=0.64.0
ARG NODE_VERSION=12.16.3

RUN apt-get update && \
    apt-get -y install graphicsmagick && \
    rm -rf /var/cache/apt /var/lib/apt/lists

RUN mkdir -p /usr/local/node-${NODE_VERSION} && \
    curl -L https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.gz | tar zxf - --strip-components 1 -C /usr/local/node-${NODE_VERSION} && \
    chown -R cloudron:cloudron /usr/local/node-${NODE_VERSION}

ENV PATH="/usr/local/node-${NODE_VERSION}/bin:$PATH"
ENV NPM_CONFIG_USER=cloudron

RUN npm install -g request@^2.34 n8n@${N8N_VERSION}

RUN crudini --set /etc/supervisor/supervisord.conf supervisord logfile /run/supervisord.log && \
	crudini --set /etc/supervisor/supervisord.conf supervisord logfile_backups 0
ADD supervisor/ /etc/supervisor/conf.d/

RUN mkdir -p /app/pkg
ADD pkg/ /app/pkg/

RUN mkdir -p /app/data && chown -R cloudron:cloudron /app/data

# Fixes:
#   * Error: EROFS: read-only file system, mkdir '/root/.cache'
#   * Error: EROFS: read-only file system, mkdir '/root/.n8n'
# For runner processes, which don't seem to run as the configured user
RUN ln -s /app/data/.cache /root/.cache && \
    ln -s /app/data/.n8n /root/.n8n

WORKDIR /app/data

ENV N8N_CUSTOM_EXTENSIONS="/app/data/custom"
ENV N8N_USER_FOLDER="/app/data"

CMD [ "/app/pkg/start.sh" ]
