// Các kiểu dữ liệu cốt lõi của Hệ thống Quản lý Máy in & Mực in Toàn trường
// TUYỆT ĐỐI KHÔNG CÓ BẤT KỲ TRƯỜNG DỮ LIỆU NÀO LIÊN QUAN ĐẾN GIÁ TIỀN, ĐƠN GIÁ, CHI PHÍ!

export type DepartmentType = 'faculty' | 'office' | 'other';
export type DepartmentStatus = 'active' | 'inactive';

export interface Department {
  id: string;
  code: string;
  name: string;
  type: DepartmentType;
  note?: string;
  status: DepartmentStatus;
  campusId?: string;
  createdAt?: any;
  updatedAt?: any;
}

export type PrinterType = 'laser' | 'inkjet' | 'multifunction' | 'photocopier' | 'other';
export type ColorMode = 'mono' | 'color';
export type PrinterStatus = 'active' | 'broken' | 'repairing' | 'inactive' | 'disposed';

export interface Printer {
  id: string;
  code: string;
  name: string;
  brand: string;
  model: string;
  serialNumber: string;
  printerType: PrinterType;
  colorMode: ColorMode;
  departmentId: string;
  location: string;
  tonerTypeId: string;
  status: PrinterStatus;
  startUseDate?: string | null;
  imageUrl?: string;
  note?: string;
  campusId?: string;
  createdBy?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface TonerType {
  id: string;
  code: string;
  name: string;
  brand: string;
  tonerType?: string;
  color: string;
  compatibleModels: string[];
  note?: string;
  status: 'active' | 'inactive';
  createdAt?: any;
  updatedAt?: any;
}

// Phân hệ Kho Mực In (Quản lý nhập mực mới về & tồn kho)
// TUYỆT ĐỐI KHÔNG CÓ BẤT KỲ TRƯỜNG DỮ LIỆU NÀO LIÊN QUAN ĐẾN GIÁ TIỀN, ĐƠN GIÁ, CHI PHÍ!
export type TonerInventoryStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export interface TonerInventoryItem {
  id: string;
  tonerTypeId?: string; // Liên kết với danh mục loại mực nếu có
  code: string; // Mã hộp mực (VD: TN-2385, 12A, 107A...)
  name: string; // Tên đầy đủ hộp mực
  brand: string; // Hãng sản xuất (Brother, Canon, HP, Epson...)
  tonerType: string; // Mô tả loại mực (Hộp mực laser đen trắng, Mực nạp chai...)
  color: string; // Màu mực (Black, Cyan, Magenta, Yellow...)
  compatibleModels: string[]; // Các Model máy in tương thích
  note?: string; // Ghi chú công suất / dung lượng
  quantity: number; // Số lượng tồn kho / nhập về
  storageLocation: string; // Vị trí lưu kho (Kho Hành chính, Tủ A kệ 1...)
  importDate: string; // Ngày nhập kho
  supplier?: string; // Nhà cung cấp / Nguồn nhập
  importedBy?: string; // Người nhập kho / Phụ trách
  status: TonerInventoryStatus; // Trạng thái tồn kho
  createdAt?: any;
  updatedAt?: any;
}

export type TonerTransactionType = 'refill' | 'replace' | 'drum' | 'other';

export interface TonerTransaction {
  id: string;
  printerId: string;
  printerCodeSnapshot: string;
  printerModelSnapshot: string;
  departmentId: string;
  departmentNameSnapshot: string;
  tonerTypeId: string;
  tonerCodeSnapshot: string;
  transactionType: TonerTransactionType;
  transactionDate: string | any; // Timestamp or ISO string
  quantity: number;
  supplier: string;
  performedBy: string;
  note?: string;
  attachmentUrl?: string;
  createdBy?: string;
  createdAt?: any;
}

export type RepairStatus =
  | 'pending'
  | 'checking'
  | 'repairing'
  | 'waiting_parts'
  | 'completed'
  | 'unrepairable';

export interface Repair {
  id: string;
  printerId: string;
  printerCodeSnapshot: string;
  departmentId: string;
  departmentNameSnapshot: string;
  reportedDate: string | any;
  problem: string;
  description?: string;
  reportedBy: string;
  assignedTo?: string;
  repairContent?: string;
  replacedParts?: string;
  status: RepairStatus;
  startedAt?: string | any;
  completedAt?: string | any;
  imageUrls?: string[];
  note?: string;
  createdBy?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface PrinterTransfer {
  id: string;
  printerId: string;
  printerCodeSnapshot: string;
  fromDepartmentId: string;
  fromDepartmentNameSnapshot: string;
  toDepartmentId: string;
  toDepartmentNameSnapshot: string;
  newLocation: string;
  transferDate: string | any;
  performedBy: string;
  reason?: string;
  note?: string;
  createdAt?: any;
}

export type FaultReportStatus = 'pending' | 'reviewed' | 'converted_to_repair' | 'rejected';

export interface FaultReport {
  id: string;
  printerId: string;
  printerCodeSnapshot: string;
  departmentId: string;
  departmentNameSnapshot: string;
  location: string;
  reporterName: string;
  reporterPhone?: string;
  problem: string;
  description?: string;
  imageUrl?: string;
  status: FaultReportStatus;
  createdAt?: any;
}

export type UserRole = 'super_admin' | 'admin' | 'staff' | 'viewer';

export interface AppUser {
  id?: string;
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  departmentId?: string;
  status: 'active' | 'inactive';
  createdAt?: any;
}

export type AuditAction =
  | 'CREATE_PRINTER'
  | 'UPDATE_PRINTER'
  | 'DELETE_PRINTER'
  | 'CHANGE_STATUS'
  | 'REFILL_TONER'
  | 'REPLACE_TONER'
  | 'CREATE_REPAIR'
  | 'UPDATE_REPAIR'
  | 'COMPLETE_REPAIR'
  | 'TRANSFER_PRINTER'
  | 'CREATE_DEPARTMENT'
  | 'UPDATE_DEPARTMENT'
  | 'CREATE_TONER'
  | 'UPDATE_TONER'
  | 'DELETE_TONER'
  | 'CREATE_FAULT_REPORT'
  | 'IMPORT_TONER_INVENTORY'
  | 'UPDATE_TONER_INVENTORY'
  | 'DELETE_TONER_INVENTORY'
  | 'IMPORT_TONER_ADD'
  | 'EXPORT_TONER_USE';

export interface AuditLog {
  id: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  action: AuditAction;
  resource: string;
  resourceId: string;
  details: string;
  timestamp: string | any;
}

export interface SystemSettings {
  schoolName: string;
  academicYear: string;
  alertHighRefillThreshold: number; // số lần nạp/tháng bị coi là nhiều
  alertLongRepairDays: number; // số ngày sửa chữa vượt quá bị cảnh báo
  alertNoCheckDays: number; // số ngày chưa kiểm tra bị cảnh báo
  campuses: Array<{ id: string; name: string }>;
}
