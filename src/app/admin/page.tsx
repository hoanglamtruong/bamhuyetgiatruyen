"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Settings,
  ShieldAlert,
  Sliders,
  Plus,
  Edit2,
  CheckCircle,
  AlertTriangle,
  FileText,
  Calendar,
  Users,
  ShoppingBag,
  RefreshCw,
  PowerOff,
  Unlock,
} from "lucide-react";

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"config" | "services" | "support">("config");
  const [escalation, setEscalation] = useState<any>(null);
  const [configs, setConfigs] = useState<Record<string, string>>({});
  const [services, setServices] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  // Form edit service state
  const [editingService, setEditingService] = useState<any | null>(null);
  const [serviceModal, setServiceModal] = useState(false);

  // Simulation test date
  const [simDate, setSimDate] = useState("");

  const loadData = async (dateOverride?: string) => {
    try {
      const authRes = await fetch("/api/auth/me");
      const authData = await authRes.json();
      if (!authData.user || authData.user.role !== "ADMIN") {
        router.push("/login");
        return;
      }

      const escUrl = dateOverride ? `/api/escalation?date=${dateOverride}` : "/api/escalation";
      const escRes = await fetch(escUrl);
      const escData = await escRes.json();
      setEscalation(escData);
      if (escData.configs) setConfigs(escData.configs);

      const [srvRes, bkgRes, cusRes, ordRes, ctcRes] = await Promise.all([
        fetch("/api/services"),
        fetch("/api/bookings"),
        fetch("/api/customers"),
        fetch("/api/orders"),
        fetch("/api/contacts"),
      ]);

      setServices((await srvRes.json()).services || []);
      setBookings((await bkgRes.json()).bookings || []);
      setCustomers((await cusRes.json()).customers || []);
      setOrders((await ordRes.json()).orders || []);
      setContacts((await ctcRes.json()).contacts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveConfigs = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/escalation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_configs", configs }),
      });
      const d = await res.json();
      if (d.success) {
        setMsg("Đã lưu cấu hình tham số leo thang thành công!");
        loadData(simDate);
        setTimeout(() => setMsg(null), 3000);
      }
    } catch (err: any) {
      alert("Lỗi lưu cấu hình: " + err.message);
    }
  };

  const handleAdminKpiSuspend = async () => {
    if (!confirm("Xác nhận thực thi Bước 3 thủ công: Ngưng hoạt động nền tảng theo nhánh KPI?")) return;
    try {
      const res = await fetch("/api/escalation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "admin_kpi_suspend",
          reason: "Admin thực thi ngưng hoạt động cơ sở do không đạt KPI doanh thu 50 triệu/tháng trong 3 tháng liên tiếp",
        }),
      });
      const d = await res.json();
      if (d.success) {
        setMsg("Đã kích hoạt ngưng hoạt động thành công!");
        loadData(simDate);
        setTimeout(() => setMsg(null), 3000);
      }
    } catch (err: any) {
      alert("Lỗi: " + err.message);
    }
  };

  const handleRestoreSystem = async () => {
    if (!confirm("Xác nhận khôi phục hoạt động cho toàn bộ hệ thống web?")) return;
    try {
      const res = await fetch("/api/escalation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore", branch: "ADMIN_RESTORE" }),
      });
      const d = await res.json();
      if (d.success) {
        setMsg("Đã khôi phục hoạt động hệ thống!");
        loadData(simDate);
        setTimeout(() => setMsg(null), 3000);
      }
    } catch (err: any) {
      alert("Lỗi: " + err.message);
    }
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingService),
      });
      const d = await res.json();
      if (d.success) {
        setMsg("Đã lưu dịch vụ thành công!");
        setServiceModal(false);
        loadData(simDate);
        setTimeout(() => setMsg(null), 3000);
      }
    } catch (err: any) {
      alert("Lỗi: " + err.message);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-sm text-gray-500">Đang tải Admin Panel...</div>;
  }

  return (
    <div className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-blue-900 text-white p-6 sm:p-8 rounded-3xl shadow-lg">
        <div>
          <div className="inline-flex items-center space-x-2 bg-blue-700 text-blue-100 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            <Settings className="w-3.5 h-3.5" />
            <span>Vai Trò: Admin (Kỹ Thuật Hệ Thống)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">Trung Tâm Cấu Hình & Hỗ Trợ Kỹ Thuật</h1>
          <p className="text-xs text-blue-200 mt-1">
            Quản trị tham số leo thang · Đăng tải dịch vụ · Xem toàn bộ dữ liệu kỹ thuật · Thực thi Bước 3 nhánh KPI.
          </p>
        </div>

        {/* Action Status Badge */}
        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-xs space-y-1">
          <div className="text-blue-200 uppercase font-bold text-[10px]">Trạng Thái Hệ Thống:</div>
          <div className="text-sm font-extrabold flex items-center gap-2">
            {escalation?.isSuspended ? (
              <span className="text-red-400 flex items-center gap-1">
                <PowerOff className="w-4 h-4" /> ĐANG NGƯNG HOẠT ĐỘNG (BƯỚC 3)
              </span>
            ) : escalation?.step === 2 ? (
              <span className="text-amber-300 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" /> BƯỚC 2: CẢNH BÁO POPUP
              </span>
            ) : (
              <span className="text-emerald-300 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" /> HOẠT ĐỘNG BÌNH THƯỜNG
              </span>
            )}
          </div>
        </div>
      </div>

      {msg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{msg}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 space-x-4">
        <button
          onClick={() => setActiveTab("config")}
          className={`pb-3 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === "config"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Cấu Hình Tham Số Leo Thang & KPI</span>
        </button>

        <button
          onClick={() => setActiveTab("services")}
          className={`pb-3 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === "services"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Quản Lý Dịch Vụ ({services.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("support")}
          className={`pb-3 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === "support"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Dữ Liệu Hỗ Trợ Kỹ Thuật (CRM/Orders)</span>
        </button>
      </div>

      {/* TAB 1: CẤU HÌNH THAM SỐ LEO THANG */}
      {activeTab === "config" && (
        <div className="space-y-8">
          {/* Box Thực Thi Bước 3 KPI thủ công */}
          <div className="bg-red-50 border-2 border-red-300 rounded-3xl p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase text-red-800 bg-red-200 px-3 py-1 rounded-full mb-2">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Quyền Thực Thi Riêng Của Admin: Bước 3 Nhánh KPI
                </div>
                <h3 className="text-xl font-black text-gray-900">
                  Thực Thi Ngưng Hoạt Động (Bước 3 Thủ Công) Cho Nhánh KPI
                </h3>
                <p className="text-xs text-gray-600 mt-1 max-w-2xl">
                  Theo quy định nghiệp vụ: Ở nhánh trễ thanh toán, Bước 3 sẽ tự động kích hoạt sau 7 ngày quá hạn. 
                  Nhưng ở nhánh KPI doanh thu, <strong>Bước 3 bắt buộc do Admin thực hiện thủ công</strong> sau khi có cảnh báo.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {!escalation?.isSuspended ? (
                  <button
                    onClick={handleAdminKpiSuspend}
                    className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs px-5 py-3 rounded-xl shadow transition flex items-center gap-2"
                  >
                    <PowerOff className="w-4 h-4" />
                    <span>Admin Bấm Ngưng Hoạt Động (Bước 3)</span>
                  </button>
                ) : (
                  <button
                    onClick={handleRestoreSystem}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-5 py-3 rounded-xl shadow transition flex items-center gap-2"
                  >
                    <Unlock className="w-4 h-4" />
                    <span>Khôi Phục Hoạt Động Web (Unblock)</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Form Tham số hoá leo thang */}
          <form onSubmit={handleSaveConfigs} className="bg-white rounded-3xl border border-gray-200/80 shadow-sm p-6 sm:p-8 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Tham Số Hoá Cơ Chế Leo Thang (Không Hardcode)</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Các mốc thời gian và ngưỡng số liệu có thể tùy chỉnh linh hoạt cho từng đối tác.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
              {/* Nhánh trễ thanh toán */}
              <div className="bg-amber-50/50 border border-amber-200/70 p-5 rounded-2xl space-y-4">
                <div className="font-bold text-sm text-amber-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>1. Nhánh Trễ Thanh Toán (Doanh Thu 30%)</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Ngày hạn thanh toán hàng tháng (Mặc định: 25)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={configs["payment_due_day"] || "25"}
                    onChange={(e) => setConfigs({ ...configs, payment_due_day: e.target.value })}
                    className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <span className="text-[10px] text-gray-500">Quá hạn ngày này → Kích hoạt Bước 1 (Gửi Telegram)</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Số ngày sau hạn để kích hoạt Bước 2 (Popup Web)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={configs["payment_step2_days"] || "3"}
                    onChange={(e) => setConfigs({ ...configs, payment_step2_days: e.target.value })}
                    className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <span className="text-[10px] text-gray-500">Ví dụ: 3 ngày sau hạn (tức ngày 28) → Hiện popup cảnh báo</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Số ngày sau hạn để tự động ngưng web (Bước 3)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    value={configs["payment_step3_days"] || "7"}
                    onChange={(e) => setConfigs({ ...configs, payment_step3_days: e.target.value })}
                    className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <span className="text-[10px] text-gray-500">Theo KPI: Đủ 7 ngày kể từ hạn (ngày 02 tháng sau) → Bước 3 tự động</span>
                </div>
              </div>

              {/* Nhánh KPI doanh thu */}
              <div className="bg-blue-50/50 border border-blue-200/70 p-5 rounded-2xl space-y-4">
                <div className="font-bold text-sm text-blue-900 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-600" />
                  <span>2. Nhánh KPI Doanh Thu</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Trạng thái module KPI (Bật/tắt theo hợp đồng)
                  </label>
                  <select
                    value={configs["kpi_enabled"] || "false"}
                    onChange={(e) => setConfigs({ ...configs, kpi_enabled: e.target.value })}
                    className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="false">Tắt (Không áp dụng KPI cho cơ sở này)</option>
                    <option value="true">Bật (Kích hoạt giám sát cam kết doanh thu)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Doanh thu tối thiểu mỗi tháng (VND)
                  </label>
                  <input
                    type="number"
                    step="1000000"
                    value={configs["kpi_target_monthly"] || "50000000"}
                    onChange={(e) => setConfigs({ ...configs, kpi_target_monthly: e.target.value })}
                    className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-[10px] text-gray-500">Mẫu: 50,000,000 đ/tháng</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Số tháng đánh giá liên tục (Mặc định: 3 tháng)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={configs["kpi_consecutive_months"] || "3"}
                    onChange={(e) => setConfigs({ ...configs, kpi_consecutive_months: e.target.value })}
                    className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-[10px] text-gray-500">Không đạt 3 tháng liên tiếp → Kích hoạt leo thang</span>
                </div>
              </div>
            </div>

            {/* Telegram config */}
            <div className="pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Telegram Bot Token (Bước 1)
                </label>
                <input
                  type="text"
                  value={configs["telegram_bot_token"] || ""}
                  onChange={(e) => setConfigs({ ...configs, telegram_bot_token: e.target.value })}
                  placeholder="bot token..."
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Telegram Chat ID của Owner
                </label>
                <input
                  type="text"
                  value={configs["telegram_owner_chat_id"] || ""}
                  onChange={(e) => setConfigs({ ...configs, telegram_owner_chat_id: e.target.value })}
                  placeholder="chat id..."
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow transition"
              >
                Lưu Cấu Hình Tham Số
              </button>
            </div>
          </form>

          {/* Test & Simulation Tool */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center space-x-2">
              <RefreshCw className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Công Cụ Giả Lập Mốc Thời Gian (Audit & Testing Leo Thang)
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Nhập ngày bất kỳ để kiểm tra tức thì xem hệ thống có kích hoạt Bước 1, Bước 2, Bước 3 đúng theo tham số hay không.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <input
                type="date"
                value={simDate}
                onChange={(e) => setSimDate(e.target.value)}
                className="bg-slate-800 text-white border border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => loadData(simDate)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition"
              >
                Chạy Kiểm Thử Ngày Này
              </button>
              <button
                type="button"
                onClick={() => {
                  setSimDate("");
                  loadData();
                }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs px-4 py-2 rounded-xl transition"
              >
                Đặt Lại Ngày Hôm Nay
              </button>
            </div>

            {escalation && (
              <div className="mt-4 p-4 bg-slate-800/80 rounded-2xl border border-slate-700 text-xs font-mono space-y-1.5 text-slate-300">
                <div>• Kết quả đánh giá ngày: {simDate || "Hôm nay (mặc định)"}</div>
                <div>• Nhánh Thanh Toán: {escalation.paymentBranch?.status} (Quá hạn: {escalation.paymentBranch?.daysOverdue} ngày)</div>
                <div>• Nhánh KPI: {escalation.kpiBranch?.status} (Số tháng không đạt: {escalation.kpiBranch?.consecutiveFailedMonths}/3)</div>
                <div>• Trạng thái leo thang chung: Bước {escalation.step} {escalation.isSuspended ? "(ĐÃ KHOÁ WEB)" : ""}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: QUẢN LÝ DỊCH VỤ */}
      {activeTab === "services" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Danh Sách Dịch Vụ Trị Liệu Niêm Yết</h2>
              <p className="text-xs text-gray-500">Admin có quyền thêm mới, cập nhật giá và chi tiết liệu trình.</p>
            </div>
            <button
              onClick={() => {
                setEditingService({
                  title: "",
                  slug: "",
                  description: "",
                  benefits: "",
                  duration_minutes: 60,
                  price: 350000,
                  category: "Trị Liệu",
                  is_active: true,
                });
                setServiceModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Dịch Vụ Mới</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map((srv) => (
              <div key={srv.id} className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                      {srv.category}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${srv.is_active ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                      {srv.is_active ? "Đang mở bán" : "Tạm dừng"}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-base">{srv.title}</h3>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">{srv.description}</p>
                  <div className="mt-3 text-xs font-semibold text-gray-500">
                    Thời lượng: {srv.duration_minutes} phút · Giá: <strong className="text-orange-600">{Number(srv.price).toLocaleString("vi-VN")} đ</strong>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
                  <button
                    onClick={() => {
                      setEditingService(srv);
                      setServiceModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-800 text-xs font-bold flex items-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Chỉnh Sửa</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: DỮ LIỆU HỖ TRỢ KỸ THUẬT */}
      {activeTab === "support" && (
        <div className="space-y-8">
          {/* Lịch Hẹn */}
          <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Dữ Liệu Lịch Hẹn ({bookings.length})</span>
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-600 font-semibold">
                  <tr>
                    <th className="p-3">Khách Hàng</th>
                    <th className="p-3">Số Điện Thoại</th>
                    <th className="p-3">Dịch Vụ</th>
                    <th className="p-3">Ngày & Giờ</th>
                    <th className="p-3">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {bookings.map((b) => (
                    <tr key={b.id}>
                      <td className="p-3 font-bold text-gray-900">{b.customer_name}</td>
                      <td className="p-3 font-mono">{b.customer_phone}</td>
                      <td className="p-3">{b.service_title || "Dịch vụ"}</td>
                      <td className="p-3">{new Date(b.booking_date).toLocaleDateString("vi-VN")} - {b.booking_time}</td>
                      <td className="p-3 font-bold uppercase">{b.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Khách hàng CRM */}
          <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span>Dữ Liệu Khách Hàng CRM ({customers.length})</span>
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-600 font-semibold">
                  <tr>
                    <th className="p-3">Khách Hàng</th>
                    <th className="p-3">Số ĐT</th>
                    <th className="p-3">Bệnh Sử / Huyệt Đạo</th>
                    <th className="p-3">Lượt Trị Liệu</th>
                    <th className="p-3">Tổng Chi Tiêu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {customers.map((c) => (
                    <tr key={c.id}>
                      <td className="p-3 font-bold text-gray-900">{c.name}</td>
                      <td className="p-3 font-mono">{c.phone}</td>
                      <td className="p-3 text-gray-600 max-w-xs truncate">{c.health_notes || "Chưa có"}</td>
                      <td className="p-3 font-semibold">{c.treatment_count} lần</td>
                      <td className="p-3 font-bold text-orange-600">{Number(c.total_spent).toLocaleString("vi-VN")} đ</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Đơn Hàng Dịch Vụ */}
          <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-blue-600" />
              <span>Dữ Liệu Đơn Hàng Dịch Vụ ({orders.length})</span>
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-600 font-semibold">
                  <tr>
                    <th className="p-3">Mã Đơn</th>
                    <th className="p-3">Khách Hàng</th>
                    <th className="p-3">Dịch Vụ</th>
                    <th className="p-3">Tổng Tiền</th>
                    <th className="p-3">Manager (30%)</th>
                    <th className="p-3">Owner (70%)</th>
                    <th className="p-3">Kỳ Tháng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td className="p-3 font-mono font-bold text-blue-700">{o.order_code}</td>
                      <td className="p-3">{o.customer_name}</td>
                      <td className="p-3">{o.service_title}</td>
                      <td className="p-3 font-bold">{Number(o.amount).toLocaleString("vi-VN")} đ</td>
                      <td className="p-3 text-amber-700">{Number(o.manager_amount).toLocaleString("vi-VN")} đ</td>
                      <td className="p-3 text-orange-700">{Number(o.owner_amount).toLocaleString("vi-VN")} đ</td>
                      <td className="p-3 font-mono">{o.month_period}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Chỉnh sửa / Thêm dịch vụ */}
      {serviceModal && editingService && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editingService.id ? "Chỉnh Sửa Dịch Vụ" : "Thêm Dịch Vụ Mới"}
            </h3>
            <form onSubmit={handleSaveService} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Tên Dịch Vụ</label>
                <input
                  type="text"
                  value={editingService.title}
                  onChange={(e) => setEditingService({ ...editingService, title: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Giá Tiền (VND)</label>
                  <input
                    type="number"
                    value={editingService.price}
                    onChange={(e) => setEditingService({ ...editingService, price: parseFloat(e.target.value) })}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Thời Lượng (Phút)</label>
                  <input
                    type="number"
                    value={editingService.duration_minutes}
                    onChange={(e) => setEditingService({ ...editingService, duration_minutes: parseInt(e.target.value, 10) })}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Mô Tả Liệu Trình</label>
                <textarea
                  rows={2}
                  value={editingService.description || ""}
                  onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Hiệu Quả Trị Liệu (Benefits)</label>
                <textarea
                  rows={2}
                  value={editingService.benefits || ""}
                  onChange={(e) => setEditingService({ ...editingService, benefits: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="srv-active"
                  checked={editingService.is_active}
                  onChange={(e) => setEditingService({ ...editingService, is_active: e.target.checked })}
                  className="rounded text-blue-600"
                />
                <label htmlFor="srv-active" className="text-xs font-semibold text-gray-700">
                  Hiển thị và mở bán trên website
                </label>
              </div>

              <div className="pt-4 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setServiceModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-semibold text-gray-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-xs font-bold text-white shadow"
                >
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
