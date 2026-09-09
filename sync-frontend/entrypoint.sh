#!/bin/sh
set -e
envsubst '$VITE_API_URL' < /etc/nginx/templates/nginx.conf.template > /etc/nginx/conf.d/default.conf
exec nginx -g 'daemon off;'