"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, User, ShieldCheck, AlertCircle, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (u = username, p = password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: u, password: p }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Đăng nhập thất bại");
      }

      // Redirect to appropriate dashboard based on role
      if (data.user.role === "MANAGER") {
        router.push("/manager");
      } else if (data.user.role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/owner");
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    handleLogin(u, p);
  };

  return (
    <div className="py-16 max-w-md mx-auto px-4 sm:px-6">
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[#1B6B7B] text-white flex items-center justify-center mx-auto mb-3 shadow">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Đăng Nhập Quản Trị</h1>
          <p className="text-xs text-gray-500 mt-1">
            Hệ thống phân quyền 3 vai trò: Manager · Admin · Owner
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start space-x-3 text-red-800 text-xs">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Lỗi đăng nhập:</div>
              <div>{error}</div>
            </div>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Tên Đăng Nhập
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="manager / admin / owner"
                className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Mật Khẩu
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1B6B7B] hover:bg-[#134E5E] text-white font-bold text-sm py-3 rounded-xl shadow transition flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <span>{loading ? "Đang xử lý..." : "Đăng Nhập"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Login Switcher */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider text-center mb-3">
            Đăng Nhập Nhanh Để Kiểm Thử (3 Vai Trò)
          </div>
          <div className="space-y-2">
            <button
              onClick={() => quickLogin("manager", "manager123")}
              className="w-full flex items-center justify-between p-2.5 bg-amber-50 hover:bg-amber-100/80 border border-amber-200 text-amber-900 rounded-xl text-xs font-semibold transition text-left"
            >
              <div>
                <div className="font-bold">1. Manager (Zeebee)</div>
                <div className="text-[10px] text-amber-700 font-normal">Xem doanh thu toàn hệ thống (30%), duyệt Admin</div>
              </div>
              <span className="text-[10px] bg-amber-200 px-2 py-0.5 rounded font-mono font-bold">manager</span>
            </button>

            <button
              onClick={() => quickLogin("admin", "admin123")}
              className="w-full flex items-center justify-between p-2.5 bg-blue-50 hover:bg-blue-100/80 border border-blue-200 text-blue-900 rounded-xl text-xs font-semibold transition text-left"
            >
              <div>
                <div className="font-bold">2. Admin (Kỹ Thuật)</div>
                <div className="text-[10px] text-blue-700 font-normal">Cấu hình leo thang, hỗ trợ kỹ thuật, khóa KPI</div>
              </div>
              <span className="text-[10px] bg-blue-200 px-2 py-0.5 rounded font-mono font-bold">admin</span>
            </button>

            <button
              onClick={() => quickLogin("owner", "owner123")}
              className="w-full flex items-center justify-between p-2.5 bg-orange-50 hover:bg-orange-100/80 border border-orange-200 text-orange-900 rounded-xl text-xs font-semibold transition text-left"
            >
              <div>
                <div className="font-bold">3. Owner (Chủ Cơ Sở)</div>
                <div className="text-[10px] text-orange-700 font-normal">Quản lý CRM, dịch vụ, đơn hàng & 70% doanh thu</div>
              </div>
              <span className="text-[10px] bg-orange-200 px-2 py-0.5 rounded font-mono font-bold">owner</span>
            </button>

            <button
              onClick={() => quickLogin("admin_new", "admin123")}
              className="w-full flex items-center justify-between p-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition text-left"
            >
              <div>
                <div className="font-bold">4. Admin Mới (Chưa Phê Duyệt)</div>
                <div className="text-[10px] text-gray-500 font-normal">Test chặn đăng nhập nếu Manager chưa duyệt</div>
              </div>
              <span className="text-[10px] bg-gray-200 px-2 py-0.5 rounded font-mono font-bold">admin_new</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
