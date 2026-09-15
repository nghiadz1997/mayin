"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Printer as PrinterIcon,
  ArrowLeft,
  QrCode,
  ArrowRightLeft,
  Wrench,
  RefreshCw,
  Edit,
  Building2,
  MapPin,
  Tag,
  Calendar,
  Layers,
  History,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertOctagon,
  FileText,
  User,
  ArrowDown,
} from "lucide-react";
import { printerService } from "../../../../services/printerService";
import { departmentService } from "../../../../services/departmentService";
import { tonerService } from "../../../../services/tonerService";
import { transactionService } from "../../../../services/transactionService";
import { repairService } from "../../../../services/repairService";
import { auditService } from "../../../../services/auditService";
import {
  Printer,
  Department,
  TonerType,
  TonerTransaction,
  Repair,
  PrinterTransfer,
  AuditLog,
} from "../../../../types";
import {
  formatDate,
  formatDateTime,
  PRINTER_STATUS_MAP,
  PRINTER_TYPE_MAP,
  TRANSACTION_TYPE_MAP,
  REPAIR_STATUS_MAP,
} from "../../../../lib/utils";
import { QrCodeModal } from "../../../../components/printers/QrCodeModal";
import { TransferPrinterModal } from "../../../../components/printers/TransferPrinterModal";
import { useAuth } from "../../../../context/AuthContext";

