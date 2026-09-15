"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Droplet, Search, Plus, Printer, CheckCircle2, X, Edit, EyeOff } from "lucide-react";
import { tonerService } from "../../../services/tonerService";
import { printerService } from "../../../services/printerService";
import { transactionService } from "../../../services/transactionService";
import { TonerType, Printer as IPrinter, TonerTransaction } from "../../../types";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../components/ui/Toast";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";

export default function TonersPage() {
  const { canManagePrinters } = useAuth();
  const toast = useToast();

  const [toners, setToners] = useState<TonerType[]>([]);
  const [printers, setPrinters] = useState<IPrinter[]>([]);
  const [transactions, setTransactions] = useState<TonerTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("all");
  const [toggleTarget, setToggleTarget] = useState<TonerType | null>(null);

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

  const handleToggleStatus = async () => {
    if (!toggleTarget) return;
    try {
      await tonerService.toggleStatus(toggleTarget.id, toggleTarget.status);
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
                  <button
                    onClick={() => setToggleTarget(t)}
                    className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100"
                    title={t.status === "active" ? "Đánh dấu ngưng dùng" : "Kích hoạt lại"}
                  >
                    <EyeOff className="w-4 h-4" />
                  </button>
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
    </div>
  );
}
