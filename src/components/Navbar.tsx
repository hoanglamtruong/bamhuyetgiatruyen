"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Sparkles, Calendar, BookOpen, PhoneCall, User, LogOut, ShieldAlert, BarChart3, Settings } from "lucide-react";

interface UserInfo {
  username: string;
  name: string;
  role: "MANAGER" | "ADMIN" | "OWNER";
}

export default function Navbar() {
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setUser(data.user);
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-40 bg-[#1B6B7B] text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-full bg-[#E8622A] flex items-center justify-center font-bold text-white text-lg shadow">
              BH
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight block leading-tight text-white group-hover:text-[#F2ECD8] transition">
                Bấm Huyệt Gia Truyền
              </span>
              <span className="text-xs text-teal-100 font-medium tracking-wide">
                Nền tảng Trị Liệu Đông Y Cổ Truyền
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href="/services"
              className="text-sm font-medium text-teal-50 hover:text-white hover:bg-[#134E5E] px-3 py-1.5 rounded-md transition"
            >
              Dịch Vụ Trị Liệu
            </Link>
            <Link
              href="/booking"
              className="text-sm font-medium text-teal-50 hover:text-white hover:bg-[#134E5E] px-3 py-1.5 rounded-md transition"
            >
              Đặt Lịch Hẹn
            </Link>
            <Link
              href="/contact"
              className="text-sm font-medium text-teal-50 hover:text-white hover:bg-[#134E5E] px-3 py-1.5 rounded-md transition"
            >
              Tư Vấn & Liên Hệ
            </Link>

            {/* Role-based Dashboard Links */}
            {user?.role === "MANAGER" && (
              <Link
                href="/manager"
                className="flex items-center space-x-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-xs px-3 py-1.5 rounded-md shadow transition"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Manager Portal (30%)</span>
              </Link>
            )}

            {(user?.role === "ADMIN" || user?.role === "MANAGER") && (
              <Link
                href="/admin"
                className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-3 py-1.5 rounded-md shadow transition"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>{user?.role === "MANAGER" ? "Cấu Hình Kỹ Thuật (Admin)" : "Admin Kỹ Thuật"}</span>
              </Link>
            )}

            {user?.role === "OWNER" && (
              <Link
                href="/owner"
                className="flex items-center space-x-1.5 bg-[#E8622A] hover:bg-[#D04F18] text-white font-semibold text-xs px-3 py-1.5 rounded-md shadow transition"
              >
                <User className="w-3.5 h-3.5" />
                <span>Owner Portal (70%)</span>
              </Link>
            )}
          </nav>

          {/* User Auth Info / Switcher */}
          <div className="flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-2">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-semibold text-white">{user.name}</div>
                  <div className="text-[10px] text-teal-200 uppercase font-bold">{user.role}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1.5 text-teal-200 hover:text-white hover:bg-[#134E5E] rounded-md transition"
                  title="Đăng xuất"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="bg-[#E8622A] hover:bg-[#D04F18] text-white text-xs font-semibold px-3.5 py-1.5 rounded-md shadow transition"
              >
                Đăng Nhập Quản Trị
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
