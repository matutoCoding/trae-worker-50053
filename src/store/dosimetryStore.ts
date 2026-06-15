import { create } from 'zustand';
import { DoseRecord, RadiationPermit, Alert } from '@/types';
import { mockDoseRecords, mockPermits, mockAlerts, areaDoseData, doseTrendData } from '@/data/dosimetry';

interface DosimetryState {
  doseRecords: DoseRecord[];
  permits: RadiationPermit[];
  alerts: Alert[];
  areaDoseData: typeof areaDoseData;
  doseTrendData: typeof doseTrendData;
  addDoseRecord: (record: DoseRecord) => void;
  createPermit: (permit: Omit<RadiationPermit, 'id'>) => void;
  updatePermitStatus: (id: string, status: RadiationPermit['status'], approver?: string) => void;
  markAlertRead: (id: string) => void;
  getWorkerDoseRecords: (workerId: string) => DoseRecord[];
  getWorkerCumulativeDose: (workerId: string) => number;
  checkDoseAlerts: (workerId: string) => Alert[];
  getActivePermits: () => RadiationPermit[];
}

export const useDosimetryStore = create<DosimetryState>((set, get) => ({
  doseRecords: mockDoseRecords,
  permits: mockPermits,
  alerts: mockAlerts,
  areaDoseData,
  doseTrendData,
  
  addDoseRecord: (record) => set((state) => ({
    doseRecords: [...state.doseRecords, record]
  })),
  
  createPermit: (permit) => set((state) => ({
    permits: [...state.permits, { ...permit, id: `permit-${Date.now()}` }]
  })),
  
  updatePermitStatus: (id, status, approver) => set((state) => ({
    permits: state.permits.map(p =>
      p.id === id ? { ...p, status, approver: approver || p.approver } : p
    )
  })),
  
  markAlertRead: (id) => set((state) => ({
    alerts: state.alerts.map(a =>
      a.id === id ? { ...a, read: true } : a
    )
  })),
  
  getWorkerDoseRecords: (workerId) => {
    return get().doseRecords.filter(r => r.workerId === workerId);
  },
  
  getWorkerCumulativeDose: (workerId) => {
    const records = get().getWorkerDoseRecords(workerId);
    return records.length > 0 ? Math.max(...records.map(r => r.cumulativeDose)) : 0;
  },
  
  checkDoseAlerts: (workerId) => {
    const cumulative = get().getWorkerCumulativeDose(workerId);
    const worker = get().doseRecords.find(r => r.workerId === workerId);
    if (!worker) return [];
    
    const alerts: Alert[] = [];
    if (cumulative > 15) {
      alerts.push({
        id: `alert-dose-${workerId}`,
        type: 'dose',
        severity: 'danger',
        message: `${worker.workerName}累计剂量已达${cumulative.toFixed(2)}mSv，超过年限值75%！`,
        timestamp: new Date().toISOString(),
        read: false
      });
    } else if (cumulative > 10) {
      alerts.push({
        id: `alert-dose-${workerId}`,
        type: 'dose',
        severity: 'warning',
        message: `${worker.workerName}累计剂量已达${cumulative.toFixed(2)}mSv，请注意控制。`,
        timestamp: new Date().toISOString(),
        read: false
      });
    }
    return alerts;
  },
  
  getActivePermits: () => {
    return get().permits.filter(p => p.status === 'active' || p.status === 'approved');
  }
}));
