import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const res = await pool.query("SELECT * FROM services ORDER BY created_at ASC;");
    return NextResponse.json({ services: res.rows });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "OWNER")) {
      return NextResponse.json({ error: "Không có quyền chỉnh sửa dịch vụ" }, { status: 403 });
    }

    const { id, title, slug, description, benefits, duration_minutes, price, category, is_active } = await req.json();

    if (id) {
      // Update
      await pool.query(
        `UPDATE services SET 
          title = $1, 
          slug = $2, 
          description = $3, 
          benefits = $4, 
          duration_minutes = $5, 
          price = $6, 
          category = $7, 
          is_active = $8 
        WHERE id = $9;`,
        [title, slug, description, benefits, duration_minutes, price, category, is_active ?? true, id]
      );
      return NextResponse.json({ success: true, message: "Đã cập nhật dịch vụ thành công" });
    } else {
      // Create new
      const newId = `srv-${Date.now()}`;
      const serviceSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      await pool.query(
        `INSERT INTO services (id, title, slug, description, benefits, duration_minutes, price, category, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);`,
        [newId, title, serviceSlug, description, benefits, duration_minutes || 60, price, category || "Trị Liệu", is_active ?? true]
      );
      return NextResponse.json({ success: true, message: "Đã thêm dịch vụ mới", id: newId });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
