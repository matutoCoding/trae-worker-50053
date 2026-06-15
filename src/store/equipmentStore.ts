import { create } from 'zustand';
import { Equipment, MaintenanceRecord, Defect } from '@/types';
import { mockEquipment, mockMaintenanceRecords, mockDefects } from '@/data/equipment';

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
  getEquipmentBySystem: (system: string) => Equipment[];
  getEquipmentByStatus: (status: string) => Equipment[];
  getRecordsByEquipment: (equipmentId: string) => MaintenanceRecord[];
  getRecordsByTask: (taskId: string) => MaintenanceRecord[];
  getDefectsByEquipment: (equipmentId: string) => Defect[];
  getDefectsByRecord: (recordId: string) => Defect[];
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
  
  getUnclosedDefectsByEquipment: (equipmentId) => {
    return get().defects.filter(d => d.equipmentId === equipmentId && !['closed', 'verified'].includes(d.status));
  },
  
  getUnclosedDefectCount: (equipmentId) => {
    return get().defects.filter(d => d.equipmentId === equipmentId && !['closed', 'verified'].includes(d.status)).length;
  },
}));
