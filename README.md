# CINEEVENT — HỆ THỐNG ĐẶT VÉ XEM PHIM & SỰ KIỆN

> **Môn học:** Triển khai và Quản trị Hệ thống Phần mềm  
> **Đề tài:** Đề 11 — Hệ thống Đặt vé Xem phim / Sự kiện và Triển khai Hạ tầng Giám sát  
> **Tên repository:** `MSSV-de11-cineevent`  
> **Sinh viên thực hiện:**  
> - Họ và tên: `[HỌ VÀ TÊN]`  
> - Mã số sinh viên: `[MSSV]`  
> - Lớp: `[LỚP]`  

---

## 1. Giới thiệu dự án

**CineEvent** là nền tảng trực tuyến phục vụ đặt vé xem phim rạp và sự kiện âm nhạc, giải trí hiện đại. Dự án được thiết kế và triển khai theo mô hình Container hóa toàn diện bằng **Docker Compose**, phân tách mạng theo kiến trúc nhiều lớp (Multi-tier), tích hợp Reverse Proxy **Nginx** có SSL tự ký và áp dụng các tiêu chuẩn bảo mật hệ thống (Hardening).

### Các vai trò người dùng (Role-Based Access Control)
1. **Khách hàng (Customer):** Xem phim/sự kiện, chọn suất chiếu, chọn ghế trực quan trên sơ đồ, thực hiện thanh toán giả lập, nhận vé điện tử kèm mã QR và tra cứu lịch sử mua vé.
2. **Nhân viên (Staff):** Đăng nhập cổng nhân viên, tra cứu thông tin vé, quét/soát mã vé điện tử chống gian lận và xem nhật ký các lượt soát vé.
3. **Quản lý (Manager):** Quản lý danh mục phim, sự kiện, phòng chiếu, suất chiếu, giá vé và theo dõi báo cáo doanh thu từ các giao dịch thành công.
4. **Quản trị viên (Admin):** Toàn quyền quản trị hệ thống, quản lý tài khoản người dùng, phân quyền vai trò (RBAC) và theo dõi nhật ký thao tác bảo mật (Audit Logs).

---

## 2. Kiến trúc công nghệ (Technology Stack)

