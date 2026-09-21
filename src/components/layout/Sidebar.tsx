"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Printer,
  Droplet,
  RefreshCw,
  Wrench,
  AlertTriangle,
  History,
  BarChart3,
  FileText,
  FileClock,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  Package,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<{ mobileOpen: boolean; setMobileOpen: (open: boolean) => void }> = ({
  mobileOpen,
  setMobileOpen,
}) => {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState<boolean>(false);

  const sections: NavSection[] = [
    {
      title: "TỔNG QUAN",
      items: [
        {
          label: "Dashboard",
          href: "/dashboard",
          icon: <LayoutDashboard className="w-5 h-5" />,
        },
      ],
    },
    {
      title: "QUẢN LÝ THIẾT BỊ",
      items: [
        {
          label: "Khoa / Phòng",
          href: "/departments",
          icon: <Building2 className="w-5 h-5" />,
        },
        {
          label: "Máy in",
          href: "/printers",
          icon: <Printer className="w-5 h-5" />,
        },
        {
          label: "Mực máy in",
          href: "/toners",
          icon: <Droplet className="w-5 h-5" />,
        },
        {
          label: "Kho mực in",
          href: "/toner-inventory",
          icon: <Package className="w-5 h-5 text-blue-400" />,
        },
        {
          label: "Nạp / Thay mực",
          href: "/toner-transactions/new",
          icon: <RefreshCw className="w-5 h-5" />,
        },
        {
          label: "Sửa chữa sự cố",
          href: "/repairs",
          icon: <Wrench className="w-5 h-5" />,
        },
        {
          label: "Báo lỗi qua QR",
          href: "/fault-reports",
          icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
        },
      ],
    },
    {
      title: "THỐNG KÊ & BÁO CÁO",
      items: [
        {
          label: "Lịch sử nạp mực",
          href: "/toner-transactions",
          icon: <History className="w-5 h-5" />,
        },
        {
          label: "Thống kê đơn vị",
          href: "/statistics",
          icon: <BarChart3 className="w-5 h-5" />,
        },
        {
          label: "Báo cáo toàn trường",
          href: "/reports",
          icon: <FileText className="w-5 h-5" />,
        },
      ],
    },
    {
      title: "HỆ THỐNG",
      items: [
        {
          label: "Nhật ký thao tác",
          href: "/audit-logs",
          icon: <FileClock className="w-5 h-5" />,
        },
        {
          label: "Cài đặt & Ngưỡng",
          href: "/settings",
          icon: <Settings className="w-5 h-5" />,
        },
      ],
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-200 border-r border-slate-800">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-slate-800">
        <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden">
          <img
            src="/logo.png"
            alt="Logo CĐ Bách Khoa Nam Sài Gòn"
            className="w-10 h-10 object-contain rounded-full bg-white p-0.5 shadow-sm flex-shrink-0"
          />
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-black text-xs tracking-tight text-white whitespace-nowrap leading-tight">
                CĐ BÁCH KHOA
              </span>
              <span className="text-[11px] font-bold text-red-400 leading-tight">
                NAM SÀI GÒN
              </span>
              <span className="text-[9px] text-slate-400 font-medium leading-none mt-0.5">
                Quản lý Máy in & Mực in
              </span>
            </div>
          )}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white"
          title={collapsed ? "Mở rộng" : "Thu gọn"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 custom-scrollbar">
        {sections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            {!collapsed && (
              <div className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                {section.title}
              </div>
            )}
            {section.items.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href) && item.href !== "/toner-transactions/new");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer Info */}
      {!collapsed && (
        <div className="p-3 bg-slate-950/80 border-t border-slate-800 text-xs text-slate-400 text-center">
          <p className="text-[10px] text-slate-400">Phát triển bởi</p>
          <p className="font-semibold text-slate-200 text-xs mt-0.5">Thầy Nguyễn Trọng Nghĩa</p>
        </div>
      )}
    </div>
  );

  return (
    <>
      <aside
        className={`hidden lg:flex flex-col flex-shrink-0 transition-all duration-300 z-30 ${
          collapsed ? "w-16" : "w-64"
        }`}
      >
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative flex flex-col w-72 max-w-full bg-slate-900 shadow-xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
