import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/store/AuthContext';
import { useClass } from '@/store/ClassContext';
import { studentDashboardService, StudentDashboardData } from '@/services/dashboard.service';
import { useAppTheme } from '@/hooks/useAppTheme';

export default function ProgressScreen() {
  const { colors, isDark } = useAppTheme();
  const { user } = useAuth();
  const { selectedClass } = useClass();
  const currentClass = selectedClass || user?.class || 'JSS 1';

  const [dashboardData, setDashboardData] = useState<StudentDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const getSubjectIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('math')) return 'calculator-outline' as const;
    if (lower.includes('english')) return 'book-outline' as const;
    if (lower.includes('science') || lower.includes('physics') || lower.includes('chemistry') || lower.includes('biology')) return 'flask-outline' as const;
    if (lower.includes('tech') || lower.includes('computer')) return 'hardware-chip-outline' as const;
    if (lower.includes('civic')) return 'shield-outline' as const;
    if (lower.includes('social')) return 'globe-outline' as const;
    if (lower.includes('business')) return 'briefcase-outline' as const;
    if (lower.includes('agric')) return 'leaf-outline' as const;
    if (lower.includes('health') || lower.includes('physical')) return 'pulse-outline' as const;
    return 'school-outline' as const;
  };

  const loadProgressData = useCallback(async () => {
    try {
      const data = await studentDashboardService.getDashboardData(currentClass, user?.id);
      setDashboardData(data);
    } catch (err) {
      console.warn('Failed to load progress from backend:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [currentClass, user?.id]);

  useEffect(() => {
    loadProgressData();
  }, [loadProgressData]);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadProgressData();
  };

  const overallProgress = dashboardData?.overallProgress.percentage || 0;
  const completedTopics = dashboardData?.overallProgress.completedTopics || 0;
  const totalTopics = dashboardData?.overallProgress.totalTopics || 0;
  const subjects = dashboardData?.subjects || [];
  const recentResults = dashboardData?.recentQuizResults || [];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.push('/(tabs)')}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Learning Progress</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.container} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading learning progress...</Text>
          </View>
        ) : (
          <>
            {/* Overall Progress Card */}
            <View style={[styles.overallCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.circularProgressContainer}>
                <View style={[styles.circularProgressOuter, { borderColor: colors.border }]}>
                  <View style={[styles.circularProgressInner, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.circularProgressText, { color: colors.text }]}>{overallProgress}%</Text>
                    <Text style={[styles.circularProgressLabel, { color: colors.textSecondary }]}>OVERALL</Text>
                  </View>
                </View>
                {overallProgress > 0 && <View style={[styles.arcRight, { borderColor: colors.primary }]} />}
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statCol}>
                  <View style={[styles.statBadgeCompleted, { backgroundColor: colors.successBg }]}>
                    <Ionicons name="checkmark" size={14} color={colors.success} />
                    <Text style={[styles.statBadgeTextCompleted, { color: colors.success }]}> {completedTopics}</Text>
                  </View>
                  <Text style={[styles.statDesc, { color: colors.textSecondary }]}>Completed</Text>
                </View>
                <View style={styles.statCol}>
                  <View style={[styles.statBadgeProgress, { backgroundColor: colors.warningBg }]}>
                    <Ionicons name="hourglass-outline" size={14} color={colors.warning} />
                    <Text style={[styles.statBadgeTextProgress, { color: colors.warning }]}> {Math.max(0, totalTopics - completedTopics)}</Text>
                  </View>
                  <Text style={[styles.statDesc, { color: colors.textSecondary }]}>In Progress</Text>
                </View>
                <View style={styles.statCol}>
                  <View style={[styles.statBadgeTotal, { backgroundColor: colors.surfaceAlt }]}>
                    <Ionicons name="book-outline" size={14} color={colors.textSecondary} />
                    <Text style={[styles.statBadgeTextTotal, { color: colors.text }]}> {totalTopics}</Text>
                  </View>
                  <Text style={[styles.statDesc, { color: colors.textSecondary }]}>Total Topics</Text>
                </View>
              </View>
              
              <View style={[styles.bottomBarBg, { backgroundColor: colors.surfaceAlt }]}>
                <View style={[styles.bottomBarFill, { width: `${Math.max(5, overallProgress)}%`, backgroundColor: colors.primary }]} />
              </View>
            </View>

            {/* Subject Progress */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Subject Progress ({subjects.length})</Text>
            {subjects.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name="folder-open-outline" size={32} color={colors.textMuted} />
                <Text style={[styles.emptyCardText, { color: colors.textSecondary }]}>No curriculum subjects loaded for {currentClass} yet.</Text>
              </View>
            ) : (
              <View style={styles.listContainer}>
                {subjects.map((subject) => (
                  <TouchableOpacity 
                    key={subject._id} 
                    style={[styles.subjectCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => {
                      router.push({
                        pathname: '/(tabs)/subject-details',
                        params: { id: subject._id, name: subject.name },
                      });
                    }}
                  >
                    <View style={[styles.iconBox, { backgroundColor: colors.primaryMint }]}>
                      <Ionicons name={getSubjectIcon(subject.name)} size={24} color={colors.primary} />
                    </View>
                    <View style={styles.cardContent}>
                      <View style={styles.cardHeader}>
                        <Text style={[styles.subjectName, { color: colors.text }]}>{subject.name}</Text>
                        <Text style={[styles.progressText, { color: colors.primary }]}>{subject.progress}%</Text>
                      </View>
                      <Text style={[styles.topicsText, { color: colors.textSecondary }]}>{subject.completedTopics} of {subject.totalTopics} topics completed</Text>
                      <View style={[styles.progressBarBg, { backgroundColor: colors.surfaceAlt }]}>
                        <View style={[styles.progressBarFill, { width: `${Math.max(4, subject.progress)}%`, backgroundColor: colors.primary }]} />
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Recent Results */}
            <Text style={[styles.sectionTitle, { marginTop: 32, color: colors.text }]}>Recent Results</Text>
            {recentResults.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.emptyCardText, { color: colors.textSecondary }]}>No quiz or practice results recorded yet. Take an exercise quiz to track your mastery!</Text>
              </View>
            ) : (
              <View style={styles.resultsContainer}>
                {recentResults.map((result) => (
                  <View key={result.id} style={[styles.resultCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View>
                      <Text style={[styles.resultTitle, { color: colors.text }]}>{result.title}</Text>
                      <Text style={[styles.resultScore, { color: colors.textSecondary }]}>Score: {result.score}</Text>
                    </View>
                    <View style={[
                      styles.badge, 
                      result.passed 
                        ? { backgroundColor: colors.successBg } 
                        : { backgroundColor: colors.dangerBg }
                    ]}>
                      <Text style={[
                        styles.badgeText,
                        result.passed 
                          ? { color: colors.success } 
                          : { color: colors.danger }
                      ]}>
                        {result.passed ? 'Passed' : 'Failed'}
                      </Text>
                    </View>
                  </View>
                ))}
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
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  container: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  overallCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 32,
  },
  circularProgressContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  circularProgressOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 10,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
  },
  arcRight: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 10,
    borderColor: '#127A71',
    borderLeftColor: 'transparent',
    borderBottomColor: 'transparent',
    transform: [{ rotate: '45deg' }],
    position: 'absolute',
  },
  circularProgressInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circularProgressText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1A1A1A',
  },
  circularProgressLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 24,
  },
  statCol: {
    alignItems: 'center',
  },
  statBadgeCompleted: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 8,
  },
  statBadgeTextCompleted: {
    fontSize: 12,
    fontWeight: '800',
    color: '#10B981',
  },
  statBadgeProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 8,
  },
  statBadgeTextProgress: {
    fontSize: 12,
    fontWeight: '800',
    color: '#D97706',
  },
  statBadgeTotal: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 8,
  },
  statBadgeTextTotal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4B5563',
  },
  statDesc: {
    fontSize: 12,
    color: '#6B7280',
  },
  bottomBarBg: {
    width: '100%',
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
  },
  bottomBarFill: {
    height: 6,
    backgroundColor: '#127A71',
    borderRadius: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  listContainer: {
    gap: 16,
  },
  subjectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    padding: 16,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  progressText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#127A71',
  },
  topicsText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
  },
  progressBarFill: {
    height: 6,
    backgroundColor: '#127A71',
    borderRadius: 3,
  },
  resultsContainer: {
    gap: 12,
  },
  resultCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  resultScore: {
    fontSize: 14,
    color: '#6B7280',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgePassed: {
    backgroundColor: '#D1FAE5',
  },
  badgeFailed: {
    backgroundColor: '#FEE2E2',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  badgeTextPassed: {
    color: '#10B981',
  },
  badgeTextFailed: {
    color: '#EF4444',
  },
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    padding: 16,
    marginTop: 24,
  },
  streakIconBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  streakContent: {
    flex: 1,
  },
  streakTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  streakDesc: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  loadingBox: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyCardText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 6,
  },
});
