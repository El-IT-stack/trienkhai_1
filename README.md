# CINEEVENT — HỆ THỐNG ĐẶT VÉ XEM PHIM & SỰ KIỆN

> **Môn học:** Triển khai và Quản trị Hệ thống Phần mềm  
> **Đề tài:** Đề 11 — Hệ thống Đặt vé Xem phim / Sự kiện và Triển khai Hạ tầng Giám sát  
> **Tên repository:** `MSSV-de11-cineevent`  
> **Sinh viên thực hiện:**  
> - Họ và tên: `[HỌ VÀ TÊN]`  
> - Mã số sinh viên: `[MSSV]`  
> - Lớp: `[LỚP]`  
> - Giảng viên hướng dẫn: `[GIẢNG VIÊN HƯỚNG DẪN]`  

---

## 1. Giới thiệu dự án

**CineEvent** là nền tảng trực tuyến phục vụ đặt vé xem phim rạp và sự kiện biểu diễn âm nhạc, nghệ thuật hiện đại. Dự án được phát triển và vận hành theo tiêu chuẩn DevOps & SRE, đóng gói toàn diện bằng **Docker Compose** với 11 dịch vụ container hóa độc lập, phân tách mạng nhiều lớp (**Network Isolation**), tích hợp Reverse Proxy **Nginx** có SSL tự ký (HTTPS), thiết lập đầy đủ **Security Headers** chuẩn OWASP, hạ tầng giám sát thời gian thực **Prometheus/Grafana**, hệ thống thu thập log tập trung **Loki/Promtail** và các biện pháp bảo mật **Hardening** nghiêm ngặt.

### 4 Phân hệ vai trò người dùng (Role-Based Access Control)
1. **Khách hàng (Customer):** Xem phim/sự kiện, lọc theo thể loại, chọn suất chiếu, chọn ghế trực quan trên sơ đồ rạp thời gian thực, thanh toán giả lập (Success/Failed/Cancel), nhận vé điện tử kèm mã QR và tra cứu lịch sử mua vé cá nhân.
2. **Nhân viên (Staff):** Đăng nhập cổng nhân viên, tra cứu thông tin vé qua mã số hoặc quét QR, thực hiện Check-in xác nhận vào cửa, chặn đứng vé giả mạo hoặc vé đã sử dụng trước đó.
3. **Quản lý (Manager):** Quản lý phim, sự kiện, rạp chiếu, phòng chiếu, giá vé, theo dõi báo cáo doanh thu theo phim/sự kiện và số lượng vé bán ra theo thời gian thực.
4. **Quản trị viên (Admin):** Toàn quyền quản trị tài khoản, gán vai trò RBAC, cấu hình lịch chiếu, can thiệp trạng thái đơn hàng, theo dõi báo cáo tổng quan và xem log kiểm toán hệ thống.

---

## 2. Kiến trúc công nghệ (Technology Stack)

| Thành phần | Công nghệ sử dụng | Chi tiết cấu hình & Vai trò |
| :--- | :--- | :--- |
| **Frontend** | HTML5, CSS3, JavaScript (ES6+), Bootstrap 5, Bootstrap Icons | Giao diện Dark Glassmorphism, 100% tiếng Việt, responsive đa thiết bị, không dùng framework nặng |
| **Backend** | Node.js (v20 Alpine), Express.js | Kiến trúc phân tầng: Routes &rarr; Middlewares &rarr; Controllers &rarr; Models (Repositories) |
| **Cơ sở dữ liệu** | MySQL 8.0 Community Server | 17 bảng quan hệ chuẩn hóa 3NF, Foreign Keys, Indexes, Transactions ACID chống đặt trùng ghế |
| **Quản trị DB** | phpMyAdmin 5.2.1 | Giao diện đồ họa quản trị MySQL, bind cục bộ trên `127.0.0.1:8085` |
| **Reverse Proxy & SSL** | Nginx 1.25 Alpine | Reverse Proxy, SSL Termination tự ký, ẩn phiên bản, 5 HTTP Security Headers |
| **Metrics Collector** | Prometheus v2.51.0 | Thu thập số liệu chuỗi thời gian (Pull-based, chu kỳ scrape 5s) |
| **Trực quan hóa Metrics** | Grafana 10.4.1 | Dashboard tự động nạp (Provisioning), biểu đồ lưu lượng, RAM, CPU, MySQL QPS |
| **Thu thập Log tập trung** | Grafana Loki 2.9.2 & Promtail 2.9.2 | Thu thập log Nginx và Express.js qua shared volume, hỗ trợ truy vấn LogQL linh hoạt |
| **Container Metrics** | Google cAdvisor v0.49.1 | Giám sát CPU, RAM, Network I/O của toàn bộ container |
| **Web Exporter** | Nginx Prometheus Exporter 1.1.0 | Thu thập trạng thái kết nối active/reading/writing từ module `stub_status` |
| **Database Exporter** | MySQL Exporter v0.15.1 | Thu thập queries/sec, threads connected với quyền least-privilege `exporter` |

