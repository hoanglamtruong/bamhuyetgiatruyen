import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import EscalationBanner from "@/components/EscalationBanner";

export const metadata: Metadata = {
  title: "Bấm Huyệt Gia Truyền — Nền Tảng Bán Hàng & Trị Liệu Đông Y",
  description: "Trị liệu đông y gia truyền cổ truyền, xoa bóp bấm huyệt thông kinh hoạt lạc, giải phóng cơn đau cổ vai gáy và cột sống.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="min-h-screen flex flex-col bg-[#FAF8F4] text-[#1C271D] antialiased">
        <Navbar />
        <EscalationBanner />
        <main className="flex-1">{children}</main>
        <footer className="bg-[#182619] text-[#E0EBE0] pt-14 pb-8 border-t border-[#273B28]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-[#253926]">
              {/* Col 1: Brand */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#B68D40] flex items-center justify-center text-white text-sm shadow">
                    🌿
                  </div>
                  <div className="font-serif-heading text-lg font-bold text-white tracking-wide">
                    Bấm Huyệt Gia Truyền
                  </div>
                </div>
                <p className="text-xs text-[#B4C4B3] leading-relaxed">
                  Kế thừa trọn vẹn tinh hoa Y học Cổ truyền 3 đời. Chữa lành tự nhiên không xâm lấn, khơi thông kinh lạc và đánh thức năng lượng tự phục hồi của cơ thể.
                </p>
                <div className="text-[11px] text-[#D4AF37] font-semibold tracking-wider uppercase">
                  ✦ Tự nhiên · An toàn · Tận tâm ✦
                </div>
              </div>

              {/* Col 2: Quick Links */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-[#D4AF37] mb-4">
                  Liên Kết Nhanh
                </h4>
                <ul className="space-y-2.5 text-xs text-[#B4C4B3]">
                  <li>
                    <a href="/" className="hover:text-white transition">Trang Chủ</a>
                  </li>
                  <li>
                    <a href="/services" className="hover:text-white transition">Dịch Vụ Trị Liệu</a>
                  </li>
                  <li>
                    <a href="/booking" className="hover:text-white transition">Đặt Lịch Khám & Trị Liệu</a>
                  </li>
                  <li>
                    <a href="/contact" className="hover:text-white transition">Tư Vấn Bệnh Lý</a>
                  </li>
                  <li>
                    <a href="/login" className="hover:text-white transition">Cổng Đăng Nhập Hội Viên</a>
                  </li>
                </ul>
              </div>

              {/* Col 3: Services */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-[#D4AF37] mb-4">
                  Liệu Trình Chuyên Sâu
                </h4>
                <ul className="space-y-2.5 text-xs text-[#B4C4B3]">
                  <li>Bấm Huyệt Trị Liệu Cổ Vai Gáy</li>
                  <li>Đả Thông Kinh Lạc Cột Sống Thắt Lưng</li>
                  <li>Xoa Bóp Bấm Huyệt Toàn Thân Thư Giãn</li>
                  <li>Diện Chẩn & Bấm Huyệt Ngâm Chân Thảo Dược</li>
                  <li>Gói Trị Liệu Phục Hồi Chuyên Sâu 10 Buổi</li>
                </ul>
              </div>

              {/* Col 4: Contact */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-[#D4AF37] mb-4">
                  Thông Tin Liên Hệ
                </h4>
                <div className="space-y-2.5 text-xs text-[#B4C4B3]">
                  <div>
                    <strong className="text-white">Hotline tư vấn:</strong> 0912.345.678
                  </div>
                  <div>
                    <strong className="text-white">Cơ sở chính:</strong> Số 18 Phố Trị Liệu Cổ Truyền, Hoàn Kiếm, Hà Nội
                  </div>
                  <div>
                    <strong className="text-white">Giờ phục vụ:</strong> 08:00 - 21:00 hàng ngày (kể cả Thứ 7 & CN)
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#8EA08D] gap-2">
              <div>© {new Date().getFullYear()} Bấm Huyệt Gia Truyền. Bảo lưu mọi quyền.</div>
              <div>Chữa lành tự nhiên từ đôi bàn tay vàng và thảo dược y học cổ truyền.</div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
