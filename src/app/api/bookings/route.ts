import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");

    // Nếu query theo ngày (dành cho kiểm tra trùng lịch phía client và owner)
    if (dateParam) {
      const bookedRes = await pool.query(
        "SELECT booking_time, status, customer_name FROM bookings WHERE booking_date = $1 AND status != 'cancelled';",
        [dateParam]
      );
      return NextResponse.json({
        bookedSlots: bookedRes.rows.map((r) => r.booking_time),
        details: bookedRes.rows,
      });
    }

    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "OWNER" && user.role !== "MANAGER")) {
      return NextResponse.json({ error: "Chưa được cấp quyền xem danh sách lịch hẹn" }, { status: 403 });
    }

    const res = await pool.query(`
      SELECT b.*, s.title as service_title, s.price as service_price 
      FROM bookings b
      LEFT JOIN services s ON b.service_id = s.id
      ORDER BY b.booking_date DESC, b.booking_time DESC;
    `);
    return NextResponse.json({ bookings: res.rows });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { customer_name, customer_phone, service_id, booking_date, booking_time, notes } = await req.json();

    if (!customer_name || !customer_phone || !booking_date || !booking_time) {
      return NextResponse.json({ error: "Vui lòng điền đầy đủ họ tên, số điện thoại, ngày và giờ hẹn" }, { status: 400 });
    }

    // Kiểm tra trùng lịch: Nếu khung giờ ngày này đã có khách đặt trước (chưa bị hủy)
    const conflictCheck = await pool.query(
      "SELECT id, customer_name FROM bookings WHERE booking_date = $1 AND booking_time = $2 AND status != 'cancelled';",
      [booking_date, booking_time]
    );

    if (conflictCheck.rows.length > 0) {
      return NextResponse.json(
        { error: `Khung giờ ${booking_time} ngày ${booking_date} đã có khách đặt trước. Vui lòng chọn khung giờ khác để tránh trùng lịch!` },
        { status: 400 }
      );
    }

    const id = `bk-${Date.now()}`;
    await pool.query(
      `INSERT INTO bookings (id, customer_name, customer_phone, service_id, booking_date, booking_time, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7);`,
      [id, customer_name, customer_phone, service_id || null, booking_date, booking_time, notes || ""]
    );

    // Tự động tạo hoặc cập nhật hồ sơ khách hàng trong CRM nếu chưa có
    await pool.query(`
      INSERT INTO customers (id, name, phone, health_notes, total_spent, treatment_count)
      VALUES ($1, $2, $3, $4, 0, 0)
      ON CONFLICT (phone) DO NOTHING;
    `, [`c-${Date.now()}`, customer_name, customer_phone, `Đặt lịch ngày ${booking_date}: ${notes || 'Không có ghi chú'}`]);

    return NextResponse.json({ success: true, message: "Đặt lịch hẹn thành công!", id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "OWNER" && user.role !== "MANAGER")) {
      return NextResponse.json({ error: "Không có quyền cập nhật lịch hẹn" }, { status: 403 });
    }

    const body = await req.json();
    const { id, action, status, discount_amount = 0, discount_reason = "", final_amount } = body;

    // Lấy thông tin lịch hẹn hiện tại
    const bkgRes = await pool.query(
      `SELECT b.*, s.title as service_title, s.price as service_price 
       FROM bookings b 
       LEFT JOIN services s ON b.service_id = s.id 
       WHERE b.id = $1;`,
      [id]
    );

    if (bkgRes.rows.length === 0) {
      return NextResponse.json({ error: "Không tìm thấy lịch hẹn" }, { status: 404 });
    }

    const b = bkgRes.rows[0];

    // Quy trình xác nhận của Owner: bổ sung khuyến mãi, chốt giá cuối, tạo tin nhắn và ghi nhận Doanh thu tạm (status: 'accepted')
    if (action === "accept" || status === "accepted" || discount_amount !== undefined) {
      const origPrice = parseFloat(b.service_price || 350000);
      const discount = parseFloat(discount_amount || 0);
      const computedFinal = final_amount ? parseFloat(final_amount) : Math.max(0, origPrice - discount);

      // Tạo nội dung tin nhắn xác nhận chuẩn để Owner copy 1-click
      const confirmMessage = `[BẤM HUYỆT GIA TRUYỀN - XÁC NHẬN LỊCH HẸN]
Kính gửi Quý khách ${b.customer_name},
Lịch hẹn trị liệu của Quý khách đã được xác nhận:
• Dịch vụ: ${b.service_title || 'Bấm Huyệt Trị Liệu Gia Truyền'}
• Thời gian: ${b.booking_time} ngày ${new Date(b.booking_date).toLocaleDateString('vi-VN')}
• Giá niêm yết: ${origPrice.toLocaleString('vi-VN')} đ
${discount > 0 ? `• Ưu đãi giảm: -${discount.toLocaleString('vi-VN')} đ (${discount_reason || 'Chương trình tri ân'})\n` : ''}• Tổng thanh toán: ${computedFinal.toLocaleString('vi-VN')} đ
• Địa chỉ: Số 18 Phố Trị Liệu Cổ Truyền, Quận Hoàn Kiếm, Hà Nội
• Hotline hỗ trợ: 0912.345.678
Rất hân hạnh được phục vụ Quý khách!`;

      // Cập nhật trạng thái booking thành 'accepted'
      await pool.query(
        `UPDATE bookings SET 
          status = 'accepted', 
          discount_amount = $1, 
          discount_reason = $2, 
          final_amount = $3, 
          confirmation_message = $4 
        WHERE id = $5;`,
        [discount, discount_reason, computedFinal, confirmMessage, id]
      );

      // Đồng thời tạo đơn hàng dịch vụ ở trạng thái 'accepted' (Ghi nhận Doanh thu tạm tính)
      const commissionRate = 30;
      const managerAmount = (computedFinal * commissionRate) / 100;
      const ownerAmount = computedFinal - managerAmount;
      const now = new Date();
      const monthPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      let finalOrderId = `ord-${Date.now()}`;
      const orderCode = `ORD-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}-${Math.floor(100 + Math.random() * 900)}`;

      // Kiểm tra xem đơn hàng cho booking này đã tạo chưa
      const existOrder = await pool.query("SELECT id FROM orders WHERE booking_id = $1;", [id]);
      if (existOrder.rows.length === 0) {
        await pool.query(
          `INSERT INTO orders (id, order_code, customer_name, customer_phone, service_id, service_title, amount, commission_rate, manager_amount, owner_amount, status, month_period, booking_id, discount_amount, original_amount, completed_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'accepted', $11, $12, $13, $14, CURRENT_TIMESTAMP);`,
          [finalOrderId, orderCode, b.customer_name, b.customer_phone, b.service_id, b.service_title || 'Bấm Huyệt Trị Liệu', computedFinal, commissionRate, managerAmount, ownerAmount, monthPeriod, id, discount, origPrice]
        );
      } else {
        finalOrderId = existOrder.rows[0].id;
        await pool.query(
          `UPDATE orders SET amount = $1, manager_amount = $2, owner_amount = $3, status = 'accepted', discount_amount = $4, original_amount = $5 WHERE booking_id = $6;`,
          [computedFinal, managerAmount, ownerAmount, discount, origPrice, id]
        );
      }

      return NextResponse.json({
        success: true,
        message: "Đã duyệt lịch hẹn thành công và ghi nhận Doanh thu tạm tính!",
        orderId: finalOrderId,
        booking: {
          id,
          status: "accepted",
          final_amount: computedFinal,
          confirmation_message: confirmMessage,
        },
      });
    }

    // Cập nhật trạng thái thông thường
    await pool.query("UPDATE bookings SET status = $1 WHERE id = $2;", [status, id]);
    return NextResponse.json({ success: true, message: "Đã cập nhật trạng thái lịch hẹn" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
