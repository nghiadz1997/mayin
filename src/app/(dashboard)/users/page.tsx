"use client";

import React, { useState, useEffect } from "react";
import { Users as UsersIcon, Plus, Shield, CheckCircle2, XCircle, Search, Edit } from "lucide-react";
import { userService } from "../../../services/userService";
import { departmentService } from "../../../services/departmentService";
import { AppUser, UserRole, Department } from "../../../types";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../components/ui/Toast";
import { generateId } from "../../../lib/utils";

export default function UsersPage() {
  const { canManageSystem } = useAuth();
  const toast = useToast();

  const [users, setUsers] = useState<AppUser[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  // New user form state
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<UserRole>("staff");
  const [departmentId, setDepartmentId] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [uList, dList] = await Promise.all([
        userService.getAll(),
        departmentService.getAll(),
      ]);
      setUsers(uList);
      setDepartments(dList);
    } finally {
      setLoading(false);
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !displayName.trim()) {
      toast.error("Vui lòng điền đầy đủ Email và Họ tên");
      return;
    }

    try {
      await userService.create({
        uid: "user-" + generateId(),
        email: email.trim().toLowerCase(),
        displayName: displayName.trim(),
        role,
        departmentId: departmentId || undefined,
        status: "active",
        createdAt: new Date().toISOString(),
      });

      toast.success("Thêm người dùng mới thành công!");
      setShowModal(false);
      setEmail("");
      setDisplayName("");
      loadData();
    } catch {
      toast.error("Không thể tạo người dùng mới");
    }
  };

  const handleToggleStatus = async (user: AppUser) => {
    const newStatus = user.status === "active" ? "inactive" : "active";
    try {
      await userService.update(user.uid, { status: newStatus });
      toast.success(`Đã cập nhật trạng thái người dùng ${user.displayName}`);
      loadData();
    } catch {
      toast.error("Không thể cập nhật người dùng");
    }
  };

  const roleBadges: Record<UserRole, { label: string; color: string; desc: string }> = {
    super_admin: {
      label: "Super Admin",
      color: "bg-blue-100 text-blue-800 border-blue-200",
      desc: "Toàn quyền quản trị hệ thống, người dùng, cài đặt",
    },
    admin: {
      label: "Admin",
      color: "bg-indigo-100 text-indigo-800 border-indigo-200",
      desc: "Quản lý máy in, nạp mực, sửa chữa, báo cáo",
    },
    staff: {
      label: "Nhân viên",
      color: "bg-emerald-100 text-emerald-800 border-emerald-200",
      desc: "Xem máy, ghi nhận nạp mực, tiếp nhận sửa lỗi",
    },
    viewer: {
      label: "Viewer",
      color: "bg-amber-100 text-amber-800 border-amber-200",
      desc: "Chỉ xem Dashboard, tra cứu máy và báo cáo",
    },
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <UsersIcon className="w-6 h-6 text-blue-600" />
            Quản Lý Người Dùng & Phân Quyền
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Thiết lập 4 cấp độ phân quyền (Super Admin, Admin, Nhân viên, Viewer)
          </p>
        </div>

        {canManageSystem && (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm shadow-blue-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            + Thêm người dùng mới
          </button>
        )}
      </div>

      {/* Role explanation cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {Object.entries(roleBadges).map(([key, info]) => (
          <div key={key} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span
              className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${info.color}`}
            >
              {info.label}
            </span>
            <p className="text-xs text-slate-500 pt-1 leading-relaxed">{info.desc}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-4">Họ và tên</th>
                <th className="py-3.5 px-4">Email công vụ</th>
                <th className="py-3.5 px-4">Khoa / Phòng</th>
                <th className="py-3.5 px-4">Vai trò (Role)</th>
                <th className="py-3.5 px-4 text-center">Trạng thái</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {users.map((u) => {
                const dept = departments.find((d) => d.id === u.departmentId);
                const roleInfo = roleBadges[u.role] || roleBadges.viewer;

                return (
                  <tr key={u.uid} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{u.displayName}</td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">{u.email}</td>
                    <td className="py-3.5 px-4 text-slate-600">{dept?.name || "Toàn trường"}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${roleInfo.color}`}
                      >
                        {roleInfo.label}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          u.status === "active"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {u.status === "active" ? "Kích hoạt" : "Khóa"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canManageSystem && (
                          <button
                            onClick={() => handleToggleStatus(u)}
                            className="p-1 rounded text-slate-400 hover:text-slate-700"
                            title="Đổi trạng thái"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add User */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Thêm Người Dùng & Phân Quyền</h3>
            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="canbo@truong.edu.vn"
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Họ và tên *</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Vai trò hệ thống *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                >
                  <option value="super_admin">Super Admin (Toàn quyền)</option>
                  <option value="admin">Admin (Máy in & Nạp mực)</option>
                  <option value="staff">Nhân viên (Ghi nhận nạp & sửa)</option>
                  <option value="viewer">Viewer (Chỉ xem báo cáo)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Khoa / Phòng trực thuộc</label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="">-- Toàn trường --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.code} - {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm"
                >
                  Lưu người dùng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
