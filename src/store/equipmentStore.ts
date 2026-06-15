import { create } from 'zustand';
import { Equipment, MaintenanceRecord, Defect, DefectActionLog } from '@/types';
import { mockEquipment, mockMaintenanceRecords, mockDefects } from '@/data/equipment';

const getNextStatus = (status: Defect['status']): Defect['status'] | null => {
  const transitions: Record<Defect['status'], Defect['status'] | null> = {
    open: 'assigned',
    assigned: 'in_progress',
    in_progress: 'resolved',
    resolved: 'verified',
    verified: 'closed',
    closed: null
  };
  return transitions[status];
};

const getNowTimestamp = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
};

interface EquipmentState {
  equipment: Equipment[];
  maintenanceRecords: MaintenanceRecord[];
  defects: Defect[];
  selectedEquipment: Equipment | null;
  selectedRecord: MaintenanceRecord | null;
  setEquipment: (equipment: Equipment[]) => void;
  setMaintenanceRecords: (records: MaintenanceRecord[]) => void;
  setSelectedEquipment: (eq: Equipment | null) => void;
  setSelectedRecord: (record: MaintenanceRecord | null) => void;
  updateMaintenanceRecord: (id: string, updates: Partial<MaintenanceRecord>) => void;
  addDefect: (defect: Defect) => void;
  updateDefect: (id: string, updates: Partial<Defect>) => void;
  advanceDefectStatus: (id: string, operator: string, comment?: string) => Defect | undefined;
  closeDefect: (id: string, operator: string, comment?: string) => Defect | undefined;
  getEquipmentBySystem: (system: string) => Equipment[];
  getEquipmentByStatus: (status: string) => Equipment[];
  getRecordsByEquipment: (equipmentId: string) => MaintenanceRecord[];
  getRecordsByTask: (taskId: string) => MaintenanceRecord[];
  getDefectsByEquipment: (equipmentId: string) => Defect[];
  getDefectsByRecord: (recordId: string) => Defect[];
  getDefectsByQualityCheck: (qualityCheckId: string) => Defect[];
  getUnclosedDefectsByEquipment: (equipmentId: string) => Defect[];
  getUnclosedDefectCount: (equipmentId: string) => number;
}

export const useEquipmentStore = create<EquipmentState>((set, get) => ({
  equipment: mockEquipment,
  maintenanceRecords: mockMaintenanceRecords,
  defects: mockDefects,
  selectedEquipment: null,
  selectedRecord: null,
  
  setEquipment: (equipment) => set({ equipment }),
  setMaintenanceRecords: (records) => set({ maintenanceRecords: records }),
  setSelectedEquipment: (eq) => set({ selectedEquipment: eq }),
  setSelectedRecord: (record) => set({ selectedRecord: record }),
  
  updateMaintenanceRecord: (id, updates) => set((state) => ({
    maintenanceRecords: state.maintenanceRecords.map(r =>
      r.id === id ? { ...r, ...updates } : r
    )
  })),
  
  addDefect: (defect) => set((state) => ({
    defects: [...state.defects, defect]
  })),
  
  updateDefect: (id, updates) => set((state) => ({
    defects: state.defects.map(d =>
      d.id === id ? { ...d, ...updates } : d
    )
  })),
  
  advanceDefectStatus: (id, operator, comment) => {
    let updatedDefect: Defect | undefined;
    set((state) => {
      const defect = state.defects.find(d => d.id === id);
      if (!defect) return state;
      const nextStatus = getNextStatus(defect.status);
      if (!nextStatus) return state;
      
      const now = getNowTimestamp();
      const newLog: DefectActionLog = {
        id: `log-${Date.now()}`,
        action: nextStatus as DefectActionLog['action'],
        status: nextStatus,
        operator,
        timestamp: now,
        comment: comment || ''
      };
      
      const updates: Partial<Defect> = { status: nextStatus, actionLogs: [...defect.actionLogs, newLog] };
      if (nextStatus === 'assigned') {
        updates.assignedTo = operator;
      } else if (nextStatus === 'resolved') {
        updates.resolvedDate = now.split(' ')[0];
        updates.resolution = comment;
      } else if (nextStatus === 'verified') {
        updates.verifiedBy = operator;
        updates.verifiedDate = now.split(' ')[0];
        updates.verifiedResult = comment;
      } else if (nextStatus === 'closed') {
        updates.closedBy = operator;
        updates.closedDate = now.split(' ')[0];
      }
      
      updatedDefect = { ...defect, ...updates };
      return {
        defects: state.defects.map(d => d.id === id ? updatedDefect! : d)
      };
    });
    return updatedDefect;
  },
  
  closeDefect: (id, operator, comment) => {
    let updatedDefect: Defect | undefined;
    set((state) => {
      const defect = state.defects.find(d => d.id === id);
      if (!defect || defect.status !== 'verified') return state;
      
      const now = getNowTimestamp();
      const newLog: DefectActionLog = {
        id: `log-${Date.now()}`,
        action: 'closed',
        status: 'closed',
        operator,
        timestamp: now,
        comment: comment || '已确认关闭'
      };
      
      updatedDefect = {
        ...defect,
        status: 'closed',
        closedBy: operator,
        closedDate: now.split(' ')[0],
        actionLogs: [...defect.actionLogs, newLog]
      };
      
      return {
        defects: state.defects.map(d => d.id === id ? updatedDefect! : d)
      };
    });
    return updatedDefect;
  },
  
  getEquipmentBySystem: (system) => {
    return get().equipment.filter(e => e.system === system);
  },
  
  getEquipmentByStatus: (status) => {
    return get().equipment.filter(e => e.status === status);
  },
  
  getRecordsByEquipment: (equipmentId) => {
    return get().maintenanceRecords.filter(r => r.equipmentId === equipmentId);
  },
  
  getRecordsByTask: (taskId) => {
    return get().maintenanceRecords.filter(r => r.taskId === taskId);
  },
  
  getDefectsByEquipment: (equipmentId) => {
    return get().defects.filter(d => d.equipmentId === equipmentId);
  },
  
  getDefectsByRecord: (recordId) => {
    return get().defects.filter(d => d.maintenanceRecordId === recordId);
  },
  
  getDefectsByQualityCheck: (qualityCheckId) => {
    return get().defects.filter(d => d.qualityCheckId === qualityCheckId);
  },
  
  getUnclosedDefectsByEquipment: (equipmentId) => {
    return get().defects.filter(d => d.equipmentId === equipmentId && d.status !== 'closed');
  },
  
  getUnclosedDefectCount: (equipmentId) => {
    return get().defects.filter(d => d.equipmentId === equipmentId && d.status !== 'closed').length;
  },
}));
