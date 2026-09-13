"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Sparkles, Calendar, BookOpen, PhoneCall, User, LogOut, ShieldAlert, BarChart3, Settings } from "lucide-react";

interface UserInfo {
  username: string;
  name: string;
  role: "MANAGER" | "ADMIN" | "OWNER" | "CUSTOMER";
}

export default function Navbar() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [theme, setTheme] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setUser(data.user);
      })
      .catch(() => {});

    fetch("/api/theme")
      .then((res) => res.json())
      .then((data) => {
        if (data.theme) setTheme(data.theme);
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-40 bg-[#2D482D] text-white shadow-md border-b border-[#223623]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Brand */}
          <Link href="/" className="flex items-center space-x-3 group">
            {theme?.theme_logo_url ? (
              <img
                src={theme.theme_logo_url}
                alt={theme.theme_title || "Logo"}
                className="w-10 h-10 rounded-full object-contain bg-white p-0.5 shadow border border-white/20"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#B68D40] flex items-center justify-center font-bold text-white text-base shadow border border-[#D4AF37]/40">
                🌿
              </div>
            )}
            <div>
              <span className="text-xl font-bold tracking-tight block leading-tight font-serif-heading text-white group-hover:text-[#F3EFE6] transition">
                {theme?.theme_title || "Bấm Huyệt Gia Truyền"}
              </span>
              <span className="text-[11px] text-[#D0DEC0] font-medium tracking-wide line-clamp-1">
                {theme?.theme_slogan || "Trị Liệu Thân Tâm · Khơi Thông Kinh Lạc Gia Truyền"}
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-5">
            <Link
              href="/services"
              className="text-xs font-semibold uppercase tracking-wider text-[#E8EFE6] hover:text-white hover:bg-[#223622] px-3 py-2 rounded-lg transition"
            >
              Dịch Vụ Trị Liệu
            </Link>
            <Link
              href="/booking"
              className="text-xs font-semibold uppercase tracking-wider text-[#E8EFE6] hover:text-white hover:bg-[#223622] px-3 py-2 rounded-lg transition"
            >
              Đặt Lịch Hẹn
            </Link>
            <Link
              href="/contact"
              className="text-xs font-semibold uppercase tracking-wider text-[#E8EFE6] hover:text-white hover:bg-[#223622] px-3 py-2 rounded-lg transition"
            >
              Tư Vấn & Liên Hệ
            </Link>

            {/* Customer Profile Link */}
            {user?.role === "CUSTOMER" && (
              <Link
                href="/profile"
                className="flex items-center space-x-1.5 bg-[#B68D40] hover:bg-[#9E7533] text-white font-semibold text-xs px-3.5 py-2 rounded-lg shadow-sm transition"
              >
                <User className="w-3.5 h-3.5" />
                <span>Hồ Sơ Của Tôi</span>
              </Link>
            )}

            {/* Role-based Dashboard Links */}
            {user?.role === "MANAGER" && (
              <Link
                href="/manager"
                className="flex items-center space-x-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-xs px-3 py-1.5 rounded-lg shadow-sm transition"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Manager Portal (30%)</span>
              </Link>
            )}

            {(user?.role === "ADMIN" || user?.role === "MANAGER") && (
              <Link
                href="/admin"
                className="flex items-center space-x-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs px-3 py-1.5 rounded-lg shadow-sm transition"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>{user?.role === "MANAGER" ? "Cấu Hình Kỹ Thuật" : "Admin Kỹ Thuật"}</span>
              </Link>
            )}

            {user?.role === "OWNER" && (
              <Link
                href="/owner"
                className="flex items-center space-x-1.5 bg-[#B68D40] hover:bg-[#9E7533] text-white font-semibold text-xs px-3 py-1.5 rounded-lg shadow-sm transition"
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
                <Link
                  href={user.role === "CUSTOMER" ? "/profile" : user.role === "MANAGER" ? "/manager" : user.role === "ADMIN" ? "/admin" : "/owner"}
                  className="text-right hidden sm:block hover:opacity-85 transition"
                >
                  <div className="text-xs font-semibold text-white">{user.name}</div>
                  <div className="text-[10px] text-[#D0DEC0] uppercase font-bold">
                    {user.role === "CUSTOMER" ? "Khách Hàng" : user.role}
                  </div>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-1.5 text-[#D0DEC0] hover:text-white hover:bg-[#223622] rounded-lg transition"
                  title="Đăng xuất"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="bg-[#B68D40] hover:bg-[#9E7533] text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg shadow-sm transition flex items-center space-x-1.5"
              >
                <User className="w-3.5 h-3.5" />
                <span>Đăng Ký / Đăng Nhập</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
