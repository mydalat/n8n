#!/bin/bash

set -eu

echo "=> Ensure directories"
mkdir -p /run/npmcache /app/data/user/.n8n /app/data/custom-extensions /app/data/configs /app/data/modules

CONFIG_FILE="/app/data/configs/default.json"

[[ ! -f $CONFIG_FILE ]] && echo "{}" > $CONFIG_FILE

echo "=> Loading configuration"
export VUE_APP_URL_BASE_API="${CLOUDRON_APP_ORIGIN}/"
export WEBHOOK_TUNNEL_URL="${CLOUDRON_APP_ORIGIN}/"
export N8N_VERSION_NOTIFICATIONS_ENABLED=false
export N8N_DIAGNOSTICS_ENABLED=false
export N8N_CUSTOM_EXTENSIONS="/app/data/custom-extensions"
export N8N_USER_FOLDER="/app/data/user" # always uses .n8n underneath
export N8N_CONFIG_FILES="/app/data/configs/default.json"
export N8N_LOG_OUTPUT="console"
[[ ! -f "/app/data/env" ]] && cp /app/pkg/sample.env /app/data/env
source /app/data/env

cat $CONFIG_FILE | \
    jq '.database.type="postgresdb"' | \
    jq '.database.postgresdb.host=env.CLOUDRON_POSTGRESQL_HOST' | \
    jq '.database.postgresdb.port=env.CLOUDRON_POSTGRESQL_PORT' | \
    jq '.database.postgresdb.user=env.CLOUDRON_POSTGRESQL_USERNAME' | \
    jq '.database.postgresdb.password=env.CLOUDRON_POSTGRESQL_PASSWORD' | \
    jq '.database.postgresdb.database=env.CLOUDRON_POSTGRESQL_DATABASE' \
    > /tmp/app-config.json && mv /tmp/app-config.json $CONFIG_FILE

echo "=> Setting permissions"
chown -R cloudron:cloudron /app/data

echo "=> Starting N8N"
exec gosu cloudron:cloudron /app/code/node_modules/.bin/n8n start
