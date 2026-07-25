#!/bin/sh

NGINX_PORT=${PORT:-10000}
APP_PORT=8080

# Replace placeholders in nginx config
sed -e "s/NGINX_PORT/$NGINX_PORT/g" -e "s/APP_PORT/$APP_PORT/g" \
    /etc/nginx/conf.d/default.conf > /tmp/nginx.conf
mv /tmp/nginx.conf /etc/nginx/conf.d/default.conf

# Start ASP.NET Core in background
export ASPNETCORE_URLS="http://0.0.0.0:$APP_PORT"
dotnet backend.dll &
DOTNET_PID=$!

# Wait for .NET app to be ready
echo "Waiting for ASP.NET Core on port $APP_PORT..."
for i in $(seq 1 30); do
    if wget -q --spider "http://127.0.0.1:$APP_PORT/health" 2>/dev/null; then
        echo "ASP.NET Core is ready."
        break
    fi
    sleep 1
done

# Start nginx in foreground (Render needs the main process to stay alive)
echo "Starting nginx on port $NGINX_PORT (proxying to $APP_PORT)..."
nginx -g 'daemon off;'
