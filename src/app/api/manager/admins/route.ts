import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "MANAGER") {
      return NextResponse.json({ error: "Chỉ Manager mới có quyền quản lý nhân sự vận hành" }, { status: 403 });
    }

    const res = await pool.query(`
      SELECT id, username, name, role, is_approved, phone, telegram_chat_id, created_at 
      FROM users 
      WHERE role IN ('ADMIN', 'OWNER', 'MANAGER')
      ORDER BY role DESC, created_at ASC;
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
      return NextResponse.json({ error: "Chỉ Manager mới có quyền quản lý và cấp tài khoản vận hành" }, { status: 403 });
    }

    const body = await req.json();

    // 1. Tạo và cấp tài khoản nhân sự vận hành mới (Admin / Owner / Manager)
    if (body.action === "create_staff") {
      const { name, username, password, role, phone } = body;
      if (!name || !username || !password) {
        return NextResponse.json({ success: false, error: "Vui lòng điền đủ họ tên, tên đăng nhập và mật khẩu" }, { status: 400 });
      }

      const validRole = ["ADMIN", "OWNER", "MANAGER"].includes(role) ? role : "ADMIN";
      const cleanUsername = username.trim();

      const exist = await pool.query("SELECT id FROM users WHERE username = $1;", [cleanUsername]);
      if (exist.rows.length > 0) {
        return NextResponse.json({ success: false, error: "Tên đăng nhập này đã tồn tại" }, { status: 400 });
      }

      const newId = `u-${Date.now().toString(36)}`;
      await pool.query(
        `INSERT INTO users (id, username, password, name, role, is_approved, phone)
         VALUES ($1, $2, $3, $4, $5, true, $6);`,
        [newId, cleanUsername, password, name.trim(), validRole, phone?.trim() || null]
      );

      return NextResponse.json({
        success: true,
        message: `Đã tạo và cấp tài khoản vận hành (${validRole}) thành công cho ${name}!`,
      });
    }

    // 2. Bật / Tắt trạng thái phê duyệt của nhân sự
    const { id, is_approved } = body;
    await pool.query("UPDATE users SET is_approved = $1 WHERE id = $2;", [is_approved, id]);

    return NextResponse.json({
      success: true,
      message: is_approved ? "Đã phê duyệt tài khoản nhân sự" : "Đã thu hồi phê duyệt tài khoản nhân sự",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
