FROM cloudron/base:3.0.0@sha256:455c70428723e3a823198c57472785437eb6eab082e79b3ff04ea584faf46e92

ARG N8N_VERSION=0.152.0
ARG NODE_VERSION=14.17.0

RUN mkdir -p /app/pkg /app/code
WORKDIR /app/code

RUN apt-get update && \
    apt-get -y install graphicsmagick && \
    rm -rf /var/cache/apt /var/lib/apt/lists

# install node
RUN mkdir -p /usr/local/node-${NODE_VERSION} && \
    curl -L https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.gz | tar zxf - --strip-components 1 -C /usr/local/node-${NODE_VERSION}
ENV PATH="/usr/local/node-${NODE_VERSION}/bin:$PATH"

# n8n. handlebars and jsonata are just helpful modules that user can enable
RUN npm install n8n@${N8N_VERSION}  && \
    npm install handlebars jsonata

# npm config set cache --global /run/npmcache
RUN rm -rf /root/.npm && ln -s /run/npmcache /root/.npm

COPY start.sh sample.env /app/pkg/

CMD [ "/app/pkg/start.sh" ]
