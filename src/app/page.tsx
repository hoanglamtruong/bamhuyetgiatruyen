import Link from "next/link";
import { pool } from "@/lib/db";
import { Calendar, ShieldCheck, HeartPulse, Clock, ArrowRight, Star, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

async function getServices() {
  const res = await pool.query("SELECT * FROM services WHERE is_active = true ORDER BY price ASC LIMIT 4;");
  return res.rows;
}

export default async function HomePage() {
  const services = await getServices();

  return (
    <div>
      {/* HERO SECTION */}
      <section className="relative bg-gradient-to-b from-[#1B6B7B] to-[#134E5E] text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20 text-xs font-semibold tracking-wide uppercase text-teal-100">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Tinh Hoa Đông Y Trị Liệu Ba Đời Gia Truyền</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
            Khơi Thông Kinh Lạc · <br className="hidden sm:inline" />
            <span className="text-[#E8622A]">Đẩy Lùi Đau Nhức Cổ Vai Gáy</span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-teal-100 font-normal leading-relaxed">
            Phương pháp bấm huyệt chuẩn xác theo đồ hình kinh lạc kết hợp thảo dược cổ truyền. 
            Giải tỏa tức thì chèn ép thần kinh, thoái hóa cột sống, mất ngủ và đau nửa đầu.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/booking"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-[#E8622A] hover:bg-[#D04F18] text-white font-bold px-8 py-3.5 rounded-xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-0.5 text-base"
            >
              <Calendar className="w-5 h-5" />
              <span>Đặt Lịch Khám & Trị Liệu Ngay</span>
            </Link>
            <Link
              href="/services"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold px-8 py-3.5 rounded-xl transition text-base"
            >
              <span>Xem Bảng Giá Dịch Vụ</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto pt-10 border-t border-teal-600/40 text-center">
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-300">10,000+</div>
              <div className="text-xs text-teal-200 mt-1">Lượt khách trị liệu</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-300">98%</div>
              <div className="text-xs text-teal-200 mt-1">Hài lòng dứt cơn đau</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-300">15 Năm</div>
              <div className="text-xs text-teal-200 mt-1">Kinh nghiệm gia truyền</div>
            </div>
          </div>
        </div>
      </section>

      {/* CORE HIGHLIGHTS */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Dịch Vụ Trị Liệu Bấm Huyệt Tiêu Biểu
          </h2>
          <p className="text-sm text-gray-600 mt-2">
            Được thực hiện trực tiếp bởi các Lương y và kỹ thuật viên y học cổ truyền dày dạn kinh nghiệm.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((srv: any) => (
            <div
              key={srv.id}
              className="bg-white rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition p-6 flex flex-col justify-between group"
            >
              <div>
                <span className="inline-block bg-teal-50 text-[#1B6B7B] font-semibold text-[11px] px-2.5 py-1 rounded-full uppercase tracking-wider mb-3">
                  {srv.category}
                </span>
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#1B6B7B] transition leading-snug mb-2">
                  {srv.title}
                </h3>
                <p className="text-xs text-gray-600 line-clamp-3 mb-4 leading-relaxed">
                  {srv.description}
                </p>
                <div className="flex items-center space-x-2 text-xs text-gray-500 mb-4">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span>Thời lượng: {srv.duration_minutes} phút</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-gray-500 uppercase font-medium">Chi phí liệu trình</div>
                  <div className="text-lg font-extrabold text-[#E8622A]">
                    {Number(srv.price).toLocaleString("vi-VN")} đ
                  </div>
                </div>
                <Link
                  href={`/booking?service=${srv.id}`}
                  className="bg-[#1B6B7B] hover:bg-[#134E5E] text-white p-2.5 rounded-xl shadow transition"
                  title="Đặt lịch"
                >
                  <Calendar className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link
            href="/services"
            className="inline-flex items-center space-x-2 text-sm font-bold text-[#1B6B7B] hover:text-[#134E5E] group"
          >
            <span>Khám phá tất cả các gói trị liệu chuyên sâu</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
          </Link>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="bg-white py-16 border-y border-gray-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-teal-50 text-[#1B6B7B] rounded-2xl">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-base font-bold text-gray-900">Bấm Huyệt Chuẩn Xác 100%</h4>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                  Tác động trực tiếp vào các huyệt vị quan yếu như Phong Trì, Kiên Tỉnh, Thận Du để giải phóng kinh lạc bị tắc nghẽn.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="p-3 bg-amber-50 text-[#E8622A] rounded-2xl">
                <HeartPulse className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-base font-bold text-gray-900">Không Dùng Thuốc Hay Tiêm</h4>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                  Kích hoạt cơ chế tự phục hồi tự nhiên của cơ thể qua tuần hoàn máu và tái tạo năng lượng sinh học.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="p-3 bg-blue-50 text-blue-700 rounded-2xl">
                <Star className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-base font-bold text-gray-900">Dược Liệu Gia Truyền Độc Quyền</h4>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                  Kết hợp tinh dầu xoa bóp và thảo dược ngâm chân bí truyền 3 đời giúp thẩm thấu sâu, giữ ấm cơ khớp.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CALL TO ACTION */}
      <section className="py-16 max-w-5xl mx-auto px-4 text-center">
        <div className="bg-[#1B6B7B] rounded-3xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden">
          <h2 className="text-3xl font-extrabold">Đừng Để Đau Mỏi Làm Gián Đoạn Cuộc Sống</h2>
          <p className="text-teal-100 text-sm max-w-xl mx-auto mt-3">
            Đặt lịch hẹn trước để được phục vụ chu đáo nhất mà không cần chờ đợi.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/booking"
              className="bg-[#E8622A] hover:bg-[#D04F18] text-white font-bold px-8 py-3 rounded-xl shadow-lg transition"
            >
              Đặt Lịch Hẹn Ngay
            </Link>
            <Link
              href="/contact"
              className="bg-white text-[#1B6B7B] hover:bg-gray-100 font-bold px-8 py-3 rounded-xl transition"
            >
              Gửi Y Cầu Tư Vấn Bệnh Lý
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
