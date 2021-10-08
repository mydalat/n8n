#!/bin/bash

set -eu

echo "=> Ensure directories"
mkdir -p /run/n8n /app/data/.cache /app/data/.n8n /app/data/custom /app/data/output /app/data/root

[[ -f /app/data/.env ]] && mv /app/data/.env /app/data/env 

if [[ ! -f "/app/data/env" ]]; then
  cp -r /app/pkg/sample.env /app/data/env
fi

export $(egrep -v '^#' /app/data/env | xargs) &> /dev/null

CONFIG_FILE="/app/data/.n8n/app-config.json"

if [[ ! -f $CONFIG_FILE ]]; then
  echo "=> Creating config file"
  echo "{}" > $CONFIG_FILE
fi

echo "=> Loading configuration"
export VUE_APP_URL_BASE_API="${CLOUDRON_APP_ORIGIN}/"
export WEBHOOK_TUNNEL_URL="${CLOUDRON_APP_ORIGIN}/"
export N8N_VERSION_NOTIFICATIONS_ENABLED=false

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
