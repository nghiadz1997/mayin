"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, ArrowLeft, Save } from "lucide-react";
import { departmentService } from "../../../../services/departmentService";
import { DepartmentType } from "../../../../types";
import { useToast } from "../../../../components/ui/Toast";
import { generateId } from "../../../../lib/utils";
import { useAuth } from "../../../../context/AuthContext";

export default function NewDepartmentPage() {
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<DepartmentType>("faculty");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      toast.error("Vui lòng nhập mã đơn vị (ví dụ: CNTT-KTĐ, QTTB)");
      return;
    }
    if (!name.trim()) {
      toast.error("Vui lòng nhập tên Khoa / Phòng");
      return;
    }

    setLoading(true);
    try {
      await departmentService.create(
        {
          id: "dept-" + generateId(),
          code: code.trim().toUpperCase(),
          name: name.trim(),
          type,
          note: note.trim(),
          status: "active",
          campusId: "campus-1",
          createdAt: new Date().toISOString(),
        },
        user?.email
      );

      toast.success("Thêm đơn vị mới thành công!");
      router.push("/departments");
    } catch {
      toast.error("Không thể thêm đơn vị mới");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/departments"
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Thêm Khoa / Phòng / Ban mới</h1>
          <p className="text-xs text-slate-500">Khởi tạo đơn vị quản lý thiết bị máy in</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Mã đơn vị *
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="VD: CNTT-KTĐ, TS, QLĐT"
                required
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
              <p className="text-[10px] text-slate-400 mt-1">Dùng để sinh mã máy in tự động</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Loại đơn vị *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as DepartmentType)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              >
                <option value="faculty">Khoa đào tạo chuyên môn</option>
                <option value="office">Phòng ban chức năng hành chính</option>
                <option value="other">Đơn vị / Trung tâm khác</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Tên đầy đủ của Khoa / Phòng *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Khoa Công nghệ thông tin - Kỹ thuật điện"
              required
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Vị trí / Tòa nhà / Ghi chú
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Tầng 3, Nhà A - Cơ sở chính"
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Link
              href="/departments"
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
              Lưu Khoa / Phòng
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
