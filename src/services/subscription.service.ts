import { api } from './api';

export interface SubscriptionPackage {
  _id: string;
  name: string;
  classLevel?: string;
  academicSession: string;
  price: number;
  features: string[];
}

export interface UserSubscription {
  _id: string;
  package: SubscriptionPackage | string;
  classLevel?: string;
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
  authorizationUrl?: string;
  checkoutUrl: string;
  accessCode?: string;
  paymentReference: string;
  reference?: string;
  amount: number;
  packageName: string;
  academicSession: string;
  packageId: string;
  classLevel?: string;
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
   * Get current user's active/grace subscription for their selected class (or specified classLevel)
   */
  async getMyActiveSubscription(classLevel?: string): Promise<UserSubscription | null> {
    try {
      const params: Record<string, string> = {};
      if (classLevel) params.classLevel = classLevel;
      const res = await api.get<UserSubscription>('/subscriptions/my-active', { params });
      return res.data;
    } catch {
      return null;
    }
  },

  /**
   * Get all active/grace subscriptions across classes for current user
   */
  async getMyActiveSubscriptions(): Promise<UserSubscription[]> {
    try {
      const res = await api.get<UserSubscription[]>('/subscriptions/my-active-all');
      return Array.isArray(res.data) ? res.data : [];
    } catch {
      return [];
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
  async checkAccess(topicId?: string, lessonId?: string, classLevel?: string): Promise<AccessCheckResult> {
    try {
      const params: Record<string, string> = {};
      if (topicId) params.topicId = topicId;
      if (lessonId) params.lessonId = lessonId;
      if (classLevel) params.classLevel = classLevel;

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
   * Initialize Paystack payment attached to student's selected class
   */
  async initializePaystack(
    packageId: string,
    callbackUrl?: string,
    classLevel?: string,
  ): Promise<InitPaymentResult> {
    const res = await api.post<InitPaymentResult>('/payments/paystack/initialize', {
      packageId,
      callbackUrl,
      redirectUrl: callbackUrl,
      classLevel,
    });
    return res.data;
  },

  /**
   * Verify Paystack payment and activate subscription attached to student's selected class
   */
  async verifyPaystack(
    reference: string,
    packageId?: string,
    classLevel?: string,
  ): Promise<{ success: boolean; message: string; subscription: any }> {
    const res = await api.post('/payments/paystack/verify', {
      reference,
      packageId,
      classLevel,
    });
    return res.data;
  },

  /**
   * Initialize Monnify payment (Alias to Paystack)
   */
  async initializeMonnify(
    packageId: string,
    redirectUrl?: string,
    classLevel?: string,
  ): Promise<InitPaymentResult> {
    return this.initializePaystack(packageId, redirectUrl, classLevel);
  },

  /**
   * Verify Monnify payment (Alias to Paystack)
   */
  async verifyMonnify(
    reference: string,
    packageId?: string,
    classLevel?: string,
  ): Promise<{ success: boolean; message: string; subscription: any }> {
    return this.verifyPaystack(reference, packageId, classLevel);
  },
};

export default subscriptionService;
