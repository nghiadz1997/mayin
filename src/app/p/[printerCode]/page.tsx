"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Printer as PrinterIcon,
  AlertTriangle,
  CheckCircle2,
  Phone,
  User,
  Send,
  Building2,
  MapPin,
  Check,
} from "lucide-react";
import { printerService } from "../../../services/printerService";
import { departmentService } from "../../../services/departmentService";
import { faultReportService } from "../../../services/faultReportService";
import { Printer, Department } from "../../../types";
import { PRINTER_STATUS_MAP, generateId } from "../../../lib/utils";

export default function PublicPrinterQrPage() {
  const params = useParams();
  const rawCode = params.printerCode as string;
  const printerCode = decodeURIComponent(rawCode || "");

  const [printer, setPrinter] = useState<Printer | null>(null);
  const [department, setDepartment] = useState<Department | null>(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [showReportForm, setShowReportForm] = useState(false);
  const [reporterName, setReporterName] = useState("");
  const [reporterPhone, setReporterPhone] = useState("");
  const [problem, setProblem] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const p = await printerService.getByCode(printerCode);
        if (p) {
          setPrinter(p);
          const d = await departmentService.getById(p.departmentId);
          setDepartment(d);
        }
      } finally {
        setLoading(false);
      }
    }
    if (printerCode) load();
  }, [printerCode]);

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!printer) return;
    if (!reporterName.trim()) {
      alert("Vui lòng nhập tên người báo lỗi");
      return;
    }
    if (!problem.trim()) {
      alert("Vui lòng nhập nội dung sự cố gặp phải");
      return;
    }

    setSubmitting(true);
    try {
      await faultReportService.create({
        id: "fr-" + generateId(),
        printerId: printer.id,
        printerCodeSnapshot: printer.code,
        departmentId: printer.departmentId,
        departmentNameSnapshot: department?.name || "N/A",
        location: printer.location,
        reporterName: reporterName.trim(),
        reporterPhone: reporterPhone.trim(),
        problem: problem.trim(),
        description: description.trim(),
        status: "pending",
        createdAt: new Date().toISOString(),
      });

      setSubmitted(true);
      setShowReportForm(false);
    } catch {
      alert("Không thể gửi báo lỗi, vui lòng thử lại!");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100 p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Đang tải thông tin thiết bị...</p>
        </div>
      </div>
    );
  }

  if (!printer) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full text-center border border-slate-200">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h2 className="text-base font-bold text-slate-800">Không tìm thấy máy in</h2>
          <p className="text-xs text-slate-500 mt-1">
            Mã máy &quot;{printerCode}&quot; không tồn tại hoặc đã được gỡ khỏi hệ thống nhà trường.
          </p>
        </div>
      </div>
    );
  }

  const st = PRINTER_STATUS_MAP[printer.status] || PRINTER_STATUS_MAP.active;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4 py-8">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-700 p-6 text-white text-center relative">
          <img
            src="/logo.png"
            alt="Logo Trường Cao Đẳng Bách Khoa Nam Sài Gòn"
            className="w-16 h-16 object-contain rounded-full bg-white p-1 shadow-md mx-auto mb-2"
          />
          <span className="text-[11px] font-bold text-blue-200 uppercase tracking-wider block">
            TRƯỜNG CAO ĐẲNG BÁCH KHOA NAM SÀI GÒN
          </span>
          <h1 className="text-lg font-black mt-0.5 tracking-tight uppercase">THÔNG TIN MÁY IN</h1>
          <div className="mt-2 inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-mono font-bold tracking-wider">
            {printer.code}
          </div>
        </div>

        {/* Public Printer Specs */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-xs font-semibold text-slate-500">Tình trạng máy:</span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border ${st.bg} ${st.color}`}
            >
              {st.label.toUpperCase()}
            </span>
          </div>

          <div className="space-y-2.5 text-xs text-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Model máy:</span>
              <strong className="text-slate-900 text-sm">
                {printer.brand} {printer.model}
              </strong>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Tên định danh:</span>
              <span className="font-semibold text-slate-800">{printer.name}</span>
            </div>

            <div className="flex items-start justify-between">
              <span className="text-slate-400">Đơn vị quản lý:</span>
              <span className="font-bold text-blue-700 text-right max-w-[200px]">
                {department?.name}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Vị trí đặt máy:</span>
              <span className="font-medium text-slate-800">{printer.location}</span>
            </div>
          </div>

          {/* Success Message After Report */}
          {submitted && (
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-1 animate-in zoom-in-95">
              <Check className="w-8 h-8 text-emerald-600 mx-auto" />
              <p className="text-xs font-bold text-emerald-800">Đã ghi nhận báo lỗi thành công!</p>
              <p className="text-[11px] text-emerald-700 leading-relaxed">
                Bộ phận Quản lý thiết bị đã tiếp nhận thông tin và sẽ phân công kỹ thuật viên kiểm tra máy trong thời gian sớm nhất.
              </p>
            </div>
          )}

          {/* Report Button */}
          {!showReportForm && !submitted && (
            <div className="pt-3">
              <button
                onClick={() => setShowReportForm(true)}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-500/20 transition-colors"
              >
                <AlertTriangle className="w-4 h-4" />
                BÁO MÁY IN BỊ LỖI / HỎNG
              </button>
            </div>
          )}

          {/* Simplified Public Report Form */}
          {showReportForm && (
            <form onSubmit={handleSubmitReport} className="pt-2 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Gửi thông tin báo lỗi máy in
                </h3>
                <button
                  type="button"
                  onClick={() => setShowReportForm(false)}
                  className="text-[11px] text-slate-400 hover:text-slate-600"
                >
                  Đóng
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Họ tên người báo lỗi *
                </label>
                <input
                  type="text"
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  placeholder="VD: Thầy Hùng, Sinh viên Nam..."
                  required
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Số điện thoại liên hệ
                </label>
                <input
                  type="tel"
                  value={reporterPhone}
                  onChange={(e) => setReporterPhone(e.target.value)}
                  placeholder="VD: 0912 345 678"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Lỗi sự cố gặp phải *
                </label>
                <input
                  type="text"
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                  placeholder="VD: Kẹt giấy, Báo hết mực, In ra trang trắng..."
                  required
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Mô tả thêm (nếu có)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả cụ thể đèn báo hay hiện tượng..."
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowReportForm(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm disabled:opacity-50"
                >
                  {submitting ? (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  Gửi báo lỗi ngay
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-[10px] text-slate-500 font-medium">
          Phòng Quản trị Thiết bị & Cơ sở vật chất &bull; Trường CĐ Bách Khoa Nam Sài Gòn
        </div>
      </div>
    </div>
  );
}
