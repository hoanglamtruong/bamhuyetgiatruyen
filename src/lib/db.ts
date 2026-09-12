import { Pool } from "pg";

const globalForPg = globalThis as unknown as {
  pgPool: Pool | undefined;
};

export const pool =
  globalForPg.pgPool ??
  new Pool({
    connectionString:
      process.env.DATABASE_URL ||
      "postgresql://bamhuyet:bamhuyet_secure_pass@localhost:5443/bamhuyetgiatruyen_db",
  });

if (process.env.NODE_ENV !== "production") globalForPg.pgPool = pool;

export async function initDatabase() {
  const client = await pool.connect();
  try {
    // 1. Bảng Users (Manager, Admin, Owner)
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        is_approved BOOLEAN NOT NULL DEFAULT true,
        telegram_chat_id VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Bảng Dịch Vụ (Services)
    await client.query(`
      CREATE TABLE IF NOT EXISTS services (
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        benefits TEXT,
        duration_minutes INT NOT NULL DEFAULT 60,
        price NUMERIC(18, 2) NOT NULL,
        category VARCHAR(100) DEFAULT 'Trị Liệu',
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Bảng Khách Hàng (CRM)
    await client.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255),
        health_notes TEXT,
        total_spent NUMERIC(18, 2) NOT NULL DEFAULT 0,
        treatment_count INT NOT NULL DEFAULT 0,
        last_visit TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Bảng Đặt Lịch Hẹn (Bookings)
    await client.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id VARCHAR(50) PRIMARY KEY,
        customer_name VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(50) NOT NULL,
        service_id VARCHAR(50) REFERENCES services(id) ON DELETE SET NULL,
        booking_date DATE NOT NULL,
        booking_time VARCHAR(20) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 5. Bảng Đơn Hàng Dịch Vụ (Orders - Chia sẻ doanh thu 30/70)
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(50) PRIMARY KEY,
        order_code VARCHAR(50) UNIQUE NOT NULL,
        customer_id VARCHAR(50) REFERENCES customers(id) ON DELETE SET NULL,
        customer_name VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(50) NOT NULL,
        service_id VARCHAR(50) REFERENCES services(id) ON DELETE SET NULL,
        service_title VARCHAR(255) NOT NULL,
        amount NUMERIC(18, 2) NOT NULL,
        commission_rate NUMERIC(5, 2) NOT NULL DEFAULT 30,
        manager_amount NUMERIC(18, 2) NOT NULL,
        owner_amount NUMERIC(18, 2) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'completed',
        month_period VARCHAR(7) NOT NULL, -- YYYY-MM
        completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 6. Bảng Form Liên Hệ (Contacts / Leads)
    await client.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        symptoms TEXT,
        status VARCHAR(50) NOT NULL DEFAULT 'new',
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 7. Bảng Cấu Hình Hệ Thống (System Configs & Parameters)
    await client.query(`
      CREATE TABLE IF NOT EXISTS system_configs (
        key VARCHAR(100) PRIMARY KEY,
        value TEXT NOT NULL,
        description TEXT,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 8. Bảng Escalation Logs
    await client.query(`
      CREATE TABLE IF NOT EXISTS escalation_logs (
        id VARCHAR(50) PRIMARY KEY,
        branch VARCHAR(50) NOT NULL, -- 'PAYMENT' | 'KPI'
        step INT NOT NULL, -- 0 | 1 | 2 | 3
        reason TEXT NOT NULL,
        warning_date DATE,
        triggered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP WITH TIME ZONE,
        is_active BOOLEAN NOT NULL DEFAULT true,
        executed_by VARCHAR(100) DEFAULT 'system'
      );
    `);

    // 9. Bảng Banners (Admin & Manager quản lý)
    await client.query(`
      CREATE TABLE IF NOT EXISTS banners (
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        subtitle TEXT,
        image_url TEXT,
        link_url VARCHAR(255),
        is_active BOOLEAN NOT NULL DEFAULT true,
        display_order INT NOT NULL DEFAULT 1,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Migration bổ sung cột nếu bảng đã tồn tại
    await client.query(`
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(18, 2) DEFAULT 0;
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS discount_reason TEXT;
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS final_amount NUMERIC(18, 2);
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS confirmation_message TEXT;

      ALTER TABLE orders ADD COLUMN IF NOT EXISTS booking_id VARCHAR(50);
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(18, 2) DEFAULT 0;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS original_amount NUMERIC(18, 2);
    `);

    const isDemoSeed = process.env.SEED_DEMO_DATA === "true";

    // Kiểm tra & Seed users (Chỉ seed tài khoản mẫu khi là môi trường demo)
    const { rows: userCount } = await client.query(`SELECT COUNT(*) FROM users;`);
    if (parseInt(userCount[0].count, 10) === 0 && isDemoSeed) {
      await client.query(`
        INSERT INTO users (id, username, password, name, role, is_approved, telegram_chat_id) VALUES
          ('u-manager', 'manager', 'manager123', 'Trưởng Ban Quản Lý (Zeebee)', 'MANAGER', true, 'telegram-manager-id'),
          ('u-admin', 'admin', 'admin123', 'Kỹ Thuật Viên Admin', 'ADMIN', true, 'telegram-admin-id'),
          ('u-admin-pending', 'admin_new', 'admin123', 'Admin Đang Chờ Duyệt', 'ADMIN', false, NULL),
          ('u-owner', 'owner', 'owner123', 'Chủ Cơ Sở Bấm Huyệt', 'OWNER', true, 'telegram-owner-chat-123');
      `);
    }

    // Kiểm tra & Seed services
    const { rows: serviceCount } = await client.query(`SELECT COUNT(*) FROM services;`);
    if (parseInt(serviceCount[0].count, 10) === 0) {
      await client.query(`
        INSERT INTO services (id, title, slug, description, benefits, duration_minutes, price, category) VALUES
          ('s1', 'Bấm Huyệt Trị Liệu Cổ Vai Gáy', 'co-vai-gay', 'Phương pháp bấm huyệt cổ truyền giải phóng chèn ép dây thần kinh vùng cổ gáy, kích thích tuần hoàn máu lên não.', 'Giảm đau mỏi tức thì, hết tê bì cánh tay, cải thiện giấc ngủ sâu.', 60, 350000, 'Trị Liệu Chuyên Sâu'),
          ('s2', 'Đả Thông Kinh Lạc Cột Sống Thắt Lưng', 'that-lung-cot-song', 'Tác động sâu vào các huyệt đạo Thận Du, Đại Trường Du giúp thư giãn cơ lưng, hỗ trợ người thoái hóa cột sống.', 'Phục hồi khả năng vận động, giảm đau buốt hông lưng, chống cứng cơ.', 75, 450000, 'Trị Liệu Chuyên Sâu'),
          ('s3', 'Xoa Bóp Bấm Huyệt Toàn Thân Thư Giãn', 'toan-than-thu-gian', 'Liệu trình toàn thân kết hợp xoa bóp day ấn huyệt và tinh dầu gừng quế thảo dược gia truyền.', 'Đào thải độc tố, giảm stress mệt mỏi, cân bằng khí huyết âm dương.', 90, 500000, 'Dưỡng Sinh Phục Hồi'),
          ('s4', 'Diện Chẩn & Bấm Huyệt An Thần Ngâm Chân', 'dien-chan-ngam-chan', 'Kích thích phản xạ thần kinh trên mặt kết hợp ngâm chân bài thuốc bắc lưu truyền 3 đời.', 'Điều hòa thần kinh thực vật, giảm đau đầu tiền đình, tăng cường miễn dịch.', 60, 300000, 'Dưỡng Sinh Phục Hồi');
      `);
    }

    // Kiểm tra & Seed customers (Chỉ seed dữ liệu mẫu khi là môi trường demo)
    const { rows: customerCount } = await client.query(`SELECT COUNT(*) FROM customers;`);
    if (parseInt(customerCount[0].count, 10) === 0 && isDemoSeed) {
      await client.query(`
        INSERT INTO customers (id, name, phone, email, health_notes, total_spent, treatment_count, last_visit) VALUES
          ('c1', 'Nguyễn Thị Thu Hà', '0912345678', 'ha.nguyen@gmail.com', 'Thoái hóa đốt sống cổ C4-C5, nhạy cảm với lực ấn mạnh, cần xoa bóp nhẹ làm ấm trước khi bấm huyệt.', 1400000, 4, CURRENT_TIMESTAMP - INTERVAL '3 days'),
          ('c2', 'Trần Đình Quang', '0987654321', 'quang.tran@outlook.com', 'Đau thắt lưng lan xuống chân trái do ngồi máy tính nhiều, cơ bắp căng cứng.', 900000, 2, CURRENT_TIMESTAMP - INTERVAL '7 days'),
          ('c3', 'Vũ Thị Minh Hạnh', '0903112233', 'hanh.vu@yahoo.com', 'Mất ngủ kinh niên, hay đau nửa đầu và lạnh bàn chân về đêm.', 600000, 2, CURRENT_TIMESTAMP - INTERVAL '10 days');
      `);
    }

    // Kiểm tra & Seed bookings (Chỉ seed dữ liệu mẫu khi là môi trường demo)
    const { rows: bookingCount } = await client.query(`SELECT COUNT(*) FROM bookings;`);
    if (parseInt(bookingCount[0].count, 10) === 0 && isDemoSeed) {
      await client.query(`
        INSERT INTO bookings (id, customer_name, customer_phone, service_id, booking_date, booking_time, status, notes) VALUES
          ('b1', 'Nguyễn Thị Thu Hà', '0912345678', 's1', CURRENT_DATE + INTERVAL '1 day', '09:00', 'confirmed', 'Khách yêu cầu kỹ thuật viên tay nghề cao'),
          ('b2', 'Phạm Quốc Bảo', '0933445566', 's2', CURRENT_DATE + INTERVAL '1 day', '14:30', 'pending', 'Lần đầu đến trải nghiệm, đau lưng cấp'),
          ('b3', 'Hoàng Yến Nhi', '0977889900', 's3', CURRENT_DATE + INTERVAL '2 days', '17:00', 'pending', 'Đặt combo toàn thân thư giãn cuối tuần');
      `);
    }

    // Kiểm tra & Seed orders (Chỉ seed dữ liệu mẫu khi là môi trường demo)
    const { rows: orderCount } = await client.query(`SELECT COUNT(*) FROM orders;`);
    if (parseInt(orderCount[0].count, 10) === 0 && isDemoSeed) {
      await client.query(`
        INSERT INTO orders (id, order_code, customer_id, customer_name, customer_phone, service_id, service_title, amount, commission_rate, manager_amount, owner_amount, status, month_period, completed_at) VALUES
          ('ord-001', 'ORD-202609-001', 'c1', 'Nguyễn Thị Thu Hà', '0912345678', 's1', 'Bấm Huyệt Trị Liệu Cổ Vai Gáy', 350000, 30, 105000, 245000, 'completed', '2026-09', CURRENT_TIMESTAMP - INTERVAL '3 days'),
          ('ord-002', 'ORD-202609-002', 'c2', 'Trần Đình Quang', '0987654321', 's2', 'Đả Thông Kinh Lạc Cột Sống Thắt Lưng', 450000, 30, 135000, 315000, 'completed', '2026-09', CURRENT_TIMESTAMP - INTERVAL '5 days'),
          ('ord-003', 'ORD-202609-003', 'c3', 'Vũ Thị Minh Hạnh', '0903112233', 's4', 'Diện Chẩn & Bấm Huyệt An Thần Ngâm Chân', 300000, 30, 90000, 210000, 'completed', '2026-09', CURRENT_TIMESTAMP - INTERVAL '6 days'),
          ('ord-004', 'ORD-202608-001', 'c1', 'Nguyễn Thị Thu Hà', '0912345678', 's3', 'Xoa Bóp Bấm Huyệt Toàn Thân Thư Giãn', 500000, 30, 150000, 350000, 'completed', '2026-08', '2026-08-20 10:00:00+07'),
          ('ord-005', 'ORD-202608-002', 'c2', 'Trần Đình Quang', '0987654321', 's2', 'Đả Thông Kinh Lạc Cột Sống Thắt Lưng', 450000, 30, 135000, 315000, 'completed', '2026-08', '2026-08-22 15:30:00+07'),
          ('ord-006', 'ORD-202607-001', 'c1', 'Nguyễn Thị Thu Hà', '0912345678', 's1', 'Bấm Huyệt Trị Liệu Cổ Vai Gáy', 350000, 30, 105000, 245000, 'completed', '2026-07', '2026-07-15 11:00:00+07');
      `);
    }

    // Kiểm tra & Seed system configs
    const { rows: configCount } = await client.query(`SELECT COUNT(*) FROM system_configs;`);
    if (parseInt(configCount[0].count, 10) === 0) {
      await client.query(`
        INSERT INTO system_configs (key, value, description) VALUES
          ('payment_due_day', '25', 'Ngày đến hạn thanh toán 30% doanh thu hàng tháng'),
          ('payment_step2_days', '3', 'Số ngày sau hạn thanh toán để kích hoạt Bước 2 (Popup cảnh báo web)'),
          ('payment_step3_days', '7', 'Số ngày sau hạn thanh toán để tự động ngưng hoạt động web (Bước 3)'),
          ('kpi_enabled', 'false', 'Bật/tắt module đánh giá KPI doanh thu (theo từng hợp đồng)'),
          ('kpi_target_monthly', '50000000', 'Doanh thu tối thiểu mỗi tháng theo KPI (VND)'),
          ('kpi_consecutive_months', '3', 'Số tháng liên tiếp không đạt KPI trước khi leo thang'),
          ('kpi_step2_days', '3', 'Số ngày sau khi chốt KPI để hiện popup Bước 2'),
          ('web_suspended', 'false', 'Trạng thái ngưng hoạt động toàn hệ thống web (Bước 3)'),
          ('suspension_reason', '', 'Lý do hệ thống ngưng hoạt động'),
          ('suspension_branch', '', 'Nhánh gây ra ngưng hoạt động (PAYMENT hoặc KPI)'),
          ('telegram_bot_token', 'mock_token_zeebee_bot', 'Token Telegram Bot gửi cảnh báo Bước 1'),
          ('telegram_owner_chat_id', 'mock_chat_id_owner', 'Telegram Chat ID của Owner để nhận cảnh báo'),
          ('theme_title', 'Bấm Huyệt Gia Truyền', 'Tên thương hiệu hiển thị'),
          ('theme_slogan', 'Khơi Thông Kinh Lạc · Đẩy Lùi Đau Nhức Cổ Vai Gáy', 'Khẩu hiệu thương hiệu'),
          ('theme_primary_color', '#1B6B7B', 'Màu chủ đạo (Teal)'),
          ('theme_accent_color', '#E8622A', 'Màu điểm nhấn (Orange)'),
          ('theme_hotline', '0912.345.678', 'Hotline liên hệ'),
          ('theme_address', 'Số 18 Phố Trị Liệu Cổ Truyền, Quận Hoàn Kiếm, Hà Nội', 'Địa chỉ cơ sở'),
          ('theme_logo_url', '', 'Đường dẫn hình ảnh Logo thương hiệu'),
          ('theme_bg_image', '', 'Đường dẫn hình ảnh nền Hero/Website');
      `);
    }

    // Seed Banners nếu trống
    const { rows: bannerCount } = await client.query(`SELECT COUNT(*) FROM banners;`);
    if (parseInt(bannerCount[0].count, 10) === 0) {
      await client.query(`
        INSERT INTO banners (id, title, subtitle, image_url, link_url, is_active, display_order) VALUES
          ('ban-1', 'Ưu Đãi Trị Liệu Cổ Vai Gáy Giảm 20%', 'Dành cho khách hàng đặt lịch hẹn trực tuyến trong tuần này', '', '/booking?service=s1', true, 1),
          ('ban-2', 'Gói Dưỡng Sinh Toàn Thân & Ngâm Chân Thảo Dược', 'Tặng kèm bấm huyệt diện chẩn an thần giải tỏa căng thẳng', '', '/booking?service=s3', true, 2);
      `);
    }

  } finally {
    client.release();
  }
}
