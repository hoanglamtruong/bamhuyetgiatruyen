"use client";

import { useState } from "react";
import { Phone, MapPin, Clock, MessageSquare, CheckCircle2, AlertCircle, Send } from "lucide-react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, symptoms, notes }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Gửi liên hệ thất bại");

      setSuccess(d.message || "Gửi thông tin thành công!");
      setName("");
      setPhone("");
      setSymptoms("");
      setNotes("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <span className="text-xs font-bold text-[#E8622A] uppercase tracking-wider">Hỗ Trợ & Tư Vấn</span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-1">
          Liên Hệ Bác Sĩ Đông Y & Phòng Khám
        </h1>
        <p className="text-sm text-gray-600 mt-2">
          Nếu bạn chưa biết thể trạng mình phù hợp với phương pháp bấm huyệt nào, hãy để lại thông tin để Lương y chẩn đoán sơ bộ.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Contact info box */}
        <div className="lg:col-span-5 bg-[#1B6B7B] text-white rounded-3xl p-8 shadow-md flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-bold mb-6">Thông Tin Cơ Sở Trị Liệu</h2>

            <div className="space-y-6 text-sm">
              <div className="flex items-start space-x-3">
                <div className="p-2.5 bg-white/10 rounded-xl">
                  <MapPin className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <div className="font-bold text-white">Địa Chỉ Phòng Khám</div>
                  <p className="text-xs text-teal-100 mt-0.5 leading-relaxed">
                    Số 18 Phố Trị Liệu Cổ Truyền, Quận Hoàn Kiếm, Hà Nội
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="p-2.5 bg-white/10 rounded-xl">
                  <Phone className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <div className="font-bold text-white">Hotline Trực Tiếp</div>
                  <p className="text-xs text-teal-100 mt-0.5">0912.345.678 (Tư vấn 24/7)</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="p-2.5 bg-white/10 rounded-xl">
                  <Clock className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <div className="font-bold text-white">Thời Gian Làm Việc</div>
                  <p className="text-xs text-teal-100 mt-0.5">
                    Thứ 2 — Chủ Nhật: 08:00 - 21:00 (Kể cả ngày lễ)
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-teal-600/40 text-xs text-teal-200">
            Cam kết bảo mật tuyệt đối hồ sơ bệnh án và thông tin cá nhân của khách hàng.
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-gray-200/80 shadow-md p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#1B6B7B]" />
            <span>Form Đăng Ký Tư Vấn Bệnh Lý Miễn Phí</span>
          </h2>
          <p className="text-xs text-gray-500 mb-6">
            Bác sĩ Đông Y chuyên khoa sẽ trực tiếp gọi điện phân tích tình trạng huyệt vị cho bạn trong vòng 15 phút.
          </p>

          {success && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start space-x-3 text-emerald-800 text-xs sm:text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">Đã Gửi Thành Công!</div>
                <div className="mt-0.5">{success}</div>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start space-x-3 text-red-800 text-xs sm:text-sm">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">Lỗi:</div>
                <div className="mt-0.5">{error}</div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Họ Và Tên Của Bạn *
                </label>
                <input
                  type="text"
                  placeholder="Nguyễn Văn A"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Số Điện Thoại Liên Hệ *
                </label>
                <input
                  type="tel"
                  placeholder="0912 345 678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Triệu Chứng / Vùng Đau Nhức Hiện Tại
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Đau mỏi thắt lưng, thoái hóa khớp gối, mất ngủ..."
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Ghi Chú Hoặc Câu Hỏi Cần Giải Đáp Thêm
              </label>
              <textarea
                rows={3}
                placeholder="Ví dụ: Đã từng chụp X-quang hoặc đang có vết mổ cũ..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1B6B7B] hover:bg-[#134E5E] text-white font-bold text-sm py-3.5 rounded-xl shadow-md transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{loading ? "Đang gửi..." : "Gửi Yêu Cầu Tư Vấn Ngay"}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
