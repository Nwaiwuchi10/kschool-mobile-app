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
import PrimaryButton from '@/components/ui/PrimaryButton';
import { lessonService, MobileLesson } from '@/services/lesson.service';
import { quizService, MobileQuiz } from '@/services/quiz.service';
import { subscriptionService } from '@/services/subscription.service';
import { useAppTheme } from '@/hooks/useAppTheme';

export default function TopicDetailsScreen() {
  const { colors, isDark } = useAppTheme();
  const params = useLocalSearchParams<{
    topicId?: string;
    topicTitle?: string;
    subjectName?: string;
  }>();

  const [lessons, setLessons] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<MobileQuiz[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSubscription, setHasSubscription] = useState<boolean>(false);

  const topicTitle = params.topicTitle || 'Topic Details';
  const subjectName = params.subjectName || 'Subject';

  useEffect(() => {
    let isMounted = true;
    const fetchTopicContent = async () => {
      if (!params.topicId) return;

      try {
        setIsLoading(true);
        const [fetchedLessons, fetchedQuizzes, subStatus] = await Promise.allSettled([
          lessonService.getLessonsByTopic(params.topicId),
          quizService.getQuizzesByTopic(params.topicId),
          subscriptionService.getMyActiveSubscription().catch(() => null),
        ]);

        if (isMounted) {
          const isSubscribed =
            subStatus.status === 'fulfilled' &&
            !!subStatus.value &&
            (subStatus.value.status === 'active' || subStatus.value.status === 'grace');

          setHasSubscription(isSubscribed);

          if (fetchedLessons.status === 'fulfilled') {
            const mapped = fetchedLessons.value.map((l, idx) => {
              // For first timers (isSubscribed === false), only lesson index 0 is unlocked.
              // All other lessons (idx > 0) are locked and require payment.
              const isLocked = !isSubscribed && idx > 0;

              return {
                id: (idx + 1).toString().padStart(2, '0'),
                _id: l._id,
                title: l.title,
                format: l.audioUrl ? 'TTS Audio & Text' : 'Text Lesson',
                duration: l.duration || '10 mins',
                isLocked,
              };
            });
            setLessons(mapped);
          }

          if (fetchedQuizzes.status === 'fulfilled') {
            setQuizzes(fetchedQuizzes.value);
          }
        }
      } catch (err) {
        console.warn('Error fetching topic content:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchTopicContent();
    return () => {
      isMounted = false;
    };
  }, [params.topicId]);

  const maxLessons = 4; // Topic max lessons sequence constraint

  const handleLessonPress = async (lesson: any, index: number) => {
    // If locked for first-timers, direct to payment / premium access
    if (lesson.isLocked) {
      router.push('/premium-access');
      return;
    }

    try {
      const access = await subscriptionService.checkAccess(params.topicId, lesson._id);
      if (!access.canAccess) {
        router.push('/premium-access');
        return;
      }
    } catch {
      // Allow in offline mode
    }

    router.push({
      pathname: '/lesson',
      params: {
        id: lesson._id,
        title: lesson.title,
        subject: `${subjectName} > ${topicTitle}`,
        topicId: params.topicId,
        lessonIndex: (index + 1).toString(),
        totalLessons: Math.min(lessons.length, maxLessons).toString(),
      },
    });
  };

  const handleStartLearning = () => {
    if (lessons.length > 0) {
      handleLessonPress(lessons[0], 0);
    } else {
      router.push('/lesson');
    }
  };

  const handleQuizPress = async (quiz: any) => {
    try {
      const access = await subscriptionService.checkAccess(params.topicId);
      if (!access.canAccess) {
        router.push('/premium-access');
        return;
      }
    } catch {}

    router.push({
      pathname: '/quiz',
      params: { quizId: quiz._id, title: quiz.title, topicId: params.topicId },
    });
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
              router.replace('/(tabs)/subjects');
            }
          }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {subjectName}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {isLoading && (
          <View style={[styles.loadingBanner, { backgroundColor: colors.cardHighlightBg }]}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.loadingBannerText, { color: colors.primary }]}>Loading topic syllabus...</Text>
          </View>
        )}

        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.tagsRow}>
            <View style={[styles.freeTag, { backgroundColor: colors.primaryMint }]}>
              <Text style={[styles.freeTagText, { color: colors.primary }]}>CURRICULUM TOPIC</Text>
            </View>
            <View style={styles.featuresTags}>
              <View style={[styles.featureTag, { backgroundColor: colors.surfaceAlt }]}>
                <Ionicons name="volume-high-outline" size={12} color={colors.primary} />
                <Text style={[styles.featureTagText, { color: colors.textSecondary }]}> Google TTS</Text>
              </View>
              <View style={[styles.featureTag, { backgroundColor: colors.surfaceAlt }]}>
                <Ionicons name="checkbox-outline" size={12} color={colors.primary} />
                <Text style={[styles.featureTagText, { color: colors.textSecondary }]}> Quiz</Text>
              </View>
            </View>
          </View>

          <Text style={[styles.title, { color: colors.text }]}>{topicTitle}</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            Explore core concepts, guided explanations, and practice questions tailored to your class
            curriculum.
          </Text>

          <View style={styles.progressRow}>
            <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>Study Progress</Text>
            <Text style={[styles.progressPercent, { color: colors.primary }]}>
              {lessons.length > 0 ? `0/${lessons.length} Completed` : '0% Complete'}
            </Text>
          </View>
          <View style={[styles.progressBarBg, { backgroundColor: colors.surfaceAlt }]}>
            <View style={[styles.progressBarFill, { width: '15%', backgroundColor: colors.primary }]} />
          </View>
          <Text style={[styles.lessonsCompletedText, { color: colors.textMuted }]}>
            {lessons.length} lesson{lessons.length === 1 ? '' : 's'} available with AI narration
          </Text>
        </View>

        {/* Lessons List */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Included Lessons</Text>
        <View style={styles.lessonsContainer}>
          {lessons.length > 0 ? (
            lessons.map((lesson, idx) => {
              const isLocked = lesson.isLocked;

              return (
                <TouchableOpacity
                  key={lesson.id}
                  style={[
                    styles.lessonCard,
                    {
                      backgroundColor: isLocked ? colors.surfaceAlt : colors.surface,
                      borderColor: isLocked ? colors.border : colors.border,
                      opacity: isLocked ? 0.85 : 1,
                    },
                  ]}
                  onPress={() => handleLessonPress(lesson, idx)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.lessonNumberBox,
                      { backgroundColor: isLocked ? colors.surface : colors.surfaceAlt },
                    ]}
                  >
                    {isLocked ? (
                      <Ionicons name="lock-closed" size={16} color={colors.textMuted} />
                    ) : (
                      <Text style={[styles.lessonNumberText, { color: colors.textSecondary }]}>{lesson.id}</Text>
                    )}
                  </View>
                  <View style={styles.lessonContent}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text
                        style={[
                          styles.lessonTitle,
                          { color: isLocked ? colors.textSecondary : colors.text },
                        ]}
                        numberOfLines={1}
                      >
                        {lesson.title}
                      </Text>
                      {isLocked && (
                        <View style={{ backgroundColor: '#FEE2E2', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6 }}>
                          <Text style={{ fontSize: 9, fontWeight: '800', color: '#DC2626' }}>LOCKED</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.lessonMetaRow}>
                      <Text
                        style={[
                          styles.lessonFormat,
                          { color: isLocked ? colors.textMuted : colors.primary },
                        ]}
                      >
                        {isLocked ? 'Subscribe to Unlock' : lesson.format}
                      </Text>
                      <Text style={[styles.lessonDot, { color: colors.textMuted }]}> • </Text>
                      <Text style={[styles.lessonDuration, { color: colors.textSecondary }]}>{lesson.duration}</Text>
                    </View>
                  </View>
                  {isLocked ? (
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: colors.surface,
                        borderWidth: 1,
                        borderColor: colors.border,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name="lock-closed" size={16} color={colors.textMuted} />
                    </View>
                  ) : (
                    <Ionicons name="play-circle" size={32} color={colors.primary} />
                  )}
                </TouchableOpacity>
              );
            })
          ) : !isLoading ? (
            <View style={[styles.emptyLessonsBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="book-outline" size={28} color={colors.textMuted} style={{ marginBottom: 6 }} />
              <Text style={[styles.emptyLessonsText, { color: colors.textSecondary }]}>
                No lessons uploaded for this topic yet.
              </Text>
            </View>
          ) : null}
        </View>

        {/* Quizzes Section if available */}
        {quizzes.length > 0 && (
          <View style={{ marginTop: 24, marginBottom: 12 }}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Topic Knowledge Assessment</Text>
            {quizzes.map((quiz) => (
              <TouchableOpacity
                key={quiz._id}
                style={[styles.quizCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => handleQuizPress(quiz)}
              >
                <View style={[styles.quizIconBox, { backgroundColor: colors.primaryMint }]}>
                  <Ionicons name="ribbon-outline" size={24} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.quizTitle, { color: colors.text }]}>{quiz.title}</Text>
                  <Text style={[styles.quizDesc, { color: colors.textSecondary }]}>
                    {quiz.questions?.length || 0} questions • 70% passing grade
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <PrimaryButton title="Start Learning" onPress={handleStartLearning} />
        </View>
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
  loadingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F4F2',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  loadingBannerText: {
    fontSize: 13,
    color: '#127A71',
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
  },
  tagsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  freeTag: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  freeTagText: {
    color: '#127A71',
    fontWeight: '800',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  featuresTags: {
    flexDirection: 'row',
    gap: 8,
  },
  featureTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  featureTagText: {
    color: '#4B5563',
    fontWeight: '600',
    fontSize: 11,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1A1A1A',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
    marginBottom: 20,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  progressPercent: {
    fontSize: 13,
    fontWeight: '700',
    color: '#127A71',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginBottom: 8,
  },
  progressBarFill: {
    height: 6,
    backgroundColor: '#127A71',
    borderRadius: 3,
  },
  lessonsCompletedText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  lessonsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  lessonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
  },
  lessonNumberBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  lessonNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
  },
  lessonContent: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  lessonMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lessonFormat: {
    fontSize: 12,
    color: '#127A71',
    fontWeight: '600',
  },
  lessonDot: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  lessonDuration: {
    fontSize: 12,
    color: '#6B7280',
  },
  quizCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  quizIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  quizTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  quizDesc: {
    fontSize: 12,
    color: '#6B7280',
  },
  actionsContainer: {
    marginTop: 8,
  },
  emptyLessonsBox: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyLessonsText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});
