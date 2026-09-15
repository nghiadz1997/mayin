import { TonerTransaction } from "../types";
import {
  COLLECTIONS,
  getAllDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
} from "./dataStore";
import { auditService } from "./auditService";

export const transactionService = {
  async getAll(): Promise<TonerTransaction[]> {
    const list = await getAllDocuments<TonerTransaction>(COLLECTIONS.TONER_TRANSACTIONS);
    return list.sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());
  },

  async getById(id: string): Promise<TonerTransaction | null> {
    return getDocumentById<TonerTransaction>(COLLECTIONS.TONER_TRANSACTIONS, id);
  },

  async getByPrinterId(printerId: string): Promise<TonerTransaction[]> {
    const list = await this.getAll();
    return list.filter((t) => t.printerId === printerId);
  },

  async getByDepartmentId(departmentId: string): Promise<TonerTransaction[]> {
    const list = await this.getAll();
    return list.filter((t) => t.departmentId === departmentId);
  },

  async create(tx: TonerTransaction, userEmail?: string): Promise<TonerTransaction> {
    const created = await createDocument<TonerTransaction>(COLLECTIONS.TONER_TRANSACTIONS, tx);
    await auditService.log({
      action: tx.transactionType === "refill" ? "REFILL_TONER" : "REPLACE_TONER",
      resource: "TONER_TRANSACTION",
      resourceId: tx.printerCodeSnapshot,
      details: `${tx.transactionType === "refill" ? "Nạp mực" : "Thay hộp mực"} ${tx.tonerCodeSnapshot} cho máy ${tx.printerCodeSnapshot} (${tx.departmentNameSnapshot})`,
      userEmail,
    });
    return created;
  },

  async update(id: string, partial: Partial<TonerTransaction>, userEmail?: string): Promise<void> {
    await updateDocument<TonerTransaction>(COLLECTIONS.TONER_TRANSACTIONS, id, partial);
    await auditService.log({
      action: "UPDATE_TONER",
      resource: "TONER_TRANSACTION",
      resourceId: id,
      details: `Cập nhật giao dịch mực ID: ${id}`,
      userEmail,
    });
  },

  async delete(id: string, userEmail?: string): Promise<void> {
    await deleteDocument(COLLECTIONS.TONER_TRANSACTIONS, id);
    await auditService.log({
      action: "UPDATE_TONER",
      resource: "TONER_TRANSACTION",
      resourceId: id,
      details: `Xóa giao dịch mực ID: ${id}`,
      userEmail,
    });
  },
};
