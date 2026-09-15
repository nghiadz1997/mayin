"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Printer as PrinterIcon,
  Search,
  Plus,
  QrCode,
  Eye,
  Edit,
  ArrowRightLeft,
  Trash2,
  Filter,
  CheckCircle2,
  AlertOctagon,
  Wrench,
  PauseCircle,
  X,
} from "lucide-react";
import { printerService } from "../../../services/printerService";
import { departmentService } from "../../../services/departmentService";
import { tonerService } from "../../../services/tonerService";
import { transactionService } from "../../../services/transactionService";
import { Printer, Department, TonerType, TonerTransaction, PrinterStatus } from "../../../types";
import { formatDate, PRINTER_STATUS_MAP, PRINTER_TYPE_MAP } from "../../../lib/utils";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../components/ui/Toast";
import { QrCodeModal } from "../../../components/printers/QrCodeModal";
import { TransferPrinterModal } from "../../../components/printers/TransferPrinterModal";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";

export default function PrintersPage() {
  const { canManagePrinters } = useAuth();
  const toast = useToast();

  const [printers, setPrinters] = useState<Printer[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [toners, setToners] = useState<TonerType[]>([]);
  const [transactions, setTransactions] = useState<TonerTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [qrModalPrinter, setQrModalPrinter] = useState<Printer | null>(null);
  const [transferModalPrinter, setTransferModalPrinter] = useState<Printer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Printer | null>(null);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [tonerFilter, setTonerFilter] = useState<string>("all");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [p, d, ton, tx] = await Promise.all([
        printerService.getAll(),
        departmentService.getAll(),
        tonerService.getAll(),
        transactionService.getAll(),
      ]);
      setPrinters(p);
      setDepartments(d);
      setToners(ton);
      setTransactions(tx);
    } finally {
      setLoading(false);
    }
  }

  // Calculate last refill date for each printer
  const lastRefillMap = useMemo(() => {
    const map: Record<string, string | null> = {};
    printers.forEach((p) => {
      const pTxs = transactions
        .filter((t) => t.printerId === p.id && t.transactionType === "refill")
        .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());
      map[p.id] = pTxs.length > 0 ? pTxs[0].transactionDate : null;
    });
    return map;
  }, [printers, transactions]);

  // Unique brands for filter
  const brands = useMemo(() => {
    return Array.from(new Set(printers.map((p) => p.brand).filter(Boolean)));
  }, [printers]);

  // Filtered printers
  const filteredPrinters = useMemo(() => {
    return printers.filter((p) => {
      const dept = departments.find((d) => d.id === p.departmentId);
      const toner = toners.find((t) => t.id === p.tonerTypeId);

      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        p.code.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.model.toLowerCase().includes(q) ||
        p.serialNumber.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        (dept && (dept.name.toLowerCase().includes(q) || dept.code.toLowerCase().includes(q))) ||
        (toner && toner.code.toLowerCase().includes(q));

      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      const matchesDept = deptFilter === "all" || p.departmentId === deptFilter;
      const matchesBrand = brandFilter === "all" || p.brand === brandFilter;
      const matchesToner = tonerFilter === "all" || p.tonerTypeId === tonerFilter;

      return matchesSearch && matchesStatus && matchesDept && matchesBrand && matchesToner;
    });
  }, [printers, departments, toners, search, statusFilter, deptFilter, brandFilter, tonerFilter]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await printerService.delete(deleteTarget.id);
      toast.success(`Đã xóa máy in ${deleteTarget.code}`);
      setDeleteTarget(null);
      loadData();
    } catch {
      toast.error("Không thể xóa máy in");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <PrinterIcon className="w-6 h-6 text-blue-600" />
            Quản lý Danh sách Máy in
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Toàn bộ {printers.length} máy in được phân bổ tại các Khoa / Phòng trong trường
          </p>
        </div>

        {canManagePrinters && (
          <Link
            href="/printers/new"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm shadow-blue-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            + Thêm máy in mới
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
            placeholder="Tìm theo Mã máy, Model, Serial, Tên Khoa/Phòng, Loại mực (VD: PRN-CNTT-001, HL-L2321D, TN-2385)..."
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          {/* Department Filter */}
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

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">Tất cả Trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="broken">Đang hỏng</option>
            <option value="repairing">Đang sửa chữa</option>
            <option value="inactive">Tạm ngưng</option>
            <option value="disposed">Đã thanh lý</option>
          </select>

          {/* Brand Filter */}
          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">Tất cả Hãng máy</option>
            {brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          {/* Toner Filter */}
          <select
            value={tonerFilter}
            onChange={(e) => setTonerFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">Tất cả Loại mực</option>
            {toners.map((t) => (
              <option key={t.id} value={t.id}>
                {t.code} ({t.brand})
              </option>
            ))}
          </select>
        </div>

        {(search || statusFilter !== "all" || deptFilter !== "all" || brandFilter !== "all" || tonerFilter !== "all") && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500">
              Tìm thấy <strong className="text-slate-900">{filteredPrinters.length}</strong> máy in
            </span>
            <button
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
                setDeptFilter("all");
                setBrandFilter("all");
                setTonerFilter("all");
              }}
              className="text-blue-600 hover:underline font-medium"
            >
              Đặt lại tất cả bộ lọc
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-4">Mã máy</th>
                <th className="py-3.5 px-4">Tên máy / Hãng</th>
                <th className="py-3.5 px-4">Model & Serial</th>
                <th className="py-3.5 px-4">Khoa / Phòng</th>
                <th className="py-3.5 px-4">Vị trí</th>
                <th className="py-3.5 px-3">Mực sử dụng</th>
                <th className="py-3.5 px-3 text-center">Trạng thái</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Nạp gần nhất</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredPrinters.map((printer) => {
                const dept = departments.find((d) => d.id === printer.departmentId);
                const toner = toners.find((t) => t.id === printer.tonerTypeId);
                const st = PRINTER_STATUS_MAP[printer.status] || PRINTER_STATUS_MAP.active;
                const lastRefill = lastRefillMap[printer.id];

                return (
                  <tr key={printer.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Code */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <Link
                        href={`/printers/${printer.id}`}
                        className="font-bold text-blue-600 hover:underline flex items-center gap-1.5"
                      >
                        {printer.code}
                      </Link>
                    </td>

                    {/* Name & Brand */}
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <Link href={`/printers/${printer.id}`} className="hover:text-blue-600">
                        {printer.name}
                      </Link>
                      <p className="text-[11px] text-slate-400 font-normal">{printer.brand}</p>
                    </td>

                    {/* Model & Serial */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-800">{printer.model}</span>
                      <p className="text-[10px] text-slate-400">SN: {printer.serialNumber}</p>
                    </td>

                    {/* Department */}
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {dept ? (
                        <Link
                          href={`/departments/${dept.id}`}
                          className="hover:text-blue-600 hover:underline"
                        >
                          {dept.name}
                        </Link>
                      ) : (
                        <span className="text-slate-400">Chưa gán</span>
                      )}
                    </td>

                    {/* Location */}
                    <td className="py-3.5 px-4 text-slate-600 max-w-[150px] truncate" title={printer.location}>
                      {printer.location}
                    </td>

                    {/* Toner */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      {toner ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                          {toner.code}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">N/A</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${st.bg} ${st.color}`}
                      >
                        {st.label}
                      </span>
                    </td>

                    {/* Last Refill */}
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {formatDate(lastRefill)}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        {/* QR Code Button */}
                        <button
                          onClick={() => setQrModalPrinter(printer)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Xem / In mã QR"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>

                        {/* View Detail */}
                        <Link
                          href={`/printers/${printer.id}`}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>

                        {canManagePrinters && (
                          <>
                            {/* Transfer */}
                            <button
                              onClick={() => setTransferModalPrinter(printer)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Điều chuyển Khoa/Phòng"
                            >
                              <ArrowRightLeft className="w-4 h-4" />
                            </button>

                            {/* Edit */}
                            <Link
                              href={`/printers/${printer.id}/edit`}
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              title="Chỉnh sửa thông tin"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>

                            {/* Delete */}
                            <button
                              onClick={() => setDeleteTarget(printer)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Xóa máy"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredPrinters.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Không tìm thấy máy in nào phù hợp với bộ lọc tìm kiếm.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Code Modal */}
      {qrModalPrinter && (
        <QrCodeModal
          isOpen={Boolean(qrModalPrinter)}
          onClose={() => setQrModalPrinter(null)}
          printerCode={qrModalPrinter.code}
          printerName={qrModalPrinter.name}
          printerModel={`${qrModalPrinter.brand} ${qrModalPrinter.model}`}
          departmentName={
            departments.find((d) => d.id === qrModalPrinter.departmentId)?.name || ""
          }
        />
      )}

      {/* Transfer Printer Modal */}
      {transferModalPrinter && (
        <TransferPrinterModal
          isOpen={Boolean(transferModalPrinter)}
          onClose={() => setTransferModalPrinter(null)}
          printer={transferModalPrinter}
          departments={departments}
          onSuccess={loadData}
        />
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Xác nhận xóa máy in?"
        message={
          <div>
            <p className="font-semibold text-slate-900">
              {deleteTarget?.code} - {deleteTarget?.name} ({deleteTarget?.model})
            </p>
            <p className="text-xs text-rose-600 mt-2 font-medium">
              Cảnh báo: Thao tác này sẽ gỡ máy in khỏi hệ thống.
            </p>
          </div>
        }
        confirmText="Xác nhận xóa"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
