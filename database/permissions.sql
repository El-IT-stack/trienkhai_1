-- ==============================================================================
-- DATABASE HARDENING: LEAST PRIVILEGE USERS
-- Thiết lập tài khoản ứng dụng và exporter theo nguyên tắc đặc quyền tối thiểu
-- ==============================================================================

-- 1. Create Application User with access ONLY to cineevent_db
CREATE USER IF NOT EXISTS 'cineevent_user'@'%' IDENTIFIED BY 'CineEvent_UserSecurePass_2026!';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, INDEX, ALTER, REFERENCES ON cineevent_db.* TO 'cineevent_user'@'%';

-- 2. Create Exporter User for Prometheus mysqld_exporter
CREATE USER IF NOT EXISTS 'exporter'@'%' IDENTIFIED BY 'Exporter_SecurePassword_2026!';
GRANT PROCESS, REPLICATION CLIENT, SELECT ON *.* TO 'exporter'@'%';

FLUSH PRIVILEGES;
