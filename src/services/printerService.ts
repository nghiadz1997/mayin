import { Printer, PrinterTransfer, PrinterStatus } from "../types";
import {
  COLLECTIONS,
  getAllDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
} from "./dataStore";
import { auditService } from "./auditService";
import { generateId } from "../lib/utils";

export const printerService = {
  async getAll(): Promise<Printer[]> {
    return getAllDocuments<Printer>(COLLECTIONS.PRINTERS);
  },

  async getById(id: string): Promise<Printer | null> {
    return getDocumentById<Printer>(COLLECTIONS.PRINTERS, id);
  },

  async getByCode(code: string): Promise<Printer | null> {
    const printers = await this.getAll();
    return printers.find((p) => p.code.toLowerCase() === code.toLowerCase()) || null;
  },

  async create(printer: Printer, userEmail?: string): Promise<Printer> {
    const created = await createDocument<Printer>(COLLECTIONS.PRINTERS, printer);
    await auditService.log({
      action: "CREATE_PRINTER",
      resource: "PRINTER",
      resourceId: printer.code,
      details: `Thêm máy in mới: ${printer.name} (${printer.model})`,
      userEmail,
    });
    return created;
  },

  async update(id: string, partial: Partial<Printer>, userEmail?: string): Promise<void> {
    await updateDocument<Printer>(COLLECTIONS.PRINTERS, id, partial);
    await auditService.log({
      action: "UPDATE_PRINTER",
      resource: "PRINTER",
      resourceId: id,
      details: `Cập nhật thông tin máy in ID: ${id}`,
      userEmail,
    });
  },

  async changeStatus(id: string, newStatus: PrinterStatus, userEmail?: string): Promise<void> {
    await updateDocument<Printer>(COLLECTIONS.PRINTERS, id, { status: newStatus });
    await auditService.log({
      action: "CHANGE_STATUS",
      resource: "PRINTER",
      resourceId: id,
      details: `Thay đổi trạng thái máy in ID ${id} sang: ${newStatus}`,
      userEmail,
    });
  },

  async transfer(transferData: Omit<PrinterTransfer, "id" | "createdAt">, userEmail?: string): Promise<PrinterTransfer> {
    const transfer: PrinterTransfer = {
      ...transferData,
      id: "trf-" + generateId(),
      createdAt: new Date().toISOString(),
    };

    // 1. Lưu bản ghi transfer
    await createDocument<PrinterTransfer>(COLLECTIONS.PRINTER_TRANSFERS, transfer);

    // 2. Cập nhật Khoa/Phòng và vị trí mới cho máy in
    await updateDocument<Printer>(COLLECTIONS.PRINTERS, transfer.printerId, {
      departmentId: transfer.toDepartmentId,
      location: transfer.newLocation,
    });

    // 3. Ghi audit log
    await auditService.log({
      action: "TRANSFER_PRINTER",
      resource: "PRINTER",
      resourceId: transfer.printerCodeSnapshot,
      details: `Điều chuyển máy ${transfer.printerCodeSnapshot} từ [${transfer.fromDepartmentNameSnapshot}] sang [${transfer.toDepartmentNameSnapshot}]`,
      userEmail,
    });

    return transfer;
  },

  async getTransfersByPrinterId(printerId: string): Promise<PrinterTransfer[]> {
    const allTransfers = await getAllDocuments<PrinterTransfer>(COLLECTIONS.PRINTER_TRANSFERS);
    return allTransfers
      .filter((t) => t.printerId === printerId)
      .sort((a, b) => new Date(b.transferDate).getTime() - new Date(a.transferDate).getTime());
  },

  async getAllTransfers(): Promise<PrinterTransfer[]> {
    const allTransfers = await getAllDocuments<PrinterTransfer>(COLLECTIONS.PRINTER_TRANSFERS);
    return allTransfers.sort((a, b) => new Date(b.transferDate).getTime() - new Date(a.transferDate).getTime());
  },

  async delete(id: string, userEmail?: string): Promise<void> {
    await deleteDocument(COLLECTIONS.PRINTERS, id);
    await auditService.log({
      action: "DELETE_PRINTER",
      resource: "PRINTER",
      resourceId: id,
      details: `Xóa máy in ID: ${id}`,
      userEmail,
    });
  },
};
