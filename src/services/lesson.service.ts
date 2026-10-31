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

export interface VoiceOption {
  id: string;
  name: string;
  label: string;
  accent: string;
  gender: 'FEMALE' | 'MALE';
  flag: string;
}

export const STUDENT_VOICES: VoiceOption[] = [
  { id: 'en-GB-Neural2-A', name: 'Amy', label: 'Amy (Clara)', accent: 'British English', gender: 'FEMALE', flag: '🇬🇧' },
  { id: 'en-GB-Neural2-B', name: 'Brian', label: 'Brian (Oliver)', accent: 'British English', gender: 'MALE', flag: '🇬🇧' },
  { id: 'en-US-Neural2-F', name: 'Joanna', label: 'Joanna', accent: 'US English', gender: 'FEMALE', flag: '🇺🇸' },
  { id: 'en-US-Neural2-D', name: 'Joey', label: 'Joey (Matthew)', accent: 'US English', gender: 'MALE', flag: '🇺🇸' },
  { id: 'en-NG-Standard-A', name: 'Ayanda', label: 'Ebere (Ayanda)', accent: 'Nigerian / African', gender: 'FEMALE', flag: '🇳🇬' },
  { id: 'en-US-Journey-F', name: 'Kendra', label: 'Kendra (Storyteller)', accent: 'Expressive English', gender: 'FEMALE', flag: '🌟' },
];

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
