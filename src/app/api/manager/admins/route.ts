import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "MANAGER") {
      return NextResponse.json({ error: "Chỉ Manager mới có quyền quản lý nhân sự Admin" }, { status: 403 });
    }

    const res = await pool.query(`
      SELECT id, username, name, role, is_approved, telegram_chat_id, created_at 
      FROM users 
      WHERE role = 'ADMIN'
      ORDER BY created_at ASC;
    `);

    return NextResponse.json({ admins: res.rows });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "MANAGER") {
      return NextResponse.json({ error: "Chỉ Manager mới có quyền phê duyệt Admin" }, { status: 403 });
    }

    const { id, is_approved } = await req.json();
    await pool.query("UPDATE users SET is_approved = $1 WHERE id = $2 AND role = 'ADMIN';", [is_approved, id]);

    return NextResponse.json({ success: true, message: is_approved ? "Đã phê duyệt tài khoản Admin" : "Đã thu hồi phê duyệt tài khoản Admin" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
