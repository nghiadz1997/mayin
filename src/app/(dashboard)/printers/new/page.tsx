"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Sparkles, Printer as PrinterIcon } from "lucide-react";
import { printerService } from "../../../../services/printerService";
import { departmentService } from "../../../../services/departmentService";
import { tonerService } from "../../../../services/tonerService";
import {
  Department,
  TonerType,
  PrinterType,
  ColorMode,
  PrinterStatus,
} from "../../../../types";
import { generatePrinterCode, generateId } from "../../../../lib/utils";
import { useToast } from "../../../../components/ui/Toast";
import { useAuth } from "../../../../context/AuthContext";

export default function NewPrinterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedDeptId = searchParams.get("departmentId") || "";

  const toast = useToast();
  const { user } = useAuth();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [toners, setToners] = useState<TonerType[]>([]);
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("Brother");
  const [model, setModel] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [printerType, setPrinterType] = useState<PrinterType>("laser");
  const [colorMode, setColorMode] = useState<ColorMode>("mono");
  const [departmentId, setDepartmentId] = useState(preselectedDeptId);
  const [location, setLocation] = useState("");
  const [tonerTypeId, setTonerTypeId] = useState("");
  const [status, setStatus] = useState<PrinterStatus>("active");
  const [startUseDate, setStartUseDate] = useState(new Date().toISOString().split("T")[0]);
  const [imageUrl, setImageUrl] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    Promise.all([departmentService.getAll(), tonerService.getAll()]).then(([d, t]) => {
      setDepartments(d);
      setToners(t);
      if (t.length > 0 && !tonerTypeId) {
        setTonerTypeId(t[0].id);
      }
      if (d.length > 0 && !departmentId) {
        setDepartmentId(preselectedDeptId || d[0].id);
      }
    });
  }, [preselectedDeptId]);

  // Auto-generate Code when department changes
  const handleAutoGenerateCode = async (targetDeptId?: string) => {
    const dept = departments.find((d) => d.id === (targetDeptId || departmentId));
    if (!dept) return;

    const allPrinters = await printerService.getAll();
    const deptPrinters = allPrinters.filter((p) => p.departmentId === dept.id);
    const newCode = generatePrinterCode(dept.code, deptPrinters.length);
    setCode(newCode);
  };

  useEffect(() => {
    if (departmentId && !code) {
      handleAutoGenerateCode(departmentId);
    }
  }, [departmentId, departments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim()) {
      toast.error("Vui lòng nhập hoặc sinh mã máy in");
      return;
    }
    if (!name.trim()) {
      toast.error("Vui lòng nhập tên máy in");
      return;
    }
    if (!model.trim()) {
      toast.error("Vui lòng nhập Model máy in");
      return;
    }
    if (!departmentId) {
      toast.error("Vui lòng chọn Khoa / Phòng quản lý máy");
      return;
    }

    setLoading(true);
    try {
      // Check Unique Code
      const existing = await printerService.getByCode(code.trim());
      if (existing) {
        toast.error(`Mã máy ${code.trim()} đã tồn tại trong hệ thống! Vui lòng chọn mã khác.`);
        setLoading(false);
        return;
      }

      await printerService.create(
        {
          id: "prn-" + generateId(),
          code: code.trim().toUpperCase(),
          name: name.trim(),
          brand: brand.trim(),
          model: model.trim(),
          serialNumber: serialNumber.trim() || `SN-${generateId().toUpperCase()}`,
          printerType,
          colorMode,
          departmentId,
          location: location.trim() || "Văn phòng đơn vị",
          tonerTypeId,
          status,
          startUseDate,
          imageUrl: imageUrl.trim(),
          note: note.trim(),
          campusId: "campus-1",
          createdBy: user?.email || "Admin",
          createdAt: new Date().toISOString(),
        },
        user?.email
      );

      toast.success(`Đã thêm máy in ${code.trim()} thành công!`);
      router.push("/printers");
    } catch {
      toast.error("Không thể thêm máy in. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/printers"
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Thêm Máy In Mới Vào Hệ Thống</h1>
          <p className="text-xs text-slate-500">
            Khai báo thông số kỹ thuật, vị trí bố trí và loại mực tương thích
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Basic Information */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
            <PrinterIcon className="w-4 h-4 text-blue-600" />
            1. THÔNG TIN CƠ BẢN
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Machine Code with auto-gen */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Mã máy in *
                </label>
                <button
                  type="button"
                  onClick={() => handleAutoGenerateCode()}
                  className="text-[11px] font-semibold text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" /> Tự sinh mã
                </button>
              </div>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="VD: PRN-CNTT-001"
                required
                className="w-full text-xs font-bold uppercase bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            {/* Printer Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Tên gợi nhớ của máy *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Máy in Văn phòng Khoa CNTT, Máy in Tiếp sinh 1"
                required
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            {/* Brand */}
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
                <option value="Xerox">Fuji Xerox</option>
                <option value="Khác">Khác</option>
              </select>
            </div>

            {/* Model */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Model máy *
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="VD: HL-L2321D, LBP 2900, LaserJet 1020"
                required
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            {/* Serial Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Số Serial máy
              </label>
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="VD: BR-2321-99812"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Classification & Color */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">
            2. PHÂN LOẠI & CHẾ ĐỘ IN
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Phân loại máy
              </label>
              <select
                value={printerType}
                onChange={(e) => setPrinterType(e.target.value as PrinterType)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              >
                <option value="laser">Máy in Laser</option>
                <option value="inkjet">Máy in phun màu</option>
                <option value="multifunction">Máy in đa chức năng (In/Scan/Copy)</option>
                <option value="photocopier">Máy Photocopy lớn</option>
                <option value="other">Khác</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Chế độ màu
              </label>
              <select
                value={colorMode}
                onChange={(e) => setColorMode(e.target.value as ColorMode)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              >
                <option value="mono">Trắng đen (Monochrome)</option>
                <option value="color">In màu (Color)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Location & Department */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">
            3. ĐƠN VỊ QUẢN LÝ & VỊ TRÍ ĐẶT MÁY
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Khoa / Phòng / Ban *
              </label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                required
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.code} - {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Vị trí phòng / bàn làm việc cụ thể *
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="VD: Phòng A302 - Bàn trợ lý Khoa"
                required
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Toner Type */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">
            4. HỘP MỰC TƯƠNG THÍCH
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Loại mực máy đang sử dụng *
              </label>
              <select
                value={tonerTypeId}
                onChange={(e) => setTonerTypeId(e.target.value)}
                required
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              >
                {toners.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.code} - {t.name} ({t.brand})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Trạng thái hoạt động ban đầu
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PrinterStatus)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              >
                <option value="active">Đang hoạt động bình thường</option>
                <option value="broken">Đang hỏng</option>
                <option value="repairing">Đang bảo trì / sửa chữa</option>
                <option value="inactive">Tạm ngưng</option>
                <option value="disposed">Đã thanh lý</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 5: Other Info */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">
            5. THÔNG TIN KHÁC
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Ngày đưa vào sử dụng
              </label>
              <input
                type="date"
                value={startUseDate}
                onChange={(e) => setStartUseDate(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Link ảnh máy in (tùy chọn)
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Ghi chú thêm về thiết bị
              </label>
              <textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="VD: Máy in có hỗ trợ kết nối mạng LAN / Wifi hai mặt tự động"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/printers"
            className="px-5 py-2.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Hủy bỏ
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Lưu máy in vào hệ thống
          </button>
        </div>
      </form>
    </div>
  );
}
