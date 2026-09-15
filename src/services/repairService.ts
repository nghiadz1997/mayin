import { Repair, RepairStatus } from "../types";
import {
  COLLECTIONS,
  getAllDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
} from "./dataStore";
import { printerService } from "./printerService";
import { auditService } from "./auditService";

export const repairService = {
  async getAll(): Promise<Repair[]> {
    const list = await getAllDocuments<Repair>(COLLECTIONS.REPAIRS);
    return list.sort((a, b) => new Date(b.reportedDate).getTime() - new Date(a.reportedDate).getTime());
  },

  async getById(id: string): Promise<Repair | null> {
    return getDocumentById<Repair>(COLLECTIONS.REPAIRS, id);
  },

  async getByPrinterId(printerId: string): Promise<Repair[]> {
    const list = await this.getAll();
    return list.filter((r) => r.printerId === printerId);
  },

  async create(repair: Repair, userEmail?: string): Promise<Repair> {
    const created = await createDocument<Repair>(COLLECTIONS.REPAIRS, repair);

    // Tự động cập nhật trạng thái máy sang hỏng hoặc đang sửa chữa
    if (repair.printerId) {
      if (repair.status === "repairing") {
        await printerService.changeStatus(repair.printerId, "repairing", userEmail);
      } else if (repair.status === "pending" || repair.status === "checking") {
        await printerService.changeStatus(repair.printerId, "broken", userEmail);
      }
    }

    await auditService.log({
      action: "CREATE_REPAIR",
      resource: "REPAIR",
      resourceId: repair.printerCodeSnapshot,
      details: `Báo hỏng/sửa chữa máy ${repair.printerCodeSnapshot}: ${repair.problem}`,
      userEmail,
    });
    return created;
  },

  async update(id: string, partial: Partial<Repair>, userEmail?: string, restorePrinterActive: boolean = false): Promise<void> {
    await updateDocument<Repair>(COLLECTIONS.REPAIRS, id, partial);

    // Nếu chuyển sang repairing -> máy thành repairing
    if (partial.printerId) {
      if (partial.status === "repairing") {
        await printerService.changeStatus(partial.printerId, "repairing", userEmail);
      } else if (partial.status === "completed" && restorePrinterActive) {
        await printerService.changeStatus(partial.printerId, "active", userEmail);
      }
    }

    await auditService.log({
      action: partial.status === "completed" ? "COMPLETE_REPAIR" : "UPDATE_REPAIR",
      resource: "REPAIR",
      resourceId: id,
      details: `Cập nhật phiếu sửa chữa ID ${id} (Trạng thái: ${partial.status || "đã cập nhật"})`,
      userEmail,
    });
  },

  async delete(id: string, userEmail?: string): Promise<void> {
    await deleteDocument(COLLECTIONS.REPAIRS, id);
    await auditService.log({
      action: "UPDATE_REPAIR",
      resource: "REPAIR",
      resourceId: id,
      details: `Xóa phiếu sửa chữa ID: ${id}`,
      userEmail,
    });
  },
};
