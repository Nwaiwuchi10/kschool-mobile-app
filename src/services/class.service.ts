import { api } from './api';

export interface SchoolClass {
  _id: string;
  name: string; // e.g. "Primary 1", "JSS 1", "SS 3"
  code: string;
  category: 'Primary' | 'Junior Secondary' | 'Senior Secondary';
  order: number;
  description?: string;
  isActive: boolean;
}

export interface UserClassStatus {
  selectedClass: string | null;
  paidClass: string | null;
  isClassLocked: boolean;
  activeSubscription: any | null;
}

export const classService = {
  async getClasses(): Promise<SchoolClass[]> {
    const response = await api.get<SchoolClass[]>('/classes');
    return response.data;
  },

  async getMyClassStatus(): Promise<UserClassStatus> {
    const response = await api.get<UserClassStatus>('/classes/my-status');
    return response.data;
  },

  async selectClass(className: string): Promise<{ message: string; selectedClass: string; user: any }> {
    const response = await api.post('/classes/select', { className });
    return response.data;
  },
};
