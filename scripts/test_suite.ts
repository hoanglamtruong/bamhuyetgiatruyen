async function runTests() {
  const baseUrl = process.env.TEST_URL || "http://localhost:8124";
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

  // 2. Đặt lịch hẹn & Chống trùng lịch (Feature 1 + Conflict Check)
  console.log("\n--- TEST 2: Đặt lịch hẹn & Chống trùng lịch ---");
  const randomDay = 1 + Math.floor(Math.random() * 28);
  const randomMonth = 11 + Math.floor(Math.random() * 2);
  const testDate = `2026-${randomMonth}-${String(randomDay).padStart(2, "0")}`;
  const randomHour = 8 + Math.floor(Math.random() * 12);
  const randomMin = Math.floor(Math.random() * 60);
  const testTime = `${String(randomHour).padStart(2, "0")}:${String(randomMin).padStart(2, "0")}`;

  // Lần 1: Đặt lịch bình thường
  const bkgRes = await fetch(`${baseUrl}/api/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer_name: "Nguyễn Văn An",
      customer_phone: `0988${Math.floor(100000 + Math.random() * 900000)}`,
      service_id: srvData.services[0].id,
      booking_date: testDate,
      booking_time: testTime,
      notes: "Đau vai gáy nặng",
    }),
  });
  const bkgData = await bkgRes.json();
  assert(bkgRes.status === 200, "Đặt lịch hẹn lần đầu thành công (HTTP 200)");
  assert(!!bkgData.id, `Tạo mã lịch hẹn: ${bkgData.id}`);

  // Lần 2: Thử đặt TRÙNG ngày + giờ -> Kỳ vọng bị từ chối 400
  const conflictRes = await fetch(`${baseUrl}/api/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer_name: "Trần Thị Trùng Lịch",
      customer_phone: "0977333444",
      service_id: srvData.services[0].id,
      booking_date: testDate,
      booking_time: testTime,
      notes: "Cố đặt trùng khung giờ đã có khách",
    }),
  });
  assert(conflictRes.status === 400, "Hệ thống phát hiện và ngăn chặn trùng lịch thành công (HTTP 400)");

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
  assert(parseFloat(mgrRevData.overall.grand_manager_share) >= 0, `Phần chia Manager 30% ghi nhận`);

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

  // 6. Quy trình Duyệt Lịch, Khuyến Mãi, Tin Nhắn 1-Click & Doanh Thu Tạm Tính (accepted)
  console.log("\n--- TEST 6: Quy trình duyệt lịch, khuyến mãi & Doanh thu tạm tính ---");
  const originalPrice = Number(srvData.services[0].price);
  const discountVal = 50000;
  const expectedFinal = originalPrice - discountVal;

  const confirmRes = await fetch(`${baseUrl}/api/bookings`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: ownerCookie },
    body: JSON.stringify({
      id: bkgData.id,
      discount_amount: discountVal,
      discount_reason: "Khuyến mãi khai trương tháng 9",
    }),
  });
  const confirmData = await confirmRes.json();
  assert(confirmRes.status === 200, "Owner đối chiếu lịch & bổ sung khuyến mãi thành công (HTTP 200)");
  assert(confirmData.booking?.status === "accepted", "Lịch hẹn chuyển sang trạng thái accepted (Đã nhận)");
  assert(Number(confirmData.booking?.final_amount) === expectedFinal, `Giá cuối cùng sau khuyến mãi chính xác: ${expectedFinal}đ`);
  assert(!!confirmData.booking?.confirmation_message, "Hệ thống xuất nội dung tin nhắn xác nhận kèm nút Copy 1-Click");
  assert(!!confirmData.orderId, `Tự động tạo đơn hàng dịch vụ tạm tính: ${confirmData.orderId}`);

  // Kiểm tra đơn hàng có trạng thái accepted (Doanh thu tạm tính)
  const ordersCheckRes = await fetch(`${baseUrl}/api/orders`, {
    headers: { Cookie: ownerCookie },
  });
  const ordersCheckData = await ordersCheckRes.json();
  const provRev = ordersCheckData.summary?.provisionalRevenue ?? 0;
  const provMgr = ordersCheckData.summary?.provisionalManagerShare ?? 0;
  const provOwn = ordersCheckData.summary?.provisionalOwnerShare ?? 0;

  assert(provRev >= expectedFinal, `Ghi nhận Doanh thu tạm tính: ${provRev}đ`);
  assert(provMgr === provRev * 0.3, "Tỷ lệ Manager 30% trên doanh thu tạm tính chính xác");
  assert(provOwn === provRev * 0.7, "Tỷ lệ Owner 70% trên doanh thu tạm tính chính xác");

  // Chuyển đơn hàng từ accepted -> completed (Chính thức ghi nhận doanh thu)
  const completeOrderRes = await fetch(`${baseUrl}/api/orders`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: ownerCookie },
    body: JSON.stringify({
      orderId: confirmData.orderId,
      status: "completed",
    }),
  });
  assert(completeOrderRes.status === 200, "Chuyển đơn hàng sang completed (Chính thức hoàn thành)");

  // 7. Kiểm tra Theme và Banner APIs
  console.log("\n--- TEST 7: Theme & Banner Management ---");
  const thmGetRes = await fetch(`${baseUrl}/api/theme`);
  const thmGetData = await thmGetRes.json();
  assert(thmGetRes.status === 200, "API /api/theme trả HTTP 200");
  assert(!!thmGetData.theme?.theme_primary_color, `Theme primary color: ${thmGetData.theme?.theme_primary_color}`);

  const banGetRes = await fetch(`${baseUrl}/api/banners`);
  const banGetData = await banGetRes.json();
  assert(banGetRes.status === 200, "API /api/banners trả HTTP 200");
  assert(banGetData.banners?.length >= 1, `Có ${banGetData.banners?.length} banner đang hiển thị`);

  // Admin tuỳ biến Logo và Ảnh Nền Hero
  const adminLoginForTheme = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin", password: "admin123" }),
  });
  const adminThemeCookie = adminLoginForTheme.headers.get("set-cookie") || "";

  const updateThemeRes = await fetch(`${baseUrl}/api/theme`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminThemeCookie },
    body: JSON.stringify({
      theme: {
        ...thmGetData.theme,
        theme_logo_url: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=200&q=80",
        theme_bg_image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1600&q=80",
      },
    }),
  });
  assert(updateThemeRes.status === 200, "Admin lưu cấu hình Logo và Ảnh Nền Hero thành công (HTTP 200)");

  const thmVerifyRes = await fetch(`${baseUrl}/api/theme`);
  const thmVerifyData = await thmVerifyRes.json();
  assert(
    thmVerifyData.theme?.theme_logo_url?.includes("unsplash"),
    "Cấu hình Logo được lưu và trả về chính xác qua API"
  );
  assert(
    thmVerifyData.theme?.theme_bg_image?.includes("unsplash"),
    "Cấu hình Ảnh Nền Hero được lưu và trả về chính xác qua API"
  );

  // 8. Cơ chế leo thang 3 bước
  console.log("\n--- TEST 8: Cơ chế leo thang 3 bước ---");
  
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
  console.log("\n--- TEST 9: Admin thực thi Bước 3 thủ công ở nhánh KPI ---");
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
  // Test 10: Khách hàng Đăng ký / Đăng nhập, Hồ sơ cá nhân & Đánh giá Review nội bộ
  console.log("\n--- TEST 10: Khách Hàng Đăng Ký / Đăng Nhập, Hồ Sơ & Đánh Giá Dịch Vụ ---");
  const testPhone = `093${Math.floor(1000000 + Math.random() * 9000000)}`;
  const regRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Lê Hoàng Yến",
      phone: testPhone,
      password: "password123",
      email: "hoangyen@gmail.com",
      health_notes: "Đau mỏi vai gáy do làm việc văn phòng, tê bì cổ tay",
    }),
  });
  const regData = await regRes.json();
  assert(regRes.status === 200 && regData.success === true, "Khách hàng đăng ký tài khoản mới thành công");
  assert(regData.user?.role === "CUSTOMER", "Phân quyền tài khoản chính xác: CUSTOMER");

  // Đăng nhập bằng số điện thoại
  const custLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: testPhone, password: "password123" }),
  });
  const custCookie = custLogin.headers.get("set-cookie") || "";
  assert(custLogin.status === 200, "Khách hàng đăng nhập bằng Số Điện Thoại thành công");

  // Xem hồ sơ cá nhân
  const profRes = await fetch(`${baseUrl}/api/customer/profile`, {
    headers: { Cookie: custCookie },
  });
  const profData = await profRes.json();
  assert(profRes.status === 200 && profData.customer.phone === testPhone, "Khách hàng truy cập Hồ Sơ Cá Nhân thành công");

  // Cập nhật thông tin sức khỏe
  const updateProfRes = await fetch(`${baseUrl}/api/customer/profile`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Cookie: custCookie },
    body: JSON.stringify({
      name: "Lê Hoàng Yến",
      email: "hoangyen.new@gmail.com",
      health_notes: "Thoái hóa đốt sống cổ nhẹ, cơ bắp căng cứng",
    }),
  });
  assert(updateProfRes.status === 200, "Khách hàng cập nhật hồ sơ cá nhân & sức khỏe thành công");

  // Gửi đánh giá dịch vụ
  const reviewRes = await fetch(`${baseUrl}/api/customer/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: custCookie },
    body: JSON.stringify({
      service_id: "s1",
      rating: 5,
      health_improvement_notes: "Bấm huyệt xong nhẹ hẳn vai gáy, tối ngủ sâu giấc",
      comment: "Kỹ thuật viên bấm rất chuẩn huyệt vị, không gian yên tĩnh thư thái.",
    }),
  });
  const reviewData = await reviewRes.json();
  assert(reviewRes.status === 200 && reviewData.success === true, "Khách hàng gửi đánh giá & phản hồi sức khỏe thành công");

  // Kiểm tra đánh giá hiển thị trong hồ sơ của khách hàng
  const afterReviewProf = await (await fetch(`${baseUrl}/api/customer/profile`, { headers: { Cookie: custCookie } })).json();
  assert(afterReviewProf.reviews?.length >= 1, "Đánh giá xuất hiện trong Hồ Sơ Cá Nhân của khách hàng");

  // Kiểm tra bảo mật: Khách hàng thông thường KHÔNG được gọi /api/reviews
  const forbidRes = await fetch(`${baseUrl}/api/reviews`, {
    headers: { Cookie: custCookie },
  });
  assert(forbidRes.status === 403, "Bảo mật: Khách hàng không thể xem danh sách review toàn hệ thống (HTTP 403)");

  // Owner và Manager CÓ THỂ xem đánh giá qua /api/reviews
  const ownerReviewsRes = await fetch(`${baseUrl}/api/reviews`, {
    headers: { Cookie: ownerCookie },
  });
  const ownerReviewsData = await ownerReviewsRes.json();
  assert(ownerReviewsRes.status === 200 && ownerReviewsData.reviews?.length >= 1, "Owner xem được danh sách đánh giá của khách hàng (HTTP 200)");
  assert(parseFloat(ownerReviewsData.stats?.avgRating) >= 4.0, `Điểm đánh giá trung bình hệ thống: ${ownerReviewsData.stats?.avgRating}⭐`);

  const mgrReviewsRes = await fetch(`${baseUrl}/api/reviews`, {
    headers: { Cookie: mgrCookie },
  });
  assert(mgrReviewsRes.status === 200, "Manager (Zeebee) xem được đánh giá để giám sát chất lượng (HTTP 200)");

  // --- TEST 11: Cấp Riêng Tài Khoản Nhân Sự Vận Hành Bởi Manager & Bảo Mật ---
  console.log("\n--- TEST 11: Cấp Riêng Tài Khoản Nhân Sự Vận Hành Bởi Manager ---");
  const testStaffUser = `staff_${Date.now().toString(36)}`;
  const createStaffRes = await fetch(`${baseUrl}/api/manager/admins`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: mgrCookie,
    },
    body: JSON.stringify({
      action: "create_staff",
      name: "Kỹ Thuật Viên Mới",
      username: testStaffUser,
      password: "staffPassword123",
      role: "ADMIN",
      phone: "0988776655",
    }),
  });
  const createStaffData = await createStaffRes.json();
  assert(createStaffRes.status === 200 && createStaffData.success === true, "Manager cấp riêng tài khoản nhân sự vận hành thành công (HTTP 200)");

  // Kiểm tra tài khoản nhân sự vừa tạo đăng nhập được
  const staffLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: testStaffUser, password: "staffPassword123" }),
  });
  const staffLoginData = await staffLoginRes.json();
  assert(staffLoginRes.status === 200 && staffLoginData.user?.role === "ADMIN", "Nhân sự vận hành mới đăng nhập thành công với vai trò ADMIN");

  // Kiểm tra bảo mật: Customer không thể tự cấp tài khoản vận hành
  const forbidCreateStaff = await fetch(`${baseUrl}/api/manager/admins`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: custCookie,
    },
    body: JSON.stringify({
      action: "create_staff",
      name: "Hacker",
      username: "hacker_admin",
      password: "123",
      role: "ADMIN",
    }),
  });
  assert(forbidCreateStaff.status === 403, "Bảo mật: Customer bị chặn khi cố gắng cấp tài khoản nhân sự (HTTP 403)");

  // Kiểm tra cổng đăng ký công khai chỉ tạo role CUSTOMER
  const regCustomerOnly = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Khách Thử Nghiệm",
      phone: `09${Math.floor(10000000 + Math.random() * 90000000)}`,
      password: "pass123456",
      role: "MANAGER", // cố tình truyền MANAGER
    }),
  });
  const regCustData = await regCustomerOnly.json();
  assert(regCustData.user?.role === "CUSTOMER", "Cổng đăng ký công khai bắt buộc role là CUSTOMER dù có giả mạo role khác");

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
