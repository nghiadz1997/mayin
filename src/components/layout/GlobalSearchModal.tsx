"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, X, Printer, Droplet, Building2, ChevronRight } from "lucide-react";
import { printerService } from "../../services/printerService";
import { tonerService } from "../../services/tonerService";
import { departmentService } from "../../services/departmentService";
import { Printer as IPrinter, TonerType, Department } from "../../types";
import Link from "next/link";
import { useRouter } from "next/navigation";

export const GlobalSearchModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [printers, setPrinters] = useState<IPrinter[]>([]);
  const [toners, setToners] = useState<TonerType[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    if (isOpen) {
      Promise.all([printerService.getAll(), tonerService.getAll(), departmentService.getAll()]).then(
        ([p, t, d]) => {
          setPrinters(p);
          setToners(t);
          setDepartments(d);
        }
      );
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [isOpen]);

  // Keyboard shortcut Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open
          const evt = new CustomEvent("open-global-search");
          window.dispatchEvent(evt);
        }
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  const filteredPrinters = query
    ? printers.filter(
        (p) =>
          p.code.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q) ||
          p.model.toLowerCase().includes(q) ||
          p.serialNumber.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q)
      )
    : [];

  const filteredToners = query
    ? toners.filter(
        (t) =>
          t.code.toLowerCase().includes(q) ||
          t.name.toLowerCase().includes(q) ||
          t.brand.toLowerCase().includes(q) ||
          t.compatibleModels.some((m) => m.toLowerCase().includes(q))
      )
    : [];

  const filteredDepartments = query
    ? departments.filter(
        (d) => d.code.toLowerCase().includes(q) || d.name.toLowerCase().includes(q)
      )
    : [];

  const totalResults = filteredPrinters.length + filteredToners.length + filteredDepartments.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-slate-100 gap-3">
          <Search className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo mã máy (PRN-...), Model (2321D), Mực (TN-2385), Khoa/Phòng..."
            className="w-full text-sm text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-500 hover:bg-slate-200"
          >
            ESC
          </button>
        </div>

        {/* Search Results */}
        <div className="overflow-y-auto p-4 space-y-6 divide-y divide-slate-100">
          {!query && (
            <div className="py-8 text-center text-slate-400 text-sm">
              <Search className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="font-medium text-slate-600">Tìm kiếm nhanh trên toàn hệ thống</p>
              <p className="text-xs text-slate-400 mt-1">
                Gõ từ khóa để tra cứu Máy in, Hộp mực hoặc Khoa/Phòng
              </p>
            </div>
          )}

          {query && totalResults === 0 && (
            <div className="py-8 text-center text-slate-400 text-sm">
              <p className="text-slate-600 font-medium">Không tìm thấy kết quả phù hợp với &quot;{query}&quot;</p>
              <p className="text-xs text-slate-400 mt-1">Vui lòng kiểm tra lại chính tả hoặc mã máy</p>
            </div>
          )}

          {/* Section: Máy in */}
          {filteredPrinters.length > 0 && (
            <div className="pt-3 first:pt-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
                  <Printer className="w-4 h-4" /> Máy in ({filteredPrinters.length})
                </span>
              </div>
              <div className="space-y-1">
                {filteredPrinters.slice(0, 6).map((printer) => (
                  <Link
                    key={printer.id}
                    href={`/printers/${printer.id}`}
                    onClick={onClose}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-blue-50/60 transition-colors group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900 group-hover:text-blue-600">
                          {printer.code}
                        </span>
                        <span className="text-xs text-slate-500">
                          {printer.brand} {printer.model}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{printer.location}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Section: Mực máy in */}
          {filteredToners.length > 0 && (
            <div className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-purple-700 flex items-center gap-1.5">
                  <Droplet className="w-4 h-4" /> Loại Mực ({filteredToners.length})
                </span>
              </div>
              <div className="space-y-1">
                {filteredToners.slice(0, 5).map((toner) => (
                  <Link
                    key={toner.id}
                    href={`/toners`}
                    onClick={onClose}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-purple-50/60 transition-colors group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900 group-hover:text-purple-600">
                          {toner.code}
                        </span>
                        <span className="text-xs text-slate-500">{toner.name}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Tương thích: {toner.compatibleModels.join(", ")}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-purple-500 transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Section: Khoa / Phòng */}
          {filteredDepartments.length > 0 && (
            <div className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4" /> Khoa / Phòng ({filteredDepartments.length})
                </span>
              </div>
              <div className="space-y-1">
                {filteredDepartments.slice(0, 5).map((dept) => (
                  <Link
                    key={dept.id}
                    href={`/departments/${dept.id}`}
                    onClick={onClose}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-emerald-50/60 transition-colors group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900 group-hover:text-emerald-600">
                          {dept.code}
                        </span>
                        <span className="text-xs text-slate-500">{dept.name}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {dept.type === "faculty" ? "Khoa đào tạo" : "Phòng ban chức năng"}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
