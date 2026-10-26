import { api } from './api';
import { storageService } from './storage.service';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  role?: string;
  class?: string;
  school?: string;
  avatar?: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface RegisterDto {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface ResetPasswordDto {
  email: string;
  code: string;
  newPassword: string;
}

export const authService = {
  async register(data: RegisterDto): Promise<AuthResponse> {
    const payload: any = {
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      email: data.email.trim().toLowerCase(),
      password: data.password,
    };
    if (data.phoneNumber && data.phoneNumber.trim().length > 0) {
      payload.phoneNumber = data.phoneNumber.trim();
    }

    const response = await api.post<AuthResponse>('/auth/register', payload);
    const result = response.data;

    if (result.access_token) {
      await storageService.setToken(result.access_token);
      await storageService.setUser(result.user);
    }

    return result;
  },

  async login(data: LoginDto): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', {
      email: data.email.trim().toLowerCase(),
      password: data.password,
    });
    const result = response.data;

    if (result.access_token) {
      await storageService.setToken(result.access_token);
      await storageService.setUser(result.user);
    }

    return result;
  },

  async forgotPassword(email: string): Promise<{ message: string; email: string }> {
    const response = await api.post<{ message: string; email: string }>('/auth/forgot-password', {
      email: email.trim().toLowerCase(),
    });
    return response.data;
  },

  async verifyResetCode(email: string, code: string): Promise<{ valid: boolean; message: string }> {
    const response = await api.post<{ valid: boolean; message: string }>('/auth/verify-reset-code', {
      email: email.trim().toLowerCase(),
      code: code.trim(),
    });
    return response.data;
  },

  async resetPassword(data: ResetPasswordDto): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/auth/reset-password', {
      email: data.email.trim().toLowerCase(),
      code: data.code.trim(),
      newPassword: data.newPassword,
    });
    return response.data;
  },

  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/auth/change-password', data);
    return response.data;
  },

  async updateProfile(data: Partial<User>): Promise<{ message: string; user: User }> {
    const response = await api.patch<{ message: string; user: User }>('/auth/profile', data);
    return response.data;
  },

  async logout(): Promise<void> {
    await storageService.clearAuth();
  },
};
