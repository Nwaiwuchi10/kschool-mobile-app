import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect, useRef } from 'react';
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
import { quizService, MobileQuiz, QuestionItem } from '@/services/quiz.service';
import { lessonService } from '@/services/lesson.service';
import { subscriptionService } from '@/services/subscription.service';
import { MathView } from '@/components/MathView';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useClass } from '@/store/ClassContext';

// Default allocated time per question (e.g. 60 seconds per question for thoughtful reading)
const QUESTION_TIME_LIMIT = 60;

/**
 * Fisher-Yates shuffle algorithm to randomize questions & options
 */
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Shuffles questions, and for each question shuffles its options
 * while preserving the correct answer index mapping.
 */
function randomizeQuizQuestions(rawQuestions: QuestionItem[]): QuestionItem[] {
  if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) return [];

  // 1. For each question, shuffle its options and track new correctOptionIndex
  const questionsWithShuffledOptions = rawQuestions.map((q) => {
    const originalOptions = Array.isArray(q.options) ? q.options : [];
    const originalCorrectIndex = q.correctOptionIndex ?? 0;
    const correctOptionValue = originalOptions[originalCorrectIndex];

    if (originalOptions.length <= 1) {
      return { ...q };
    }

    // Shuffle options
    const shuffledOptions = shuffleArray(originalOptions);

    // Find the new index of the correct answer
    let newCorrectIndex = shuffledOptions.findIndex((opt) => opt === correctOptionValue);
    if (newCorrectIndex === -1) {
      newCorrectIndex = 0;
    }

    return {
      ...q,
      options: shuffledOptions,
      correctOptionIndex: newCorrectIndex,
    };
  });

  // 2. Shuffle the question order completely
  return shuffleArray(questionsWithShuffledOptions);
}

