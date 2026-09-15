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
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/80 lg:hidden shadow-[0_-4px_25px_rgba(0,0,0,0.08)] safe-area-bottom">
      <div className="grid grid-cols-5 h-16 items-center px-1 max-w-md mx-auto">
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
                className="flex flex-col items-center justify-center -mt-6 group focus:outline-none"
              >
                <div className="w-13 h-13 p-3.5 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/40 border-[3px] border-white active:scale-90 transition-all duration-150">
                  <RefreshCw className="w-5 h-5 group-active:rotate-180 transition-transform duration-300" />
                </div>
                <span className="text-[10px] font-bold text-blue-600 mt-0.5 tracking-tight">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center h-full py-1.5 transition-all duration-150 active:scale-95 focus:outline-none ${
                isActive ? "text-blue-600" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <div
                className={`flex items-center justify-center w-10 h-7 rounded-full transition-colors ${
                  isActive ? "bg-blue-100/70 text-blue-600" : "bg-transparent"
                }`}
              >
                {item.icon}
              </div>
              <span
                className={`text-[10px] tracking-tight mt-0.5 ${
                  isActive ? "font-bold text-blue-600" : "font-medium text-slate-500"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
