"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, AlertTriangle, Clock, CheckCircle2, DollarSign } from "lucide-react";

export default function OwnerRevenuePage() {
  const [escalation, setEscalation] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetch("/api/escalation"), fetch("/api/orders")])
      .then(async ([escRes, ordRes]) => {
        setEscalation(await escRes.json());
        setOrders((await ordRes.json()).orders || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-12 text-center text-sm text-gray-500">Đang tải dữ liệu...</div>;
  }

  const unpaidRevenue = escalation?.paymentBranch?.unpaidRevenue || 0;
  const managerShare = escalation?.paymentBranch?.managerShare || 0;
  const ownerShare = unpaidRevenue - managerShare;

  return (
    <div className="py-12 max-w-4xl mx-auto px-4 sm:px-6">
      <Link
        href="/owner"
        className="inline-flex items-center space-x-2 text-xs font-bold text-gray-500 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Quay lại Trang Chủ Owner</span>
      </Link>

      <div className="space-y-6">
        {/* Banner tình trạng */}
        <div className="bg-amber-500 text-slate-950 p-6 sm:p-8 rounded-3xl shadow-lg border border-amber-600">
          <div className="flex items-center space-x-3 mb-2">
            <AlertTriangle className="w-8 h-8" />
            <h1 className="text-2xl font-black">Nghĩa Vụ Đối Soát & Thanh Toán Doanh Thu 30%</h1>
          </div>
          <p className="text-xs sm:text-sm font-medium mt-1">
            Theo hợp đồng hợp tác chia sẻ doanh thu giữa Cơ Sở Bấm Huyệt Gia Truyền và Zeebee Management:
          </p>
          <div className="mt-4 pt-4 border-t border-amber-600/60 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <div className="text-[11px] uppercase font-bold text-slate-900">Doanh Thu Tháng Hiện Tại</div>
              <div className="text-xl font-black mt-0.5">{Number(unpaidRevenue).toLocaleString("vi-VN")} đ</div>
            </div>
            <div>
              <div className="text-[11px] uppercase font-bold text-slate-900">Phần Owner Thực Hưởng (70%)</div>
              <div className="text-xl font-black text-slate-900 mt-0.5">{Number(ownerShare).toLocaleString("vi-VN")} đ</div>
            </div>
            <div>
              <div className="text-[11px] uppercase font-bold text-amber-950">Phải Thanh Toán Manager (30%)</div>
              <div className="text-2xl font-black text-amber-950 mt-0.5">{Number(managerShare).toLocaleString("vi-VN")} đ</div>
            </div>
          </div>
        </div>

        {/* Các mốc leo thang cụ thể */}
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm p-6 sm:p-8 space-y-6">
          <h2 className="text-lg font-bold text-gray-900">Mốc Thời Gian & Quy Trình Leo Thang Vi Phạm</h2>

          <div className="space-y-4">
            <div className="flex items-start space-x-4 p-4 rounded-2xl bg-gray-50 border border-gray-200">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-xs flex-shrink-0">
                1
              </div>
              <div>
                <div className="font-bold text-sm text-gray-900">Hạn Thanh Toán Định Kỳ: Ngày 25 Hàng Tháng</div>
                <p className="text-xs text-gray-600 mt-0.5">
                  Chủ cơ sở chốt số liệu đối soát và thực hiện chuyển khoản 30% doanh thu cho Quản lý (Zeebee). Nếu chưa hoàn tất, hệ thống tự động kích hoạt Bước 1 (Gửi cảnh báo Telegram).
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-4 rounded-2xl bg-amber-50 border border-amber-200">
              <div className="w-8 h-8 rounded-full bg-amber-200 text-amber-900 font-bold flex items-center justify-center text-xs flex-shrink-0">
                2
              </div>
              <div>
                <div className="font-bold text-sm text-amber-900">Bước 2: Cảnh Báo Popup Web (Sau 3 ngày quá hạn · Ngày 28)</div>
                <p className="text-xs text-amber-800 mt-0.5">
                  Xuất hiện popup cảnh báo toàn hệ thống kèm theo ngày cụ thể sẽ bị đình chỉ hoạt động hoàn toàn.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-4 rounded-2xl bg-red-50 border border-red-200">
              <div className="w-8 h-8 rounded-full bg-red-100 text-red-800 font-bold flex items-center justify-center text-xs flex-shrink-0">
                3
              </div>
              <div>
                <div className="font-bold text-sm text-red-900">Bước 3: Ngưng Hoạt Động Hoàn Toàn (Đủ 7 ngày quá hạn · Ngày 02 tháng sau)</div>
                <p className="text-xs text-red-800 mt-0.5">
                  Web tự động khoá hoàn toàn toàn bộ 5 tính năng (đặt lịch, giới thiệu, xem dịch vụ, liên hệ, quản lý). Khách hàng truy cập sẽ thấy thông báo tạm ngưng dịch vụ.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-500 mb-3">
              Mọi thắc mắc về đối soát hoặc cần gia hạn, vui lòng liên hệ Trưởng ban quản lý Zeebee.
            </p>
            <div className="inline-block bg-teal-50 text-[#1B6B7B] font-bold text-xs px-4 py-2 rounded-xl">
              Hotline Quản Lý Zeebee: 0912.345.678 (Kênh đối soát 24/7)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
