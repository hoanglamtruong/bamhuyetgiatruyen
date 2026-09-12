import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "MANAGER") {
      return NextResponse.json({ error: "Chỉ Manager mới có quyền truy cập tổng hợp doanh thu toàn hệ thống" }, { status: 403 });
    }

    // Doanh thu tổng hợp theo từng tháng
    const monthlyRes = await pool.query(`
      SELECT 
        month_period,
        COUNT(*) as order_count,
        COALESCE(SUM(amount), 0) as total_revenue,
        COALESCE(SUM(manager_amount), 0) as manager_share,
        COALESCE(SUM(owner_amount), 0) as owner_share
      FROM orders
      WHERE status = 'completed'
      GROUP BY month_period
      ORDER BY month_period DESC;
    `);

    // Tổng quan toàn thời gian
    const overallRes = await pool.query(`
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(amount), 0) as grand_total_revenue,
        COALESCE(SUM(manager_amount), 0) as grand_manager_share,
        COALESCE(SUM(owner_amount), 0) as grand_owner_share
      FROM orders
      WHERE status = 'completed';
    `);

    return NextResponse.json({
      overall: overallRes.rows[0],
      monthly: monthlyRes.rows,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
