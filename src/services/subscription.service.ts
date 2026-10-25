import { api } from './api';

export interface SubscriptionPackage {
  _id: string;
  name: string;
  academicSession: string;
  price: number;
  features: string[];
}

export interface UserSubscription {
  _id: string;
  package: SubscriptionPackage | string;
  reference: string;
  paymentGateway: string;
  amountPaid: number;
  startDate: string;
  expiresAt: string;
  graceExpiresAt: string;
  status: 'active' | 'grace' | 'expired' | 'pending';
  isActive: boolean;
}

export interface AccessCheckResult {
  canAccess: boolean;
  hasSubscription: boolean;
  isGracePeriod: boolean;
  isFreeTrial: boolean;
  reason?: string;
  message?: string;
}

export interface InitPaymentResult {
  success: boolean;
  checkoutUrl: string;
  paymentReference: string;
  amount: number;
  packageName: string;
  academicSession: string;
  packageId: string;
}

export const subscriptionService = {
  /**
   * Get all available academic session subscription packages
   */
  async getPackages(): Promise<SubscriptionPackage[]> {
    const res = await api.get<SubscriptionPackage[]>('/subscriptions/packages');
    return res.data;
  },

  /**
   * Get current user's active/grace subscription
   */
  async getMyActiveSubscription(): Promise<UserSubscription | null> {
    try {
      const res = await api.get<UserSubscription>('/subscriptions/my-active');
      return res.data;
    } catch {
      return null;
    }
  },

  /**
   * Get current user's subscription and payment history
   */
  async getMyHistory(): Promise<UserSubscription[]> {
    try {
      const res = await api.get<UserSubscription[]>('/subscriptions/my-history');
      return Array.isArray(res.data) ? res.data : [];
    } catch {
      return [];
    }
  },

  /**
   * Check whether student can access this lesson/topic (free trial or active subscription)
   */
  async checkAccess(topicId?: string, lessonId?: string): Promise<AccessCheckResult> {
    try {
      const params: Record<string, string> = {};
      if (topicId) params.topicId = topicId;
      if (lessonId) params.lessonId = lessonId;

      const res = await api.get<AccessCheckResult>('/subscriptions/check-access', { params });
      return res.data;
    } catch {
      // Default allow first topic in offline/fallback mode
      return {
        canAccess: true,
        hasSubscription: false,
        isGracePeriod: false,
        isFreeTrial: true,
      };
    }
  },

  /**
   * Record lesson or quiz completion
   */
  async recordProgress(topicId: string, lessonId: string, isQuizFinished: boolean = false): Promise<void> {
    try {
      await api.post('/subscriptions/record-progress', {
        topicId,
        lessonId,
        isQuizFinished,
      });
    } catch (err) {
      console.warn('Error recording progress:', err);
    }
  },

  /**
   * Initialize Monnify payment
   */
  async initializeMonnify(packageId: string, redirectUrl?: string): Promise<InitPaymentResult> {
    const res = await api.post<InitPaymentResult>('/payments/monnify/initialize', {
      packageId,
      redirectUrl,
    });
    return res.data;
  },

  /**
   * Verify Monnify payment and activate subscription
   */
  async verifyMonnify(reference: string, packageId?: string): Promise<{ success: boolean; message: string; subscription: any }> {
    const res = await api.post('/payments/monnify/verify', {
      reference,
      packageId,
    });
    return res.data;
  },
};

export default subscriptionService;
