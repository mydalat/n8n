#!/bin/bash

set -eu

echo "=> Generating nginx.conf"
sed -e "s,##HOSTNAME##,${CLOUDRON_APP_DOMAIN}," \
    /app/pkg/nginx.conf  > /run/nginx.conf

echo "=> Ensure directories"
mkdir -p /run/nginx /app/data/.cache /app/data/.n8n /app/data/custom /app/data/output /app/data/root

if [[ ! -f "/app/data/.env" ]]; then
  cp -r /app/code/sample.env /app/data/.env
fi

if [[ -f "/app/data/.env" ]]; then
    export $(egrep -v '^#' /app/data/.env | xargs) &> /dev/null
fi

CONFIG_FILE="/app/data/.n8n/app-config.json"

if [[ ! -f $CONFIG_FILE ]]; then
  echo "=> Creating config file"
  echo "{}" > $CONFIG_FILE
fi

echo "=> Loading configuration"
export VUE_APP_URL_BASE_API="${CLOUDRON_APP_ORIGIN}/"
export WEBHOOK_TUNNEL_URL="${CLOUDRON_APP_ORIGIN}/"

cat $CONFIG_FILE | \
jq '.database.type="postgresdb"' | \
jq '.database.postgresdb.host=env.CLOUDRON_POSTGRESQL_HOST' | \
jq '.database.postgresdb.port=env.CLOUDRON_POSTGRESQL_PORT' | \
jq '.database.postgresdb.user=env.CLOUDRON_POSTGRESQL_USERNAME' | \
jq '.database.postgresdb.password=env.CLOUDRON_POSTGRESQL_PASSWORD' | \
jq '.database.postgresdb.database=env.CLOUDRON_POSTGRESQL_DATABASE' \
> /tmp/app-config.json && mv /tmp/app-config.json $CONFIG_FILE

echo "=> Setting permissions"
chown -R cloudron:cloudron /run /app/data

echo "=> Starting N8N"
exec /usr/bin/supervisord --configuration /etc/supervisor/supervisord.conf --nodaemon -i N8N
