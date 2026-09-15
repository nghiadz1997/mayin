import { AuditLog, AuditAction } from "../types";
import { COLLECTIONS, getAllDocuments, createDocument } from "./dataStore";
import { generateId } from "../lib/utils";

export const auditService = {
  async getAll(): Promise<AuditLog[]> {
    const logs = await getAllDocuments<AuditLog>(COLLECTIONS.AUDIT_LOGS);
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  async log(params: {
    action: AuditAction;
    resource: string;
    resourceId: string;
    details: string;
    userId?: string;
    userEmail?: string;
    userName?: string;
  }): Promise<AuditLog> {
    const newLog: AuditLog = {
      id: "log-" + generateId(),
      action: params.action,
      resource: params.resource,
      resourceId: params.resourceId,
      details: params.details,
      userId: params.userId || "system",
      userEmail: params.userEmail || "admin@truong.edu.vn",
      userName: params.userName || "Quản trị viên",
      timestamp: new Date().toISOString(),
    };
    return createDocument<AuditLog>(COLLECTIONS.AUDIT_LOGS, newLog);
  },
};
