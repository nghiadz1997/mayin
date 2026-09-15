"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  History,
  Search,
  Plus,
  Filter,
  Calendar,
  Layers,
  ArrowRight,
  Download,
  Trash2,
} from "lucide-react";
import { transactionService } from "../../../services/transactionService";
import { departmentService } from "../../../services/departmentService";
import { printerService } from "../../../services/printerService";
import { tonerService } from "../../../services/tonerService";
import {
  TonerTransaction,
  Department,
  Printer as IPrinter,
  TonerType,
} from "../../../types";
import { formatDate, TRANSACTION_TYPE_MAP } from "../../../lib/utils";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../components/ui/Toast";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";

export default function TonerTransactionsPage() {
  const searchParams = useSearchParams();
  const initialDeptId = searchParams.get("deptId") || "all";
  const initialPrinterCode = searchParams.get("printerCode") || "";

  const { canPerformOperations, canManageSystem } = useAuth();
  const toast = useToast();

  const [transactions, setTransactions] = useState<TonerTransaction[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [printers, setPrinters] = useState<IPrinter[]>([]);
  const [toners, setToners] = useState<TonerType[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState(initialPrinterCode);
  const [deptFilter, setDeptFilter] = useState(initialDeptId);
  const [typeFilter, setTypeFilter] = useState("all");
  const [tonerFilter, setTonerFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [yearFilter, setYearFilter] = useState("2026");

  // Delete transaction target
  const [deleteTarget, setDeleteTarget] = useState<TonerTransaction | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [txList, dList, pList, tList] = await Promise.all([
        transactionService.getAll(),
        departmentService.getAll(),
        printerService.getAll(),
        tonerService.getAll(),
      ]);
      setTransactions(txList);
      setDepartments(dList);
      setPrinters(pList);
      setToners(tList);
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await transactionService.delete(deleteTarget.id);
      toast.success("Đã xóa bản ghi giao dịch mực");
      setDeleteTarget(null);
      loadData();
    } catch {
      toast.error("Không thể xóa giao dịch");
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        tx.printerCodeSnapshot.toLowerCase().includes(q) ||
        tx.printerModelSnapshot.toLowerCase().includes(q) ||
        tx.departmentNameSnapshot.toLowerCase().includes(q) ||
        tx.tonerCodeSnapshot.toLowerCase().includes(q) ||
        tx.performedBy.toLowerCase().includes(q) ||
        tx.supplier.toLowerCase().includes(q);

      const matchesDept = deptFilter === "all" || tx.departmentId === deptFilter;
      const matchesType = typeFilter === "all" || tx.transactionType === typeFilter;
      const matchesToner = tonerFilter === "all" || tx.tonerTypeId === tonerFilter;

      const txTime = new Date(tx.transactionDate).getTime();
      const matchesYear =
        yearFilter === "all" ||
        new Date(tx.transactionDate).getFullYear().toString() === yearFilter;

      const matchesFrom = !fromDate || txTime >= new Date(fromDate).getTime();
      const matchesTo = !toDate || txTime <= new Date(toDate).getTime() + 86400000;

      return (
        matchesSearch &&
        matchesDept &&
        matchesType &&
        matchesToner &&
        matchesYear &&
        matchesFrom &&
        matchesTo
      );
    });
  }, [transactions, search, deptFilter, typeFilter, tonerFilter, yearFilter, fromDate, toDate]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <History className="w-6 h-6 text-blue-600" />
            Lịch Sử Nạp & Thay Mực Toàn Trường
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi chi tiết từng lượt nạp mực, thay cartridge với snapshot Khoa/Phòng bảo lưu chính xác
          </p>
        </div>

        {canPerformOperations && (
          <Link
            href="/toner-transactions/new"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm shadow-blue-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            + Ghi nhận nạp mực mới
          </Link>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo Mã máy (PRN-CNTT-001), Model, Tên đơn vị snapshot, Mực, Người thực hiện..."
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
          {/* Dept */}
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">Tất cả Khoa / Phòng</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.code} - {d.name}
              </option>
            ))}
          </select>

          {/* Operation Type */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">Tất cả thao tác</option>
            <option value="refill">Nạp mực</option>
            <option value="replace">Thay hộp mực</option>
            <option value="drum">Thay Drum</option>
            <option value="other">Khác</option>
          </select>

          {/* Toner */}
          <select
            value={tonerFilter}
            onChange={(e) => setTonerFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">Tất cả loại mực</option>
            {toners.map((t) => (
              <option key={t.id} value={t.id}>
                {t.code}
              </option>
            ))}
          </select>

          {/* Year */}
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">Tất cả các năm</option>
            <option value="2026">Năm 2026</option>
            <option value="2025">Năm 2025</option>
            <option value="2024">Năm 2024</option>
          </select>

          {/* Reset button */}
          <button
            onClick={() => {
              setSearch("");
              setDeptFilter("all");
              setTypeFilter("all");
              setTonerFilter("all");
              setYearFilter("all");
              setFromDate("");
              setToDate("");
            }}
            className="text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200 p-2 transition-colors"
          >
            Đặt lại bộ lọc
          </button>
        </div>

        {/* Optional Date Range */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-500">
          <span>Khoảng ngày cụ thể:</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-md p-1.5 text-xs text-slate-700"
          />
          <span>đến</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-md p-1.5 text-xs text-slate-700"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-3.5 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Tìm thấy <strong className="text-slate-900">{filteredTransactions.length}</strong> bản ghi giao dịch
          </span>
          <span className="text-[11px] text-slate-400">
            * Cột Khoa/Phòng luôn bảo lưu đơn vị thực tế tại thời điểm thực hiện
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-4 whitespace-nowrap">Ngày</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Mã máy</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Model</th>
                <th className="py-3.5 px-4">Khoa / Phòng (Snapshot)</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Thao tác</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Hộp mực</th>
                <th className="py-3.5 px-3 text-center">SL</th>
                <th className="py-3.5 px-4">Người thực hiện</th>
                <th className="py-3.5 px-4">Đơn vị cung cấp</th>
                <th className="py-3.5 px-4">Ghi chú</th>
                {canManageSystem && <th className="py-3.5 px-3 text-right">Xóa</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredTransactions.map((tx) => {
                const typeInfo =
                  TRANSACTION_TYPE_MAP[tx.transactionType] || TRANSACTION_TYPE_MAP.refill;
                return (
                  <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-600">
                      {formatDate(tx.transactionDate)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <Link
                        href={`/printers/${tx.printerId}`}
                        className="font-bold text-blue-600 hover:underline"
                      >
                        {tx.printerCodeSnapshot}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-800">
                      {tx.printerModelSnapshot}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 max-w-[200px] truncate" title={tx.departmentNameSnapshot}>
                      {tx.departmentNameSnapshot}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${typeInfo.bg} ${typeInfo.color}`}
                      >
                        {typeInfo.label}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-purple-700 whitespace-nowrap">
                      {tx.tonerCodeSnapshot}
                    </td>
                    <td className="py-3.5 px-3 text-center font-bold text-slate-900">
                      {tx.quantity}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">{tx.performedBy}</td>
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">{tx.supplier}</td>
                    <td className="py-3.5 px-4 text-slate-500 max-w-[150px] truncate" title={tx.note}>
                      {tx.note || "--"}
                    </td>
                    {canManageSystem && (
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => setDeleteTarget(tx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Xóa bản ghi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}

              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    Không tìm thấy lịch sử nạp mực nào phù hợp với bộ lọc.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Modal */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Xác nhận xóa bản ghi nạp mực?"
        message={
          <div>
            <p className="font-semibold text-slate-900">
              {deleteTarget?.printerCodeSnapshot} &bull; {deleteTarget?.tonerCodeSnapshot} &bull; Ngày: {formatDate(deleteTarget?.transactionDate)}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Thao tác này sẽ xóa bản ghi khỏi lịch sử.
            </p>
          </div>
        }
        confirmText="Xóa bản ghi"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
