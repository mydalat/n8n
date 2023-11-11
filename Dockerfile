FROM cloudron/base:4.2.0@sha256:46da2fffb36353ef714f97ae8e962bd2c212ca091108d768ba473078319a47f4

RUN mkdir -p /app/pkg /app/code
WORKDIR /app/code

RUN apt-get update && \
    apt-get -y install graphicsmagick recutils asciidoctor pandoc musl && \
    rm -rf /var/cache/apt /var/lib/apt/lists

RUN ln -s /usr/lib/x86_64-linux-musl/libc.so /lib/libc.musl-x86_64.so.1

ARG N8N_VERSION=1.15.2

# n8n. handlebars and jsonata are just helpful modules that user can enable
RUN npm install n8n@${N8N_VERSION}  && \
    npm install handlebars@4.7.7 jsonata@2.0.2 marked@4.3.0 bwip-js@3.3.0 ajv-formats@2.1.1 odoo-xmlrpc@1.0.8 firebase-admin@11.10.1

# npm config set cache --global /run/npmcache
RUN rm -rf /app/code/node_modules/n8n/dist/public && ln -s /run/public /app/code/node_modules/n8n/dist/public

# this allows to use the CLI easily without having to set these
ENV N8N_USER_FOLDER="/app/data/user"
ENV N8N_CONFIG_FILES="/app/data/configs/default.json"
ENV N8N_CUSTOM_EXTENSIONS="/app/data/custom-extensions"

# put n8n binary in the path
ENV PATH=/app/code/node_modules/.bin:$PATH

COPY start.sh env.sh.template /app/pkg/

CMD [ "/app/pkg/start.sh" ]
