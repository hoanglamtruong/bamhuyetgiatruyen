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
  Copy,
  Check,
  Edit2,
  FileText,
  Tag,
  Share2,
} from "lucide-react";

export default function OwnerDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"bookings" | "orders" | "crm" | "services" | "revenue">("bookings");
  const [services, setServices] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersSummary, setOrdersSummary] = useState<any>(null);
  const [escalation, setEscalation] = useState<any>(null);
  const [msg, setMsg] = useState<string | null>(null);

  // Modal duyệt lịch & khuyến mãi
  const [confirmModal, setConfirmModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountReason, setDiscountReason] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // New order modal
  const [orderModal, setOrderModal] = useState(false);
  const [newOrder, setNewOrder] = useState({
    customer_name: "",
    customer_phone: "",
    service_id: "",
    service_title: "",
    amount: 350000,
    status: "accepted",
  });

  // Edit CRM customer modal
  const [crmModal, setCrmModal] = useState(false);
  const [editingCrm, setEditingCrm] = useState<any | null>(null);

  // Edit / Add Service modal (Owner quản lý dịch vụ)
  const [serviceModal, setServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<any | null>(null);

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
      const ordData = await ordRes.json();
      setOrders(ordData.orders || []);
      setOrdersSummary(ordData.summary || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Tính giá cuối cùng khi áp dụng khuyến mãi
  const currentServicePrice = selectedBooking ? parseFloat(selectedBooking.service_price || 350000) : 0;
  const currentFinalAmount = Math.max(0, currentServicePrice - (Number(discountAmount) || 0));

  // Tạo mẫu tin nhắn xác nhận chuẩn để copy 1-click
  const generateConfirmationMessage = () => {
    if (!selectedBooking) return "";
    return `[BẤM HUYỆT GIA TRUYỀN - XÁC NHẬN LỊCH HẸN]
Kính gửi Quý khách ${selectedBooking.customer_name},
Lịch hẹn trị liệu của Quý khách đã được xác nhận:
• Dịch vụ: ${selectedBooking.service_title || 'Bấm Huyệt Trị Liệu Gia Truyền'}
• Thời gian: ${selectedBooking.booking_time} ngày ${new Date(selectedBooking.booking_date).toLocaleDateString('vi-VN')}
• Giá niêm yết: ${currentServicePrice.toLocaleString('vi-VN')} đ
${discountAmount > 0 ? `• Ưu đãi giảm: -${discountAmount.toLocaleString('vi-VN')} đ (${discountReason || 'Tri ân khách hàng'})\n` : ''}• Tổng thanh toán: ${currentFinalAmount.toLocaleString('vi-VN')} đ
• Địa chỉ: Số 18 Phố Trị Liệu Cổ Truyền, Quận Hoàn Kiếm, Hà Nội
• Hotline hỗ trợ: 0912.345.678
Rất hân hạnh được đón tiếp Quý khách!`;
  };

  const handleCopyMessage = () => {
    const text = generateConfirmationMessage();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Owner duyệt lịch, bổ sung khuyến mại, chốt giá cuối và tạo đơn hàng trạng thái 'accepted' (Doanh thu tạm tính)
  const handleConfirmBookingWithPromo = async () => {
    if (!selectedBooking) return;
    try {
      const res = await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedBooking.id,
          action: "accept",
          discount_amount: discountAmount,
          discount_reason: discountReason,
          final_amount: currentFinalAmount,
        }),
      });
      const d = await res.json();
      if (d.success) {
        setMsg("Đã duyệt lịch hẹn thành công! Đơn hàng chuyển sang 'Đã nhận' và chính thức ghi nhận Doanh thu tạm tính.");
        setConfirmModal(false);
        loadData();
        setTimeout(() => setMsg(null), 4000);
      }
    } catch (err: any) {
      alert("Lỗi: " + err.message);
    }
  };

  // Owner chuyển trạng thái đơn hàng sang 'completed' (Hoàn thành - Doanh thu chính thức)
  const handleCompleteOrder = async (orderId: string) => {
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId, status: "completed" }),
      });
      const d = await res.json();
      if (d.success) {
        setMsg("Đã chốt hoàn thành đơn hàng! Doanh thu chuyển từ Tạm tính sang Chính thức.");
        loadData();
        setTimeout(() => setMsg(null), 3500);
      }
    } catch (err: any) {
      alert("Lỗi: " + err.message);
    }
  };

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
        setMsg("Đã tạo đơn hàng thành công!");
        setOrderModal(false);
        loadData();
        setTimeout(() => setMsg(null), 3500);
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

  // Kiểm tra trùng lịch giữa các booking
  const checkIsSlotConflicted = (b: any) => {
    const sameSlot = bookings.filter(
      (item) => item.id !== b.id && item.booking_date === b.booking_date && item.booking_time === b.booking_time && item.status !== "cancelled"
    );
    return sameSlot.length > 0;
  };

  if (loading) {
    return <div className="p-12 text-center text-sm text-gray-500">Đang tải Owner Dashboard...</div>;
  }

  const officialRev = ordersSummary?.officialRevenue || 0;
  const provisionalRev = ordersSummary?.provisionalRevenue || 0;
  const totalRev = ordersSummary?.totalRecognizedRevenue || 0;
  const ownerTotalShare = ordersSummary?.totalRecognizedOwnerShare || 0;
  const managerTotalShare = ordersSummary?.totalRecognizedManagerShare || 0;

  return (
    <div className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#E8622A]/10 border border-[#E8622A]/30 p-6 sm:p-8 rounded-3xl">
        <div>
          <div className="inline-flex items-center space-x-2 bg-[#E8622A] text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            <User className="w-3.5 h-3.5" />
            <span>Vai Trò: Owner (Quản Lý Dịch Vụ & Vận Hành Cơ Sở)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900">
            Quản Lý Vận Hành & Doanh Thu Cơ Sở Bấm Huyệt
          </h1>
          <p className="text-xs text-gray-600 mt-1">
            Quản lý dịch vụ · Đối chiếu lịch & khuyến mãi · Copy tin nhắn 1-click · Ghi nhận Doanh thu tạm/chính thức.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
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
            className="bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Dịch Vụ Mới</span>
          </button>

          <button
            onClick={() => setOrderModal(true)}
            className="bg-[#E8622A] hover:bg-[#D04F18] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Đơn Hàng Mới</span>
          </button>
        </div>
      </div>

      {msg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{msg}</span>
        </div>
      )}

      {/* KPI Cards: Thể hiện Doanh thu chính thức & Doanh thu tạm tính */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-orange-50 rounded-2xl border border-orange-200 p-6 shadow-sm">
          <div className="text-xs font-bold text-orange-900 uppercase">Owner Nhận Về (70%)</div>
          <div className="text-2xl sm:text-3xl font-black text-orange-700 mt-2">
            {Number(ownerTotalShare).toLocaleString("vi-VN")} đ
          </div>
          <div className="text-[11px] text-orange-800 mt-1">
            Gồm {(ordersSummary?.officialOwnerShare || 0).toLocaleString("vi-VN")}đ chính thức + {(ordersSummary?.provisionalOwnerShare || 0).toLocaleString("vi-VN")}đ tạm tính
          </div>
        </div>

        <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6 shadow-sm">
          <div className="text-xs font-bold text-amber-900 uppercase">Đối Soát Manager (30%)</div>
          <div className="text-2xl sm:text-3xl font-black text-amber-700 mt-2">
            {Number(managerTotalShare).toLocaleString("vi-VN")} đ
          </div>
          <div className="text-[11px] text-amber-800 mt-1">Hạn thanh toán: Ngày 25 hàng tháng</div>
        </div>

        <div className="bg-blue-50 rounded-2xl border border-blue-200 p-6 shadow-sm">
          <div className="text-xs font-bold text-blue-900 uppercase">Doanh Thu Tạm Tính (Đơn Đã Nhận)</div>
          <div className="text-2xl sm:text-3xl font-black text-blue-700 mt-2">
            {Number(provisionalRev).toLocaleString("vi-VN")} đ
          </div>
          <div className="text-[11px] text-blue-800 mt-1">Từ các lịch hẹn đã xác nhận giá</div>
        </div>

        <div className="bg-teal-50 rounded-2xl border border-teal-200 p-6 shadow-sm">
          <div className="text-xs font-bold text-teal-900 uppercase">Doanh Thu Chính Thức (Hoàn Thành)</div>
          <div className="text-2xl sm:text-3xl font-black text-[#1B6B7B] mt-2">
            {Number(officialRev).toLocaleString("vi-VN")} đ
          </div>
          <div className="text-[11px] text-teal-800 mt-1">Khách đã sử dụng & thanh toán</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 space-x-4">
        <button
          onClick={() => setActiveTab("bookings")}
          className={`pb-3 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === "bookings" ? "border-[#E8622A] text-[#E8622A]" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>(1) Lịch Hẹn & Đối Chiếu Trùng Lịch ({bookings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("orders")}
          className={`pb-3 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === "orders" ? "border-[#E8622A] text-[#E8622A]" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>(5) Đơn Hàng & Doanh Thu Tạm/Thật ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("services")}
          className={`pb-3 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === "services" ? "border-[#E8622A] text-[#E8622A]" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>(2) Quản Lý Dịch Vụ Cơ Sở ({services.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("crm")}
          className={`pb-3 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === "crm" ? "border-[#E8622A] text-[#E8622A]" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>(4) Quản Lý Khách Hàng CRM ({customers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("revenue")}
          className={`pb-3 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === "revenue" ? "border-[#E8622A] text-[#E8622A]" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Báo Cáo Đối Soát 30/70</span>
        </button>
      </div>

      {/* TAB 1: LỊCH HẸN & QUY TRÌNH ĐỐI CHIẾU, KHUYẾN MÃI, 1-CLICK COPY */}
      {activeTab === "bookings" && (
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm p-6 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Quy Trình Đối Chiếu Lịch Hẹn, Khuyến Mãi & 1-Click Copy</h2>
            <p className="text-xs text-gray-500 mt-1">
              Owner đối chiếu lịch thủ công (phát hiện trùng lịch) → Thêm khuyến mãi & chốt giá → Copy tin nhắn gửi khách qua kênh riêng → Chuyển sang "Đã nhận" và ghi nhận Doanh thu tạm tính.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                <tr>
                  <th className="p-3">Khách Hàng</th>
                  <th className="p-3">Số ĐT</th>
                  <th className="p-3">Dịch Vụ Chọn</th>
                  <th className="p-3">Ngày & Khung Giờ</th>
                  <th className="p-3">Cảnh Báo Trùng Lịch</th>
                  <th className="p-3">Giá Cuối Cùng</th>
                  <th className="p-3">Trạng Thái</th>
                  <th className="p-3 text-right">Quy Trình Duyệt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bookings.map((b) => {
                  const hasConflict = checkIsSlotConflicted(b);
                  return (
                    <tr key={b.id} className="hover:bg-gray-50/80 transition">
                      <td className="p-3 font-bold text-gray-900">{b.customer_name}</td>
                      <td className="p-3 font-mono">{b.customer_phone}</td>
                      <td className="p-3">{b.service_title || "Bấm Huyệt Trị Liệu"}</td>
                      <td className="p-3 font-semibold text-teal-800">
                        {new Date(b.booking_date).toLocaleDateString("vi-VN")} - {b.booking_time}
                      </td>
                      <td className="p-3">
                        {hasConflict ? (
                          <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                            <AlertTriangle className="w-3 h-3 text-red-600" />
                            TRÙNG GIỜ VỚI KHÁCH KHÁC
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                            <CheckCircle className="w-3 h-3" />
                            Khung giờ hợp lệ
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-extrabold text-[#E8622A]">
                        {b.final_amount
                          ? `${Number(b.final_amount).toLocaleString("vi-VN")} đ`
                          : `${Number(b.service_price || 350000).toLocaleString("vi-VN")} đ`}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            b.status === "accepted"
                              ? "bg-blue-100 text-blue-800"
                              : b.status === "completed"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {b.status === "pending" ? "Chờ duyệt" : b.status === "accepted" ? "Đã nhận (Doanh thu tạm)" : "Hoàn thành"}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {b.status === "pending" && (
                          <button
                            onClick={() => {
                              setSelectedBooking(b);
                              setDiscountAmount(0);
                              setDiscountReason("");
                              setConfirmModal(true);
                            }}
                            className="bg-[#E8622A] hover:bg-[#D04F18] text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm transition"
                          >
                            Duyệt Lịch & Khuyến Mãi
                          </button>
                        )}
                        {b.status === "accepted" && b.confirmation_message && (
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(b.confirmation_message);
                              setMsg("Đã copy tin nhắn xác nhận lịch gửi khách!");
                              setTimeout(() => setMsg(null), 2500);
                            }}
                            className="bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1 ml-auto"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Tin Nhắn 1-Click</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: ĐƠN HÀNG DỊCH VỤ (DOANH THU TẠM & CHÍNH THỨC) */}
      {activeTab === "orders" && (
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Quản Lý Đơn Hàng Dịch Vụ (Doanh Thu Tạm & Chính Thức)</h2>
              <p className="text-xs text-gray-500">
                Đơn hàng ở trạng thái <strong>"Đã nhận"</strong> được ghi nhận Doanh thu tạm tính. Khi khách kết thúc trị liệu, Owner bấm <strong>"Chốt Hoàn Thành"</strong> để chuyển sang Doanh thu chính thức.
              </p>
            </div>
            <button
              onClick={() => setOrderModal(true)}
              className="bg-[#E8622A] hover:bg-[#D04F18] text-white text-xs font-bold px-4 py-2 rounded-xl transition flex items-center gap-1 self-start"
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
                  <th className="p-3">Tổng Tiền</th>
                  <th className="p-3 text-orange-700">Owner (70%)</th>
                  <th className="p-3 text-amber-700">Manager (30%)</th>
                  <th className="p-3">Trạng Thái Doanh Thu</th>
                  <th className="p-3 text-right">Thao Tác</th>
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
                    <td className="p-3">
                      {o.status === "completed" ? (
                        <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                          Chính thức (Hoàn thành)
                        </span>
                      ) : (
                        <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                          Tạm tính (Đã nhận đơn)
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {o.status === "accepted" && (
                        <button
                          onClick={() => handleCompleteOrder(o.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1 rounded-lg transition"
                        >
                          Chốt Hoàn Thành
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

      {/* TAB 3: OWNER QUẢN LÝ DỊCH VỤ */}
      {activeTab === "services" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Danh Mục Dịch Vụ Cơ Sở (Owner Quản Lý)</h2>
              <p className="text-xs text-gray-500">Chủ cơ sở toàn quyền điều chỉnh gói trị liệu, thời lượng và giá niêm yết.</p>
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
              className="bg-[#E8622A] hover:bg-[#D04F18] text-white text-xs font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5"
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
                    <span className="bg-orange-50 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                      {srv.category}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${srv.is_active ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                      {srv.is_active ? "Đang mở bán" : "Tạm ngưng"}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-base">{srv.title}</h3>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">{srv.description}</p>
                  <div className="mt-3 text-xs font-semibold text-gray-500">
                    Thời lượng: {srv.duration_minutes} phút · Giá niêm yết: <strong className="text-[#E8622A]">{Number(srv.price).toLocaleString("vi-VN")} đ</strong>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
                  <button
                    onClick={() => {
                      setEditingService(srv);
                      setServiceModal(true);
                    }}
                    className="text-[#1B6B7B] hover:text-[#134E5E] text-xs font-bold flex items-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Chỉnh Sửa Gói Này</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: CRM KHÁCH HÀNG */}
      {activeTab === "crm" && (
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Hồ Sơ Khách Hàng & Bệnh Sử Trị Liệu (CRM)</h2>
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

      {/* TAB 5: BÁO CÁO ĐỐI SOÁT */}
      {activeTab === "revenue" && (
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm p-6 sm:p-8 space-y-6">
          <h2 className="text-lg font-bold text-gray-900">Báo Cáo Đối Soát Doanh Thu 30/70 & Phân Loại Tạm/Thật</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-blue-200 bg-blue-50/40 p-5 rounded-2xl space-y-3">
              <div className="font-bold text-blue-900 text-sm">Cơ Chế Ghi Nhận Doanh Thu 2 Tầng</div>
              <ul className="text-xs text-gray-700 space-y-2">
                <li>• <strong>Doanh thu tạm tính:</strong> Ghi nhận ngay khi lịch hẹn chuyển trạng thái <code>Đã nhận</code> (sau khi Owner chốt giá cuối).</li>
                <li>• <strong>Doanh thu chính thức:</strong> Ghi nhận khi khách hàng đã thực hiện xong liệu trình và đơn hàng ở trạng thái <code>Hoàn thành</code>.</li>
                <li>• <strong>Đối soát 30%:</strong> Căn cứ vào tổng doanh thu được ghi nhận trong kỳ (hạn 25 hàng tháng).</li>
              </ul>
            </div>

            <div className="border border-amber-200 bg-amber-50/40 p-5 rounded-2xl space-y-3">
              <div className="font-bold text-amber-900 text-sm">Quy Trình Leo Thang Vi Phạm</div>
              <ul className="text-xs text-gray-700 space-y-2">
                <li>• <strong>Hạn thanh toán:</strong> Ngày 25 hàng tháng.</li>
                <li>• <strong>Bước 1:</strong> Hệ thống tự động gửi cảnh báo Telegram cho Owner nếu quá hạn.</li>
                <li>• <strong>Bước 2:</strong> Sau 3 ngày quá hạn (ngày 28) → Hiện popup cảnh báo web.</li>
                <li>• <strong>Bước 3:</strong> Đủ 7 ngày quá hạn → Tự động ngưng hoạt động web.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DUYỆT LỊCH, KHUYẾN MÃI & 1-CLICK COPY */}
      {confirmModal && selectedBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Tag className="w-5 h-5 text-[#E8622A]" />
                <span>Đối Chiếu Lịch, Khuyến Mãi & Chốt Giá</span>
              </h3>
              <button
                onClick={() => setConfirmModal(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Thông tin lịch hẹn */}
            <div className="bg-gray-50 p-4 rounded-2xl space-y-1 text-xs">
              <div><strong>Khách hàng:</strong> {selectedBooking.customer_name} ({selectedBooking.customer_phone})</div>
              <div><strong>Liệu trình:</strong> {selectedBooking.service_title}</div>
              <div><strong>Thời gian:</strong> {selectedBooking.booking_time} ngày {new Date(selectedBooking.booking_date).toLocaleDateString("vi-VN")}</div>
              <div><strong>Ghi chú thể trạng:</strong> {selectedBooking.notes || "Không có"}</div>
            </div>

            {/* Bổ sung chương trình khuyến mãi */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-gray-700 uppercase">
                Bổ Sung Khuyến Mãi / Giảm Giá Cho Khách (Nếu có)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-[11px] text-gray-500 block mb-1">Số tiền giảm (VND)</span>
                  <input
                    type="number"
                    step="10000"
                    placeholder="0"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-gray-500 block mb-1">Lý do khuyến mãi</span>
                  <input
                    type="text"
                    placeholder="Tri ân khách mới / Ưu đãi tuần lễ"
                    value={discountReason}
                    onChange={(e) => setDiscountReason(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Chốt giá cuối */}
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-orange-900 font-semibold">Giá niêm yết: {currentServicePrice.toLocaleString("vi-VN")} đ</div>
                  {discountAmount > 0 && (
                    <div className="text-[11px] text-emerald-700 font-semibold">Giảm giá: -{discountAmount.toLocaleString("vi-VN")} đ</div>
                  )}
                  <div className="text-sm font-black text-[#E8622A] mt-0.5">
                    Giá dịch vụ cuối cùng: {currentFinalAmount.toLocaleString("vi-VN")} đ
                  </div>
                </div>
                <span className="text-[10px] bg-orange-200 text-orange-900 font-bold px-2.5 py-1 rounded-full">
                  Ghi nhận Doanh thu tạm
                </span>
              </div>
            </div>

            {/* Xem trước tin nhắn & Nút Copy 1-Click */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700 flex items-center gap-1">
                  <Share2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Tin Nhắn Xác Nhận Gửi Khách (Zalo / SMS / Messenger)</span>
                </span>
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className={`text-xs font-bold px-3 py-1 rounded-lg transition flex items-center gap-1 ${
                    copied ? "bg-emerald-600 text-white" : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                  }`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Đã Copy Thành Công!" : "Copy 1-Click"}</span>
                </button>
              </div>

              <textarea
                readOnly
                rows={5}
                value={generateConfirmationMessage()}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-mono text-slate-800 focus:outline-none"
              />
            </div>

            {/* Nút hành động */}
            <div className="pt-3 border-t flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setConfirmModal(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-semibold text-gray-700"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleConfirmBookingWithPromo}
                className="px-6 py-2 bg-[#E8622A] hover:bg-[#D04F18] text-white text-xs font-bold rounded-xl shadow-lg transition"
              >
                Xác Nhận & Ghi Nhận Doanh Thu Tạm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TẠO DỊCH VỤ MỚI HOẶC CHỈNH SỬA (OWNER) */}
      {serviceModal && editingService && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editingService.id ? "Chỉnh Sửa Gói Dịch Vụ Cơ Sở" : "Thêm Gói Dịch Vụ Mới"}
            </h3>
            <form onSubmit={handleSaveService} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Tên Dịch Vụ Trị Liệu</label>
                <input
                  type="text"
                  value={editingService.title}
                  onChange={(e) => setEditingService({ ...editingService, title: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Giá Niêm Yết (VND)</label>
                  <input
                    type="number"
                    value={editingService.price}
                    onChange={(e) => setEditingService({ ...editingService, price: parseFloat(e.target.value) })}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Thời Lượng (Phút)</label>
                  <input
                    type="number"
                    value={editingService.duration_minutes}
                    onChange={(e) => setEditingService({ ...editingService, duration_minutes: parseInt(e.target.value, 10) })}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Mô Tả Bài Bấm Huyệt</label>
                <textarea
                  rows={2}
                  value={editingService.description || ""}
                  onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Hiệu Quả Điều Trị</label>
                <textarea
                  rows={2}
                  value={editingService.benefits || ""}
                  onChange={(e) => setEditingService({ ...editingService, benefits: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="srv-active-owner"
                  checked={editingService.is_active}
                  onChange={(e) => setEditingService({ ...editingService, is_active: e.target.checked })}
                  className="rounded text-orange-600"
                />
                <label htmlFor="srv-active-owner" className="text-xs font-semibold text-gray-700">
                  Hiển thị để khách đặt lịch trên website
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
                  className="px-5 py-2 bg-[#E8622A] hover:bg-[#D04F18] rounded-xl text-xs font-bold text-white shadow"
                >
                  Lưu Dịch Vụ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TẠO ĐƠN HÀNG */}
      {orderModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Tạo Đơn Hàng Dịch Vụ</h3>
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

              <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl text-xs space-y-1">
                <div className="font-bold text-orange-900">Chia Sẻ Doanh Thu:</div>
                <div className="flex justify-between">
                  <span>• Owner (70%):</span>
                  <strong className="text-orange-700">{(newOrder.amount * 0.7).toLocaleString("vi-VN")} đ</strong>
                </div>
                <div className="flex justify-between">
                  <span>• Manager (30%):</span>
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
                  Xác Nhận Đơn
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SỬA CRM */}
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
                  Lưu Vào CRM
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
