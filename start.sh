#!/bin/bash

set -eu

echo "=> Ensure directories"
mkdir -p /run/n8n /app/data/.n8n /app/data/custom-extensions /app/data/configs

# cleanup older unused locations
rm -rf /app/data/output /app/data/root

source /app/data/env

# migration from older location
[[ -f /app/data/.n8n/app-config.json ]] && mv /app/data/.n8n/app-config.json /app/data/configs/default.json
[[ -d /app/data/custom ]] && mv /app/data/custom /app/data/custom-extensions

CONFIG_FILE="/app/data/configs/default.json"

[[ ! -f $CONFIG_FILE ]] && echo "{}" > $CONFIG_FILE

echo "=> Loading configuration"
export VUE_APP_URL_BASE_API="${CLOUDRON_APP_ORIGIN}/"
export WEBHOOK_TUNNEL_URL="${CLOUDRON_APP_ORIGIN}/"
export N8N_VERSION_NOTIFICATIONS_ENABLED=false
export N8N_DIAGNOSTICS_ENABLED=false

cat $CONFIG_FILE | \
    jq '.database.type="postgresdb"' | \
    jq '.database.postgresdb.host=env.CLOUDRON_POSTGRESQL_HOST' | \
    jq '.database.postgresdb.port=env.CLOUDRON_POSTGRESQL_PORT' | \
    jq '.database.postgresdb.user=env.CLOUDRON_POSTGRESQL_USERNAME' | \
    jq '.database.postgresdb.password=env.CLOUDRON_POSTGRESQL_PASSWORD' | \
    jq '.database.postgresdb.database=env.CLOUDRON_POSTGRESQL_DATABASE' \
    > /tmp/app-config.json && mv /tmp/app-config.json $CONFIG_FILE

echo "=> Setting permissions"
chown -R cloudron:cloudron /run/n8n /app/data

echo "=> Starting N8N"
exec gosu cloudron:cloudron /app/code/node_modules/.bin/n8n start
