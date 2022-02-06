FROM cloudron/base:3.2.0@sha256:ba1d566164a67c266782545ea9809dc611c4152e27686fd14060332dd88263ea

RUN mkdir -p /app/pkg /app/code
WORKDIR /app/code

RUN apt-get update && \
    apt-get -y install graphicsmagick && \
    rm -rf /var/cache/apt /var/lib/apt/lists

ARG N8N_VERSION=0.162.0
ARG NODE_VERSION=14.17.0

# install node
RUN mkdir -p /usr/local/node-${NODE_VERSION} && \
    curl -L https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.gz | tar zxf - --strip-components 1 -C /usr/local/node-${NODE_VERSION}
ENV PATH="/usr/local/node-${NODE_VERSION}/bin:$PATH"

# n8n. handlebars and jsonata are just helpful modules that user can enable
RUN npm install n8n@${N8N_VERSION}  && \
    npm install handlebars jsonata marked

# npm config set cache --global /run/npmcache
RUN rm -rf /root/.npm && ln -s /run/npmcache /root/.npm

COPY start.sh sample.env /app/pkg/

CMD [ "/app/pkg/start.sh" ]
