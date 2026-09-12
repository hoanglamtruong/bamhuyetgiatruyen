import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const res = await pool.query(`
      SELECT key, value FROM system_configs 
      WHERE key IN ('theme_title', 'theme_slogan', 'theme_primary_color', 'theme_accent_color', 'theme_hotline', 'theme_address');
    `);

    const theme: Record<string, string> = {
      theme_title: "Bấm Huyệt Gia Truyền",
      theme_slogan: "Khơi Thông Kinh Lạc · Đẩy Lùi Đau Nhức Cổ Vai Gáy",
      theme_primary_color: "#1B6B7B",
      theme_accent_color: "#E8622A",
      theme_hotline: "0912.345.678",
      theme_address: "Số 18 Phố Trị Liệu Cổ Truyền, Quận Hoàn Kiếm, Hà Nội",
    };

    for (const row of res.rows) {
      theme[row.key] = row.value;
    }

    return NextResponse.json({ theme });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "MANAGER")) {
      return NextResponse.json({ error: "Chỉ Admin hoặc Manager mới có quyền tùy chỉnh theme giao diện" }, { status: 403 });
    }

    const { theme } = await req.json();
    if (!theme) return NextResponse.json({ error: "Thiếu dữ liệu theme" }, { status: 400 });

    for (const [k, v] of Object.entries(theme)) {
      await pool.query(
        "INSERT INTO system_configs (key, value, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP;",
        [k, String(v)]
      );
    }

    return NextResponse.json({ success: true, message: "Đã lưu cấu hình theme giao diện thành công" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
