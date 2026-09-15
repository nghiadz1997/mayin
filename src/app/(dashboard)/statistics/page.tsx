"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart3,
  Building2,
  Calendar,
  Printer as PrinterIcon,
  CheckCircle2,
  AlertOctagon,
  RefreshCw,
  Layers,
  TrendingUp,
  Award,
} from "lucide-react";
import { departmentService } from "../../../services/departmentService";
import { printerService } from "../../../services/printerService";
import { transactionService } from "../../../services/transactionService";
import { Department, Printer, TonerTransaction } from "../../../types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function StatisticsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [transactions, setTransactions] = useState<TonerTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedDeptId, setSelectedDeptId] = useState<string>("");
  const [timeRange, setTimeRange] = useState<"month" | "quarter" | "year" | "all">("year");

  useEffect(() => {
    Promise.all([
      departmentService.getAll(),
      printerService.getAll(),
      transactionService.getAll(),
    ]).then(([d, p, t]) => {
      setDepartments(d);
      setPrinters(p);
      setTransactions(t);
      if (d.length > 0) {
        setSelectedDeptId(d[0].id);
      }
      setLoading(false);
    });
  }, []);

  const currentMonthNum = new Date().getMonth() + 1;
  const currentYearNum = new Date().getFullYear();

  // Transactions filtered by timeRange
  const timeFilteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const d = new Date(tx.transactionDate);
      if (isNaN(d.getTime())) return false;
      const yr = d.getFullYear();
      const mo = d.getMonth() + 1;

      if (timeRange === "month") {
        return yr === currentYearNum && mo === currentMonthNum;
      }
      if (timeRange === "quarter") {
        const curQ = Math.ceil(currentMonthNum / 3);
        const txQ = Math.ceil(mo / 3);
        return yr === currentYearNum && txQ === curQ;
      }
      if (timeRange === "year") {
        return yr === currentYearNum;
      }
      return true;
    });
  }, [transactions, timeRange, currentMonthNum, currentYearNum]);

  // Section 27: Statistics for Selected Department
  const activeDept = departments.find((d) => d.id === selectedDeptId);
  const activeDeptPrinters = printers.filter((p) => p.departmentId === selectedDeptId);
  const activeDeptTxs = transactions.filter((t) => t.departmentId === selectedDeptId);

  const activeDeptStats = useMemo(() => {
    const total = activeDeptPrinters.length;
    const active = activeDeptPrinters.filter((p) => p.status === "active").length;
    const broken = activeDeptPrinters.filter((p) => p.status === "broken").length;

    const refillThisMonth = activeDeptTxs.filter((t) => {
      const d = new Date(t.transactionDate);
      return (
        d.getFullYear() === currentYearNum &&
        d.getMonth() + 1 === currentMonthNum &&
        t.transactionType === "refill"
      );
    }).length;

    const refillThisYear = activeDeptTxs.filter((t) => {
      const d = new Date(t.transactionDate);
      return d.getFullYear() === currentYearNum && t.transactionType === "refill";
    }).length;

    const replaceCount = activeDeptTxs.filter((t) => t.transactionType === "replace").length;

    return { total, active, broken, refillThisMonth, refillThisYear, replaceCount };
  }, [activeDeptPrinters, activeDeptTxs, currentYearNum, currentMonthNum]);

  // Section 28: TOP 5 Máy nạp mực nhiều nhất
  const topPrinters = useMemo(() => {
    const map: Record<string, { code: string; model: string; deptName: string; count: number }> = {};
    timeFilteredTransactions
      .filter((t) => t.transactionType === "refill")
      .forEach((tx) => {
        if (!map[tx.printerId]) {
          map[tx.printerId] = {
            code: tx.printerCodeSnapshot,
            model: tx.printerModelSnapshot,
            deptName: tx.departmentNameSnapshot,
            count: 0,
          };
        }
        map[tx.printerId].count += 1;
      });

    return Object.values(map)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [timeFilteredTransactions]);

  // Section 29: SO SÁNH KHOA/PHÒNG (Chart)
  const compareDeptData = useMemo(() => {
    const map: Record<string, { code: string; name: string; count: number }> = {};
    departments.forEach((d) => {
      map[d.id] = { code: d.code, name: d.name, count: 0 };
    });

    timeFilteredTransactions
      .filter((t) => t.transactionType === "refill")
      .forEach((tx) => {
        if (map[tx.departmentId]) {
          map[tx.departmentId].count += 1;
        }
      });

    return Object.values(map)
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [departments, timeFilteredTransactions]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            Thống Kê Chuyên Sâu Theo Khoa / Phòng
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Phân tích số liệu thiết bị và so sánh tần suất nạp mực giữa các đơn vị
          </p>
        </div>

        {/* Time Selector */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-sm text-xs font-semibold">
          <button
            onClick={() => setTimeRange("month")}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              timeRange === "month" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Tháng này
          </button>
          <button
            onClick={() => setTimeRange("quarter")}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              timeRange === "quarter" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Quý này
          </button>
          <button
            onClick={() => setTimeRange("year")}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              timeRange === "year" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Năm nay
          </button>
          <button
            onClick={() => setTimeRange("all")}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              timeRange === "all" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Toàn thời gian
          </button>
        </div>
      </div>

      {/* SECTION 27: THỐNG KÊ KHOA/PHÒNG CỤ THỂ */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              1. THỐNG KÊ CHI TIẾT THEO ĐƠN VỊ
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Chọn một Khoa hoặc Phòng để xem chỉ số</p>
          </div>

          {/* Department Picker */}
          <select
            value={selectedDeptId}
            onChange={(e) => setSelectedDeptId(e.target.value)}
            className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 w-full sm:w-80"
          >
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.code} - {d.name}
              </option>
            ))}
          </select>
        </div>

        {activeDept && (
          <div>
            <h3 className="text-base font-bold text-blue-900 mb-3">{activeDept.name}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <span className="text-slate-500 text-xs font-medium block">Tổng máy</span>
                <strong className="text-xl font-bold text-slate-900 mt-1 block">
                  {activeDeptStats.total}
                </strong>
              </div>

              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                <span className="text-emerald-700 text-xs font-medium block">Đang hoạt động</span>
                <strong className="text-xl font-bold text-emerald-700 mt-1 block">
                  {activeDeptStats.active}
                </strong>
              </div>

              <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 text-center">
                <span className="text-rose-700 text-xs font-medium block">Đang hỏng</span>
                <strong className="text-xl font-bold text-rose-700 mt-1 block">
                  {activeDeptStats.broken}
                </strong>
              </div>

              <div className="p-3.5 bg-blue-50 rounded-xl border border-blue-200 text-center">
                <span className="text-blue-700 text-xs font-medium block">Nạp mực tháng</span>
                <strong className="text-xl font-bold text-blue-700 mt-1 block">
                  {activeDeptStats.refillThisMonth}
                </strong>
              </div>

              <div className="p-3.5 bg-purple-50 rounded-xl border border-purple-200 text-center">
                <span className="text-purple-700 text-xs font-medium block">Nạp mực năm</span>
                <strong className="text-xl font-bold text-purple-700 mt-1 block">
                  {activeDeptStats.refillThisYear}
                </strong>
              </div>

              <div className="p-3.5 bg-violet-50 rounded-xl border border-violet-200 text-center">
                <span className="text-violet-700 text-xs font-medium block">Thay hộp mực</span>
                <strong className="text-xl font-bold text-violet-700 mt-1 block">
                  {activeDeptStats.replaceCount}
                </strong>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Grid: Top 5 Printers & Compare Departments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SECTION 28: TOP MÁY NẠP MỰC NHIỀU NHẤT */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-500" />
                TOP MÁY SỬ DỤNG MỰC
              </h2>
              <p className="text-[11px] text-slate-400">Các thiết bị có số lần nạp mực cao nhất</p>
            </div>
          </div>

          <div className="space-y-3">
            {topPrinters.map((p, idx) => (
              <div
                key={p.code}
                className="p-3 bg-slate-50 hover:bg-blue-50/50 rounded-xl border border-slate-200 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                      idx === 0
                        ? "bg-amber-400 text-slate-900"
                        : idx === 1
                        ? "bg-slate-300 text-slate-800"
                        : idx === 2
                        ? "bg-amber-200 text-slate-800"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <div>
                    <span className="font-bold text-xs text-slate-900">{p.code}</span>
                    <p className="text-[11px] text-slate-500">{p.deptName}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-bold text-sm text-blue-600">{p.count} lần</span>
                  <p className="text-[10px] text-slate-400">nạp mực</p>
                </div>
              </div>
            ))}

            {topPrinters.length === 0 && (
              <p className="text-center py-6 text-xs text-slate-400">
                Chưa có dữ liệu nạp mực trong khoảng thời gian đã chọn.
              </p>
            )}
          </div>
        </div>

        {/* SECTION 29: SO SÁNH KHOA/PHÒNG (Chart) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-purple-600" />
                SỐ LẦN NẠP MỰC THEO ĐƠN VỊ
              </h2>
              <p className="text-[11px] text-slate-400">So sánh tổng lượt nạp mực giữa các Khoa/Phòng</p>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={compareDeptData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="code"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                <Tooltip
                  formatter={(val: any, name: any, item: any) => [`${val} lần nạp`, item.payload.name]}
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "none",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" name="Số lần nạp mực" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
