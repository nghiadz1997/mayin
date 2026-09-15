"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Printer, Lock, Mail, ArrowRight } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../components/ui/Toast";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const toast = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Vui lòng nhập Email tài khoản");
      return;
    }
    if (!password) {
      toast.error("Vui lòng nhập mật khẩu");
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      toast.success("Đăng nhập thành công!");
      router.push("/dashboard");
    } catch (err: any) {
      let msg = "Đăng nhập không thành công. Vui lòng kiểm tra lại email hoặc mật khẩu!";
      if (err?.code === "auth/invalid-credential" || err?.code === "auth/wrong-password" || err?.code === "auth/user-not-found") {
        msg = "Email hoặc mật khẩu không chính xác!";
      } else if (err?.code === "auth/too-many-requests") {
        msg = "Đăng nhập sai quá nhiều lần. Vui lòng thử lại sau ít phút!";
      } else if (err?.message) {
        msg = err.message;
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 text-center">
        <div className="flex justify-center mb-3">
          <img
            src="/logo.png"
            alt="Logo Trường Cao Đẳng Bách Khoa Nam Sài Gòn"
            className="w-24 h-24 sm:w-28 sm:h-28 object-contain rounded-full bg-white p-1.5 shadow-xl shadow-blue-500/20"
          />
        </div>
        <h1 className="text-center text-lg sm:text-xl font-black tracking-tight text-white uppercase leading-tight">
          TRƯỜNG CAO ĐẲNG BÁCH KHOA
        </h1>
        <h2 className="text-center text-base sm:text-lg font-black tracking-tight text-red-400 uppercase">
          NAM SÀI GÒN
        </h2>
        <p className="mt-1.5 text-center text-xs font-medium text-slate-300">
          HỆ THỐNG QUẢN LÝ MÁY IN & MỰC IN
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-100">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Email công vụ
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@truong.edu.vn"
                  required
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Đăng nhập hệ thống</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs font-medium text-slate-400">
          Phát Triển Bởi: <span className="text-slate-200 font-semibold">Thầy Nguyễn Trọng Nghĩa</span>
        </p>
      </div>
    </div>
  );
}
