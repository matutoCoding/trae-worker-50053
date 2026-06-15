import { create } from 'zustand';
import { Worker } from '@/types';
import { mockWorkers, accessApplications } from '@/data/workers';

interface WorkerState {
  workers: Worker[];
  accessApplications: typeof accessApplications;
  selectedWorker: Worker | null;
  setWorkers: (workers: Worker[]) => void;
  setSelectedWorker: (worker: Worker | null) => void;
  getWorkersByDepartment: (department: string) => Worker[];
  getWorkersByStatus: (status: string) => Worker[];
  getWorkersWithExpiringCerts: () => Worker[];
  approveAccess: (appId: string, approver: string) => void;
  rejectAccess: (appId: string) => void;
}

export const useWorkerStore = create<WorkerState>((set, get) => ({
  workers: mockWorkers,
  accessApplications,
  selectedWorker: null,
  
  setWorkers: (workers) => set({ workers }),
  setSelectedWorker: (worker) => set({ selectedWorker: worker }),
  
  getWorkersByDepartment: (department) => {
    return get().workers.filter(w => w.department === department);
  },
  
  getWorkersByStatus: (status) => {
    return get().workers.filter(w => w.status === status);
  },
  
  getWorkersWithExpiringCerts: () => {
    return get().workers.filter(w => 
      w.certificates.some(c => c.status === 'expiring' || c.status === 'expired')
    );
  },
  
  approveAccess: (appId, approver) => set((state) => ({
    accessApplications: state.accessApplications.map(app =>
      app.id === appId ? { ...app, status: 'approved', approver } : app
    )
  })),
  
  rejectAccess: (appId) => set((state) => ({
    accessApplications: state.accessApplications.map(app =>
      app.id === appId ? { ...app, status: 'rejected' } : app
    )
  }))
}));
