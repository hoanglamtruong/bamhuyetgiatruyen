import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const all = searchParams.get("all") === "true";

    const query = all
      ? "SELECT * FROM banners ORDER BY display_order ASC, created_at DESC;"
      : "SELECT * FROM banners WHERE is_active = true ORDER BY display_order ASC, created_at DESC;";

    const res = await pool.query(query);
    return NextResponse.json({ banners: res.rows });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "MANAGER")) {
      return NextResponse.json({ error: "Chỉ Admin hoặc Manager mới có quyền quản lý Banner" }, { status: 403 });
    }

    const { id, title, subtitle, image_url, link_url, is_active, display_order } = await req.json();

    if (id) {
      // Update
      await pool.query(
        `UPDATE banners SET 
          title = $1, 
          subtitle = $2, 
          image_url = $3, 
          link_url = $4, 
          is_active = $5, 
          display_order = $6 
        WHERE id = $7;`,
        [title, subtitle, image_url || "", link_url || "", is_active ?? true, display_order || 1, id]
      );
      return NextResponse.json({ success: true, message: "Đã cập nhật banner thành công" });
    } else {
      // Create
      const newId = `ban-${Date.now()}`;
      await pool.query(
        `INSERT INTO banners (id, title, subtitle, image_url, link_url, is_active, display_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7);`,
        [newId, title, subtitle || "", image_url || "", link_url || "", is_active ?? true, display_order || 1]
      );
      return NextResponse.json({ success: true, message: "Đã thêm banner mới", id: newId });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "MANAGER")) {
      return NextResponse.json({ error: "Chỉ Admin hoặc Manager mới có quyền xoá Banner" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Thiếu ID banner" }, { status: 400 });

    await pool.query("DELETE FROM banners WHERE id = $1;", [id]);
    return NextResponse.json({ success: true, message: "Đã xoá banner thành công" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
