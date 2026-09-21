"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Package, Droplet, Sparkles, MapPin, Calendar, User, Truck } from "lucide-react";
import { tonerService } from "../../../../services/tonerService";
import { tonerInventoryService } from "../../../../services/tonerInventoryService";
import { TonerType } from "../../../../types";
import { useToast } from "../../../../components/ui/Toast";
import { generateId } from "../../../../lib/utils";
import { useAuth } from "../../../../context/AuthContext";

export default function NewTonerInventoryPage() {
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();

  const [existingToners, setExistingToners] = useState<TonerType[]>([]);
  const [selectedTonerId, setSelectedTonerId] = useState<string>("");

  // Các trường giống hệt Form Thêm Loại Mực Mới
  const [code, setCode] = useState("");
  const [brand, setBrand] = useState("Brother");
  const [name, setName] = useState("");
  const [color, setColor] = useState("Black");
  const [tonerType, setTonerType] = useState("Hộp mực Laser đen trắng");
  const [modelsInput, setModelsInput] = useState("");
  const [note, setNote] = useState("");

  // Các trường nghiệp vụ Kho Mực (TUYỆT ĐỐI KHÔNG CÓ GIÁ TIỀN)
  const [quantity, setQuantity] = useState<number>(5);
  const [storageLocation, setStorageLocation] = useState("Kho Hành chính - Tủ 01 Kệ A");
  const [importDate, setImportDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [supplier, setSupplier] = useState("Công ty Thiết bị Văn phòng Nam Sài Gòn");
  const [importedBy, setImportedBy] = useState("");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadCatalog() {
      try {
        const list = await tonerService.getAll();
        setExistingToners(list);
      } catch (err) {
        console.warn("Could not load toners catalog", err);
      }
    }
    loadCatalog();
  }, []);

  useEffect(() => {
    if (user?.displayName || user?.email) {
      setImportedBy(user.displayName || user.email || "Quản trị viên");
    }
  }, [user]);

  // Khi chọn một mã mực có sẵn trong danh mục, tự động điền các thông tin
  const handleSelectExistingToner = (tonerId: string) => {
    setSelectedTonerId(tonerId);
    if (!tonerId) return;

    const found = existingToners.find((t) => t.id === tonerId);
    if (found) {
      setCode(found.code);
      setBrand(found.brand);
      setName(found.name);
      setColor(found.color || "Black");
      setTonerType(found.tonerType || "Hộp mực Laser đen trắng");
      setModelsInput(found.compatibleModels?.join(", ") || "");
      setNote(found.note || "");
      toast.info("Đã tải thông số loại mực " + found.code);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      toast.error("Vui lòng nhập mã hộp mực");
      return;
    }
    if (!name.trim()) {
      toast.error("Vui lòng nhập tên loại mực");
      return;
    }
    if (quantity <= 0) {
      toast.error("Số lượng nhập kho phải lớn hơn 0");
      return;
    }
    if (!storageLocation.trim()) {
      toast.error("Vui lòng nhập vị trí lưu kho");
      return;
    }

    const compatibleModels = modelsInput
      .split(/[,;\n]+/)
      .map((m) => m.trim())
      .filter(Boolean);

    setLoading(true);
    try {
      const status = quantity > 3 ? "in_stock" : quantity > 0 ? "low_stock" : "out_of_stock";

      await tonerInventoryService.create(
        {
          id: "inv-" + generateId(),
          tonerTypeId: selectedTonerId || undefined,
          code: code.trim().toUpperCase(),
          name: name.trim(),
          brand: brand.trim(),
          tonerType: tonerType.trim(),
          color: color.trim(),
          compatibleModels,
          note: note.trim(),
          quantity: Number(quantity),
          storageLocation: storageLocation.trim(),
          importDate,
          supplier: supplier.trim(),
          importedBy: importedBy.trim() || user?.email || "Quản trị viên",
          status,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        user?.email
      );

      toast.success("Đã nhập kho " + quantity + " hộp mực " + code + " thành công!");
      router.push("/toner-inventory");
    } catch {
      toast.error("Không thể lưu phiếu nhập kho mực");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/toner-inventory"
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            Nhập Mực Mới Vào Kho
          </h1>
          <p className="text-xs text-slate-500">
            Quản lý độc lập số lượng hộp mực nhập mới về kho để lưu trữ và cấp phát
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        {/* Quick select from existing toner catalog */}
        {existingToners.length > 0 && (
          <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
              <Sparkles className="w-4 h-4 text-blue-600" />
              Chọn nhanh từ danh mục loại mực có sẵn (Tùy chọn)
            </div>
            <p className="text-[11px] text-blue-700">
              Chọn một mã mực dưới đây để tự động điền các thông số kỹ thuật, hoặc tự nhập mới bên dưới nếu là dòng mực mới:
            </p>
            <select
              value={selectedTonerId}
              onChange={(e) => handleSelectExistingToner(e.target.value)}
              className="w-full text-xs font-semibold bg-white border border-blue-300 rounded-xl p-2.5 text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Tự nhập thủ công mã mực mới --</option>
              {existingToners.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.code} - {t.name} ({t.brand})
                </option>
              ))}
            </select>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* PHẦN 1: THÔNG TIN LOẠI MỰC (GIỐNG HỆT FORM THÊM LOẠI MỰC) */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
              <Droplet className="w-4 h-4 text-purple-600" />
              1. Thông Tin Hộp Mực / Cartridge
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mã mực *
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="VD: TN-2385, 12A, 107A, Canon 325"
                  required
                  className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Hãng sản xuất *
                </label>
                <select
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-medium"
                >
                  <option value="Brother">Brother</option>
                  <option value="Canon">Canon</option>
                  <option value="HP">HP</option>
                  <option value="Epson">Epson</option>
                  <option value="Ricoh">Ricoh</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Tên đầy đủ của hộp mực *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Hộp mực Brother TN-2385 chính hãng"
                required
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Màu mực
                </label>
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="Black, Cyan, Magenta, Yellow"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mô tả loại mực
                </label>
                <input
                  type="text"
                  value={tonerType}
                  onChange={(e) => setTonerType(e.target.value)}
                  placeholder="Hộp mực laser đen trắng, Mực nạp chai..."
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Các Model máy tương thích (cách nhau bằng dấu phẩy)
              </label>
              <textarea
                rows={2}
                value={modelsInput}
                onChange={(e) => setModelsInput(e.target.value)}
                placeholder="VD: HL-L2321D, HL-L2366DW, DCP-L2520D, MFC-L2701D"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Ghi chú công suất / dung lượng
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="VD: Định mức in ~2.600 trang độ phủ 5%"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>

          {/* PHẦN 2: THÔNG TIN NHẬP KHO & LƯU TRỮ */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
              <Package className="w-4 h-4 text-blue-600" />
              2. Thông Tin Nhập & Tồn Kho Mực
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Số lượng nhập kho (Hộp) *
                </label>
                <input
                  type="number"
                  min={1}
                  max={9999}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  required
                  className="w-full text-sm font-black bg-blue-50/50 border border-blue-300 rounded-xl p-2.5 text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Vị trí lưu kho *
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={storageLocation}
                    onChange={(e) => setStorageLocation(e.target.value)}
                    placeholder="Kho Hành chính, Tủ 01 Kệ A..."
                    required
                    className="w-full pl-9 text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Ngày nhập kho
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    value={importDate}
                    onChange={(e) => setImportDate(e.target.value)}
                    required
                    className="w-full pl-9 text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nhà cung cấp / Nguồn nhập
                </label>
                <div className="relative">
                  <Truck className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    placeholder="Công ty cung cấp..."
                    className="w-full pl-9 text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Người nhập / Phụ trách
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={importedBy}
                    onChange={(e) => setImportedBy(e.target.value)}
                    placeholder="Quản trị viên"
                    className="w-full pl-9 text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Link
              href="/toner-inventory"
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
            >
              Hủy bỏ
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm shadow-blue-500/20 disabled:opacity-50 transition-all"
            >
              {loading ? (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Lưu Vào Kho Mực
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
