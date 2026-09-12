"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ShieldX, Clock, Calendar, CheckCircle } from "lucide-react";

interface EscalationData {
  isSuspended: boolean;
  suspensionReason: string;
  suspensionBranch: string;
  step: number;
  warningDate: string | null;
  popupMessage: string | null;
}

export default function EscalationBanner() {
  const [data, setData] = useState<EscalationData | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch("/api/escalation")
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch(() => {});
  }, []);

  if (!data) return null;

  // Bước 3: Web đã ngưng hoạt động
  if (data.isSuspended) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/95 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-lg w-full p-8 text-center shadow-2xl border-4 border-red-500">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldX className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">HỆ THỐNG ĐÃ TẠM NGƯNG HOẠT ĐỘNG</h2>
          <div className="inline-block bg-red-100 text-red-800 font-semibold px-3 py-1 rounded-full text-xs mb-4">
            Cơ Chế Leo Thang: BƯỚC 3 (Đình chỉ hoàn toàn)
          </div>
          <p className="text-gray-600 text-sm mb-6 leading-relaxed">
            {data.suspensionReason || "Hệ thống tạm ngưng do vi phạm điều khoản hợp đồng hoặc trễ thanh toán doanh thu."}
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 text-left mb-6 space-y-1">
            <div className="font-semibold text-amber-950">Hướng dẫn khắc phục:</div>
            <div>• Vui lòng liên hệ Trưởng ban quản lý Zeebee (Manager) để hoàn tất đối soát và nghĩa vụ tài chính.</div>
            <div>• Sau khi giải quyết vi phạm, Admin/Manager sẽ duyệt mở lại quyền truy cập nền tảng.</div>
          </div>
          <div className="text-xs text-gray-400">
            Nền tảng Bấm Huyệt Gia Truyền · Hệ thống Zeebee Revenue Share
          </div>
        </div>
      </div>
    );
  }

  // Bước 2: Popup cảnh báo trên web kèm ngày cụ thể sẽ ngưng hoạt động
  if (data.step === 2 && !dismissed) {
    return (
      <div className="fixed inset-x-0 top-16 z-30 bg-amber-500 text-slate-950 px-4 py-3 shadow-lg border-b-2 border-amber-600 animate-pulse-slow">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-600 text-white rounded-lg">
              <AlertTriangle className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <div className="font-bold text-sm tracking-tight flex items-center gap-2">
                <span>⚠️ CẢNH BÁO LEO THANG · BƯỚC 2</span>
                <span className="bg-slate-900 text-amber-400 text-[10px] font-extrabold px-2 py-0.5 rounded">
                  HẠN CUỐI: {data.warningDate || "Trong 7 ngày"}
                </span>
              </div>
              <p className="text-xs font-medium text-slate-900 mt-0.5">
                {data.popupMessage || `Hệ thống sẽ TỰ ĐỘNG NGƯNG HOẠT ĐỘNG vào ngày ${data.warningDate} nếu chưa hoàn tất khắc phục.`}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 self-end sm:self-center">
            <a
              href="/owner/revenue"
              className="bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold text-xs px-3 py-1.5 rounded-md shadow transition"
            >
              Xem Chi Tiết Nghĩa Vụ
            </a>
            <button
              onClick={() => setDismissed(true)}
              className="text-xs font-bold text-slate-800 hover:text-slate-950 px-2 py-1"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
