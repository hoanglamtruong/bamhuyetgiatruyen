"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, Users, DollarSign, ShieldAlert, CheckCircle, XCircle, TrendingUp, Info } from "lucide-react";

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
  const [msg, setMsg] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const authRes = await fetch("/api/auth/me");
      const authData = await authRes.json();
      if (!authData.user || authData.user.role !== "MANAGER") {
        router.push("/login");
        return;
      }

      const revRes = await fetch("/api/manager/revenue");
      const revData = await revRes.json();
      setRevenueData(revData);

      const admRes = await fetch("/api/manager/admins");
      const admData = await admRes.json();
      if (admData.admins) setAdmins(admData.admins);
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
            <span>Vai Trò: Manager (Zeebee)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900">
            Giám Sát Doanh Thu Tổng Hợp Toàn Hệ Thống
          </h1>
          <p className="text-xs text-gray-600 mt-1">
            Mô hình Chia sẻ Doanh thu: Zeebee/Manager hưởng 30% · Đối tác/Owner hưởng 70%.
          </p>
        </div>

        {/* Rule note */}
        <div className="bg-white p-3.5 rounded-2xl border border-amber-200 text-xs text-gray-700 max-w-sm flex items-start space-x-2.5 shadow-sm">
          <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="leading-snug text-[11px]">
            <strong>Nguyên tắc phân quyền:</strong> Manager toàn quyền xem số liệu doanh thu và phê duyệt nhân sự Admin; <em>không can thiệp thao tác vận hành hàng ngày</em> trên 5 tính năng (đặt lịch, dịch vụ, crm).
          </p>
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
          <div className="text-xs font-semibold text-gray-500 uppercase">Tổng Doanh Thu Hệ Thống</div>
          <div className="text-2xl sm:text-3xl font-black text-gray-900 mt-2">
            {grandTotal.toLocaleString("vi-VN")} đ
          </div>
          <div className="text-xs text-gray-500 mt-1">{totalOrders} đơn hàng hoàn tất</div>
        </div>

        <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6 shadow-sm">
          <div className="text-xs font-bold text-amber-900 uppercase">Phần Manager Hưởng (30%)</div>
          <div className="text-2xl sm:text-3xl font-black text-amber-700 mt-2">
            {managerShare.toLocaleString("vi-VN")} đ
          </div>
          <div className="text-xs text-amber-800 mt-1">Thu về ngày 25 hàng tháng</div>
        </div>

        <div className="bg-orange-50 rounded-2xl border border-orange-200 p-6 shadow-sm">
          <div className="text-xs font-bold text-orange-900 uppercase">Phần Owner/Khách (70%)</div>
          <div className="text-2xl sm:text-3xl font-black text-orange-700 mt-2">
            {ownerShare.toLocaleString("vi-VN")} đ
          </div>
          <div className="text-xs text-orange-800 mt-1">Thu nhập giữ lại của cơ sở</div>
        </div>

        <div className="bg-teal-50 rounded-2xl border border-teal-200 p-6 shadow-sm">
          <div className="text-xs font-bold text-teal-900 uppercase">Tỷ Lệ Đối Soát</div>
          <div className="text-2xl sm:text-3xl font-black text-[#1B6B7B] mt-2">
            30% / 70%
          </div>
          <div className="text-xs text-teal-800 mt-1">Cố định theo hợp đồng hợp tác</div>
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
                <th className="p-4">Số Đơn Hàng</th>
                <th className="p-4">Tổng Doanh Thu</th>
                <th className="p-4 text-amber-700">Manager Nhận (30%)</th>
                <th className="p-4 text-orange-700">Owner Nhận (70%)</th>
                <th className="p-4">Trạng Thái Kỳ</th>
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
                  <td className="p-4 font-extrabold text-amber-700">
                    {Number(m.manager_share).toLocaleString("vi-VN")} đ
                  </td>
                  <td className="p-4 font-bold text-orange-700">
                    {Number(m.owner_share).toLocaleString("vi-VN")} đ
                  </td>
                  <td className="p-4">
                    <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                      Đã ghi nhận
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Phê duyệt nhân sự Admin */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm p-6 sm:p-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Phê Duyệt Nhân Sự Admin Kỹ Thuật</h2>
            <p className="text-xs text-gray-500">
              Chỉ những tài khoản Admin được Manager cấp duyệt mới có quyền đăng nhập cấu hình hệ thống.
            </p>
          </div>
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
    </div>
  );
}
