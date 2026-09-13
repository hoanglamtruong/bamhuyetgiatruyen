"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  Phone,
  Mail,
  HeartPulse,
  ShoppingBag,
  Calendar,
  Star,
  Clock,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Lock,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  MessageSquare,
} from "lucide-react";

interface CustomerData {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  health_notes?: string;
  total_spent?: number;
  treatment_count?: number;
  last_visit?: string;
}

interface OrderItem {
  id: string;
  order_code: string;
  service_id: string;
  service_title: string;
  amount: number;
  original_amount?: number;
  discount_amount?: number;
  status: string;
  completed_at?: string;
  created_at: string;
}

interface BookingItem {
  id: string;
  service_id: string;
  service_title: string;
  booking_date: string;
  booking_time: string;
  status: string;
  notes?: string;
  final_amount?: number;
}

interface ReviewItem {
  id: string;
  order_id?: string;
  service_id?: string;
  service_title: string;
  rating: number;
  comment?: string;
  health_improvement_notes?: string;
  created_at: string;
}

export default function CustomerProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"orders" | "reviews" | "profile">("orders");

  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);

  // Edit Profile Form State
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editHealthNotes, setEditHealthNotes] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  // Review Modal State
  const [reviewModal, setReviewModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [healthImprovement, setHealthImprovement] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewMsg, setReviewMsg] = useState<string | null>(null);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/customer/profile");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      if (data.customer) {
        setCustomer(data.customer);
        setEditName(data.customer.name || data.user.name || "");
        setEditEmail(data.customer.email || data.user.email || "");
        setEditHealthNotes(data.customer.health_notes || "");
      }
      setOrders(data.orders || []);
      setBookings(data.bookings || []);
      setReviews(data.reviews || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      const res = await fetch("/api/customer/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          health_notes: editHealthNotes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setProfileMsg("Cập nhật thông tin hồ sơ thành công!");
        fetchProfile();
        setTimeout(() => setProfileMsg(null), 3000);
      } else {
        throw new Error(data.error || "Không thể cập nhật hồ sơ");
      }
    } catch (err: any) {
      alert("Lỗi: " + err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const openReviewModal = (order: OrderItem) => {
    setSelectedOrder(order);
    // Find if already reviewed
    const existing = reviews.find((r) => r.order_id === order.id);
    if (existing) {
      setRating(existing.rating);
      setComment(existing.comment || "");
      setHealthImprovement(existing.health_improvement_notes || "");
    } else {
      setRating(5);
      setComment("");
      setHealthImprovement("");
    }
    setReviewMsg(null);
    setReviewModal(true);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setSubmittingReview(true);
    try {
      const res = await fetch("/api/customer/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: selectedOrder.id,
          service_id: selectedOrder.service_id,
          rating,
          comment,
          health_improvement_notes: healthImprovement,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setReviewMsg("Cảm ơn quý khách! Đánh giá đã được ghi nhận vào hồ sơ và chuyển tiếp tới Ban Quản Trị.");
        fetchProfile();
        setTimeout(() => {
          setReviewModal(false);
          setReviewMsg(null);
        }, 1500);
      } else {
        throw new Error(data.error || "Lỗi gửi đánh giá");
      }
    } catch (err: any) {
      alert("Lỗi: " + err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Đã hoàn thành
          </span>
        );
      case "accepted":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
            <Clock className="w-3 h-3 mr-1" />
            Đã nhận lịch
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
            <Clock className="w-3 h-3 mr-1" />
            Chờ xác nhận
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-sm text-gray-500">
        Đang tải hồ sơ khách hàng...
      </div>
    );
  }

  const reviewedOrderIds = new Set(reviews.map((r) => r.order_id).filter(Boolean));

  return (
    <div className="py-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm p-6 sm:p-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center space-x-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1B6B7B] to-[#134E5E] text-white flex items-center justify-center font-bold text-2xl shadow-md">
              {customer?.name ? customer.name.charAt(0).toUpperCase() : "K"}
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-gray-900">{customer?.name || "Khách Hàng"}</h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Hội Viên Trị Liệu
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mt-1.5">
                <span className="flex items-center">
                  <Phone className="w-3.5 h-3.5 mr-1 text-[#1B6B7B]" />
                  {customer?.phone || "Chưa cập nhật SĐT"}
                </span>
                {customer?.email && (
                  <span className="flex items-center">
                    <Mail className="w-3.5 h-3.5 mr-1 text-[#1B6B7B]" />
                    {customer.email}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
            <div className="text-center p-3 bg-teal-50/50 rounded-2xl border border-teal-100">
              <div className="text-xl font-bold text-[#1B6B7B]">
                {customer?.treatment_count || orders.filter((o) => o.status === "completed").length}
              </div>
              <div className="text-[11px] text-gray-500 font-medium mt-0.5">Buổi trị liệu</div>
            </div>
            <div className="text-center p-3 bg-orange-50/50 rounded-2xl border border-orange-100">
              <div className="text-xl font-bold text-[#E8622A]">
                {Number(customer?.total_spent || 0).toLocaleString()}đ
              </div>
              <div className="text-[11px] text-gray-500 font-medium mt-0.5">Chi tiêu tích luỹ</div>
            </div>
            <div className="text-center p-3 bg-blue-50/50 rounded-2xl border border-blue-100">
              <div className="text-xl font-bold text-blue-700">{reviews.length}</div>
              <div className="text-[11px] text-gray-500 font-medium mt-0.5">Đánh giá gửi</div>
            </div>
          </div>
        </div>

        {/* Quick booking link banner */}
        <div className="mt-6 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-gray-600 flex items-center space-x-2">
            <HeartPulse className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span>
              {customer?.health_notes
                ? `Tình trạng ghi nhận: ${customer.health_notes}`
                : "Chưa ghi nhận triệu chứng bệnh lý. Hãy cập nhật để bác sĩ hỗ trợ tốt nhất."}
            </span>
          </div>
          <Link
            href="/booking"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-[#E8622A] hover:bg-[#D04F18] text-white text-xs font-bold px-4 py-2 rounded-xl shadow transition"
          >
            <span>Đặt Lịch Liệu Trình Mới</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex space-x-2 border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab("orders")}
          className={`py-3 px-5 text-sm font-bold border-b-2 transition flex items-center space-x-2 ${
            activeTab === "orders"
              ? "border-[#1B6B7B] text-[#1B6B7B]"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Lịch Sử Dịch Vụ ({orders.length + bookings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("reviews")}
          className={`py-3 px-5 text-sm font-bold border-b-2 transition flex items-center space-x-2 ${
            activeTab === "reviews"
              ? "border-[#1B6B7B] text-[#1B6B7B]"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <Star className="w-4 h-4 text-amber-500" />
          <span>Đánh Giá Của Tôi ({reviews.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("profile")}
          className={`py-3 px-5 text-sm font-bold border-b-2 transition flex items-center space-x-2 ${
            activeTab === "profile"
              ? "border-[#1B6B7B] text-[#1B6B7B]"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <User className="w-4 h-4" />
          <span>Thông Tin Cá Nhân & Bệnh Lý</span>
        </button>
      </div>

      {/* TAB 1: ORDERS & BOOKINGS HISTORY */}
      {activeTab === "orders" && (
        <div className="space-y-6">
          {/* Active Bookings (Lịch Hẹn Đang Chờ / Đã Nhận) */}
          {bookings.length > 0 && (
            <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm p-6">
              <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-[#1B6B7B]" />
                <span>Lịch Hẹn Trực Tuyến Đã Đăng Ký ({bookings.length})</span>
              </h2>
              <div className="divide-y divide-gray-100">
                {bookings.map((b) => (
                  <div key={b.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold text-gray-900">{b.service_title || "Dịch Vụ Bấm Huyệt"}</div>
                      <div className="text-xs text-gray-500 mt-1 flex items-center space-x-3">
                        <span className="font-medium text-[#1B6B7B]">
                          📅 {new Date(b.booking_date).toLocaleDateString("vi-VN")} lúc {b.booking_time}
                        </span>
                        {b.notes && <span className="italic">Ghi chú: {b.notes}</span>}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {getStatusBadge(b.status)}
                      {b.final_amount && (
                        <span className="text-sm font-bold text-[#E8622A]">
                          {Number(b.final_amount).toLocaleString()}đ
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Orders History */}
          <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm p-6">
            <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <ShoppingBag className="w-4 h-4 text-[#E8622A]" />
              <span>Lịch Sử Đơn Hàng Dịch Vụ ({orders.length})</span>
            </h2>

            {orders.length === 0 ? (
              <div className="text-center py-10">
                <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <div className="text-sm font-semibold text-gray-600">Chưa có đơn hàng dịch vụ nào</div>
                <p className="text-xs text-gray-400 mt-1">
                  Quý khách đặt lịch hẹn lần đầu sẽ được tự động ghi nhận đơn hàng sau khi đối chiếu.
                </p>
                <Link
                  href="/booking"
                  className="mt-4 inline-block bg-[#1B6B7B] hover:bg-[#134E5E] text-white text-xs font-bold px-4 py-2 rounded-xl shadow transition"
                >
                  Đặt Lịch Ngay
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {orders.map((o) => {
                  const hasReview = reviewedOrderIds.has(o.id);
                  return (
                    <div key={o.id} className="py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-mono font-bold bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                            {o.order_code}
                          </span>
                          <span className="text-sm font-bold text-gray-900">{o.service_title}</span>
                          {getStatusBadge(o.status)}
                        </div>
                        <div className="text-xs text-gray-500 flex flex-wrap items-center gap-3">
                          <span>Ngày tạo: {new Date(o.created_at).toLocaleDateString("vi-VN")}</span>
                          {o.completed_at && (
                            <span className="text-emerald-700">
                              Hoàn thành: {new Date(o.completed_at).toLocaleDateString("vi-VN")}
                            </span>
                          )}
                          {Number(o.discount_amount) > 0 && (
                            <span className="text-red-600 font-medium">
                              Ưu đãi giảm: -{Number(o.discount_amount).toLocaleString()}đ
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 self-end md:self-auto">
                        <div className="text-right">
                          <div className="text-base font-bold text-[#E8622A]">
                            {Number(o.amount).toLocaleString()}đ
                          </div>
                          {o.original_amount && Number(o.original_amount) > Number(o.amount) && (
                            <div className="text-xs text-gray-400 line-through">
                              {Number(o.original_amount).toLocaleString()}đ
                            </div>
                          )}
                        </div>

                        {/* Review Action Button */}
                        {o.status === "completed" && (
                          <button
                            onClick={() => openReviewModal(o)}
                            className={`flex items-center space-x-1.5 text-xs font-bold px-3.5 py-2 rounded-xl transition ${
                              hasReview
                                ? "bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200"
                                : "bg-[#1B6B7B] hover:bg-[#134E5E] text-white shadow"
                            }`}
                          >
                            <Star className={`w-3.5 h-3.5 ${hasReview ? "fill-amber-500 text-amber-500" : "text-white"}`} />
                            <span>{hasReview ? "Xem / Sửa Đánh Giá" : "Viết Đánh Giá"}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MY REVIEWS */}
      {activeTab === "reviews" && (
        <div className="space-y-6">
          {/* Privacy Disclaimer Notice */}
          <div className="bg-teal-50/70 border border-teal-200 rounded-2xl p-4 flex items-start space-x-3 text-xs text-teal-900">
            <ShieldCheck className="w-5 h-5 text-[#1B6B7B] flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Chính Sách Bảo Mật Đánh Giá & Cảm Nhận Trị Liệu:</div>
              <div className="text-teal-800 mt-0.5">
                Các đánh giá và phản hồi sức khỏe của quý khách được bảo mật nội bộ, chỉ hiển thị trong trang hồ sơ cá nhân này và gửi riêng tới Chủ Cơ Sở & Ban Quản Trị để theo dõi tiến trình hồi phục và không ngừng hoàn thiện chất lượng tay nghề.
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm p-6 sm:p-8">
            <h2 className="text-base font-bold text-gray-900 mb-6 flex items-center space-x-2">
              <Star className="w-4 h-4 text-amber-500" />
              <span>Cảm Nhận & Đánh Giá Dịch Vụ Đã Gửi ({reviews.length})</span>
            </h2>

            {reviews.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <div className="text-sm font-semibold text-gray-700">Quý khách chưa có đánh giá nào</div>
                <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                  Sau khi hoàn thành buổi trị liệu tại cơ sở, quý khách có thể gửi đánh giá cảm nhận về tay nghề bấm huyệt tại mục Lịch Sử Dịch Vụ.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((r) => (
                  <div
                    key={r.id}
                    className="p-5 bg-gray-50/80 rounded-2xl border border-gray-200/80 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="text-sm font-bold text-gray-900">{r.service_title}</div>
                        <div className="text-[11px] text-gray-400">
                          Đã đánh giá vào: {new Date(r.created_at).toLocaleDateString("vi-VN")}
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-4 h-4 ${
                              s <= r.rating ? "text-amber-500 fill-amber-500" : "text-gray-300"
                            }`}
                          />
                        ))}
                        <span className="text-xs font-bold text-amber-700 ml-1.5">{r.rating}/5 sao</span>
                      </div>
                    </div>

                    {r.health_improvement_notes && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200/60 rounded-xl text-xs text-emerald-900">
                        <span className="font-bold flex items-center space-x-1 mb-1 text-emerald-800">
                          <HeartPulse className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Tiến Triển Cải Thiện Sức Khỏe:</span>
                        </span>
                        <p className="italic">{r.health_improvement_notes}</p>
                      </div>
                    )}

                    {r.comment && (
                      <div className="text-xs text-gray-700">
                        <span className="font-semibold text-gray-900">Nhận xét chi tiết: </span>
                        {r.comment}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: PERSONAL & HEALTH INFO */}
      {activeTab === "profile" && (
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900">Hồ Sơ Sức Khỏe & Thông Tin Cá Nhân</h2>
            <p className="text-xs text-gray-500 mt-1">
              Thông tin này giúp lương y và kỹ thuật viên điều chỉnh lực bấm và huyệt đạo phù hợp với thể trạng của bạn.
            </p>
          </div>

          {profileMsg && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center space-x-2 text-xs text-emerald-800 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{profileMsg}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-5 max-w-xl">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Họ và Tên</label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Số Điện Thoại <span className="text-gray-400 font-normal">(Cố định dùng làm mã tài khoản)</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={customer?.phone || ""}
                  disabled
                  className="w-full bg-gray-100 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Địa Chỉ Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="nhap.email@domain.com"
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Ghi Chú Sức Khỏe & Triệu Chứng Bệnh Lý
              </label>
              <div className="relative">
                <HeartPulse className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <textarea
                  value={editHealthNotes}
                  onChange={(e) => setEditHealthNotes(e.target.value)}
                  rows={4}
                  placeholder="VD: Thoái hóa đốt sống cổ C4-C5, hay đau mỏi vùng thắt lưng khi ngồi lâu, nhạy cảm với lực mạnh..."
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                Ghi chú này sẽ được chuyển tới Bác sĩ trị liệu trước mỗi buổi hẹn để đảm bảo phác đồ tối ưu.
              </p>
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="bg-[#1B6B7B] hover:bg-[#134E5E] text-white text-xs font-bold px-6 py-3 rounded-xl shadow transition flex items-center space-x-2 disabled:opacity-50"
            >
              <span>{savingProfile ? "Đang lưu..." : "Lưu Thông Tin Hồ Sơ"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* REVIEW MODAL */}
      {reviewModal && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Đánh Giá Dịch Vụ Trị Liệu</h3>
                <p className="text-xs text-gray-500 mt-0.5">{selectedOrder.service_title}</p>
              </div>
              <button
                onClick={() => setReviewModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {reviewMsg && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 rounded-xl font-bold">
                {reviewMsg}
              </div>
            )}

            <form onSubmit={handleSubmitReview} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2 text-center">
                  Mức Độ Hài Lòng
                </label>
                <div className="flex items-center justify-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 focus:outline-none transition transform hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= (hoverRating || rating)
                            ? "text-amber-500 fill-amber-500"
                            : "text-gray-200"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <div className="text-center text-xs font-bold text-amber-700 mt-1">
                  {rating === 5 && "⭐ Xuất sắc - Cơ thể phục hồi rất tốt"}
                  {rating === 4 && "⭐ Rất hài lòng - Giảm đau mỏi rõ rệt"}
                  {rating === 3 && "⭐ Bình thường - Đạt yêu cầu"}
                  {rating === 2 && "⭐ Cần cải thiện thêm về lực bấm/dịch vụ"}
                  {rating === 1 && "⭐ Chưa hài lòng"}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Cảm Nhận Cải Thiện Sức Khỏe Sau Liệu Trình
                </label>
                <textarea
                  value={healthImprovement}
                  onChange={(e) => setHealthImprovement(e.target.value)}
                  rows={2}
                  placeholder="VD: Cổ gáy xoay dễ dàng hơn, lưng bớt tê buốt, tối ngủ sâu giấc hơn..."
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Nhận Xét & Đóng Góp Ý Kiến
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  placeholder="Nhận xét về tay nghề kỹ thuật viên, không gian, thái độ phục vụ..."
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="text-[11px] text-gray-400 bg-gray-50 p-2.5 rounded-xl flex items-center space-x-2">
                <Lock className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                <span>
                  Đánh giá này chỉ hiển thị trong hồ sơ của quý khách và chuyển trực tiếp tới Ban Quản Trị cơ sở.
                </span>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="bg-[#E8622A] hover:bg-[#D04F18] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow transition disabled:opacity-50"
                >
                  {submittingReview ? "Đang gửi..." : "Gửi Đánh Giá"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
