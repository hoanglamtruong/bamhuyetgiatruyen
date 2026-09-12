import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Yêu cầu đăng nhập" }, { status: 401 });
    }

    const res = await pool.query(`
      SELECT * FROM orders 
      ORDER BY completed_at DESC, created_at DESC;
    `);

    // Phân loại doanh thu:
    // - Doanh thu chính thức: status = 'completed'
    // - Doanh thu tạm tính: status = 'accepted'
    let officialRevenue = 0;
    let officialManagerShare = 0;
    let officialOwnerShare = 0;

    let provisionalRevenue = 0;
    let provisionalManagerShare = 0;
    let provisionalOwnerShare = 0;

    for (const ord of res.rows) {
      const amt = parseFloat(ord.amount || 0);
      const mgr = parseFloat(ord.manager_amount || 0);
      const own = parseFloat(ord.owner_amount || 0);

      if (ord.status === "completed") {
        officialRevenue += amt;
        officialManagerShare += mgr;
        officialOwnerShare += own;
      } else if (ord.status === "accepted") {
        provisionalRevenue += amt;
        provisionalManagerShare += mgr;
        provisionalOwnerShare += own;
      }
    }

    const totalRecognizedRevenue = officialRevenue + provisionalRevenue;
    const totalRecognizedManagerShare = officialManagerShare + provisionalManagerShare;
    const totalRecognizedOwnerShare = officialOwnerShare + provisionalOwnerShare;

    return NextResponse.json({
      orders: res.rows,
      summary: {
        // Tách bạch Doanh thu chính thức và Doanh thu tạm tính
        officialRevenue,
        officialManagerShare,
        officialOwnerShare,
        provisionalRevenue,
        provisionalManagerShare,
        provisionalOwnerShare,
        totalRecognizedRevenue,
        totalRecognizedManagerShare,
        totalRecognizedOwnerShare,
        // Tương thích ngược
        totalRevenue: totalRecognizedRevenue,
        totalManagerShare: totalRecognizedManagerShare,
        totalOwnerShare: totalRecognizedOwnerShare,
        orderCount: res.rows.length,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "OWNER" && user.role !== "MANAGER")) {
      return NextResponse.json({ error: "Chưa được phân quyền tạo đơn hàng" }, { status: 403 });
    }

    const { customer_id, customer_name, customer_phone, service_id, service_title, amount, status } = await req.json();

    if (!customer_name || !customer_phone || !service_title || !amount) {
      return NextResponse.json({ error: "Vui lòng điền đầy đủ thông tin đơn hàng" }, { status: 400 });
    }

    const orderAmount = parseFloat(amount);
    const commissionRate = 30; // 30% cho Manager
    const managerAmount = (orderAmount * commissionRate) / 100;
    const ownerAmount = orderAmount - managerAmount;

    const now = new Date();
    const monthPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const orderId = `ord-${Date.now()}`;
    const orderCode = `ORD-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}-${Math.floor(100 + Math.random() * 900)}`;
    const orderStatus = status || "accepted"; // Mặc định là 'accepted' nếu chưa hoàn thành

    await pool.query(
      `INSERT INTO orders (id, order_code, customer_id, customer_name, customer_phone, service_id, service_title, amount, commission_rate, manager_amount, owner_amount, status, month_period, completed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP);`,
      [orderId, orderCode, customer_id || null, customer_name, customer_phone, service_id || null, service_title, orderAmount, commissionRate, managerAmount, ownerAmount, orderStatus, monthPeriod]
    );

    // Nếu đơn hoàn tất ngay, cập nhật luôn CRM
    if (orderStatus === "completed") {
      await pool.query(
        `INSERT INTO customers (id, name, phone, total_spent, treatment_count, last_visit)
         VALUES ($1, $2, $3, $4, 1, CURRENT_TIMESTAMP)
         ON CONFLICT (phone) DO UPDATE SET
           name = $2,
           total_spent = customers.total_spent + $4,
           treatment_count = customers.treatment_count + 1,
           last_visit = CURRENT_TIMESTAMP;`,
        [`c-${Date.now()}`, customer_name, customer_phone, orderAmount]
      );
    }

    return NextResponse.json({
      success: true,
      message: orderStatus === "completed" ? "Đã chốt đơn hàng hoàn tất" : "Đã nhận đơn hàng (ghi nhận doanh thu tạm tính)",
      order: {
        id: orderId,
        orderCode,
        amount: orderAmount,
        managerAmount,
        ownerAmount,
        status: orderStatus,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "OWNER" && user.role !== "MANAGER")) {
      return NextResponse.json({ error: "Không có quyền cập nhật đơn hàng" }, { status: 403 });
    }

    const body = await req.json();
    const id = body.id || body.orderId;
    const { status } = body;
    const ordRes = await pool.query("SELECT * FROM orders WHERE id = $1;", [id]);
    if (ordRes.rows.length === 0) {
      return NextResponse.json({ error: "Không tìm thấy đơn hàng" }, { status: 404 });
    }
    const ord = ordRes.rows[0];

    await pool.query("UPDATE orders SET status = $1, completed_at = CURRENT_TIMESTAMP WHERE id = $2;", [status, id]);

    // Nếu chuyển sang 'completed', cập nhật CRM
    if (status === "completed" && ord.status !== "completed") {
      await pool.query(
        `INSERT INTO customers (id, name, phone, total_spent, treatment_count, last_visit)
         VALUES ($1, $2, $3, $4, 1, CURRENT_TIMESTAMP)
         ON CONFLICT (phone) DO UPDATE SET
           name = $2,
           total_spent = customers.total_spent + $4,
           treatment_count = customers.treatment_count + 1,
           last_visit = CURRENT_TIMESTAMP;`,
        [`c-${Date.now()}`, ord.customer_name, ord.customer_phone, parseFloat(ord.amount)]
      );
    }

    return NextResponse.json({ success: true, message: `Đã chuyển đơn hàng sang trạng thái ${status}` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
