"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Wrench,
  Search,
  Plus,
  AlertCircle,
  CheckCircle2,
  Clock,
  Filter,
  Eye,
  Check,
} from "lucide-react";
import { repairService } from "../../../services/repairService";
import { departmentService } from "../../../services/departmentService";
import { printerService } from "../../../services/printerService";
import { Repair, Department, Printer, RepairStatus } from "../../../types";
import { formatDate, REPAIR_STATUS_MAP } from "../../../lib/utils";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../components/ui/Toast";

export default function RepairsPage() {
  const { canPerformOperations } = useAuth();
  const toast = useToast();

  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [rList, dList, pList] = await Promise.all([
        repairService.getAll(),
        departmentService.getAll(),
        printerService.getAll(),
      ]);
      setRepairs(rList);
      setDepartments(dList);
      setPrinters(pList);
    } finally {
      setLoading(false);
    }
  }

  const handleQuickComplete = async (repair: Repair) => {
    try {
      await repairService.update(
        repair.id,
        {
          status: "completed",
          completedAt: new Date().toISOString(),
          printerId: repair.printerId,
        },
        undefined,
        true // restore printer to active!
      );
      toast.success(`Đã hoàn tất sửa chữa máy ${repair.printerCodeSnapshot} & đưa máy trở lại hoạt động!`);
      loadData();
    } catch {
      toast.error("Không thể cập nhật trạng thái sửa chữa");
    }
  };

  const filteredRepairs = useMemo(() => {
    return repairs.filter((r) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        r.printerCodeSnapshot.toLowerCase().includes(q) ||
        r.problem.toLowerCase().includes(q) ||
        r.departmentNameSnapshot.toLowerCase().includes(q) ||
        (r.assignedTo && r.assignedTo.toLowerCase().includes(q)) ||
        r.reportedBy.toLowerCase().includes(q);

      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      const matchesDept = deptFilter === "all" || r.departmentId === deptFilter;

      return matchesSearch && matchesStatus && matchesDept;
    });
  }, [repairs, search, statusFilter, deptFilter]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Wrench className="w-6 h-6 text-amber-600" />
            Quản Lý Sự Cố & Sửa Chữa Máy In
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Quy trình tiếp nhận, kiểm tra, sửa chữa và thay thế linh kiện máy in toàn trường
          </p>
        </div>

        {canPerformOperations && (
          <Link
            href="/repairs/new"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm shadow-blue-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            + Báo hỏng / Tạo phiếu sửa chữa
          </Link>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo Mã máy (PRN-...), Lỗi (kẹt giấy...), Khoa/Phòng, Kỹ thuật viên..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-48 text-xs bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Chờ xử lý</option>
            <option value="checking">Đang kiểm tra</option>
            <option value="repairing">Đang sửa chữa</option>
            <option value="waiting_parts">Chờ linh kiện</option>
            <option value="completed">Đã hoàn thành</option>
            <option value="unrepairable">Không thể sửa</option>
          </select>

          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="w-full sm:w-48 text-xs bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">Tất cả Khoa / Phòng</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.code} - {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-4 whitespace-nowrap">Ngày báo</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Mã máy</th>
                <th className="py-3.5 px-4">Khoa / Phòng</th>
                <th className="py-3.5 px-4">Nội dung lỗi sự cố</th>
                <th className="py-3.5 px-4">Người báo</th>
                <th className="py-3.5 px-4">Kỹ thuật viên</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Linh kiện thay</th>
                <th className="py-3.5 px-4 text-center">Trạng thái</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRepairs.map((r) => {
                const repSt = REPAIR_STATUS_MAP[r.status] || REPAIR_STATUS_MAP.pending;
                return (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 font-medium">
                      {formatDate(r.reportedDate)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <Link
                        href={`/printers/${r.printerId}`}
                        className="font-bold text-blue-600 hover:underline"
                      >
                        {r.printerCodeSnapshot}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 max-w-[180px] truncate">
                      {r.departmentNameSnapshot}
                    </td>
                    <td className="py-3.5 px-4 max-w-[220px]">
                      <Link
                        href={`/repairs/${r.id}`}
                        className="font-semibold text-slate-900 hover:text-blue-600 line-clamp-1"
                      >
                        {r.problem}
                      </Link>
                      {r.description && (
                        <p className="text-[11px] text-slate-400 truncate font-normal">
                          {r.description}
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">{r.reportedBy}</td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-800">
                      {r.assignedTo || <span className="text-slate-400 italic">Chưa giao</span>}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 max-w-[150px] truncate">
                      {r.replacedParts || "--"}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${repSt.bg} ${repSt.color}`}
                      >
                        {repSt.label}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {r.status !== "completed" && canPerformOperations && (
                          <button
                            onClick={() => handleQuickComplete(r)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
                            title="Đánh dấu sửa xong & đưa máy trở lại hoạt động"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Xong
                          </button>
                        )}
                        <Link
                          href={`/repairs/${r.id}`}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Xem chi tiết phiếu sửa chữa"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredRepairs.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Không tìm thấy phiếu sửa chữa nào phù hợp với bộ lọc.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
