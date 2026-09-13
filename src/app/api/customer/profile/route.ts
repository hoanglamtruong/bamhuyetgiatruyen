import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Vui lòng đăng nhập để xem hồ sơ" }, { status: 401 });
    }

    const phone = user.phone || user.username;
    let customerId = user.customerId;

    // 1. Lấy thông tin khách hàng từ CRM
    let customerRes = await pool.query(
      "SELECT id, name, phone, email, health_notes, total_spent, treatment_count, last_visit, created_at FROM customers WHERE id = $1 OR phone = $2 LIMIT 1;",
      [customerId || "", phone]
    );

    let customer = customerRes.rows[0];

    // Nếu chưa có trong CRM nhưng đã có tài khoản (trường hợp user tạo thủ công), tự động tạo bản ghi CRM
    if (!customer) {
      const newCid = `c-${Date.now().toString(36)}`;
      await pool.query(
        "INSERT INTO customers (id, name, phone, email, health_notes) VALUES ($1, $2, $3, $4, $5);",
        [newCid, user.name, phone, user.email || null, null]
      );
      await pool.query("UPDATE users SET customer_id = $1, phone = $2 WHERE id = $3;", [newCid, phone, user.id]);
      customerId = newCid;
      customerRes = await pool.query("SELECT * FROM customers WHERE id = $1;", [newCid]);
      customer = customerRes.rows[0];
    } else {
      customerId = customer.id;
    }

    // 2. Lấy lịch sử đơn hàng dịch vụ
    const ordersRes = await pool.query(
      `SELECT id, order_code, service_id, service_title, amount, original_amount, discount_amount, status, month_period, completed_at, created_at 
       FROM orders 
       WHERE customer_id = $1 OR customer_phone = $2 
       ORDER BY created_at DESC;`,
      [customerId, phone]
    );

    // 3. Lấy lịch sử đặt lịch hẹn
    const bookingsRes = await pool.query(
      `SELECT b.id, b.service_id, s.title as service_title, b.booking_date, b.booking_time, b.status, b.notes, b.discount_amount, b.final_amount, b.created_at
       FROM bookings b
       LEFT JOIN services s ON b.service_id = s.id
       WHERE b.customer_phone = $1
       ORDER BY b.booking_date DESC, b.booking_time DESC;`,
      [phone]
    );

    // 4. Lấy danh sách đánh giá của khách hàng này (Bảo mật - chỉ khách hàng xem được của mình)
    const reviewsRes = await pool.query(
      `SELECT id, order_id, service_id, service_title, rating, comment, health_improvement_notes, created_at
       FROM reviews
       WHERE customer_id = $1 OR customer_phone = $2
       ORDER BY created_at DESC;`,
      [customerId, phone]
    );

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
        phone: phone,
        email: user.email || customer?.email || "",
      },
      customer: customer || {},
      orders: ordersRes.rows || [],
      bookings: bookingsRes.rows || [],
      reviews: reviewsRes.rows || [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Vui lòng đăng nhập" }, { status: 401 });
    }

    const { name, email, health_notes } = await req.json();
    const phone = user.phone || user.username;

    if (name && name.trim()) {
      await pool.query("UPDATE users SET name = $1, email = $2 WHERE id = $3;", [
        name.trim(),
        email?.trim() || null,
        user.id,
      ]);
    }

    // Cập nhật CRM
    await pool.query(
      `UPDATE customers 
       SET name = COALESCE($1, name),
           email = $2,
           health_notes = $3
       WHERE phone = $4 OR id = $5;`,
      [name?.trim() || null, email?.trim() || null, health_notes?.trim() || null, phone, user.customerId || ""]
    );

    return NextResponse.json({ success: true, message: "Cập nhật thông tin hồ sơ thành công!" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
