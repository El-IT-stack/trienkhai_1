#!/bin/sh
set -e

CERT_DIR="/etc/nginx/certs"
KEY_FILE="$CERT_DIR/selfsigned.key"
CRT_FILE="$CERT_DIR/selfsigned.crt"

mkdir -p "$CERT_DIR"

if [ ! -f "$KEY_FILE" ] || [ ! -f "$CRT_FILE" ]; then
    echo "[NGINX ENTRYPOINT] Đang tự động khởi tạo chứng chỉ SSL tự ký..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$KEY_FILE" \
        -out "$CRT_FILE" \
        -subj "/C=VN/ST=Hanoi/L=Hanoi/O=CineEvent/OU=DevOps/CN=localhost"
    chmod 600 "$KEY_FILE"
    chmod 644 "$CRT_FILE"
    echo "[NGINX ENTRYPOINT] Khởi tạo chứng chỉ SSL thành công."
fi

exec "$@"