export default function QuizScreen() {
  const { colors, isDark } = useAppTheme();
  const { selectedClass } = useClass();
  const pathname = usePathname();
  const isFocused = pathname?.includes('quiz') && !pathname?.includes('quiz-result');
  const params = useLocalSearchParams<{
    topicId?: string;
    quizId?: string;
    lessonId?: string;
    title?: string;
    subjectName?: string;
    nextLessonId?: string;
    nextLessonTitle?: string;
    retryTs?: string;
  }>();
  const [currentQuiz, setCurrentQuiz] = useState<MobileQuiz | null>(null);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Digital countdown timer showing MM:SS
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_LIMIT);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (!isFocused) return;
    let isMounted = true;
    const fetchQuiz = async () => {
      // Always start at Question 1 (index 0) with fresh answers when loading a lesson's quiz exercise
      setCurrentIndex(0);
      setSelectedAnswers({});
      setTimeLeft(QUESTION_TIME_LIMIT);

      if (!params.topicId && !params.quizId && !params.lessonId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        let q: MobileQuiz | null = null;

        // 1. If a specific quizId is passed, try fetching it first
        if (params.quizId) {
          q = await quizService.getQuizById(params.quizId);
        }

        // 2. If lessonId is provided and we don't yet have questions, fetch all quizzes/exercises for this lesson
        if ((!q || !q.questions || q.questions.length === 0) && params.lessonId) {
          const lessonQuizzes = await quizService.getQuizzesByLesson(params.lessonId);
          if (lessonQuizzes && lessonQuizzes.length > 0) {
            const allQuestions = lessonQuizzes.flatMap((quizItem) => quizItem.questions || []);
            if (allQuestions.length > 0) {
              q = {
                ...lessonQuizzes[0],
                title: params.title || lessonQuizzes[0].title || 'Lesson Quiz Exercise',
                questions: allQuestions,
              };
            }
          }

          // Fallback: check lesson document's embedded exercises directly
          if (!q || !q.questions || q.questions.length === 0) {
            try {
              const lessonDoc = await lessonService.getLessonById(params.lessonId);
              if (lessonDoc && Array.isArray(lessonDoc.exercises) && lessonDoc.exercises.length > 0) {
                const embeddedQuestions: QuestionItem[] = [];
                let firstExerciseId = '';
                let firstExerciseTitle = '';
                for (const ex of lessonDoc.exercises as any[]) {
                  if (ex && typeof ex === 'object' && Array.isArray(ex.questions)) {
                    if (!firstExerciseId && ex._id) firstExerciseId = ex._id;
                    if (!firstExerciseTitle && ex.title) firstExerciseTitle = ex.title;
                    embeddedQuestions.push(...ex.questions);
                  } else if (typeof ex === 'string') {
                    const fetchedEx = await quizService.getQuizById(ex);
                    if (fetchedEx && Array.isArray(fetchedEx.questions)) {
                      if (!firstExerciseId && fetchedEx._id) firstExerciseId = fetchedEx._id;
                      if (!firstExerciseTitle && fetchedEx.title) firstExerciseTitle = fetchedEx.title;
                      embeddedQuestions.push(...fetchedEx.questions);
                    }
                  }
                }
                if (embeddedQuestions.length > 0) {
                  q = {
                    _id: firstExerciseId || lessonDoc._id,
                    title: params.title || firstExerciseTitle || `${lessonDoc.title} Quiz Exercise`,
                    topic: params.topicId || (lessonDoc.topic as string) || '',
                    questions: embeddedQuestions,
                  };
                }
              }
            } catch {
              // ignore fallback error
            }
          }
        }

        // 3. Fallback to topic quizzes if lesson-level lookup returned no questions
        if ((!q || !q.questions || q.questions.length === 0) && params.topicId) {
          const quizzes = await quizService.getQuizzesByTopic(params.topicId);
          if (quizzes && quizzes.length > 0) {
            const allQuestions = quizzes.flatMap((quizItem) => quizItem.questions || []);
            if (allQuestions.length > 0) {
              q = {
                ...quizzes[0],
                title: params.title || quizzes[0].title || 'Topic Quiz Exercise',
                questions: allQuestions,
              };
            }
          }
        }

        if (isMounted && q && q.questions && q.questions.length > 0) {
          // Shuffle question order and options each time a student takes the quiz
          const randomizedQuestions = randomizeQuizQuestions(q.questions);
          setCurrentQuiz({
            ...q,
            questions: randomizedQuestions,
          });
          setQuestions(randomizedQuestions);
          setCurrentIndex(0);
        } else if (isMounted) {
          setCurrentQuiz(null);
          setQuestions([]);
          setCurrentIndex(0);
        }
      } catch (err) {
        console.warn('Error fetching quiz from backend:', err);
        if (isMounted) {
          setQuestions([]);
          setCurrentIndex(0);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchQuiz();
    return () => {
      isMounted = false;
    };
  }, [params.topicId, params.quizId, params.lessonId, params.retryTs, isFocused]);

  // Enforce access barrier for quiz
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const access = await subscriptionService.checkAccess(params.topicId, params.lessonId, selectedClass);
        if (!access.canAccess) {
          router.replace('/premium-access');
        }
      } catch {
        // Offline allowance
      }
    };
    checkAccess();
  }, [params.topicId, params.lessonId, selectedClass]);

  const totalCount = questions.length;
  const currentQ = questions[currentIndex];
  const progressPercent = totalCount > 0 ? ((currentIndex + 1) / totalCount) * 100 : 0;
  const selectedOptIndex = selectedAnswers[currentIndex];

  // Reset timer on question change and only run while focused and questions are loaded
  useEffect(() => {
    setTimeLeft(QUESTION_TIME_LIMIT);

    if (timerRef.current) clearInterval(timerRef.current);

    if (!isFocused || isLoading || totalCount === 0) {
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev: number) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, totalCount, isFocused, isLoading]);

  const handleTimeExpired = () => {
    if (currentIndex < totalCount - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      doSubmit();
    }
  };

  const handleSelectOption = (optIndex: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentIndex]: optIndex,
    }));
  };

  const handleNext = () => {
    if (currentIndex < totalCount - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    const answeredCount = Object.keys(selectedAnswers).length;
    if (answeredCount < totalCount) {
      Alert.alert(
        'Incomplete Quiz',
        `You have answered ${answeredCount} of ${totalCount} questions. Would you still like to submit?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Submit Anyway', onPress: doSubmit },
        ],
      );
    } else {
      doSubmit();
    }
  };

  const doSubmit = async () => {
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      setIsSubmitting(true);

      // Compute client score directly against the randomized questions and options
      let score = 0;
      questions.forEach((q, idx) => {
        if (selectedAnswers[idx] === q.correctOptionIndex) {
          score++;
        }
      });
      const passed = (score / Math.max(totalCount, 1)) >= 0.7;

      // Only record completion in backend if student passed (score >= 70%)
      if (passed && (params.topicId || params.lessonId)) {
        await subscriptionService
          .recordProgress(params.topicId || '', params.lessonId || '', true)
          .catch(() => {});
      }

      // Submit or persist result in backend
      if (currentQuiz && currentQuiz._id) {
        try {
          const answersArray = questions.map((_, idx) =>
            selectedAnswers[idx] !== undefined ? selectedAnswers[idx] : -1,
          );
          await quizService.submitQuiz(currentQuiz._id, answersArray).catch(() => {});
        } catch (apiErr) {
          console.warn('Backend submission non-fatal notice:', apiErr);
        }
      }

      router.push({
        pathname: '/quiz-result',
        params: {
          score: score.toString(),
          total: totalCount.toString(),
          passed: passed ? 'true' : 'false',
          title: currentQuiz?.title || 'Exercise Quiz',
          topicId: params.topicId,
          lessonId: params.lessonId,
          quizId: currentQuiz?._id || params.quizId || '',
          subjectName: params.subjectName || '',
          nextLessonId: params.nextLessonId || '',
          nextLessonTitle: params.nextLessonTitle || '',
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format seconds into MM:SS display
  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Timer color indicator: red when < 10s, amber when < 20s, primary otherwise
  const isUrgent = timeLeft <= 10;
  const isWarning = timeLeft <= 20;
  const timerColor = isUrgent ? colors.danger : isWarning ? colors.warning : colors.primary;

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
            } else if (params.lessonId) {
              router.replace({
                pathname: '/lesson',
                params: {
                  id: params.lessonId,
                  title: params.title || currentQuiz?.title || 'Lesson',
                  subject: params.subjectName || '',
                  topicId: params.topicId || '',
                },
              });
            } else if (params.topicId) {
              router.replace({
                pathname: '/topic-details',
                params: {
                  topicId: params.topicId,
                  subjectName: params.subjectName || '',
                },
              });
            } else {
              router.replace('/(tabs)/subjects');
            }
          }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTag, { color: colors.primary }]}>EXERCISE ASSESSMENT</Text>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            {currentQuiz?.title || params.title || 'Topic Quiz'}
          </Text>
        </View>

        {/* Digital Clock Badge */}
        <View
          style={[
            styles.timerBadge,
            {
              borderColor: timerColor,
              backgroundColor: isUrgent ? '#FEE2E2' : colors.surfaceAlt,
            },
          ]}
        >
          <Ionicons name="time" size={17} color={timerColor} />
          <Text style={[styles.timerText, { color: timerColor }]}>
            {formatTimer(timeLeft)}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {isLoading && (
          <View style={[styles.loadingBanner, { backgroundColor: colors.cardHighlightBg }]}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.loadingBannerText, { color: colors.primary }]}>Loading quiz questions...</Text>
          </View>
        )}

        {/* Questions Area */}
        {!currentQ ? (
          <View style={[styles.questionCard, { backgroundColor: colors.surface, borderColor: colors.border, alignItems: 'center', paddingVertical: 40 }]}>
            <Ionicons name="help-circle-outline" size={48} color={colors.textMuted} />
            <Text style={[styles.questionText, { color: colors.text, textAlign: 'center', marginTop: 16 }]}>
              {isLoading ? 'Loading questions from curriculum...' : 'No quiz questions uploaded yet.'}
            </Text>
            <Text style={{ fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginTop: 8 }}>
              Please check back shortly or review the topic lessons.
            </Text>
          </View>
        ) : (
          <>
            {/* Question Progress (Q1 to Last Question) */}
            <View style={styles.progressRow}>
              <Text style={[styles.progressTitle, { color: colors.text }]}>Question Progress</Text>
              <Text style={[styles.progressCount, { color: colors.primary }]}>
                Q{currentIndex + 1} of Q{totalCount} ({currentIndex + 1} of {totalCount})
              </Text>
            </View>
            <View style={[styles.progressBarBg, { backgroundColor: colors.surfaceAlt }]}>
              <View style={[styles.progressBarFill, { width: `${progressPercent}%`, backgroundColor: colors.primary }]} />
            </View>

            {/* Q1 to Last Question Navigator Strip */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.questionPillsRow}
            >
              {questions.map((_, qIdx) => {
                const isCurrent = qIdx === currentIndex;
                const isAnswered = selectedAnswers[qIdx] !== undefined;
                return (
                  <TouchableOpacity
                    key={qIdx}
                    style={[
                      styles.questionPill,
                      {
                        backgroundColor: isCurrent
                          ? colors.primary
                          : isAnswered
                          ? colors.cardHighlightBg
                          : colors.surface,
                        borderColor: isCurrent || isAnswered ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setCurrentIndex(qIdx)}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.questionPillText,
                        {
                          color: isCurrent
                            ? '#FFFFFF'
                            : isAnswered
                            ? colors.primary
                            : colors.textSecondary,
                        },
                      ]}
                    >
                      Q{qIdx + 1}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Question Card */}
            <View style={[styles.questionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.questionNumber, { color: colors.textMuted }]}>
                QUESTION {currentIndex + 1} OF {totalCount} (Q{currentIndex + 1})
              </Text>
              <View style={{ marginVertical: 6 }}>
                <MathView content={currentQ.questionText} fontSize={17} color={colors.text} textStyle={[styles.questionText, { color: colors.text }]} />
              </View>

              {/* Options */}
              <View style={styles.optionsContainer}>
                {currentQ.options.map((opt, optIndex) => {
                  const letter = String.fromCharCode(65 + optIndex);
                  const isSelected = selectedOptIndex === optIndex;
                  return (
                    <TouchableOpacity
                      key={optIndex}
                      style={[
                        styles.optionCard,
                        {
                          backgroundColor: isSelected ? colors.cardHighlightBg : colors.surface,
                          borderColor: isSelected ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => handleSelectOption(optIndex)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.optionLetterBox,
                          { backgroundColor: isSelected ? colors.primary : colors.surfaceAlt },
                        ]}
                      >
                        <Text
                          style={[
                            styles.optionLetterText,
                            { color: isSelected ? '#FFFFFF' : colors.textSecondary },
                          ]}
                        >
                          {letter}
                        </Text>
                      </View>
                      <View style={{ flex: 1, paddingVertical: 2 }}>
                        <MathView
                          content={opt}
                          fontSize={15}
                          color={isSelected ? colors.primary : colors.text}
                          textStyle={[styles.optionText, isSelected && { color: colors.primary, fontWeight: '700' }]}
                          inline
                        />
                      </View>

                      {isSelected && (
                        <View style={styles.checkIcon}>
                          <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Actions Row */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[
                  styles.navBtn,
                  styles.navBtnOutline,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  currentIndex === 0 && { opacity: 0.5 },
                ]}
                onPress={handlePrev}
                disabled={currentIndex === 0}
              >
                <Text style={[styles.navBtnTextOutline, { color: colors.text }]}>Previous</Text>
              </TouchableOpacity>

              {currentIndex < totalCount - 1 ? (
                <TouchableOpacity style={[styles.navBtn, styles.navBtnSolid, { backgroundColor: colors.primary }]} onPress={handleNext}>
                  <Text style={styles.navBtnTextSolid}>Next Question</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.navBtn, styles.navBtnSolid, { backgroundColor: colors.primary }]}
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.navBtnTextSolid}>Submit Answers</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
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
    marginRight: 12,
    marginLeft: -8,
  },
  headerTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#127A71',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1A1A1A',
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  timerText: {
    fontSize: 14,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.5,
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
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  progressCount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#127A71',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginBottom: 14,
  },
  progressBarFill: {
    height: 6,
    backgroundColor: '#127A71',
    borderRadius: 3,
  },
  questionPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 16,
  },
  questionPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1.5,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionPillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  questionNumber: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  questionText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1A1A1A',
    lineHeight: 24,
    marginBottom: 20,
  },
  optionsContainer: {
    gap: 12,
    width: '100%',
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    minHeight: 56,
    width: '100%',
    overflow: 'hidden',
  },
  optionCardActive: {
    borderColor: '#127A71',
    backgroundColor: '#F0FDF4',
  },
  optionLetterBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionLetterBoxActive: {
    backgroundColor: '#127A71',
  },
  optionLetterText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4B5563',
  },
  optionLetterTextActive: {
    color: '#FFFFFF',
  },
  optionText: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '600',
    flex: 1,
  },
  optionTextActive: {
    color: '#127A71',
    fontWeight: '700',
  },
  checkIcon: {
    marginLeft: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  navBtn: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navBtnOutline: {
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  navBtnTextOutline: {
    color: '#4B5563',
    fontWeight: '700',
    fontSize: 15,
  },
  navBtnSolid: {
    backgroundColor: '#127A71',
  },
  navBtnTextSolid: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
