import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "OWNER")) {
      return NextResponse.json({ error: "Chỉ Admin hoặc Owner mới có quyền xem thông tin liên hệ" }, { status: 403 });
    }
    const res = await pool.query("SELECT * FROM contacts ORDER BY created_at DESC;");
    return NextResponse.json({ contacts: res.rows });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, phone, symptoms, notes } = await req.json();
    if (!name || !phone) {
      return NextResponse.json({ error: "Vui lòng nhập họ tên và số điện thoại" }, { status: 400 });
    }

    const id = `ct-${Date.now()}`;
    await pool.query(
      `INSERT INTO contacts (id, name, phone, symptoms, status, notes)
       VALUES ($1, $2, $3, $4, 'new', $5);`,
      [id, name, phone, symptoms || "", notes || ""]
    );

    // Tự động ghi nhận lead vào CRM
    await pool.query(`
      INSERT INTO customers (id, name, phone, health_notes, total_spent, treatment_count)
      VALUES ($1, $2, $3, $4, 0, 0)
      ON CONFLICT (phone) DO UPDATE SET
        health_notes = CASE 
          WHEN customers.health_notes IS NULL OR customers.health_notes = '' THEN $4
          ELSE customers.health_notes || ' | ' || $4
        END;
    `, [`c-${Date.now()}`, name, phone, `Triệu chứng liên hệ: ${symptoms || 'Tư vấn chung'}`]);

    return NextResponse.json({ success: true, message: "Gửi thông tin tư vấn thành công. Bác sĩ Đông y sẽ liên hệ lại sớm nhất!", id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
