import { create } from 'zustand';
import { QualityCheck } from '@/types';
import { mockQualityChecks, qualityTrendData } from '@/data/quality';

interface TrendDataItem {
  date: string;
  passed: number;
  failed: number;
  rework: number;
  recheckPassed: number;
  firstFailed: number;
  recheckFailed: number;
}

interface Statistics {
  total: number;
  passed: number;
  pending: number;
  inProgress: number;
  failed: number;
  rework: number;
  recheckPassed: number;
  firstFailed: number;
  recheckFailed: number;
  passRate: number;
  avgProcessTime: number;
}

interface QualityState {
  checks: QualityCheck[];
  trendData: TrendDataItem[];
  selectedCheck: QualityCheck | null;
  setChecks: (checks: QualityCheck[]) => void;
  setSelectedCheck: (check: QualityCheck | null) => void;
  updateCheckStatus: (id: string, status: QualityCheck['status'], result?: string) => void;
  updateCheckFields: (id: string, updates: Partial<QualityCheck>) => void;
  getChecksByType: (type: string) => QualityCheck[];
  getChecksByPoint: (point: string) => QualityCheck[];
  getChecksByStatus: (status: string) => QualityCheck[];
  getChecksByTask: (taskId: string) => QualityCheck[];
  getPendingChecks: () => QualityCheck[];
  getStatistics: () => Statistics;
}

const calculateStatistics = (checks: QualityCheck[]): Statistics => {
  const total = checks.length;
  const passed = checks.filter(c => c.status === 'passed').length;
  const pending = checks.filter(c => c.status === 'pending').length;
  const inProgress = checks.filter(c => c.status === 'in_progress').length;
  const failed = checks.filter(c => c.status === 'failed').length;
  const rework = checks.filter(c => c.status === 'rework').length;
  const recheckPassed = checks.filter(c => c.status === 'passed' && (c.reworkCount || 0) > 0).length;
  const firstFailed = checks.filter(c => c.status === 'failed' && (c.reworkCount || 0) === 0).length;
  const recheckFailed = checks.filter(c => c.status === 'failed' && (c.reworkCount || 0) > 0).length;
  const completed = passed + failed;
  const passRate = completed > 0 ? Math.round((passed / completed) * 100) : 100;
  
  return {
    total,
    passed,
    pending,
    inProgress,
    failed,
    rework,
    recheckPassed,
    firstFailed,
    recheckFailed,
    passRate,
    avgProcessTime: 1.2,
  };
};

const getTodayStr = (): string => {
  const today = new Date();
  return `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};

export const useQualityStore = create<QualityState>((set, get) => ({
  checks: mockQualityChecks,
  trendData: qualityTrendData,
  selectedCheck: null,
  
  setChecks: (checks) => set({ checks }),
  setSelectedCheck: (check) => set({ selectedCheck: check }),
  
  updateCheckStatus: (id, status, result) => {
    const today = getTodayStr();
    set((state) => {
      const oldCheck = state.checks.find(c => c.id === id);
      const isRecheckPass = status === 'passed' && oldCheck && (oldCheck.reworkCount || 0) > 0;
      const isRecheckFail = status === 'failed' && oldCheck && (oldCheck.reworkCount || 0) > 0;
      const isFirstFail = status === 'failed' && oldCheck && (oldCheck.reworkCount || 0) === 0;
      
      const updatedChecks = state.checks.map(c => {
        if (c.id !== id) return c;
        const reworkCount = c.reworkCount || 0;
        return {
          ...c,
          status,
          result: result || c.result,
          reworkCount: status === 'rework' ? reworkCount + 1 : reworkCount,
          isFirstCheck: c.isFirstCheck ?? (status === 'passed' || status === 'failed'),
        };
      });
      
      const updatedTrendData = state.trendData.map(item => {
        if (item.date === today) {
          return {
            ...item,
            passed: status === 'passed' && !isRecheckPass ? item.passed + 1 : item.passed,
            failed: status === 'failed' ? item.failed + 1 : item.failed,
            rework: status === 'rework' ? item.rework + 1 : item.rework,
            recheckPassed: isRecheckPass ? (item.recheckPassed || 0) + 1 : item.recheckPassed || 0,
            firstFailed: isFirstFail ? (item.firstFailed || 0) + 1 : item.firstFailed || 0,
            recheckFailed: isRecheckFail ? (item.recheckFailed || 0) + 1 : item.recheckFailed || 0,
          };
        }
        return item;
      });
      
      const hasToday = updatedTrendData.some(item => item.date === today);
      if (!hasToday) {
        updatedTrendData.push({
          date: today,
          passed: status === 'passed' && !isRecheckPass ? 1 : 0,
          failed: status === 'failed' ? 1 : 0,
          rework: status === 'rework' ? 1 : 0,
          recheckPassed: isRecheckPass ? 1 : 0,
          firstFailed: isFirstFail ? 1 : 0,
          recheckFailed: isRecheckFail ? 1 : 0,
        });
      }
      
      return {
        checks: updatedChecks,
        trendData: updatedTrendData,
      };
    });
  },
  
  updateCheckFields: (id, updates) => set((state) => ({
    checks: state.checks.map(c =>
      c.id === id ? { ...c, ...updates } : c
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
  },
  
  getStatistics: () => {
    return calculateStatistics(get().checks);
  },
}));
