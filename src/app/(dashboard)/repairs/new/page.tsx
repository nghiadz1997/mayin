"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Wrench, ArrowLeft, Save, Search, CheckCircle2 } from "lucide-react";
import { printerService } from "../../../../services/printerService";
import { departmentService } from "../../../../services/departmentService";
import { repairService } from "../../../../services/repairService";
import { Printer, Department, RepairStatus } from "../../../../types";
import { generateId } from "../../../../lib/utils";
import { useToast } from "../../../../components/ui/Toast";
import { useAuth } from "../../../../context/AuthContext";

export default function NewRepairPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPrinterId = searchParams.get("printerId") || "";

  const toast = useToast();
  const { user } = useAuth();

  const [printers, setPrinters] = useState<Printer[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Machine selector search query
  const [printerQuery, setPrinterQuery] = useState("");
  const [selectedPrinter, setSelectedPrinter] = useState<Printer | null>(null);

  // Form fields
  const [reportedDate, setReportedDate] = useState(new Date().toISOString().split("T")[0]);
  const [problem, setProblem] = useState("");
  const [description, setDescription] = useState("");
  const [reportedBy, setReportedBy] = useState(user?.displayName || "Cán bộ đơn vị");
  const [assignedTo, setAssignedTo] = useState("Kỹ thuật viên Tuấn");
  const [status, setStatus] = useState<RepairStatus>("pending");
  const [startedAt, setStartedAt] = useState("");
  const [repairContent, setRepairContent] = useState("");
  const [replacedParts, setReplacedParts] = useState("");
  const [completedAt, setCompletedAt] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [pList, dList] = await Promise.all([
          printerService.getAll(),
          departmentService.getAll(),
        ]);
        setPrinters(pList);
        setDepartments(dList);

        if (preselectedPrinterId) {
          const matched = pList.find((p) => p.id === preselectedPrinterId);
          if (matched) {
            setSelectedPrinter(matched);
            setPrinterQuery(matched.code);
          }
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [preselectedPrinterId]);

  const selectedDept = selectedPrinter
    ? departments.find((d) => d.id === selectedPrinter.departmentId)
    : null;

  const filteredPrinterOptions = printerQuery
    ? printers.filter(
        (p) =>
          p.code.toLowerCase().includes(printerQuery.toLowerCase()) ||
          p.model.toLowerCase().includes(printerQuery.toLowerCase()) ||
          p.name.toLowerCase().includes(printerQuery.toLowerCase())
      )
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPrinter) {
      toast.error("Vui lòng chọn máy in cần báo hỏng hoặc sửa chữa");
      return;
    }
    if (!problem.trim()) {
      toast.error("Vui lòng nhập nội dung lỗi sự cố");
      return;
    }

    setSubmitting(true);
    try {
      await repairService.create(
        {
          id: "rep-" + generateId(),
          printerId: selectedPrinter.id,
          printerCodeSnapshot: selectedPrinter.code,
          departmentId: selectedPrinter.departmentId,
          departmentNameSnapshot: selectedDept?.name || "N/A",
          reportedDate: new Date(reportedDate).toISOString(),
          problem: problem.trim(),
          description: description.trim(),
          reportedBy: reportedBy.trim(),
          assignedTo: assignedTo.trim(),
          repairContent: repairContent.trim(),
          replacedParts: replacedParts.trim(),
          status,
          startedAt: startedAt ? new Date(startedAt).toISOString() : null,
          completedAt: completedAt ? new Date(completedAt).toISOString() : null,
          imageUrls: [],
          note: note.trim(),
          createdBy: user?.email || "Admin",
          createdAt: new Date().toISOString(),
        },
        user?.email
      );

      toast.success(`Đã ghi nhận phiếu sửa chữa cho máy ${selectedPrinter.code} thành công!`);
      router.push("/repairs");
    } catch {
      toast.error("Không thể tạo phiếu sửa chữa");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/repairs"
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-amber-600" />
            Báo Hỏng / Tạo Phiếu Sửa Chữa Máy In
          </h1>
          <p className="text-xs text-slate-500">
            Tiếp nhận báo lỗi, mô tả sự cố kỹ thuật và phân công cán bộ xử lý
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Machine Selector */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            1. CHỌN MÁY IN BỊ SỰ CỐ
          </h2>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={printerQuery}
              onChange={(e) => {
                setPrinterQuery(e.target.value);
                if (selectedPrinter && e.target.value !== selectedPrinter.code) {
                  setSelectedPrinter(null);
                }
              }}
              placeholder="Nhập mã máy (PRN-...), Model (2321D, 2900) hoặc tên máy..."
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          {!selectedPrinter && printerQuery && filteredPrinterOptions.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-lg divide-y divide-slate-100 max-h-48 overflow-y-auto">
              {filteredPrinterOptions.map((p) => {
                const d = departments.find((dept) => dept.id === p.departmentId);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedPrinter(p);
                      setPrinterQuery(p.code);
                    }}
                    className="w-full text-left p-3 hover:bg-blue-50 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-blue-600">{p.code}</span>
                        <span className="text-xs font-semibold text-slate-800">
                          {p.brand} {p.model}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {d?.name} &bull; {p.location}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-blue-600">Chọn máy &rarr;</span>
                  </button>
                );
              })}
            </div>
          )}

          {selectedPrinter && (
            <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 text-xs space-y-1.5 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-600" />
                  <span className="font-bold text-slate-900 text-sm">{selectedPrinter.code}</span>
                  <span className="font-semibold text-slate-700">
                    ({selectedPrinter.brand} {selectedPrinter.model})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPrinter(null);
                    setPrinterQuery("");
                  }}
                  className="text-[11px] text-slate-500 hover:text-slate-800 underline"
                >
                  Chọn máy khác
                </button>
              </div>
              <p className="text-slate-700">
                Khoa / Phòng: <strong>{selectedDept?.name}</strong> &bull; Vị trí:{" "}
                <strong>{selectedPrinter.location}</strong>
              </p>
            </div>
          )}
        </div>

        {/* Fault details */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            2. NỘI DUNG SỰ CỐ & PHÂN CÔNG
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Ngày báo hỏng *
              </label>
              <input
                type="date"
                value={reportedDate}
                onChange={(e) => setReportedDate(e.target.value)}
                required
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Trạng thái xử lý *
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as RepairStatus)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-medium"
              >
                <option value="pending">Chờ xử lý (Mới báo)</option>
                <option value="checking">Đang kiểm tra kỹ thuật</option>
                <option value="repairing">Đang tiến hành sửa chữa</option>
                <option value="waiting_parts">Chờ linh kiện thay thế</option>
                <option value="completed">Đã hoàn thành sửa chữa</option>
                <option value="unrepairable">Không thể sửa chữa</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Nội dung lỗi sự cố tóm tắt *
              </label>
              <input
                type="text"
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                placeholder="VD: Kẹt giấy liên tục khi in, Kêu to khi khởi động, Bản in có vệt đen..."
                required
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Mô tả chi tiết hiện tượng
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả cụ thể tiếng kêu, thông báo lỗi trên màn hình hoặc tình trạng bản in..."
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Người báo hỏng *
              </label>
              <input
                type="text"
                value={reportedBy}
                onChange={(e) => setReportedBy(e.target.value)}
                required
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
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

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Linh kiện thay thế (nếu có)
              </label>
              <input
                type="text"
                value={replacedParts}
                onChange={(e) => setReplacedParts(e.target.value)}
                placeholder="VD: Quả đào cuốn giấy, Bánh răng truyền lực, Đệm cao su tách giấy..."
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Nội dung xử lý / Ghi chú sửa chữa
              </label>
              <textarea
                rows={2}
                value={repairContent}
                onChange={(e) => setRepairContent(e.target.value)}
                placeholder="Ghi nhận phương án xử lý, biện pháp khắc phục..."
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Link
            href="/repairs"
            className="px-5 py-2.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
          >
            Hủy bỏ
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50"
          >
            {submitting ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Lưu phiếu sửa chữa
          </button>
        </div>
      </form>
    </div>
  );
}
