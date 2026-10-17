# CineEvent SSL Certificates

Thư mục này chứa script tạo chứng chỉ SSL tự ký (`selfsigned.crt` và `selfsigned.key`) phục vụ triển khai HTTPS và Reverse Proxy Nginx trong môi trường học tập.

## Hướng dẫn tạo chứng chỉ:

### Trên Linux / macOS / Git Bash:
```bash
chmod +x certs/generate-certs.sh
./certs/generate-certs.sh
```

### Trên Windows PowerShell:
```powershell
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout certs/selfsigned.key -out certs/selfsigned.crt -subj "/C=VN/ST=Hanoi/L=Hanoi/O=CineEvent/CN=localhost"
```

*Lưu ý bảo mật (Hardening):*
- Các tệp `.key` và `.crt` tự sinh đã được loại trừ trong `.gitignore` để không bao giờ bị commit vào GitHub.
- Container Nginx được tích hợp script tự động tạo chứng chỉ nếu chưa có sẵn khi chạy lệnh `docker compose up -d --build`.
