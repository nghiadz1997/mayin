"use client";

import React, { useState, useEffect } from "react";
import { FileClock, Search, Filter, Clock } from "lucide-react";
import { auditService } from "../../../services/auditService";
import { AuditLog } from "../../../types";
import { formatDateTime } from "../../../lib/utils";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    auditService.getAll().then((data) => {
      setLogs(data);
      setLoading(false);
    });
  }, []);

  const filteredLogs = logs.filter((log) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      log.details.toLowerCase().includes(q) ||
      log.resourceId.toLowerCase().includes(q) ||
      (log.userName && log.userName.toLowerCase().includes(q)) ||
      (log.userEmail && log.userEmail.toLowerCase().includes(q));

    const matchesAction = actionFilter === "all" || log.action === actionFilter;

    return matchesSearch && matchesAction;
  });

  const actionLabels: Record<string, { label: string; color: string }> = {
    CREATE_PRINTER: { label: "Tạo máy in", color: "bg-blue-50 text-blue-700 border-blue-200" },
    UPDATE_PRINTER: { label: "Sửa máy in", color: "bg-slate-100 text-slate-700 border-slate-200" },
    CHANGE_STATUS: { label: "Đổi trạng thái", color: "bg-amber-50 text-amber-700 border-amber-200" },
    REFILL_TONER: { label: "Nạp mực", color: "bg-purple-50 text-purple-700 border-purple-200" },
    REPLACE_TONER: { label: "Thay hộp mực", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
    CREATE_REPAIR: { label: "Báo hỏng", color: "bg-rose-50 text-rose-700 border-rose-200" },
    COMPLETE_REPAIR: { label: "Sửa xong", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    TRANSFER_PRINTER: { label: "Chuyển máy", color: "bg-cyan-50 text-cyan-700 border-cyan-200" },
    CREATE_DEPARTMENT: { label: "Tạo đơn vị", color: "bg-teal-50 text-teal-700 border-teal-200" },
    UPDATE_DEPARTMENT: { label: "Sửa đơn vị", color: "bg-slate-100 text-slate-700 border-slate-200" },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
          <FileClock className="w-6 h-6 text-blue-600" />
          Nhật Ký Thao Tác Hệ Thống (Audit Logs)
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Lưu vết toàn bộ mọi hoạt động thêm, sửa, điều chuyển và vận hành thiết bị
        </p>
      </div>

      {/* Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo nội dung, mã thiết bị (PRN-...), người thực hiện..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="w-full sm:w-56 text-xs bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="all">Tất cả hành động</option>
          <option value="REFILL_TONER">Nạp mực</option>
          <option value="REPLACE_TONER">Thay hộp mực</option>
          <option value="CREATE_PRINTER">Tạo máy in</option>
          <option value="TRANSFER_PRINTER">Điều chuyển máy</option>
          <option value="CREATE_REPAIR">Báo hỏng</option>
          <option value="COMPLETE_REPAIR">Hoàn thành sửa chữa</option>
        </select>
      </div>

      {/* Logs List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100 text-xs">
          {filteredLogs.map((log) => {
            const actInfo = actionLabels[log.action] || {
              label: log.action,
              color: "bg-slate-100 text-slate-700 border-slate-200",
            };
            return (
              <div
                key={log.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-slate-100 text-slate-500 flex-shrink-0 mt-0.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${actInfo.color}`}
                      >
                        {actInfo.label}
                      </span>
                      <span className="font-bold text-slate-900">{log.resourceId}</span>
                    </div>
                    <p className="text-slate-800 mt-1 font-medium">{log.details}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Thực hiện bởi: {log.userName} ({log.userEmail})
                    </p>
                  </div>
                </div>

                <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap sm:text-right">
                  {formatDateTime(log.timestamp)}
                </span>
              </div>
            );
          })}

          {filteredLogs.length === 0 && (
            <div className="py-12 text-center text-slate-400">
              Không có nhật ký nào phù hợp với bộ lọc.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
