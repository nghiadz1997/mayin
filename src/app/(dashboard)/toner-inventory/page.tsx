"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Package,
  Search,
  Plus,
  Droplet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  PlusCircle,
  MinusCircle,
  Edit,
  Trash2,
  MapPin,
  Calendar,
  Layers,
  Printer,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { tonerInventoryService } from "../../../services/tonerInventoryService";
import { TonerInventoryItem } from "../../../types";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../components/ui/Toast";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { formatDate } from "../../../lib/utils";

export default function TonerInventoryPage() {
  const { user, canManagePrinters } = useAuth();
  const toast = useToast();

  const [inventory, setInventory] = useState<TonerInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modals
  const [deleteTarget, setDeleteTarget] = useState<TonerInventoryItem | null>(null);
  const [editItem, setEditItem] = useState<TonerInventoryItem | null>(null);
  const [editCode, setEditCode] = useState<string>("");
  const [editName, setEditName] = useState<string>("");
  const [editBrand, setEditBrand] = useState<string>("");
  const [editQuantity, setEditQuantity] = useState<number>(0);
  const [editLocation, setEditLocation] = useState<string>("");
  const [editSupplier, setEditSupplier] = useState<string>("");
  const [editModelsInput, setEditModelsInput] = useState<string>("");
  const [editNote, setEditNote] = useState<string>("");
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const list = await tonerInventoryService.getAll();
      setInventory(list);
    } catch {
      toast.error("Không thể tải danh sách kho mực");
    } finally {
      setLoading(false);
    }
  }

  // Quick adjust quantity (+1 or -1)
  const handleQuickAdjust = async (item: TonerInventoryItem, delta: number) => {
    try {
      const newQty = await tonerInventoryService.adjustQuantity(item.id, delta, user?.email);
      toast.success("Đã cập nhật " + item.code + ": hiện còn " + newQty + " hộp");
      setInventory((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? {
                ...i,
                quantity: newQty,
                status: newQty === 0 ? "out_of_stock" : newQty <= 3 ? "low_stock" : "in_stock",
              }
            : i
        )
      );
    } catch {
      toast.error("Không thể cập nhật số lượng");
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await tonerInventoryService.delete(deleteTarget.id, user?.email);
      toast.success("Đã xóa bản ghi kho " + deleteTarget.code);
      setDeleteTarget(null);
      loadData();
    } catch {
      toast.error("Không thể xóa bản ghi kho mực");
    }
  };

  // Open edit modal
  const openEditModal = (item: TonerInventoryItem) => {
    setEditItem(item);
    setEditCode(item.code);
    setEditName(item.name);
    setEditBrand(item.brand || "");
    setEditQuantity(item.quantity);
    setEditLocation(item.storageLocation);
    setEditSupplier(item.supplier || "");
    setEditModelsInput(item.compatibleModels ? item.compatibleModels.join(", ") : "");
    setEditNote(item.note || "");
  };

  // Save edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    if (!editCode.trim()) {
      toast.error("Vui lòng nhập mã hộp mực");
      return;
    }
    if (!editName.trim()) {
      toast.error("Vui lòng nhập tên loại mực");
      return;
    }

    setSavingEdit(true);
    try {
      const q = Math.max(0, editQuantity);
      const st = q === 0 ? "out_of_stock" : q <= 3 ? "low_stock" : "in_stock";
      const compatibleModels = editModelsInput
        .split(/[,;\n]+/)
        .map((m) => m.trim())
        .filter(Boolean);

      await tonerInventoryService.update(
        editItem.id,
        {
          code: editCode.trim().toUpperCase(),
          name: editName.trim(),
          brand: editBrand.trim(),
          quantity: q,
          storageLocation: editLocation.trim(),
          supplier: editSupplier.trim(),
          compatibleModels,
          note: editNote.trim(),
          status: st,
          updatedAt: new Date().toISOString(),
        },
        user?.email
      );
      toast.success("Đã cập nhật kho mực " + editCode.trim().toUpperCase());
      setEditItem(null);
      loadData();
    } catch {
      toast.error("Không thể cập nhật kho mực");
    } finally {
      setSavingEdit(false);
    }
  };

  // Stats calculation
  const totalStockCount = useMemo(() => {
    return inventory.reduce((sum, item) => sum + (item.quantity || 0), 0);
  }, [inventory]);

  const distinctTonerTypes = useMemo(() => {
    return new Set(inventory.map((i) => i.code)).size;
  }, [inventory]);

  const lowStockCount = useMemo(() => {
    return inventory.filter((i) => i.quantity > 0 && i.quantity <= 3).length;
  }, [inventory]);

  const outOfStockCount = useMemo(() => {
    return inventory.filter((i) => i.quantity === 0).length;
  }, [inventory]);

  const brands = useMemo(() => {
    return Array.from(new Set(inventory.map((i) => i.brand).filter(Boolean)));
  }, [inventory]);

  // Filtered
  const filteredItems = useMemo(() => {
    return inventory.filter((i) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        i.code.toLowerCase().includes(q) ||
        i.name.toLowerCase().includes(q) ||
        i.storageLocation.toLowerCase().includes(q) ||
        i.compatibleModels?.some((m) => m.toLowerCase().includes(q));

      const matchesBrand = brandFilter === "all" || i.brand === brandFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "in_stock" && i.quantity > 3) ||
        (statusFilter === "low_stock" && i.quantity > 0 && i.quantity <= 3) ||
        (statusFilter === "out_of_stock" && i.quantity === 0);

      return matchesSearch && matchesBrand && matchesStatus;
    });
  }, [inventory, search, brandFilter, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Package className="w-6 h-6 text-blue-600" />
            Quản Lý Kho Mực In
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi tồn kho, vị trí lưu trữ và nhập mực mới về trường (không quản lý chi phí)
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/toners"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-sm transition-all"
          >
            <Droplet className="w-4 h-4 text-purple-600" />
            Danh mục loại mực
          </Link>
          {canManagePrinters && (
            <Link
              href="/toner-inventory/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm shadow-blue-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              + Nhập mực mới vào kho
            </Link>
          )}
        </div>
      </div>

      {/* 4 Thẻ KPI Kho Mực */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: Tổng số hộp mực tồn kho */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Tổng hộp mực tồn kho</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-blue-600 mt-2">{totalStockCount}</p>
          <span className="text-[11px] text-slate-400">hộp mực sẵn sàng cấp phát</span>
        </div>

        {/* KPI 2: Số loại mực khác nhau */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Số loại mực trong kho</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-purple-600 mt-2">{distinctTonerTypes}</p>
          <span className="text-[11px] text-slate-400">mã cartridge khác nhau</span>
        </div>

        {/* KPI 3: Loại sắp hết */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Loại sắp hết (≤ 3 hộp)</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600 mt-2">{lowStockCount}</p>
          <span className="text-[11px] text-amber-600 font-medium">Cần dự trù nhập bổ sung</span>
        </div>

        {/* KPI 4: Hết hàng */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Loại hết hàng (0 hộp)</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-600 mt-2">{outOfStockCount}</p>
          <span className="text-[11px] text-rose-500 font-medium">Cần nhập kho ngay</span>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo Mã mực, Tên hộp mực, Vị trí kho, Model máy tương thích..."
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">Tất cả hãng sản xuất</option>
            {brands.map((b) => (
              <option key={b} value={b}>
                Hãng: {b}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">Tất cả trạng thái tồn</option>
            <option value="in_stock">Đủ hàng (&gt; 3 hộp)</option>
            <option value="low_stock">Sắp hết (1 - 3 hộp)</option>
            <option value="out_of_stock">Hết hàng (0 hộp)</option>
          </select>

          {(search || brandFilter !== "all" || statusFilter !== "all") && (
            <button
              onClick={() => {
                setSearch("");
                setBrandFilter("all");
                setStatusFilter("all");
              }}
              className="text-xs text-blue-600 hover:underline font-semibold text-left sm:col-span-2 flex items-center pt-2"
            >
              Đặt lại bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Dạng Thẻ Thông Minh Trên Điện Thoại (Mobile App Cards) */}
      <div className="space-y-3 sm:hidden">
        {filteredItems.map((item) => {
          const isLow = item.quantity > 0 && item.quantity <= 3;
          const isOut = item.quantity === 0;

          return (
            <div
              key={item.id}
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-bold text-sm text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                    {item.code}
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm mt-1.5">{item.name}</h3>
                  <p className="text-[11px] text-slate-500">{item.brand} &bull; {item.tonerType}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span
                    className={`text-xl font-black block leading-tight ${
                      isOut ? "text-rose-600" : isLow ? "text-amber-600" : "text-emerald-600"
                    }`}
                  >
                    {item.quantity} <span className="text-xs font-semibold text-slate-500">hộp</span>
                  </span>
                  <span
                    className={`inline-block mt-0.5 px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                      isOut
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : isLow
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    }`}
                  >
                    {isOut ? "Hết hàng" : isLow ? "Sắp hết" : "Còn hàng"}
                  </span>
                </div>
              </div>

              <div className="space-y-1 text-xs text-slate-600 border-t border-slate-100 pt-2">
                <div className="flex items-center gap-1.5 text-slate-700">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>Vị trí kho: <strong className="text-slate-900">{item.storageLocation}</strong></span>
                </div>
                {item.compatibleModels && item.compatibleModels.length > 0 && (
                  <div className="text-[11px] text-slate-500 truncate">
                    Máy tương thích: {item.compatibleModels.join(", ")}
                  </div>
                )}
                {item.importDate && (
                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>Nhập ngày: {formatDate(item.importDate)}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons on Mobile */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleQuickAdjust(item, 1)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100 active:scale-95 transition-all"
                    title="Nhập thêm 1 hộp"
                  >
                    <PlusCircle className="w-4 h-4" /> +1
                  </button>
                  <button
                    onClick={() => handleQuickAdjust(item, -1)}
                    disabled={item.quantity <= 0}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 active:scale-95 disabled:opacity-40 transition-all"
                    title="Xuất dùng 1 hộp"
                  >
                    <MinusCircle className="w-4 h-4" /> -1
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(item)}
                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="Chỉnh sửa"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(item)}
                    className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                    title="Xóa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredItems.length === 0 && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
            Không tìm thấy hộp mực nào trong kho.
          </div>
        )}
      </div>

      {/* Dạng Bảng Đầy Đủ Trên Desktop / Tablet */}
      <div className="hidden sm:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-4">Mã mực</th>
                <th className="py-3.5 px-4">Tên hộp mực & Hãng</th>
                <th className="py-3.5 px-3">Loại / Màu</th>
                <th className="py-3.5 px-4">Model tương thích</th>
                <th className="py-3.5 px-4">Vị trí lưu kho</th>
                <th className="py-3.5 px-3 whitespace-nowrap">Ngày nhập</th>
                <th className="py-3.5 px-4 text-center">Tồn kho</th>
                <th className="py-3.5 px-3 text-center">Trạng thái</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredItems.map((item) => {
                const isLow = item.quantity > 0 && item.quantity <= 3;
                const isOut = item.quantity === 0;

                return (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Mã mực */}
                    <td className="py-3.5 px-4 font-bold text-blue-700 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200">
                        {item.code}
                      </span>
                    </td>

                    {/* Tên & Hãng */}
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-900 block">{item.name}</span>
                      <span className="text-[11px] text-slate-400">{item.brand}</span>
                    </td>

                    {/* Loại / Màu */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span className="font-medium text-slate-700 block">{item.tonerType}</span>
                      <span className="text-[10px] text-slate-400">{item.color}</span>
                    </td>

                    {/* Model tương thích */}
                    <td className="py-3.5 px-4 max-w-[200px] truncate text-slate-600" title={item.compatibleModels?.join(", ")}>
                      {item.compatibleModels?.join(", ") || "—"}
                    </td>

                    {/* Vị trí lưu kho */}
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span>{item.storageLocation}</span>
                      </div>
                    </td>

                    {/* Ngày nhập */}
                    <td className="py-3.5 px-3 whitespace-nowrap text-slate-500">
                      {formatDate(item.importDate)}
                    </td>

                    {/* Tồn kho & Nút tăng giảm nhanh */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleQuickAdjust(item, -1)}
                          disabled={item.quantity <= 0}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded disabled:opacity-30 transition-colors"
                          title="Xuất dùng 1 hộp (-1)"
                        >
                          <MinusCircle className="w-4 h-4" />
                        </button>
                        <span
                          className={`text-sm font-black w-8 text-center ${
                            isOut ? "text-rose-600" : isLow ? "text-amber-600" : "text-emerald-600"
                          }`}
                        >
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleQuickAdjust(item, 1)}
                          className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                          title="Nhập thêm 1 hộp (+1)"
                        >
                          <PlusCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </td>

                    {/* Trạng thái */}
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${
                          isOut
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : isLow
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}
                      >
                        {isOut ? "Hết hàng" : isLow ? "Sắp hết" : "Còn hàng"}
                      </span>
                    </td>

                    {/* Thao tác */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Chỉnh sửa thông tin"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(item)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400">
                    Chưa có hộp mực nào trong kho phù hợp với bộ lọc tìm kiếm.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Chỉnh Sửa Tồn Kho & Thông Tin Mực */}
      {editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 border border-slate-100 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Chỉnh Sửa Kho Mực / Sửa Mã Mực
                </h3>
                <p className="text-xs text-slate-500">Sửa mã mực, số lượng hoặc thông tin khi nhập sai</p>
              </div>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                {editCode || editItem.code}
              </span>
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
                  placeholder="VD: Hộp mực HP 12A Laser Cartridge..."
                  required
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Số lượng tồn kho (Hộp) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={9999}
                    value={editQuantity}
                    onChange={(e) => setEditQuantity(parseInt(e.target.value) || 0)}
                    required
                    className="w-full text-sm font-bold bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Vị trí lưu kho *
                  </label>
                  <input
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    placeholder="VD: Kho Hành chính - Tủ 01 Kệ A"
                    required
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Đơn vị cung cấp / Nguồn nhập
                </label>
                <input
                  type="text"
                  value={editSupplier}
                  onChange={(e) => setEditSupplier(e.target.value)}
                  placeholder="VD: Công ty TNHH Thiết bị Văn phòng..."
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Dòng máy in tương thích
                </label>
                <input
                  type="text"
                  value={editModelsInput}
                  onChange={(e) => setEditModelsInput(e.target.value)}
                  placeholder="VD: Canon 2900, HP 1020 (ngăn cách bằng dấu phẩy)"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Ghi chú
                </label>
                <input
                  type="text"
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  placeholder="Ghi chú về lô mực, xuất xứ..."
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditItem(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
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

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Xóa Bản Ghi Kho Mực?"
        message={
          "Bạn có chắc muốn xóa loại mực " +
          (deleteTarget?.code || "") +
          " (" +
          (deleteTarget?.name || "") +
          ") khỏi danh sách quản lý kho?"
        }
        confirmText="Xác nhận xóa"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
