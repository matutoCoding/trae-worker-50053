import { create } from 'zustand';
import { QualityCheck } from '@/types';
import { mockQualityChecks, qualityTrendData, qualityStatistics } from '@/data/quality';

interface QualityState {
  checks: QualityCheck[];
  trendData: typeof qualityTrendData;
  statistics: typeof qualityStatistics;
  selectedCheck: QualityCheck | null;
  setChecks: (checks: QualityCheck[]) => void;
  setSelectedCheck: (check: QualityCheck | null) => void;
  updateCheckStatus: (id: string, status: QualityCheck['status'], result?: string) => void;
  getChecksByType: (type: string) => QualityCheck[];
  getChecksByPoint: (point: string) => QualityCheck[];
  getChecksByStatus: (status: string) => QualityCheck[];
  getChecksByTask: (taskId: string) => QualityCheck[];
  getPendingChecks: () => QualityCheck[];
}

export const useQualityStore = create<QualityState>((set, get) => ({
  checks: mockQualityChecks,
  trendData: qualityTrendData,
  statistics: qualityStatistics,
  selectedCheck: null,
  
  setChecks: (checks) => set({ checks }),
  setSelectedCheck: (check) => set({ selectedCheck: check }),
  
  updateCheckStatus: (id, status, result) => set((state) => ({
    checks: state.checks.map(c =>
      c.id === id ? { ...c, status, result: result || c.result } : c
    )
  })),
  
  getChecksByType: (type) => {
    return get().checks.filter(c => c.type === type);
  },
  
  getChecksByPoint: (point) => {
    return get().checks.filter(c => c.point === point);
  },
  
  getChecksByStatus: (status) => {
    return get().checks.filter(c => c.status === status);
  },
  
  getChecksByTask: (taskId) => {
    return get().checks.filter(c => c.taskId === taskId);
  },
  
  getPendingChecks: () => {
    return get().checks.filter(c => c.status === 'pending' || c.status === 'in_progress');
  }
}));
