import { cookies } from "next/headers";
import { pool } from "./db";

export interface UserSession {
  id: string;
  username: string;
  name: string;
  role: "MANAGER" | "ADMIN" | "OWNER";
  isApproved: boolean;
}

export async function getCurrentUser(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("bhgt_session");
  if (!sessionCookie?.value) return null;

  try {
    const data = JSON.parse(Buffer.from(sessionCookie.value, "base64").toString("utf-8"));
    // Verify user in db
    const res = await pool.query("SELECT id, username, name, role, is_approved FROM users WHERE id = $1;", [data.id]);
    if (res.rows.length === 0) return null;
    const u = res.rows[0];
    return {
      id: u.id,
      username: u.username,
      name: u.name,
      role: u.role,
      isApproved: u.is_approved,
    };
  } catch {
    return null;
  }
}

export async function loginUser(username: string, pass: string): Promise<{ success: boolean; error?: string; user?: UserSession }> {
  const res = await pool.query("SELECT id, username, password, name, role, is_approved FROM users WHERE username = $1;", [username]);
  if (res.rows.length === 0) {
    return { success: false, error: "Tên đăng nhập không tồn tại" };
  }
  const u = res.rows[0];
  if (u.password !== pass) {
    return { success: false, error: "Mật khẩu không chính xác" };
  }
  if (u.role === "ADMIN" && !u.is_approved) {
    return { success: false, error: "Tài khoản Admin chưa được Quản Lý (Manager) phê duyệt. Vui lòng liên hệ Manager." };
  }

  const user: UserSession = {
    id: u.id,
    username: u.username,
    name: u.name,
    role: u.role,
    isApproved: u.is_approved,
  };

  const token = Buffer.from(JSON.stringify({ id: u.id, username: u.username, role: u.role })).toString("base64");
  const cookieStore = await cookies();
  cookieStore.set("bhgt_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return { success: true, user };
}

export async function logoutUser() {
  const cookieStore = await cookies();
  cookieStore.delete("bhgt_session");
}
