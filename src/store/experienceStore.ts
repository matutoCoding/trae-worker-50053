import { create } from 'zustand';
import { LessonLearned } from '@/types';
import { mockLessons, outageComparisonData, categoryStats } from '@/data/experience';
import { historicalOutages } from '@/data/outage';

interface ExperienceState {
  lessons: LessonLearned[];
  historicalOutages: typeof historicalOutages;
  comparisonData: typeof outageComparisonData;
  categoryStats: typeof categoryStats;
  selectedLesson: LessonLearned | null;
  searchQuery: string;
  categoryFilter: string;
  severityFilter: string;
  statusFilter: string;
  setLessons: (lessons: LessonLearned[]) => void;
  setSelectedLesson: (lesson: LessonLearned | null) => void;
  setSearchQuery: (query: string) => void;
  setCategoryFilter: (category: string) => void;
  setSeverityFilter: (severity: string) => void;
  setStatusFilter: (status: string) => void;
  updateLesson: (id: string, updates: Partial<LessonLearned>) => void;
  getFilteredLessons: () => LessonLearned[];
  getLessonsByOutage: (outageId: string) => LessonLearned[];
  getLessonsByCategory: (category: string) => LessonLearned[];
}

export const useExperienceStore = create<ExperienceState>((set, get) => ({
  lessons: mockLessons,
  historicalOutages,
  comparisonData: outageComparisonData,
  categoryStats,
  selectedLesson: null,
  searchQuery: '',
  categoryFilter: 'all',
  severityFilter: 'all',
  statusFilter: 'all',
  
  setLessons: (lessons) => set({ lessons }),
  setSelectedLesson: (lesson) => set({ selectedLesson: lesson }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setCategoryFilter: (category) => set({ categoryFilter: category }),
  setSeverityFilter: (severity) => set({ severityFilter: severity }),
  setStatusFilter: (status) => set({ statusFilter: status }),
  
  updateLesson: (id, updates) => set((state) => ({
    lessons: state.lessons.map(l =>
      l.id === id ? { ...l, ...updates } : l
    )
  })),
  
  getFilteredLessons: () => {
    const { lessons, searchQuery, categoryFilter, severityFilter, statusFilter } = get();
    return lessons.filter(lesson => {
      const matchSearch = searchQuery === '' || 
        lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lesson.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = categoryFilter === 'all' || lesson.category === categoryFilter;
      const matchSeverity = severityFilter === 'all' || lesson.severity === severityFilter;
      const matchStatus = statusFilter === 'all' || lesson.status === statusFilter;
      return matchSearch && matchCategory && matchSeverity && matchStatus;
    });
  },
  
  getLessonsByOutage: (outageId) => {
    return get().lessons.filter(l => l.outageId === outageId);
  },
  
  getLessonsByCategory: (category) => {
    return get().lessons.filter(l => l.category === category);
  }
}));
