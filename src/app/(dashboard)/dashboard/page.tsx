"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Printer,
  CheckCircle2,
  AlertOctagon,
  Wrench,
  PauseCircle,
  Building2,
  RefreshCw,
  Calendar,
  AlertTriangle,
  Layers,
  ArrowRight,
  Filter,
  TrendingUp,
  Clock,
  Droplet,
} from "lucide-react";
import { printerService } from "../../../services/printerService";
import { departmentService } from "../../../services/departmentService";
import { transactionService } from "../../../services/transactionService";
import { repairService } from "../../../services/repairService";
import { tonerService } from "../../../services/tonerService";
import { settingsService } from "../../../services/settingsService";
import {
  Printer as IPrinter,
  Department,
  TonerTransaction,
  Repair,
  TonerType,
  SystemSettings,
} from "../../../types";
import { formatDate, formatDateTime, PRINTER_STATUS_MAP } from "../../../lib/utils";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function DashboardPage() {
  const [printers, setPrinters] = useState<IPrinter[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [transactions, setTransactions] = useState<TonerTransaction[]>([]);
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [toners, setToners] = useState<TonerType[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedDeptId, setSelectedDeptId] = useState<string>("all"); // "all" | "faculty" | "office" | deptId
  const [selectedYear, setSelectedYear] = useState<string>("2026");
  const [selectedMonth, setSelectedMonth] = useState<string>("all"); // "all" | "1".."12"
  const [selectedQuarter, setSelectedQuarter] = useState<string>("all"); // "all" | "1".."4"

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [p, d, t, r, ton, s] = await Promise.all([
          printerService.getAll(),
          departmentService.getAll(),
          transactionService.getAll(),
          repairService.getAll(),
          tonerService.getAll(),
          settingsService.getSettings(),
        ]);
        setPrinters(p);
        setDepartments(d);
        setTransactions(t);
        setRepairs(r);
        setToners(ton);
        setSettings(s);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Filtered dataset calculation
  const filteredPrinters = useMemo(() => {
    return printers.filter((p) => {
      if (selectedDeptId === "all") return true;
      if (selectedDeptId === "faculty") {
        const dept = departments.find((d) => d.id === p.departmentId);
        return dept?.type === "faculty";
      }
      if (selectedDeptId === "office") {
        const dept = departments.find((d) => d.id === p.departmentId);
        return dept?.type === "office";
      }
      return p.departmentId === selectedDeptId;
    });
  }, [printers, departments, selectedDeptId]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // 1. Dept filter based on snapshot
      if (selectedDeptId !== "all") {
        if (selectedDeptId === "faculty") {
          const dept = departments.find((d) => d.id === t.departmentId);
          if (dept?.type !== "faculty") return false;
        } else if (selectedDeptId === "office") {
          const dept = departments.find((d) => d.id === t.departmentId);
          if (dept?.type !== "office") return false;
        } else if (t.departmentId !== selectedDeptId) {
          return false;
        }
      }

      // 2. Date filter
      const txDate = new Date(t.transactionDate);
      if (isNaN(txDate.getTime())) return false;

      const year = txDate.getFullYear().toString();
      if (selectedYear !== "all" && year !== selectedYear) return false;

      const month = (txDate.getMonth() + 1).toString();
      if (selectedMonth !== "all" && month !== selectedMonth) return false;

      const q = Math.ceil((txDate.getMonth() + 1) / 3).toString();
      if (selectedQuarter !== "all" && q !== selectedQuarter) return false;

      return true;
    });
  }, [transactions, departments, selectedDeptId, selectedYear, selectedMonth, selectedQuarter]);

  // Current Month & Current Year Counters
  const currentMonthNum = new Date().getMonth() + 1;
  const currentYearNum = new Date().getFullYear();

  const refillsThisMonth = useMemo(() => {
    return filteredTransactions.filter((t) => {
      const d = new Date(t.transactionDate);
      return (
        d.getFullYear() === currentYearNum &&
        d.getMonth() + 1 === currentMonthNum &&
        t.transactionType === "refill"
      );
    }).length;
  }, [filteredTransactions, currentYearNum, currentMonthNum]);

  const refillsThisYear = useMemo(() => {
    return filteredTransactions.filter((t) => {
      const d = new Date(t.transactionDate);
      return d.getFullYear() === currentYearNum && t.transactionType === "refill";
    }).length;
  }, [filteredTransactions, currentYearNum]);

  const replacementsThisMonth = useMemo(() => {
    return filteredTransactions.filter((t) => {
      const d = new Date(t.transactionDate);
      return (
        d.getFullYear() === currentYearNum &&
        d.getMonth() + 1 === currentMonthNum &&
        t.transactionType === "replace"
      );
    }).length;
  }, [filteredTransactions, currentYearNum, currentMonthNum]);

  // KPI Breakdown
  const totalPrintersCount = filteredPrinters.length;
  const activePrintersCount = filteredPrinters.filter((p) => p.status === "active").length;
  const brokenPrintersCount = filteredPrinters.filter((p) => p.status === "broken").length;
  const repairingPrintersCount = filteredPrinters.filter((p) => p.status === "repairing").length;
  const inactivePrintersCount = filteredPrinters.filter((p) => p.status === "inactive").length;
  const totalDepartmentsCount =
    selectedDeptId === "all"
      ? departments.length
      : selectedDeptId === "faculty"
      ? departments.filter((d) => d.type === "faculty").length
      : selectedDeptId === "office"
      ? departments.filter((d) => d.type === "office").length
      : 1;

  // Smart Alerts
  const highRefillThreshold = settings?.alertHighRefillThreshold || 3;
  const longRepairDays = settings?.alertLongRepairDays || 7;

  const smartAlerts = useMemo(() => {
    const alerts: Array<{ id: string; type: "danger" | "warning" | "info"; message: string; link?: string }> = [];

    // 1. Máy nạp mực nhiều đột biến trong tháng
    const monthlyRefillCountByPrinter: Record<string, { code: string; count: number }> = {};
    transactions.forEach((tx) => {
      const d = new Date(tx.transactionDate);
      if (d.getFullYear() === currentYearNum && d.getMonth() + 1 === currentMonthNum) {
        if (!monthlyRefillCountByPrinter[tx.printerId]) {
          monthlyRefillCountByPrinter[tx.printerId] = { code: tx.printerCodeSnapshot, count: 0 };
        }
        monthlyRefillCountByPrinter[tx.printerId].count += 1;
      }
    });

    Object.values(monthlyRefillCountByPrinter).forEach((item) => {
      if (item.count >= highRefillThreshold) {
        alerts.push({
          id: `alert-refill-${item.code}`,
          type: "warning",
          message: `${item.code} đã nạp mực ${item.count} lần trong tháng này (nhiều hơn bình thường)`,
          link: `/printers`,
        });
      }
    });

    // 2. Máy đang sửa chữa quá lâu
    repairs
      .filter((r) => r.status === "repairing" || r.status === "checking")
      .forEach((rep) => {
        const repDate = new Date(rep.reportedDate);
        const daysDiff = Math.floor((Date.now() - repDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff >= longRepairDays) {
          alerts.push({
            id: `alert-repair-${rep.id}`,
            type: "danger",
            message: `${rep.printerCodeSnapshot} đang sửa chữa ${daysDiff} ngày chưa hoàn tất (${rep.problem})`,
            link: `/repairs/${rep.id}`,
          });
        }
      });

    // 3. Máy đang hỏng cần chú ý
    printers
      .filter((p) => p.status === "broken")
      .forEach((p) => {
        alerts.push({
          id: `alert-broken-${p.id}`,
          type: "danger",
          message: `${p.code} (${p.model}) đang báo hỏng tại ${p.location}`,
          link: `/printers/${p.id}`,
        });
      });

    return alerts.slice(0, 5);
  }, [transactions, repairs, printers, currentYearNum, currentMonthNum, highRefillThreshold, longRepairDays]);

  const attentionPrintersCount = smartAlerts.length;

  // Chart 1: Số máy theo Khoa/Phòng
  const chartPrintersByDept = useMemo(() => {
    return departments.map((dept) => {
      const count = printers.filter((p) => p.departmentId === dept.id).length;
      return {
        name: dept.code,
        fullName: dept.name,
        count,
      };
    }).filter((d) => d.count > 0).sort((a, b) => b.count - a.count);
  }, [departments, printers]);

  // Chart 2: Lịch sử nạp mực theo 12 tháng
  const chartRefillsByMonth = useMemo(() => {
    const monthsData = Array.from({ length: 12 }, (_, i) => ({
      month: `T${i + 1}`,
      refill: 0,
      replace: 0,
    }));

    filteredTransactions.forEach((tx) => {
      const d = new Date(tx.transactionDate);
      const m = d.getMonth();
      if (m >= 0 && m < 12) {
        if (tx.transactionType === "refill") monthsData[m].refill += 1;
        else if (tx.transactionType === "replace") monthsData[m].replace += 1;
      }
    });

    return monthsData;
  }, [filteredTransactions]);

  // Chart 3: Nạp mực theo Khoa/Phòng
  const chartRefillsByDept = useMemo(() => {
    const deptRefillMap: Record<string, { code: string; count: number }> = {};
    departments.forEach((d) => {
      deptRefillMap[d.id] = { code: d.code, count: 0 };
    });

    filteredTransactions.forEach((tx) => {
      if (deptRefillMap[tx.departmentId]) {
        deptRefillMap[tx.departmentId].count += 1;
      }
    });

    return Object.values(deptRefillMap)
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [departments, filteredTransactions]);

  // Chart 4: Tình trạng máy (Donut Chart)
  const chartStatusData = useMemo(() => {
    const statusCounts = {
      active: 0,
      broken: 0,
      repairing: 0,
      inactive: 0,
      disposed: 0,
    };

    filteredPrinters.forEach((p) => {
      if (statusCounts[p.status] !== undefined) {
        statusCounts[p.status] += 1;
      }
    });

    return [
      { name: "Hoạt động", value: statusCounts.active, color: "#10b981" },
      { name: "Hỏng", value: statusCounts.broken, color: "#f43f5e" },
      { name: "Đang sửa", value: statusCounts.repairing, color: "#f59e0b" },
      { name: "Tạm ngưng", value: statusCounts.inactive, color: "#64748b" },
      { name: "Thanh lý", value: statusCounts.disposed, color: "#94a3b8" },
    ].filter((item) => item.value > 0);
  }, [filteredPrinters]);

  // Chart 5: Top loại mực sử dụng nhiều nhất
  const chartTopToners = useMemo(() => {
    const tonerCountMap: Record<string, { code: string; count: number }> = {};
    filteredTransactions.forEach((tx) => {
      const code = tx.tonerCodeSnapshot || "Khác";
      if (!tonerCountMap[code]) {
        tonerCountMap[code] = { code, count: 0 };
      }
      tonerCountMap[code].count += tx.quantity || 1;
    });

    return Object.values(tonerCountMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [filteredTransactions]);

  // Thống kê các loại mực gắn vào từng máy theo số lượng tổng máy in
  const tonerPrinterDistribution = useMemo(() => {
    const map: Record<
      string,
      {
        toner: TonerType;
        printers: IPrinter[];
        count: number;
        percentage: number;
      }
    > = {};

    toners.forEach((t) => {
      map[t.id] = {
        toner: t,
        printers: [],
        count: 0,
        percentage: 0,
      };
    });

    const unassignedPrinters: IPrinter[] = [];

    filteredPrinters.forEach((p) => {
      if (p.tonerTypeId && map[p.tonerTypeId]) {
        map[p.tonerTypeId].printers.push(p);
        map[p.tonerTypeId].count += 1;
      } else {
        unassignedPrinters.push(p);
      }
    });

    const total = filteredPrinters.length;

    const list = Object.values(map)
      .map((item) => ({
        ...item,
        percentage: total > 0 ? Math.round((item.count / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    if (unassignedPrinters.length > 0) {
      list.push({
        toner: {
          id: "unassigned",
          code: "Chưa gán mực",
          name: "Chưa cấu hình loại hộp mực",
          color: "black",
          compatibleModels: [],
        } as unknown as TonerType,
        printers: unassignedPrinters,
        count: unassignedPrinters.length,
        percentage: total > 0 ? Math.round((unassignedPrinters.length / total) * 100) : 0,
      });
    }

    return list;
  }, [toners, filteredPrinters]);

  // Dữ liệu biểu đồ phân bổ máy in theo loại mực
  const chartTonerPrinters = useMemo(() => {
    return tonerPrinterDistribution
      .filter((item) => item.count > 0)
      .map((item) => ({
        code: item.toner.code,
        name: item.toner.name,
        count: item.count,
        percentage: item.percentage,
      }));
  }, [tonerPrinterDistribution]);

  // Hoạt động gần đây (Recent 10 activities)
  const recentActivities = useMemo(() => {
    const items: Array<{
      id: string;
      date: string;
      code: string;
      type: string;
      desc: string;
      badgeColor: string;
    }> = [];

    transactions.slice(0, 7).forEach((t) => {
      items.push({
        id: t.id,
        date: t.transactionDate,
        code: t.printerCodeSnapshot,
        type: t.transactionType === "refill" ? "Nạp mực" : t.transactionType === "replace" ? "Thay hộp mực" : "Thay Drum",
        desc: `${t.tonerCodeSnapshot} tại ${t.departmentNameSnapshot}`,
        badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
      });
    });

    repairs.slice(0, 5).forEach((r) => {
      items.push({
        id: r.id,
        date: r.reportedDate,
        code: r.printerCodeSnapshot,
        type: r.status === "completed" ? "Sửa xong" : "Báo hỏng",
        desc: `${r.problem} (${r.departmentNameSnapshot})`,
        badgeColor: r.status === "completed" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200",
      });
    });

    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);
  }, [transactions, repairs]);

  return (
    <div className="space-y-6">
      {/* Top Header & Fast Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Tổng quan Hệ thống Máy in
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Báo cáo thống kê tình trạng hoạt động và nạp mực toàn trường thời gian thực
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/toner-transactions/new"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-500/20 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            + Ghi nhận nạp mực
          </Link>
          <Link
            href="/repairs/new"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm transition-all"
          >
            <Wrench className="w-4 h-4 text-amber-600" />
            Báo hỏng / Sửa chữa
          </Link>
        </div>
      </div>

      {/* Mobile App Quick Action Dock (4 1-touch buttons for smartphone technicians) */}
      <div className="grid grid-cols-4 gap-2.5 sm:hidden">
        <Link
          href="/toner-transactions/new"
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 active:scale-90 transition-all text-center"
        >
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mb-1.5">
            <RefreshCw className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-bold leading-tight">Nạp mực</span>
        </Link>
        <Link
          href="/repairs/new"
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-md shadow-rose-500/20 active:scale-90 transition-all text-center"
        >
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mb-1.5">
            <Wrench className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-bold leading-tight">Báo hỏng</span>
        </Link>
        <Link
          href="/printers/new"
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 text-white shadow-md shadow-purple-500/20 active:scale-90 transition-all text-center"
        >
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mb-1.5">
            <Printer className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-bold leading-tight">Thêm máy</span>
        </Link>
        <Link
          href="/departments"
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20 active:scale-90 transition-all text-center"
        >
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mb-1.5">
            <Building2 className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-bold leading-tight">Khoa/Phòng</span>
        </Link>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5 text-blue-600" /> Bộ lọc Dashboard
          </div>
          <button
            onClick={() => {
              setSelectedDeptId("all");
              setSelectedYear("2026");
              setSelectedMonth("all");
              setSelectedQuarter("all");
            }}
            className="text-[11px] text-blue-600 hover:underline font-medium"
          >
            Đặt lại bộ lọc
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Dept Filter */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">
              Đơn vị / Khoa / Phòng
            </label>
            <select
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">Toàn trường (Tất cả)</option>
              <option value="faculty">Chỉ tất cả các Khoa</option>
              <option value="office">Chỉ tất cả các Phòng/Ban</option>
              <optgroup label="Chọn cụ thể">
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.code} - {d.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Year Filter */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Năm</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">Tất cả các năm</option>
              <option value="2026">Năm 2026</option>
              <option value="2025">Năm 2025</option>
              <option value="2024">Năm 2024</option>
            </select>
          </div>

          {/* Quarter Filter */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Quý</label>
            <select
              value={selectedQuarter}
              onChange={(e) => {
                setSelectedQuarter(e.target.value);
                if (e.target.value !== "all") setSelectedMonth("all");
              }}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">Tất cả các quý</option>
              <option value="1">Quý 1 (Tháng 1 - 3)</option>
              <option value="2">Quý 2 (Tháng 4 - 6)</option>
              <option value="3">Quý 3 (Tháng 7 - 9)</option>
              <option value="4">Quý 4 (Tháng 10 - 12)</option>
            </select>
          </div>

          {/* Month Filter */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Tháng</label>
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                if (e.target.value !== "all") setSelectedQuarter("all");
              }}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">Tất cả các tháng</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={String(i + 1)}>
                  Tháng {i + 1}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 10 KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Card 1: Tổng máy in */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Tổng máy in</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Printer className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{totalPrintersCount}</p>
          <span className="text-[11px] text-slate-400">thiết bị trong trường</span>
        </div>

        {/* Card 2: Đang hoạt động */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Đang hoạt động</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-2">{activePrintersCount}</p>
          <span className="text-[11px] text-emerald-700 font-medium">
            {totalPrintersCount > 0 ? Math.round((activePrintersCount / totalPrintersCount) * 100) : 0}% sẵn sàng
          </span>
        </div>

        {/* Card 3: Đang hỏng */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Đang hỏng</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-rose-600 mt-2">{brokenPrintersCount}</p>
          <span className="text-[11px] text-rose-700 font-medium">Cần xử lý gấp</span>
        </div>

        {/* Card 4: Đang sửa chữa */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Đang sửa chữa</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-600 mt-2">{repairingPrintersCount}</p>
          <span className="text-[11px] text-amber-700 font-medium">Đang bảo trì/thay thế</span>
        </div>

        {/* Card 5: Tạm ngưng */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Tạm ngưng</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
              <PauseCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-700 mt-2">{inactivePrintersCount}</p>
          <span className="text-[11px] text-slate-500">Nghỉ hè / Chờ kiểm tra</span>
        </div>

        {/* Card 6: Tổng Khoa/Phòng */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Tổng Khoa/Phòng</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-indigo-600 mt-2">{totalDepartmentsCount}</p>
          <span className="text-[11px] text-indigo-700 font-medium">đơn vị trực thuộc</span>
        </div>

        {/* Card 7: Nạp mực tháng này */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Nạp mực tháng này</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <RefreshCw className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-blue-600 mt-2">{refillsThisMonth}</p>
          <span className="text-[11px] text-slate-400">lần nạp trong T{currentMonthNum}</span>
        </div>

        {/* Card 8: Nạp mực năm nay */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Nạp mực năm nay</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-purple-600 mt-2">{refillsThisYear}</p>
          <span className="text-[11px] text-slate-400">tổng lượt năm {currentYearNum}</span>
        </div>

        {/* Card 9: Thay hộp mực tháng này */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Thay hộp mực tháng này</span>
            <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-violet-600 mt-2">{replacementsThisMonth}</p>
          <span className="text-[11px] text-slate-400">hộp mực mới cấp phát</span>
        </div>

        {/* Card 10: Máy cần chú ý */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Máy cần chú ý</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-rose-600 mt-2">{attentionPrintersCount}</p>
          <span className="text-[11px] text-rose-700 font-medium">Hỏng / Sửa lâu / Nạp nhiều</span>
        </div>
      </div>

      {/* Smart Alerts Section */}
      {smartAlerts.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-amber-900 font-bold text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            CẢNH BÁO THÔNG MINH CẦN CHÚ Ý
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {smartAlerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between gap-3 p-2.5 bg-white/90 rounded-xl border border-amber-200/60 text-xs text-slate-800"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      alert.type === "danger" ? "bg-rose-500" : "bg-amber-500"
                    }`}
                  />
                  <span>{alert.message}</span>
                </div>
                {alert.link && (
                  <Link
                    href={alert.link}
                    className="text-blue-600 hover:text-blue-700 font-semibold flex-shrink-0 flex items-center gap-1"
                  >
                    Xem <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 2: Lịch sử nạp mực theo tháng (Line Chart) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Lịch sử Nạp mực theo Tháng</h3>
              <p className="text-xs text-slate-400">Số lần nạp mực và thay cartridge qua 12 tháng</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg">
              Năm {selectedYear === "all" ? "Tổng hợp" : selectedYear}
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartRefillsByMonth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#64748b" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "none",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Line
                  type="monotone"
                  dataKey="refill"
                  name="Nạp mực"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "#2563eb" }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="replace"
                  name="Thay hộp mực"
                  stroke="#9333ea"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#9333ea" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 1: Số máy theo Khoa/Phòng (Bar Chart) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Số lượng Máy in theo Khoa / Phòng</h3>
              <p className="text-xs text-slate-400">Phân bố thiết bị in tại các đơn vị</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartPrintersByDept} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                <Tooltip
                  formatter={(value: any, name: any, item: any) => [`${value} máy`, item.payload.fullName]}
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "none",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" name="Số máy in" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Nạp mực theo Khoa/Phòng */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Số lần Nạp mực theo Đơn vị</h3>
              <p className="text-xs text-slate-400">Đơn vị có tần suất nạp mực nhiều nhất</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartRefillsByDept} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                <YAxis type="category" dataKey="code" tick={{ fontSize: 11, fill: "#64748b" }} />
                <Tooltip
                  formatter={(value: any) => [`${value} lần`, "Nạp mực"]}
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "none",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4 & 5: Tình trạng máy (Donut) & Top Loại mực */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Donut Chart: Tình trạng máy */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Tình trạng máy in</h3>
              <p className="text-xs text-slate-400">Tỉ lệ trạng thái thiết bị</p>
            </div>
            <div className="h-44 w-full my-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-1 text-[11px]">
              {chartStatusData.map((item) => (
                <div key={item.name} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600">{item.name}:</span>
                  <span className="font-bold text-slate-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Chart 5: Top loại mực */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Mực sử dụng nhiều</h3>
              <p className="text-xs text-slate-400">Top mã mực tiêu thụ cao nhất</p>
            </div>
            <div className="space-y-2.5 my-2">
              {chartTopToners.map((t, idx) => (
                <div key={t.code} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-800">
                      {idx + 1}. {t.code}
                    </span>
                    <span className="text-blue-600">{t.count} lần</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${Math.min(100, (t.count / (chartTopToners[0]?.count || 1)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <Link
              href="/toners"
              className="text-center text-xs font-semibold text-blue-600 hover:underline pt-2 border-t border-slate-100"
            >
              Xem danh mục loại mực &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* PHÂN BỔ CÁC LOẠI MỰC GẮN VÀO TỪNG MÁY THEO SỐ LƯỢNG TỔNG MÁY IN */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                <Droplet className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                CÁC LOẠI MỰC GẮN VÀO TỪNG MÁY THEO SỐ LƯỢNG MÁY IN
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Thống kê chi tiết từng loại hộp mực / cartridge đang được sử dụng bởi bao nhiêu máy in trong trường
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
              {tonerPrinterDistribution.filter((t) => t.count > 0).length} loại mực đang dùng
            </span>
            <Link
              href="/toners"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
            >
              Xem danh mục <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Biểu đồ thanh ngang so sánh số máy in theo từng loại mực */}
        {chartTonerPrinters.length > 0 && (
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Biểu đồ phân bố số máy in theo từng mã mực
              </h3>
              <span className="text-[11px] text-slate-400">
                Tổng cộng {filteredPrinters.length} máy in
              </span>
            </div>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartTonerPrinters} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="code" tick={{ fontSize: 11, fill: "#475569" }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#475569" }} />
                  <Tooltip
                    formatter={(val: any, _name: any, item: any) => [
                      `${val} máy in (${item.payload.percentage}%)`,
                      item.payload.name || item.payload.code,
                    ]}
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "none",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="count" name="Số máy in" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Lưới các thẻ chi tiết từng loại mực */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tonerPrinterDistribution.map((item) => (
            <div
              key={item.toner.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                item.count > 0
                  ? "bg-white border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md"
                  : "bg-slate-50/60 border-slate-200/60 opacity-60"
              }`}
            >
              <div>
                {/* Header: Mã mực & Số máy */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      {item.toner.code}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm mt-1.5 line-clamp-1">
                      {item.toner.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">{item.toner.brand}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xl font-black text-blue-600 block leading-tight">
                      {item.count} <span className="text-xs font-semibold text-slate-500">máy</span>
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">
                      {item.percentage}% tổng máy
                    </span>
                  </div>
                </div>

                {/* Progress Bar tỉ lệ */}
                <div className="mt-3">
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>

                {/* Dòng máy tương thích */}
                {item.toner.compatibleModels && item.toner.compatibleModels.length > 0 && (
                  <div className="mt-2 text-[11px] text-slate-500">
                    <span className="font-medium text-slate-600">Dòng máy: </span>
                    <span className="line-clamp-1">{item.toner.compatibleModels.join(", ")}</span>
                  </div>
                )}
              </div>

              {/* Danh sách máy in gắn loại mực này */}
              <div className="mt-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between text-[11px] mb-2">
                  <span className="font-bold text-slate-700">
                    Máy in đang gắn ({item.printers.length}):
                  </span>
                  {item.count > 0 && (
                    <Link
                      href={`/printers?toner=${item.toner.id}`}
                      className="text-blue-600 hover:text-blue-700 hover:underline font-semibold"
                    >
                      Xem tất cả &rarr;
                    </Link>
                  )}
                </div>

                {item.printers.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar pr-1">
                    {item.printers.map((p) => (
                      <Link
                        key={p.id}
                        href={`/printers/${p.id}`}
                        title={`${p.name} (${p.brand} ${p.model} - ${p.location})`}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-700 transition-colors"
                      >
                        <Printer className="w-3 h-3 text-slate-500" />
                        {p.code}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">Chưa có máy in nào gắn loại mực này</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RECENT ACTIVITIES TABLE (10 GẦN NHẤT) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">HOẠT ĐỘNG GẦN ĐÂY</h3>
            <p className="text-xs text-slate-500">10 hoạt động nạp mực, sửa chữa và bảo trì mới nhất</p>
          </div>
          <Link
            href="/toner-transactions"
            className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
          >
            Xem tất cả <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {recentActivities.map((act) => (
            <div
              key={act.id}
              className="px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/70 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex-shrink-0 text-xs font-semibold">
                  <Clock className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">{act.code}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${act.badgeColor}`}
                    >
                      {act.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{act.desc}</p>
                </div>
              </div>
              <span className="text-xs text-slate-400 sm:text-right font-medium">
                {formatDateTime(act.date)}
              </span>
            </div>
          ))}

          {recentActivities.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-400">
              Chưa có hoạt động nào được ghi nhận.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
