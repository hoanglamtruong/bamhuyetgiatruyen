import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
  try {
    const { rows } = await pool.query("SELECT COUNT(*) FROM users;");
    const userCount = parseInt(rows[0]?.count || "0", 10);
    const isDemo = process.env.APP_ENV === "demo" || process.env.SEED_DEMO_DATA === "true";

    return NextResponse.json({
      hasUsers: userCount > 0,
      userCount,
      isDemo,
      env: process.env.APP_ENV || "production"
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { rows } = await pool.query("SELECT COUNT(*) FROM users;");
    const userCount = parseInt(rows[0]?.count || "0", 10);
    
    if (userCount > 0) {
      return NextResponse.json({
        success: false,
        error: "Hệ thống đã có tài khoản quản trị. Không thể khởi tạo thêm tài khoản ban đầu."
      }, { status: 403 });
    }

    const { username, password, name, role } = await req.json();
    if (!username || !password || !name) {
      return NextResponse.json({
        success: false,
        error: "Vui lòng nhập đầy đủ tên, tên đăng nhập và mật khẩu."
      }, { status: 400 });
    }

    const validRole = ["MANAGER", "ADMIN", "OWNER"].includes(role) ? role : "OWNER";
    const id = `u-${Date.now().toString(36)}`;

    await pool.query(
      `INSERT INTO users (id, username, password, name, role, is_approved)
       VALUES ($1, $2, $3, $4, $5, true);`,
      [id, username.trim(), password, name.trim(), validRole]
    );

    return NextResponse.json({
      success: true,
      message: `Khởi tạo tài khoản Quản trị (${validRole}) thành công! Vui lòng đăng nhập.`
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
