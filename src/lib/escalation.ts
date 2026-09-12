import { pool } from "./db";

export interface EscalationStatus {
  isSuspended: boolean;
  suspensionReason: string;
  suspensionBranch: string;
  step: number; // 0: Normal, 1: Telegram Alert, 2: Web Popup Warning, 3: Suspended
  warningDate: string | null;
  popupMessage: string | null;
  paymentBranch: {
    overdue: boolean;
    dueDay: number;
    daysOverdue: number;
    unpaidRevenue: number;
    managerShare: number;
    step: number;
    status: string;
    shutdownDate: string | null;
  };
  kpiBranch: {
    enabled: boolean;
    targetMonthly: number;
    consecutiveFailedMonths: number;
    isViolated: boolean;
    step: number;
    status: string;
    canAdminSuspend: boolean;
  };
}

export async function getSystemConfigs(): Promise<Record<string, string>> {
  const res = await pool.query("SELECT key, value FROM system_configs;");
  const configs: Record<string, string> = {};
  for (const row of res.rows) {
    configs[row.key] = row.value;
  }
  return configs;
}

export async function updateSystemConfig(key: string, value: string) {
  await pool.query(
    "INSERT INTO system_configs (key, value, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP;",
    [key, value]
  );
}

// Gửi thông báo Telegram cho Owner
export async function sendTelegramNotification(message: string): Promise<boolean> {
  const configs = await getSystemConfigs();
  const botToken = configs["telegram_bot_token"];
  const chatId = configs["telegram_owner_chat_id"];

  console.log(`[TELEGRAM NOTIFICATION] To: ${chatId} | Message:\n${message}`);

  if (botToken && chatId && !botToken.startsWith("mock")) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: "Markdown" }),
      });
      return res.ok;
    } catch (err) {
      console.error("Failed to send Telegram message:", err);
      return false;
    }
  }
  return true;
}

