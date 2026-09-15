import { FaultReport } from "../types";
import {
  COLLECTIONS,
  getAllDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
} from "./dataStore";
import { repairService } from "./repairService";
import { auditService } from "./auditService";
import { generateId } from "../lib/utils";

export const faultReportService = {
  async getAll(): Promise<FaultReport[]> {
    const list = await getAllDocuments<FaultReport>(COLLECTIONS.FAULT_REPORTS);
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getById(id: string): Promise<FaultReport | null> {
    return getDocumentById<FaultReport>(COLLECTIONS.FAULT_REPORTS, id);
  },

  async create(report: FaultReport): Promise<FaultReport> {
    const created = await createDocument<FaultReport>(COLLECTIONS.FAULT_REPORTS, report);
    await auditService.log({
      action: "CREATE_FAULT_REPORT",
      resource: "FAULT_REPORT",
      resourceId: report.printerCodeSnapshot,
      details: `Tiếp nhận báo lỗi QR cho máy ${report.printerCodeSnapshot} từ ${report.reporterName}`,
    });
    return created;
  },

  async updateStatus(id: string, status: FaultReport["status"]): Promise<void> {
    await updateDocument<FaultReport>(COLLECTIONS.FAULT_REPORTS, id, { status });
  },

  async convertToRepair(reportId: string, assignedTo: string, userEmail?: string): Promise<void> {
    const report = await this.getById(reportId);
    if (!report) throw new Error("Không tìm thấy báo cáo lỗi");

    await repairService.create(
      {
        id: "rep-" + generateId(),
        printerId: report.printerId,
        printerCodeSnapshot: report.printerCodeSnapshot,
        departmentId: report.departmentId,
        departmentNameSnapshot: report.departmentNameSnapshot,
        reportedDate: new Date().toISOString(),
        problem: report.problem,
        description: `Chuyển tiếp từ báo hỏng QR của ${report.reporterName} (SĐT: ${report.reporterPhone || "N/A"}): ${report.description || ""}`,
        reportedBy: report.reporterName,
        assignedTo,
        status: "checking",
        imageUrls: report.imageUrl ? [report.imageUrl] : [],
        createdBy: userEmail || "Quản trị viên",
        createdAt: new Date().toISOString(),
      },
      userEmail
    );

    await this.updateStatus(reportId, "converted_to_repair");
  },
};
