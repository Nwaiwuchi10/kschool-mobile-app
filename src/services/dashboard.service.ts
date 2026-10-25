import { api } from './api';

export interface StudentDashboardSubject {
  _id: string;
  name: string;
  classLevel: string;
  totalTopics: number;
  completedTopics: number;
  progress: number;
}

export interface StudentCurrentLearning {
  subjectId: string;
  subjectName: string;
  topicId: string;
  topicTitle: string;
  status: string;
  totalLessons: number;
  completedLessons: number;
}

export interface StudentQuizResult {
  id: string;
  title: string;
  score: string;
  passed: boolean;
  createdAt?: string;
}

export interface StudentDashboardData {
  student: {
    name: string;
    firstName: string;
    class: string;
    school: string;
  };
  overallProgress: {
    percentage: number;
    completedTopics: number;
    totalTopics: number;
    totalLessons: number;
  };
  currentLearning: StudentCurrentLearning | null;
  subjects: StudentDashboardSubject[];
  recentQuizResults: StudentQuizResult[];
}

export interface AnnouncementItem {
  _id: string;
  title: string;
  content: string;
  audience?: string;
  authorName?: string;
  pinned?: boolean;
  createdAt: string;
}

export const studentDashboardService = {
  async getDashboardData(classLevel?: string, userId?: string): Promise<StudentDashboardData> {
    const params: Record<string, string> = {};
    if (classLevel && classLevel.trim()) {
      params.classLevel = classLevel.trim();
    }
    if (userId && userId.trim()) {
      params.userId = userId.trim();
    }
    const response = await api.get<StudentDashboardData>('/dashboard/student', { params });
    return response.data;
  },

  async getAnnouncements(): Promise<AnnouncementItem[]> {
    const response = await api.get<AnnouncementItem[]>('/dashboard/announcements');
    return response.data;
  },
};

export default studentDashboardService;
