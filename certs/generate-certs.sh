#!/bin/sh
# ==============================================================================
# CineEvent - Self-Signed SSL Certificate Generator
# ==============================================================================

set -e

CERT_DIR="$(dirname "$0")"
KEY_FILE="$CERT_DIR/selfsigned.key"
CRT_FILE="$CERT_DIR/selfsigned.crt"

echo "=== ĐANG KHỞI TẠO CHỨNG CHỈ SSL TỰ KÝ CHO CINEEVENT ==="

if [ -f "$KEY_FILE" ] && [ -f "$CRT_FILE" ]; then
    echo "Chứng chỉ SSL đã tồn tại tại $CERT_DIR. Bỏ qua bước tạo mới."
    exit 0
fi

mkdir -p "$CERT_DIR"

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "$KEY_FILE" \
    -out "$CRT_FILE" \
    -subj "/C=VN/ST=Hanoi/L=Hanoi/O=CineEvent Academy/OU=Software Deployment/CN=localhost"

chmod 600 "$KEY_FILE"
chmod 644 "$CRT_FILE"

echo "Tạo chứng chỉ SSL tự ký thành công:"
echo " - Private Key: $KEY_FILE"
echo " - Certificate: $CRT_FILE"
echo "Lưu ý: Do là chứng chỉ tự ký (Self-signed) phục vụ môi trường học tập và kiểm thử,"
echo "trình duyệt có thể hiển thị cảnh báo 'Your connection is not private'. Bạn chỉ cần chọn 'Advanced -> Proceed to localhost'."
