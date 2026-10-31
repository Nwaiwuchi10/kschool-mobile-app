import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'kschoolmate_auth_token';
const USER_KEY = 'kschoolmate_user_data';
const LEARNING_CTX_KEY = 'kschoolmate_last_learning_ctx';
const PREFERRED_VOICE_KEY = 'kschoolmate_preferred_tts_voice';
const READ_ANNOUNCEMENTS_KEY = 'kschoolmate_read_announcements';
const DISMISSED_ANNOUNCEMENTS_KEY = 'kschoolmate_dismissed_announcements';

export interface LearningContextData {
  subjectId?: string;
  subjectName?: string;
  topicId?: string;
  topicTitle?: string;
}

export const storageService = {
  async getPreferredVoice(): Promise<string> {
    try {
      let voice: string | null = null;
      if (Platform.OS === 'web') {
        voice = localStorage.getItem(PREFERRED_VOICE_KEY);
      } else {
        voice = await SecureStore.getItemAsync(PREFERRED_VOICE_KEY);
      }
      return voice || 'en-GB-Neural2-A'; // Default to friendly British Female (Amy)
    } catch {
      return 'en-GB-Neural2-A';
    }
  },

  async setPreferredVoice(voiceId: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(PREFERRED_VOICE_KEY, voiceId);
      } else {
        await SecureStore.setItemAsync(PREFERRED_VOICE_KEY, voiceId);
      }
    } catch (err) {
      console.warn('Failed to save preferred voice to storage', err);
    }
  },
  async setToken(token: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
      }
    } catch (err) {
      console.warn('Failed to save token to storage', err);
    }
  },

  async getToken(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(TOKEN_KEY);
      }
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (err) {
      console.warn('Failed to read token from storage', err);
      return null;
    }
  },

  async removeToken(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(TOKEN_KEY);
      } else {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      }
    } catch (err) {
      console.warn('Failed to remove token from storage', err);
    }
  },

  async setUser(user: any): Promise<void> {
    try {
      const serialized = JSON.stringify(user);
      if (Platform.OS === 'web') {
        localStorage.setItem(USER_KEY, serialized);
      } else {
        await SecureStore.setItemAsync(USER_KEY, serialized);
      }
    } catch (err) {
      console.warn('Failed to save user to storage', err);
    }
  },

  async getUser(): Promise<any | null> {
    try {
      let raw: string | null = null;
      if (Platform.OS === 'web') {
        raw = localStorage.getItem(USER_KEY);
      } else {
        raw = await SecureStore.getItemAsync(USER_KEY);
      }
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      console.warn('Failed to read user from storage', err);
      return null;
    }
  },

  async clearAuth(): Promise<void> {
    await this.removeToken();
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(USER_KEY);
      } else {
        await SecureStore.deleteItemAsync(USER_KEY);
      }
    } catch (err) {
      console.warn('Failed to clear user from storage', err);
    }
  },

  async setSelectedClass(className: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem('kschoolmate_selected_class', className);
      } else {
        await SecureStore.setItemAsync('kschoolmate_selected_class', className);
      }
    } catch (err) {
      console.warn('Failed to save selected class to storage', err);
    }
  },

  async getSelectedClass(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem('kschoolmate_selected_class');
      }
      return await SecureStore.getItemAsync('kschoolmate_selected_class');
    } catch (err) {
      console.warn('Failed to read selected class from storage', err);
      return null;
    }
  },

  async setLastLearningContext(ctx: LearningContextData): Promise<void> {
    try {
      const existing = (await this.getLastLearningContext()) || {};
      const merged: LearningContextData = {
        subjectId: ctx.subjectId || existing.subjectId,
        subjectName: ctx.subjectName || existing.subjectName,
        topicId: ctx.topicId || existing.topicId,
        topicTitle: ctx.topicTitle || existing.topicTitle,
      };
      const serialized = JSON.stringify(merged);
      if (Platform.OS === 'web') {
        localStorage.setItem(LEARNING_CTX_KEY, serialized);
      } else {
        await SecureStore.setItemAsync(LEARNING_CTX_KEY, serialized);
      }
    } catch (err) {
      console.warn('Failed to save learning context to storage', err);
    }
  },

  async getLastLearningContext(): Promise<LearningContextData | null> {
    try {
      let raw: string | null = null;
      if (Platform.OS === 'web') {
        raw = localStorage.getItem(LEARNING_CTX_KEY);
      } else {
        raw = await SecureStore.getItemAsync(LEARNING_CTX_KEY);
      }
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      console.warn('Failed to read learning context from storage', err);
      return null;
    }
  },

  async getReadAnnouncementIds(): Promise<string[]> {
    try {
      let raw: string | null = null;
      if (Platform.OS === 'web') {
        raw = localStorage.getItem(READ_ANNOUNCEMENTS_KEY);
      } else {
        raw = await SecureStore.getItemAsync(READ_ANNOUNCEMENTS_KEY);
      }
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  async markAnnouncementAsRead(id: string): Promise<void> {
    try {
      const readList = await this.getReadAnnouncementIds();
      if (!readList.includes(id)) {
        readList.push(id);
        const serialized = JSON.stringify(readList);
        if (Platform.OS === 'web') {
          localStorage.setItem(READ_ANNOUNCEMENTS_KEY, serialized);
        } else {
          await SecureStore.setItemAsync(READ_ANNOUNCEMENTS_KEY, serialized);
        }
      }
    } catch (err) {
      console.warn('Failed to mark announcement as read', err);
    }
  },

  async markAllAnnouncementsAsRead(ids: string[]): Promise<void> {
    try {
      const readList = await this.getReadAnnouncementIds();
      const set = new Set([...readList, ...ids]);
      const serialized = JSON.stringify(Array.from(set));
      if (Platform.OS === 'web') {
        localStorage.setItem(READ_ANNOUNCEMENTS_KEY, serialized);
      } else {
        await SecureStore.setItemAsync(READ_ANNOUNCEMENTS_KEY, serialized);
      }
    } catch (err) {
      console.warn('Failed to mark all announcements as read', err);
    }
  },

  async getDismissedModalAnnouncementIds(): Promise<string[]> {
    try {
      let raw: string | null = null;
      if (Platform.OS === 'web') {
        raw = localStorage.getItem(DISMISSED_ANNOUNCEMENTS_KEY);
      } else {
        raw = await SecureStore.getItemAsync(DISMISSED_ANNOUNCEMENTS_KEY);
      }
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  async dismissModalAnnouncement(id: string): Promise<void> {
    try {
      const list = await this.getDismissedModalAnnouncementIds();
      if (!list.includes(id)) {
        list.push(id);
        const serialized = JSON.stringify(list);
        if (Platform.OS === 'web') {
          localStorage.setItem(DISMISSED_ANNOUNCEMENTS_KEY, serialized);
        } else {
          await SecureStore.setItemAsync(DISMISSED_ANNOUNCEMENTS_KEY, serialized);
        }
      }
    } catch (err) {
      console.warn('Failed to dismiss modal announcement', err);
    }
  },
};
