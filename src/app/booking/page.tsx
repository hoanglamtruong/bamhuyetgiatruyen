"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Calendar, Clock, User, Phone, FileText, CheckCircle2, AlertCircle } from "lucide-react";

interface Service {
  id: string;
  title: string;
  price: number;
  duration_minutes: number;
  category: string;
}

function BookingForm() {
  const searchParams = useSearchParams();
  const preSelectedService = searchParams.get("service") || "";

  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState(preSelectedService);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("09:00");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/services")
      .then((res) => res.json())
      .then((d) => {
        if (d.services) {
          setServices(d.services);
          if (!selectedService && d.services.length > 0) {
            setSelectedService(d.services[0].id);
          }
        }
      })
      .catch(() => {});

    // Default booking date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setBookingDate(tomorrow.toISOString().split("T")[0]);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: customerName,
          customer_phone: customerPhone,
          service_id: selectedService,
          booking_date: bookingDate,
          booking_time: bookingTime,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Có lỗi xảy ra khi đặt lịch");
      }

      setSuccessMsg(`Đặt lịch thành công! Mã hẹn của quý khách: #${data.id}. Kỹ thuật viên sẽ liên hệ xác nhận trước 30 phút.`);
      setCustomerName("");
      setCustomerPhone("");
      setNotes("");
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const timeSlots = [
    "08:30", "09:00", "09:30", "10:00", "10:30", "11:00",
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
    "17:00", "17:30", "18:00", "18:30", "19:00", "19:30"
  ];

  return (
    <div className="py-12 max-w-3xl mx-auto px-4 sm:px-6">
      <div className="text-center mb-10">
        <span className="text-xs font-bold text-[#E8622A] uppercase tracking-wider">Đặt Chỗ Trước</span>
        <h1 className="text-3xl font-extrabold text-gray-900 mt-1">Đặt Lịch Bấm Huyệt Trị Liệu</h1>
        <p className="text-xs sm:text-sm text-gray-600 mt-2">
          Vui lòng điền thông tin để phòng khám sắp xếp Lương y tay nghề cao phục vụ riêng cho bạn.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-md p-6 sm:p-10">
        {successMsg && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start space-x-3 text-emerald-800 text-xs sm:text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Xác Nhận Thành Công!</div>
              <div className="mt-0.5">{successMsg}</div>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start space-x-3 text-red-800 text-xs sm:text-sm">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Lỗi Đặt Lịch:</div>
              <div className="mt-0.5">{errorMsg}</div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Chọn dịch vụ */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
              1. Chọn Gói Dịch Vụ Trị Liệu
            </label>
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              required
            >
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title} — {Number(s.price).toLocaleString("vi-VN")} đ ({s.duration_minutes} phút)
                </option>
              ))}
            </select>
          </div>

          {/* Chọn Ngày & Giờ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#1B6B7B]" />
                <span>2. Chọn Ngày Trị Liệu</span>
              </label>
              <input
                type="date"
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#1B6B7B]" />
                <span>3. Chọn Khung Giờ</span>
              </label>
              <select
                value={bookingTime}
                onChange={(e) => setBookingTime(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                required
              >
                {timeSlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Thông tin khách hàng */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#1B6B7B]" />
                <span>4. Họ Và Tên Bạn</span>
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Nguyễn Văn An"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#1B6B7B]" />
                <span>5. Số Điện Thoại</span>
              </label>
              <input
                type="tel"
                placeholder="0912 345 678"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Ghi chú triệu chứng bệnh */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#1B6B7B]" />
              <span>6. Mô Tả Tình Trạng Cơ Thể / Huyệt Đạo Cần Chú Ý</span>
            </label>
            <textarea
              rows={3}
              placeholder="Ví dụ: Đau mỏi đốt sống cổ lan sang vai trái, thường nhức buốt khi ngủ dậy..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#E8622A] hover:bg-[#D04F18] text-white font-extrabold text-base py-4 rounded-xl shadow-lg hover:shadow-xl transition flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <Calendar className="w-5 h-5" />
            <span>{loading ? "Đang xử lý..." : "Xác Nhận Đặt Lịch Hẹn Ngay"}</span>
          </button>
        </form>
      </div>
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm text-gray-500">Đang tải form đặt lịch...</div>}>
      <BookingForm />
    </Suspense>
  );
}
