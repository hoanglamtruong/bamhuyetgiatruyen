async function runTests() {
  const baseUrl = "http://localhost:8123";
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, name: string) {
    if (condition) {
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name}`);
      failed++;
    }
  }

  console.log("=== BẮT ĐẦU KIỂM THỬ TOÀN DIỆN TẦNG 1 (LOCAL / STAGING) ===");

  // 1. Dịch vụ (Feature 2)
  console.log("\n--- TEST 1: Giới thiệu dịch vụ ---");
  const srvRes = await fetch(`${baseUrl}/api/services`);
  const srvData = await srvRes.json();
  assert(srvRes.status === 200, "API /api/services trả HTTP 200");
  assert(srvData.services?.length >= 4, `Có ${srvData.services?.length} dịch vụ được niêm yết`);

  // 2. Đặt lịch hẹn (Feature 1)
  console.log("\n--- TEST 2: Đặt lịch hẹn ---");
  const bkgRes = await fetch(`${baseUrl}/api/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer_name: "Kiểm Thử Viên Tầng 1",
      customer_phone: "0999888777",
      service_id: srvData.services[0].id,
      booking_date: "2026-09-20",
      booking_time: "10:30",
      notes: "Đau mỏi cổ vai gáy cấp",
    }),
  });
  const bkgData = await bkgRes.json();
  assert(bkgRes.status === 200, "Đặt lịch hẹn thành công (HTTP 200)");
  assert(!!bkgData.id, `Tạo mã lịch hẹn: ${bkgData.id}`);

  // 3. Form liên hệ (Feature 3)
  console.log("\n--- TEST 3: Form liên hệ & tư vấn ---");
  const ctcRes = await fetch(`${baseUrl}/api/contacts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Khách Hỏi Tư Vấn",
      phone: "0999111222",
      symptoms: "Thoái hoá khớp gối, đau buốt khi trở trời",
      notes: "Cần bác sĩ gọi trước 12h trưa",
    }),
  });
  const ctcData = await ctcRes.json();
  assert(ctcRes.status === 200, "Gửi form liên hệ thành công (HTTP 200)");

  // 4. Đăng nhập 3 Vai trò
  console.log("\n--- TEST 4: Phân quyền 3 vai trò (Auth RBAC) ---");
  
  // Login Manager
  const mgrLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "manager", password: "manager123" }),
  });
  const mgrCookie = mgrLogin.headers.get("set-cookie") || "";
  assert(mgrLogin.status === 200, "Manager đăng nhập thành công");

  // Manager xem doanh thu tổng hợp (30%)
  const mgrRevRes = await fetch(`${baseUrl}/api/manager/revenue`, {
    headers: { Cookie: mgrCookie },
  });
  const mgrRevData = await mgrRevRes.json();
  assert(mgrRevRes.status === 200, "Manager truy cập được tổng hợp doanh thu toàn hệ thống");
  assert(parseFloat(mgrRevData.overall.grand_manager_share) > 0, `Phần chia Manager 30% ghi nhận: ${mgrRevData.overall.grand_manager_share}`);

  // Manager duyệt nhân sự Admin
  const admListRes = await fetch(`${baseUrl}/api/manager/admins`, {
    headers: { Cookie: mgrCookie },
  });
  const admListData = await admListRes.json();
  assert(admListData.admins?.length >= 2, `Danh sách nhân sự Admin có ${admListData.admins?.length} tài khoản`);

  // Reset admin_new về trạng thái chưa duyệt trước khi test
  const pendingAdmin = admListData.admins.find((a: any) => a.username === "admin_new");
  if (pendingAdmin) {
    await fetch(`${baseUrl}/api/manager/admins`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: mgrCookie },
      body: JSON.stringify({ id: pendingAdmin.id, is_approved: false }),
    });
  }

  // Thử đăng nhập Admin chưa duyệt (admin_new) -> Kỳ vọng FAIL
  const unapprovedLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin_new", password: "admin123" }),
  });
  assert(unapprovedLogin.status === 401, "Tài khoản Admin chưa duyệt bị chặn đúng quy định");
  if (pendingAdmin) {
    const approveRes = await fetch(`${baseUrl}/api/manager/admins`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: mgrCookie },
      body: JSON.stringify({ id: pendingAdmin.id, is_approved: true }),
    });
    assert(approveRes.status === 200, "Manager phê duyệt Admin mới thành công");

    // Sau khi duyệt -> admin_new đăng nhập thành công
    const approvedLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin_new", password: "admin123" }),
    });
    assert(approvedLogin.status === 200, "Admin sau khi được duyệt đăng nhập thành công");
  }

  // Login Owner
  const ownerLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "owner", password: "owner123" }),
  });
  const ownerCookie = ownerLogin.headers.get("set-cookie") || "";
  assert(ownerLogin.status === 200, "Owner đăng nhập thành công");

  // 5. Quản lý Khách Hàng CRM (Feature 4)
  console.log("\n--- TEST 5: Quản lý khách hàng CRM ---");
  const crmRes = await fetch(`${baseUrl}/api/customers`, {
    headers: { Cookie: ownerCookie },
  });
  const crmData = await crmRes.json();
  assert(crmRes.status === 200, "Owner truy cập được danh sách CRM");
  assert(crmData.customers?.length >= 3, `CRM có ${crmData.customers?.length} hồ sơ bệnh nhân`);

  // 6. Quản lý Đơn hàng dịch vụ (Feature 5) & Tỷ lệ 30/70
  console.log("\n--- TEST 6: Quản lý đơn hàng & chia sẻ 30/70 ---");
  const orderCreateRes = await fetch(`${baseUrl}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: ownerCookie },
    body: JSON.stringify({
      customer_name: "Kiểm Thử Viên Tầng 1",
      customer_phone: "0999888777",
      service_id: srvData.services[0].id,
      service_title: srvData.services[0].title,
      amount: 1000000, // 1 triệu
      status: "completed",
    }),
  });
  const orderCreateData = await orderCreateRes.json();
  assert(orderCreateRes.status === 200, "Tạo đơn hàng dịch vụ thành công");
  assert(orderCreateData.order.managerAmount === 300000, "Tỷ lệ Manager 30% chính xác (300.000đ)");
  assert(orderCreateData.order.ownerAmount === 700000, "Tỷ lệ Owner 70% chính xác (700.000đ)");

  // 7. Cơ chế leo thang 3 bước
  console.log("\n--- TEST 7: Cơ chế leo thang 3 bước ---");
  
  // Kiểm tra trạng thái hiện tại
  const escRes = await fetch(`${baseUrl}/api/escalation`);
  const escData = await escRes.json();
  assert(escRes.status === 200, "API leo thang trả HTTP 200");
  assert(escData.paymentBranch.dueDay === 25, "Hạn thanh toán tham số hoá là ngày 25");

  // Giả lập ngày 28 (quá hạn 3 ngày) -> Kích hoạt Bước 2 (Popup)
  const sim28Res = await fetch(`${baseUrl}/api/escalation?date=2026-09-28`);
  const sim28Data = await sim28Res.json();
  assert(sim28Data.step === 2, "Ngày 28 (sau 3 ngày): Kích hoạt Bước 2 (Popup cảnh báo web)");
  assert(!!sim28Data.warningDate, `Bước 2 hiển thị rõ ngày cụ thể sẽ ngưng: ${sim28Data.warningDate}`);

  // Giả lập ngày 02 tháng sau (đủ 7 ngày quá hạn) -> Kích hoạt Bước 3 (Tự động ngưng web)
  const sim03Res = await fetch(`${baseUrl}/api/escalation?date=2026-10-03`);
  const sim03Data = await sim03Res.json();
  assert(sim03Data.step === 3 && sim03Data.isSuspended === true, "Đủ 7 ngày quá hạn: Bước 3 TỰ ĐỘNG ngưng hoạt động");

  // Test Admin thực thi thủ công Bước 3 ở nhánh KPI
  console.log("\n--- TEST 8: Admin thực thi Bước 3 thủ công ở nhánh KPI ---");
  const adminLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin", password: "admin123" }),
  });
  const adminCookie = adminLogin.headers.get("set-cookie") || "";

  // Admin bấm ngưng hoạt động
  const adminSuspendRes = await fetch(`${baseUrl}/api/escalation`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({ action: "admin_kpi_suspend", reason: "Test KPI suspend" }),
  });
  assert(adminSuspendRes.status === 200, "Admin thực thi Bước 3 thủ công thành công");

  // Kiểm tra hệ thống chuyển sang trạng thái ngưng hoạt động
  const afterSuspend = await (await fetch(`${baseUrl}/api/escalation`)).json();
  assert(afterSuspend.isSuspended === true, "Hệ thống đã chuyển sang ngưng hoạt động");

  // Admin bấm khôi phục (Restore / Unblock)
  const restoreRes = await fetch(`${baseUrl}/api/escalation`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({ action: "restore", branch: "KPI" }),
  });
  assert(restoreRes.status === 200, "Khôi phục hoạt động thành công");
  const afterRestore = await (await fetch(`${baseUrl}/api/escalation`)).json();
  assert(afterRestore.isSuspended === false, "Hệ thống đã hoạt động bình thường trở lại");

  console.log("\n==========================================");
  console.log(`KẾT QUẢ: ${passed} PASS, ${failed} FAIL`);
  console.log("==========================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error("Test execution failed:", e);
  process.exit(1);
});
