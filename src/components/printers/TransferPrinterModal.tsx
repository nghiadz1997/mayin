"use client";

import React, { useState } from "react";
import { ArrowRightLeft, X, Building2, MapPin, Calendar, User, FileText } from "lucide-react";
import { Printer, Department } from "../../types";
import { printerService } from "../../services/printerService";
import { useToast } from "../ui/Toast";
import { useAuth } from "../../context/AuthContext";

interface TransferPrinterModalProps {
  isOpen: boolean;
  onClose: () => void;
  printer: Printer | null;
  departments: Department[];
  onSuccess: () => void;
}

export const TransferPrinterModal: React.FC<TransferPrinterModalProps> = ({
  isOpen,
  onClose,
  printer,
  departments,
  onSuccess,
}) => {
  const toast = useToast();
  const { user } = useAuth();

  const [toDepartmentId, setToDepartmentId] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split("T")[0]);
  const [performedBy, setPerformedBy] = useState(user?.displayName || "Cán bộ quản trị");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen || !printer) return null;

  const currentDept = departments.find((d) => d.id === printer.departmentId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toDepartmentId) {
      toast.error("Vui lòng chọn đơn vị tiếp nhận mới");
      return;
    }
    if (toDepartmentId === printer.departmentId) {
      toast.error("Đơn vị mới phải khác đơn vị hiện tại");
      return;
    }
    if (!newLocation.trim()) {
      toast.error("Vui lòng nhập vị trí cụ thể tại đơn vị mới");
      return;
    }

    const targetDept = departments.find((d) => d.id === toDepartmentId);
    if (!targetDept) return;

    setLoading(true);
    try {
      await printerService.transfer(
        {
          printerId: printer.id,
          printerCodeSnapshot: printer.code,
          fromDepartmentId: printer.departmentId,
          fromDepartmentNameSnapshot: currentDept?.name || "N/A",
          toDepartmentId: targetDept.id,
          toDepartmentNameSnapshot: targetDept.name,
          newLocation: newLocation.trim(),
          transferDate: new Date(transferDate).toISOString(),
          performedBy: performedBy.trim(),
          reason: reason.trim(),
          note: note.trim(),
        },
        user?.email
      );

      toast.success(`Đã điều chuyển máy ${printer.code} sang ${targetDept.name} thành công!`);
      onSuccess();
      onClose();
    } catch {
      toast.error("Không thể hoàn tất thao tác điều chuyển máy");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-base">
            <ArrowRightLeft className="w-5 h-5 text-blue-600" />
            Điều chuyển Khoa / Phòng Máy in
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Machine Header */}
          <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200/60 text-xs text-slate-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-blue-700 text-sm">{printer.code}</span>
              <span className="text-slate-500 font-medium">
                {printer.brand} {printer.model}
              </span>
            </div>
            <p className="text-slate-600">
              Đơn vị hiện tại: <strong className="text-slate-900">{currentDept?.name || "Chưa gán"}</strong>
            </p>
            <p className="text-slate-500">Vị trí hiện tại: {printer.location}</p>
          </div>

          {/* New Department */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Đơn vị tiếp nhận mới *
            </label>
            <select
              value={toDepartmentId}
              onChange={(e) => setToDepartmentId(e.target.value)}
              required
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            >
              <option value="">-- Chọn Khoa hoặc Phòng mới --</option>
              {departments
                .filter((d) => d.id !== printer.departmentId)
                .map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.code} - {d.name} ({d.type === "faculty" ? "Khoa" : "Phòng"})
                  </option>
                ))}
            </select>
          </div>

          {/* New Location */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Vị trí đặt máy mới *
            </label>
            <input
              type="text"
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              placeholder="VD: Phòng B302 - Bàn tiếp sinh viên"
              required
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          {/* Transfer Date & Performed By */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Ngày điều chuyển *
              </label>
              <input
                type="date"
                value={transferDate}
                onChange={(e) => setTransferDate(e.target.value)}
                required
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Người thực hiện *
              </label>
              <input
                type="text"
                value={performedBy}
                onChange={(e) => setPerformedBy(e.target.value)}
                required
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Lý do điều chuyển
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="VD: Điều động phục vụ cao điểm tuyển sinh"
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Ghi chú bàn giao
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Kèm dây nguồn và cáp USB, hộp mực đang còn 70%"
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm shadow-blue-500/20 disabled:opacity-50"
            >
              {loading && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              Xác nhận chuyển máy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
