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

    // Tính tổng doanh thu và chia sẻ
    let totalRevenue = 0;
    let totalManagerShare = 0;
    let totalOwnerShare = 0;

    for (const ord of res.rows) {
      if (ord.status === "completed") {
        totalRevenue += parseFloat(ord.amount);
        totalManagerShare += parseFloat(ord.manager_amount);
        totalOwnerShare += parseFloat(ord.owner_amount);
      }
    }

    return NextResponse.json({
      orders: res.rows,
      summary: {
        totalRevenue,
        totalManagerShare,
        totalOwnerShare,
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
    if (!user || (user.role !== "ADMIN" && user.role !== "OWNER")) {
      return NextResponse.json({ error: "Chỉ Admin hoặc Owner mới có thể tạo/chốt đơn hàng" }, { status: 403 });
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

    await pool.query(
      `INSERT INTO orders (id, order_code, customer_id, customer_name, customer_phone, service_id, service_title, amount, commission_rate, manager_amount, owner_amount, status, month_period, completed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP);`,
      [orderId, orderCode, customer_id || null, customer_name, customer_phone, service_id || null, service_title, orderAmount, commissionRate, managerAmount, ownerAmount, status || "completed", monthPeriod]
    );

    // Cập nhật CRM khách hàng
    if (status === "completed") {
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
      message: "Đã tạo đơn hàng dịch vụ thành công",
      order: {
        id: orderId,
        orderCode,
        amount: orderAmount,
        managerAmount,
        ownerAmount,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
