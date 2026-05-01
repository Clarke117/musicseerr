#!/bin/sh
set -e

# Ensure config directory and subdirs exist and are writable by the node user
mkdir -p /app/config/logs
chown -R node:node /app/config

exec su-exec node "$@"
