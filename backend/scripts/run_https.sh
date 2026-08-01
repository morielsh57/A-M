#!/usr/bin/env sh
set -eu

BACKEND_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
CERT_DIR="$BACKEND_DIR/.certs"
CERT_FILE="$CERT_DIR/localhost-cert.pem"
KEY_FILE="$CERT_DIR/localhost-key.pem"

mkdir -p "$CERT_DIR"

if [ ! -f "$CERT_FILE" ] || [ ! -f "$KEY_FILE" ]; then
  openssl req \
    -x509 \
    -nodes \
    -newkey rsa:2048 \
    -days 365 \
    -keyout "$KEY_FILE" \
    -out "$CERT_FILE" \
    -subj "/CN=localhost" \
    -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"
fi

exec "$BACKEND_DIR/venv/bin/uvicorn" config.asgi:application \
  --app-dir "$BACKEND_DIR" \
  --host 127.0.0.1 \
  --port 8000 \
  --ssl-keyfile "$KEY_FILE" \
  --ssl-certfile "$CERT_FILE"
