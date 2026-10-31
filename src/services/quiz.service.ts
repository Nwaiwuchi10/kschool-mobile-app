import { api } from './api';

export interface QuestionItem {
  questionText: string;
  options: string[];
  correctOptionIndex?: number;
}

export interface MobileQuiz {
  _id: string;
  title: string;
  topic: string;
  questions: QuestionItem[];
}

export interface QuizSubmissionResult {
  _id: string;
  user: string;
  quiz: string;
  score: number;
  totalQuestions: number;
  passed: boolean;
  createdAt: string;
}

export const quizService = {
  /**
   * Get a quiz by ID
   */
  async getQuizById(id: string): Promise<MobileQuiz> {
    const res = await api.get<MobileQuiz>(`/quizzes/${id}`);
    return res.data;
  },

  /**
   * Get quizzes for a topic, optionally filtered by subject name
   */
  async getQuizzesByTopic(topicId: string, subjectName?: string): Promise<MobileQuiz[]> {
    const query = subjectName ? `?subjectName=${encodeURIComponent(subjectName)}` : '';
    const res = await api.get<MobileQuiz[]>(`/quizzes/topic/${topicId}${query}`);
    return res.data;
  },

  /**
   * Get quizzes/exercises attached to a specific lesson
   */
  async getQuizzesByLesson(lessonId: string): Promise<MobileQuiz[]> {
    const res = await api.get<MobileQuiz[]>(`/quizzes/lesson/${lessonId}`);
    return res.data;
  },

  /**
   * Submit quiz answers
   */
  async submitQuiz(quizId: string, answers: number[]): Promise<QuizSubmissionResult> {
    const res = await api.post<QuizSubmissionResult>(`/quizzes/${quizId}/submit`, { answers });
    return res.data;
  },

  /**
   * Get user quiz results
   */
  async getUserResults(): Promise<QuizSubmissionResult[]> {
    const res = await api.get<QuizSubmissionResult[]>('/quizzes/user/results');
    return res.data;
  },
};

export default quizService;
