import { Department } from "../types";
import {
  COLLECTIONS,
  getAllDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
} from "./dataStore";
import { auditService } from "./auditService";

export const departmentService = {
  async getAll(): Promise<Department[]> {
    return getAllDocuments<Department>(COLLECTIONS.DEPARTMENTS);
  },

  async getById(id: string): Promise<Department | null> {
    return getDocumentById<Department>(COLLECTIONS.DEPARTMENTS, id);
  },

  async create(dept: Department, userEmail?: string): Promise<Department> {
    const created = await createDocument<Department>(COLLECTIONS.DEPARTMENTS, dept);
    await auditService.log({
      action: "CREATE_DEPARTMENT",
      resource: "DEPARTMENT",
      resourceId: dept.code,
      details: `Tạo mới Khoa/Phòng: ${dept.name} (${dept.code})`,
      userEmail,
    });
    return created;
  },

  async update(id: string, partial: Partial<Department>, userEmail?: string): Promise<void> {
    await updateDocument<Department>(COLLECTIONS.DEPARTMENTS, id, partial);
    await auditService.log({
      action: "UPDATE_DEPARTMENT",
      resource: "DEPARTMENT",
      resourceId: id,
      details: `Cập nhật thông tin Khoa/Phòng ID: ${id}`,
      userEmail,
    });
  },

  async toggleStatus(id: string, currentStatus: "active" | "inactive", userEmail?: string): Promise<void> {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    await updateDocument<Department>(COLLECTIONS.DEPARTMENTS, id, { status: newStatus });
    await auditService.log({
      action: "UPDATE_DEPARTMENT",
      resource: "DEPARTMENT",
      resourceId: id,
      details: `Đổi trạng thái Khoa/Phòng ID ${id} sang ${newStatus}`,
      userEmail,
    });
  },

  // Soft delete / hide
  async softDelete(id: string, userEmail?: string): Promise<void> {
    await updateDocument<Department>(COLLECTIONS.DEPARTMENTS, id, { status: "inactive" });
    await auditService.log({
      action: "UPDATE_DEPARTMENT",
      resource: "DEPARTMENT",
      resourceId: id,
      details: `Ẩn Khoa/Phòng ID: ${id}`,
      userEmail,
    });
  },
};
