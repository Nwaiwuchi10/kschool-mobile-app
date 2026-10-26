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
import { router, useLocalSearchParams } from 'expo-router';
import { subjectService } from '@/services/subject.service';
import { subscriptionService } from '@/services/subscription.service';
import { quizService } from '@/services/quiz.service';
import { authService } from '@/services/auth.service';
import { useAppTheme } from '@/hooks/useAppTheme';
import ResponseMessageModal from '@/components/ui/ResponseMessageModal';

export interface CurriculumItem {
  id: string; // e.g. "01", "02"
  _id: string;
  title: string;
  subtitle: string;
  status: 'active' | 'completed' | 'locked';
  isLocked: boolean;
  topicId?: string;
  duration?: string;
  lockReason?: 'subscription_required' | 'quiz_required';
  requiredQuizTopicTitle?: string;
}

export default function SubjectDetailsScreen() {
  const { colors, isDark } = useAppTheme();
  const params = useLocalSearchParams<{ id?: string; name?: string }>();
  const subjectId = params.id;
  const subjectName = params.name || 'Subject Curriculum';

  const [items, setItems] = useState<CurriculumItem[]>([]);
  const [progress, setProgress] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSubscription, setHasSubscription] = useState(false);

  // Modal alert for locked topics
  const [lockModal, setLockModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'warning' | 'info';
    primaryText?: string;
    targetTopicId?: string;
    action?: 'subscribe' | 'take_quiz';
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  });

  useEffect(() => {
    const fetchSubjectDetails = async () => {
      if (!subjectId) return;

      try {
        setIsLoading(true);
        const [subStatus, data, quizResults, userProfile] = await Promise.all([
          subscriptionService.getMyActiveSubscription().catch(() => null),
          subjectService.getSubjectById(subjectId),
          quizService.getUserResults().catch(() => []),
          authService.getProfile().catch(() => null),
        ]);

        const isSubscribed =
          !!subStatus &&
          (subStatus.status === 'active' || subStatus.status === 'grace');
        setHasSubscription(isSubscribed);

        // Build set of topics whose quiz has been completed/passed
        const completedTopicIds = new Set<string>();

        // 1. From user quiz results (passed quizzes)
        if (Array.isArray(quizResults)) {
          quizResults.forEach((r: any) => {
            if (r.passed) {
              const quizTopicId = r.quiz?.topic?._id || r.quiz?.topic;
              if (quizTopicId) completedTopicIds.add(quizTopicId.toString());
            }
          });
        }

        // 2. From user profile attended/completed topics
        if (userProfile?.attendedTopics && Array.isArray(userProfile.attendedTopics)) {
          userProfile.attendedTopics.forEach((tId: string) => {
            if (tId) completedTopicIds.add(tId.toString());
          });
        }

        const rawTopics = data?.topics || [];

        // Map topic items with strict quiz-gated progression
        let previousTopicCompleted = true; // First topic is always unlocked to study
        let activeFound = false;

        const mappedList: CurriculumItem[] = rawTopics.map((topic: any, idx: number) => {
          const numStr = (idx + 1).toString().padStart(2, '0');
          const topicIdStr = (topic._id || '').toString();
          const isTopicQuizPassed = completedTopicIds.has(topicIdStr);

          let isLocked = false;
          let lockReason: 'subscription_required' | 'quiz_required' | undefined = undefined;
          let requiredQuizTopicTitle: string | undefined = undefined;

          // Topic 0: Free complimentary topic.
          // Topic > 0: Requires subscription AND completion of previous topic's quiz.
          if (idx > 0 && !isSubscribed) {
            isLocked = true;
            lockReason = 'subscription_required';
          } else if (idx > 0 && !previousTopicCompleted) {
            isLocked = true;
            lockReason = 'quiz_required';
            const prevTopic = rawTopics[idx - 1];
            requiredQuizTopicTitle = prevTopic?.title || `Topic ${(idx).toString().padStart(2, '0')}`;
          }

          let status: 'active' | 'completed' | 'locked' = 'locked';
          if (isTopicQuizPassed) {
            status = 'completed';
          } else if (!isLocked && !activeFound) {
            status = 'active';
            activeFound = true;
          } else if (isLocked) {
            status = 'locked';
          } else {
            status = 'active';
          }

          // Update progression tracker for the next topic in list
          previousTopicCompleted = isTopicQuizPassed;

          const lessons = topic.lessons || [];
          const subtitle = lessons.length > 0
            ? `${lessons.length} lesson${lessons.length === 1 ? '' : 's'} • Assessment`
            : 'Curriculum Topic';

          return {
            id: numStr,
            _id: topic._id,
            title: topic.title,
            subtitle,
            status,
            isLocked,
            topicId: topic._id,
            duration: `${lessons.length * 10 || 15} mins`,
            lockReason,
            requiredQuizTopicTitle,
          };
        });

        // Calculate actual completion progress
        const completedCount = mappedList.filter((item) => item.status === 'completed').length;
        const totalCount = Math.max(mappedList.length, 1);
        const calculatedProgress = Math.min(
          100,
          Math.max(0, Math.round((completedCount / totalCount) * 100)),
        );

        setItems(mappedList);
        setProgress(calculatedProgress || (isSubscribed ? 30 : 10));
      } catch (err) {
        console.warn('Failed to fetch subject curriculum details:', err);
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubjectDetails();
  }, [subjectId]);

  const handleItemPress = (item: CurriculumItem) => {
    if (item.isLocked) {
      if (item.lockReason === 'quiz_required') {
        setLockModal({
          visible: true,
          type: 'warning',
          title: 'Quiz Required',
          message: `You must complete and submit the quiz for "${item.requiredQuizTopicTitle || 'the previous topic'}" before unlocking this topic.`,
          primaryText: 'Take Previous Quiz',
          action: 'take_quiz',
          targetTopicId: items.find((i) => i.title === item.requiredQuizTopicTitle)?.topicId,
        });
        return;
      }

      // Subscription required
      router.push('/premium-access');
      return;
    }

    // Direct into topic details page for lessons and quiz
    router.push({
      pathname: '/topic-details',
      params: {
        topicId: item.topicId || item._id,
        topicTitle: item.title,
        subjectName: subjectName,
      },
    });
  };

  const handleContinueLearning = () => {
    const activeItem = items.find((i) => i.status === 'active' && !i.isLocked) || items[0];
    if (activeItem) {
      handleItemPress(activeItem);
    } else {
      router.push('/(tabs)/subjects');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)');
            }
          }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{subjectName}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Overall Progress Card (Image 1 & 3 style) */}
        <View
          style={[
            styles.progressCard,
            { backgroundColor: colors.cardHighlightBg, borderColor: colors.cardHighlightBorder },
          ]}
        >
          <View style={[styles.progressCardIcon, { backgroundColor: colors.primary }]}>
            <Ionicons name="layers" size={22} color="#FFFFFF" />
          </View>
          <View style={styles.progressCardContent}>
            <View style={styles.progressCardHeader}>
              <Text style={[styles.progressCardTitle, { color: colors.text }]}>Overall Progress</Text>
              <Text style={[styles.progressCardPercent, { color: colors.primary }]}>{progress}%</Text>
            </View>
            <View style={[styles.progressBarBg, { backgroundColor: colors.surfaceAlt }]}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${progress}%`, backgroundColor: colors.primary },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Syllabus Units Header with Sequential Order tag */}
        <View style={styles.syllabusHeader}>
          <Text style={[styles.syllabusTitle, { color: colors.text }]}>Syllabus Units</Text>
          <View style={styles.sequentialTag}>
            <Ionicons name="lock-closed-outline" size={13} color={colors.primary} style={{ marginRight: 4 }} />
            <Text style={[styles.sequentialText, { color: colors.primary }]}>Sequential Order</Text>
          </View>
        </View>

        {/* Content Body */}
        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading syllabus topics...</Text>
          </View>
        ) : items.length === 0 ? (
          <View style={[styles.emptyContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="documents-outline" size={48} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Lessons Uploaded Yet</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              The administrator will upload topics and lessons for {subjectName} soon.
            </Text>
          </View>
        ) : (
          <View style={styles.unitsContainer}>
            {items.map((item, idx) => {
              if (item.status === 'active') {
                return (
                  <View key={item._id || idx} style={styles.activeUnitWrapper}>
                    {/* Active highlighted green card */}
                    <TouchableOpacity
                      style={[
                        styles.unitCardActive,
                        { backgroundColor: colors.cardHighlightBg, borderColor: colors.primary },
                      ]}
                      onPress={() => handleItemPress(item)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.unitLeft}>
                        <View style={[styles.unitNumberBoxActive, { backgroundColor: colors.primary }]}>
                          <Text style={styles.unitNumberTextActive}>{item.id}</Text>
                        </View>
                        <View>
                          <Text style={[styles.unitTitle, { color: colors.text }]}>{item.title}</Text>
                          <Text style={[styles.unitSubtitleActive, { color: colors.primary }]}>Active Unit</Text>
                        </View>
                      </View>
                      <Ionicons name="play-circle" size={32} color={colors.primary} />
                    </TouchableOpacity>

                    {/* Prominent Continue Learning Button (Image 1 & 3 style) */}
                    <TouchableOpacity
                      style={[styles.continueButton, { backgroundColor: colors.primary }]}
                      onPress={handleContinueLearning}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.continueButtonText}>Continue Learning</Text>
                    </TouchableOpacity>
                  </View>
                );
              }

              // Lesson topic card (Image 3 style: 02 Pronouns, 03 Verbs, etc. with Lock outline)
              return (
                <TouchableOpacity
                  key={item._id || idx}
                  style={[
                    styles.unitCardLocked,
                    { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                  ]}
                  onPress={() => handleItemPress(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.unitLeft}>
                    <Text style={[styles.unitNumberTextLocked, { color: colors.textMuted }]}>{item.id}</Text>
                    <View style={{ marginLeft: 20, flex: 1, marginRight: 8 }}>
                      <Text style={[styles.unitTitleLocked, { color: item.status === 'completed' ? colors.text : colors.textSecondary }]}>
                        {item.title}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        <Text style={[styles.unitSubtitleLocked, { color: colors.textMuted }]}>
                          {item.lockReason === 'quiz_required'
                            ? `Take Quiz: ${item.requiredQuizTopicTitle}`
                            : item.isLocked
                            ? 'Subscribe to Unlock'
                            : item.status === 'completed'
                            ? 'Completed • Quiz Passed'
                            : item.subtitle}
                        </Text>
                      </View>
                    </View>
                  </View>
                  {item.status === 'completed' ? (
                    <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.successBg, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="checkmark" size={16} color={colors.success} />
                    </View>
                  ) : (
                    <Ionicons
                      name={item.isLocked ? 'lock-closed-outline' : 'chevron-forward'}
                      size={20}
                      color={item.lockReason === 'quiz_required' ? colors.warning : colors.textMuted}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Lock / Quiz Gate Dialog Modal */}
      <ResponseMessageModal
        visible={lockModal.visible}
        type={lockModal.type}
        title={lockModal.title}
        message={lockModal.message}
        primaryButtonText={lockModal.primaryText || 'OK'}
        secondaryButtonText="Dismiss"
        timeoutMs={0}
        showProgressBar={false}
        onPrimaryPress={() => {
          setLockModal((prev) => ({ ...prev, visible: false }));
          if (lockModal.action === 'take_quiz' && lockModal.targetTopicId) {
            router.push({
              pathname: '/topic-details',
              params: {
                topicId: lockModal.targetTopicId,
                subjectName,
              },
            });
          }
        }}
        onSecondaryPress={() => setLockModal((prev) => ({ ...prev, visible: false }))}
        onClose={() => setLockModal((prev) => ({ ...prev, visible: false }))}
      />
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
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  container: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  progressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.2,
    borderRadius: 20,
    padding: 16,
    marginBottom: 28,
  },
  progressCardIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  progressCardContent: {
    flex: 1,
  },
  progressCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressCardTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  progressCardPercent: {
    fontSize: 16,
    fontWeight: '800',
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 6,
    borderRadius: 3,
  },
  syllabusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  syllabusTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sequentialTag: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sequentialText: {
    fontSize: 12,
    fontWeight: '700',
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
  },
  unitsContainer: {
    gap: 12,
  },
  activeUnitWrapper: {
    gap: 10,
    marginBottom: 4,
  },
  unitCardActive: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
  },
  unitCardLocked: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
  },
  unitLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  unitNumberBoxActive: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  unitNumberTextActive: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  unitNumberTextLocked: {
    fontSize: 16,
    fontWeight: '800',
    width: 32,
    textAlign: 'center',
  },
  unitTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 2,
  },
  unitTitleLocked: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  unitSubtitleActive: {
    fontSize: 12,
    fontWeight: '600',
  },
  unitSubtitleLocked: {
    fontSize: 12,
    fontWeight: '500',
  },
  continueButton: {
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#127A71',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyContainer: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 12,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
});
