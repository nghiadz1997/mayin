"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  ArrowLeft,
  Printer as PrinterIcon,
  CheckCircle2,
  AlertOctagon,
  RefreshCw,
  Calendar,
  Clock,
  Plus,
  ArrowRight,
} from "lucide-react";
import { departmentService } from "../../../../services/departmentService";
import { printerService } from "../../../../services/printerService";
import { transactionService } from "../../../../services/transactionService";
import { Department, Printer, TonerTransaction } from "../../../../types";
import { formatDate, formatDateTime, PRINTER_STATUS_MAP, TRANSACTION_TYPE_MAP } from "../../../../lib/utils";

export default function DepartmentDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [department, setDepartment] = useState<Department | null>(null);
  const [deptPrinters, setDeptPrinters] = useState<Printer[]>([]);
  const [deptTransactions, setDeptTransactions] = useState<TonerTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [d, allP, allT] = await Promise.all([
          departmentService.getById(id),
          printerService.getAll(),
          transactionService.getAll(),
        ]);
        setDepartment(d);
        setDeptPrinters(allP.filter((p) => p.departmentId === id));
        setDeptTransactions(allT.filter((t) => t.departmentId === id));
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  const currentMonthNum = new Date().getMonth() + 1;
  const currentYearNum = new Date().getFullYear();

  const refillsThisMonth = useMemo(() => {
    return deptTransactions.filter((t) => {
      const d = new Date(t.transactionDate);
      return (
        d.getFullYear() === currentYearNum &&
        d.getMonth() + 1 === currentMonthNum &&
        t.transactionType === "refill"
      );
    }).length;
  }, [deptTransactions, currentYearNum, currentMonthNum]);

  const refillsThisYear = useMemo(() => {
    return deptTransactions.filter((t) => {
      const d = new Date(t.transactionDate);
      return d.getFullYear() === currentYearNum && t.transactionType === "refill";
    }).length;
  }, [deptTransactions, currentYearNum]);

  const lastRefillDate = useMemo(() => {
    if (deptTransactions.length === 0) return null;
    const sorted = [...deptTransactions].sort(
      (a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
    );
    return sorted[0].transactionDate;
  }, [deptTransactions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!department) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <p className="text-slate-600 font-semibold">Không tìm thấy Khoa / Phòng này.</p>
        <Link href="/departments" className="mt-2 text-xs text-blue-600 hover:underline">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/departments"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 uppercase">
                {department.code}
              </span>
              <span className="text-xs text-slate-400">
                {department.type === "faculty" ? "Khoa đào tạo" : "Phòng chức năng"}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              {department.name}
            </h1>
            {department.note && (
              <p className="text-xs text-slate-500 mt-0.5">{department.note}</p>
            )}
          </div>
        </div>

        <Link
          href={`/printers/new?departmentId=${department.id}`}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          + Thêm máy in cho Khoa này
        </Link>
      </div>

      {/* KPI Cards for Department */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Tổng máy</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{deptPrinters.length}</p>
          <span className="text-[10px] text-slate-400">thiết bị</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Hoạt động</span>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {deptPrinters.filter((p) => p.status === "active").length}
          </p>
          <span className="text-[10px] text-emerald-600 font-medium">sẵn sàng</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Hỏng</span>
          <p className="text-2xl font-bold text-rose-600 mt-1">
            {deptPrinters.filter((p) => p.status === "broken").length}
          </p>
          <span className="text-[10px] text-rose-600 font-medium">cần sửa</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Nạp mực tháng này</span>
          <p className="text-2xl font-bold text-blue-600 mt-1">{refillsThisMonth}</p>
          <span className="text-[10px] text-slate-400">lần trong T{currentMonthNum}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Nạp mực năm nay</span>
          <p className="text-2xl font-bold text-purple-600 mt-1">{refillsThisYear}</p>
          <span className="text-[10px] text-slate-400">lần năm {currentYearNum}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Lần nạp gần nhất</span>
          <p className="text-sm font-bold text-slate-800 mt-2 truncate">
            {formatDate(lastRefillDate)}
          </p>
          <span className="text-[10px] text-slate-400">ngày ghi nhận</span>
        </div>
      </div>

      {/* DANH SÁCH MÁY IN THUỘC KHOA/PHÒNG */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">DANH SÁCH MÁY IN</h3>
            <p className="text-xs text-slate-500">
              Các máy in hiện đang được bố trí sử dụng tại {department.name}
            </p>
          </div>
          <span className="text-xs font-semibold bg-slate-100 px-2.5 py-1 rounded-lg text-slate-700">
            {deptPrinters.length} máy
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Mã máy</th>
                <th className="py-3 px-4">Tên máy / Model</th>
                <th className="py-3 px-4">Hãng</th>
                <th className="py-3 px-4">Vị trí cụ thể</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {deptPrinters.map((p) => {
                const st = PRINTER_STATUS_MAP[p.status] || PRINTER_STATUS_MAP.active;
                return (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-blue-600 whitespace-nowrap">
                      {p.code}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <Link href={`/printers/${p.id}`} className="hover:text-blue-600">
                        {p.name}
                      </Link>
                      <p className="text-[11px] text-slate-400 font-normal">{p.model}</p>
                    </td>
                    <td className="py-3.5 px-4">{p.brand}</td>
                    <td className="py-3.5 px-4 text-slate-600">{p.location}</td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${st.bg} ${st.color}`}
                      >
                        {st.label}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <Link
                        href={`/printers/${p.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                      >
                        Xem máy <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                );
              })}

              {deptPrinters.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Khoa / Phòng này chưa được phân bổ máy in nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* LỊCH SỬ NẠP MỰC GẦN ĐÂY CỦA KHOA */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">LỊCH SỬ NẠP MỰC GẦN ĐÂY</h3>
            <p className="text-xs text-slate-500">
              Nhật ký nạp và thay cartridge thuộc Khoa {department.code}
            </p>
          </div>
          <Link
            href={`/toner-transactions?deptId=${department.id}`}
            className="text-xs font-semibold text-blue-600 hover:underline"
          >
            Xem tất cả &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Ngày</th>
                <th className="py-3 px-4">Mã máy</th>
                <th className="py-3 px-4">Model</th>
                <th className="py-3 px-4">Loại thao tác</th>
                <th className="py-3 px-4">Mã mực</th>
                <th className="py-3 px-3 text-center">SL</th>
                <th className="py-3 px-4">Người thực hiện</th>
                <th className="py-3 px-4">Đơn vị cung cấp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {deptTransactions.slice(0, 10).map((tx) => {
                const typeInfo =
                  TRANSACTION_TYPE_MAP[tx.transactionType] || TRANSACTION_TYPE_MAP.refill;
                return (
                  <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                      {formatDate(tx.transactionDate)}
                    </td>
                    <td className="py-3 px-4 font-bold text-blue-600 whitespace-nowrap">
                      {tx.printerCodeSnapshot}
                    </td>
                    <td className="py-3 px-4">{tx.printerModelSnapshot}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${typeInfo.bg} ${typeInfo.color}`}
                      >
                        {typeInfo.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">{tx.tonerCodeSnapshot}</td>
                    <td className="py-3 px-3 text-center font-bold">{tx.quantity}</td>
                    <td className="py-3 px-4">{tx.performedBy}</td>
                    <td className="py-3 px-4 text-slate-500">{tx.supplier}</td>
                  </tr>
                );
              })}

              {deptTransactions.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Chưa có lịch sử nạp mực nào cho đơn vị này.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
