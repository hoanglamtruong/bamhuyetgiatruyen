"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  ShoppingBag,
  Users,
  Calendar,
  DollarSign,
  Plus,
  CheckCircle,
  AlertTriangle,
  Clock,
  HeartPulse,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

export default function OwnerDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"orders" | "crm" | "bookings" | "revenue">("orders");
  const [services, setServices] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [escalation, setEscalation] = useState<any>(null);
  const [msg, setMsg] = useState<string | null>(null);

  // New order modal
  const [orderModal, setOrderModal] = useState(false);
  const [newOrder, setNewOrder] = useState({
    customer_name: "",
    customer_phone: "",
    service_id: "",
    service_title: "",
    amount: 350000,
  });

  // Edit CRM customer modal
  const [crmModal, setCrmModal] = useState(false);
  const [editingCrm, setEditingCrm] = useState<any | null>(null);

  const loadData = async () => {
    try {
      const authRes = await fetch("/api/auth/me");
      const authData = await authRes.json();
      if (!authData.user || authData.user.role !== "OWNER") {
        router.push("/login");
        return;
      }

      const [escRes, srvRes, bkgRes, cusRes, ordRes] = await Promise.all([
        fetch("/api/escalation"),
        fetch("/api/services"),
        fetch("/api/bookings"),
        fetch("/api/customers"),
        fetch("/api/orders"),
      ]);

      setEscalation(await escRes.json());
      const srvList = (await srvRes.json()).services || [];
      setServices(srvList);
      if (srvList.length > 0 && !newOrder.service_id) {
        setNewOrder((prev) => ({
          ...prev,
          service_id: srvList[0].id,
          service_title: srvList[0].title,
          amount: parseFloat(srvList[0].price),
        }));
      }
      setBookings((await bkgRes.json()).bookings || []);
      setCustomers((await cusRes.json()).customers || []);
      setOrders((await ordRes.json()).orders || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newOrder),
      });
      const d = await res.json();
      if (d.success) {
        setMsg("Đã tạo đơn hàng thành công! Doanh thu đã được chia 70% cho Owner và 30% cho Manager.");
        setOrderModal(false);
        loadData();
        setTimeout(() => setMsg(null), 3500);
      }
    } catch (err: any) {
      alert("Lỗi: " + err.message);
    }
  };

  const handleSaveCrm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingCrm),
      });
      const d = await res.json();
      if (d.success) {
        setMsg("Đã cập nhật hồ sơ bệnh lý khách hàng vào CRM!");
        setCrmModal(false);
        loadData();
        setTimeout(() => setMsg(null), 3500);
      }
    } catch (err: any) {
      alert("Lỗi: " + err.message);
    }
  };

  const handleConvertBookingToOrder = (b: any) => {
    const matchedService = services.find((s) => s.id === b.service_id) || services[0];
    setNewOrder({
      customer_name: b.customer_name,
      customer_phone: b.customer_phone,
      service_id: matchedService?.id || "",
      service_title: matchedService?.title || "Bấm Huyệt Trị Liệu",
      amount: parseFloat(matchedService?.price || 350000),
    });
    setOrderModal(true);
  };

  if (loading) {
    return <div className="p-12 text-center text-sm text-gray-500">Đang tải Owner Dashboard...</div>;
  }

  // Calculate Owner's 70% share and Manager's 30% obligation
  let ownerTotalEarned = 0;
  let managerObligation = 0;
  for (const ord of orders) {
    if (ord.status === "completed") {
      ownerTotalEarned += parseFloat(ord.owner_amount);
      managerObligation += parseFloat(ord.manager_amount);
    }
  }

  return (
    <div className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#E8622A]/10 border border-[#E8622A]/30 p-6 sm:p-8 rounded-3xl">
        <div>
          <div className="inline-flex items-center space-x-2 bg-[#E8622A] text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            <User className="w-3.5 h-3.5" />
            <span>Vai Trò: Owner / Chủ Cơ Sở Bấm Huyệt Gia Truyền</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900">
            Quản Lý Vận Hành Cơ Sở & Doanh Thu 70%
          </h1>
          <p className="text-xs text-gray-600 mt-1">
            Toàn quyền trên khách hàng · Dịch vụ · Đơn hàng · Theo dõi đối soát 30% Manager vào ngày 25.
          </p>
        </div>

        <button
          onClick={() => setOrderModal(true)}
          className="bg-[#E8622A] hover:bg-[#D04F18] text-white font-bold text-xs px-5 py-3 rounded-xl shadow-lg transition flex items-center justify-center gap-2 self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Đơn Hàng Mới</span>
        </button>
      </div>

      {msg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{msg}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-orange-50 rounded-2xl border border-orange-200 p-6 shadow-sm">
          <div className="text-xs font-bold text-orange-900 uppercase">Thu Nhập Của Bạn (70%)</div>
          <div className="text-2xl sm:text-3xl font-black text-orange-700 mt-2">
            {ownerTotalEarned.toLocaleString("vi-VN")} đ
          </div>
          <div className="text-xs text-orange-800 mt-1">Doanh thu giữ lại sau chia sẻ</div>
        </div>

        <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6 shadow-sm">
          <div className="text-xs font-bold text-amber-900 uppercase">Nghĩa Vụ Với Manager (30%)</div>
          <div className="text-2xl sm:text-3xl font-black text-amber-700 mt-2">
            {managerObligation.toLocaleString("vi-VN")} đ
          </div>
          <div className="text-xs text-amber-800 mt-1">Hạn thanh toán: Ngày 25 hàng tháng</div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm">
          <div className="text-xs font-semibold text-gray-500 uppercase">Khách Hàng Trong CRM</div>
          <div className="text-2xl sm:text-3xl font-black text-gray-900 mt-2">
            {customers.length} bệnh nhân
          </div>
          <div className="text-xs text-gray-500 mt-1">Lưu trữ hồ sơ & thể trạng</div>
        </div>

        <div className="bg-teal-50 rounded-2xl border border-teal-200 p-6 shadow-sm">
          <div className="text-xs font-bold text-teal-900 uppercase">Lịch Hẹn Đang Chờ</div>
          <div className="text-2xl sm:text-3xl font-black text-[#1B6B7B] mt-2">
            {bookings.filter((b) => b.status === "pending").length} lịch
          </div>
          <div className="text-xs text-teal-800 mt-1">Sẵn sàng tiếp đón</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 space-x-4">
        <button
          onClick={() => setActiveTab("orders")}
          className={`pb-3 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === "orders"
              ? "border-[#E8622A] text-[#E8622A]"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>(5) Đơn Hàng Dịch Vụ ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("crm")}
          className={`pb-3 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === "crm"
              ? "border-[#E8622A] text-[#E8622A]"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>(4) Quản Lý Khách Hàng CRM ({customers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("bookings")}
          className={`pb-3 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === "bookings"
              ? "border-[#E8622A] text-[#E8622A]"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>(1) Lịch Hẹn Đặt Trước ({bookings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("revenue")}
          className={`pb-3 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === "revenue"
              ? "border-[#E8622A] text-[#E8622A]"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Đối Soát 30/70 & Leo Thang</span>
        </button>
      </div>

      {/* TAB 1: ĐƠN HÀNG DỊCH VỤ */}
      {activeTab === "orders" && (
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900">Danh Sách Đơn Hàng Dịch Vụ Đã Phục Vụ</h2>
            <button
              onClick={() => setOrderModal(true)}
              className="bg-[#E8622A] hover:bg-[#D04F18] text-white text-xs font-bold px-4 py-2 rounded-xl transition flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tạo Đơn Hàng Mới</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                <tr>
                  <th className="p-3">Mã Đơn</th>
                  <th className="p-3">Khách Hàng</th>
                  <th className="p-3">Dịch Vụ Bấm Huyệt</th>
                  <th className="p-3">Tổng Thu</th>
                  <th className="p-3 text-orange-700">Owner Nhận (70%)</th>
                  <th className="p-3 text-amber-700">Manager (30%)</th>
                  <th className="p-3">Kỳ Đối Soát</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50/80 transition">
                    <td className="p-3 font-mono font-bold text-teal-800">{o.order_code}</td>
                    <td className="p-3">
                      <div className="font-bold text-gray-900">{o.customer_name}</div>
                      <div className="text-[11px] text-gray-500 font-mono">{o.customer_phone}</div>
                    </td>
                    <td className="p-3 font-medium">{o.service_title}</td>
                    <td className="p-3 font-extrabold text-gray-900">
                      {Number(o.amount).toLocaleString("vi-VN")} đ
                    </td>
                    <td className="p-3 font-bold text-orange-600">
                      {Number(o.owner_amount).toLocaleString("vi-VN")} đ
                    </td>
                    <td className="p-3 font-bold text-amber-700">
                      {Number(o.manager_amount).toLocaleString("vi-VN")} đ
                    </td>
                    <td className="p-3 font-mono text-gray-500">{o.month_period}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: CRM QUẢN LÝ KHÁCH HÀNG */}
      {activeTab === "crm" && (
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Hồ Sơ Khách Hàng & Bệnh Sử Trị Liệu (CRM)</h2>
              <p className="text-xs text-gray-500">
                Theo dõi lịch sử trị liệu, tổng chi tiêu và lưu ý các huyệt đạo đặc biệt của từng khách hàng.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customers.map((c) => (
              <div key={c.id} className="bg-gray-50/80 rounded-2xl border border-gray-200/80 p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-full bg-teal-100 text-[#1B6B7B] font-bold flex items-center justify-center text-xs">
                      {c.name.charAt(0)}
                    </div>
                    <span className="bg-orange-100 text-orange-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {c.treatment_count} lượt trị liệu
                    </span>
                  </div>

                  <h3 className="font-bold text-gray-900 text-base">{c.name}</h3>
                  <div className="text-xs font-mono text-gray-500 mb-3">{c.phone}</div>

                  <div className="bg-white p-3 rounded-xl border border-gray-200/60 mb-3">
                    <div className="text-[10px] uppercase font-bold text-gray-400 mb-1 flex items-center gap-1">
                      <HeartPulse className="w-3 h-3 text-red-500" />
                      <span>Ghi Chú Huyệt Đạo / Bệnh Án</span>
                    </div>
                    <p className="text-xs text-gray-700 leading-relaxed line-clamp-3">
                      {c.health_notes || "Chưa có ghi chú tình trạng bệnh."}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-200/60 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-gray-400 font-semibold uppercase">Tổng chi tiêu</div>
                    <div className="text-sm font-black text-[#E8622A]">
                      {Number(c.total_spent).toLocaleString("vi-VN")} đ
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setEditingCrm(c);
                      setCrmModal(true);
                    }}
                    className="text-xs font-bold text-[#1B6B7B] hover:text-[#134E5E]"
                  >
                    Sửa Bệnh Án
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: QUẢN LÝ LỊCH HẸN */}
      {activeTab === "bookings" && (
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900">Danh Sách Lịch Hẹn Khách Đặt Trước</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                <tr>
                  <th className="p-3">Khách Hàng</th>
                  <th className="p-3">Số Điện Thoại</th>
                  <th className="p-3">Dịch Vụ Chọn</th>
                  <th className="p-3">Ngày & Giờ Hẹn</th>
                  <th className="p-3">Triệu Chứng Bệnh</th>
                  <th className="p-3">Trạng Thái</th>
                  <th className="p-3 text-right">Hành Động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50/80 transition">
                    <td className="p-3 font-bold text-gray-900">{b.customer_name}</td>
                    <td className="p-3 font-mono">{b.customer_phone}</td>
                    <td className="p-3">{b.service_title || "Liệu trình chung"}</td>
                    <td className="p-3 font-semibold text-teal-800">
                      {new Date(b.booking_date).toLocaleDateString("vi-VN")} - {b.booking_time}
                    </td>
                    <td className="p-3 text-gray-500 max-w-xs truncate">{b.notes || "Không"}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        b.status === "confirmed"
                          ? "bg-emerald-100 text-emerald-800"
                          : b.status === "completed"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-amber-100 text-amber-800"
                      }`}>
                        {b.status === "pending" ? "Chờ xác nhận" : b.status === "confirmed" ? "Đã xác nhận" : "Hoàn thành"}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {b.status !== "completed" && (
                        <button
                          onClick={() => handleConvertBookingToOrder(b)}
                          className="bg-[#E8622A] hover:bg-[#D04F18] text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition"
                        >
                          Tạo Đơn Hàng
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: ĐỐI SOÁT & CẢNH BÁO LEO THANG */}
      {activeTab === "revenue" && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm p-6 sm:p-8 space-y-6">
            <h2 className="text-lg font-bold text-gray-900">Chi Tiết Cơ Chế Đối Soát Doanh Thu 30/70 & Leo Thang</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-amber-200 rounded-2xl p-5 bg-amber-50/40 space-y-3">
                <div className="font-bold text-amber-900 text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>Quy Trình Thanh Toán 30% Doanh Thu Hàng Tháng</span>
                </div>
                <ul className="text-xs text-gray-700 space-y-2 leading-relaxed">
                  <li>• <strong>Ngày 25 hàng tháng:</strong> Hạn chót thanh toán phần chia sẻ 30% cho Quản lý (Manager).</li>
                  <li>• <strong>Bước 1 (Quá hạn):</strong> Hệ thống tự động gửi thông báo qua Telegram cho Owner khi phát hiện trễ.</li>
                  <li>• <strong>Bước 2 (Sau 3 ngày):</strong> Hiển thị popup cảnh báo trên web với ngày cụ thể sẽ bị ngắt hoạt động.</li>
                  <li>• <strong>Bước 3 (Đủ 7 ngày):</strong> Web tự động ngưng hoạt động hoàn toàn.</li>
                </ul>
              </div>

              <div className="border border-blue-200 rounded-2xl p-5 bg-blue-50/40 space-y-3">
                <div className="font-bold text-blue-900 text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span>Cơ Chế Cam Kết KPI Doanh Thu (Nếu Áp Dụng)</span>
                </div>
                <ul className="text-xs text-gray-700 space-y-2 leading-relaxed">
                  <li>• Module bật/tắt theo từng hợp đồng riêng biệt.</li>
                  <li>• Ngưỡng mẫu: <strong>50 triệu/tháng</strong>, đánh giá liên tục trong 3 tháng.</li>
                  <li>• Nếu không đạt 3 tháng liên tiếp: kích hoạt cảnh báo leo thang Bước 1 & Bước 2.</li>
                  <li>• <strong>Bước 3 do Admin thực hiện thủ công</strong> (không tự động như nhánh thanh toán).</li>
                </ul>
              </div>
            </div>

            {/* Trạng thái hiện tại của cơ sở */}
            <div className="p-5 bg-gray-50 rounded-2xl border border-gray-200 text-xs space-y-2">
              <div className="font-bold text-gray-900 text-sm">Trạng Thái Leo Thang Hiện Tại Của Cơ Sở:</div>
              <div>• Nhánh Thanh Toán: <strong className="text-amber-800">{escalation?.paymentBranch?.status}</strong></div>
              <div>• Nhánh KPI: <strong className="text-blue-800">{escalation?.kpiBranch?.status}</strong></div>
              <div>• Trạng thái hoạt động: {escalation?.isSuspended ? <span className="text-red-600 font-bold">ĐANG BỊ ĐÌNH CHỈ</span> : <span className="text-emerald-600 font-bold">BÌNH THƯỜNG</span>}</div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tạo Đơn Hàng Mới */}
      {orderModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Tạo Đơn Hàng Dịch Vụ Mới</h3>
            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Họ Tên Khách Hàng</label>
                <input
                  type="text"
                  value={newOrder.customer_name}
                  onChange={(e) => setNewOrder({ ...newOrder, customer_name: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Số Điện Thoại</label>
                <input
                  type="tel"
                  value={newOrder.customer_phone}
                  onChange={(e) => setNewOrder({ ...newOrder, customer_phone: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Dịch Vụ Sử Dụng</label>
                <select
                  value={newOrder.service_id}
                  onChange={(e) => {
                    const s = services.find((srv) => srv.id === e.target.value);
                    setNewOrder({
                      ...newOrder,
                      service_id: e.target.value,
                      service_title: s ? s.title : "Bấm Huyệt",
                      amount: s ? parseFloat(s.price) : newOrder.amount,
                    });
                  }}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  required
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title} ({Number(s.price).toLocaleString("vi-VN")} đ)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Số Tiền Thanh Toán (VND)</label>
                <input
                  type="number"
                  value={newOrder.amount}
                  onChange={(e) => setNewOrder({ ...newOrder, amount: parseFloat(e.target.value) })}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  required
                />
              </div>

              {/* Tỷ lệ phân chia preview */}
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl text-xs space-y-1">
                <div className="font-bold text-orange-900">Phân Chia Doanh Thu Tự Động:</div>
                <div className="flex justify-between">
                  <span>• Owner thực nhận (70%):</span>
                  <strong className="text-orange-700">{(newOrder.amount * 0.7).toLocaleString("vi-VN")} đ</strong>
                </div>
                <div className="flex justify-between">
                  <span>• Manager đối soát (30%):</span>
                  <strong className="text-amber-700">{(newOrder.amount * 0.3).toLocaleString("vi-VN")} đ</strong>
                </div>
              </div>

              <div className="pt-4 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setOrderModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-semibold text-gray-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#E8622A] hover:bg-[#D04F18] rounded-xl text-xs font-bold text-white shadow"
                >
                  Xác Nhận Tạo Đơn
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Chỉnh Sửa CRM */}
      {crmModal && editingCrm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Cập Nhật Hồ Sơ Bệnh Lý (CRM)</h3>
            <form onSubmit={handleSaveCrm} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Họ Tên Khách Hàng</label>
                <input
                  type="text"
                  value={editingCrm.name}
                  onChange={(e) => setEditingCrm({ ...editingCrm, name: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Số Điện Thoại</label>
                <input
                  type="tel"
                  value={editingCrm.phone}
                  onChange={(e) => setEditingCrm({ ...editingCrm, phone: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Ghi Chú Huyệt Vị & Thể Trạng</label>
                <textarea
                  rows={4}
                  value={editingCrm.health_notes || ""}
                  onChange={(e) => setEditingCrm({ ...editingCrm, health_notes: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  placeholder="Tiền sử chấn thương, huyệt đạo cần tránh, phản ứng dầu nóng..."
                />
              </div>

              <div className="pt-4 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setCrmModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-semibold text-gray-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1B6B7B] hover:bg-[#134E5E] rounded-xl text-xs font-bold text-white shadow"
                >
                  Lưu Vào Hồ Sơ CRM
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
