"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Droplet, Search, Plus, Printer, CheckCircle2, X, Edit, Trash2, EyeOff, Eye, Package } from "lucide-react";
import { tonerService } from "../../../services/tonerService";
import { printerService } from "../../../services/printerService";
import { transactionService } from "../../../services/transactionService";
import { TonerType, Printer as IPrinter, TonerTransaction } from "../../../types";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../components/ui/Toast";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";

export default function TonersPage() {
  const { user, canManagePrinters } = useAuth();
  const toast = useToast();

  const [toners, setToners] = useState<TonerType[]>([]);
  const [printers, setPrinters] = useState<IPrinter[]>([]);
  const [transactions, setTransactions] = useState<TonerTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("all");
  const [toggleTarget, setToggleTarget] = useState<TonerType | null>(null);

  // Edit modal
  const [editTarget, setEditTarget] = useState<TonerType | null>(null);
  const [editCode, setEditCode] = useState("");
  const [editName, setEditName] = useState("");
  const [editBrand, setEditBrand] = useState("");
  const [editColor, setEditColor] = useState("Black");
  const [editTonerType, setEditTonerType] = useState("Hộp mực Laser đen trắng");
  const [editModelsInput, setEditModelsInput] = useState("");
  const [editNote, setEditNote] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<TonerType | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [tList, pList, txList] = await Promise.all([
        tonerService.getAll(),
        printerService.getAll(),
        transactionService.getAll(),
      ]);
      setToners(tList);
      setPrinters(pList);
      setTransactions(txList);
    } finally {
      setLoading(false);
    }
  }

  const openEditModal = (t: TonerType) => {
    setEditTarget(t);
    setEditCode(t.code);
    setEditName(t.name);
    setEditBrand(t.brand);
    setEditColor(t.color || "Black");
    setEditTonerType(t.tonerType || "Hộp mực Laser đen trắng");
    setEditModelsInput(t.compatibleModels ? t.compatibleModels.join(", ") : "");
    setEditNote(t.note || "");
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    if (!editCode.trim()) {
      toast.error("Vui lòng nhập mã loại mực");
      return;
    }
    if (!editName.trim()) {
      toast.error("Vui lòng nhập tên loại mực");
      return;
    }

    setSavingEdit(true);
    try {
      const compatibleModels = editModelsInput
        .split(/[,;\n]+/)
        .map((m) => m.trim())
        .filter(Boolean);

      await tonerService.update(
        editTarget.id,
        {
          code: editCode.trim().toUpperCase(),
          name: editName.trim(),
          brand: editBrand.trim(),
          color: editColor.trim(),
          tonerType: editTonerType.trim(),
          compatibleModels,
          note: editNote.trim(),
        },
        user?.email
      );

      toast.success("Đã cập nhật mã mực " + editCode.trim().toUpperCase() + " thành công!");
      setEditTarget(null);
      loadData();
    } catch {
      toast.error("Không thể cập nhật thông tin loại mực");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await tonerService.delete(deleteTarget.id, user?.email);
      toast.success("Đã xóa loại mực " + deleteTarget.code + " thành công!");
      setDeleteTarget(null);
      loadData();
    } catch {
      toast.error("Không thể xóa loại mực này");
    }
  };

  const handleToggleStatus = async () => {
    if (!toggleTarget) return;
    try {
      await tonerService.toggleStatus(toggleTarget.id, toggleTarget.status, user?.email);
      toast.success(
        `Đã đổi trạng thái loại mực ${toggleTarget.code} sang ${
          toggleTarget.status === "active" ? "ngưng dùng" : "hoạt động"
        }`
      );
      setToggleTarget(null);
      loadData();
    } catch {
      toast.error("Không thể thay đổi trạng thái");
    }
  };

  // Compute how many printers are using this toner & total consumption
  const tonerStats = useMemo(() => {
    const map: Record<string, { printersCount: number; refillsCount: number }> = {};
    toners.forEach((t) => {
      const pCount = printers.filter((p) => p.tonerTypeId === t.id).length;
      const refCount = transactions.filter((tx) => tx.tonerTypeId === t.id).length;
      map[t.id] = { printersCount: pCount, refillsCount: refCount };
    });
    return map;
  }, [toners, printers, transactions]);

  const brands = useMemo(() => {
    return Array.from(new Set(toners.map((t) => t.brand).filter(Boolean)));
  }, [toners]);

  const filteredToners = useMemo(() => {
    return toners.filter((t) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        t.code.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q) ||
        t.compatibleModels.some((m) => m.toLowerCase().includes(q));

      const matchesBrand = brandFilter === "all" || t.brand === brandFilter;

      return matchesSearch && matchesBrand;
    });
  }, [toners, search, brandFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Droplet className="w-6 h-6 text-purple-600" />
            Danh Mục Mực Máy In
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý danh sách các loại hộp mực, mã mực và model máy tương thích trong trường
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/toner-inventory"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl shadow-sm transition-all"
          >
            <Package className="w-4 h-4 text-blue-600" />
            Xem Kho Mực In
          </Link>
          {canManagePrinters && (
            <Link
              href="/toners/new"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm shadow-blue-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              + Thêm loại mực mới
            </Link>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo mã mực (TN-2385, 12A, 107A...) hoặc Model tương thích (2321D, 2900...)"
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <select
          value={brandFilter}
          onChange={(e) => setBrandFilter(e.target.value)}
          className="w-full sm:w-48 text-xs bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="all">Tất cả hãng sản xuất</option>
          {brands.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </div>

      {/* Grid of Toner Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredToners.map((t) => {
          const stats = tonerStats[t.id] || { printersCount: 0, refillsCount: 0 };
          return (
            <div
              key={t.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="px-2.5 py-1 rounded-lg text-sm font-black bg-purple-50 text-purple-700 border border-purple-200 tracking-wide">
                      {t.code}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-2">{t.name}</h3>
                    <p className="text-xs text-slate-500">{t.brand} &bull; Màu: {t.color}</p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                      t.status === "active"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-slate-100 text-slate-600 border-slate-200"
                    }`}
                  >
                    {t.status === "active" ? "Đang dùng" : "Ngưng"}
                  </span>
                </div>

                {/* Compatible Models */}
                <div className="mt-4 space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Model máy tương thích:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {t.compatibleModels.map((m, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md text-[11px] bg-slate-100 text-slate-700 font-medium"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>

                {t.note && (
                  <p className="text-xs text-slate-500 mt-3 pt-2 border-t border-slate-100 italic">
                    {t.note}
                  </p>
                )}
              </div>

              {/* Card Footer: Stats & Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3 text-slate-600">
                  <span title="Số máy đang dùng loại mực này">
                    <strong>{stats.printersCount}</strong> máy đang dùng
                  </span>
                  <span>&bull;</span>
                  <span title="Tổng lượt nạp trong lịch sử">
                    <strong>{stats.refillsCount}</strong> lượt nạp
                  </span>
                </div>

                {canManagePrinters && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(t)}
                      className="text-slate-500 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                      title="Chỉnh sửa mã mực & thông tin"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setToggleTarget(t)}
                      className="text-slate-400 hover:text-amber-600 p-1.5 rounded-lg hover:bg-amber-50 transition-colors"
                      title={t.status === "active" ? "Đánh dấu ngưng dùng" : "Kích hoạt lại"}
                    >
                      {t.status === "active" ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-emerald-600" />}
                    </button>
                    <button
                      onClick={() => setDeleteTarget(t)}
                      className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Xóa loại mực khi nhập sai"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filteredToners.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 text-sm bg-white rounded-2xl border border-slate-200">
            Không tìm thấy loại mực nào phù hợp.
          </div>
        )}
      </div>

      {/* Modal Chỉnh Sửa Loại Mực & Mã Mực */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 border border-slate-100 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Chỉnh Sửa Loại Mực / Mã Mực
                </h3>
                <p className="text-xs text-slate-500">
                  Sửa mã mực, tên hoặc thông số khi nhập sai
                </p>
              </div>
              <button
                onClick={() => setEditTarget(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Mã hộp mực *
                  </label>
                  <input
                    type="text"
                    value={editCode}
                    onChange={(e) => setEditCode(e.target.value)}
                    placeholder="VD: 12A, TN-2385..."
                    required
                    className="w-full text-xs font-bold uppercase bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Sửa trực tiếp nếu nhập sai mã mực</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Hãng sản xuất *
                  </label>
                  <input
                    type="text"
                    value={editBrand}
                    onChange={(e) => setEditBrand(e.target.value)}
                    placeholder="VD: HP, Canon, Brother..."
                    required
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Tên loại mực *
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="VD: Hộp mực Canon Cartridge 303..."
                  required
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Màu mực
                  </label>
                  <select
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Black">Đen (Black)</option>
                    <option value="Cyan">Xanh (Cyan)</option>
                    <option value="Magenta">Đỏ (Magenta)</option>
                    <option value="Yellow">Vàng (Yellow)</option>
                    <option value="Multi">Đa màu / Bộ màu</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Công nghệ / Dạng mực
                  </label>
                  <input
                    type="text"
                    value={editTonerType}
                    onChange={(e) => setEditTonerType(e.target.value)}
                    placeholder="VD: Hộp mực Laser đen trắng"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Dòng máy in tương thích
                </label>
                <input
                  type="text"
                  value={editModelsInput}
                  onChange={(e) => setEditModelsInput(e.target.value)}
                  placeholder="VD: Canon LBP 2900, HP LaserJet 1020 (ngăn cách bằng dấu phẩy)"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Ghi chú
                </label>
                <textarea
                  rows={2}
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  placeholder="Ghi chú về mã phôi, dung lượng trang in ước tính..."
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditTarget(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm disabled:opacity-50"
                >
                  {savingEdit ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Toggle Status */}
      <ConfirmDialog
        isOpen={Boolean(toggleTarget)}
        title="Đổi trạng thái loại mực?"
        message={
          <div>
            <p className="font-semibold text-slate-900">
              {toggleTarget?.code} - {toggleTarget?.name}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {toggleTarget?.status === "active"
                ? "Chuyển sang trạng thái ngưng sử dụng cho các máy in mới."
                : "Kích hoạt lại loại mực này vào danh sách chọn."}
            </p>
          </div>
        }
        confirmText="Xác nhận"
        variant="warning"
        onConfirm={handleToggleStatus}
        onCancel={() => setToggleTarget(null)}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Xóa Loại Mực Máy In?"
        message={
          <div>
            <p className="font-semibold text-slate-900">
              {deleteTarget?.code} - {deleteTarget?.name} ({deleteTarget?.brand})
            </p>
            {deleteTarget && (tonerStats[deleteTarget.id]?.printersCount || 0) > 0 ? (
              <p className="text-xs text-amber-600 font-medium mt-2 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                ⚠️ Cảnh báo: Loại mực này đang được gán cho{" "}
                <strong>{tonerStats[deleteTarget.id]?.printersCount}</strong> máy in trong trường.
                Nếu xóa, các máy in này sẽ trở về trạng thái chưa gán loại mực.
              </p>
            ) : (
              <p className="text-xs text-slate-500 mt-1">
                Bạn có chắc chắn muốn xóa vĩnh viễn loại mực này khỏi danh mục hệ thống? Thao tác này phù hợp khi nhập sai thông tin.
              </p>
            )}
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