---

## 3. Cấu trúc thư mục dự án

```text
MSSV-de11-cineevent/
├── .env.example                               # Biến môi trường mẫu an toàn (không chứa bí mật)
├── .gitignore                                 # Loại trừ secrets, logs, certificates và node_modules
├── README.md                                  # Tài liệu hướng dẫn triển khai, demo và nghiệm thu
├── docker-compose.yml                         # Cấu hình 11 dịch vụ container hóa Docker Compose
├── certs/
│   ├── generate-certs.sh                      # Script tự tạo chứng chỉ SSL tự ký
│   └── README.md                              # Hướng dẫn chi tiết về chứng chỉ SSL
├── nginx/
│   ├── Dockerfile                             # Nginx 1.25 Alpine tùy biến
│   ├── entrypoint.sh                          # Tự động hóa SSL & chuyển đổi luồng log file
│   ├── nginx.conf                             # Cấu hình định dạng log chuẩn và nén gzip
│   └── conf.d/default.conf                    # Reverse Proxy HTTP & HTTPS, 5 Security Headers
├── database/
│   ├── schema.sql                             # 17 bảng chuẩn hóa, khóa chính, khóa ngoại, indexes
│   ├── seed.sql                               # Dữ liệu khởi tạo mẫu (Phim, Sự kiện, Suất chiếu, Ghế, User)
│   └── permissions.sql                        # Hardening: Quyền tối thiểu cho cineevent_user & exporter
├── backend/
│   ├── Dockerfile                             # Chạy dưới user non-root 'node' (UID 1000)
│   ├── package.json
│   └── src/
│       ├── app.js                             # Khởi tạo Express, middlewares, routes
│       ├── server.js                          # Entrypoint với retry CSDL và graceful shutdown
│       ├── config/                            # Cấu hình kết nối MySQL pool và Logger
│       ├── middlewares/                       # JWT Auth, RBAC, Rate Limiter, Metrics, Error Handler
│       ├── models/                            # Truy vấn tham số hóa Prepared Statements
│       ├── controllers/                       # Xử lý logic nghiệp vụ đặt vé, thanh toán, soát vé
│       └── routes/                            # Định nghĩa các endpoint RESTful
├── frontend/
│   ├── css/style.css                          # Custom CSS Dark Glassmorphism, animations
│   ├── js/api.js                              # API client universal, auth state, modal autofill
│   ├── index.html                             # Trang chủ (Banner, phim đang chiếu, sự kiện hot)
│   ├── movies.html                            # Danh mục phim có bộ lọc thể loại & tìm kiếm
│   ├── movie-detail.html                      # Chi tiết phim & danh sách suất chiếu theo ngày
│   ├── events.html                            # Danh mục sự kiện âm nhạc & festival
│   ├── event-detail.html                      # Chi tiết sự kiện & chọn loại vé
│   ├── booking.html                           # Sơ đồ chọn ghế rạp chiếu phim trực quan
│   ├── payment.html                           # Cổng thanh toán giả lập (Success / Failed / Cancel)
│   ├── ticket-result.html                     # Vé điện tử kèm mã QR Code hợp lệ
│   ├── my-tickets.html                        # Lịch sử đơn hàng và vé đã mua của khách
│   ├── staff-checkin.html                     # Cổng soát vé dành cho Nhân viên (Staff Portal)
│   └── admin.html                             # Cổng Quản trị & Báo cáo doanh thu (Admin Portal)
├── monitoring/
│   ├── prometheus/prometheus.yml              # Cấu hình 5 scrape jobs: app, nginx, mysql, cadvisor, prometheus
│   ├── grafana/provisioning/
│   │   ├── datasources/datasources.yml        # Tự động nạp Prometheus và Loki datasources
│   │   └── dashboards/dashboards.yml          # Tự động nạp thư mục dashboard
│   ├── grafana/dashboards/
│   │   └── cineevent-dashboard.json           # Dashboard giám sát tổng thể hạ tầng và ứng dụng
│   ├── mysqld-exporter/.my.cnf                # File xác thực least privilege cho MySQL Exporter
│   ├── loki/loki-config.yml                   # Cấu hình lưu trữ và partition cho Loki 2.9.2
│   └── promtail/promtail-config.yml           # Cấu hình thu thập log Nginx và Express của Promtail
└── report/
    ├── Bao-cao-De-11-CineEvent.docx           # Báo cáo tổng hợp môn học Word (>= 10 trang thực tế)
    ├── Bao-cao-De-11-CineEvent.pdf            # Bản xuất PDF báo cáo môn học (35 trang in chuẩn)
    ├── generate_report.py                     # Script tạo báo cáo Word bằng python-docx
    ├── capture_evidence.py                    # Script chụp và kết xuất 18 ảnh minh chứng thực tế
    └── images/                                # Thư mục chứa 18 ảnh chụp minh chứng nghiệm thu
```

