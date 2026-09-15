"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Building2, Search, Plus, Eye, Edit, EyeOff, CheckCircle, AlertCircle, RefreshCw, Printer as PrinterIcon } from "lucide-react";
import { departmentService } from "../../../services/departmentService";
import { printerService } from "../../../services/printerService";
import { transactionService } from "../../../services/transactionService";
import { Department, Printer, TonerTransaction } from "../../../types";
import { formatDate } from "../../../lib/utils";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../components/ui/Toast";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";

export default function DepartmentsPage() {
  const { canManageSystem, canManagePrinters } = useAuth();
  const toast = useToast();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [transactions, setTransactions] = useState<TonerTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Toggle Hide/Show modal
  const [hideTarget, setHideTarget] = useState<Department | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [d, p, t] = await Promise.all([
        departmentService.getAll(),
        printerService.getAll(),
        transactionService.getAll(),
      ]);
      setDepartments(d);
      setPrinters(p);
      setTransactions(t);
    } finally {
      setLoading(false);
    }
  }

  const handleToggleStatus = async () => {
    if (!hideTarget) return;
    try {
      await departmentService.toggleStatus(hideTarget.id, hideTarget.status);
      toast.success(
        `Đã ${hideTarget.status === "active" ? "ẩn" : "kích hoạt"} đơn vị ${hideTarget.name}`
      );
      setHideTarget(null);
      loadData();
    } catch {
      toast.error("Không thể thay đổi trạng thái đơn vị");
    }
  };

  const currentMonthNum = new Date().getMonth() + 1;
  const currentYearNum = new Date().getFullYear();

  // Compute department stats
  const deptStats = useMemo(() => {
    const map: Record<
      string,
      {
        total: number;
        active: number;
        broken: number;
        repairing: number;
        refillThisMonth: number;
        lastRefillDate: string | null;
      }
    > = {};

    departments.forEach((d) => {
      const deptPrinters = printers.filter((p) => p.departmentId === d.id);
      const deptTxs = transactions.filter((t) => t.departmentId === d.id);

      const refillThisMonth = deptTxs.filter((t) => {
        const txDate = new Date(t.transactionDate);
        return (
          txDate.getFullYear() === currentYearNum &&
          txDate.getMonth() + 1 === currentMonthNum &&
          t.transactionType === "refill"
        );
      }).length;

      const lastTx = deptTxs.sort(
        (a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
      )[0];

      map[d.id] = {
        total: deptPrinters.length,
        active: deptPrinters.filter((p) => p.status === "active").length,
        broken: deptPrinters.filter((p) => p.status === "broken").length,
        repairing: deptPrinters.filter((p) => p.status === "repairing").length,
        refillThisMonth,
        lastRefillDate: lastTx ? lastTx.transactionDate : null,
      };
    });

    return map;
  }, [departments, printers, transactions, currentYearNum, currentMonthNum]);

  // Filtered departments list
  const filteredDepartments = useMemo(() => {
    return departments.filter((d) => {
      const matchesSearch =
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.code.toLowerCase().includes(search.toLowerCase());

      const matchesType =
        typeFilter === "all" ||
        (typeFilter === "faculty" && d.type === "faculty") ||
        (typeFilter === "office" && d.type === "office");

      const matchesStatus = statusFilter === "all" || d.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [departments, search, typeFilter, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-blue-600" />
            Danh sách Khoa & Phòng / Ban
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý các Khoa đào tạo và Phòng ban chức năng trong toàn trường ({departments.length} đơn vị)
          </p>
        </div>

        {canManageSystem && (
          <Link
            href="/departments/new"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm shadow-blue-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            + Thêm Khoa / Phòng mới
          </Link>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên hoặc mã đơn vị (CNTT-KTĐ, QTTB, HSSV...)"
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full md:w-44 text-xs bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">Tất cả loại đơn vị</option>
            <option value="faculty">Khoa đào tạo (6)</option>
            <option value="office">Phòng ban (8)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-36 text-xs bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Đã ẩn / Tạm ngưng</option>
          </select>
        </div>
      </div>

      {/* Mobile App Cards (Phones) */}
      <div className="space-y-3 sm:hidden">
        {filteredDepartments.map((dept) => {
          const s = deptStats[dept.id] || {
            total: 0,
            active: 0,
            broken: 0,
            repairing: 0,
            refillThisMonth: 0,
            lastRefillDate: null,
          };

          return (
            <div
              key={dept.id}
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3 active:border-blue-300 transition-all"
            >
              {/* Header: Code & Type */}
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-100">
                  {dept.code}
                </span>
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                    dept.type === "faculty"
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : "bg-purple-50 text-purple-700 border-purple-200"
                  }`}
                >
                  {dept.type === "faculty" ? "Khoa đào tạo" : "Phòng chức năng"}
                </span>
              </div>

              {/* Name */}
              <div>
                <Link
                  href={`/departments/${dept.id}`}
                  className="font-bold text-slate-900 text-sm hover:text-blue-600"
                >
                  {dept.name}
                </Link>
                {dept.note && (
                  <p className="text-[11px] text-slate-400 mt-0.5">{dept.note}</p>
                )}
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-xl text-center border border-slate-100 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block">Tổng máy</span>
                  <span className="font-bold text-slate-800">{s.total}</span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-600 block">Hoạt động</span>
                  <span className="font-bold text-emerald-600">{s.active}</span>
                </div>
                <div>
                  <span className="text-[10px] text-rose-600 block">Hỏng/Sửa</span>
                  <span className="font-bold text-rose-600">{s.broken + s.repairing}</span>
                </div>
                <div>
                  <span className="text-[10px] text-blue-600 block">Nạp T{currentMonthNum}</span>
                  <span className="font-bold text-blue-600">{s.refillThisMonth}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                <Link
                  href={`/departments/${dept.id}`}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 active:scale-95 transition-all text-center"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Xem chi tiết
                </Link>
                <Link
                  href={`/printers?dept=${dept.id}`}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 active:scale-95 transition-all text-center"
                >
                  <PrinterIcon className="w-3.5 h-3.5" />
                  Máy in ({s.total})
                </Link>
              </div>
            </div>
          );
        })}

        {filteredDepartments.length === 0 && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
            Không tìm thấy Khoa / Phòng nào phù hợp.
          </div>
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden sm:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-4">Mã</th>
                <th className="py-3.5 px-4">Tên Khoa / Phòng</th>
                <th className="py-3.5 px-4">Phân loại</th>
                <th className="py-3.5 px-3 text-center">Tổng máy</th>
                <th className="py-3.5 px-3 text-center">Hoạt động</th>
                <th className="py-3.5 px-3 text-center">Hỏng</th>
                <th className="py-3.5 px-3 text-center">Đang sửa</th>
                <th className="py-3.5 px-3 text-center">Nạp T{currentMonthNum}</th>
                <th className="py-3.5 px-4">Lần nạp gần nhất</th>
                <th className="py-3.5 px-4 text-center">Trạng thái</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredDepartments.map((dept) => {
                const s = deptStats[dept.id] || {
                  total: 0,
                  active: 0,
                  broken: 0,
                  repairing: 0,
                  refillThisMonth: 0,
                  lastRefillDate: null,
                };

                return (
                  <tr key={dept.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-blue-600 whitespace-nowrap">
                      {dept.code}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <Link
                        href={`/departments/${dept.id}`}
                        className="hover:text-blue-600 transition-colors"
                      >
                        {dept.name}
                      </Link>
                      {dept.note && (
                        <p className="text-[11px] text-slate-400 font-normal">{dept.note}</p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          dept.type === "faculty"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-purple-50 text-purple-700 border-purple-200"
                        }`}
                      >
                        {dept.type === "faculty" ? "Khoa đào tạo" : "Phòng chức năng"}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center font-bold text-slate-800">{s.total}</td>
                    <td className="py-3.5 px-3 text-center font-semibold text-emerald-600">
                      {s.active}
                    </td>
                    <td className="py-3.5 px-3 text-center font-semibold text-rose-600">
                      {s.broken > 0 ? (
                        <span className="px-1.5 py-0.5 bg-rose-50 rounded text-rose-700">
                          {s.broken}
                        </span>
                      ) : (
                        "0"
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-center font-semibold text-amber-600">
                      {s.repairing > 0 ? (
                        <span className="px-1.5 py-0.5 bg-amber-50 rounded text-amber-700">
                          {s.repairing}
                        </span>
                      ) : (
                        "0"
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-center font-bold text-blue-600">
                      {s.refillThisMonth}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {formatDate(s.lastRefillDate)}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          dept.status === "active"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {dept.status === "active" ? "Hoạt động" : "Tạm ngưng"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/departments/${dept.id}`}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        {canManageSystem && (
                          <button
                            onClick={() => setHideTarget(dept)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title={dept.status === "active" ? "Ẩn đơn vị" : "Kích hoạt lại"}
                          >
                            <EyeOff className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredDepartments.length === 0 && (
                <tr>
                  <td colSpan={11} className="py-10 text-center text-slate-400">
                    Không tìm thấy Khoa/Phòng nào phù hợp với bộ lọc.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirm Hide/Toggle Dialog */}
      <ConfirmDialog
        isOpen={Boolean(hideTarget)}
        title={hideTarget?.status === "active" ? "Ẩn đơn vị này?" : "Kích hoạt lại đơn vị này?"}
        message={
          <div>
            <p className="font-semibold text-slate-800">
              {hideTarget?.name} ({hideTarget?.code})
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {hideTarget?.status === "active"
                ? "Lưu ý: Đơn vị sẽ không bị xóa cứng khỏi cơ sở dữ liệu để bảo toàn toàn bộ lịch sử nạp mực và sửa chữa trong quá khứ."
                : "Đơn vị sẽ xuất hiện lại bình thường trên toàn hệ thống."}
            </p>
          </div>
        }
        confirmText={hideTarget?.status === "active" ? "Xác nhận ẩn" : "Kích hoạt"}
        variant={hideTarget?.status === "active" ? "warning" : "primary"}
        onConfirm={handleToggleStatus}
        onCancel={() => setHideTarget(null)}
      />
    </div>
  );
}
