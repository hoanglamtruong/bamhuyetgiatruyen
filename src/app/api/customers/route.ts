import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "OWNER")) {
      return NextResponse.json({ error: "Chỉ Admin hoặc Owner mới có quyền xem CRM khách hàng" }, { status: 403 });
    }

    const res = await pool.query("SELECT * FROM customers ORDER BY last_visit DESC NULLS LAST, created_at DESC;");
    return NextResponse.json({ customers: res.rows });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "OWNER")) {
      return NextResponse.json({ error: "Không có quyền sửa đổi thông tin khách hàng" }, { status: 403 });
    }

    const { id, name, phone, email, health_notes } = await req.json();

    if (id) {
      // Update
      await pool.query(
        "UPDATE customers SET name = $1, phone = $2, email = $3, health_notes = $4 WHERE id = $5;",
        [name, phone, email || null, health_notes || "", id]
      );
      return NextResponse.json({ success: true, message: "Đã cập nhật hồ sơ khách hàng" });
    } else {
      // Create
      const newId = `c-${Date.now()}`;
      await pool.query(
        `INSERT INTO customers (id, name, phone, email, health_notes, total_spent, treatment_count)
         VALUES ($1, $2, $3, $4, $5, 0, 0)
         ON CONFLICT (phone) DO UPDATE SET
           name = $2,
           email = COALESCE($4, customers.email),
           health_notes = $5;`,
        [newId, name, phone, email || null, health_notes || ""]
      );
      return NextResponse.json({ success: true, message: "Đã lưu hồ sơ khách hàng mới", id: newId });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
