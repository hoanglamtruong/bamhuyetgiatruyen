import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Vui lòng đăng nhập để gửi đánh giá" }, { status: 401 });
    }

    const { order_id, service_id, rating, comment, health_improvement_notes } = await req.json();

    const starRating = parseInt(rating, 10);
    if (isNaN(starRating) || starRating < 1 || starRating > 5) {
      return NextResponse.json({ success: false, error: "Số sao đánh giá phải từ 1 đến 5 sao" }, { status: 400 });
    }

    const phone = user.phone || user.username;
    let customerId = user.customerId;

    // Tìm customerId nếu chưa có
    if (!customerId) {
      const cRes = await pool.query("SELECT id FROM customers WHERE phone = $1 LIMIT 1;", [phone]);
      if (cRes.rows.length > 0) {
        customerId = cRes.rows[0].id;
      } else {
        customerId = `c-${Date.now().toString(36)}`;
        await pool.query("INSERT INTO customers (id, name, phone) VALUES ($1, $2, $3);", [customerId, user.name, phone]);
      }
    }

    // Lấy tên dịch vụ
    let serviceTitle = "";
    if (service_id) {
      const sRes = await pool.query("SELECT title FROM services WHERE id = $1;", [service_id]);
      if (sRes.rows.length > 0) {
        serviceTitle = sRes.rows[0].title;
      }
    } else if (order_id) {
      const oRes = await pool.query("SELECT service_title, service_id FROM orders WHERE id = $1;", [order_id]);
      if (oRes.rows.length > 0) {
        serviceTitle = oRes.rows[0].service_title;
      }
    }

    // Kiểm tra xem đã từng review đơn này chưa (nếu có order_id)
    if (order_id) {
      const existing = await pool.query("SELECT id FROM reviews WHERE order_id = $1;", [order_id]);
      if (existing.rows.length > 0) {
        await pool.query(
          `UPDATE reviews 
           SET rating = $1, comment = $2, health_improvement_notes = $3, updated_at = CURRENT_TIMESTAMP
           WHERE id = $4;`,
          [starRating, comment?.trim() || null, health_improvement_notes?.trim() || null, existing.rows[0].id]
        );
        return NextResponse.json({
          success: true,
          message: "Cập nhật đánh giá dịch vụ thành công!",
          reviewId: existing.rows[0].id,
        });
      }
    }

    const revId = `rev-${Date.now().toString(36)}`;
    await pool.query(
      `INSERT INTO reviews (id, customer_id, customer_name, customer_phone, order_id, service_id, service_title, rating, comment, health_improvement_notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);`,
      [
        revId,
        customerId,
        user.name,
        phone,
        order_id || null,
        service_id || null,
        serviceTitle || "Trị Liệu Bấm Huyệt Gia Truyền",
        starRating,
        comment?.trim() || null,
        health_improvement_notes?.trim() || null,
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Gửi đánh giá dịch vụ thành công! Cảm ơn phản hồi quý báu của bạn.",
      reviewId: revId,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
