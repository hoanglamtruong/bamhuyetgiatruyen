import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  evaluateEscalation,
  executeAdminKpiSuspend,
  restoreSystem,
  updateSystemConfig,
  getSystemConfigs,
  sendTelegramNotification,
} from "@/lib/escalation";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");
    const overrideDate = dateParam ? new Date(dateParam) : undefined;

    const status = await evaluateEscalation(overrideDate);
    const configs = await getSystemConfigs();

    return NextResponse.json({
      ...status,
      configs,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();
    const { action, ...payload } = body;

    if (action === "admin_kpi_suspend") {
      if (user?.role !== "ADMIN" && user?.role !== "MANAGER") {
        return NextResponse.json({ error: "Chỉ Admin hoặc Manager mới có quyền thực thi Bước 3" }, { status: 403 });
      }
      await executeAdminKpiSuspend(payload.reason);
      return NextResponse.json({ success: true, message: "Đã ngưng hoạt động hệ thống theo nhánh KPI" });
    }

    if (action === "restore") {
      if (user?.role !== "ADMIN" && user?.role !== "MANAGER") {
        return NextResponse.json({ error: "Không đủ thẩm quyền khôi phục hệ thống" }, { status: 403 });
      }
      await restoreSystem(payload.branch || "MANUAL", payload.reason);
      return NextResponse.json({ success: true, message: "Đã khôi phục hoạt động hệ thống" });
    }

    if (action === "update_configs") {
      if (user?.role !== "ADMIN" && user?.role !== "MANAGER") {
        return NextResponse.json({ error: "Không có quyền sửa cấu hình hệ thống" }, { status: 403 });
      }
      for (const [k, v] of Object.entries(payload.configs || {})) {
        await updateSystemConfig(k, String(v));
      }
      return NextResponse.json({ success: true, message: "Đã cập nhật cấu hình tham số leo thang" });
    }

    if (action === "send_telegram") {
      const msg = payload.message || "Thông báo vi phạm leo thang từ hệ thống Bấm Huyệt Gia Truyền";
      const sent = await sendTelegramNotification(msg);
      return NextResponse.json({ success: sent, message: "Đã gửi thông báo Telegram" });
    }

    return NextResponse.json({ error: "Action không hợp lệ" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
