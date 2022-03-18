#!/bin/bash

set -eu

echo "=> Ensure directories"
mkdir -p /run/npmcache /app/data/user/.n8n /app/data/custom-extensions /app/data/configs

# unused path
rm -rf /app/data/modules

config_file="/app/data/configs/default.json"

[[ ! -f $config_file ]] && echo "{}" > $config_file

echo "=> Loading configuration"
export VUE_APP_URL_BASE_API="${CLOUDRON_APP_ORIGIN}/"
export WEBHOOK_TUNNEL_URL="${CLOUDRON_APP_ORIGIN}/"
export N8N_VERSION_NOTIFICATIONS_ENABLED=false
export N8N_DIAGNOSTICS_ENABLED=false
export N8N_CUSTOM_EXTENSIONS="/app/data/custom-extensions"
export N8N_USER_FOLDER="/app/data/user" # always uses .n8n underneath
export N8N_CONFIG_FILES="/app/data/configs/default.json"
export N8N_LOG_OUTPUT="console"
export N8N_EMAIL_MODE="smtp"
export N8N_SMTP_HOST="${CLOUDRON_MAIL_SMTP_SERVER}"
export N8N_SMTP_PORT="${CLOUDRON_MAIL_SMTP_PORT}"
export N8N_SMTP_USER="${CLOUDRON_MAIL_SMTP_USERNAME}"
export N8N_SMTP_PASS="${CLOUDRON_MAIL_SMTP_PASSWORD}"
export N8N_SMTP_SENDER="${CLOUDRON_MAIL_FROM}"
export N8N_SMTP_SSL=false

[[ ! -f "/app/data/env" ]] && cp /app/pkg/sample.env /app/data/env
source /app/data/env

cat $config_file | \
    jq '.database.type="postgresdb"' | \
    jq '.database.postgresdb.host=env.CLOUDRON_POSTGRESQL_HOST' | \
    jq '.database.postgresdb.port=env.CLOUDRON_POSTGRESQL_PORT' | \
    jq '.database.postgresdb.user=env.CLOUDRON_POSTGRESQL_USERNAME' | \
    jq '.database.postgresdb.password=env.CLOUDRON_POSTGRESQL_PASSWORD' | \
    jq '.database.postgresdb.database=env.CLOUDRON_POSTGRESQL_DATABASE' \
    > /tmp/app-config.json && mv /tmp/app-config.json $config_file

echo "=> Setting permissions"
chown -R cloudron:cloudron /app/data

echo "=> Starting N8N"
exec gosu cloudron:cloudron /app/code/node_modules/.bin/n8n start
