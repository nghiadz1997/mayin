"use client";

import React, { useState, useEffect } from "react";
import { Settings as SettingsIcon, Save, RefreshCw, AlertTriangle, Building, ShieldCheck } from "lucide-react";
import { settingsService } from "../../../services/settingsService";
import { SystemSettings } from "../../../types";
import { useToast } from "../../../components/ui/Toast";
import { resetLocalData } from "../../../services/dataStore";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";

export default function SettingsPage() {
  const toast = useToast();

  const [settings, setSettings] = useState<SystemSettings>({
    schoolName: "Trường Đại học Công nghệ & Đào tạo",
    academicYear: "2025 - 2026",
    alertHighRefillThreshold: 3,
    alertLongRepairDays: 7,
    alertNoCheckDays: 90,
    campuses: [
      { id: "campus-1", name: "Cơ sở chính (Khu A)" },
      { id: "campus-2", name: "Cơ sở thực hành (Khu B)" },
    ],
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  useEffect(() => {
    settingsService.getSettings().then((s) => {
      setSettings(s);
      setLoading(false);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await settingsService.updateSettings(settings);
      toast.success("Đã lưu cấu hình hệ thống thành công!");
    } catch {
      toast.error("Không thể lưu cấu hình");
    } finally {
      setSaving(false);
    }
  };

  const handleResetData = () => {
    resetLocalData();
    toast.success("Đã khôi phục dữ liệu mẫu ban đầu!");
    setResetDialogOpen(false);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
          <SettingsIcon className="w-6 h-6 text-blue-600" />
          Cài Đặt Hệ Thống & Ngưỡng Cảnh Báo
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Cấu hình thông tin trường, ngưỡng cảnh báo thông minh và các cơ sở trực thuộc
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: School Info */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <Building className="w-4 h-4 text-blue-600" />
            1. THÔNG TIN ĐƠN VỊ & NĂM HỌC
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tên Trường / Học Viện</label>
              <input
                type="text"
                value={settings.schoolName}
                onChange={(e) => setSettings({ ...settings, schoolName: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Năm học áp dụng</label>
              <input
                type="text"
                value={settings.academicYear}
                onChange={(e) => setSettings({ ...settings, academicYear: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Smart Alert Thresholds */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            2. CẤU HÌNH NGƯỠNG CẢNH BÁO THÔNG MINH (RULE-BASED)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Ngưỡng nạp mực nhiều (lần / tháng)
              </label>
              <input
                type="number"
                min={1}
                value={settings.alertHighRefillThreshold}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    alertHighRefillThreshold: parseInt(e.target.value) || 3,
                  })
                }
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
              />
              <p className="text-[10px] text-slate-400 mt-1">Cảnh báo nếu máy nạp vượt số lần này</p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Ngưỡng sửa chữa lâu (ngày)
              </label>
              <input
                type="number"
                min={1}
                value={settings.alertLongRepairDays}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    alertLongRepairDays: parseInt(e.target.value) || 7,
                  })
                }
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
              />
              <p className="text-[10px] text-slate-400 mt-1">Cảnh báo nếu máy sửa vượt số ngày này</p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Ngưỡng chưa kiểm tra (ngày)
              </label>
              <input
                type="number"
                min={1}
                value={settings.alertNoCheckDays}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    alertNoCheckDays: parseInt(e.target.value) || 90,
                  })
                }
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
              />
              <p className="text-[10px] text-slate-400 mt-1">Nhắc nhở bảo trì định kỳ</p>
            </div>
          </div>
        </div>

        {/* Section 3: Multi-Campus */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            3. QUẢN LÝ CƠ SỞ ĐÀO TẠO (MULTI-CAMPUS)
          </h2>

          <div className="space-y-2 text-xs">
            {settings.campuses.map((c, idx) => (
              <div
                key={c.id}
                className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-slate-800">{c.name}</span>
                  <span className="text-[10px] text-slate-400 block">ID: {c.id}</span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {idx === 0 ? "Cơ sở chính" : "Phân hiệu"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Save button */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => setResetDialogOpen(true)}
            className="text-xs font-semibold text-rose-600 hover:underline flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Khôi phục dữ liệu mẫu (Reset Demo Data)
          </button>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50"
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Lưu cài đặt
          </button>
        </div>
      </form>

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        isOpen={resetDialogOpen}
        title="Khôi phục toàn bộ dữ liệu mẫu ban đầu?"
        message="Thao tác này sẽ đặt lại danh sách 6 Khoa, 8 Phòng, 16 máy in và toàn bộ lịch sử mẫu ban đầu."
        confirmText="Xác nhận khôi phục"
        variant="danger"
        onConfirm={handleResetData}
        onCancel={() => setResetDialogOpen(false)}
      />
    </div>
  );
}
