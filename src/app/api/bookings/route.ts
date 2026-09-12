import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "OWNER")) {
      return NextResponse.json({ error: "Chỉ Admin hoặc Owner mới có quyền xem danh sách lịch hẹn" }, { status: 403 });
    }

    const res = await pool.query(`
      SELECT b.*, s.title as service_title, s.price as service_price 
      FROM bookings b
      LEFT JOIN services s ON b.service_id = s.id
      ORDER BY b.booking_date DESC, b.booking_time DESC;
    `);
    return NextResponse.json({ bookings: res.rows });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { customer_name, customer_phone, service_id, booking_date, booking_time, notes } = await req.json();

    if (!customer_name || !customer_phone || !booking_date || !booking_time) {
      return NextResponse.json({ error: "Vui lòng điền đầy đủ họ tên, số điện thoại, ngày và giờ hẹn" }, { status: 400 });
    }

    const id = `bk-${Date.now()}`;
    await pool.query(
      `INSERT INTO bookings (id, customer_name, customer_phone, service_id, booking_date, booking_time, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7);`,
      [id, customer_name, customer_phone, service_id || null, booking_date, booking_time, notes || ""]
    );

    // Tự động tạo hoặc cập nhật hồ sơ khách hàng trong CRM nếu chưa có
    await pool.query(`
      INSERT INTO customers (id, name, phone, health_notes, total_spent, treatment_count)
      VALUES ($1, $2, $3, $4, 0, 0)
      ON CONFLICT (phone) DO NOTHING;
    `, [`c-${Date.now()}`, customer_name, customer_phone, `Đặt lịch ngày ${booking_date}: ${notes || 'Không có ghi chú'}`]);

    return NextResponse.json({ success: true, message: "Đặt lịch hẹn thành công!", id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "OWNER")) {
      return NextResponse.json({ error: "Không có quyền cập nhật lịch hẹn" }, { status: 403 });
    }

    const { id, status } = await req.json();
    await pool.query("UPDATE bookings SET status = $1 WHERE id = $2;", [status, id]);
    return NextResponse.json({ success: true, message: "Đã cập nhật trạng thái lịch hẹn" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
