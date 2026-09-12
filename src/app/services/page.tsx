import Link from "next/link";
import { pool } from "@/lib/db";
import { Clock, Calendar, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

async function getAllServices() {
  const res = await pool.query("SELECT * FROM services WHERE is_active = true ORDER BY price ASC;");
  return res.rows;
}

export default async function ServicesPage() {
  const services = await getAllServices();

  return (
    <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <span className="text-xs font-bold text-[#E8622A] uppercase tracking-wider">Danh Mục Liệu Trình</span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-1">
          Dịch Vụ Bấm Huyệt & Trị Liệu Đông Y Gia Truyền
        </h1>
        <p className="text-sm text-gray-600 mt-3">
          Tất cả liệu trình được thiết kế bài bản theo nguyên lý ngũ hành tương sinh, cân bằng âm dương và đã giúp hàng ngàn bệnh nhân phục hồi thể trạng.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {services.map((srv: any) => (
          <div
            key={srv.id}
            className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 sm:p-8 flex flex-col justify-between hover:border-teal-400 transition"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="bg-teal-50 text-[#1B6B7B] font-bold text-xs px-3 py-1 rounded-full">
                  {srv.category}
                </span>
                <div className="flex items-center space-x-1.5 text-xs text-gray-500 font-medium">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span>{srv.duration_minutes} phút</span>
                </div>
              </div>

              <h2 className="text-xl font-bold text-gray-900 mb-3">{srv.title}</h2>
              <p className="text-xs text-gray-600 leading-relaxed mb-4">{srv.description}</p>

              {srv.benefits && (
                <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-3 mb-6">
                  <div className="text-xs font-bold text-emerald-900 flex items-center gap-1.5 mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Hiệu quả trị liệu:</span>
                  </div>
                  <p className="text-xs text-emerald-800 leading-relaxed">{srv.benefits}</p>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-gray-400 uppercase font-semibold">Giá trọn gói</div>
                <div className="text-2xl font-black text-[#E8622A]">
                  {Number(srv.price).toLocaleString("vi-VN")} đ
                </div>
              </div>
              <Link
                href={`/booking?service=${srv.id}`}
                className="inline-flex items-center space-x-2 bg-[#1B6B7B] hover:bg-[#134E5E] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow transition"
              >
                <Calendar className="w-4 h-4" />
                <span>Đặt Lịch Ngay</span>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
