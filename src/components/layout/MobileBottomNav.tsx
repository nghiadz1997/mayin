"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Printer,
  RefreshCw,
  Wrench,
} from "lucide-react";

export const MobileBottomNav: React.FC = () => {
  const pathname = usePathname();

  // Do not show on login or public QR scan pages
  if (pathname.startsWith("/login") || pathname.startsWith("/p/")) {
    return null;
  }

  const navItems = [
    {
      label: "Tổng quan",
      href: "/dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      label: "Khoa/Phòng",
      href: "/departments",
      icon: <Building2 className="w-5 h-5" />,
    },
    {
      label: "Nạp mực",
      href: "/toner-transactions/new",
      icon: <RefreshCw className="w-5 h-5" />,
      highlight: true,
    },
    {
      label: "Máy in",
      href: "/printers",
      icon: <Printer className="w-5 h-5" />,
    },
    {
      label: "Sửa chữa",
      href: "/repairs",
      icon: <Wrench className="w-5 h-5" />,
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 lg:hidden shadow-lg safe-area-bottom">
      <div className="grid grid-cols-5 h-16 items-center px-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" &&
              item.href !== "/toner-transactions/new" &&
              pathname.startsWith(item.href));

          if (item.highlight) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center -mt-5 group"
              >
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/40 border-4 border-slate-50 group-active:scale-95 transition-transform">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-blue-600 mt-1">{item.label}</span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center h-full transition-colors ${
                isActive ? "text-blue-600 font-bold" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <div className="relative">
                {item.icon}
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full" />
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
