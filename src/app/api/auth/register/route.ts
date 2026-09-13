import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { loginUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { name, phone, password, email, health_notes } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: "Vui lòng nhập họ và tên" }, { status: 400 });
    }

    if (!phone || !phone.trim()) {
      return NextResponse.json({ success: false, error: "Vui lòng nhập số điện thoại" }, { status: 400 });
    }

    const cleanPhone = phone.trim().replace(/\s+/g, "");
    if (!/^(0|\+84)[3|5|7|8|9][0-9]{8}$/.test(cleanPhone) && cleanPhone.length < 9) {
      return NextResponse.json({ success: false, error: "Số điện thoại không đúng định dạng" }, { status: 400 });
    }

    if (!password || password.length < 6) {
      return NextResponse.json({ success: false, error: "Mật khẩu phải có ít nhất 6 ký tự" }, { status: 400 });
    }

    // 1. Kiểm tra tài khoản trong users
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE username = $1 OR phone = $2;",
      [cleanPhone, cleanPhone]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json({
        success: false,
        error: "Số điện thoại này đã được đăng ký tài khoản. Vui lòng chuyển sang Đăng Nhập."
      }, { status: 400 });
    }

    // 2. Tìm hoặc tạo hồ sơ CRM trong bảng customers
    let customerId: string;
    const existingCustomer = await pool.query(
      "SELECT id, health_notes FROM customers WHERE phone = $1;",
      [cleanPhone]
    );

    if (existingCustomer.rows.length > 0) {
      customerId = existingCustomer.rows[0].id;
      // Cập nhật health_notes và email nếu có thông tin mới
      if (health_notes || email) {
        await pool.query(
          `UPDATE customers 
           SET email = COALESCE($1, email),
               health_notes = CASE WHEN health_notes IS NULL OR health_notes = '' THEN $2 ELSE health_notes END
           WHERE id = $3;`,
          [email?.trim() || null, health_notes?.trim() || null, customerId]
        );
      }
    } else {
      customerId = `c-${Date.now().toString(36)}`;
      await pool.query(
        `INSERT INTO customers (id, name, phone, email, health_notes, total_spent, treatment_count)
         VALUES ($1, $2, $3, $4, $5, 0, 0);`,
        [customerId, name.trim(), cleanPhone, email?.trim() || null, health_notes?.trim() || null]
      );
    }

    // 3. Tạo tài khoản trong bảng users
    const userId = `u-${Date.now().toString(36)}`;
    await pool.query(
      `INSERT INTO users (id, username, password, name, role, is_approved, phone, email, customer_id)
       VALUES ($1, $2, $3, $4, 'CUSTOMER', true, $5, $6, $7);`,
      [userId, cleanPhone, password, name.trim(), cleanPhone, email?.trim() || null, customerId]
    );

    // 4. Thiết lập phiên đăng nhập tự động
    const loginRes = await loginUser(cleanPhone, password);

    return NextResponse.json({
      success: true,
      message: "Đăng ký tài khoản khách hàng thành công!",
      user: loginRes.user,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
