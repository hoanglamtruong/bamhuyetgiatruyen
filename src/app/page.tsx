import Link from "next/link";
import { pool } from "@/lib/db";
import {
  Calendar,
  ShieldCheck,
  HeartPulse,
  Clock,
  ArrowRight,
  Star,
  Sparkles,
  Tag,
  ChevronRight,
  Leaf,
  Users,
  Award,
  Smile,
  Sparkle,
} from "lucide-react";

export const dynamic = "force-dynamic";

async function getHomeData() {
  const [srvRes, banRes, thmRes] = await Promise.all([
    pool.query("SELECT * FROM services WHERE is_active = true ORDER BY price ASC LIMIT 4;"),
    pool.query("SELECT * FROM banners WHERE is_active = true ORDER BY display_order ASC, created_at DESC;"),
    pool.query("SELECT key, value FROM system_configs WHERE key LIKE 'theme_%';"),
  ]);

  const theme: Record<string, string> = {
    theme_title: "Bấm Huyệt Gia Truyền",
    theme_slogan: "Khơi Thông Kinh Lạc · Trị Liệu Thân Tâm Chuyên Sâu",
    theme_primary_color: "#2D482D",
    theme_accent_color: "#B68D40",
  };
  for (const row of thmRes.rows) {
    theme[row.key] = row.value;
  }

  return {
    services: srvRes.rows,
    banners: banRes.rows,
    theme,
  };
}