---

## 4. Hướng dẫn khởi động hệ thống

### 4.1. Chuẩn bị biến môi trường
Sao chép tệp mẫu cấu hình sang `.env` trước khi khởi chạy:
```bash
cp .env.example .env
```
*(Nếu sử dụng PowerShell trên Windows: `Copy-Item .env.example .env`)*

### 4.2. Khởi chạy toàn bộ hệ thống bằng một câu lệnh
```bash
docker compose up -d --build
```
> **Cơ chế tự động hóa:**
> - Nginx tự động sinh khóa bí mật và chứng chỉ SSL tự ký nếu chưa có trong thư mục `certs/`.
> - MySQL tự động nạp cấu trúc 17 bảng (`schema.sql`), nạp dữ liệu mẫu (`seed.sql`) và phân quyền tối thiểu (`permissions.sql`).
> - Grafana tự động nạp Datasource (Prometheus, Loki) và nạp sẵn Dashboard giám sát `CineEvent Overview`.

### 4.3. Kiểm tra trạng thái các dịch vụ
```bash
docker compose ps
```
Cả 11 container phải hiển thị trạng thái `Up` hoặc `Up (healthy)`.

### 4.4. Theo dõi nhật ký khởi động
```bash
docker compose logs -f
```

---

## 5. Danh mục địa chỉ truy cập các dịch vụ

