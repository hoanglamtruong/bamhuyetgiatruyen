"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, Users, DollarSign, ShieldAlert, CheckCircle, XCircle, TrendingUp, Info, Star, X, UserPlus, ShieldCheck } from "lucide-react";

interface AdminUser {
  id: string;
  username: string;
  name: string;
  role: string;
  is_approved: boolean;
  telegram_chat_id: string | null;
  created_at: string;
}

export default function ManagerDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<any>(null);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewStats, setReviewStats] = useState<any>(null);
  const [msg, setMsg] = useState<string | null>(null);

  // Modal cấp tài khoản vận hành riêng
  const [staffModal, setStaffModal] = useState(false);
  const [staffForm, setStaffForm] = useState({
    name: "",
    username: "",
    password: "",
    role: "ADMIN",
    phone: "",
  });
  const [staffSubmitting, setStaffSubmitting] = useState(false);
  const [staffError, setStaffError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const authRes = await fetch("/api/auth/me");
      const authData = await authRes.json();
      if (!authData.user || authData.user.role !== "MANAGER") {
        router.push("/login");
        return;
      }

      const [revRes, admRes, reviewsRes] = await Promise.all([
        fetch("/api/manager/revenue"),
        fetch("/api/manager/admins"),
        fetch("/api/reviews"),
      ]);

      const revData = await revRes.json();
      setRevenueData(revData);

      const admData = await admRes.json();
      if (admData.admins) setAdmins(admData.admins);

      if (reviewsRes.ok) {
        const rData = await reviewsRes.json();
        setReviews(rData.reviews || []);
        setReviewStats(rData.stats || null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleAdminApproval = async (id: string, currentApproved: boolean) => {
    try {
      const res = await fetch("/api/manager/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_approved: !currentApproved }),
      });
      const d = await res.json();
      if (d.success) {
        setMsg(d.message);
        fetchData();
        setTimeout(() => setMsg(null), 3000);
      }
    } catch (err: any) {
      alert("Lỗi: " + err.message);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setStaffSubmitting(true);
    setStaffError(null);
    try {
      const res = await fetch("/api/manager/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_staff",
          ...staffForm,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Không thể cấp tài khoản nhân sự");
      }
      setMsg(data.message);
      setStaffModal(false);
      setStaffForm({ name: "", username: "", password: "", role: "ADMIN", phone: "" });
      fetchData();
      setTimeout(() => setMsg(null), 4000);
    } catch (err: any) {
      setStaffError(err.message);
    } finally {
      setStaffSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-sm text-gray-500">Đang tải dữ liệu Manager...</div>;
  }

  const grandTotal = parseFloat(revenueData?.overall?.grand_total_revenue || "0");
  const managerShare = parseFloat(revenueData?.overall?.grand_manager_share || "0");
  const ownerShare = parseFloat(revenueData?.overall?.grand_owner_share || "0");
  const totalOrders = parseInt(revenueData?.overall?.total_orders || "0", 10);

  return (
    <div className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-amber-500/10 border border-amber-300/60 p-6 rounded-3xl">
        <div>
          <div className="inline-flex items-center space-x-2 bg-amber-500 text-slate-950 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Vai Trò: Manager (Toàn Quyền Hệ Thống & Doanh Thu)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900">
            Giám Sát Doanh Thu & Quản Trị Hệ Thống
          </h1>
          <p className="text-xs text-gray-600 mt-1">
            Mô hình Chia sẻ Doanh thu: Zeebee/Manager hưởng 30% · Đối tác/Owner hưởng 70%. Manager bao gồm đầy đủ chức năng quản trị Admin.
          </p>
        </div>

        {/* Action button to open Admin Center */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <a
            href="/admin"
            className="inline-flex items-center justify-center space-x-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow transition"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Vào Trung Tâm Cấu Hình Admin</span>
          </a>
        </div>
      </div>

      {msg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{msg}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm">
          <div className="text-xs font-semibold text-gray-500 uppercase">Tổng Doanh Thu Ghi Nhận</div>
          <div className="text-2xl sm:text-3xl font-black text-gray-900 mt-2">
            {grandTotal.toLocaleString("vi-VN")} đ
          </div>
          <div className="text-[11px] text-gray-500 mt-1 space-y-0.5">
            <div>Chính thức: <strong>{parseFloat(revenueData?.overall?.grand_official_revenue || "0").toLocaleString("vi-VN")} đ</strong></div>
            <div>Tạm tính: <strong>{parseFloat(revenueData?.overall?.grand_provisional_revenue || "0").toLocaleString("vi-VN")} đ</strong></div>
          </div>
        </div>

        <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6 shadow-sm">
          <div className="text-xs font-bold text-amber-900 uppercase">Phần Manager Hưởng (30%)</div>
          <div className="text-2xl sm:text-3xl font-black text-amber-700 mt-2">
            {managerShare.toLocaleString("vi-VN")} đ
          </div>
          <div className="text-[11px] text-amber-800 mt-1 space-y-0.5">
            <div>Chính thức: <strong>{parseFloat(revenueData?.overall?.grand_official_manager_share || "0").toLocaleString("vi-VN")} đ</strong></div>
            <div>Tạm tính: <strong>{parseFloat(revenueData?.overall?.grand_provisional_manager_share || "0").toLocaleString("vi-VN")} đ</strong></div>
          </div>
        </div>

        <div className="bg-orange-50 rounded-2xl border border-orange-200 p-6 shadow-sm">
          <div className="text-xs font-bold text-orange-900 uppercase">Phần Owner/Khách (70%)</div>
          <div className="text-2xl sm:text-3xl font-black text-orange-700 mt-2">
            {ownerShare.toLocaleString("vi-VN")} đ
          </div>
          <div className="text-xs text-orange-800 mt-1">Thu nhập của cơ sở (đã khấu trừ 30%)</div>
        </div>

        <div className="bg-teal-50 rounded-2xl border border-teal-200 p-6 shadow-sm">
          <div className="text-xs font-bold text-teal-900 uppercase">Quyền Hạn Của Manager</div>
          <div className="text-xl sm:text-2xl font-black text-[#1B6B7B] mt-2">
            Toàn Quyền + Admin
          </div>
          <div className="text-xs text-teal-800 mt-1">Cấu hình theme, banner, leo thang & xem doanh thu</div>
        </div>
      </div>

      {/* Bảng phân bổ theo từng tháng */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-[#1B6B7B]" />
            <h2 className="text-lg font-bold text-gray-900">Báo Cáo Phân Chia Doanh Thu Theo Tháng</h2>
          </div>
          <span className="text-xs text-gray-500">Cập nhật theo thời gian thực</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
              <tr>
                <th className="p-4">Kỳ Tháng</th>
                <th className="p-4">Số Đơn</th>
                <th className="p-4">Tổng Doanh Thu</th>
                <th className="p-4 text-emerald-700">Chính Thức (Completed)</th>
                <th className="p-4 text-sky-700">Tạm Tính (Accepted)</th>
                <th className="p-4 text-amber-700 font-bold">Manager Nhận (30%)</th>
                <th className="p-4 text-orange-700 font-bold">Owner Nhận (70%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {revenueData?.monthly?.map((m: any) => (
                <tr key={m.month_period} className="hover:bg-gray-50/80 transition">
                  <td className="p-4 font-bold text-gray-900">{m.month_period}</td>
                  <td className="p-4 text-gray-600">{m.order_count} đơn</td>
                  <td className="p-4 font-bold text-gray-900">
                    {Number(m.total_revenue).toLocaleString("vi-VN")} đ
                  </td>
                  <td className="p-4 font-semibold text-emerald-700">
                    {Number(m.official_revenue || 0).toLocaleString("vi-VN")} đ
                  </td>
                  <td className="p-4 font-semibold text-sky-700">
                    {Number(m.provisional_revenue || 0).toLocaleString("vi-VN")} đ
                  </td>
                  <td className="p-4 font-extrabold text-amber-700">
                    {Number(m.manager_share).toLocaleString("vi-VN")} đ
                  </td>
                  <td className="p-4 font-bold text-orange-700">
                    {Number(m.owner_share).toLocaleString("vi-VN")} đ
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quản lý & Cấp tài khoản nhân sự vận hành */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Quản Lý & Cấp Riêng Tài Khoản Vận Hành</h2>
              <p className="text-xs text-gray-500">
                Tài khoản nhân sự vận hành (Admin, Owner, Manager) được tạo và cấp riêng bởi Manager.
              </p>
            </div>
          </div>
          <button
            onClick={() => setStaffModal(true)}
            className="inline-flex items-center space-x-2 bg-[#1B6B7B] hover:bg-[#134E5E] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow transition"
          >
            <span>➕ Cấp Tài Khoản Vận Hành Mới</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
              <tr>
                <th className="p-3">Họ Tên</th>
                <th className="p-3">Tài Khoản</th>
                <th className="p-3">Vai Trò</th>
                <th className="p-3">Trạng Thái Phê Duyệt</th>
                <th className="p-3 text-right">Thao Tác Của Manager</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {admins.map((adm) => (
                <tr key={adm.id} className="hover:bg-gray-50/80 transition">
                  <td className="p-3 font-bold text-gray-900">{adm.name}</td>
                  <td className="p-3 font-mono text-gray-600">{adm.username}</td>
                  <td className="p-3">
                    <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-2 py-0.5 rounded">
                      {adm.role}
                    </span>
                  </td>
                  <td className="p-3">
                    {adm.is_approved ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-xs font-semibold">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Đã Phê Duyệt
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full text-xs font-semibold">
                        <XCircle className="w-3.5 h-3.5" />
                        Chờ Manager Duyệt
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleToggleAdminApproval(adm.id, adm.is_approved)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition shadow-sm ${
                        adm.is_approved
                          ? "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
                          : "bg-emerald-600 text-white hover:bg-emerald-700"
                      }`}
                    >
                      {adm.is_approved ? "Thu Hồi Duyệt" : "Phê Duyệt Ngay"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* 3. Giám sát chất lượng & Đánh giá dịch vụ toàn hệ thống */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              <span>Giám Sát Chất Lượng & Đánh Giá Dịch Vụ ({reviews.length})</span>
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Phản hồi thực tế từ khách hàng giúp Zeebee Manager theo dõi chất lượng tay nghề và độ hài lòng trị liệu.
            </p>
          </div>
          <div className="flex items-center space-x-3 bg-amber-50/70 border border-amber-200 p-2.5 px-4 rounded-2xl">
            <div>
              <div className="text-[10px] text-gray-500">Điểm Đánh Giá TB</div>
              <div className="text-lg font-black text-amber-600 flex items-center gap-1">
                <span>{reviewStats?.avgRating || "5.0"}</span>
                <Star className="w-4 h-4 fill-amber-500 text-amber-500 inline" />
              </div>
            </div>
            <div className="border-l border-amber-200 pl-3">
              <div className="text-[10px] text-gray-500">Tổng Lượt</div>
              <div className="text-lg font-black text-gray-900">{reviews.length}</div>
            </div>
          </div>
        </div>

        {reviews.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-xs">
            Chưa có đánh giá nào từ khách hàng trên hệ thống.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {reviews.map((r: any) => (
              <div key={r.id} className="py-4 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-gray-900 text-sm">{r.customer_name}</span>
                    <span className="text-xs font-mono text-gray-500">({r.customer_phone})</span>
                    <span className="text-xs bg-teal-50 text-teal-800 border border-teal-100 px-2 py-0.5 rounded-full font-medium">
                      {r.service_title}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${s <= r.rating ? "text-amber-500 fill-amber-500" : "text-gray-200"}`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-amber-700">{r.rating}/5</span>
                    <span className="text-xs text-gray-400">• {new Date(r.created_at).toLocaleDateString("vi-VN")}</span>
                  </div>
                </div>

                {r.health_improvement_notes && (
                  <div className="p-2.5 bg-emerald-50/70 border border-emerald-100 rounded-xl text-xs text-emerald-900">
                    <span className="font-bold text-emerald-800 mr-1">🩺 Tiến triển bệnh lý:</span>
                    <span className="italic">{r.health_improvement_notes}</span>
                  </div>
                )}

                {r.comment && (
                  <div className="text-xs text-gray-700 pl-1">
                    <span className="font-semibold text-gray-900">Nhận xét: </span>
                    {r.comment}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Cấp Tài Khoản Nhân Sự Vận Hành Riêng */}
      {staffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative">
            <button
              onClick={() => {
                setStaffModal(false);
                setStaffError(null);
              }}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 bg-teal-50 text-[#1B6B7B] rounded-2xl">
                <UserPlus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900">Cấp Tài Khoản Vận Hành Mới</h3>
                <p className="text-xs text-gray-500">Cấp riêng cho Admin, Owner hoặc Manager nội bộ</p>
              </div>
            </div>

            <div className="mb-4 p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-[11px] text-amber-900">
              ℹ️ <strong>Cơ chế bảo mật:</strong> Cổng đăng ký công khai chỉ dành cho Khách Hàng. Mọi tài khoản nhân sự vận hành được phân quyền và cấp phát riêng tại đây.
            </div>

            {staffError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{staffError}</span>
              </div>
            )}

            <form onSubmit={handleCreateStaff} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Họ Và Tên Nhân Sự *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Lương y Nguyễn Văn A"
                  value={staffForm.name}
                  onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Tên Đăng Nhập *</label>
                  <input
                    type="text"
                    required
                    placeholder="vd: owner2, admin_tech"
                    value={staffForm.username}
                    onChange={(e) => setStaffForm({ ...staffForm, username: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2 text-xs font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Mật Khẩu Ban Đầu *</label>
                  <input
                    type="password"
                    required
                    placeholder="Mật khẩu tối thiểu"
                    value={staffForm.password}
                    onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Vai Trò Phân Quyền *</label>
                  <select
                    value={staffForm.role}
                    onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2 text-xs font-bold text-[#1B6B7B] focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="ADMIN">ADMIN (Kỹ Thuật Viên - Cấu Hình Theme)</option>
                    <option value="OWNER">OWNER (Chủ Cơ Sở - Quản Lý Dịch Vụ & Khách)</option>
                    <option value="MANAGER">MANAGER (Quản Lý Doanh Thu Zeebee 30%)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Số Điện Thoại Liên Hệ</label>
                  <input
                    type="tel"
                    placeholder="09..."
                    value={staffForm.phone}
                    onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setStaffModal(false);
                    setStaffError(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={staffSubmitting}
                  className="inline-flex items-center space-x-2 bg-[#1B6B7B] hover:bg-[#134E5E] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow transition disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{staffSubmitting ? "Đang xử lý..." : "Cấp Tài Khoản Ngay"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
