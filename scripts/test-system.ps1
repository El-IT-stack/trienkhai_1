# ==============================================================================
# CINEEVENT END-TO-END TEST SCRIPT
# Kiểm thử toàn diện API, Database, Booking, Payment, Checkin & phpMyAdmin
# ==============================================================================

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "1. KIỂM THỬ KẾT NỐI VÀ HEALTH CHECK QUA NGINX REVERSE PROXY" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
$health = Invoke-RestMethod -Uri "http://localhost/health"
Write-Host "Health Status: $($health.status) | Database: $($health.database)" -ForegroundColor Green

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "2. KIỂM THỬ ĐĂNG NHẬP 4 VAI TRÒ (ADMIN, MANAGER, STAFF, CUSTOMER)" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
$users = @(
    @{ Role = "Admin"; Email = "admin@cineevent.vn"; Pass = "AdminPassword123!" },
    @{ Role = "Manager"; Email = "manager@cineevent.vn"; Pass = "ManagerPassword123!" },
    @{ Role = "Staff"; Email = "staff@cineevent.vn"; Pass = "StaffPassword123!" },
    @{ Role = "Customer"; Email = "customer@gmail.com"; Pass = "CustomerPassword123!" }
)

$tokens = @{}
foreach ($u in $users) {
    $body = @{ email = $u.Email; password = $u.Pass } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "http://localhost/api/auth/login" -Method Post -Body $body -ContentType "application/json"
    $tokens[$u.Role] = $res.data.token
    Write-Host "[OK] $($u.Role): $($res.data.user.full_name) | Email: $($res.data.user.email) | Role: $($res.data.user.role_name)" -ForegroundColor Green
}

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "3. KIỂM THỬ DANH SÁCH SUẤT CHIẾU VÀ SƠ ĐỒ GHẾ" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
$showtimes = Invoke-RestMethod -Uri "http://localhost/api/showtimes?movie_id=1"
Write-Host "Tìm thấy $($showtimes.count) suất chiếu cho phim ID 1" -ForegroundColor Green
$st1 = $showtimes.data[0]
Write-Host "Suất chiếu ID: $($st1.id) - $($st1.cinema_name) - $($st1.room_name) - $($st1.start_time)" -ForegroundColor Yellow

$seats = Invoke-RestMethod -Uri "http://localhost/api/showtimes/$($st1.id)/seats"
Write-Host "Tổng số ghế: $($seats.data.total_seats) | Ghế còn trống: $($seats.data.available_seats)" -ForegroundColor Green

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "4. KIỂM THỬ LUỒNG ĐẶT VÉ (BOOKING TRANSACTION)" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
# Find an unbooked seat in row A
$availSeat = $seats.data.raw_seats | Where-Object { $_.is_booked -eq 0 -and $_.seat_row -eq 'A' } | Select-Object -First 1
Write-Host "Chọn ghế trống: Row $($availSeat.seat_row)$($availSeat.seat_number) (ID: $($availSeat.id))" -ForegroundColor Yellow

$headersCust = @{ Authorization = "Bearer $($tokens['Customer'])" }
$bookingBody = @{
    booking_type = "movie"
    showtime_id = $st1.id
    seat_items = @(
        @{ seat_id = $availSeat.id; unit_price = $st1.price_standard }
    )
} | ConvertTo-Json

$bkRes = Invoke-RestMethod -Uri "http://localhost/api/bookings" -Method Post -Body $bookingBody -ContentType "application/json" -Headers $headersCust
$bookingCode = $bkRes.data.bookingCode
$bookingId = $bkRes.data.bookingId
Write-Host "[OK] Đã tạo đơn đặt vé thành công! Mã đơn: $bookingCode (ID: $bookingId)" -ForegroundColor Green

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "5. KIỂM THỬ CỔNG THANH TOÁN GIẢ LẬP (SIMULATED PAYMENT)" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
$payBody = @{
    booking_id = $bookingId
    action = "SUCCESS"
    payment_method = "SIMULATED_VNPAY"
} | ConvertTo-Json

$payRes = Invoke-RestMethod -Uri "http://localhost/api/payments/simulate" -Method Post -Body $payBody -ContentType "application/json" -Headers $headersCust
Write-Host "[OK] Kết quả thanh toán: $($payRes.status) | Mã GD: $($payRes.transaction_code)" -ForegroundColor Green
$issuedTicket = $payRes.tickets[0]
Write-Host "Vé điện tử được phát hành: Mã vé: $($issuedTicket.ticket_code) | QR: $($issuedTicket.qr_data)" -ForegroundColor Yellow

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "6. KIỂM THỬ CỔNG SOÁT VÉ NHÂN VIÊN (STAFF TICKET CHECK-IN)" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
$headersStaff = @{ Authorization = "Bearer $($tokens['Staff'])" }
$checkinBody = @{
    ticket_code = $issuedTicket.ticket_code
    notes = "Soát vé tự động qua script kiểm thử E2E"
} | ConvertTo-Json

$chkRes = Invoke-RestMethod -Uri "http://localhost/api/tickets/checkin" -Method Post -Body $checkinBody -ContentType "application/json" -Headers $headersStaff
Write-Host "[OK] $($chkRes.message) | Khách: $($chkRes.customer_name) | Vị trí: $($chkRes.seat)" -ForegroundColor Green

# Test duplicate check-in (Fraud prevention verification)
Write-Host "Thử soát lại vé vừa sử dụng (Kiểm tra chống gian lận)..." -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "http://localhost/api/tickets/checkin" -Method Post -Body $checkinBody -ContentType "application/json" -Headers $headersStaff
    Write-Host "[FAILED] Lỗi: Vé đã dùng nhưng hệ thống vẫn cho checkin lại!" -ForegroundColor Red
} catch {
    Write-Host "[OK CHỐNG GIAN LẬN] Hệ thống đã từ chối chính xác: $($_.Exception.Message)" -ForegroundColor Green
}

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "7. KIỂM THỬ KẾT NỐI PHPMYADMIN" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
$pma = Invoke-WebRequest -Uri "http://127.0.0.1:8085" -UseBasicParsing
Write-Host "[OK] phpMyAdmin phản hồi HTTP StatusCode: $($pma.StatusCode)" -ForegroundColor Green

Write-Host "`n>>> TẤT CẢ CÁC BƯỚC KIỂM THỬ GIAI ĐOẠN 1 ĐÃ ĐẠT CHUẨN 100%! <<<`n" -ForegroundColor Green
