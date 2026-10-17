-- ==============================================================================
-- CINEEVENT SEED DATA
-- Dữ liệu khởi tạo hệ thống đặt vé xem phim và sự kiện
-- ==============================================================================

USE cineevent_db;

-- 1. Insert Roles
INSERT INTO roles (id, name, description) VALUES
(1, 'admin', 'Quản trị viên toàn quyền hệ thống'),
(2, 'manager', 'Quản lý rạp, lịch chiếu, sự kiện và doanh thu'),
(3, 'staff', 'Nhân viên bán vé và soát vé tại quầy'),
(4, 'customer', 'Khách hàng sử dụng dịch vụ đặt vé')
ON DUPLICATE KEY UPDATE description=VALUES(description);

-- 2. Insert Permissions
INSERT INTO permissions (id, code, name, module) VALUES
(1, 'MANAGE_USERS', 'Quản lý người dùng', 'users'),
(2, 'VIEW_REPORTS', 'Xem báo cáo doanh thu', 'reports'),
(3, 'MANAGE_MOVIES', 'Quản lý phim', 'movies'),
(4, 'MANAGE_SHOWTIMES', 'Quản lý lịch chiếu', 'showtimes'),
(5, 'MANAGE_EVENTS', 'Quản lý sự kiện', 'events'),
(6, 'CHECKIN_TICKETS', 'Soát vé và kiểm tra mã vé', 'tickets'),
(7, 'BOOK_TICKETS', 'Đặt vé trực tuyến', 'booking')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 3. Role Permissions mapping
INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES
-- Admin has all permissions
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6), (1, 7),
-- Manager has movie/showtime/event/report permissions
(2, 2), (2, 3), (2, 4), (2, 5), (2, 6), (2, 7),
-- Staff has ticket checkin & booking support
(3, 6), (3, 7),
-- Customer has booking
(4, 7);

-- 4. Insert Default Users (Admin, Manager, Staff, Customers)
-- Passwords:
-- admin@cineevent.vn -> AdminPassword123!
-- manager@cineevent.vn -> ManagerPassword123!
-- staff@cineevent.vn -> StaffPassword123!
-- customer@gmail.com -> CustomerPassword123!
INSERT INTO users (id, role_id, full_name, email, password_hash, phone, status) VALUES
(1, 1, 'Hệ Thống Quản Trị Viên', 'admin@cineevent.vn', '$2b$10$W7EV.gCoRYs26gMcjlQbMepo/nf1OncEa4E5Ugghoxz35MBPPTkn6', '0901234567', 'active'),
(2, 2, 'Trần Minh Quản Lý', 'manager@cineevent.vn', '$2b$10$BUD7ZBXqpcqywOcZhWEQ/OE0l7NyOp55b4hybmKEmJ9zzgXWLQk0e', '0902345678', 'active'),
(3, 3, 'Lê Thị Thu Ngân Viên', 'staff@cineevent.vn', '$2b$10$beUFmt/RLgjd.qDsFYi9iuNWeVU4siFCV7zGkvmcuyi7/MQz8V7Mq', '0903456789', 'active'),
(4, 4, 'Nguyễn Văn An (Khách Hàng)', 'customer@gmail.com', '$2b$10$ZPVUZs4bJwc5eq0nAa1ryuo9DuEWBgsy6jtY7tOGs6XZts9qWunvi', '0912345678', 'active'),
(5, 4, 'Hoàng Thùy Linh (Khách Hàng)', 'khachhang2@gmail.com', '$2b$10$ZPVUZs4bJwc5eq0nAa1ryuo9DuEWBgsy6jtY7tOGs6XZts9qWunvi', '0987654321', 'active')
ON DUPLICATE KEY UPDATE full_name=VALUES(full_name);

