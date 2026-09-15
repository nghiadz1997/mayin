"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Droplet } from "lucide-react";
import { tonerService } from "../../../../services/tonerService";
import { useToast } from "../../../../components/ui/Toast";
import { generateId } from "../../../../lib/utils";
import { useAuth } from "../../../../context/AuthContext";

export default function NewTonerPage() {
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("Brother");
  const [tonerType, setTonerType] = useState("Hộp mực Laser đen trắng");
  const [color, setColor] = useState("Black");
  const [modelsInput, setModelsInput] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

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

    const compatibleModels = modelsInput
      .split(/[,;\n]+/)
      .map((m) => m.trim())
      .filter(Boolean);

    setLoading(true);
    try {
      await tonerService.create(
        {
          id: "toner-" + generateId(),
          code: code.trim().toUpperCase(),
          name: name.trim(),
          brand: brand.trim(),
          tonerType: tonerType.trim(),
          color: color.trim(),
          compatibleModels,
          note: note.trim(),
          status: "active",
          createdAt: new Date().toISOString(),
        },
        user?.email
      );

      toast.success(`Đã thêm loại mực ${code.trim()} thành công!`);
      router.push("/toners");
    } catch {
      toast.error("Không thể thêm loại mực");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/toners"
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Thêm Loại Mực Máy In Mới</h1>
          <p className="text-xs text-slate-500">
            Khai báo mã hộp mực và danh sách các model máy in tương thích
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
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
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
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
              rows={3}
              value={modelsInput}
              onChange={(e) => setModelsInput(e.target.value)}
              placeholder="VD: HL-L2321D, HL-L2366DW, DCP-L2520D, MFC-L2701D"
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Hệ thống sẽ gợi ý loại mực này khi tạo hoặc nạp mực cho các model trên
            </p>
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

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Link
              href="/toners"
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
            >
              Hủy bỏ
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm shadow-blue-500/20 disabled:opacity-50"
            >
              {loading ? (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Lưu loại mực
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