export default function PrinterDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { canManagePrinters, canPerformOperations } = useAuth();

  const [printer, setPrinter] = useState<Printer | null>(null);
  const [department, setDepartment] = useState<Department | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [toner, setToner] = useState<TonerType | null>(null);
  const [transactions, setTransactions] = useState<TonerTransaction[]>([]);
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [transfers, setTransfers] = useState<PrinterTransfer[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Tab: 'overview' | 'toner' | 'repair' | 'transfer' | 'logs'
  const [activeTab, setActiveTab] = useState<"overview" | "toner" | "repair" | "transfer" | "logs">("overview");

  // Modals
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    try {
      setLoading(true);
      const p = await printerService.getById(id);
      if (!p) {
        setLoading(false);
        return;
      }
      setPrinter(p);

      const [dList, tList, allTxs, allReps, trfs, logs] = await Promise.all([
        departmentService.getAll(),
        tonerService.getAll(),
        transactionService.getByPrinterId(id),
        repairService.getByPrinterId(id),
        printerService.getTransfersByPrinterId(id),
        auditService.getAll(),
      ]);

      setDepartments(dList);
      setDepartment(dList.find((d) => d.id === p.departmentId) || null);
      setToner(tList.find((t) => t.id === p.tonerTypeId) || null);
      setTransactions(allTxs);
      setRepairs(allReps);
      setTransfers(trfs);
      setAuditLogs(logs.filter((l) => l.resourceId === p.code || l.resourceId === p.id));
    } finally {
      setLoading(false);
    }
  }

  const currentMonthNum = new Date().getMonth() + 1;
  const currentYearNum = new Date().getFullYear();

  // Machine-specific KPI cards
  const totalRefills = useMemo(() => {
    return transactions.filter((t) => t.transactionType === "refill").length;
  }, [transactions]);

  const refillsThisMonth = useMemo(() => {
    return transactions.filter((t) => {
      const d = new Date(t.transactionDate);
      return (
        d.getFullYear() === currentYearNum &&
        d.getMonth() + 1 === currentMonthNum &&
        t.transactionType === "refill"
      );
    }).length;
  }, [transactions, currentYearNum, currentMonthNum]);

  const refillsThisYear = useMemo(() => {
    return transactions.filter((t) => {
      const d = new Date(t.transactionDate);
      return d.getFullYear() === currentYearNum && t.transactionType === "refill";
    }).length;
  }, [transactions, currentYearNum]);

  const lastRefill = useMemo(() => {
    const refillList = transactions
      .filter((t) => t.transactionType === "refill")
      .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());
    return refillList.length > 0 ? refillList[0].transactionDate : null;
  }, [transactions]);

  const daysSinceLastRefill = useMemo(() => {
    if (!lastRefill) return null;
    const diff = Date.now() - new Date(lastRefill).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }, [lastRefill]);

  const totalRepairs = repairs.length;

  // Timeline items
  const timelineItems = useMemo(() => {
    const list: Array<{
      id: string;
      date: string;
      title: string;
      desc: string;
      tag: string;
      color: string;
    }> = [];

    // Transactions
    transactions.forEach((tx) => {
      list.push({
        id: tx.id,
        date: tx.transactionDate,
        title: tx.transactionType === "refill" ? `Nạp mực ${tx.tonerCodeSnapshot}` : tx.transactionType === "replace" ? `Thay hộp mực ${tx.tonerCodeSnapshot}` : "Thay Drum / Linh kiện",
        desc: `Thực hiện bởi: ${tx.performedBy} (${tx.supplier}). Ghi chú: ${tx.note || "Không có"}`,
        tag: tx.transactionType === "refill" ? "Mực in" : "Linh kiện",
        color: "bg-blue-500",
      });
    });

    // Repairs
    repairs.forEach((rep) => {
      list.push({
        id: rep.id,
        date: rep.reportedDate,
        title: `Báo hỏng: ${rep.problem}`,
        desc: `${rep.description || ""}. Trạng thái hiện tại: ${REPAIR_STATUS_MAP[rep.status]?.label || rep.status}`,
        tag: "Sửa chữa",
        color: rep.status === "completed" ? "bg-emerald-500" : "bg-rose-500",
      });
    });

    // Transfers
    transfers.forEach((trf) => {
      list.push({
        id: trf.id,
        date: trf.transferDate,
        title: `Điều chuyển: Từ ${trf.fromDepartmentNameSnapshot} sang ${trf.toDepartmentNameSnapshot}`,
        desc: `Vị trí mới: ${trf.newLocation}. Lý do: ${trf.reason || "N/A"}. Người bàn giao: ${trf.performedBy}`,
        tag: "Điều chuyển",
        color: "bg-indigo-500",
      });
    });

    // Start use date
    if (printer?.startUseDate) {
      list.push({
        id: "start-use",
        date: printer.startUseDate,
        title: "Đưa máy vào sử dụng",
        desc: `Bắt đầu vận hành tại ${department?.name || "đơn vị"}`,
        tag: "Khởi tạo",
        color: "bg-slate-400",
      });
    }

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, repairs, transfers, printer, department]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!printer) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <p className="text-slate-600 font-semibold">Không tìm thấy máy in này.</p>
        <Link href="/printers" className="mt-2 text-xs text-blue-600 hover:underline">
          Quay lại danh sách máy in
        </Link>
      </div>
    );
  }

  const statusInfo = PRINTER_STATUS_MAP[printer.status] || PRINTER_STATUS_MAP.active;

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/printers"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                {printer.code}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusInfo.bg} ${statusInfo.color}`}
              >
                {statusInfo.label.toUpperCase()}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              {printer.brand} {printer.model}
            </h1>
            <p className="text-xs text-slate-500">
              {printer.name} &bull; Vị trí: {printer.location} ({department?.name})
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* QR Code Button */}
          <button
            onClick={() => setQrModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-sm transition-colors"
          >
            <QrCode className="w-4 h-4 text-blue-600" />
            Mã QR Dán Máy
          </button>

          {canPerformOperations && (
            <>
              {/* Quick Refill */}
              <Link
                href={`/toner-transactions/new?printerId=${printer.id}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm shadow-blue-500/20 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                + Ghi nhận nạp mực
              </Link>

              {/* Quick Repair */}
              <Link
                href={`/repairs/new?printerId=${printer.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors"
              >
                <Wrench className="w-4 h-4" />
                Báo hỏng
              </Link>
            </>
          )}

          {canManagePrinters && (
            <>
              {/* Transfer */}
              <button
                onClick={() => setTransferModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors"
              >
                <ArrowRightLeft className="w-4 h-4" />
                Chuyển máy
              </button>

              {/* Edit */}
              <Link
                href={`/printers/${printer.id}/edit`}
                className="p-2 text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors"
                title="Chỉnh sửa"
              >
                <Edit className="w-4 h-4" />
              </Link>
            </>
          )}
        </div>
      </div>

      {/* 6 MACHINE-SPECIFIC KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Tổng lần nạp mực</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalRefills}</p>
          <span className="text-[10px] text-slate-400">lần nạp từ trước đến nay</span>
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
            {formatDate(lastRefill)}
          </p>
          <span className="text-[10px] text-slate-400">ngày ghi nhận</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Số ngày kể từ lần nạp</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {daysSinceLastRefill !== null ? `${daysSinceLastRefill} ngày` : "--"}
          </p>
          <span className="text-[10px] text-slate-400">thời gian hoạt động</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Tổng lần sửa chữa</span>
          <p className="text-2xl font-bold text-rose-600 mt-1">{totalRepairs}</p>
          <span className="text-[10px] text-slate-400">lần báo lỗi / bảo trì</span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab("overview")}
          className={`pb-3 px-3 transition-colors border-b-2 whitespace-nowrap ${
            activeTab === "overview"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Tổng quan & Timeline
        </button>
        <button
          onClick={() => setActiveTab("toner")}
          className={`pb-3 px-3 transition-colors border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === "toner"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Lịch sử mực ({transactions.length})
        </button>
        <button
          onClick={() => setActiveTab("repair")}
          className={`pb-3 px-3 transition-colors border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === "repair"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Lịch sử sửa chữa ({repairs.length})
        </button>
        <button
          onClick={() => setActiveTab("transfer")}
          className={`pb-3 px-3 transition-colors border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === "transfer"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Lịch sử điều chuyển ({transfers.length})
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={`pb-3 px-3 transition-colors border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === "logs"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Nhật ký thao tác ({auditLogs.length})
        </button>
      </div>

      {/* Tab 1: OVERVIEW & TIMELINE */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Printer Specs Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
              <PrinterIcon className="w-4 h-4 text-blue-600" />
              Thông số kỹ thuật máy
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Mã máy:</span>
                <span className="font-bold text-slate-900">{printer.code}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Hãng sản xuất:</span>
                <span className="font-semibold text-slate-900">{printer.brand}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Model:</span>
                <span className="font-semibold text-slate-900">{printer.model}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Số Serial:</span>
                <span className="font-mono text-slate-800">{printer.serialNumber || "N/A"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Phân loại:</span>
                <span className="text-slate-800">{PRINTER_TYPE_MAP[printer.printerType] || printer.printerType}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Chế độ in:</span>
                <span className="text-slate-800">
                  {printer.colorMode === "mono" ? "Trắng đen" : "In màu"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Khoa / Phòng:</span>
                <span className="font-semibold text-blue-600">{department?.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Vị trí:</span>
                <span className="text-slate-800">{printer.location}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Loại mực sử dụng:</span>
                <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  {toner?.code || "Chưa gán"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Ngày sử dụng:</span>
                <span className="text-slate-800">{formatDate(printer.startUseDate)}</span>
              </div>
              {printer.note && (
                <div className="pt-2">
                  <span className="text-slate-500 block mb-1">Ghi chú:</span>
                  <p className="text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    {printer.note}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Machine Timeline (SECTION 21) */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                DÒNG THỜI GIAN MÁY (TIMELINE)
              </h3>
              <span className="text-xs text-slate-400">Sắp xếp mới nhất &rarr; cũ nhất</span>
            </div>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {timelineItems.map((item, index) => (
                <div key={item.id + index} className="relative group">
                  {/* Dot */}
                  <span
                    className={`absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white ring-2 ring-slate-100 ${item.color}`}
                  />
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-xs font-bold text-slate-900">{item.title}</span>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {formatDate(item.date)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.desc}</p>
                  <span className="inline-block mt-1 text-[10px] font-medium px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                    {item.tag}
                  </span>
                </div>
              ))}

              {timelineItems.length === 0 && (
                <p className="text-xs text-slate-400 py-4">Chưa có sự kiện timeline nào.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: TONER TRANSACTIONS */}
      {activeTab === "toner" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">TOÀN BỘ LỊCH SỬ NẠP / THAY MỰC</h3>
            {canPerformOperations && (
              <Link
                href={`/toner-transactions/new?printerId=${printer.id}`}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                + Ghi nhận nạp mới
              </Link>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Ngày</th>
                  <th className="py-3 px-4">Khoa/Phòng Snapshot</th>
                  <th className="py-3 px-4">Loại thao tác</th>
                  <th className="py-3 px-4">Mã mực</th>
                  <th className="py-3 px-3 text-center">SL</th>
                  <th className="py-3 px-4">Người thực hiện</th>
                  <th className="py-3 px-4">Đơn vị cung cấp</th>
                  <th className="py-3 px-4">Ghi chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {transactions.map((t) => {
                  const typeInfo = TRANSACTION_TYPE_MAP[t.transactionType] || TRANSACTION_TYPE_MAP.refill;
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                        {formatDate(t.transactionDate)}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {t.departmentNameSnapshot}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${typeInfo.bg} ${typeInfo.color}`}
                        >
                          {typeInfo.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{t.tonerCodeSnapshot}</td>
                      <td className="py-3 px-3 text-center font-bold">{t.quantity}</td>
                      <td className="py-3 px-4">{t.performedBy}</td>
                      <td className="py-3 px-4 text-slate-500">{t.supplier}</td>
                      <td className="py-3 px-4 text-slate-500">{t.note || "--"}</td>
                    </tr>
                  );
                })}

                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Chưa có lịch sử nạp mực nào cho máy in này.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: REPAIRS */}
      {activeTab === "repair" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">LỊCH SỬ SỬA CHỮA & BẢO TRÌ</h3>
            {canPerformOperations && (
              <Link
                href={`/repairs/new?printerId=${printer.id}`}
                className="text-xs font-semibold text-amber-700 hover:underline"
              >
                + Báo hỏng máy
              </Link>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Ngày báo</th>
                  <th className="py-3 px-4">Nội dung lỗi</th>
                  <th className="py-3 px-4">Người báo</th>
                  <th className="py-3 px-4">Người phụ trách</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4">Linh kiện thay</th>
                  <th className="py-3 px-4 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {repairs.map((r) => {
                  const repSt = REPAIR_STATUS_MAP[r.status] || REPAIR_STATUS_MAP.pending;
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                        {formatDate(r.reportedDate)}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{r.problem}</td>
                      <td className="py-3 px-4">{r.reportedBy}</td>
                      <td className="py-3 px-4 text-slate-600">{r.assignedTo || "Chưa phân công"}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${repSt.bg} ${repSt.color}`}
                        >
                          {repSt.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">{r.replacedParts || "--"}</td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <Link
                          href={`/repairs/${r.id}`}
                          className="text-blue-600 hover:underline font-semibold"
                        >
                          Xem phiếu &rarr;
                        </Link>
                      </td>
                    </tr>
                  );
                })}

                {repairs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Máy chưa từng xảy ra sự cố kỹ thuật nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: TRANSFERS */}
      {activeTab === "transfer" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">LỊCH SỬ ĐIỀU CHUYỂN KHOA / PHÒNG</h3>
            {canManagePrinters && (
              <button
                onClick={() => setTransferModalOpen(true)}
                className="text-xs font-semibold text-indigo-600 hover:underline"
              >
                + Điều chuyển máy
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Ngày chuyển</th>
                  <th className="py-3 px-4">Từ đơn vị</th>
                  <th className="py-3 px-4">Sang đơn vị</th>
                  <th className="py-3 px-4">Vị trí mới</th>
                  <th className="py-3 px-4">Người thực hiện</th>
                  <th className="py-3 px-4">Lý do</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {transfers.map((trf) => (
                  <tr key={trf.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                      {formatDate(trf.transferDate)}
                    </td>
                    <td className="py-3 px-4 text-slate-700">{trf.fromDepartmentNameSnapshot}</td>
                    <td className="py-3 px-4 font-bold text-blue-600">{trf.toDepartmentNameSnapshot}</td>
                    <td className="py-3 px-4 text-slate-600">{trf.newLocation}</td>
                    <td className="py-3 px-4">{trf.performedBy}</td>
                    <td className="py-3 px-4 text-slate-500">{trf.reason || "--"}</td>
                  </tr>
                ))}

                {transfers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Máy in này vẫn ở đơn vị ban đầu, chưa từng được điều chuyển.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: AUDIT LOGS */}
      {activeTab === "logs" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">NHẬT KÝ THAO TÁC LIÊN QUAN ĐẾN MÁY</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-4 flex items-center justify-between text-xs hover:bg-slate-50">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">{log.action}</span>
                    <span className="text-slate-400">&bull;</span>
                    <span className="text-slate-600 font-medium">{log.userName || log.userEmail}</span>
                  </div>
                  <p className="text-slate-500 mt-0.5">{log.details}</p>
                </div>
                <span className="text-slate-400 whitespace-nowrap">{formatDateTime(log.timestamp)}</span>
              </div>
            ))}

            {auditLogs.length === 0 && (
              <p className="py-8 text-center text-xs text-slate-400">Chưa có nhật ký ghi nhận.</p>
            )}
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      <QrCodeModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        printerCode={printer.code}
        printerName={printer.name}
        printerModel={`${printer.brand} ${printer.model}`}
        departmentName={department?.name || ""}
      />

      {/* Transfer Modal */}
      <TransferPrinterModal
        isOpen={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        printer={printer}
        departments={departments}
        onSuccess={loadData}
      />
    </div>
  );
}
