export type TaskCategory = 'mechanical' | 'electrical' | 'instrument' | 'radiation' | 'other';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'delayed';
export type CertificateStatus = 'valid' | 'expiring' | 'expired';
export type WorkerStatus = 'available' | 'on_site' | 'training' | 'unavailable';
export type PermitType = 'red' | 'orange' | 'yellow' | 'green';
export type PermitStatus = 'pending' | 'approved' | 'active' | 'expired' | 'revoked';
export type EquipmentStatus = 'normal' | 'maintenance' | 'defective';
export type MaintenanceType = 'disassembly' | 'inspection' | 'repair' | 'replacement' | 'assembly';
export type MaintenanceStatus = 'pending' | 'in_progress' | 'completed' | 'failed';
export type PartStatus = 'reserved' | 'issued' | 'used' | 'returned';
export type QualityCheckType = 'hidden' | 'witness' | 'review';
export type QualityCheckPoint = 'H' | 'W' | 'R';
export type QualityCheckStatus = 'pending' | 'in_progress' | 'passed' | 'failed' | 'rework';
export type DefectStatus = 'open' | 'assigned' | 'in_progress' | 'resolved' | 'verified' | 'closed';
export type DefectSeverity = 'minor' | 'major' | 'critical';
export type LessonCategory = 'schedule' | 'safety' | 'quality' | 'cost' | 'radiation';
export type LessonSeverity = 'low' | 'medium' | 'high' | 'critical';
export type LessonStatus = 'open' | 'in_progress' | 'closed' | 'verified';
export type OutageStatus = 'planning' | 'in_progress' | 'completed';

export interface Outage {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  progress: number;
  status: OutageStatus;
  totalTasks: number;
  completedTasks: number;
  delayedTasks: number;
}

export interface Task {
  id: string;
  outageId: string;
  name: string;
  category: TaskCategory;
  startDate: string;
  endDate: string;
  duration: number;
  isCritical: boolean;
  status: TaskStatus;
  progress: number;
  assignees: string[];
  dependencies: string[];
  description: string;
  milestone?: string;
}

export interface Certificate {
  id: string;
  type: string;
  issueDate: string;
  expireDate: string;
  status: CertificateStatus;
}

export interface Worker {
  id: string;
  name: string;
  department: string;
  position: string;
  avatar: string;
  certificates: Certificate[];
  currentDose: number;
  annualDoseLimit: number;
  status: WorkerStatus;
  phone: string;
}

export interface DoseRecord {
  id: string;
  workerId: string;
  workerName: string;
  date: string;
  dailyDose: number;
  cumulativeDose: number;
  area: string;
  workType: string;
}

export interface RadiationPermit {
  id: string;
  permitNumber: string;
  workerId: string;
  workerName: string;
  type: PermitType;
  area: string;
  workContent: string;
  doseLimit: number;
  issueDate: string;
  expireDate: string;
  status: PermitStatus;
  approver: string;
}

export interface Equipment {
  id: string;
  name: string;
  code: string;
  system: string;
  location: string;
  status: EquipmentStatus;
  lastMaintenance: string;
  nextMaintenance: string;
}

export interface Measurement {
  name: string;
  value: string;
  unit: string;
  standard: string;
}

export interface SparePart {
  id: string;
  name: string;
  partNumber: string;
  quantity: number;
  usedQuantity: number;
  unit: string;
  status: PartStatus;
}

export interface MaintenanceRecord {
  id: string;
  equipmentId: string;
  equipmentName: string;
  taskId: string;
  type: MaintenanceType;
  description: string;
  operator: string;
  startTime: string;
  endTime: string;
  status: MaintenanceStatus;
  findings: string;
  measurements: Measurement[];
  spareParts: SparePart[];
  photos: string[];
}

export interface QualityCheck {
  id: string;
  taskId: string;
  taskName: string;
  type: QualityCheckType;
  point: QualityCheckPoint;
  name: string;
  description: string;
  standard: string;
  inspector: string;
  checkDate: string;
  status: QualityCheckStatus;
  result: string;
  attachments: string[];
  reworkCount?: number;
  relatedDefectId?: string;
  equipmentId?: string;
  maintenanceRecordId?: string;
  isFirstCheck?: boolean;
  defectStatus?: string;
}

export interface Defect {
  id: string;
  title: string;
  description: string;
  severity: DefectSeverity;
  status: DefectStatus;
  equipmentId: string;
  equipmentName: string;
  maintenanceRecordId: string;
  sourceType: 'measurement' | 'finding' | 'quality_check';
  sourceDetail: string;
  assignedTo: string;
  createdDate: string;
  createdBy: string;
  resolvedDate: string;
  resolution: string;
  verifiedBy: string;
  verifiedDate: string;
  verifiedResult: string;
  closedBy: string;
  closedDate: string;
  qualityCheckId?: string;
  actionLogs: DefectActionLog[];
}

export interface DefectActionLog {
  id: string;
  action: 'created' | 'assigned' | 'in_progress' | 'resolved' | 'verified' | 'closed';
  status: DefectStatus;
  operator: string;
  timestamp: string;
  comment: string;
}

export interface LessonLearned {
  id: string;
  outageId: string;
  outageName: string;
  category: LessonCategory;
  severity: LessonSeverity;
  title: string;
  description: string;
  rootCause: string;
  correctiveAction: string;
  preventiveAction: string;
  status: LessonStatus;
  reportedBy: string;
  reportDate: string;
  closedDate: string;
}

export interface Alert {
  id: string;
  type: 'dose' | 'certificate' | 'schedule' | 'quality';
  severity: 'warning' | 'danger';
  message: string;
  timestamp: string;
  read: boolean;
}