-- 5. Insert Genres
INSERT INTO genres (id, name, slug) VALUES
(1, 'Hành Động & Phiêu Lưu', 'hanh-dong-phieu-luu'),
(2, 'Khoa Học Viễn Tưởng', 'khoa-hoc-vien-tuong'),
(3, 'Tâm Lý & Tình Cảm', 'tam-ly-tinh-cam'),
(4, 'Hoạt Hình & Gia Đình', 'hoat-hinh-gia-dinh'),
(5, 'Kinh Dị & Giật Gân', 'kinh-di-giat-gan'),
(6, 'Hài Hước & Đời Sống', 'hai-huoc-doi-song')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 6. Insert Movies
INSERT INTO movies (id, title, slug, genre_id, duration, release_date, end_date, director, cast, poster_url, banner_url, trailer_url, description, age_rating, status) VALUES
(1, 'Dune: Hành Tinh Cát - Phần 2', 'dune-hanh-tinh-cat-phan-2', 2, 166, '2026-03-01', '2026-12-31', 'Denis Villeneuve', 'Timothée Chalamet, Zendaya, Rebecca Ferguson', 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80', 'https://www.youtube.com', 'Paul Atreides hợp lực cùng Chani và người Fremen để trả thù những kẻ hủy hoại gia đình mình, đối mặt với sự lựa chọn giữa tình yêu và số phận vũ trụ.', 'T16', 'now_showing'),
(2, 'Mai — Bộ Phim Tâm Lý Đỉnh Cao', 'mai-phim-tam-ly', 3, 131, '2026-02-10', '2026-12-31', 'Trấn Thành', 'Phương Anh Đào, Tuấn Trần, Hồng Đào', 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=1200&auto=format&fit=crop&q=80', 'https://www.youtube.com', 'Câu chuyện xúc động về Mai, người phụ nữ gần 40 tuổi làm nghề massage trị liệu, chịu định kiến xã hội và gặp gỡ chàng trai đào hoa Dương.', 'T18', 'now_showing'),
(3, 'Kung Fu Panda 4', 'kung-fu-panda-4', 4, 94, '2026-03-08', '2026-12-31', 'Mike Mitchell', 'Jack Black, Awkwafina, Viola Davis', 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1200&auto=format&fit=crop&q=80', 'https://www.youtube.com', 'Po được chọn làm Thủ lĩnh tinh thần của Thung lũng Bình Yên nhưng phải đối đầu với Tắc Kè Bông - kẻ có khả năng biến hình thành mọi kẻ thù trong quá khứ.', 'P', 'now_showing'),
(4, 'Godzilla x Kong: Đế Chế Mới', 'godzilla-x-kong-de-che-moi', 1, 115, '2026-03-29', '2026-12-31', 'Adam Wingard', 'Rebecca Hall, Brian Tyree Henry, Dan Stevens', 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=1200&auto=format&fit=crop&q=80', 'https://www.youtube.com', 'Godzilla và Kong phải gạt bỏ hiềm khích để cùng chiến đấu chống lại một mối đe dọa khổng lồ chưa từng thấy ẩn sâu trong Trái Đất Rỗng.', 'T13', 'now_showing'),
(5, 'Lật Mặt 7: Một Điều Ước', 'lat-mat-7-mot-dieu-uoc', 3, 138, '2026-04-26', '2026-12-31', 'Lý Hải', 'Thanh Hiền, Trương Minh Cường, Đinh Y Nhung', 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=600&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&auto=format&fit=crop&q=80', 'https://www.youtube.com', 'Câu chuyện cảm động về người mẹ 73 tuổi một mình nuôi 5 đứa con khôn lớn. Khi bà gặp nạn, các con trưởng thành phải xoay xở nghĩa vụ phụng dưỡng.', 'K', 'coming_soon'),
(6, 'Deadpool & Wolverine', 'deadpool-and-wolverine', 1, 127, '2026-07-26', '2026-12-31', 'Shawn Levy', 'Ryan Reynolds, Hugh Jackman, Emma Corrin', 'https://images.unsplash.com/photo-1568876694728-451bbf694b83?w=600&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200&auto=format&fit=crop&q=80', 'https://www.youtube.com', 'Wade Wilson bị cơ quan TVA lôi kéo vào nhiệm vụ giải cứu đa vũ trụ và bắt tay cùng người sói Wolverine cộc cằn.', 'T18', 'coming_soon')
ON DUPLICATE KEY UPDATE title=VALUES(title);

-- 7. Insert Events
INSERT INTO events (id, title, slug, category, organizer, start_time, end_time, banner_url, description, venue_name, venue_address, status) VALUES
(1, 'Đại Nhạc Hội Monsoon Music Festival 2026', 'monsoon-music-festival-2026', 'Đại Nhạc Hội EDM & Rock', 'Monsoon Production & CineEvent', '2026-11-20 18:00:00', '2026-11-20 23:30:00', 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop&q=80', 'Lễ hội âm nhạc quốc tế đỉnh cao quy tụ dàn nghệ sĩ hàng đầu Việt Nam và Quốc Tế cùng hệ thống âm thanh ánh sáng chuẩn festival toàn cầu.', 'Trung Tâm Hội Nghị Quốc Gia', 'Đại lộ Thăng Long, Mễ Trì, Nam Từ Liêm, Hà Nội', 'upcoming'),
(2, 'Hòa Nhạc Giao Hưởng Live in Saigon', 'hoa-nhac-giao-huong-saigon', 'Nhạc Cổ Điển & Symphony', 'Dàn Nhạc Giao Hưởng Quốc Gia', '2026-11-25 19:30:00', '2026-11-25 22:00:00', 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=1200&auto=format&fit=crop&q=80', 'Thưởng thức những tác phẩm kinh điển của Beethoven, Mozart và Tchaikovsky qua màn biểu diễn xuất chúng của 80 nghệ sĩ giao hưởng tài hoa.', 'Nhà Hát Hòa Bình', '240 đường 3 Tháng 2, Phường 12, Quận 10, TP.HCM', 'upcoming'),
(3, 'Vietnam GameVerse Esports Championship 2026', 'gameverse-esports-championship', 'Thể Thao Điện Tử & Triển Lãm', 'Hiệp Hội Thể Thao Điện Tử & Giải Trí', '2026-12-05 09:00:00', '2026-12-05 21:00:00', 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&auto=format&fit=crop&q=80', 'Ngày hội game lớn nhất Việt Nam với chung kết tổng giải đấu LMHT, Tốc Chiến, cosplay contest và khu trải nghiệm công nghệ thực tế ảo VR đỉnh cao.', 'Sân Vận Động Quân Khu 7', '202 Hoàng Văn Thụ, Phường 9, Phú Nhuận, TP.HCM', 'upcoming')
ON DUPLICATE KEY UPDATE title=VALUES(title);

-- 8. Insert Ticket Types for Events
INSERT INTO ticket_types (id, event_id, name, price, total_quantity, sold_quantity, description) VALUES
(1, 1, 'Vé GA (Standard Sân Cỏ)', 350000.00, 500, 45, 'Khu vực đứng sân cỏ trung tâm, hòa mình vào không khí cuồng nhiệt'),
(2, 1, 'Vé VIP Khán Đài A', 850000.00, 200, 28, 'Chỗ ngồi khán đài có mái che, tặng kèm 01 đồ uống và áo lưu niệm'),
(3, 1, 'Vé VVIP Lounge & Backstage', 1800000.00, 50, 12, 'Lounge riêng biệt có phục vụ đồ ăn nhẹ, lối đi riêng và gặp gỡ nghệ sĩ'),
(4, 2, 'Vé Tầng 2 (Standard)', 250000.00, 300, 35, 'Khu vực khán phòng lầu 2, tầm nhìn toàn cảnh sân khấu hòa nhạc'),
(5, 2, 'Vé Hạng Nhất (VIP Tầng 1)', 600000.00, 150, 60, 'Ghế êm ái hàng đầu tầng 1, trải nghiệm âm thanh mộc acoustic tuyệt vời'),
(6, 3, 'Vé Khán Giả GameVerse Pass', 150000.00, 1000, 120, 'Vào cổng trọn ngày, tham quan gian hàng và theo dõi thi đấu esport')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 9. Insert Cinemas & Venues
INSERT INTO cinemas (id, name, city, address, phone) VALUES
(1, 'CineEvent Cinema Landmark 81', 'TP. Hồ Chí Minh', 'Tầng B1, TTTM Vincom Center Landmark 81, Bình Thạnh', '028.3822.8888'),
(2, 'CineEvent Cinema Vincom Bà Triệu', 'Hà Nội', 'Tầng 6, TTTM Vincom Center, 191 Bà Triệu, Hai Bà Trưng', '024.3974.9999')
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO venues (id, name, city, address, capacity) VALUES
(1, 'Trung Tâm Hội Nghị Quốc Gia', 'Hà Nội', 'Đại lộ Thăng Long, Nam Từ Liêm', 3500),
(2, 'Nhà Hát Hòa Bình', 'TP. Hồ Chí Minh', '240 đường 3 Tháng 2, Quận 10', 2500),
(3, 'Sân Vận Động Quân Khu 7', 'TP. Hồ Chí Minh', '202 Hoàng Văn Thụ, Phú Nhuận', 15000)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 10. Insert Rooms
INSERT INTO rooms (id, cinema_id, name, screen_type, total_seats) VALUES
(1, 1, 'Phòng Chiếu 01 (IMAX Laser)', 'IMAX Laser', 60),
(2, 1, 'Phòng Chiếu 02 (Gold Class VIP)', 'Gold Class', 40),
(3, 2, 'Phòng Chiếu 01 (Digital 2D)', '2D Digital', 60)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 11. Generate Seats for Room 1 (60 seats: Row A-F, cols 1-10)
-- Row A, B, C: standard; Row D, E: vip; Row F: couple
INSERT IGNORE INTO seats (room_id, seat_row, seat_number, seat_type, status)
SELECT 1, r.r, n.n,
       CASE 
         WHEN r.r IN ('A', 'B', 'C') THEN 'standard'
         WHEN r.r IN ('D', 'E') THEN 'vip'
         ELSE 'couple'
       END AS seat_type,
       'active'
FROM (
  SELECT 'A' AS r UNION ALL SELECT 'B' UNION ALL SELECT 'C' UNION ALL 
  SELECT 'D' UNION ALL SELECT 'E' UNION ALL SELECT 'F'
) r
CROSS JOIN (
  SELECT 1 AS n UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL 
  SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10
) n;

-- Seats for Room 3 (60 seats)
INSERT IGNORE INTO seats (room_id, seat_row, seat_number, seat_type, status)
SELECT 3, r.r, n.n,
       CASE 
         WHEN r.r IN ('A', 'B', 'C') THEN 'standard'
         WHEN r.r IN ('D', 'E') THEN 'vip'
         ELSE 'couple'
       END AS seat_type,
       'active'
FROM (
  SELECT 'A' AS r UNION ALL SELECT 'B' UNION ALL SELECT 'C' UNION ALL 
  SELECT 'D' UNION ALL SELECT 'E' UNION ALL SELECT 'F'
) r
CROSS JOIN (
  SELECT 1 AS n UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL 
  SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10
) n;

-- 12. Insert Showtimes
-- Generate today and tomorrow showtimes dynamically using CURDATE()
INSERT INTO showtimes (id, movie_id, room_id, start_time, end_time, price_standard, price_vip, status) VALUES
(1, 1, 1, CONCAT(CURDATE(), ' 09:30:00'), CONCAT(CURDATE(), ' 12:15:00'), 95000.00, 130000.00, 'scheduled'),
(2, 1, 1, CONCAT(CURDATE(), ' 14:00:00'), CONCAT(CURDATE(), ' 16:45:00'), 95000.00, 130000.00, 'scheduled'),
(3, 1, 1, CONCAT(CURDATE(), ' 19:30:00'), CONCAT(CURDATE(), ' 22:15:00'), 110000.00, 145000.00, 'scheduled'),
(4, 2, 3, CONCAT(CURDATE(), ' 10:00:00'), CONCAT(CURDATE(), ' 12:15:00'), 85000.00, 110000.00, 'scheduled'),
(5, 2, 3, CONCAT(CURDATE(), ' 15:30:00'), CONCAT(CURDATE(), ' 17:45:00'), 85000.00, 110000.00, 'scheduled'),
(6, 2, 3, CONCAT(CURDATE(), ' 20:00:00'), CONCAT(CURDATE(), ' 22:15:00'), 95000.00, 125000.00, 'scheduled'),
(7, 3, 1, DATE_ADD(CONCAT(CURDATE(), ' 10:30:00'), INTERVAL 1 DAY), DATE_ADD(CONCAT(CURDATE(), ' 12:10:00'), INTERVAL 1 DAY), 90000.00, 120000.00, 'scheduled'),
(8, 4, 1, DATE_ADD(CONCAT(CURDATE(), ' 16:00:00'), INTERVAL 1 DAY), DATE_ADD(CONCAT(CURDATE(), ' 18:00:00'), INTERVAL 1 DAY), 95000.00, 130000.00, 'scheduled')
ON DUPLICATE KEY UPDATE start_time=VALUES(start_time);

-- 13. Insert Sample Confirmed Booking (Demo purpose)
-- Booking 1: Customer (id 4) booked seats C5, C6 for Dune showtime 3
INSERT INTO bookings (id, booking_code, user_id, booking_type, showtime_id, total_amount, status, expires_at, created_at) VALUES
(1, 'BK-DUNE-2026-001', 4, 'movie', 3, 220000.00, 'confirmed', DATE_ADD(NOW(), INTERVAL 30 MINUTE), DATE_SUB(NOW(), INTERVAL 2 HOUR))
ON DUPLICATE KEY UPDATE status=VALUES(status);

-- Get seat IDs for C5, C6 in Room 1
INSERT IGNORE INTO booking_items (id, booking_id, seat_id, quantity, unit_price, subtotal)
SELECT 1, 1, id, 1, 110000.00, 110000.00 FROM seats WHERE room_id = 1 AND seat_row = 'C' AND seat_number = 5;

INSERT IGNORE INTO booking_items (id, booking_id, seat_id, quantity, unit_price, subtotal)
SELECT 2, 1, id, 1, 110000.00, 110000.00 FROM seats WHERE room_id = 1 AND seat_row = 'C' AND seat_number = 6;

-- Payment for Booking 1
INSERT INTO payments (id, booking_id, transaction_code, payment_method, amount, status, payment_time, response_note) VALUES
(1, 1, 'TXN-VNPAY-20261017-001', 'SIMULATED_VNPAY', 220000.00, 'success', DATE_SUB(NOW(), INTERVAL 2 HOUR), 'Giao dịch thanh toán giả lập thành công')
ON DUPLICATE KEY UPDATE status=VALUES(status);

-- Tickets for Booking 1
INSERT INTO tickets (id, booking_id, booking_item_id, ticket_code, qr_data, status) VALUES
(1, 1, 1, 'TCK-CINE-882910', 'CINEEVENT:BK-DUNE-2026-001:TCK-CINE-882910:SEAT-C5', 'valid'),
(2, 1, 2, 'TCK-CINE-882911', 'CINEEVENT:BK-DUNE-2026-001:TCK-CINE-882911:SEAT-C6', 'used')
ON DUPLICATE KEY UPDATE status=VALUES(status);

-- Check-in for ticket 2 (Staff scanned it)
INSERT INTO ticket_checkins (id, ticket_id, staff_id, checkin_time, notes) VALUES
(1, 2, 3, DATE_SUB(NOW(), INTERVAL 1 HOUR), 'Soát vé thành công tại cửa soát vé 01')
ON DUPLICATE KEY UPDATE notes=VALUES(notes);

-- 14. Sample Event Booking
INSERT INTO bookings (id, booking_code, user_id, booking_type, event_id, total_amount, status, expires_at, created_at) VALUES
(2, 'BK-EVT-MONSOON-002', 5, 'event', 1, 700000.00, 'confirmed', DATE_ADD(NOW(), INTERVAL 30 MINUTE), DATE_SUB(NOW(), INTERVAL 3 HOUR))
ON DUPLICATE KEY UPDATE status=VALUES(status);

INSERT IGNORE INTO booking_items (id, booking_id, ticket_type_id, quantity, unit_price, subtotal) VALUES
(3, 2, 1, 2, 350000.00, 700000.00);

INSERT INTO payments (id, booking_id, transaction_code, payment_method, amount, status, payment_time, response_note) VALUES
(2, 2, 'TXN-MOMO-20261017-002', 'SIMULATED_MOMO', 700000.00, 'success', DATE_SUB(NOW(), INTERVAL 3 HOUR), 'Giao dịch giả lập MoMo thành công')
ON DUPLICATE KEY UPDATE status=VALUES(status);

INSERT INTO tickets (id, booking_id, booking_item_id, ticket_code, qr_data, status) VALUES
(3, 2, 3, 'TCK-EVT-991201', 'CINEEVENT:BK-EVT-MONSOON-002:TCK-EVT-991201:GA-01', 'valid'),
(4, 2, 3, 'TCK-EVT-991202', 'CINEEVENT:BK-EVT-MONSOON-002:TCK-EVT-991202:GA-02', 'valid')
ON DUPLICATE KEY UPDATE status=VALUES(status);

-- 15. Audit Logs sample
INSERT INTO audit_logs (id, user_id, action, module, description, ip_address) VALUES
(1, 1, 'SYSTEM_INIT', 'system', 'Khởi tạo hệ thống cơ sở dữ liệu CineEvent thành công', '127.0.0.1'),
(2, 4, 'LOGIN_SUCCESS', 'auth', 'Khách hàng đăng nhập thành công', '192.168.1.10'),
(3, 4, 'CREATE_BOOKING', 'booking', 'Khách hàng đặt vé xem phim Dune (Mã: BK-DUNE-2026-001)', '192.168.1.10'),
(4, 3, 'CHECKIN_TICKET', 'tickets', 'Nhân viên soát vé TCK-CINE-882911 thành công', '192.168.1.20')
ON DUPLICATE KEY UPDATE description=VALUES(description);