export default async function HomePage() {
  const { services, banners, theme } = await getHomeData();

  const primaryColor = theme.theme_primary_color || "#2D482D";
  const accentColor = theme.theme_accent_color || "#B68D40";

  return (
    <div className="bg-[#FAF8F4] text-[#1C271D]">
      {/* 1. HERO SECTION (Tương đồng bố cục ảnh mẫu) */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:py-20 px-4 sm:px-6 lg:px-8 border-b border-[#EAE5DC]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Cột trái: Tiêu đề, giới thiệu, nút hành động, ưu điểm */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center space-x-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#3F633E]">
              <Sparkles className="w-3.5 h-3.5 text-[#B68D40]" />
              <span>RELAX · RENEW · RESTORE · Y HỌC CỔ TRUYỀN BA ĐỜI</span>
            </div>

            <h1 className="font-serif-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#1F3320] leading-[1.15]">
              Trị Liệu & Phục Hồi Thân Tâm{" "}
              <span className="italic font-normal block text-[#2D482D] sm:inline">Dành Riêng Cho Bạn</span>
            </h1>

            <p className="text-sm sm:text-base text-[#4F5E4E] leading-relaxed max-w-xl">
              Bước vào không gian thanh tịnh tĩnh tại, nơi tinh hoa bấm huyệt cổ truyền kết hợp thảo dược gia truyền giúp bạn giải tỏa tận gốc cơn đau mỏi cổ vai gáy, thoát vị cột sống và phục hồi năng lượng sống thuần khiết.
            </p>

            {/* Nút Kêu Gọi Hành Động */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
              <Link
                href="/booking"
                className="inline-flex items-center justify-center space-x-2 bg-[#2D482D] hover:bg-[#203420] text-white text-xs font-bold uppercase tracking-wider px-7 py-3.5 rounded-lg shadow-sm transition transform hover:-translate-y-0.5"
                style={{ backgroundColor: primaryColor }}
              >
                <Calendar className="w-4 h-4" />
                <span>Đặt Lịch Hẹn Ngay</span>
              </Link>
              <Link
                href="/services"
                className="inline-flex items-center justify-center space-x-2 bg-transparent hover:bg-[#2D482D] hover:text-white border border-[#2D482D] text-[#2D482D] text-xs font-bold uppercase tracking-wider px-7 py-3.5 rounded-lg transition"
                style={{ borderColor: primaryColor, color: primaryColor }}
              >
                <span>Khám Phá Dịch Vụ</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* 3 Cam kết / Giá trị dưới nút bấm */}
            <div className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-[#EAE5DC]">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-full bg-[#EDF3EC] text-[#2D482D] flex items-center justify-center flex-shrink-0">
                  <Leaf className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#1F3320]">Liệu Pháp Tự Nhiên</div>
                  <div className="text-[10px] text-[#6E7C6D]">100% Thuần Đông Y An Toàn</div>
                </div>
              </div>

              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-full bg-[#EDF3EC] text-[#2D482D] flex items-center justify-center flex-shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#1F3320]">Lương Y Kinh Nghiệm</div>
                  <div className="text-[10px] text-[#6E7C6D]">Tay nghề dày dạn ba đời</div>
                </div>
              </div>

              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-full bg-[#EDF3EC] text-[#2D482D] flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#1F3320]">Không Gian Thanh Tịnh</div>
                  <div className="text-[10px] text-[#6E7C6D]">Thư thái, vô trùng & yên ả</div>
                </div>
              </div>
            </div>
          </div>

          {/* Cột phải: Hình ảnh trải nghiệm spa / bấm huyệt thư giãn */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-[#EAE5DC]">
              <img
                src="https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=1000&q=80"
                alt="Trị Liệu Bấm Huyệt Gia Truyền Thư Giãn"
                className="w-full h-[420px] sm:h-[480px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
              <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md rounded-2xl p-4 border border-white/40 shadow-lg flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-[#1F3320]">Không gian trị liệu chuẩn Đông Y</div>
                  <div className="text-[11px] text-[#556354]">Hương thảo mộc thiên nhiên & tiếng nhạc thiền</div>
                </div>
                <div className="flex items-center space-x-1 text-[#B68D40]">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-3.5 h-3.5 fill-[#B68D40]" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. PROMO BANNERS (Nếu có banner khuyến mãi) */}
      {banners.length > 0 && (
        <section className="bg-[#FAF8F4] py-6 px-4 sm:px-6 lg:px-8 border-b border-[#EAE5DC]">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {banners.map((ban: any) => (
                <div
                  key={ban.id}
                  className="bg-white rounded-2xl p-5 border border-[#EAE5DC] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start space-x-3">
                    <div className="p-2.5 bg-[#EDF3EC] text-[#2D482D] rounded-xl flex-shrink-0 mt-0.5">
                      <Tag className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="inline-block bg-[#F5EFE6] text-[#B68D40] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider mb-1">
                        Ưu Đãi Đặc Biệt
                      </div>
                      <h3 className="text-sm font-bold text-[#1F3320] leading-snug">{ban.title}</h3>
                      {ban.subtitle && (
                        <p className="text-xs text-[#526051] mt-0.5 leading-relaxed">{ban.subtitle}</p>
                      )}
                    </div>
                  </div>

                  <Link
                    href={ban.link_url || "/booking"}
                    className="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 bg-[#B68D40] hover:bg-[#9E7533] text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition flex-shrink-0"
                  >
                    <span>Nhận Ngay</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 3. OUR SERVICES (Thẻ dịch vụ tròn tâm y hệt mẫu NATURA) */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#3F633E]">
            OUR SERVICES — DỊCH VỤ TRỊ LIỆU
          </div>
          <h2 className="font-serif-heading text-3xl sm:text-4xl font-bold text-[#1F3320]">
            Trị Liệu Toàn Diện Thân & Tâm
          </h2>
          <p className="text-xs sm:text-sm text-[#526051] leading-relaxed">
            Phác đồ xoa bóp, day ấn huyệt gia truyền giúp đả thông kinh mạch tắc nghẽn, giải phóng dây thần kinh chèn ép và tái tạo sinh lực.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((srv: any) => (
            <div
              key={srv.id}
              className="bg-white rounded-2xl border border-[#EAE5DC] shadow-sm hover:shadow-xl transition-all duration-300 p-6 flex flex-col justify-between text-center group"
            >
              <div>
                {/* Vòng tròn biểu tượng sage green */}
                <div className="w-14 h-14 rounded-full bg-[#EDF3EC] text-[#2D482D] group-hover:bg-[#2D482D] group-hover:text-white transition-colors duration-300 flex items-center justify-center mx-auto mb-4 border border-[#D8E6D6]">
                  <Leaf className="w-6 h-6" />
                </div>

                <div className="inline-block text-[10px] font-bold uppercase tracking-wider text-[#B68D40] mb-1">
                  {srv.category}
                </div>

                <h3 className="font-serif-heading text-base font-bold text-[#1F3320] group-hover:text-[#2D482D] transition leading-snug mb-2">
                  {srv.title}
                </h3>

                <p className="text-xs text-[#526051] line-clamp-3 leading-relaxed mb-4">
                  {srv.description}
                </p>
              </div>

              <div className="pt-4 border-t border-[#F2ECE2] space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#788677] flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {srv.duration_minutes} phút
                  </span>
                  <span className="font-bold text-sm text-[#1F3320]">
                    {Number(srv.price).toLocaleString("vi-VN")} đ
                  </span>
                </div>

                <Link
                  href={`/booking?service=${srv.id}`}
                  className="w-full inline-flex items-center justify-center space-x-1 text-xs font-bold uppercase tracking-wider text-[#2D482D] group-hover:text-[#B68D40] transition pt-1"
                >
                  <span>Xem Chi Tiết & Đặt Lịch</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            href="/services"
            className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#2D482D] hover:text-[#B68D40] border-b border-[#2D482D] pb-1 transition"
          >
            <span>Xem tất cả bảng giá & phác đồ trị liệu</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* 4. ABOUT US SECTION (Bố cục 2 cột ảnh phòng Đông Y và cam kết y hệt mẫu) */}
      <section className="bg-white py-20 border-y border-[#EAE5DC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Ảnh phòng trị liệu ấm áp */}
            <div className="lg:col-span-5 relative">
              <div className="rounded-3xl overflow-hidden border border-[#EAE5DC] shadow-xl">
                <img
                  src="https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80"
                  alt="Không Gian Phòng Khám Bấm Huyệt Gia Truyền"
                  className="w-full h-[400px] object-cover"
                />
              </div>
              <div className="absolute -bottom-4 -right-4 bg-[#B68D40] text-white p-4 rounded-2xl shadow-lg text-center hidden sm:block">
                <div className="text-xl font-bold font-serif-heading">15+ Năm</div>
                <div className="text-[10px] uppercase tracking-wider">Kế Thừa Tinh Hoa</div>
              </div>
            </div>

            {/* Nội dung giới thiệu & 3 điểm nổi bật */}
            <div className="lg:col-span-7 space-y-6">
              <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#3F633E]">
                ABOUT US — VỀ CHÚNG TÔI
              </div>

              <h2 className="font-serif-heading text-3xl sm:text-4xl font-bold text-[#1F3320] leading-tight">
                Sức Khỏe & Bình An Của Bạn Là Ưu Tiên Hàng Đầu
              </h2>

              <p className="text-xs sm:text-sm text-[#4F5E4E] leading-relaxed">
                Tại Bấm Huyệt Gia Truyền, chúng tôi tin rằng sự khỏe mạnh dài lâu xuất phát từ sự cân bằng âm dương và dòng khí huyết lưu thông thông suốt. Đội ngũ Lương y và kỹ thuật viên nhiều năm kinh nghiệm kết hợp đôi bàn tay chuẩn xác cùng bài thảo dược lưu truyền ba đời để giải tỏa tận gốc các chứng đau mỏi vai gáy, thoái hóa khớp và mất ngủ kinh niên.
              </p>

              {/* 3 tính năng con */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-[#FAF8F4] border border-[#EAE5DC] text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-[#EDF3EC] text-[#2D482D] flex items-center justify-center mx-auto">
                    <Leaf className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-bold text-[#1F3320]">Thảo Dược Tự Nhiên</div>
                  <div className="text-[10px] text-[#6E7C6D]">100% thảo dược thuần khiết, ngâm chân thuốc bắc</div>
                </div>

                <div className="p-4 rounded-xl bg-[#FAF8F4] border border-[#EAE5DC] text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-[#EDF3EC] text-[#2D482D] flex items-center justify-center mx-auto">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-bold text-[#1F3320]">Vô Trùng & Sạch Sẽ</div>
                  <div className="text-[10px] text-[#6E7C6D]">Khăn ga tiệt trùng, phòng riêng yên tĩnh</div>
                </div>

                <div className="p-4 rounded-xl bg-[#FAF8F4] border border-[#EAE5DC] text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-[#EDF3EC] text-[#2D482D] flex items-center justify-center mx-auto">
                    <HeartPulse className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-bold text-[#1F3320]">Phác Đồ Cá Nhân Hóa</div>
                  <div className="text-[10px] text-[#6E7C6D]">Thăm khám chuẩn xác theo tình trạng bệnh</div>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/contact"
                  className="inline-flex items-center space-x-2 bg-[#2D482D] hover:bg-[#203420] text-white text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-lg shadow-sm transition"
                >
                  <span>Tìm Hiểu Thêm Về Chúng Tôi</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. WHY CHOOSE US (Khối số liệu xanh rừng trầm sang trọng y hệt mẫu) */}
      <section className="bg-[#1E301F] text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-12 space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
              WHY CHOOSE US — SỰ KHÁC BIỆT GIA TRUYỀN
            </div>
            <h3 className="font-serif-heading text-2xl sm:text-3xl font-bold text-white">
              Uy Tín Khẳng Định Qua Từng Liệu Trình
            </h3>
            <p className="text-xs text-[#B4C4B3]">
              Chúng tôi tận tâm mang đến trải nghiệm phục hồi vượt trội, tái tạo thể trạng và bình an tâm hồn.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-[#2D442E]">
            <div className="pt-4 md:pt-0 space-y-2">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mx-auto text-[#D4AF37]">
                <Users className="w-5 h-5" />
              </div>
              <div className="font-serif-heading text-3xl sm:text-4xl font-bold text-white tracking-tight">
                10,000+
              </div>
              <div className="text-xs text-[#B4C4B3] uppercase tracking-wider">Khách Hàng Đã Phục Hồi</div>
            </div>

            <div className="pt-4 md:pt-0 space-y-2">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mx-auto text-[#D4AF37]">
                <Award className="w-5 h-5" />
              </div>
              <div className="font-serif-heading text-3xl sm:text-4xl font-bold text-white tracking-tight">
                15+
              </div>
              <div className="text-xs text-[#B4C4B3] uppercase tracking-wider">Năm Kinh Nghiệm Ba Đời</div>
            </div>

            <div className="pt-4 md:pt-0 space-y-2">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mx-auto text-[#D4AF37]">
                <Leaf className="w-5 h-5" />
              </div>
              <div className="font-serif-heading text-3xl sm:text-4xl font-bold text-white tracking-tight">
                25+
              </div>
              <div className="text-xs text-[#B4C4B3] uppercase tracking-wider">Lương Y & Kỹ Thuật Viên</div>
            </div>

            <div className="pt-4 md:pt-0 space-y-2">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mx-auto text-[#D4AF37]">
                <Smile className="w-5 h-5" />
              </div>
              <div className="font-serif-heading text-3xl sm:text-4xl font-bold text-white tracking-tight">
                99%
              </div>
              <div className="text-xs text-[#B4C4B3] uppercase tracking-wider">Hài Lòng Dứt Cơn Đau</div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. TESTIMONIALS (Đánh giá khách hàng y hệt mẫu) */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#3F633E]">
            TESTIMONIALS — CẢM NHẬN KHÁCH HÀNG
          </div>
          <h2 className="font-serif-heading text-3xl sm:text-4xl font-bold text-[#1F3320]">
            Khách Hàng Nói Gì Về Chúng Tôi
          </h2>
          <p className="text-xs sm:text-sm text-[#526051]">
            Những phản hồi chân thực nhất từ bệnh nhân đã trực tiếp trải nghiệm liệu trình bấm huyệt.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-[#EAE5DC] shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="text-[#B68D40] text-3xl font-serif leading-none">“</div>
              <p className="text-xs text-[#4F5E4E] leading-relaxed italic">
                “Tôi bị thoái hóa đốt sống cổ 4 năm nay, thường xuyên đau buốt nửa đầu và tê bì tay trái. Sau 5 buổi bấm huyệt kết hợp chườm thảo dược tại cơ sở, cổ nhẹ nhõm hẳn, tối ngủ sâu giấc không còn trằn trọc.”
              </p>
            </div>
            <div className="pt-3 border-t border-[#F2ECE2] flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-[#1F3320]">Chị Nguyễn Thị Thu Hà</div>
                <div className="text-[10px] text-[#788677]">Bệnh nhân trị liệu cổ vai gáy</div>
              </div>
              <div className="flex text-[#B68D40]">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-3.5 h-3.5 fill-[#B68D40]" />
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#EAE5DC] shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="text-[#B68D40] text-3xl font-serif leading-none">“</div>
              <p className="text-xs text-[#4F5E4E] leading-relaxed italic">
                “Tay nghề của Lương y cực kỳ chuẩn xác, tìm đúng điểm tắc nghẽn huyệt Kiên Tỉnh và Phong Trì. Bấm tới đâu thấy luồng ấm chạy tới đó. Không gian rất yên tĩnh, thơm mùi thảo dược quế gừng.”
              </p>
            </div>
            <div className="pt-3 border-t border-[#F2ECE2] flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-[#1F3320]">Anh Trần Đình Quang</div>
                <div className="text-[10px] text-[#788677]">Lập trình viên · Đau thắt lưng L4-L5</div>
              </div>
              <div className="flex text-[#B68D40]">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-3.5 h-3.5 fill-[#B68D40]" />
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#EAE5DC] shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="text-[#B68D40] text-3xl font-serif leading-none">“</div>
              <p className="text-xs text-[#4F5E4E] leading-relaxed italic">
                “Gói ngâm chân thuốc bắc bài thuốc 3 đời cùng day ấn phản xạ chân thực sự tuyệt vời. Chân ấm lên và chứng lạnh buốt bàn chân về đêm của tôi đã thuyên giảm rõ rệt. Rất cảm ơn các bác sĩ!”
              </p>
            </div>
            <div className="pt-3 border-t border-[#F2ECE2] flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-[#1F3320]">Bác Vũ Thị Minh Hạnh</div>
                <div className="text-[10px] text-[#788677]">Hội viên cao tuổi · Hà Nội</div>
              </div>
              <div className="flex text-[#B68D40]">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-3.5 h-3.5 fill-[#B68D40]" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. READY TO RELAX? CTA BANNER (Huy hiệu tròn & hình đá massage y hệt mẫu) */}
      <section className="pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#F3EFE6] rounded-3xl border border-[#E2DBD0] p-8 sm:p-12 shadow-md relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            <img
              src="https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=360&q=80"
              alt="Đá Nóng & Hoa Đại Spa Thư Giãn"
              className="w-32 h-32 rounded-2xl object-cover shadow-md border border-white/60"
            />
            <div className="space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#3F633E]">
                READY TO HEAL? — SẴN SÀNG HỒI PHỤC?
              </div>
              <h3 className="font-serif-heading text-2xl sm:text-3xl font-bold text-[#1F3320]">
                Đặt Lịch Khám & Trị Liệu Ngay Hôm Nay
              </h3>
              <p className="text-xs text-[#526051] max-w-md">
                Dành cho chính mình một khoảng lặng để cơ thể được chăm sóc, lắng nghe và phục hồi tận gốc.
              </p>
              <div className="pt-2">
                <Link
                  href="/booking"
                  className="inline-flex items-center space-x-2 bg-[#2D482D] hover:bg-[#203420] text-white text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-lg shadow transition"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Đặt Lịch Hẹn Trực Tuyến</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Con dấu tròn "TỰ CHĂM SÓC LÀ CHĂM SÓC SỨC KHỎE" */}
          <div className="w-32 h-32 rounded-full border-2 border-dashed border-[#B68D40] flex flex-col items-center justify-center p-3 text-center bg-white/70 backdrop-blur-sm shadow-sm flex-shrink-0">
            <Sparkle className="w-5 h-5 text-[#B68D40] mb-1" />
            <div className="text-[10px] font-bold text-[#1F3320] uppercase tracking-wider leading-tight">
              Tự Chăm Sóc Là Sức Khỏe
            </div>
            <div className="text-[8px] text-[#B68D40] mt-0.5 font-serif italic">Y Học Cổ Truyền</div>
          </div>
        </div>
      </section>
    </div>
  );
}
