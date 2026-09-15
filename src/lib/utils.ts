import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO, isValid } from "date-fns";
import { vi } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: any): string {
  if (!date) return "--/--/----";
  try {
    let d: Date;
    if (typeof date === "string") {
      d = parseISO(date);
      if (!isValid(d)) d = new Date(date);
    } else if (date?.toDate && typeof date.toDate === "function") {
      d = date.toDate();
    } else if (date instanceof Date) {
      d = date;
    } else if (typeof date === "number") {
      d = new Date(date);
    } else if (date?.seconds) {
      d = new Date(date.seconds * 1000);
    } else {
      return "--/--/----";
    }

    if (!isValid(d)) return "--/--/----";
    return format(d, "dd/MM/yyyy", { locale: vi });
  } catch {
    return "--/--/----";
  }
}

export function formatDateTime(date: any): string {
  if (!date) return "--/--/---- --:--";
  try {
    let d: Date;
    if (typeof date === "string") {
      d = parseISO(date);
      if (!isValid(d)) d = new Date(date);
    } else if (date?.toDate && typeof date.toDate === "function") {
      d = date.toDate();
    } else if (date instanceof Date) {
      d = date;
    } else if (typeof date === "number") {
      d = new Date(date);
    } else if (date?.seconds) {
      d = new Date(date.seconds * 1000);
    } else {
      return "--/--/---- --:--";
    }

    if (!isValid(d)) return "--/--/---- --:--";
    return format(d, "dd/MM/yyyy HH:mm", { locale: vi });
  } catch {
    return "--/--/---- --:--";
  }
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

export function generatePrinterCode(deptCode: string, existingCount: number = 0): string {
  const cleanCode = deptCode
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .slice(0, 5) || "PRN";
  const num = String(existingCount + 1).padStart(3, "0");
  return `PRN-${cleanCode}-${num}`;
}

export const PRINTER_STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: "Đang hoạt động", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  broken: { label: "Đang hỏng", color: "text-rose-700", bg: "bg-rose-50 border-rose-200" },
  repairing: { label: "Đang sửa chữa", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  inactive: { label: "Tạm ngưng", color: "text-slate-700", bg: "bg-slate-50 border-slate-200" },
  disposed: { label: "Đã thanh lý", color: "text-zinc-600", bg: "bg-zinc-100 border-zinc-200" },
};

export const REPAIR_STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "Chờ xử lý", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  checking: { label: "Đang kiểm tra", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  repairing: { label: "Đang sửa chữa", color: "text-indigo-700", bg: "bg-indigo-50 border-indigo-200" },
  waiting_parts: { label: "Chờ linh kiện", color: "text-orange-700", bg: "bg-orange-50 border-orange-200" },
  completed: { label: "Đã hoàn thành", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  unrepairable: { label: "Không thể sửa", color: "text-rose-700", bg: "bg-rose-50 border-rose-200" },
};

export const TRANSACTION_TYPE_MAP: Record<string, { label: string; color: string; bg: string }> = {
  refill: { label: "Nạp mực", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  replace: { label: "Thay hộp mực", color: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
  drum: { label: "Thay Drum", color: "text-cyan-700", bg: "bg-cyan-50 border-cyan-200" },
  other: { label: "Khác", color: "text-slate-700", bg: "bg-slate-50 border-slate-200" },
};

export const PRINTER_TYPE_MAP: Record<string, string> = {
  laser: "Máy in Laser",
  inkjet: "Máy in phun",
  multifunction: "Máy đa chức năng",
  photocopier: "Máy photocopy",
  other: "Khác",
};
