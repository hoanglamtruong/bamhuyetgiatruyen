# Bấm Huyệt Gia Truyền — Nền Tảng Bán Hàng Chia Sẻ Doanh Thu

Nền tảng B2C dành riêng cho cơ sở Bấm Huyệt Gia Truyền, vận hành theo mô hình hợp tác **Chia Sẻ Doanh Thu** (Zeebee/Manager 30% — Owner/Khách 70%).

## 🎯 5 Tính Năng Cốt Lõi
1. **(1) Đặt lịch hẹn (Booking):** Đặt lịch khám và trị liệu trực tuyến, chọn thời lượng, khung giờ và lương y.
2. **(2) Giới thiệu dịch vụ (Catalog):** Bảng giá niêm yết, quy trình trị liệu đả thông kinh lạc, hiệu quả điều trị đau mỏi cổ vai gáy & thắt lưng.
3. **(3) Form liên hệ & Tư vấn:** Thu thập triệu chứng bệnh lý và tiếp nhận tư vấn chuyên sâu.
4. **(4) Quản lý khách hàng (CRM):** Lưu trữ hồ sơ bệnh nhân, tiền sử bệnh án, lưu ý các huyệt đạo quan trọng, số lượt điều trị và tổng chi tiêu.
5. **(5) Quản lý đơn hàng dịch vụ:** Tạo và chốt đơn dịch vụ, tự động chia sẻ doanh thu 70% Owner và 30% Manager.

## 👥 Phân Quyền 3 Vai Trò (RBAC)
- **Manager (Zeebee):** Toàn quyền xem doanh thu tổng hợp toàn hệ thống; phê duyệt nhân sự Admin; tuyệt đối không thao tác vận hành hàng ngày trên 5 tính năng.
- **Admin (Kỹ thuật):** Cấu hình hệ thống & tham số leo thang, đăng tải/chỉnh nội dung dịch vụ, xem toàn bộ dữ liệu hỗ trợ kỹ thuật; là bên thực thi Bước 3 (ngưng hoạt động) ở nhánh KPI (thủ công, không tự động).
- **Owner / Seller (Chủ cơ sở):** Toàn quyền trên khách hàng, dịch vụ, đơn hàng của mình; xem doanh thu của mình và nghĩa vụ đối soát 30% với Manager.

## ⚠️ Cơ Chế Leo Thang 3 Bước (Tham Số Hóa Toàn Diện)
Dùng chung cho 2 nhánh vi phạm, không hardcode mốc thời gian hay ngưỡng số liệu:
- **Bước 1:** Hệ thống tự động gửi thông báo qua Telegram cho Owner khi phát hiện vi phạm.
- **Bước 2:** Popup cảnh báo toàn diện trên web, hiển thị rõ ngày cụ thể sẽ ngưng hoạt động nếu chưa khắc phục.
- **Bước 3:**
  - *Nhánh trễ thanh toán (Hạn 25 hàng tháng):* Tự động đình chỉ website hoàn toàn sau 7 ngày quá hạn.
  - *Nhánh KPI doanh thu (Tối thiểu 50 triệu/tháng trong 3 tháng liên tiếp):* Admin thực hiện ngưng hoạt động thủ công trên giao diện quản trị sau thời gian cảnh báo.

## 🛠️ Công Nghệ & Hạ Tầng (Chuẩn ZOS - LESSON-002)
- **Framework:** Next.js 16 (Turbopack, App Router) + React 19 + TypeScript
- **Styling:** Tailwind CSS v4 (Theme Zteam: Teal `#1B6B7B`, Orange `#E8622A`, Cream `#F2ECD8`)
- **Database:** PostgreSQL 16 + Connection Pool (`pg`)
- **Container:** Docker & Docker Compose (`bamhuyetgiatruyen-app` port `8123`, `bamhuyetgiatruyen-postgres` port `5443`, mạng `homelab-net`)
- **Domain:** `bamhuyetgiatruyen.zeebee.vn`

## 🚀 Khởi Chạy
```bash
# Cài đặt và build
npm install
npm run build

# Chạy kiểm thử tự động toàn diện Tầng 1
npx tsx scripts/test_suite.ts

# Chạy Docker
docker compose up -d --build
```

---
*Phát triển bởi Zteam · VÒNG 1 SETUP*

## 🧪 Trạng Thái Kiểm Thử Tầng 1
- Automated Test Suite: 27/27 PASS (100%)
- Verification: Passed all 5 core features, 3 roles RBAC, and 3-step escalation engine.