### Frontend & Giao diện
- **Ngôn ngữ & Nền tảng:** HTML5, CSS3, JavaScript ES6+, Fetch API.
- **Framework UI & Icons:** Bootstrap 5, Bootstrap Icons.
- **Thiết kế:** Tone màu xanh đen / tím than hiện đại (#0a0e17), card glassmorphism, accent màu đỏ/cam nổi bật cho hành động đặt vé, responsive 100% trên PC và mobile, hoàn toàn bằng tiếng Việt.

### Backend & Cơ sở dữ liệu
- **Runtime & Framework:** Node.js, Express.js (REST API).
- **Kiến trúc phân lớp:** Routes &rarr; Controllers &rarr; Services &rarr; Models (Repositories) &rarr; Middlewares.
- **Database Driver:** `mysql2/promise` với cơ chế Connection Pooling và Database Transaction (ACID) chống đặt trùng ghế.
- **Cơ sở dữ liệu:** MySQL 8.0 với 17 bảng được chuẩn hóa, khóa chính, khóa ngoại, ràng buộc toàn vẹn và chỉ mục.
- **Quản trị CSDL:** phpMyAdmin giao diện trực quan.

### Hạ tầng mạng & Bảo mật ban đầu
- **Container hóa:** Docker Engine & Docker Compose.
- **Reverse Proxy:** Nginx 1.25 Alpine với SSL tự ký (HTTPS) và cấu hình đầy đủ Security Headers.
- **Tài khoản đặc quyền tối thiểu:** Backend kết nối qua tài khoản riêng `cineevent_user`, không dùng root.
- **Network Isolation:** Tách biệt mạng `cineevent-frontend-net` và `cineevent-backend-net`. Nginx không có quyền truy cập trực tiếp MySQL. Cổng 3306 không mở ra Internet.

---

## 3. Cấu trúc thư mục

```text
├── .env.example              # Mẫu biến môi trường an toàn (không chứa mật khẩu thật)
├── .gitignore                # Danh sách loại trừ file nhạy cảm và build
├── README.md                 # Tài liệu hướng dẫn triển khai
├── docker-compose.yml        # Cấu hình Docker Compose cho toàn bộ hệ thống
├── certs/                    # Script và tài liệu chứng chỉ SSL tự ký
│   ├── generate-certs.sh
│   └── README.md
├── nginx/                    # Cấu hình Nginx Reverse Proxy
│   ├── Dockerfile
│   ├── entrypoint.sh
│   ├── nginx.conf
│   └── conf.d/default.conf
├── database/                 # Script khởi tạo cơ sở dữ liệu MySQL
│   ├── schema.sql            # Định nghĩa 17 bảng, khóa ngoại và chỉ mục
│   ├── seed.sql              # Dữ liệu mẫu (Phim, Sự kiện, Suất chiếu, Ghế, User)
│   └── permissions.sql       # Phân quyền least-privilege cho cineevent_user
├── backend/                  # Mã nguồn Express.js Backend
│   ├── Dockerfile            # Container non-root user (node:node)
│   ├── package.json
│   └── src/
│       ├── app.js            # Khởi tạo Express, middlewares, routes
│       ├── server.js         # Entrypoint kết nối DB có retry & graceful shutdown
│       ├── config/           # Cấu hình Database pool và Logger tập trung
│       ├── middlewares/      # Auth JWT, RBAC, Rate Limiter, Metrics, Error
│       ├── models/           # Truy vấn SQL có tham số chống SQL Injection
│       ├── controllers/      # Điều hướng xử lý request nghiệp vụ
│       └── routes/           # Định nghĩa endpoint API
└── frontend/                 # Giao diện web người dùng & quản trị
    ├── css/style.css         # Hệ thống giao diện CSS custom dark theme
    ├── js/api.js             # Client API universal, Auth state, Modal generator
    ├── index.html            # Trang chủ (Banner, phim đang chiếu, sự kiện nổi bật)
    ├── movies.html           # Danh mục phim có bộ lọc thể loại & tìm kiếm
    ├── movie-detail.html     # Chi tiết phim & danh sách suất chiếu
    ├── events.html           # Danh mục sự kiện âm nhạc & festival
    ├── event-detail.html     # Chi tiết sự kiện & chọn loại vé
    ├── booking.html          # Sơ đồ chọn ghế rạp chiếu phim trực quan
    ├── payment.html          # Cổng thanh toán giả lập (Success / Failed / Cancel)
    ├── ticket-result.html    # Vé điện tử kèm mã QR Code hợp lệ
    ├── my-tickets.html       # Lịch sử đơn hàng và vé đã mua của khách
    ├── staff-checkin.html    # Cổng soát vé dành cho Nhân viên (Staff Portal)
    └── admin.html            # Cổng Quản trị & Báo cáo doanh thu (Admin Portal)
```

---

## 4. Hướng dẫn khởi động hệ thống

### 4.1. Chuẩn bị biến môi trường
Sao chép tệp cấu hình mẫu sang `.env`:
```bash
cp .env.example .env
```

### 4.2. Khởi chạy toàn bộ hệ thống bằng Docker Compose
Chỉ cần chạy duy nhất một câu lệnh:
```bash
docker compose up -d --build
```

### 4.3. Kiểm tra trạng thái dịch vụ
```bash
docker compose ps
```
Tất cả các dịch vụ (`cineevent-mysql`, `cineevent-phpmyadmin`, `cineevent-app`, `cineevent-nginx`) phải ở trạng thái `Up` hoặc `Up (healthy)`.

### 4.4. Xem nhật ký hoạt động (Logs)
```bash
docker compose logs -f
```

---

## 5. Địa chỉ truy cập các dịch vụ

| Dịch vụ | URL Truy Cập | Mục đích |
| :--- | :--- | :--- |
| **Website CineEvent (Nginx)** | [http://localhost](http://localhost) hoặc [https://localhost](https://localhost) | Cổng giao diện chính của người dùng |
| **phpMyAdmin** | [http://127.0.0.1:8085](http://127.0.0.1:8085) | Quản trị CSDL MySQL trực quan |
| **Health Check API** | [http://localhost/health](http://localhost/health) | Kiểm tra trạng thái sẵn sàng của App |
| **Prometheus Metrics** | [http://localhost/metrics](http://localhost/metrics) | Endpoint thu thập metrics ứng dụng |

---

## 6. Tài khoản kiểm thử (Demo Accounts)

Hệ thống đã chuẩn bị sẵn 4 tài khoản thuộc 4 vai trò. Tại modal đăng nhập có sẵn các nút bấm **điền nhanh** để tiện lợi cho giảng viên/người chấm kiểm thử:

| Vai trò | Email đăng nhập | Mật khẩu mặc định | Quyền hạn tiêu biểu |
| :--- | :--- | :--- | :--- |
| **Quản trị viên (Admin)** | `admin@cineevent.vn` | `AdminPassword123!` | Toàn quyền, phân quyền vai trò, xem audit logs |
| **Quản lý (Manager)** | `manager@cineevent.vn` | `ManagerPassword123!` | Xem báo cáo doanh thu, quản lý phim, suất chiếu |
| **Nhân viên (Staff)** | `staff@cineevent.vn` | `StaffPassword123!` | Soát vé khách hàng tại `staff-checkin.html` |
| **Khách hàng (Customer)** | `customer@gmail.com` | `CustomerPassword123!` | Đặt vé, chọn ghế, thanh toán giả lập, xem vé QR |

---

## 7. Các biện pháp Hardening ban đầu đã áp dụng

1. **Non-Root Container:**
   - Dịch vụ `cineevent-app` chạy dưới tài khoản không đặc quyền `node` (UID 1000) được khai báo rõ trong `backend/Dockerfile`.
2. **Network Isolation:**
   - Tạo 2 Docker Bridge Network riêng biệt: `cineevent-frontend-net` (cho Proxy & Web) và `cineevent-backend-net` (cho Backend & Database).
   - Nginx không nằm trong mạng Database &rarr; Ngăn chặn tấn công trực tiếp vào cơ sở dữ liệu.
   - Cổng 3306 của MySQL không được publish ra host bên ngoài.
3. **Least Privilege Database User:**
   - Backend Express kết nối tới database thông qua tài khoản riêng `cineevent_user` với quyền hạn hạn chế trong phạm vi schema `cineevent_db`, không sử dụng tài khoản `root`.
4. **Security Headers & Reverse Proxy Hardening:**
   - Nginx ẩn version (`server_tokens off;`).
   - Cấu hình các HTTP Response Headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, `Content-Security-Policy`.
5. **Chống SQL Injection & Phòng vệ tấn công:**
   - 100% câu truy vấn sử dụng Prepared Statements (`?` parameter binding) của thư viện `mysql2`.
   - Rate limiting giới hạn 30 lượt đăng nhập/15 phút và 300 request API/15 phút nhằm chống brute-force.
   - Transaction và khóa dòng (`FOR UPDATE`) khi đặt vé để triệt tiêu lỗi đặt trùng ghế (race condition).
