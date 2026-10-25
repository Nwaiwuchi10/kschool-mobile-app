import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'kschoolmate_auth_token';
const USER_KEY = 'kschoolmate_user_data';

export const storageService = {
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
};
