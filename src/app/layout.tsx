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
      <body className="min-h-screen flex flex-col bg-[#F8F5EE] text-[#1C2826] antialiased">
        <Navbar />
        <EscalationBanner />
        <main className="flex-1">{children}</main>
        <footer className="bg-[#134E5E] text-white py-8 border-t border-[#1B6B7B]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left sm:flex sm:justify-between sm:items-center">
            <div>
              <div className="text-lg font-bold">Bấm Huyệt Gia Truyền</div>
              <p className="text-xs text-teal-200 mt-1">
                Kế thừa tinh hoa Y học Cổ truyền · Chữa lành tự nhiên không dùng thuốc
              </p>
            </div>
            <div className="mt-4 sm:mt-0 text-xs text-teal-200 space-y-1 sm:text-right">
              <div>Hotline tư vấn: 0912.345.678 · Giờ làm việc: 08:00 - 21:00 hàng ngày</div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
