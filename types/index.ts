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
    moduleProgress: 75,
    confidenceLevel: 80,
    anxietyLevel: 'low',
    skillMastery: {
      pronunciation: 85,
      fluency: 78,
      vocabulary: 82,
      grammar: 75
    },
    recentTasks: [
      { id: '1', title: 'Self Introduction', score: 88, date: '2023-05-15', type: 'speaking' },
      { id: '2', title: 'Debate Practice', score: 76, date: '2023-05-10', type: 'speaking' },
    ],
    areasToImprove: ['Grammar accuracy', 'Fluency in complex sentences'],
    recommendations: ['Practice with native speakers', 'Use grammar exercises']
  },
  reading: {
    moduleProgress: 60,
    confidenceLevel: 70,
    anxietyLevel: 'medium',
    skillMastery: {
      pronunciation: 75,
      fluency: 68,
      vocabulary: 72,
      grammar: 80
    },
    recentTasks: [
      { id: '3', title: 'News Article', score: 82, date: '2023-05-12', type: 'reading' },
      { id: '4', title: 'Poem Analysis', score: 65, date: '2023-05-05', type: 'reading' },
    ],
    areasToImprove: ['Reading speed', 'Vocabulary'],
    recommendations: ['Read daily', 'Practice with varied texts']
  }
};
