import { create } from 'zustand';
import { Outage, Task } from '@/types';
import { mockOutage, mockTasks, historicalOutages } from '@/data/outage';

interface OutageState {
  currentOutage: Outage;
  tasks: Task[];
  historicalOutages: Outage[];
  selectedTask: Task | null;
  setCurrentOutage: (outage: Outage) => void;
  setTasks: (tasks: Task[]) => void;
  setSelectedTask: (task: Task | null) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  getCriticalPath: () => Task[];
  getTasksByCategory: (category: string) => Task[];
  getMilestones: () => Task[];
}

export const useOutageStore = create<OutageState>((set, get) => ({
  currentOutage: mockOutage,
  tasks: mockTasks,
  historicalOutages,
  selectedTask: null,
  
  setCurrentOutage: (outage) => set({ currentOutage: outage }),
  setTasks: (tasks) => set({ tasks }),
  setSelectedTask: (task) => set({ selectedTask: task }),
  
  updateTask: (id, updates) => set((state) => ({
    tasks: state.tasks.map(task => 
      task.id === id ? { ...task, ...updates } : task
    )
  })),
  
  getCriticalPath: () => {
    return get().tasks.filter(task => task.isCritical);
  },
  
  getTasksByCategory: (category) => {
    return get().tasks.filter(task => task.category === category);
  },
  
  getMilestones: () => {
    return get().tasks.filter(task => task.milestone);
  }
}));
