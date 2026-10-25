import { api } from './api';

export interface LessonItem {
  _id: string;
  title: string;
  topic?: string;
  content?: string;
  duration?: string;
  isCompleted?: boolean;
}

export interface TopicItem {
  _id: string;
  title: string;
  subject?: string;
  status?: 'completed' | 'active' | 'locked';
  lessons?: (LessonItem | string)[];
}

export interface MobileSubject {
  _id: string;
  name: string;
  classLevel: string;
  description?: string;
  topics?: TopicItem[];
  progress?: number;
  icon?: any;
}

export const subjectService = {
  /**
   * Fetch subjects from backend, optionally filtered by student's classLevel
   */
  async getSubjects(classLevel?: string): Promise<MobileSubject[]> {
    const params: Record<string, string> = {};
    if (classLevel && classLevel.trim()) {
      params.classLevel = classLevel.trim();
    }
    const response = await api.get<MobileSubject[]>('/subjects', { params });
    return response.data;
  },

  /**
   * Fetch a single subject with full topics and lessons
   */
  async getSubjectById(id: string): Promise<MobileSubject> {
    const response = await api.get<MobileSubject>(`/subjects/${id}`);
    return response.data;
  },

  /**
   * Fetch a topic with its lessons
   */
  async getTopicById(topicId: string): Promise<TopicItem> {
    const response = await api.get<TopicItem>(`/subjects/topics/${topicId}`);
    return response.data;
  },
};

export default subjectService;
