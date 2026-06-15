import { create } from 'zustand';
import { Equipment, MaintenanceRecord } from '@/types';
import { mockEquipment, mockMaintenanceRecords } from '@/data/equipment';

interface EquipmentState {
  equipment: Equipment[];
  maintenanceRecords: MaintenanceRecord[];
  selectedEquipment: Equipment | null;
  selectedRecord: MaintenanceRecord | null;
  setEquipment: (equipment: Equipment[]) => void;
  setMaintenanceRecords: (records: MaintenanceRecord[]) => void;
  setSelectedEquipment: (eq: Equipment | null) => void;
  setSelectedRecord: (record: MaintenanceRecord | null) => void;
  updateMaintenanceRecord: (id: string, updates: Partial<MaintenanceRecord>) => void;
  getEquipmentBySystem: (system: string) => Equipment[];
  getEquipmentByStatus: (status: string) => Equipment[];
  getRecordsByEquipment: (equipmentId: string) => MaintenanceRecord[];
  getRecordsByTask: (taskId: string) => MaintenanceRecord[];
}

export const useEquipmentStore = create<EquipmentState>((set, get) => ({
  equipment: mockEquipment,
  maintenanceRecords: mockMaintenanceRecords,
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
  }
}));
