# LỊCH SỬ PHÁT TRIỂN — Onbase Bấm Huyệt Gia Truyền (`bamhuyetgiatruyen.zeebee.vn`)

> Dành cho agent phụ trách onbase này. Tình trạng hiện tại xem `docs/HANDOFF.md`; mô tả nghiệp vụ đầy đủ xem `README.md`.
> Cập nhật lần cuối: 11/10/2026. **Ghi thêm vào cuối file mỗi khi xong một vòng hoặc có quyết định mới.**

## Tóm tắt một dòng

Nền tảng bán hàng + trị liệu Đông y riêng cho **một cơ sở thật** (Bấm Huyệt Gia Truyền, chủ cơ sở: **Duy**), mô hình **chia sẻ doanh thu
70% Owner / 30% Zeebee (Manager: Zang)**. Dựng trong 2 ngày 12–13/09/2026, chạy song song bản thật và bản demo; từ đó chưa nâng cấp.

## Dòng thời gian

### 12/09/2026 — Vòng 1 SETUP
- **`4184e5d`:** dựng nền tảng với **5 tính năng lõi** (đặt lịch, giới thiệu dịch vụ/bảng giá, form liên hệ tư vấn, CRM khách hàng có tiền sử
  bệnh và lưu ý huyệt đạo, đơn dịch vụ tự chia 70/30), **3 vai trò** (Manager · Admin · Owner/Seller) và **cơ chế leo thang 3 bước**
  (Telegram → popup cảnh báo có ngày cụ thể → ngưng hoạt động). Bộ kiểm thử Tầng 1: 27/27 PASS.
- **`3b1ef8e`:** tùy biến vai trò, theme/banner, **chống trùng lịch**, xác nhận đặt lịch 1 chạm, doanh thu tạm tính.
- **`ca88ab2`:** bỏ tab quản lý sản phẩm (dịch vụ là trọng tâm, không bán sản phẩm), thêm cấu hình logo/ảnh nền.
- **`a29e915`:** **tách 2 môi trường** — thật (cổng 8123, DB sạch) và demo (cổng 8124, `SEED_DEMO_DATA=true`, DB riêng) dùng chung image.

### 13/09/2026 — hoàn thiện tài khoản & giao diện
- **`c65c61f`, `d274fb0`:** khách tự đăng ký/đăng nhập, hồ sơ, lịch sử đơn, đánh giá riêng tư; **tách đăng ký khách khỏi việc cấp tài khoản nhân sự**;
  một trang đăng nhập chung cho mọi vai trò.
- **`e4fdded`:** ẩn chữ vận hành nội bộ khỏi khách, hiện/ẩn mật khẩu, ghi nhớ đăng nhập.
- **`96c5c79`:** tạo tài khoản thật **Owner Duy** và **Manager Zang**; đăng nhập không phân biệt hoa thường.
- **`8279e72`:** theme spa sang trọng theo ảnh tham khảo.

### 11/10/2026 — khảo sát & tài liệu
Viết HANDOFF, file này, `CLAUDE.md`. Phát hiện: demo `bhgt.zeebee.io.vn` không có DNS; mật khẩu DB nằm trong `docker-compose.yml` đã commit;
cổng DB `5443` publish ra mọi giao diện.

## Luật nghiệp vụ cốt lõi (không đổi khi chưa hỏi CEO)
- Chia doanh thu **70% Owner / 30% Manager** trên mỗi đơn dịch vụ.
- **Manager** xem doanh thu tổng, duyệt Admin; **không** thao tác vận hành hằng ngày.
- **Admin** cấu hình hệ thống, tham số leo thang, nội dung dịch vụ; là bên thực hiện ngưng hoạt động nhánh KPI (**thủ công**).
- **Owner/Seller** toàn quyền khách, dịch vụ, đơn của mình; đối soát 30% với Manager.
- Leo thang 3 bước, **tham số hóa** (không viết cứng mốc):
  - Trễ thanh toán (hạn ngày 25 hằng tháng) → tự động đình chỉ web sau 7 ngày quá hạn.
  - KPI doanh thu (tối thiểu 50 triệu/tháng, 3 tháng liên tiếp) → Admin ngưng thủ công sau cảnh báo.

## Bài học
| Sự cố | Bài học |
|---|---|
| Mật khẩu DB viết thẳng trong compose rồi commit | Bí mật luôn ở `.env` không commit; đã lộ thì phải đổi |
| Route demo tồn tại trên tunnel nhưng không có DNS | Sau khi thêm route, kiểm tra tên miền phân giải được và trả 200 |
| Postgres publish `0.0.0.0` dù app nối qua mạng Docker | Không publish cổng DB trừ khi thật cần, và khi cần thì chỉ `127.0.0.1` |
