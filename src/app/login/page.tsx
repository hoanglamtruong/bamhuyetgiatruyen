"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock, User, ShieldCheck, AlertCircle, ArrowRight, UserPlus, CheckCircle, Phone, Mail, HeartPulse, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "register">("login");

  // Login form state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Register form state (STRICTLY for Customers)
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regEmail, setRegEmail] = useState("");
  const [regHealthNotes, setRegHealthNotes] = useState("");

  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    // Phục hồi lưu đăng nhập
    try {
      const savedRemember = localStorage.getItem("bhgt_remember");
      const savedUser = localStorage.getItem("bhgt_username");
      if (savedRemember === "true" && savedUser) {
        setRememberMe(true);
        setUsername(savedUser);
      }
    } catch {}

    fetch("/api/auth/status")
      .then((res) => res.json())
      .then((data) => {
        const hostIsDemo = typeof window !== "undefined" && window.location.hostname.includes("bhgt");
        setIsDemo(data.isDemo || hostIsDemo);
      })
      .catch(() => {});
  }, []);

  const handleLogin = async (u = username, p = password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: u, password: p, remember: rememberMe }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Đăng nhập thất bại");
      }

      // Xử lý lưu đăng nhập trên thiết bị
      try {
        if (rememberMe) {
          localStorage.setItem("bhgt_remember", "true");
          localStorage.setItem("bhgt_username", u);
        } else {
          localStorage.removeItem("bhgt_remember");
          localStorage.removeItem("bhgt_username");
        }
      } catch {}

      // Redirect based on role
      if (data.user.role === "MANAGER") {
        router.push("/manager");
      } else if (data.user.role === "ADMIN") {
        router.push("/admin");
      } else if (data.user.role === "OWNER") {
        router.push("/owner");
      } else {
        router.push("/profile");
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName,
          phone: regPhone,
          password: regPassword,
          email: regEmail,
          health_notes: regHealthNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Đăng ký thất bại");
      }

      // Auto redirect to customer profile
      router.push("/profile");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const quickLogin = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    handleLogin(u, p);
  };

  return (
    <div className="py-12 max-w-md mx-auto px-4 sm:px-6">
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-lg p-8">
        {isDemo && (
          <div className="mb-4 text-center">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
              🧪 Môi Trường Demo / Test (bhgt.zeebee.io.vn)
            </span>
          </div>
        )}

        <div>
          {/* Tab Switcher: Đăng Nhập (toàn bộ user) vs Đăng Ký (chỉ Customer) */}
          <div className="flex bg-gray-100 p-1 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => {
                setTab("login");
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                tab === "login" ? "bg-white text-[#1B6B7B] shadow-sm" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Cổng Đăng Nhập
            </button>
            <button
              type="button"
              onClick={() => {
                setTab("register");
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                tab === "register" ? "bg-white text-[#E8622A] shadow-sm" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Đăng Ký Khách Hàng
            </button>
          </div>

          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-[#1B6B7B] text-white flex items-center justify-center mx-auto mb-3 shadow">
              {tab === "login" ? <Lock className="w-6 h-6" /> : <UserPlus className="w-6 h-6" />}
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              {tab === "login" ? "Đăng Nhập Hệ Thống" : "Đăng Ký Tài Khoản Khách Hàng"}
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              {tab === "login"
                ? "Đăng nhập để theo dõi hồ sơ sức khỏe & lịch trình dịch vụ"
                : "Đăng ký tài khoản để theo dõi lịch trình, đơn hàng & sức khỏe"}
            </p>
          </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start space-x-3 text-red-800 text-xs">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Thông báo:</div>
                  <div>{error}</div>
                </div>
              </div>
            )}

            {tab === "login" ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleLogin();
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Tài Khoản / Số Điện Thoại
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Số điện thoại hoặc tên đăng nhập"
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Mật Khẩu</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                    <input
                      type={showLoginPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-10 pr-10 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 focus:outline-none p-0.5"
                      title={showLoginPassword ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"}
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center space-x-2 text-gray-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded text-[#1B6B7B] focus:ring-teal-500 border-gray-300 accent-[#1B6B7B]"
                    />
                    <span className="font-medium text-gray-700">Lưu đăng nhập</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#1B6B7B] hover:bg-[#134E5E] text-white font-bold text-sm py-3 rounded-xl shadow transition flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <span>{loading ? "Đang kiểm tra..." : "Đăng Nhập"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setTab("register")}
                    className="text-xs text-[#E8622A] hover:underline font-semibold"
                  >
                    Chưa có tài khoản khách hàng? Đăng ký ngay
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Họ và Tên <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="VD: Nguyễn Thị Thu Hà"
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Số Điện Thoại (Dùng Đăng Nhập) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="VD: 0912345678"
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Mật Khẩu <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                    <input
                      type={showRegPassword ? "text" : "password"}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Tối thiểu 6 ký tự"
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-10 pr-10 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 focus:outline-none p-0.5"
                      title={showRegPassword ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"}
                    >
                      {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Email <span className="text-gray-400 font-normal">(Không bắt buộc)</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Tình Trạng Sức Khỏe / Triệu Chứng <span className="text-gray-400 font-normal">(Để bác sĩ tư vấn chu đáo)</span>
                  </label>
                  <div className="relative">
                    <HeartPulse className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <textarea
                      value={regHealthNotes}
                      onChange={(e) => setRegHealthNotes(e.target.value)}
                      placeholder="VD: Đau mỏi đốt sống cổ C4-C5, hay tê bì ngón tay, khó ngủ..."
                      rows={2}
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#E8622A] hover:bg-[#D04F18] text-white font-bold text-sm py-3 rounded-xl shadow transition flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <span>{loading ? "Đang tạo hồ sơ..." : "Đăng Ký & Nhận Hồ Sơ Trị Liệu"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setTab("login")}
                    className="text-xs text-[#1B6B7B] hover:underline font-semibold"
                  >
                    Đã có tài khoản? Chuyển sang Đăng nhập
                  </button>
                </div>
              </form>
            )}

            {/* Quick Demo Login Switcher - Only shown in Demo environment */}
            {isDemo && (
              <div className="mt-8 pt-6 border-t border-gray-100">
                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider text-center mb-3">
                  Đăng Nhập Nhanh Kiểm Thử (Demo Testing)
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
                      <div className="text-[10px] text-blue-700 font-normal">Cấu hình theme, banner, tham số leo thang</div>
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
                    onClick={() => quickLogin("0912345678", "customer123")}
                    className="w-full flex items-center justify-between p-2.5 bg-teal-50 hover:bg-teal-100/80 border border-teal-200 text-teal-900 rounded-xl text-xs font-semibold transition text-left"
                  >
                    <div>
                      <div className="font-bold">4. Khách Hàng (Nguyễn Thị Thu Hà)</div>
                      <div className="text-[10px] text-teal-700 font-normal">Xem hồ sơ sức khỏe, lịch sử đơn hàng & review</div>
                    </div>
                    <span className="text-[10px] bg-teal-200 px-2 py-0.5 rounded font-mono font-bold">0912345678</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
  );
}
