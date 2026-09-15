"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  FileText,
  Download,
  Printer as PrinterIcon,
  Filter,
  CheckCircle2,
  Table as TableIcon,
} from "lucide-react";
import { departmentService } from "../../../services/departmentService";
import { printerService } from "../../../services/printerService";
import { transactionService } from "../../../services/transactionService";
import { repairService } from "../../../services/repairService";
import { tonerService } from "../../../services/tonerService";
import { Department, Printer, TonerTransaction, Repair, TonerType } from "../../../types";
import { formatDate, PRINTER_STATUS_MAP, REPAIR_STATUS_MAP, TRANSACTION_TYPE_MAP } from "../../../lib/utils";
import * as XLSX from "xlsx";
import { useToast } from "../../../components/ui/Toast";

type ReportType =
  | "all_printers"
  | "printers_by_dept"
  | "broken_printers"
  | "repairing_printers"
  | "refill_history"
  | "replace_history"
  | "repair_history"
  | "toner_by_dept"
  | "by_month"
  | "by_quarter"
  | "by_year";

export default function ReportsPage() {
  const toast = useToast();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [transactions, setTransactions] = useState<TonerTransaction[]>([]);
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [toners, setToners] = useState<TonerType[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [reportType, setReportType] = useState<ReportType>("all_printers");
  const [selectedDeptId, setSelectedDeptId] = useState("all");
  const [selectedYear, setSelectedYear] = useState("2026");
  const [selectedMonth, setSelectedMonth] = useState("all");

  useEffect(() => {
    Promise.all([
      departmentService.getAll(),
      printerService.getAll(),
      transactionService.getAll(),
      repairService.getAll(),
      tonerService.getAll(),
    ]).then(([d, p, tx, r, ton]) => {
      setDepartments(d);
      setPrinters(p);
      setTransactions(tx);
      setRepairs(r);
      setToners(ton);
      setLoading(false);
    });
  }, []);

  const reportTitles: Record<ReportType, string> = {
    all_printers: "Báo cáo máy in toàn trường",
    printers_by_dept: "Báo cáo máy in theo Khoa/Phòng",
    broken_printers: "Danh sách máy in đang hỏng",
    repairing_printers: "Danh sách máy in đang sửa chữa",
    refill_history: "Báo cáo lịch sử nạp mực",
    replace_history: "Báo cáo lịch sử thay hộp mực",
    repair_history: "Báo cáo lịch sử sửa chữa & bảo trì",
    toner_by_dept: "Thống kê mực theo Khoa/Phòng",
    by_month: "Thống kê nạp mực theo tháng",
    by_quarter: "Thống kê nạp mực theo quý",
    by_year: "Thống kê nạp mực theo năm",
  };

  // Build Report Data Table
  const reportData = useMemo(() => {
    switch (reportType) {
      case "all_printers":
      case "printers_by_dept":
      case "broken_printers":
      case "repairing_printers": {
        return printers
          .filter((p) => {
            if (reportType === "broken_printers" && p.status !== "broken") return false;
            if (reportType === "repairing_printers" && p.status !== "repairing") return false;
            if (selectedDeptId !== "all" && p.departmentId !== selectedDeptId) return false;
            return true;
          })
          .map((p) => {
            const dept = departments.find((d) => d.id === p.departmentId);
            const toner = toners.find((t) => t.id === p.tonerTypeId);
            return {
              "Mã máy": p.code,
              "Tên máy": p.name,
              "Hãng": p.brand,
              "Model": p.model,
              "Số Serial": p.serialNumber || "",
              "Khoa / Phòng": dept?.name || "Chưa gán",
              "Vị trí": p.location,
              "Loại mực": toner?.code || "",
              "Trạng thái": PRINTER_STATUS_MAP[p.status]?.label || p.status,
              "Ngày đưa vào sử dụng": formatDate(p.startUseDate),
            };
          });
      }

      case "refill_history":
      case "replace_history": {
        return transactions
          .filter((tx) => {
            if (reportType === "refill_history" && tx.transactionType !== "refill") return false;
            if (reportType === "replace_history" && tx.transactionType !== "replace") return false;
            if (selectedDeptId !== "all" && tx.departmentId !== selectedDeptId) return false;

            const d = new Date(tx.transactionDate);
            if (selectedYear !== "all" && d.getFullYear().toString() !== selectedYear) return false;
            if (selectedMonth !== "all" && (d.getMonth() + 1).toString() !== selectedMonth)
              return false;

            return true;
          })
          .map((tx) => ({
            "Ngày thực hiện": formatDate(tx.transactionDate),
            "Mã máy": tx.printerCodeSnapshot,
            "Model": tx.printerModelSnapshot,
            "Khoa / Phòng Snapshot": tx.departmentNameSnapshot,
            "Thao tác": TRANSACTION_TYPE_MAP[tx.transactionType]?.label || tx.transactionType,
            "Mã mực": tx.tonerCodeSnapshot,
            "Số lượng": tx.quantity,
            "Người thực hiện": tx.performedBy,
            "Đơn vị cung cấp": tx.supplier,
            "Ghi chú": tx.note || "",
          }));
      }

      case "repair_history": {
        return repairs
          .filter((r) => {
            if (selectedDeptId !== "all" && r.departmentId !== selectedDeptId) return false;
            const d = new Date(r.reportedDate);
            if (selectedYear !== "all" && d.getFullYear().toString() !== selectedYear) return false;
            return true;
          })
          .map((r) => ({
            "Ngày báo": formatDate(r.reportedDate),
            "Mã máy": r.printerCodeSnapshot,
            "Khoa / Phòng": r.departmentNameSnapshot,
            "Nội dung lỗi": r.problem,
            "Người báo": r.reportedBy,
            "Kỹ thuật viên": r.assignedTo || "Chưa gán",
            "Trạng thái": REPAIR_STATUS_MAP[r.status]?.label || r.status,
            "Linh kiện thay thế": r.replacedParts || "",
            "Ngày hoàn thành": formatDate(r.completedAt),
            "Ghi chú": r.note || "",
          }));
      }

      case "toner_by_dept":
      case "by_month":
      case "by_quarter":
      case "by_year": {
        return departments.map((dept) => {
          const deptTxs = transactions.filter((t) => t.departmentId === dept.id);
          const totalRefill = deptTxs.filter((t) => t.transactionType === "refill").length;
          const totalReplace = deptTxs.filter((t) => t.transactionType === "replace").length;
          const totalDrum = deptTxs.filter((t) => t.transactionType === "drum").length;
          const deptPrinters = printers.filter((p) => p.departmentId === dept.id).length;

          return {
            "Mã đơn vị": dept.code,
            "Khoa / Phòng": dept.name,
            "Số máy in": deptPrinters,
            "Lượt nạp mực": totalRefill,
            "Lượt thay hộp mực": totalReplace,
            "Lượt thay Drum": totalDrum,
            "Tổng lượt thao tác": totalRefill + totalReplace + totalDrum,
          };
        });
      }

      default:
        return [];
    }
  }, [
    reportType,
    printers,
    transactions,
    repairs,
    departments,
    toners,
    selectedDeptId,
    selectedYear,
    selectedMonth,
  ]);

  // Export to Excel (.xlsx)
  const handleExportExcel = () => {
    if (reportData.length === 0) {
      toast.error("Không có dữ liệu để xuất");
      return;
    }
    const ws = XLSX.utils.json_to_sheet(reportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "BaoCao");
    const filename = `${reportType}_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(wb, filename);
    toast.success("Đã xuất file Excel thành công!");
  };

  // Export to CSV (.csv)
  const handleExportCSV = () => {
    if (reportData.length === 0) {
      toast.error("Không có dữ liệu để xuất");
      return;
    }
    const ws = XLSX.utils.json_to_sheet(reportData);
    const csvContent = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${reportType}_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Đã xuất file CSV thành công!");
  };

  // Print / PDF
  const handlePrint = () => {
    window.print();
  };

  const columns = reportData.length > 0 ? Object.keys(reportData[0]) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-blue-600" />
            Trung Tâm Báo Cáo & Xuất Dữ Liệu
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tổng hợp 11 mẫu báo cáo chuẩn theo quy định (Tuyệt đối không chứa thông tin chi phí)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl shadow-sm transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            Xuất Excel (.xlsx)
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl shadow-sm transition-colors"
          >
            <Download className="w-4 h-4 text-blue-600" />
            Xuất CSV
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-sm transition-colors"
          >
            <PrinterIcon className="w-4 h-4 text-slate-600" />
            In ấn / Lưu PDF
          </button>
        </div>
      </div>

      {/* Select Report Type & Filter Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 no-print">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Chọn Mẫu Báo Cáo (11 Loại Chuẩn)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {Object.entries(reportTitles).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setReportType(key as ReportType)}
                className={`p-2.5 rounded-xl text-left text-xs font-semibold border transition-all ${
                  reportType === key
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">
              Lọc theo Khoa / Phòng
            </label>
            <select
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">Toàn trường (Tất cả)</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.code} - {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Năm</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">Tất cả các năm</option>
              <option value="2026">Năm 2026</option>
              <option value="2025">Năm 2025</option>
              <option value="2024">Năm 2024</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Tháng</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">Tất cả các tháng</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={String(i + 1)}>
                  Tháng {i + 1}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Report Preview Header (Shown in print mode) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="text-center pb-4 border-b border-slate-100">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            TRƯỜNG ĐẠI HỌC CÔNG NGHỆ & ĐÀO TẠO &bull; PHÒNG QUẢN TRỊ THIẾT BỊ
          </p>
          <h2 className="text-lg font-black text-slate-900 mt-1 uppercase">
            {reportTitles[reportType]}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Ngày lập báo cáo: {new Date().toLocaleDateString("vi-VN")} &bull; Tổng số bản ghi:{" "}
            <strong>{reportData.length}</strong>
          </p>
        </div>

        {/* Live Table Preview */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-bold">
                <th className="py-2.5 px-3 w-12 text-center">STT</th>
                {columns.map((col) => (
                  <th key={col} className="py-2.5 px-3 whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {reportData.map((row: any, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70">
                  <td className="py-2.5 px-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                  {columns.map((col) => (
                    <td key={col} className="py-2.5 px-3 whitespace-nowrap">
                      {row[col]}
                    </td>
                  ))}
                </tr>
              ))}

              {reportData.length === 0 && (
                <tr>
                  <td
                    colSpan={columns.length + 1}
                    className="py-12 text-center text-slate-400 text-xs"
                  >
                    Không có dữ liệu phù hợp với điều kiện báo cáo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Signatures for Printable View */}
        <div className="hidden print:grid grid-cols-2 text-center pt-8 text-xs font-semibold text-slate-800">
          <div>
            <p>NGƯỜI LẬP BÁO CÁO</p>
            <p className="text-[10px] text-slate-400 font-normal italic mt-1">(Ký và ghi rõ họ tên)</p>
          </div>
          <div>
            <p>TRƯỞNG PHÒNG QTTB & CSVC</p>
            <p className="text-[10px] text-slate-400 font-normal italic mt-1">(Ký, ghi rõ họ tên và đóng dấu)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
