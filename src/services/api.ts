import axios, { AxiosError } from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { storageService } from './storage.service';

export const getApiBaseUrl = (): string => {
  // Respect environment variable if defined (e.g. Vercel backend for EAS builds)
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Always prioritize local backend on port 3500 for local development
  let url = 'http://192.168.0.106:3500';

  if (Platform.OS === 'android') {
    url = 'http://192.168.0.106:3500';
  } else {
    url = 'http://192.168.0.106:3500';
  }

  console.log(`[API] Connecting to Backend at: ${url}`);
  return url;
};

export const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  async (config) => {
    const token = await storageService.getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor to handle errors gracefully
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<any>) => {
    let message = 'An unexpected error occurred. Please try again.';

    if (error.response?.data) {
      const data = error.response.data;
      if (Array.isArray(data.message)) {
        message = data.message.join(', ');
      } else if (typeof data.message === 'string') {
        message = data.message;
      } else if (typeof data.error === 'string') {
        message = data.error;
      }
    } else if (error.message) {
      if (error.message.includes('Network Error')) {
        message = `Cannot connect to backend server (${error.config?.baseURL || ''}${error.config?.url || ''}). Please verify network connection.`;
      } else {
        message = error.message;
      }
    }

    if (error.response?.status === 401) {
      // Token expired or invalid session - clear credentials automatically
      storageService.clearAuth().catch(() => { });
      try {
        const { router } = require('expo-router');
        router.replace('/login');
      } catch { }
      message = 'Your session has expired. Please log in again.';
    }

    console.warn(`[API ERROR] ${error.config?.method?.toUpperCase()} ${error.config?.baseURL}${error.config?.url}:`, error.message, error.response?.status || 'No Response');

    return Promise.reject(new Error(message));
  },
);
