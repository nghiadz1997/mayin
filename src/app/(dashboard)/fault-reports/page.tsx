"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Phone,
  Wrench,
  XCircle,
} from "lucide-react";
import { faultReportService } from "../../../services/faultReportService";
import { FaultReport } from "../../../types";
import { formatDateTime } from "../../../lib/utils";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../components/ui/Toast";

export default function FaultReportsPage() {
  const { canPerformOperations } = useAuth();
  const toast = useToast();

  const [reports, setReports] = useState<FaultReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [convertingId, setConvertingId] = useState<string | null>(null);

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    try {
      setLoading(true);
      const list = await faultReportService.getAll();
      setReports(list);
    } finally {
      setLoading(false);
    }
  }

  const handleConvertToRepair = async (report: FaultReport) => {
    setConvertingId(report.id);
    try {
      await faultReportService.convertToRepair(report.id, "Kỹ thuật viên Tuấn");
      toast.success(
        `Đã tạo phiếu sửa chữa cho máy ${report.printerCodeSnapshot} từ báo lỗi của ${report.reporterName}`
      );
      loadReports();
    } catch {
      toast.error("Không thể chuyển tiếp thành phiếu sửa chữa");
    } finally {
      setConvertingId(null);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await faultReportService.updateStatus(id, "rejected");
      toast.success("Đã từ chối / đóng báo lỗi");
      loadReports();
    } catch {
      toast.error("Không thể cập nhật trạng thái");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
            Danh Sách Báo Lỗi Qua Mã QR
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Các phản ánh sự cố từ cán bộ, giảng viên, sinh viên quét mã dán trên máy
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((r) => {
          const isPending = r.status === "pending";
          return (
            <div
              key={r.id}
              className={`bg-white p-5 rounded-2xl border shadow-sm flex flex-col justify-between space-y-4 ${
                isPending ? "border-amber-300 ring-2 ring-amber-100" : "border-slate-200"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-xs px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                      {r.printerCodeSnapshot}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        r.status === "pending"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : r.status === "converted_to_repair"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      {r.status === "pending"
                        ? "Chờ xử lý"
                        : r.status === "converted_to_repair"
                        ? "Đã tạo phiếu sửa"
                        : "Đã đóng"}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {formatDateTime(r.createdAt)}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 mt-2">{r.problem}</h3>
                {r.description && (
                  <p className="text-xs text-slate-600 mt-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    {r.description}
                  </p>
                )}

                <div className="mt-3 pt-3 border-t border-slate-100 space-y-1 text-xs text-slate-600">
                  <p>
                    Đơn vị: <strong>{r.departmentNameSnapshot}</strong> ({r.location})
                  </p>
                  <p className="flex items-center gap-2">
                    Người báo: <strong className="text-slate-900">{r.reporterName}</strong>
                    {r.reporterPhone && (
                      <span className="text-blue-600 font-medium flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {r.reporterPhone}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {isPending && canPerformOperations && (
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleReject(r.id)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    Bỏ qua
                  </button>
                  <button
                    onClick={() => handleConvertToRepair(r)}
                    disabled={convertingId === r.id}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    Tạo phiếu sửa chữa ngay
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {reports.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
            Chưa có phản ánh báo lỗi nào từ mã QR.
          </div>
        )}
      </div>
    </div>
  );
}
