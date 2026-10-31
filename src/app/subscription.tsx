import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useClass } from '@/store/ClassContext';
import { subscriptionService, UserSubscription } from '@/services/subscription.service';
import { useAppTheme } from '@/hooks/useAppTheme';

export default function SubscriptionScreen() {
  const { colors, isDark } = useAppTheme();
  const { paidClass, paidClasses, selectedClass } = useClass();
  const currentClass = selectedClass || paidClass;

  const [activeSub, setActiveSub] = useState<UserSubscription | null>(null);
  const [activeSubs, setActiveSubs] = useState<UserSubscription[]>([]);
  const [history, setHistory] = useState<UserSubscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchSubData = async () => {
      try {
        setLoading(true);
        const [sub, allSubs, historyList] = await Promise.all([
          subscriptionService.getMyActiveSubscription(selectedClass),
          subscriptionService.getMyActiveSubscriptions(),
          subscriptionService.getMyHistory(),
        ]);
        if (isMounted) {
          setActiveSub(sub || (allSubs.length > 0 ? allSubs[0] : null));
          setActiveSubs(allSubs);
          setHistory(historyList);
        }
      } catch (err) {
        console.warn('Error fetching subscription status:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchSubData();
    return () => {
      isMounted = false;
    };
  }, [selectedClass]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const getPackageName = (sub: UserSubscription | null) => {
    if (!sub) return null;
    if (typeof sub.package === 'object' && sub.package?.name) {
      return sub.package.name;
    }
    return currentClass ? `${currentClass} Learning Package` : 'Academic Package';
  };

  const getPackageSession = (sub: UserSubscription | null) => {
    if (!sub) return null;
    if (typeof sub.package === 'object' && sub.package?.academicSession) {
      return `${sub.package.academicSession} Academic Session`;
    }
    return null;
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Subscription & Payments</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loaderText, { color: colors.textSecondary }]}>Loading subscription status...</Text>
          </View>
        ) : (
          <>
            {/* Current Package */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Current Package</Text>

            {activeSub ? (
              <View style={[styles.currentPackageCard, { backgroundColor: isDark ? colors.surfaceAlt : '#D1FAE5' }]}>
                <View style={styles.cardHeader}>
                  <View style={[styles.cardIconBox, { backgroundColor: colors.surface }]}>
                    <Text style={{ fontSize: 24 }}>📚</Text>
                  </View>
                  <View>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>
                      {getPackageName(activeSub)}
                    </Text>
                    {getPackageSession(activeSub) && (
                      <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                        {getPackageSession(activeSub)}
                      </Text>
                    )}
                    <View style={[styles.activePill, { backgroundColor: isDark ? '#064E3B' : '#E0F2FE' }]}>
                      <Text style={styles.activePillText}>
                        {activeSub.status === 'grace' ? 'Grace Period' : 'Active'}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={[styles.separatorTeal, { backgroundColor: colors.primary }]} />

                {(activeSub.classLevel || currentClass) && (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Subscribed Class(es)</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>
                      {paidClasses && paidClasses.length > 0
                        ? paidClasses.join(', ')
                        : activeSub.classLevel || currentClass}
                    </Text>
                  </View>
                )}

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Expires</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {formatDate(activeSub.expiresAt)}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.renewBtn, { backgroundColor: colors.primary }]}
                  onPress={() => router.push('/choose-plan')}
                >
                  <Text style={styles.renewBtnText}>Subscribe for Another Class / Renew</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name="lock-closed-outline" size={36} color={colors.primary} style={{ marginBottom: 12 }} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No Active Subscription</Text>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                  Subscribe to unlock all subjects, audio-visual lessons, and practice quizzes for your class.
                </Text>
                <TouchableOpacity
                  style={[styles.renewBtn, { backgroundColor: colors.primary, width: '100%' }]}
                  onPress={() => router.push('/premium-access')}
                >
                  <Text style={styles.renewBtnText}>Subscribe Now</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Payment History */}
            <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}>Payment History</Text>

            {history.length > 0 ? (
              <View style={styles.historyList}>
                {history.map((item) => (
                  <View
                    key={item._id || item.reference}
                    style={[styles.historyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  >
                    <Text style={[styles.historyAmount, { color: colors.text }]}>
                      ₦{(item.amountPaid || 0).toLocaleString()}
                    </Text>
                    <Text style={[styles.historyDate, { color: colors.textSecondary }]}>
                      {formatDate(item.startDate)}
                    </Text>
                    <Text style={[styles.historyRef, { color: colors.textMuted }]}>
                      {item.reference}
                    </Text>
                    <View
                      style={[
                        styles.statusPill,
                        {
                          backgroundColor:
                            item.status === 'active' || item.status === 'grace'
                              ? isDark ? '#064E3B' : '#D1FAE5'
                              : isDark ? '#374151' : '#F3F4F6',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusPillText,
                          {
                            color:
                              item.status === 'active' || item.status === 'grace'
                                ? '#10B981'
                                : colors.textSecondary,
                          },
                        ]}
                      >
                        {item.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name="receipt-outline" size={32} color={colors.textMuted} style={{ marginBottom: 8 }} />
                <Text style={[styles.emptyTitle, { color: colors.text, fontSize: 16 }]}>No Transactions Yet</Text>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                  Your verified package subscriptions and payments will appear here.
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
  },
  container: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 16,
  },
  loaderBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  loaderText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 16,
    marginTop: 8,
  },
  currentPackageCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
  },
  cardHeader: {
    marginBottom: 16,
  },
  cardIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    marginBottom: 12,
  },
  activePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  activePillText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '700',
  },
  separatorTeal: {
    height: 1,
    opacity: 0.2,
    marginVertical: 16,
  },
  detailRow: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  renewBtn: {
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  renewBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  historyList: {
    gap: 16,
  },
  historyCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
  },
  historyAmount: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 14,
    marginBottom: 2,
  },
  historyRef: {
    fontSize: 12,
    marginBottom: 12,
  },
  statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
});
