#!/bin/bash

set -eu

echo "=> Generating nginx.conf"
sed -e "s,##HOSTNAME##,${CLOUDRON_APP_DOMAIN}," \
    /app/pkg/nginx.conf  > /run/nginx.conf

echo "=> Ensure directories"
mkdir -p /run/nginx /app/data/.cache /app/data/.n8n /app/data/custom /app/data/output

if [[ ! -f /app/data/.n8n/config ]]; then
  echo "=> Creating config file"
  echo "{}" > /app/data/.n8n/config

  echo "=> Setting initial config values"
  cat /app/data/.n8n/config | \
  jq '.security.basicAuth.active=true' | \
  jq '.security.basicAuth.user="admin"' | \
  jq '.security.basicAuth.password="changeme"' \
  > /app/data/.n8n/config.json && \
  mv /app/data/.n8n/config.json /app/data/.n8n/config
fi

echo "=> Loading configuration"
export VUE_APP_URL_BASE_API="${CLOUDRON_APP_ORIGIN}/"
export WEBHOOK_TUNNEL_URL="${CLOUDRON_APP_ORIGIN}/"

cat /app/data/.n8n/config | \
jq '.database.type="postgresdb"' | \
jq '.database.postgresdb.host=env.CLOUDRON_POSTGRESQL_HOST' | \
jq '.database.postgresdb.port=env.CLOUDRON_POSTGRESQL_PORT' | \
jq '.database.postgresdb.user=env.CLOUDRON_POSTGRESQL_USERNAME' | \
jq '.database.postgresdb.password=env.CLOUDRON_POSTGRESQL_PASSWORD' | \
jq '.database.postgresdb.database=env.CLOUDRON_POSTGRESQL_DATABASE' \
> /app/data/.n8n/config.json && \
mv /app/data/.n8n/config.json /app/data/.n8n/config


echo "=> Setting permissions"
chown -R cloudron:cloudron /run /app/data

echo "=> Starting N8N"
exec /usr/bin/supervisord --configuration /etc/supervisor/supervisord.conf --nodaemon -i N8N
