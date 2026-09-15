import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import { ToastProvider } from "../components/ui/Toast";

export const metadata: Metadata = {
  title: "Trường Cao Đẳng Bách Khoa Nam Sài Gòn - Quản lý Máy in & Mực in",
  description: "Hệ thống Quản lý Máy in, Mực in, Lịch sử nạp mực và Sửa chữa thiết bị - Trường Cao đẳng Bách Khoa Nam Sài Gòn",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </head>
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900">
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
