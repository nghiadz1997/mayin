import { TonerType } from "../types";
import {
  COLLECTIONS,
  getAllDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
} from "./dataStore";
import { auditService } from "./auditService";

export const tonerService = {
  async getAll(): Promise<TonerType[]> {
    return getAllDocuments<TonerType>(COLLECTIONS.TONER_TYPES);
  },

  async getById(id: string): Promise<TonerType | null> {
    return getDocumentById<TonerType>(COLLECTIONS.TONER_TYPES, id);
  },

  async create(toner: TonerType, userEmail?: string): Promise<TonerType> {
    const created = await createDocument<TonerType>(COLLECTIONS.TONER_TYPES, toner);
    await auditService.log({
      action: "CREATE_TONER",
      resource: "TONER_TYPE",
      resourceId: toner.code,
      details: `Thêm loại mực mới: ${toner.name} (${toner.code})`,
      userEmail,
    });
    return created;
  },

  async update(id: string, partial: Partial<TonerType>, userEmail?: string): Promise<void> {
    await updateDocument<TonerType>(COLLECTIONS.TONER_TYPES, id, partial);
    await auditService.log({
      action: "UPDATE_TONER",
      resource: "TONER_TYPE",
      resourceId: id,
      details: `Cập nhật loại mực ID: ${id}`,
      userEmail,
    });
  },

  async delete(id: string, userEmail?: string): Promise<void> {
    await deleteDocument(COLLECTIONS.TONER_TYPES, id);
    await auditService.log({
      action: "DELETE_TONER",
      resource: "TONER_TYPE",
      resourceId: id,
      details: `Xóa loại mực ID: ${id}`,
      userEmail,
    });
  },

  async toggleStatus(id: string, currentStatus: "active" | "inactive", userEmail?: string): Promise<void> {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    await updateDocument<TonerType>(COLLECTIONS.TONER_TYPES, id, { status: newStatus });
    await auditService.log({
      action: "UPDATE_TONER",
      resource: "TONER_TYPE",
      resourceId: id,
      details: `Đổi trạng thái loại mực ID ${id} sang ${newStatus}`,
      userEmail,
    });
  },
};
