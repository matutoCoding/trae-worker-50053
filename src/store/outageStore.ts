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
  updateTaskAndDownstream: (taskId: string, updates: Partial<Task>, daysShift: number) => void;
  updateCurrentOutage: (updates: Partial<Outage>) => void;
  getCriticalPath: () => Task[];
  getTasksByCategory: (category: string) => Task[];
  getMilestones: () => Task[];
  getDownstreamTasks: (taskId: string) => Task[];
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
  
  updateCurrentOutage: (updates) => set((state) => ({
    currentOutage: { ...state.currentOutage, ...updates }
  })),
  
  getDownstreamTasks: (taskId) => {
    const allTasks = get().tasks;
    const downstream: Task[] = [];
    const visited = new Set<string>();
    
    const findDownstream = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);
      const deps = allTasks.filter(t => t.dependencies.includes(id));
      for (const dep of deps) {
        if (!visited.has(dep.id)) {
          downstream.push(dep);
          findDownstream(dep.id);
        }
      }
    };
    findDownstream(taskId);
    return downstream;
  },
  
  updateTaskAndDownstream: (taskId, updates, daysShift) => set((state) => {
    const addDays = (dateStr: string, days: number): string => {
      if (!dateStr || days === 0) return dateStr;
      const d = new Date(dateStr);
      d.setDate(d.getDate() + days);
      return d.toISOString().split('T')[0];
    };
    
    const downstream = get().getDownstreamTasks(taskId);
    const downstreamIds = new Set(downstream.map(t => t.id));
    
    const updatedTasks = state.tasks.map(task => {
      if (task.id === taskId) {
        return { ...task, ...updates };
      }
      if (downstreamIds.has(task.id) && daysShift !== 0) {
        const newStart = addDays(task.startDate, daysShift);
        const newEnd = addDays(task.endDate, daysShift);
        return { ...task, startDate: newStart, endDate: newEnd };
      }
      return task;
    });
    
    const updatedState = { ...state, tasks: updatedTasks };
    
    if (daysShift > 0) {
      const endDate = new Date(state.currentOutage.endDate);
      endDate.setDate(endDate.getDate() + daysShift);
      updatedState.currentOutage = {
        ...state.currentOutage,
        endDate: endDate.toISOString().split('T')[0]
      };
    }
    
    return updatedState;
  }),
  
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
