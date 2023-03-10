FROM cloudron/base:4.0.0@sha256:31b195ed0662bdb06a6e8a5ddbedb6f191ce92e8bee04c03fb02dd4e9d0286df

RUN mkdir -p /app/pkg /app/code
WORKDIR /app/code

RUN apt-get update && \
    apt-get -y install graphicsmagick recutils asciidoctor pandoc && \
    rm -rf /var/cache/apt /var/lib/apt/lists

ARG N8N_VERSION=0.219.0

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

COPY start.sh env.sh.template /app/pkg/

CMD [ "/app/pkg/start.sh" ]
