-- ==============================================================================
-- DATABASE HARDENING: LEAST PRIVILEGE USERS
-- Thiết lập tài khoản ứng dụng và exporter theo nguyên tắc đặc quyền tối thiểu
-- ==============================================================================

-- 1. Create Application User with access to cineevent_db (compatible with phpMyAdmin)
CREATE USER IF NOT EXISTS 'cineevent_user'@'%' IDENTIFIED WITH mysql_native_password BY 'CineEvent_UserSecurePass_2026!';
ALTER USER 'cineevent_user'@'%' IDENTIFIED WITH mysql_native_password BY 'CineEvent_UserSecurePass_2026!';
GRANT ALL PRIVILEGES ON cineevent_db.* TO 'cineevent_user'@'%';

-- 2. Create Exporter User for Prometheus mysqld_exporter
CREATE USER IF NOT EXISTS 'exporter'@'%' IDENTIFIED WITH mysql_native_password BY 'Exporter_SecurePassword_2026!';
ALTER USER 'exporter'@'%' IDENTIFIED WITH mysql_native_password BY 'Exporter_SecurePassword_2026!';
GRANT PROCESS, REPLICATION CLIENT, SELECT ON *.* TO 'exporter'@'%';

FLUSH PRIVILEGES;
