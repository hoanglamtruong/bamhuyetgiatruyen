import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !["OWNER", "MANAGER", "ADMIN"].includes(user.role)) {
      return NextResponse.json(
        { error: "Chỉ Owner và Manager mới có quyền xem danh sách đánh giá nội bộ" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get("customer_id");
    const serviceId = searchParams.get("service_id");

    let query = `
      SELECT r.id, r.customer_id, r.customer_name, r.customer_phone, r.order_id, 
             r.service_id, r.service_title, r.rating, r.comment, r.health_improvement_notes, 
             r.created_at, o.order_code, o.amount
      FROM reviews r
      LEFT JOIN orders o ON r.order_id = o.id
    `;
    const params: any[] = [];
    const conditions: string[] = [];

    if (customerId) {
      params.push(customerId);
      conditions.push(`r.customer_id = $${params.length}`);
    }
    if (serviceId) {
      params.push(serviceId);
      conditions.push(`r.service_id = $${params.length}`);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY r.created_at DESC;";

    const res = await pool.query(query, params);
    const reviews = res.rows || [];

    // Tính toán thống kê
    const total = reviews.length;
    const sumRating = reviews.reduce((acc: number, r: any) => acc + Number(r.rating || 0), 0);
    const avgRating = total > 0 ? (sumRating / total).toFixed(1) : "5.0";

    const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r: any) => {
      const rate = Number(r.rating);
      if (rate >= 1 && rate <= 5) {
        (ratingCounts as any)[rate] = ((ratingCounts as any)[rate] || 0) + 1;
      }
    });

    return NextResponse.json({
      reviews,
      stats: {
        total,
        avgRating,
        ratingCounts,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
