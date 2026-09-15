"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  RefreshCw,
  ArrowLeft,
  Save,
  Search,
  CheckCircle2,
  Calendar,
  User,
  Building,
  Upload,
  Droplet,
} from "lucide-react";
import { printerService } from "../../../../services/printerService";
import { departmentService } from "../../../../services/departmentService";
import { tonerService } from "../../../../services/tonerService";
import { transactionService } from "../../../../services/transactionService";
import { Printer, Department, TonerType, TonerTransactionType } from "../../../../types";
import { generateId } from "../../../../lib/utils";
import { useToast } from "../../../../components/ui/Toast";
import { useAuth } from "../../../../context/AuthContext";

export default function NewTonerTransactionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPrinterId = searchParams.get("printerId") || "";

  const toast = useToast();
  const { user } = useAuth();

  const [printers, setPrinters] = useState<Printer[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [toners, setToners] = useState<TonerType[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Machine selector search query
  const [printerQuery, setPrinterQuery] = useState("");
  const [selectedPrinter, setSelectedPrinter] = useState<Printer | null>(null);

  // Form Fields
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split("T")[0]);
  const [transactionType, setTransactionType] = useState<TonerTransactionType>("refill");
  const [tonerTypeId, setTonerTypeId] = useState("");
  const [quantity, setQuantity] = useState<number>(1);
  const [performedBy, setPerformedBy] = useState(user?.displayName || "Kỹ thuật viên");
  const [supplier, setSupplier] = useState("Công ty Mực in Sao Mai");
  const [note, setNote] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [pList, dList, tList] = await Promise.all([
          printerService.getAll(),
          departmentService.getAll(),
          tonerService.getAll(),
        ]);
        setPrinters(pList);
        setDepartments(dList);
        setToners(tList);

        if (preselectedPrinterId) {
          const match = pList.find((p) => p.id === preselectedPrinterId);
          if (match) {
            handleSelectPrinter(match);
          }
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [preselectedPrinterId]);

  const handleSelectPrinter = (p: Printer) => {
    setSelectedPrinter(p);
    setPrinterQuery(p.code);
    if (p.tonerTypeId) {
      setTonerTypeId(p.tonerTypeId);
    }
  };

  const selectedDept = selectedPrinter
    ? departments.find((d) => d.id === selectedPrinter.departmentId)
    : null;

  const matchedToner = toners.find((t) => t.id === tonerTypeId);

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
      toast.error("Vui lòng chọn máy in cần nạp hoặc thay mực");
      return;
    }
    if (!tonerTypeId) {
      toast.error("Vui lòng chọn loại mực sử dụng");
      return;
    }
    if (quantity < 1) {
      toast.error("Số lượng phải lớn hơn hoặc bằng 1");
      return;
    }

    setSubmitting(true);
    try {
      // Create Toner Transaction with STRICT SNAPSHOT
      await transactionService.create(
        {
          id: "tx-" + generateId(),
          printerId: selectedPrinter.id,
          printerCodeSnapshot: selectedPrinter.code,
          printerModelSnapshot: `${selectedPrinter.brand} ${selectedPrinter.model}`,
          departmentId: selectedPrinter.departmentId,
          departmentNameSnapshot: selectedDept?.name || "N/A",
          tonerTypeId: matchedToner?.id || tonerTypeId,
          tonerCodeSnapshot: matchedToner?.code || "Mực tiêu chuẩn",
          transactionType,
          transactionDate: new Date(transactionDate).toISOString(),
          quantity: Number(quantity),
          supplier: supplier.trim() || "Nội bộ",
          performedBy: performedBy.trim(),
          note: note.trim(),
          attachmentUrl: attachmentUrl.trim(),
          createdBy: user?.displayName || user?.email || "Admin",
          createdAt: new Date().toISOString(),
        },
        user?.email
      );

      toast.success(
        `Đã ghi nhận ${transactionType === "refill" ? "nạp mực" : "thay hộp mực"} cho máy ${selectedPrinter.code} thành công!`
      );
      router.push("/toner-transactions");
    } catch {
      toast.error("Không thể ghi nhận giao dịch mực. Vui lòng thử lại!");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/toner-transactions"
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-blue-600" />
            Ghi Nhận Nạp / Thay Mực Máy In
          </h1>
          <p className="text-xs text-slate-500">
            Cập nhật lịch sử thay cartridge, nạp mực hoặc thay cụm Drum cho thiết bị
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Step 1: Select Printer */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            1. CHỌN MÁY IN CẦN NẠP / THAY MỰC
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
              placeholder="Nhập mã máy (VD: PRN-CNTT-001) hoặc Model (HL-L2321D, 2900)..."
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          {/* Quick Match dropdown */}
          {!selectedPrinter && printerQuery && filteredPrinterOptions.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-lg divide-y divide-slate-100 max-h-48 overflow-y-auto">
              {filteredPrinterOptions.map((p) => {
                const d = departments.find((dept) => dept.id === p.departmentId);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPrinter(p)}
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

          {/* AUTO-POPULATED PRINTER INFO CARD */}
          {selectedPrinter && (
            <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-xs space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-blue-900 text-sm">{selectedPrinter.code}</span>
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-slate-700 pt-1">
                <div>
                  <span className="text-slate-500 block">Khoa / Phòng:</span>
                  <strong className="text-slate-900">{selectedDept?.name || "Chưa gán"}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Vị trí đặt máy:</span>
                  <strong>{selectedPrinter.location}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Mực chuẩn theo máy:</span>
                  <strong className="text-purple-700">
                    {toners.find((t) => t.id === selectedPrinter.tonerTypeId)?.code || "Chưa gán"}
                  </strong>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Transaction Details */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            2. THÔNG TIN NẠP MỰC & THAO TÁC
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Transaction Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Ngày thực hiện *
              </label>
              <input
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                required
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            {/* Operation Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Loại thao tác *
              </label>
              <select
                value={transactionType}
                onChange={(e) => setTransactionType(e.target.value as TonerTransactionType)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-medium"
              >
                <option value="refill">Nạp mực (Đổ mực vào hộp)</option>
                <option value="replace">Thay hộp mực mới (Cartridge)</option>
                <option value="drum">Thay cụm Trống (Drum)</option>
                <option value="other">Thay linh kiện liên quan khác</option>
              </select>
            </div>

            {/* Toner Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Loại mực sử dụng *
              </label>
              <select
                value={tonerTypeId}
                onChange={(e) => setTonerTypeId(e.target.value)}
                required
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              >
                <option value="">-- Chọn loại mực --</option>
                {toners.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.code} - {t.name} ({t.brand})
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Số lượng *
              </label>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                required
                className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            {/* Performed By */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Kỹ thuật viên thực hiện *
              </label>
              <input
                type="text"
                value={performedBy}
                onChange={(e) => setPerformedBy(e.target.value)}
                placeholder="VD: Nguyễn Văn Tuấn"
                required
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            {/* Supplier */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Đơn vị thực hiện / Cung cấp *
              </label>
              <input
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="VD: Công ty Mực in Sao Mai, Phòng QTTB"
                required
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            {/* Attachment link */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Link hình ảnh / Phiếu bàn giao (tùy chọn)
              </label>
              <input
                type="url"
                value={attachmentUrl}
                onChange={(e) => setAttachmentUrl(e.target.value)}
                placeholder="https://..."
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            {/* Note */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Ghi chú kỹ thuật
              </label>
              <textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="VD: Đã vệ sinh gạt mực thải, in test 1 trang độ nét đạt 100%"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/toner-transactions"
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
            Lưu phiếu nạp mực
          </button>
        </div>
      </form>
    </div>
  );
}
