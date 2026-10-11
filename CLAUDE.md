# CLAUDE.md — Agent phụ trách onbase **Bấm Huyệt Gia Truyền** (`bamhuyetgiatruyen.zeebee.vn`)

Bạn là agent **riêng** của onbase này. Mỗi onbase (website/app/game) trong hệ sinh thái Zeebee có một agent phụ trách,
đi qua 3 giai đoạn **Cài đặt → Xây dựng → Vận hành**. Onbase này: đang **Vận hành** cho một cơ sở thật (Owner Duy) — có dữ liệu khách thật.

## Đọc trước khi làm bất cứ việc gì
1. `docs/HANDOFF.md` — hiện trạng, hạ tầng (bản thật 8123 + bản demo 8124 dùng chung image), vấn đề cần xử lý.
2. `docs/HISTORY.md` — lịch sử, **luật nghiệp vụ cốt lõi** (chia 70/30, 3 vai trò, leo thang 3 bước), bài học.
3. `README.md` — mô tả nghiệp vụ chi tiết.
4. `~/zeebee/docs/HANDOFF.md` — bức tranh hệ sinh thái, hạ tầng chung, vấn đề còn mở.

## Phạm vi
- Repo **Gitea** `zos/bamhuyetgiatruyen` (`main`), bản làm việc `~/work/bamhuyetgiatruyen` (cũng là thư mục build của container).
- Container `bamhuyetgiatruyen-app` (thật), `bhgt-demo-app` (demo), `bamhuyetgiatruyen-postgres` (2 DB: thật + demo).
- Không sửa code onbase khác.

## Quy tắc bất biến
- Đây là **dữ liệu khách hàng & bệnh án thật** — không tạo dữ liệu thử trên bản thật; thử trên **bản demo (8124)**.
- **`pg_dump` DB thật trước** mọi thay đổi schema (bảng tạo trong `src/lib/db.ts`) hoặc tạo lại container DB.
- Build lại sẽ thay **cả bản thật lẫn demo** (chung image) — kiểm tra demo trước rồi mới coi là xong.
- Không đổi luật chia doanh thu, vai trò, mốc leo thang khi chưa hỏi CEO; tham số leo thang để ở cấu hình, không viết cứng.
- Bí mật (mật khẩu DB, token Telegram) không nằm trong code, compose, tài liệu hay chat.
- Telegram inline button **không `tel:`**. Route/DNS Cloudflare chỉ sửa trên **Dashboard**.

## Khi xong một vòng việc
1. Thêm mục vào `docs/HISTORY.md`. 2. Cập nhật `docs/HANDOFF.md`. 3. Cập nhật dòng Bấm Huyệt trong bảng `~/zeebee/docs/HANDOFF.md`.
