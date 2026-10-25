import { api } from './api';

export interface MobileLesson {
  _id: string;
  title: string;
  content?: string;
  topic?: string;
  duration?: string;
  order?: number;
  status?: 'draft' | 'published' | 'archived';
  objectives?: string[];
  outlines?: string[];
  images?: string[];
  voiceNoteUrl?: string;
  voiceNoteDuration?: number;
  exercises?: any[];
  audioUrl?: string;
  audioDuration?: number;
  audioStatus?: 'pending' | 'generating' | 'ready' | 'error';
  audioVoice?: string;
  audioGeneratedAt?: string;
  audioVersion?: number;
  isCompleted?: boolean;
}

export const lessonService = {
  /**
   * Get a single lesson by ID with audio and content
   */
  async getLessonById(id: string): Promise<MobileLesson> {
    const res = await api.get<MobileLesson>(`/subjects/lessons/${id}`);
    return res.data;
  },

  /**
   * Get all lessons for a topic
   */
  async getLessonsByTopic(topicId: string): Promise<MobileLesson[]> {
    const res = await api.get<MobileLesson[]>(`/subjects/topics/${topicId}/lessons`);
    return res.data;
  },

  /**
   * Synthesize TTS audio on-the-fly for lesson content using TTS service (powered by ttsmp3.com / Google TTS)
   */
  async synthesizeSpeech(text: string, voiceId?: string): Promise<{ audioUrl: string; duration: number }> {
    const res = await api.post<{ audioUrl: string; duration: number }>('/tts/synthesize', {
      text,
      voiceId,
    });
    return res.data;
  },
};

export default lessonService;
