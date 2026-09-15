"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Wrench,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Printer,
  Building2,
  User,
  Calendar,
  Save,
  Check,
} from "lucide-react";
import { repairService } from "../../../../services/repairService";
import { printerService } from "../../../../services/printerService";
import { Repair, RepairStatus, Printer as IPrinter } from "../../../../types";
import { formatDate, formatDateTime, REPAIR_STATUS_MAP } from "../../../../lib/utils";
import { useAuth } from "../../../../context/AuthContext";
import { useToast } from "../../../../components/ui/Toast";

export default function RepairDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { canPerformOperations } = useAuth();
  const toast = useToast();

  const [repair, setRepair] = useState<Repair | null>(null);
  const [printer, setPrinter] = useState<IPrinter | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Edit fields
  const [status, setStatus] = useState<RepairStatus>("pending");
  const [assignedTo, setAssignedTo] = useState("");
  const [repairContent, setRepairContent] = useState("");
  const [replacedParts, setReplacedParts] = useState("");
  const [note, setNote] = useState("");
  const [restorePrinterActive, setRestorePrinterActive] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const r = await repairService.getById(id);
        if (!r) {
          toast.error("Không tìm thấy phiếu sửa chữa");
          router.push("/repairs");
          return;
        }
        setRepair(r);
        setStatus(r.status);
        setAssignedTo(r.assignedTo || "");
        setRepairContent(r.repairContent || "");
        setReplacedParts(r.replacedParts || "");
        setNote(r.note || "");

        if (r.printerId) {
          const p = await printerService.getById(r.printerId);
          setPrinter(p);
        }
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id, router, toast]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repair) return;

    setSaving(true);
    try {
      await repairService.update(
        repair.id,
        {
          printerId: repair.printerId,
          status,
          assignedTo: assignedTo.trim(),
          repairContent: repairContent.trim(),
          replacedParts: replacedParts.trim(),
          note: note.trim(),
          completedAt: status === "completed" ? new Date().toISOString() : repair.completedAt,
        },
        undefined,
        status === "completed" && restorePrinterActive
      );

      toast.success("Đã cập nhật tiến độ phiếu sửa chữa thành công!");
      router.push("/repairs");
    } catch {
      toast.error("Không thể lưu cập nhật sửa chữa");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!repair) return null;

  const currentSt = REPAIR_STATUS_MAP[repair.status] || REPAIR_STATUS_MAP.pending;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/repairs"
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
              {repair.printerCodeSnapshot}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${currentSt.bg} ${currentSt.color}`}
            >
              {currentSt.label}
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">{repair.problem}</h1>
        </div>
      </div>

      {/* Overview Info Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          THÔNG TIN TIẾP NHẬN SỰ CỐ
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
          <div>
            <span className="text-slate-400 block">Thiết bị:</span>
            <Link
              href={`/printers/${repair.printerId}`}
              className="font-bold text-blue-600 hover:underline"
            >
              {repair.printerCodeSnapshot} ({printer?.brand} {printer?.model})
            </Link>
          </div>
          <div>
            <span className="text-slate-400 block">Khoa / Phòng:</span>
            <strong className="text-slate-900">{repair.departmentNameSnapshot}</strong>
          </div>
          <div>
            <span className="text-slate-400 block">Ngày báo hỏng:</span>
            <strong>{formatDate(repair.reportedDate)}</strong>
          </div>
          <div>
            <span className="text-slate-400 block">Người báo hỏng:</span>
            <strong>{repair.reportedBy}</strong>
          </div>
          {repair.description && (
            <div className="sm:col-span-2 pt-2 border-t border-slate-100">
              <span className="text-slate-400 block mb-1">Mô tả hiện tượng ban đầu:</span>
              <p className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-800">
                {repair.description}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Update Progress Form */}
      <form onSubmit={handleUpdate} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          CẬP NHẬT TIẾN ĐỘ SỬA CHỮA
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Trạng thái xử lý *
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as RepairStatus)}
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            >
              <option value="pending">Chờ xử lý</option>
              <option value="checking">Đang kiểm tra kỹ thuật</option>
              <option value="repairing">Đang tiến hành sửa chữa</option>
              <option value="waiting_parts">Chờ linh kiện thay thế</option>
              <option value="completed">Đã hoàn thành</option>
              <option value="unrepairable">Không thể sửa chữa</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Kỹ thuật viên phụ trách
            </label>
            <input
              type="text"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              placeholder="VD: Kỹ thuật viên Tuấn"
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          {status === "completed" && (
            <div className="sm:col-span-2 p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-2">
              <input
                type="checkbox"
                id="restore"
                checked={restorePrinterActive}
                onChange={(e) => setRestorePrinterActive(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded"
              />
              <label htmlFor="restore" className="text-xs font-semibold text-emerald-900 cursor-pointer">
                Đưa máy in trở lại trạng thái &quot;Đang hoạt động&quot; (Sẵn sàng sử dụng)
              </label>
            </div>
          )}

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Linh kiện thay thế
            </label>
            <input
              type="text"
              value={replacedParts}
              onChange={(e) => setReplacedParts(e.target.value)}
              placeholder="VD: Quả đào kéo giấy, Bao lụa sấy, Bánh răng..."
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Nội dung sửa chữa / Kết quả kiểm tra
            </label>
            <textarea
              rows={3}
              value={repairContent}
              onChange={(e) => setRepairContent(e.target.value)}
              placeholder="Ghi nhận quy trình tháo lắp, khắc phục lỗi..."
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Ghi chú thêm
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ghi chú thêm..."
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-3">
          <Link
            href="/repairs"
            className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
          >
            Quay lại
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm shadow-blue-500/20 disabled:opacity-50"
          >
            {saving ? (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Lưu cập nhật
          </button>
        </div>
      </form>
    </div>
  );
}
