import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "MANAGER") {
      return NextResponse.json({ error: "Chỉ Manager mới có quyền truy cập tổng hợp doanh thu toàn hệ thống" }, { status: 403 });
    }

    // Doanh thu tổng hợp theo từng tháng (bao gồm chính thức completed và tạm tính accepted)
    const monthlyRes = await pool.query(`
      SELECT 
        month_period,
        COUNT(*) as order_count,
        COALESCE(SUM(amount), 0) as total_revenue,
        COALESCE(SUM(manager_amount), 0) as manager_share,
        COALESCE(SUM(owner_amount), 0) as owner_share,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) as official_revenue,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN manager_amount ELSE 0 END), 0) as official_manager_share,
        COALESCE(SUM(CASE WHEN status = 'accepted' THEN amount ELSE 0 END), 0) as provisional_revenue,
        COALESCE(SUM(CASE WHEN status = 'accepted' THEN manager_amount ELSE 0 END), 0) as provisional_manager_share
      FROM orders
      WHERE status IN ('completed', 'accepted')
      GROUP BY month_period
      ORDER BY month_period DESC;
    `);

    // Tổng quan toàn thời gian
    const overallRes = await pool.query(`
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(amount), 0) as grand_total_revenue,
        COALESCE(SUM(manager_amount), 0) as grand_manager_share,
        COALESCE(SUM(owner_amount), 0) as grand_owner_share,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) as grand_official_revenue,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN manager_amount ELSE 0 END), 0) as grand_official_manager_share,
        COALESCE(SUM(CASE WHEN status = 'accepted' THEN amount ELSE 0 END), 0) as grand_provisional_revenue,
        COALESCE(SUM(CASE WHEN status = 'accepted' THEN manager_amount ELSE 0 END), 0) as grand_provisional_manager_share
      FROM orders
      WHERE status IN ('completed', 'accepted');
    `);

    return NextResponse.json({
      overall: overallRes.rows[0],
      monthly: monthlyRes.rows,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
