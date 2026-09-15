"use client";

import React, { useState, useEffect } from "react";
import { Search, Bell, Menu, LogOut, Shield, ChevronDown } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { faultReportService } from "../../services/faultReportService";
import { printerService } from "../../services/printerService";
import { repairService } from "../../services/repairService";
import { GlobalSearchModal } from "./GlobalSearchModal";
import Link from "next/link";

export default function Header({ onOpenMobileMenu }: { onOpenMobileMenu: () => void }) {
  const { user, logout } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);

  // Badge notification counts
  const [pendingReportsCount, setPendingReportsCount] = useState<number>(0);
  const [brokenPrintersCount, setBrokenPrintersCount] = useState<number>(0);
  const [repairingPrintersCount, setRepairingPrintersCount] = useState<number>(0);

  useEffect(() => {
    async function loadAlerts() {
      try {
        const [reports, printers, repairs] = await Promise.all([
          faultReportService.getAll(),
          printerService.getAll(),
          repairService.getAll(),
        ]);
        setPendingReportsCount(reports.filter((r) => r.status === "pending").length);
        setBrokenPrintersCount(printers.filter((p) => p.status === "broken").length);
        setRepairingPrintersCount(printers.filter((p) => p.status === "repairing").length);
      } catch (err) {
        console.warn("Error loading notification counts:", err);
      }
    }
    loadAlerts();
    const interval = setInterval(loadAlerts, 15000);
    return () => clearInterval(interval);
  }, []);

  const totalNotifications = pendingReportsCount + brokenPrintersCount + repairingPrintersCount;

  return (
    <>
      <header className="sticky top-0 z-20 flex items-center justify-between h-16 sm:h-16 px-3 sm:px-6 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm safe-area-top">
        {/* Left: Mobile Menu & Search trigger */}
        <div className="flex items-center gap-3 sm:gap-4 flex-1">
          <button
            onClick={onOpenMobileMenu}
            className="p-1.5 -ml-1 text-slate-600 rounded-lg lg:hidden hover:bg-slate-100 focus:outline-none"
            aria-label="Mở menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo on Mobile */}
          <Link href="/dashboard" className="flex items-center gap-2 lg:hidden">
            <img
              src="/logo.png"
              alt="Logo CĐ Bách Khoa Nam Sài Gòn"
              className="w-8 h-8 object-contain rounded-full bg-white shadow-sm"
            />
          </Link>

          {/* Search Trigger Button */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 px-2.5 sm:px-3.5 py-1.5 text-xs sm:text-sm text-slate-400 bg-slate-100/80 hover:bg-slate-100 rounded-lg border border-slate-200 flex-1 max-w-[150px] sm:max-w-xs transition-colors"
          >
            <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span className="truncate">Tìm kiếm...</span>
            <kbd className="hidden sm:inline-block ml-auto text-[10px] font-semibold bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-400">
              Ctrl K
            </kbd>
          </button>
        </div>

        {/* Right: Notifications & User profile */}
        <div className="flex items-center gap-3">
          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setNotificationOpen(!notificationOpen)}
              className="relative p-2 text-slate-600 rounded-lg hover:bg-slate-100 focus:outline-none transition-colors"
              title="Thông báo hệ thống"
            >
              <Bell className="w-5 h-5" />
              {totalNotifications > 0 && (
                <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-rose-500 rounded-full animate-pulse">
                  {totalNotifications}
                </span>
              )}
            </button>

            {notificationOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-lg py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-2 border-b border-slate-100 font-semibold text-sm text-slate-800 flex items-center justify-between">
                  <span>Thông báo & Cảnh báo</span>
                  <span className="text-xs text-slate-400">{totalNotifications} mục</span>
                </div>
                <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                  {pendingReportsCount > 0 && (
                    <Link
                      href="/fault-reports"
                      onClick={() => setNotificationOpen(false)}
                      className="flex items-start gap-3 px-4 py-2.5 hover:bg-amber-50/50 transition-colors text-xs"
                    >
                      <span className="w-2 h-2 mt-1 rounded-full bg-amber-500 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-slate-800">
                          {pendingReportsCount} báo lỗi QR mới cần duyệt
                        </p>
                        <p className="text-slate-500 text-[11px]">Người dùng vừa gửi báo lỗi từ máy in</p>
                      </div>
                    </Link>
                  )}
                  {brokenPrintersCount > 0 && (
                    <Link
                      href="/printers?status=broken"
                      onClick={() => setNotificationOpen(false)}
                      className="flex items-start gap-3 px-4 py-2.5 hover:bg-rose-50/50 transition-colors text-xs"
                    >
                      <span className="w-2 h-2 mt-1 rounded-full bg-rose-500 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-slate-800">{brokenPrintersCount} máy in đang hỏng</p>
                        <p className="text-slate-500 text-[11px]">Cần kiểm tra hoặc lập phiếu sửa chữa</p>
                      </div>
                    </Link>
                  )}
                  {repairingPrintersCount > 0 && (
                    <Link
                      href="/repairs"
                      onClick={() => setNotificationOpen(false)}
                      className="flex items-start gap-3 px-4 py-2.5 hover:bg-blue-50/50 transition-colors text-xs"
                    >
                      <span className="w-2 h-2 mt-1 rounded-full bg-blue-500 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-slate-800">
                          {repairingPrintersCount} máy đang trong quá trình sửa
                        </p>
                        <p className="text-slate-500 text-[11px]">Theo dõi tiến độ linh kiện và hoàn thành</p>
                      </div>
                    </Link>
                  )}
                  {totalNotifications === 0 && (
                    <div className="px-4 py-6 text-center text-xs text-slate-400">
                      Không có cảnh báo phát sinh nào.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => setUserDropdown(!userDropdown)}
              className="flex items-center gap-2.5 p-1 pl-2 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                {user?.displayName ? user.displayName.slice(0, 2).toUpperCase() : "AD"}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-800 leading-tight">
                  {user?.displayName || "Quản trị viên"}
                </span>
                <span className="text-[10px] text-blue-600 font-medium">{user?.email}</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block" />
            </button>

            {userDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-800">{user?.displayName || "Quản trị viên"}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-800">
                    Quản trị viên
                  </span>
                </div>
                <div className="py-1">
                  <Link
                    href="/settings"
                    onClick={() => setUserDropdown(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Shield className="w-4 h-4 text-slate-400" />
                    Cài đặt hệ thống
                  </Link>
                </div>
                <div className="border-t border-slate-100 py-1">
                  <button
                    onClick={() => {
                      setUserDropdown(false);
                      logout();
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 transition-colors font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    Đăng xuất
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Search Modal */}
      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

export { Header };
