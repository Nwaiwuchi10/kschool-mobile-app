import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/store/AuthContext';
import { useClass } from '@/store/ClassContext';
import { useAppTheme } from '@/hooks/useAppTheme';
import { studentDashboardService, StudentDashboardData } from '@/services/dashboard.service';

export default function HomeScreen() {
  const { user } = useAuth();
  const { selectedClass } = useClass();
  const { colors, isDark } = useAppTheme();
  const currentClass = selectedClass || user?.class || 'JSS 1';

  const [dashboardData, setDashboardData] = useState<StudentDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const displayName = dashboardData?.student.firstName || user?.firstName || 'Student';
  const initial = displayName.charAt(0).toUpperCase();

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

  const loadDashboard = useCallback(async () => {
    try {
      const data = await studentDashboardService.getDashboardData(currentClass, user?.id);
      setDashboardData(data);
    } catch (err) {
      console.warn('Failed to load live student dashboard data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [currentClass, user?.id]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadDashboard();
  };

  const overallProgress = dashboardData?.overallProgress.percentage || 0;
  const completedTopics = dashboardData?.overallProgress.completedTopics || 0;
  const totalTopics = dashboardData?.overallProgress.totalTopics || 0;
  const currentLearning = dashboardData?.currentLearning;
  const subjects = dashboardData?.subjects || [];
  const recentQuizResults = dashboardData?.recentQuizResults || [];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScrollView 
        contentContainerStyle={styles.container} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.profileSection}>
            <View style={[styles.avatar, { backgroundColor: colors.primaryMint, borderColor: colors.primary }]}>
              <Text style={[styles.avatarText, { color: colors.primary }]}>{initial}</Text>
            </View>
            <View>
              <Text style={[styles.greeting, { color: colors.text }]}>Good day, {displayName}</Text>
              <Text style={[styles.subGreeting, { color: colors.textSecondary }]}>
                Enrolled in <Text style={{ fontWeight: '700', color: colors.primary }}>{currentClass}</Text>
              </Text>
            </View>
          </View>
          <TouchableOpacity 
            style={[styles.notificationBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} 
            onPress={() => router.push('/notifications')}
          >
            <Ionicons name="notifications-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading curriculum data...</Text>
          </View>
        ) : (
          <>
            {/* Highlight Card */}
            {currentLearning ? (
              <View style={[styles.highlightCard, { backgroundColor: colors.cardHighlightBg, borderColor: colors.cardHighlightBorder }]}>
                <View style={styles.highlightHeader}>
                  <View style={[styles.highlightIcon, { backgroundColor: colors.primary }]}>
                    <Ionicons name="book" size={24} color="#FFFFFF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.highlightTitle, { color: colors.text }]}>{currentLearning.subjectName}</Text>
                    <Text style={[styles.highlightSub, { color: colors.textSecondary }]}>Current Topic: {currentLearning.topicTitle}</Text>
                  </View>
                </View>

                <View style={styles.progressRow}>
                  <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>Status</Text>
                  <Text style={[styles.progressValue, { color: colors.primary }]}>
                    {currentLearning.totalLessons > 0 ? `${currentLearning.totalLessons} Lessons Available` : 'Ready to Start'}
                  </Text>
                </View>
                <View style={[styles.progressBarBg, { backgroundColor: isDark ? colors.surfaceAlt : '#FFFFFF' }]}>
                  <View style={[styles.progressBarFill, { backgroundColor: colors.primary, width: currentLearning.totalLessons > 0 ? '40%' : '10%' }]} />
                </View>

                <TouchableOpacity 
                  style={[styles.continueBtn, { backgroundColor: colors.primary }]} 
                  onPress={() => {
                    router.push({
                      pathname: '/(tabs)/subject-details',
                      params: { id: currentLearning.subjectId, name: currentLearning.subjectName },
                    });
                  }}
                >
                  <Text style={styles.continueBtnText}>Continue Learning</Text>
                </TouchableOpacity>
              </View>
            ) : subjects.length > 0 ? (
              <View style={[styles.highlightCard, { backgroundColor: colors.cardHighlightBg, borderColor: colors.cardHighlightBorder }]}>
                <View style={styles.highlightHeader}>
                  <View style={[styles.highlightIcon, { backgroundColor: colors.primary }]}>
                    <Ionicons name="school" size={24} color="#FFFFFF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.highlightTitle, { color: colors.text }]}>{subjects[0].name}</Text>
                    <Text style={[styles.highlightSub, { color: colors.textSecondary }]}>Explore {currentClass} Curriculum</Text>
                  </View>
                </View>

                <TouchableOpacity 
                  style={[styles.continueBtn, { backgroundColor: colors.primary }]} 
                  onPress={() => {
                    router.push({
                      pathname: '/(tabs)/subject-details',
                      params: { id: subjects[0]._id, name: subjects[0].name },
                    });
                  }}
                >
                  <Text style={styles.continueBtnText}>Start Learning</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {/* Overall Progress */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Overall Progress</Text>
            <View style={[styles.overallCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.circularProgressContainer}>
                <View style={[styles.circularProgressOuter, { borderColor: colors.border }]}>
                  <View style={[styles.circularProgressInner, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.circularProgressText, { color: colors.text }]}>{overallProgress}%</Text>
                  </View>
                </View>
                {overallProgress > 0 && <View style={[styles.arcRight, { borderColor: colors.primary }]} />}
              </View>
              <Text style={[styles.overallText, { color: colors.textSecondary }]}>
                {totalTopics > 0 
                  ? `${completedTopics} of ${totalTopics} topics completed` 
                  : 'Enrollment active - 0 topics completed'}
              </Text>
              <View style={[styles.smallProgressBarBg, { backgroundColor: colors.surfaceAlt }]}>
                <View style={[styles.smallProgressBarFill, { backgroundColor: colors.primary, width: `${Math.max(5, overallProgress)}%` }]} />
              </View>
            </View>

            {/* My Subjects */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>My Subjects ({subjects.length})</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/subjects')}>
                <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
              </TouchableOpacity>
            </View>

            {subjects.length === 0 ? (
              <View style={[styles.emptySubjectsBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name="folder-open-outline" size={32} color={colors.textMuted} />
                <Text style={[styles.emptySubjectsText, { color: colors.textSecondary }]}>No subjects uploaded for {currentClass} yet.</Text>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subjectsScroll}>
                {subjects.map((subj) => (
                  <TouchableOpacity
                    key={subj._id}
                    style={[styles.subjectCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => {
                      router.push({
                        pathname: '/(tabs)/subject-details',
                        params: { id: subj._id, name: subj.name },
                      });
                    }}
                  >
                    <View style={[styles.subjectIconBox, { backgroundColor: colors.primaryMint }]}>
                      <Ionicons name={getSubjectIcon(subj.name)} size={20} color={colors.primary} />
                    </View>
                    <Text style={[styles.subjectName, { color: colors.text }]} numberOfLines={1}>{subj.name}</Text>
                    <Text style={[styles.subjectCount, { color: colors.textSecondary }]}>{subj.totalTopics} topics</Text>
                    <View style={[styles.tinyProgressBarBg, { backgroundColor: colors.surfaceAlt }]}>
                      <View style={[styles.tinyProgressBarFill, { backgroundColor: colors.primary, width: `${Math.max(4, subj.progress)}%` }]} />
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* Current Learning Section */}
            {currentLearning && (
              <>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Current Learning</Text>
                <TouchableOpacity 
                  style={[styles.currentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => {
                    router.push({
                      pathname: '/(tabs)/subject-details',
                      params: { id: currentLearning.subjectId, name: currentLearning.subjectName },
                    });
                  }}
                >
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={[styles.currentSubject, { color: colors.primary }]}>{currentLearning.subjectName.toUpperCase()}</Text>
                    <Text style={[styles.currentTopic, { color: colors.text }]}>{currentLearning.topicTitle}</Text>
                  </View>
                  <View style={[styles.inProgressBadge, { backgroundColor: colors.badgeYellowBg }]}>
                    <View style={[styles.inProgressDot, { backgroundColor: colors.badgeYellowText }]} />
                    <Text style={[styles.inProgressText, { color: colors.badgeYellowText }]}>{currentLearning.status}</Text>
                  </View>
                </TouchableOpacity>
              </>
            )}

            {/* Recent Activity / Results */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Activity</Text>
            {recentQuizResults.length > 0 ? (
              recentQuizResults.map((result) => (
                <View key={result.id} style={[styles.activityCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.activityLeft}>
                    <View style={result.passed ? [styles.activityIconCompleted, { backgroundColor: colors.successBg }] : [styles.activityIconProgress, { backgroundColor: colors.warningBg }]}>
                      <Ionicons 
                        name={result.passed ? 'checkmark' : 'time-outline'} 
                        size={16} 
                        color={result.passed ? colors.success : colors.warning} 
                      />
                    </View>
                    <View>
                      <Text style={[styles.activityName, { color: colors.text }]}>{result.title}</Text>
                      <Text style={{ fontSize: 12, color: colors.textSecondary }}>Score: {result.score}</Text>
                    </View>
                  </View>
                  <Text style={result.passed ? styles.activityStatusCompleted : styles.activityStatusProgress}>
                    {result.passed ? 'Passed' : 'Needs Review'}
                  </Text>
                </View>
              ))
            ) : subjects.length > 0 ? (
              <View style={[styles.activityCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.activityLeft}>
                  <View style={[styles.activityIconCompleted, { backgroundColor: colors.successBg }]}>
                    <Ionicons name="checkmark" size={16} color={colors.success} />
                  </View>
                  <View>
                    <Text style={[styles.activityName, { color: colors.text }]}>Enrolled in {currentClass}</Text>
                    <Text style={{ fontSize: 12, color: colors.textSecondary }}>{subjects.length} Subjects Ready</Text>
                  </View>
                </View>
                <Text style={styles.activityStatusCompleted}>Active</Text>
              </View>
            ) : (
              <View style={[styles.emptyActivityCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.emptyActivityText, { color: colors.textSecondary }]}>No recent activities yet. Start a lesson to see your progress here!</Text>
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
  container: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#D1FAE5', // Light mint
    borderWidth: 2,
    borderColor: '#127A71',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#127A71',
  },
  greeting: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  subGreeting: {
    fontSize: 14,
    color: '#6B7280',
  },
  notificationBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  highlightCard: {
    backgroundColor: '#E0F2F1', // Light teal
    borderRadius: 20,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#127A71',
  },
  highlightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  highlightIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#127A71',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  highlightTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  highlightSub: {
    fontSize: 14,
    color: '#4B5563',
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  progressValue: {
    fontSize: 14,
    color: '#127A71',
    fontWeight: '700',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    marginBottom: 20,
  },
  progressBarFill: {
    height: 8,
    backgroundColor: '#127A71',
    borderRadius: 4,
  },
  continueBtn: {
    backgroundColor: '#127A71',
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '700',
    color: '#127A71',
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
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  circularProgressOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 8,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
  },
  arcRight: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 8,
    borderColor: '#127A71',
    borderLeftColor: 'transparent',
    borderBottomColor: 'transparent',
    transform: [{ rotate: '45deg' }],
    position: 'absolute',
  },
  circularProgressInner: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circularProgressText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  overallText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  smallProgressBarBg: {
    width: '60%',
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
  },
  smallProgressBarFill: {
    height: 6,
    backgroundColor: '#127A71',
    borderRadius: 3,
  },
  subjectsScroll: {
    marginLeft: -24,
    paddingLeft: 24,
    marginBottom: 32,
  },
  subjectCard: {
    width: 130,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
  },
  subjectIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  subjectName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  subjectCount: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
  },
  tinyProgressBarBg: {
    height: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 2,
  },
  tinyProgressBarFill: {
    height: 4,
    backgroundColor: '#127A71',
    borderRadius: 2,
  },
  currentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 32,
  },
  currentSubject: {
    fontSize: 12,
    fontWeight: '700',
    color: '#127A71',
    marginBottom: 4,
  },
  currentTopic: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  inProgressBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  inProgressDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D97706',
    marginRight: 6,
  },
  inProgressText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
  },
  activityCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  activityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityIconCompleted: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityIconProgress: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  activityStatusCompleted: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  activityStatusProgress: {
    fontSize: 14,
    fontWeight: '600',
    color: '#127A71',
  },
  loadingContainer: {
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
  emptySubjectsBox: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  emptySubjectsText: {
    marginTop: 8,
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
  emptyActivityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyActivityText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
});
