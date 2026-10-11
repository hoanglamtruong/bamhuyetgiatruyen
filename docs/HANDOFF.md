# HANDOFF — Onbase Bấm Huyệt Gia Truyền (`bamhuyetgiatruyen.zeebee.vn`)

> Bàn giao kỹ thuật · hạ tầng · công nghệ · tiến trình build · vận hành nâng cấp.
> Cập nhật lần cuối: **11/10/2026** (viết sau khảo sát, chưa sửa code onbase này) — cập nhật lại mỗi khi đổi hạ tầng hoặc xong một vòng build.

| Giai đoạn | Trạng thái |
|---|---|
| 1. Cài đặt | ✅ Live tại `https://bamhuyetgiatruyen.zeebee.vn` |
| 2. Xây dựng | 🟡 5 tính năng lõi + 3 vai trò đã có (12–13/09/2026) |
| 3. Vận hành | 🟡 Bản demo `bhgt.zeebee.io.vn` không truy cập được (chưa có DNS); mật khẩu DB nằm trong repo |

---

## 1. Onbase là gì

Nền tảng B2C riêng cho cơ sở **Bấm Huyệt Gia Truyền**, mô hình **chia sẻ doanh thu**: Owner (chủ cơ sở) 70% — Zeebee/Manager 30%.
5 tính năng lõi: đặt lịch, giới thiệu dịch vụ + bảng giá, form liên hệ tư vấn, CRM khách hàng (hồ sơ, tiền sử, lưu ý huyệt đạo),
quản lý đơn dịch vụ (tự chia 70/30). 3 vai trò: **Manager** (Zeebee — xem doanh thu tổng, duyệt Admin), **Admin** (kỹ thuật, cấu hình, nội dung),
**Owner/Seller** (vận hành khách, dịch vụ, đơn của mình). Có cơ chế leo thang 3 bước theo KPI. Chi tiết: `README.md`.

## 2. Hạ tầng

| Hạng mục | Giá trị |
|---|---|
| Máy chạy | Dell OptiPlex 9010 (`zang-dell-optiplex-9010`) — xem zinfra |
| Compose | `~/work/bamhuyetgiatruyen/docker-compose.yml`, project `bamhuyetgiatruyen`, mạng `homelab-net` |
| App thật | `bamhuyetgiatruyen-app` — host `8123` → `3000`, `APP_ENV=production`, `SEED_DEMO_DATA=false`, DB `bamhuyetgiatruyen_db` |
| App demo | `bhgt-demo-app` (cùng image) — host `8124`, `APP_ENV=demo`, `SEED_DEMO_DATA=true`, DB `bhgt_demo_db` |
| DB | `bamhuyetgiatruyen-postgres` (postgres:16-alpine), volume Docker `bamhuyetgiatruyen-pgdata`, cổng host `5443` |
| Tên miền | `bamhuyetgiatruyen.zeebee.vn` → `8123`; `bhgt.zeebee.io.vn` → `8124` — route trên **Cloudflare Dashboard** (tunnel `homelab-tunnel`) |

### ⚠️ Vấn đề phát hiện 11/10/2026
1. **`bhgt.zeebee.io.vn` không phân giải DNS** — route có trong tunnel nhưng chưa có bản ghi DNS ở zone `zeebee.io.vn`. Thêm lại route trên dashboard (tự tạo DNS) nếu còn dùng bản demo.
2. **Mật khẩu Postgres nằm thẳng trong `docker-compose.yml`** (`DATABASE_URL`) đã commit lên Gitea → chuyển sang `.env` (không commit) và **đổi mật khẩu DB**.
3. **Cổng `5443` publish `0.0.0.0`** — app nối DB qua mạng Docker nên không cần; bỏ publish hoặc chỉ `127.0.0.1:5443`.

## 3. Công nghệ

- Next.js **16.3.3** · React 19.2.8 · TypeScript · Tailwind
- PostgreSQL 16 qua thư viện `pg` (SQL thuần, **không ORM**) — bảng tạo tự động trong `src/lib/db.ts`:
  `users`, `services`, `customers`, `bookings`, `orders`, `contacts`, `system_configs`, `escalation_logs`, `banners`, `reviews`
- Xác thực tự viết (`src/lib/auth.ts`), leo thang KPI (`src/lib/escalation.ts`)
- **Biến môi trường (chỉ tên):** `DATABASE_URL`, `APP_ENV`, `SEED_DEMO_DATA`, `NODE_ENV`, `PORT`

## 4. Mã nguồn

| | |
|---|---|
| Repo | **Gitea** `zos/bamhuyetgiatruyen` (remote `gitea`, `http://localhost:3000/...`) — nhánh `main` |
| Bản làm việc | `~/work/bamhuyetgiatruyen` (đúng thư mục build của container) |
| Trang | `/` · `/services` · `/booking` · `/contact` · `/login` · `/profile` · `/owner` · `/owner/revenue` · `/manager` · `/admin` |
| API | `/api/auth/*` (login, logout, me, register, status), `/api/services`, `/api/bookings`, `/api/orders`, `/api/customers`, `/api/customer/*`, `/api/contacts`, `/api/reviews`, `/api/banners`, `/api/theme`, `/api/escalation`, `/api/manager/*` |
| Kiểm thử | `scripts/test_suite.ts` |

## 5. Tiến trình build

| Mốc | Nội dung |
|---|---|
| 12/09/2026 | Setup nền tảng: 5 tính năng lõi, 3 vai trò, leo thang 3 bước (`4184e5d`); tùy biến vai trò, theme/banner, chống trùng lịch, xác nhận đặt lịch 1 chạm, doanh thu tạm tính (`3b1ef8e`) |
| 13/09/2026 | Ẩn chữ nội bộ, hiện/ẩn mật khẩu, ghi nhớ đăng nhập; tạo tài khoản Owner (Duy) và Manager (Zang); theme spa sang trọng (`8279e72`) |

### Việc còn lại để HOÀN THIỆN
1. Xử lý 3 vấn đề ở mục 2 (DNS demo, mật khẩu DB trong repo, cổng 5443).
2. Đẩy repo lên GitHub (hiện chỉ có trên Gitea nội bộ) để đồng bộ với các onbase khác.
3. Sao lưu tự động DB (chưa có).
4. Áp dụng flow chung hệ sinh thái cho form liên hệ/đặt lịch: Telegram báo Owner/Seller ngay khi có lịch mới. Hiện Telegram chỉ dùng cho **leo thang KPI** (`src/lib/escalation.ts`, token cấu hình trong DB `system_configs`, không qua biến môi trường).

## 6. Vận hành & nâng cấp

### Deploy
```bash
cd ~/work/bamhuyetgiatruyen && git pull
docker tag bamhuyetgiatruyen-app:latest bamhuyetgiatruyen-app:backup-$(date +%Y%m%d)
docker compose up -d --build        # build lại cả app thật và demo (dùng chung image)
```
Thử trên bản demo (`8124`, DB demo riêng) trước khi coi là xong.

### Sao lưu DB
```bash
docker exec bamhuyetgiatruyen-postgres pg_dump -U bamhuyet bamhuyetgiatruyen_db > ~/backup/bhgt-$(date +%Y%m%d).sql
```

### Kiểm tra sức khỏe
`curl -s -o /dev/null -w '%{http_code}\n' https://bamhuyetgiatruyen.zeebee.vn/` · `docker logs --tail 50 bamhuyetgiatruyen-app`

## 7. Liên quan
- Hạ tầng tổng: skill **zinfra** · Các onbase khác có `docs/HANDOFF.md` trong repo riêng (Decor, App, Ads, Owner)
