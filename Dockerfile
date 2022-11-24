FROM cloudron/base:3.2.0@sha256:ba1d566164a67c266782545ea9809dc611c4152e27686fd14060332dd88263ea

RUN mkdir -p /app/pkg /app/code
WORKDIR /app/code

RUN apt-get update && \
    apt-get -y install graphicsmagick recutils asciidoctor pandoc && \
    rm -rf /var/cache/apt /var/lib/apt/lists

ARG N8N_VERSION=0.204.0
ARG NODE_VERSION=16.15.0

# install node
RUN mkdir -p /usr/local/node-${NODE_VERSION} && \
    curl -L https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.gz | tar zxf - --strip-components 1 -C /usr/local/node-${NODE_VERSION}
ENV PATH="/usr/local/node-${NODE_VERSION}/bin:$PATH"

# n8n. handlebars and jsonata are just helpful modules that user can enable
RUN npm install n8n@${N8N_VERSION}  && \
    npm install handlebars jsonata marked bwip-js ajv-formats

# npm config set cache --global /run/npmcache
RUN rm -rf /root/.npm && ln -s /run/npmcache /root/.npm
RUN rm -rf /home/cloudron/.npm && ln -s /run/npmcache /home/cloudron/.npm
RUN rm -rf /home/cloudron/.cache && ln -s /run/cloudron.cache /home/cloudron/.cache
RUN rm -rf /app/code/node_modules/n8n/dist/public && ln -s /run/public /app/code/node_modules/n8n/dist/public

# this allows to use the CLI easily without having to set these
ENV N8N_USER_FOLDER="/app/data/user"
ENV N8N_CONFIG_FILES="/app/data/configs/default.json"
ENV N8N_CUSTOM_EXTENSIONS="/app/data/custom-extensions"

COPY start.sh sample.env /app/pkg/

CMD [ "/app/pkg/start.sh" ]