// Kiểm tra toàn diện cơ chế leo thang 3 bước
export async function evaluateEscalation(overrideDate?: Date): Promise<EscalationStatus> {
  const configs = await getSystemConfigs();
  const now = overrideDate || new Date();
  const currentDay = now.getDate();

  // 1. Kiểm tra trạng thái cưỡng chế web_suspended
  const isDirectlySuspended = configs["web_suspended"] === "true";
  const directReason = configs["suspension_reason"] || "";
  const directBranch = configs["suspension_branch"] || "";

  // Tham số hoá nhánh thanh toán
  const paymentDueDay = parseInt(configs["payment_due_day"] || "25", 10);
  const paymentStep2Days = parseInt(configs["payment_step2_days"] || "3", 10); // +3 ngày -> 28
  const paymentStep3Days = parseInt(configs["payment_step3_days"] || "7", 10); // +7 ngày -> Bước 3 tự động

  // Tính doanh thu tháng hiện tại
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const revRes = await pool.query(
    "SELECT COALESCE(SUM(amount), 0) as total, COALESCE(SUM(manager_amount), 0) as manager_share FROM orders WHERE month_period = $1 AND status IN ('completed', 'accepted');",
    [currentMonthStr]
  );
  const currentTotal = parseFloat(revRes.rows[0].total);
  const managerShare = parseFloat(revRes.rows[0].manager_share);

  // Đánh giá nhánh thanh toán
  let paymentStep = 0;
  let paymentOverdue = false;
  let daysOverdue = 0;
  let paymentShutdownDate: string | null = null;

  // Tính xem có đang trong giai đoạn quá hạn không:
  // TH1: Trong cùng tháng sau ngày paymentDueDay (ngày 26..31)
  if (currentDay > paymentDueDay) {
    daysOverdue = currentDay - paymentDueDay;
    paymentOverdue = true;
    const shutdownD = new Date(now.getFullYear(), now.getMonth(), paymentDueDay + paymentStep3Days);
    paymentShutdownDate = shutdownD.toLocaleDateString("vi-VN");
  } 
  // TH2: Đầu tháng tiếp theo trong cửa sổ 7 ngày leo thang của tháng trước (currentDay <= 7)
  else if (currentDay <= (paymentStep3Days + 2)) {
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const daysInPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    const daysFromPrevDue = (daysInPrevMonth - paymentDueDay) + currentDay;

    if (daysFromPrevDue <= (paymentStep3Days + 5)) {
      daysOverdue = daysFromPrevDue;
      paymentOverdue = true;
      const shutdownD = new Date(prevMonthDate.getFullYear(), prevMonthDate.getMonth(), paymentDueDay + paymentStep3Days);
      paymentShutdownDate = shutdownD.toLocaleDateString("vi-VN");
    }
  }

  if (paymentOverdue) {
    if (daysOverdue >= paymentStep3Days) {
      paymentStep = 3;
    } else if (daysOverdue >= paymentStep2Days) {
      paymentStep = 2;
    } else if (daysOverdue >= 1) {
      paymentStep = 1;
    }
  }

  // Đánh giá nhánh KPI doanh thu
  const kpiEnabled = configs["kpi_enabled"] === "true";
  const kpiTarget = parseFloat(configs["kpi_target_monthly"] || "50000000");
  const kpiConsecutiveReq = parseInt(configs["kpi_consecutive_months"] || "3", 10);

  let failedMonthsCount = 0;
  if (kpiEnabled) {
    // Lấy doanh thu 3 tháng gần nhất
    const pastMonths: string[] = [];
    for (let i = 1; i <= kpiConsecutiveReq; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      pastMonths.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }

    const pastRevRes = await pool.query(
      "SELECT month_period, COALESCE(SUM(amount), 0) as total FROM orders WHERE month_period = ANY($1) AND status IN ('completed', 'accepted') GROUP BY month_period;",
      [pastMonths]
    );

    const monthTotals = new Map<string, number>();
    for (const r of pastRevRes.rows) {
      monthTotals.set(r.month_period, parseFloat(r.total));
    }

    for (const m of pastMonths) {
      const total = monthTotals.get(m) || 0;
      if (total < kpiTarget) {
        failedMonthsCount++;
      }
    }
  }

  const isKpiViolated = kpiEnabled && failedMonthsCount >= kpiConsecutiveReq;
  let kpiStep = 0;
  if (isKpiViolated) {
    // Nếu Admin đã bấm ngưng hoạt động
    if (isDirectlySuspended && directBranch === "KPI") {
      kpiStep = 3;
    } else {
      // Mặc định Bước 2 khi phát hiện 3 tháng liên tiếp không đạt
      kpiStep = 2;
    }
  }

  // Quyết định tổng thể hệ thống
  let overallStep = 0;
  let overallSuspended = isDirectlySuspended;
  let overallReason = directReason;
  let overallBranch = directBranch;
  let popupMsg: string | null = null;
  let warningDate: string | null = null;

  // Thanh toán: tự động kích hoạt Bước 3 nếu quá hạn 7 ngày
  if (paymentStep === 3) {
    overallSuspended = true;
    overallStep = 3;
    overallBranch = "PAYMENT";
    overallReason = `Hệ thống đã tự động ngưng hoạt động do quá hạn thanh toán 30% doanh thu quá 7 ngày kể từ ngày ${paymentDueDay}.`;
  } else if (kpiStep === 3) {
    overallSuspended = true;
    overallStep = 3;
    overallBranch = "KPI";
    overallReason = `Hệ thống bị Admin ngưng hoạt động do không đạt KPI doanh thu (${(kpiTarget / 1000000).toFixed(0)} triệu/tháng) trong ${kpiConsecutiveReq} tháng liên tiếp.`;
  } else if (paymentStep === 2) {
    overallStep = 2;
    overallBranch = "PAYMENT";
    warningDate = paymentShutdownDate;
    popupMsg = `CẢNH BÁO TRỄ THANH TOÁN (BƯỚC 2): Chủ cơ sở chưa thanh toán 30% doanh thu (Hạn: ngày ${paymentDueDay}). Nếu không thanh toán, website sẽ TỰ ĐỘNG NGƯNG HOẠT ĐỘNG vào ngày ${warningDate}.`;
  } else if (kpiStep === 2) {
    overallStep = 2;
    overallBranch = "KPI";
    const nextMonth1st = new Date(now.getFullYear(), now.getMonth() + 1, 1).toLocaleDateString("vi-VN");
    warningDate = nextMonth1st;
    popupMsg = `CẢNH BÁO KPI DOANH THU (BƯỚC 2): Cơ sở không đạt KPI tối thiểu ${(kpiTarget / 1000000).toFixed(0)} triệu/tháng trong ${kpiConsecutiveReq} tháng liên tiếp. Vui lòng liên hệ Admin/Manager trước ngày ${warningDate} để tránh bị ngưng dịch vụ.`;
  } else if (paymentStep === 1) {
    overallStep = 1;
    overallBranch = "PAYMENT";
  }

  return {
    isSuspended: overallSuspended,
    suspensionReason: overallReason,
    suspensionBranch: overallBranch,
    step: overallStep,
    warningDate,
    popupMessage: popupMsg,
    paymentBranch: {
      overdue: paymentOverdue,
      dueDay: paymentDueDay,
      daysOverdue,
      unpaidRevenue: currentTotal,
      managerShare,
      step: paymentStep,
      status: paymentStep === 0 ? "Bình thường" : paymentStep === 1 ? "Bước 1 (Đã gửi Telegram)" : paymentStep === 2 ? "Bước 2 (Popup cảnh báo)" : "Bước 3 (Ngưng hoạt động tự động)",
      shutdownDate: paymentShutdownDate,
    },
    kpiBranch: {
      enabled: kpiEnabled,
      targetMonthly: kpiTarget,
      consecutiveFailedMonths: failedMonthsCount,
      isViolated: isKpiViolated,
      step: kpiStep,
      status: !kpiEnabled ? "Chưa kích hoạt" : !isKpiViolated ? "Đạt KPI" : kpiStep === 3 ? "Bước 3 (Admin đã khoá thủ công)" : "Bước 2 (Popup cảnh báo)",
      canAdminSuspend: isKpiViolated && !overallSuspended,
    },
  };
}

