"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Printer as PrinterIcon } from "lucide-react";
import { printerService } from "../../../../../services/printerService";
import { departmentService } from "../../../../../services/departmentService";
import { tonerService } from "../../../../../services/tonerService";
import {
  Department,
  TonerType,
  PrinterType,
  ColorMode,
  PrinterStatus,
} from "../../../../../types";
import { useToast } from "../../../../../components/ui/Toast";
import { useAuth } from "../../../../../context/AuthContext";

export default function EditPrinterPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const toast = useToast();
  const { user } = useAuth();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [toners, setToners] = useState<TonerType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("Brother");
  const [model, setModel] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [printerType, setPrinterType] = useState<PrinterType>("laser");
  const [colorMode, setColorMode] = useState<ColorMode>("mono");
  const [departmentId, setDepartmentId] = useState("");
  const [location, setLocation] = useState("");
  const [tonerTypeId, setTonerTypeId] = useState("");
  const [status, setStatus] = useState<PrinterStatus>("active");
  const [startUseDate, setStartUseDate] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [printer, dList, tList] = await Promise.all([
          printerService.getById(id),
          departmentService.getAll(),
          tonerService.getAll(),
        ]);

        if (!printer) {
          toast.error("Không tìm thấy thông tin máy in");
          router.push("/printers");
          return;
        }

        setDepartments(dList);
        setToners(tList);

        setCode(printer.code);
        setName(printer.name);
        setBrand(printer.brand);
        setModel(printer.model);
        setSerialNumber(printer.serialNumber || "");
        setPrinterType(printer.printerType);
        setColorMode(printer.colorMode);
        setDepartmentId(printer.departmentId);
        setLocation(printer.location);
        setTonerTypeId(printer.tonerTypeId);
        setStatus(printer.status);
        setStartUseDate(printer.startUseDate || "");
        setImageUrl(printer.imageUrl || "");
        setNote(printer.note || "");
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id, router, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Vui lòng nhập tên máy in");
      return;
    }
    if (!model.trim()) {
      toast.error("Vui lòng nhập Model máy in");
      return;
    }

    setSaving(true);
    try {
      await printerService.update(
        id,
        {
          name: name.trim(),
          brand: brand.trim(),
          model: model.trim(),
          serialNumber: serialNumber.trim(),
          printerType,
          colorMode,
          departmentId,
          location: location.trim(),
          tonerTypeId,
          status,
          startUseDate,
          imageUrl: imageUrl.trim(),
          note: note.trim(),
        },
        user?.email
      );

      toast.success("Cập nhật thông tin máy in thành công!");
      router.push(`/printers/${id}`);
    } catch {
      toast.error("Không thể cập nhật máy in. Vui lòng thử lại!");
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/printers/${id}`}
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Chỉnh Sửa Thông Tin Máy In: {code}
          </h1>
          <p className="text-xs text-slate-500">Cập nhật vị trí, trạng thái hoặc thông số máy</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Mã máy in (Cố định)
              </label>
              <input
                type="text"
                value={code}
                disabled
                className="w-full text-xs font-bold uppercase bg-slate-100 border border-slate-200 rounded-xl p-2.5 text-slate-500 cursor-not-allowed"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Tên gợi nhớ của máy *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
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
                <option value="Xerox">Fuji Xerox</option>
                <option value="Khác">Khác</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Model máy *
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                required
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Số Serial máy
              </label>
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Khoa / Phòng quản lý
              </label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
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
                Vị trí đặt máy cụ thể
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Trạng thái máy in
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PrinterStatus)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              >
                <option value="active">Đang hoạt động</option>
                <option value="broken">Đang hỏng</option>
                <option value="repairing">Đang sửa chữa</option>
                <option value="inactive">Tạm ngưng</option>
                <option value="disposed">Đã thanh lý</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Hộp mực tương thích
              </label>
              <select
                value={tonerTypeId}
                onChange={(e) => setTonerTypeId(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              >
                {toners.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.code} - {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Ghi chú
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Link
            href={`/printers/${id}`}
            className="px-5 py-2.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
          >
            Hủy bỏ
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm shadow-blue-500/25 disabled:opacity-50"
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Cập nhật máy in
          </button>
        </div>
      </form>
    </div>
  );
}
