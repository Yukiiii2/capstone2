export type StudentStatus = 'active' | 'inactive';

export interface Student {
  id: string;
  name: string;
  grade: string;
  strand: string;
  status: StudentStatus;
  initials: string;
  color: string;
  statusColor: string;
  confidence?: number;
  anxiety?: number;
  progress?: number;
  satisfaction?: number;
}

export interface PerformanceData {
  moduleProgress: number;
  confidenceLevel: number;
  anxietyLevel: 'low' | 'medium' | 'high';
  skillMastery: {
    pronunciation: number;
    fluency: number;
    vocabulary: number;
    grammar: number;
  };
  recentTasks: Array<{
    id: string;
    title: string;
    score: number;
    date: string;
    type: string;
  }>;
  areasToImprove: string[];
  recommendations: string[];
}

export const defaultPerformanceData: Record<'speaking' | 'reading', PerformanceData> = {
  speaking: {
    moduleProgress: 0,             // <- 0 until real progress exists
    confidenceLevel: 0,            // <- 0
    anxietyLevel: 'high',          // <- treat as 100% in UI
    skillMastery: {
      pronunciation: 0,
      fluency: 0,
      vocabulary: 0,
      grammar: 0,
    },
    recentTasks: [],               // <- nothing done yet
    areasToImprove: [],
    recommendations: [],
  },
  reading: {
    moduleProgress: 0,
    confidenceLevel: 0,
    anxietyLevel: 'high',
    skillMastery: {
      pronunciation: 0,
      fluency: 0,
      vocabulary: 0,
      grammar: 0,
    },
    recentTasks: [],
    areasToImprove: [],
    recommendations: [],
  },
};