// Admin thực thi Bước 3 thủ công ở nhánh KPI
export async function executeAdminKpiSuspend(reason?: string) {
  const desc = reason || "Admin thực thi ngưng hoạt động cơ sở do không đạt KPI doanh thu 3 tháng liên tiếp";
  await updateSystemConfig("web_suspended", "true");
  await updateSystemConfig("suspension_branch", "KPI");
  await updateSystemConfig("suspension_reason", desc);

  await pool.query(
    "INSERT INTO escalation_logs (id, branch, step, reason, warning_date, executed_by) VALUES ($1, 'KPI', 3, $2, CURRENT_DATE, 'admin');",
    [`esc-kpi-${Date.now()}`, desc]
  );

  await sendTelegramNotification(`🚫 THÔNG BÁO NGƯNG HOẠT ĐỘNG (BƯỚC 3 · KPI)\nAdmin đã chính thức ngưng hoạt động nền tảng web do không đạt cam kết KPI doanh thu.\nLý do: ${desc}`);
}

// Khôi phục hoạt động hệ thống (Unblock)
export async function restoreSystem(branch: string, reason?: string) {
  await updateSystemConfig("web_suspended", "false");
  await updateSystemConfig("suspension_branch", "");
  await updateSystemConfig("suspension_reason", "");

  await pool.query(
    "INSERT INTO escalation_logs (id, branch, step, reason, warning_date, executed_by) VALUES ($1, $2, 0, $3, CURRENT_DATE, 'admin_restore');",
    [`esc-res-${Date.now()}`, branch, reason || `Đã khôi phục hoạt động cho nhánh ${branch}`]
  );

  await sendTelegramNotification(`✅ THÔNG BÁO MỞ LẠI HỆ THỐNG\nHệ thống web Bấm Huyệt Gia Truyền đã được khôi phục hoạt động bình thường.`);
}
