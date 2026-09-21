import { TonerInventoryItem } from "../types";
import {
  COLLECTIONS,
  getAllDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
} from "./dataStore";
import { auditService } from "./auditService";

export const tonerInventoryService = {
  async getAll(): Promise<TonerInventoryItem[]> {
    return getAllDocuments<TonerInventoryItem>(COLLECTIONS.TONER_INVENTORY);
  },

  async getById(id: string): Promise<TonerInventoryItem | null> {
    return getDocumentById<TonerInventoryItem>(COLLECTIONS.TONER_INVENTORY, id);
  },

  async create(item: TonerInventoryItem, userEmail?: string): Promise<TonerInventoryItem> {
    const created = await createDocument<TonerInventoryItem>(COLLECTIONS.TONER_INVENTORY, item);
    await auditService.log({
      action: "IMPORT_TONER_INVENTORY",
      resource: "TONER_INVENTORY",
      resourceId: item.code,
      details: "Nhập kho mực: " + item.code + " (" + item.name + ") - Số lượng: " + item.quantity + " hộp tại " + item.storageLocation,
      userEmail,
    });
    return created;
  },

  async update(id: string, partial: Partial<TonerInventoryItem>, userEmail?: string): Promise<void> {
    await updateDocument<TonerInventoryItem>(COLLECTIONS.TONER_INVENTORY, id, partial);
    await auditService.log({
      action: "UPDATE_TONER_INVENTORY",
      resource: "TONER_INVENTORY",
      resourceId: id,
      details: "Cập nhật kho mực ID: " + id,
      userEmail,
    });
  },

  async delete(id: string, userEmail?: string): Promise<void> {
    await deleteDocument(COLLECTIONS.TONER_INVENTORY, id);
    await auditService.log({
      action: "DELETE_TONER_INVENTORY",
      resource: "TONER_INVENTORY",
      resourceId: id,
      details: "Xóa bản ghi kho mực ID: " + id,
      userEmail,
    });
  },

  async adjustQuantity(id: string, delta: number, userEmail?: string): Promise<number> {
    const current = await this.getById(id);
    if (!current) throw new Error("Không tìm thấy bản ghi kho mực");
    const newQty = Math.max(0, (current.quantity || 0) + delta);
    const newStatus = newQty === 0 ? "out_of_stock" : newQty <= 3 ? "low_stock" : "in_stock";
    await updateDocument<TonerInventoryItem>(COLLECTIONS.TONER_INVENTORY, id, {
      quantity: newQty,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    });
    await auditService.log({
      action: delta > 0 ? "IMPORT_TONER_ADD" : "EXPORT_TONER_USE",
      resource: "TONER_INVENTORY",
      resourceId: current.code,
      details: (delta > 0 ? "Nhập thêm " : "Xuất kho ") + Math.abs(delta) + " hộp " + current.code + ". Tồn kho mới: " + newQty + " hộp",
      userEmail,
    });
    return newQty;
  },
};