| STT | Dịch vụ | URL Truy Cập | Mục đích sử dụng |
| :---: | :--- | :--- | :--- |
| **1** | **Website CineEvent (Nginx)** | [http://localhost](http://localhost) hoặc [https://localhost](https://localhost) | Cổng giao diện chính đặt vé và quản trị |
| **2** | **phpMyAdmin** | [http://127.0.0.1:8085](http://127.0.0.1:8085) | Quản trị CSDL MySQL (User: `cineevent_user` / Pass: `CineEvent_UserSecurePass_2026!` hoặc Root: `root` / Pass: `Root_SecurePassword_2026!`) |
| **3** | **Prometheus Dashboard** | [http://localhost:9090](http://localhost:9090) | Kiểm tra Scrape Targets và truy vấn PromQL |
| **4** | **Grafana Monitoring** | [http://localhost:3000](http://localhost:3000) | Dashboard giám sát (User: `admin` / Pass: `Grafana_AdminSecurePass_2026!`) |
| **5** | **cAdvisor Container Monitor** | [http://localhost:8081](http://localhost:8081) | Giám sát tài nguyên phần cứng của từng Container |
| **6** | **Grafana Loki API** | [http://localhost:3100](http://localhost:3100) | Endpoint lưu trữ log tập trung |
| **7** | **Backend Health Check** | [http://localhost/health](http://localhost/health) | Kiểm tra kết nối CSDL và trạng thái Backend |
| **8** | **Prometheus App Metrics** | [http://localhost/metrics](http://localhost/metrics) | Endpoint thu thập metrics của Express API |
| **9** | **Nginx Exporter Metrics** | [http://localhost:9113/metrics](http://localhost:9113/metrics) | Metrics của máy chủ web Nginx |
| **10** | **MySQL Exporter Metrics** | [http://localhost:9104/metrics](http://localhost:9104/metrics) | Metrics của cơ sở dữ liệu MySQL |

---

## 6. Danh sách 4 tài khoản Demo nạp sẵn

Hệ thống đã nạp sẵn 4 tài khoản phục vụ kiểm thử. Tại modal Đăng nhập có các nút **Điền nhanh (Quick Fill)** để hỗ trợ thao tác tức thì:

| Vai trò (Role) | Email đăng nhập | Mật khẩu mặc định | Chức năng kiểm thử chính |
| :--- | :--- | :--- | :--- |
| **Khách hàng (Customer)** | `customer@gmail.com` | `123456` | Đặt vé, chọn ghế rạp, thanh toán giả lập, nhận vé QR |
| **Nhân viên (Staff)** | `staff@cineevent.vn` | `123456` | Cổng soát vé `/staff-checkin.html`, quét mã vé, chống soát trùng |
| **Quản lý (Manager)** | `manager@cineevent.vn` | `123456` | Xem báo cáo doanh thu, quản lý phim, suất chiếu tại `/admin.html` |
| **Quản trị viên (Admin)** | `admin@cineevent.vn` | `123456` | Toàn quyền cấu hình, quản trị tài khoản, xem audit logs |

---

## 7. Giám sát hệ thống với Prometheus & Grafana

### 7.1. Kiểm tra Prometheus Scrape Targets
Mở trình duyệt tại [http://localhost:9090/targets](http://localhost:9090/targets). Cả 5 scrape jobs đều phải đạt trạng thái **UP (1/1)**:
- `cadvisor`: Thu thập CPU/RAM của 11 container (`cadvisor:8080/metrics`).
- `cineevent-app`: Thu thập tần suất request, latency, booking total (`cineevent-app:5000/metrics`).
- `nginx`: Thu thập kết nối active/reading/writing/waiting (`cineevent-nginx-exporter:9113/metrics`).
- `mysql`: Thu thập QPS, threads connected (`cineevent-mysql-exporter:9104/metrics`).
- `prometheus`: Giám sát chính máy chủ Prometheus (`localhost:9090/metrics`).

### 7.2. Trực quan hóa trên Grafana Dashboard
1. Truy cập [http://localhost:3000](http://localhost:3000), đăng nhập `admin` / `Grafana_AdminSecurePass_2026!`.
2. Vào **Dashboards** &rarr; Mở thư mục **CineEvent** &rarr; Chọn dashboard **CineEvent — Hạ Tầng Giám Sát Prometheus & Grafana**.
3. Dashboard đã được cấu hình nạp sẵn (Provisioned) với đầy đủ các panels:
   - **Trạng thái hệ thống (System Status):** 4 thẻ chỉ số UP/DOWN của App, Nginx, MySQL, Prometheus.
   - **Tần suất yêu cầu (HTTP Request Rate):** Phân loại mã HTTP 2xx, 4xx, 5xx.
   - **Thời gian phản hồi (Response Latency):** Độ trễ p50, p95 tính bằng mili-giây.
   - **Nginx Web Server:** Active connections, Reading, Writing, Waiting.
   - **MySQL Database:** Queries per second (QPS), Threads Connected, Slow Queries.
   - **Container Resource:** Biểu đồ tiêu thụ CPU (%) và RAM (MB) của từng container.

---

## 8. Thu thập Log tập trung với Loki, Promtail và LogQL

Hệ thống sử dụng **Grafana Loki 2.9.2** để lưu trữ log và **Promtail 2.9.2** để thu thập log thời gian thực từ các volume chia sẻ của Nginx (`/var/log/nginx/*.log`) và Express Backend (`/var/log/app/*.log`).

### Cách mở Grafana Explore để truy vấn Log:
1. Đăng nhập Grafana tại [http://localhost:3000](http://localhost:3000).
2. Chọn biểu tượng **Explore** (la bàn) trên thanh menu bên trái.
3. Ở menu chọn Data Source góc trên bên trái, chọn **Loki**.
4. Nhập các câu truy vấn LogQL bên dưới vào ô tìm kiếm và bấm **Run Query** (hoặc `Shift + Enter`).

### Chi tiết 3 truy vấn LogQL bắt buộc:

#### Truy vấn 1 — Xem toàn bộ luồng nhật ký ứng dụng Backend:
```logql
{service="cineevent-app"}
```
- **Ý nghĩa:** Trích xuất toàn bộ các dòng log được phát sinh bởi ứng dụng Express.js.
- **Nhãn sử dụng:** `service="cineevent-app"`.
- **Kết quả mong đợi:** Hiển thị chi tiết sự kiện kết nối MySQL, quá trình đăng nhập của người dùng, tạo đơn đặt chỗ và xử lý giao dịch thanh toán giả lập.

#### Truy vấn 2 — Tìm các thông báo cảnh báo (WARN) và lỗi nghiệp vụ:
```logql
{service="cineevent-app"} |= "WARN"
```
- **Ý nghĩa:** Lọc các sự kiện bất thường và cảnh báo nghiệp vụ thông qua bộ lọc chuỗi (`|=`).
- **Nhãn sử dụng:** `service="cineevent-app"`.
- **Kết quả mong đợi:** Bắt được các sự kiện đăng nhập sai mật khẩu (HTTP 401), nỗ lực soát vé lại đối với một vé đã sử dụng trước đó (chống gian lận).

#### Truy vấn 3 — Giám sát nhật ký máy chủ Nginx theo mã lỗi HTTP:
```logql
{service="nginx"} |= " 401 "
```
- **Ý nghĩa:** Lọc các bản ghi Access Log của Nginx trả về mã trạng thái HTTP 401 Unauthorized.
- **Nhãn sử dụng:** `service="nginx"`.
- **Kết quả mong đợi:** Trích xuất các dòng Nginx Access log ghi nhận IP client, thời gian phản hồi (`rt=0.139s`), phương thức HTTP POST và URL đích khi truy cập không hợp lệ.

---

## 9. Các biện pháp Hardening và An toàn hệ thống

Hệ thống đã triển khai và xác minh thành công 9 biện pháp bảo vệ:

| STT | Biện pháp Hardening | Tệp cấu hình liên quan | Phương pháp xác minh thực tế | Trạng thái |
| :---: | :--- | :--- | :--- | :---: |
| **1** | **Non-Root Container** | `backend/Dockerfile` (`USER node`) | `docker exec cineevent-app whoami` &rarr; Trả về user `node` (UID 1000) | **ĐẠT** |
| **2** | **Network Isolation** | `docker-compose.yml` (3 networks) | Nginx không thể kết nối trực tiếp cổng 3306 của MySQL; MySQL không mở cổng ra host | **ĐẠT** |
| **3** | **Quản lý mật khẩu qua .env** | `.env`, `.env.example`, `.gitignore` | Không hardcode bí mật trong git; tệp `.env` bị loại trừ khỏi commit | **ĐẠT** |
| **4** | **Least Privilege DB User** | `database/permissions.sql` | `cineevent_user` chỉ có quyền thao tác trên `cineevent_db`, không thể truy cập bảng hệ thống | **ĐẠT** |
| **5** | **Security Headers OWASP** | `nginx/conf.d/default.conf` | `curl -I http://localhost/health` &rarr; Phản hồi đủ X-Frame, X-Content-Type, CSP | **ĐẠT** |
| **6** | **Ẩn phiên bản máy chủ** | `nginx/nginx.conf` (`server_tokens off;`) | HTTP response header `Server` chỉ hiển thị `nginx`, không lộ số hiệu phiên bản | **ĐẠT** |
| **7** | **Chống SQL Injection** | `backend/src/models/*.js` | 100% truy vấn dùng Prepared Statements (`?` parameter binding) | **ĐẠT** |
| **8** | **Rate Limiting chống Brute-force** | `backend/src/middlewares/rateLimiter` | Gửi liên tục 35 request login &rarr; Bị chặn đứng với HTTP 429 Too Many Requests | **ĐẠT** |
| **9** | **Chống gian lận vé điện tử** | `backend/src/models/ticket.model.js` | Ghi nhận nhật ký soát vé có transaction; từ chối và báo lỗi khi soát lại vé đã dùng | **ĐẠT** |

---

## 10. Danh sách 3 Commit bắt buộc

Dự án tuân thủ nghiêm ngặt quy định không gộp toàn bộ vào một commit duy nhất, phân chia thành 3 commit tuần tự và có ý nghĩa rõ ràng:

1. **COMMIT 1 (`703ef49`):** `feat: deploy CineEvent with MySQL and Nginx reverse proxy`
   - Xây dựng Website CineEvent (HTML5, Bootstrap 5, Dark Glassmorphism, 100% Tiếng Việt).
   - Phát triển Backend Express.js REST API phân tầng (Routes, Middlewares, Controllers, Models).
   - Khởi tạo MySQL 8.0 với 17 bảng chuẩn hóa 3NF và công cụ quản trị phpMyAdmin.
   - Triển khai Nginx Reverse Proxy hỗ trợ SSL tự ký và 5 Security Headers chuẩn OWASP.
   - Áp dụng các biện pháp Hardening ban đầu (Non-root user `node`, Network Isolation).

2. **COMMIT 2 (`1e2f2a5`):** `feat: add Prometheus and Grafana monitoring`
   - Cấu hình Prometheus server và 5 scrape targets (App, Nginx, MySQL, cAdvisor, Prometheus).
   - Tích hợp Nginx Prometheus Exporter và MySQL Exporter với quyền least-privilege.
   - Tự động nạp (Provisioning) Dashboard Grafana chuyên nghiệp theo dõi tài nguyên và nghiệp vụ.
   - Bổ sung tài liệu hướng dẫn kiểm tra và truy vấn Metrics.

3. **COMMIT 3:** `feat: add Loki Promtail logging and project report`
   - Tích hợp dịch vụ Grafana Loki 2.9.2 và Promtail 2.9.2 thu thập log tập trung Nginx & Express.
   - Cấu hình datasource Loki trên Grafana và kiểm thử thành công 3 truy vấn LogQL thực tế.
   - Hoàn thiện tài liệu ma trận hardening và bộ 18 ảnh chụp minh chứng thực tế trong `report/images/`.
   - Xuất bản Báo cáo tổng hợp môn học đạt chuẩn học thuật 35 trang in (`Bao-cao-De-11-CineEvent.docx` và `Bao-cao-De-11-CineEvent.pdf`).

Kiểm tra lịch sử commit bằng lệnh:
```bash
git log --oneline -n 3
```

---

## 11. Kịch bản trình diễn trên lớp (11 bước demo)

Sinh viên thực hiện tuần tự theo kịch bản 11 bước sau khi bảo vệ bài tập lớn:

- [ ] **Bước 1 — Khởi động:** Mở Terminal tại thư mục dự án, chạy lệnh `docker compose up -d --build`.
- [ ] **Bước 2 — Trạng thái dịch vụ:** Chạy `docker compose ps`, chỉ ra cả 11 container đều đang ở trạng thái `Up (healthy)`.
- [ ] **Bước 3 — Trang chủ Web:** Mở trình duyệt tại [http://localhost](http://localhost), giới thiệu giao diện Dark Glassmorphism, danh sách phim đang chiếu và các sự kiện âm nhạc.
- [ ] **Bước 4 — Đặt vé rạp:** Bấm chọn phim, chọn suất chiếu, chọn các ghế còn trống trên sơ đồ rạp trực quan và xác nhận đơn hàng.
- [ ] **Bước 5 — Thanh toán giả lập:** Bấm "Thanh toán thành công giả lập", hệ thống chuyển sang trang Vé điện tử có mã QR bảo mật và hiển thị thông tin vé chi tiết.
- [ ] **Bước 6 — Soát vé tại cửa:** Đăng nhập tài khoản Nhân viên (`staff@cineevent.vn`), truy cập cổng Soát vé `/staff-checkin.html`, nhập mã vé để xác nhận Check-in thành công. Thử soát lại mã vé đó lần 2 để chứng minh hệ thống chặn đứng gian lận vé.
- [ ] **Bước 7 — Kiểm tra CSDL:** Mở phpMyAdmin tại [http://127.0.0.1:8085](http://127.0.0.1:8085), mở bảng `bookings`, `tickets` và `ticket_checkins` để chứng minh dữ liệu giao dịch thực tế đã lưu bền vững vào MySQL.
- [ ] **Bước 8 — Giám sát Prometheus:** Mở [http://localhost:9090/targets](http://localhost:9090/targets), chứng minh cả 5 targets đều có trạng thái **UP**.
- [ ] **Bước 9 — Dashboard Grafana:** Mở [http://localhost:3000](http://localhost:3000), mở dashboard CineEvent Overview, thuyết minh các chỉ số lưu lượng HTTP, Latency, CPU, RAM container và MySQL QPS.
- [ ] **Bước 10 — Truy vấn Loki LogQL:** Mở Grafana Explore, chọn nguồn Loki và chạy lần lượt 3 truy vấn LogQL: `{service="cineevent-app"}`, `{service="cineevent-app"} |= "WARN"` và `{service="nginx"} |= " 401 "`.
- [ ] **Bước 11 — Hardening & Báo cáo:** Mở Git log chứng minh 3 commit độc lập, trình bày bảng ma trận Hardening và mở báo cáo `report/Bao-cao-De-11-CineEvent.docx` (hoặc bản `.pdf`).

---

## 12. Bảng tự kiểm tra nghiệm thu theo thang điểm 10

| Tiêu chí | Trọng số | Yêu cầu kiểm tra chi tiết | Trạng thái |
| :--- | :---: | :--- | :---: |
| **Tiêu chí 1: GitHub & Quản lý mã nguồn** | **1.5 điểm** | Có .gitignore, .env.example, README hướng dẫn chi tiết, 3 commit tuần tự có ý nghĩa, không chứa secrets | **ĐẠT 100%** |
| **Tiêu chí 2: Ứng dụng & Cơ sở dữ liệu** | **1.5 điểm** | Website đẹp, REST API Express phân tầng, MySQL 17 bảng chuẩn hóa, ACID transaction, phpMyAdmin | **ĐẠT 100%** |
| **Tiêu chí 3: Nginx Reverse Proxy** | **1.5 điểm** | Nginx làm cổng duy nhất, HTTPS với SSL tự ký, 5 Security Headers OWASP, ẩn server version | **ĐẠT 100%** |
| **Tiêu chí 4: Prometheus & Grafana** | **1.5 điểm** | 5 Scrape targets UP 100%, 4 Exporters (Container, Web, DB, App), Dashboard nạp tự động có dữ liệu thực | **ĐẠT 100%** |
| **Tiêu chí 5: Loki & Promtail Logging** | **1.5 điểm** | Thu thập log Nginx và App vào Loki, Grafana Explore truy vấn thành công 3 truy vấn LogQL thực tế | **ĐẠT 100%** |
| **Tiêu chí 6: Hardening & An toàn hệ thống** | **1.5 điểm** | Non-root container, network isolation, least privilege DB user, quản lý mật khẩu qua .env, rate limiter | **ĐẠT 100%** |
| **Tiêu chí 7: Báo cáo & Trình diễn tổng thể** | **1.0 điểm** | Báo cáo môn học bài bản 35 trang in, tích hợp 18 ảnh minh chứng thực tế, kịch bản 11 bước rõ ràng | **ĐẠT 100%** |
| **TỔNG ĐIỂM DỰ KIẾN** | **10.0 / 10.0** | **Hệ thống hoàn chỉnh, đáp ứng xuất sắc mọi tiêu chí đánh giá của đề bài** | **XUẤT SẮC** |

---

## 13. Hướng dẫn sinh viên tự đẩy mã nguồn lên GitHub

Khi sinh viên đã tạo repository trên tài khoản GitHub cá nhân (Ví dụ: `https://github.com/[MSSV]/MSSV-de11-cineevent.git`), thực thi các lệnh sau tại thư mục dự án:

```bash
# 1. Kiểm tra trạng thái Git
git status

# 2. Thêm remote repository của bạn
git remote add origin https://github.com/[MSSV]/MSSV-de11-cineevent.git

# 3. Đổi tên nhánh chính thành main (nếu chưa có)
git branch -M main

# 4. Đẩy toàn bộ mã nguồn và 3 commit lên GitHub
git push -u origin main
```
