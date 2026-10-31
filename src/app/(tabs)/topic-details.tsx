import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams, usePathname } from 'expo-router';
import PrimaryButton from '@/components/ui/PrimaryButton';
import ResponseMessageModal from '@/components/ui/ResponseMessageModal';
import { subjectService } from '@/services/subject.service';
import { lessonService, MobileLesson } from '@/services/lesson.service';
import { quizService, MobileQuiz, QuizSubmissionResult } from '@/services/quiz.service';
import { subscriptionService } from '@/services/subscription.service';
import { authService } from '@/services/auth.service';
import { storageService } from '@/services/storage.service';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useClass } from '@/store/ClassContext';

export interface CurriculumTopicItem {
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

export default function TopicDetailsScreen() {
  const { colors, isDark } = useAppTheme();
  const { selectedClass } = useClass();
  const pathname = usePathname();
  const isFocused = pathname?.includes('topic-details');
  const params = useLocalSearchParams<{
    id?: string;
    topicId?: string;
    topicTitle?: string;
    subjectName?: string;
    subjectId?: string;
    name?: string;
  }>();

  const effectiveSubjectId = params.subjectId || params.id;
  const initialSubjectName = params.subjectName || params.name || 'Subject';

  // Subject topics list (from subject-details)
  const [topicsList, setTopicsList] = useState<CurriculumTopicItem[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string>(params.topicId || '');
  const [selectedTopicTitle, setSelectedTopicTitle] = useState<string>(params.topicTitle || '');
  const [subjectTitle, setSubjectTitle] = useState<string>(initialSubjectName);
  const [overallProgress, setOverallProgress] = useState<number>(0);

  // Reset active state whenever params change (e.g. user clicked a different subject or topic)
  useEffect(() => {
    setSelectedTopicId(params.topicId || '');
    setSelectedTopicTitle(params.topicTitle || '');
    setSubjectTitle(initialSubjectName);
    setLessons([]);
    setQuizzes([]);
    setTopicsList([]);
  }, [effectiveSubjectId, params.topicId]);

  // Lesson & quiz content for the active topic (from topic-details)
  const [lessons, setLessons] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<MobileQuiz[]>([]);
  const [quizResults, setQuizResults] = useState<QuizSubmissionResult[]>([]);
  const [isQuizPassed, setIsQuizPassed] = useState(false);
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [hasSubscription, setHasSubscription] = useState<boolean>(false);

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

  // Keep last learning context updated in storage
  useEffect(() => {
    if (selectedTopicId || effectiveSubjectId) {
      storageService.setLastLearningContext({
        topicId: selectedTopicId,
        topicTitle: selectedTopicTitle,
        subjectName: subjectTitle,
        subjectId: effectiveSubjectId,
      });
    }
  }, [selectedTopicId, selectedTopicTitle, subjectTitle, effectiveSubjectId]);

  // Main unified fetcher: loads subject syllabus, topics, and active topic lessons/quizzes
  useEffect(() => {
    if (!isFocused) return;
    let isMounted = true;

    const fetchAllData = async () => {
      try {
        setIsLoading(true);

        const [subStatus, subjectData, userQuizResults, userProfile] =
          await Promise.allSettled([
            subscriptionService.getMyActiveSubscription(selectedClass).catch(() => null),
            effectiveSubjectId ? subjectService.getSubjectById(effectiveSubjectId).catch(() => null) : Promise.resolve(null),
            quizService.getUserResults().catch(() => []),
            authService.getProfile().catch(() => null),
          ]);

        if (!isMounted) return;

        const isSubscribed =
          subStatus.status === 'fulfilled' &&
          !!subStatus.value &&
          (subStatus.value.status === 'active' || subStatus.value.status === 'grace');
        setHasSubscription(isSubscribed);

        // Passed topic quizzes set
        const completedTopicIds = new Set<string>();
        if (userQuizResults.status === 'fulfilled' && Array.isArray(userQuizResults.value)) {
          setQuizResults(userQuizResults.value);
          userQuizResults.value.forEach((r: any) => {
            if (r.passed) {
              const qTopicId = r.quiz?.topic?._id || r.quiz?.topic;
              if (qTopicId) completedTopicIds.add(qTopicId.toString());
            }
          });
        }

        // Completed lessons & attended topics from profile
        const completedSet = new Set<string>();
        if (userProfile.status === 'fulfilled' && userProfile.value) {
          if (Array.isArray(userProfile.value.completedLessons)) {
            userProfile.value.completedLessons.forEach((id: string) => completedSet.add(id.toString()));
          }
          if (Array.isArray(userProfile.value.attendedTopics)) {
            userProfile.value.attendedTopics.forEach((tId: string) => completedTopicIds.add(tId.toString()));
          }
        }
        setCompletedLessonIds(completedSet);

        // Process Subject Topics
        let currentActiveTopicId = params.topicId || selectedTopicId || '';
        let currentActiveTopicTitle = params.topicTitle || selectedTopicTitle || '';

        if (subjectData.status === 'fulfilled' && subjectData.value) {
          const sDoc = subjectData.value;
          if (sDoc.name) setSubjectTitle(sDoc.name);

          const rawTopics = Array.isArray(sDoc.topics) ? sDoc.topics : [];
          let previousTopicCompleted = true;
          let activeFound = false;

          const mappedTopics: CurriculumTopicItem[] = rawTopics.map((topic: any, idx: number) => {
            const numStr = (idx + 1).toString().padStart(2, '0');
            const topicIdStr = (topic._id || '').toString();
            const isTopicCompleted = completedTopicIds.has(topicIdStr);

            let isLocked = false;
            let lockReason: 'subscription_required' | 'quiz_required' | undefined = undefined;
            let requiredQuizTopicTitle: string | undefined = undefined;

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
            if (isTopicCompleted) {
              status = 'completed';
            } else if (!isLocked && !activeFound) {
              status = 'active';
              activeFound = true;
            } else if (isLocked) {
              status = 'locked';
            } else {
              status = 'active';
            }

            previousTopicCompleted = isTopicCompleted;

            const tLessons = topic.lessons || [];
            const subtitle =
              tLessons.length > 0
                ? `${tLessons.length} lesson${tLessons.length === 1 ? '' : 's'} • Assessment`
                : 'Curriculum Topic';

            return {
              id: numStr,
              _id: topic._id,
              title: topic.title,
              subtitle,
              status,
              isLocked,
              topicId: topic._id,
              duration: `${(tLessons.length || 1) * 10} mins`,
              lockReason,
              requiredQuizTopicTitle,
            };
          });

          setTopicsList(mappedTopics);

          // Compute overall progress across subject syllabus
          const completedCount = mappedTopics.filter((t) => t.status === 'completed').length;
          const totalCount = Math.max(mappedTopics.length, 1);
          const computedProgress = Math.min(100, Math.max(0, Math.round((completedCount / totalCount) * 100)));
          setOverallProgress(computedProgress || (isSubscribed ? 30 : 10));

          // If no active topic selected or topic does not belong to this subject, pick the first active / unlocked topic or first topic
          const topicBelongsToSubject = mappedTopics.some((t) => (t.topicId || t._id) === currentActiveTopicId);
          if (!currentActiveTopicId || !topicBelongsToSubject) {
            const candidate = mappedTopics.find((t) => t.status === 'active') || mappedTopics[0];
            if (candidate) {
              currentActiveTopicId = candidate.topicId || candidate._id;
              currentActiveTopicTitle = candidate.title;
              setSelectedTopicId(currentActiveTopicId);
              setSelectedTopicTitle(currentActiveTopicTitle);
            } else {
              currentActiveTopicId = '';
              currentActiveTopicTitle = '';
              setSelectedTopicId('');
              setSelectedTopicTitle('');
            }
          }
        }

        // Fetch lessons and quizzes for the selected active topic
        if (currentActiveTopicId) {
          const currentSubjectName =
            (subjectData.status === 'fulfilled' && subjectData.value?.name) ||
            subjectTitle ||
            initialSubjectName;
          const [fetchedLessons, fetchedQuizzes] = await Promise.allSettled([
            lessonService.getLessonsByTopic(currentActiveTopicId),
            quizService.getQuizzesByTopic(currentActiveTopicId, currentSubjectName),
          ]);

          if (isMounted) {
            // Check if active topic quiz is passed
            const isPassedThisTopic = completedTopicIds.has(currentActiveTopicId.toString());
            setIsQuizPassed(isPassedThisTopic);

            if (fetchedLessons.status === 'fulfilled') {
              const rawLessons = fetchedLessons.value || [];
              const firstLessonId = rawLessons[0]?._id?.toString();
              const hasCompletedFirstLessonAndQuiz =
                (firstLessonId && completedSet.has(firstLessonId)) ||
                isPassedThisTopic ||
                completedSet.size > 0;

              const mappedLessons = rawLessons.map((l: any, idx: number) => {
                const isCompleted = completedSet.has(l._id?.toString());
                const prevLessonCompleted =
                  idx === 0 ||
                  completedSet.has(rawLessons[idx - 1]?._id?.toString()) ||
                  hasCompletedFirstLessonAndQuiz;

                const requiresSubscription = !isSubscribed && idx > 0;
                const requiresPriorQuiz = isSubscribed && idx > 0 && !prevLessonCompleted;
                const isLocked = requiresSubscription || requiresPriorQuiz;

                return {
                  id: (idx + 1).toString().padStart(2, '0'),
                  _id: l._id,
                  title: l.title,
                  format: l.audioUrl ? 'TTS Audio & Text' : 'Text Lesson',
                  duration: l.duration || '10 mins',
                  isLocked,
                  requiresSubscription,
                  requiresPriorQuiz,
                  isCompleted,
                };
              });
              setLessons(mappedLessons);
            } else {
              setLessons([]);
            }

            if (fetchedQuizzes.status === 'fulfilled') {
              setQuizzes(fetchedQuizzes.value || []);
            } else {
              setQuizzes([]);
            }
          }
        }
      } catch (err) {
        console.warn('Error fetching unified topic/subject content:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchAllData();
    return () => {
      isMounted = false;
    };
  }, [effectiveSubjectId, selectedTopicId, selectedClass, isFocused]);

  const maxLessons = 4;

  // Handle switching or clicking another syllabus topic in the units list
  const handleSelectTopicItem = (topicItem: CurriculumTopicItem) => {
    if (topicItem.isLocked) {
      if (topicItem.lockReason === 'quiz_required') {
        setLockModal({
          visible: true,
          type: 'warning',
          title: 'Quiz Required',
          message: `You must complete and submit the quiz for "${topicItem.requiredQuizTopicTitle || 'the previous topic'}" before unlocking this topic.`,
          primaryText: 'Take Previous Quiz',
          action: 'take_quiz',
          targetTopicId: topicsList.find((i) => i.title === topicItem.requiredQuizTopicTitle)?.topicId,
        });
        return;
      }

      // Subscription required
      storageService.setLastLearningContext({
        subjectId: effectiveSubjectId,
        subjectName: subjectTitle,
        topicId: topicItem.topicId || topicItem._id,
        topicTitle: topicItem.title,
      });
      router.push({
        pathname: '/premium-access',
        params: {
          subjectId: effectiveSubjectId,
          subjectName: subjectTitle,
          topicId: topicItem.topicId || topicItem._id,
          topicTitle: topicItem.title,
        },
      });
      return;
    }

    // Switch active syllabus unit
    setSelectedTopicId(topicItem.topicId || topicItem._id);
    setSelectedTopicTitle(topicItem.title);
  };

  const handleLessonPress = async (lesson: any, index: number) => {
    if (lesson.requiresPriorQuiz) {
      Alert.alert(
        'Complete Lesson Quiz First',
        'Please attend the previous lesson and complete its quiz exercise before advancing to this lesson.'
      );
      return;
    }

    if (lesson.isLocked || lesson.requiresSubscription) {
      router.push({
        pathname: '/premium-access',
        params: {
          topicId: selectedTopicId,
          topicTitle: selectedTopicTitle,
          subjectName: subjectTitle,
          subjectId: effectiveSubjectId,
        },
      });
      return;
    }

    try {
      const access = await subscriptionService.checkAccess(selectedTopicId, lesson._id, selectedClass);
      if (!access.canAccess) {
        router.push({
          pathname: '/premium-access',
          params: {
            topicId: selectedTopicId,
            topicTitle: selectedTopicTitle,
            subjectName: subjectTitle,
            subjectId: effectiveSubjectId,
          },
        });
        return;
      }
    } catch {
      // Allow offline fallback
    }

    router.push({
      pathname: '/lesson',
      params: {
        id: lesson._id,
        title: lesson.title,
        subject: `${subjectTitle} > ${selectedTopicTitle}`,
        topicId: selectedTopicId,
        lessonIndex: (index + 1).toString(),
        totalLessons: Math.min(lessons.length, maxLessons).toString(),
      },
    });
  };

  const handleStartLearning = () => {
    if (!isQuizPassed && quizzes.length > 0 && lessons.length > 0) {
      const firstUncompleted = lessons.find((l) => !l.isCompleted && !l.isLocked);
      if (firstUncompleted) {
        handleLessonPress(firstUncompleted, lessons.indexOf(firstUncompleted));
        return;
      }
      handleQuizPress(quizzes[0]);
      return;
    }

    if (lessons.length > 0) {
      handleLessonPress(lessons[0], 0);
    } else if (quizzes.length > 0) {
      handleQuizPress(quizzes[0]);
    } else {
      router.push('/lesson');
    }
  };

  const handleQuizPress = async (quiz: any) => {
    try {
      const access = await subscriptionService.checkAccess(selectedTopicId, undefined, selectedClass);
      if (!access.canAccess) {
        router.push({
          pathname: '/premium-access',
          params: {
            topicId: selectedTopicId,
            topicTitle: selectedTopicTitle,
            subjectName: subjectTitle,
            subjectId: effectiveSubjectId,
          },
        });
        return;
      }
    } catch {}

    router.push({
      pathname: '/quiz',
      params: {
        quizId: quiz._id,
        title: quiz.title,
        topicId: selectedTopicId,
        subjectName: `${subjectTitle} > ${selectedTopicTitle}`,
      },
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
          {subjectTitle}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {isLoading && (
          <View style={[styles.loadingBanner, { backgroundColor: colors.cardHighlightBg }]}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.loadingBannerText, { color: colors.primary }]}>Loading syllabus & lessons...</Text>
          </View>
        )}

        {/* Overall Subject Progress Card (Integrated from subject-details) */}
        {topicsList.length > 1 && (
          <View
            style={[
              styles.overallProgressCard,
              { backgroundColor: colors.cardHighlightBg, borderColor: colors.cardHighlightBorder },
            ]}
          >
            <View style={[styles.progressCardIcon, { backgroundColor: colors.primary }]}>
              <Ionicons name="layers" size={22} color="#FFFFFF" />
            </View>
            <View style={styles.progressCardContent}>
              <View style={styles.progressCardHeader}>
                <Text style={[styles.progressCardTitle, { color: colors.text }]}>Overall Progress</Text>
                <Text style={[styles.progressCardPercent, { color: colors.primary }]}>{overallProgress}%</Text>
              </View>
              <View style={[styles.progressBarBg, { backgroundColor: colors.surfaceAlt, marginBottom: 0 }]}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${overallProgress}%`, backgroundColor: colors.primary },
                  ]}
                />
              </View>
            </View>
          </View>
        )}

        {/* Syllabus Units Selector Strip (when subject has multiple topics) */}
        {topicsList.length > 1 && (
          <View style={{ marginBottom: 20 }}>
            <View style={styles.syllabusHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>Syllabus Units</Text>
              <View style={styles.sequentialTag}>
                <Ionicons name="lock-closed-outline" size={13} color={colors.primary} style={{ marginRight: 4 }} />
                <Text style={[styles.sequentialText, { color: colors.primary }]}>Sequential Order</Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.unitsStrip}>
              {topicsList.map((tItem) => {
                const isSelected = (tItem.topicId || tItem._id) === selectedTopicId;
                const isLocked = tItem.isLocked;
                const isCompleted = tItem.status === 'completed';

                return (
                  <TouchableOpacity
                    key={tItem._id}
                    style={[
                      styles.unitPill,
                      {
                        backgroundColor: isSelected ? colors.primary : isLocked ? colors.surfaceAlt : colors.surface,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => handleSelectTopicItem(tItem)}
                    activeOpacity={0.75}
                  >
                    <View style={styles.unitPillInner}>
                      {isCompleted ? (
                        <Ionicons name="checkmark-circle" size={16} color={isSelected ? '#FFFFFF' : colors.success} />
                      ) : isLocked ? (
                        <Ionicons name="lock-closed" size={14} color={isSelected ? '#FFFFFF' : colors.textMuted} />
                      ) : (
                        <Text style={[styles.unitPillNum, { color: isSelected ? '#FFFFFF' : colors.textSecondary }]}>
                          {tItem.id}
                        </Text>
                      )}
                      <Text
                        style={[
                          styles.unitPillTitle,
                          { color: isSelected ? '#FFFFFF' : isLocked ? colors.textMuted : colors.text },
                        ]}
                        numberOfLines={1}
                      >
                        {tItem.title}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Info Card - Main Retained UI from topic-details */}
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

          <Text style={[styles.title, { color: colors.text }]}>
            {selectedTopicTitle || 'General Curriculum Lessons'}
          </Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            Explore core concepts, guided explanations, and practice questions tailored to your class curriculum.
          </Text>

          <View style={styles.progressRow}>
            <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>Topic Progress</Text>
            <Text style={[styles.progressPercent, { color: colors.primary }]}>
              {isQuizPassed
                ? '100% Complete'
                : lessons.length > 0
                ? `${lessons.filter((l) => l.isCompleted).length}/${lessons.length} Lessons Completed`
                : '0% Complete'}
            </Text>
          </View>
          <View style={[styles.progressBarBg, { backgroundColor: colors.surfaceAlt }]}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${Math.min(
                    100,
                    Math.max(
                      0,
                      isQuizPassed
                        ? 100
                        : lessons.length > 0
                        ? Math.round(
                            (lessons.filter((l) => l.isCompleted).length /
                              (lessons.length + (quizzes.length > 0 ? 1 : 0))) *
                              100,
                          )
                        : 0,
                    ),
                  )}%`,
                  backgroundColor: colors.primary,
                },
              ]}
            />
          </View>
          <Text style={[styles.lessonsCompletedText, { color: colors.textMuted }]}>
            {isQuizPassed
              ? 'All lessons & quiz completed. Next topic unlocked!'
              : `${lessons.length} lesson${lessons.length === 1 ? '' : 's'} available • Quiz required to unlock next topic`}
          </Text>
        </View>

        {/* Included Lessons List - Main Retained UI from topic-details */}
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
                        {lesson.requiresPriorQuiz
                          ? 'Complete Previous Lesson Quiz to Unlock'
                          : isLocked
                          ? 'Subscribe to Unlock'
                          : lesson.format}
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

        {/* Topic Knowledge Assessment Section */}
        {quizzes.length > 0 && (
          <View style={{ marginTop: 24, marginBottom: 12 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 8,
                marginBottom: 6,
              }}
            >
              <Text
                style={[
                  styles.sectionTitle,
                  { color: colors.text, marginBottom: 0, flexShrink: 1 },
                ]}
              >
                Topic Knowledge Assessment
              </Text>
              <View
                style={{
                  backgroundColor: isQuizPassed ? colors.successBg : '#FEF3C7',
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 10,
                  alignSelf: 'flex-start',
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '700',
                    color: isQuizPassed ? colors.success : '#B45309',
                    includeFontPadding: false,
                  }}
                >
                  {isQuizPassed ? 'PASSED ✓' : 'REQUIRED FOR NEXT TOPIC'}
                </Text>
              </View>
            </View>

            {/* Clear Subject & Topic context badge so it is never misleading */}
            <Text style={{ fontSize: 12, fontWeight: '600', color: colors.primary, marginBottom: 12 }}>
              {subjectTitle} • {selectedTopicTitle || 'Curriculum Topic'} Assessment
            </Text>

            {quizzes.map((quiz) => {
              const isThisQuizPassed =
                quizResults.some((r: any) => {
                  const rQuizId = r.quiz?._id || r.quiz;
                  return r.passed && rQuizId && rQuizId.toString() === quiz._id?.toString();
                }) || (quizzes.length === 1 && isQuizPassed);

              const qCount = quiz.questions?.length || 0;

              return (
                <TouchableOpacity
                  key={quiz._id}
                  style={[
                    styles.quizCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: isThisQuizPassed ? colors.success : colors.border,
                      borderWidth: isThisQuizPassed ? 1.5 : 1,
                    },
                  ]}
                  onPress={() => handleQuizPress(quiz)}
                >
                  <View style={[styles.quizIconBox, { backgroundColor: isThisQuizPassed ? colors.successBg : colors.primaryMint }]}>
                    <Ionicons
                      name={isThisQuizPassed ? 'checkmark-circle' : 'ribbon-outline'}
                      size={24}
                      color={isThisQuizPassed ? colors.success : colors.primary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.quizTitle, { color: colors.text }]}>{quiz.title}</Text>
                    <Text style={[styles.quizDesc, { color: colors.textSecondary }]}>
                      {qCount > 0 ? `${qCount} Questions (Q1 – Q${qCount})` : '0 Questions'} • {subjectTitle} • 70% passing grade
                    </Text>
                  </View>
                  {isThisQuizPassed ? (
                    <View style={{ backgroundColor: colors.successBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                      <Text style={{ fontSize: 12, fontWeight: '800', color: colors.success }}>PASSED</Text>
                    </View>
                  ) : (
                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <PrimaryButton
            title={
              isQuizPassed
                ? 'Review Lessons'
                : lessons.length > 0 && lessons.every((l) => l.isCompleted || l.isLocked)
                ? 'Take Topic Quiz'
                : 'Start Learning'
            }
            onPress={handleStartLearning}
          />
        </View>
      </ScrollView>

      {/* Lock / Quiz Gate Dialog Modal (from subject-details) */}
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
            setSelectedTopicId(lockModal.targetTopicId);
            const foundTitle = topicsList.find((t) => (t.topicId || t._id) === lockModal.targetTopicId)?.title;
            if (foundTitle) setSelectedTopicTitle(foundTitle);
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
  overallProgressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.2,
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
  },
  progressCardIcon: {
    width: 44,
    height: 44,
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
    fontSize: 15,
    fontWeight: '800',
  },
  progressCardPercent: {
    fontSize: 15,
    fontWeight: '800',
  },
  syllabusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sequentialTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F4F2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  sequentialText: {
    fontSize: 11,
    fontWeight: '700',
  },
  unitsStrip: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 4,
  },
  unitPill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1.2,
    maxWidth: 220,
  },
  unitPillInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  unitPillNum: {
    fontSize: 12,
    fontWeight: '800',
  },
  unitPillTitle: {
    fontSize: 13,
    fontWeight: '700',
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
