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
import { router, useLocalSearchParams } from 'expo-router';
import { quizService, MobileQuiz, QuestionItem } from '@/services/quiz.service';
import { subscriptionService } from '@/services/subscription.service';
import { MathView } from '@/components/MathView';
import { useAppTheme } from '@/hooks/useAppTheme';

const QUESTION_TIME_LIMIT = 10;

export default function QuizScreen() {
  const { colors, isDark } = useAppTheme();
  const params = useLocalSearchParams<{ topicId?: string; quizId?: string; lessonId?: string; title?: string }>();
  const [currentQuiz, setCurrentQuiz] = useState<MobileQuiz | null>(null);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 10-Second Countdown timer
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_LIMIT);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchQuiz = async () => {
      if (!params.topicId && !params.quizId && !params.lessonId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        let q: MobileQuiz | null = null;
        if (params.quizId) {
          q = await quizService.getQuizById(params.quizId);
        } else if (params.lessonId) {
          const quizzes = await quizService.getQuizzesByLesson(params.lessonId);
          if (quizzes && quizzes.length > 0) {
            q = quizzes[0];
          }
        } else if (params.topicId) {
          const quizzes = await quizService.getQuizzesByTopic(params.topicId);
          if (quizzes && quizzes.length > 0) {
            q = quizzes[0];
          }
        }

        if (isMounted && q && q.questions && q.questions.length > 0) {
          setCurrentQuiz(q);
          setQuestions(q.questions);
        } else if (isMounted) {
          setQuestions([]);
        }
      } catch (err) {
        console.warn('Error fetching quiz from backend:', err);
        if (isMounted) setQuestions([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchQuiz();
    return () => {
      isMounted = false;
    };
  }, [params.topicId, params.quizId]);

  // Enforce access barrier for quiz
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const access = await subscriptionService.checkAccess(params.topicId);
        if (!access.canAccess) {
          router.replace('/premium-access');
        }
      } catch {
        // Offline allowance
      }
    };
    checkAccess();
  }, [params.topicId]);

  const totalCount = questions.length;
  const currentQ = questions[currentIndex];
  const progressPercent = totalCount > 0 ? ((currentIndex + 1) / totalCount) * 100 : 0;
  const selectedOptIndex = selectedAnswers[currentIndex];

  // Reset timer on question change
  useEffect(() => {
    setTimeLeft(QUESTION_TIME_LIMIT);

    if (timerRef.current) clearInterval(timerRef.current);

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
  }, [currentIndex, totalCount]);

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
      const answersArray = questions.map((_, idx) =>
        selectedAnswers[idx] !== undefined ? selectedAnswers[idx] : -1,
      );

      // Record topic completion in backend
      if (params.topicId) {
        subscriptionService.recordProgress(params.topicId, '', true).catch(() => {});
      }

      if (currentQuiz && currentQuiz._id) {
        try {
          const res = await quizService.submitQuiz(currentQuiz._id, answersArray);
          router.push({
            pathname: '/quiz-result',
            params: {
              score: res.score.toString(),
              total: res.totalQuestions.toString(),
              passed: res.passed ? 'true' : 'false',
              title: currentQuiz.title,
            },
          });
          return;
        } catch (apiErr) {
          console.warn('Backend submission error, computing client score:', apiErr);
        }
      }

      // Local score calculation fallback
      let score = 0;
      questions.forEach((q, idx) => {
        if (selectedAnswers[idx] === q.correctOptionIndex) {
          score++;
        }
      });
      const passed = score / totalCount >= 0.7;

      router.push({
        pathname: '/quiz-result',
        params: {
          score: score.toString(),
          total: totalCount.toString(),
          passed: passed ? 'true' : 'false',
          title: currentQuiz?.title || 'Verb Assessment',
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Timer color indicator
  const timerColor = timeLeft <= 3 ? colors.danger : timeLeft <= 6 ? colors.warning : colors.primary;
  const timerPercent = (timeLeft / QUESTION_TIME_LIMIT) * 100;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTag, { color: colors.primary }]}>TIMED ASSESSMENT</Text>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            {currentQuiz?.title || params.title || 'Topic Quiz'}
          </Text>
        </View>

        {/* 10-Second Timer Badge */}
        <View style={[styles.timerBadge, { borderColor: timerColor, backgroundColor: colors.surface }]}>
          <Ionicons name="time-outline" size={16} color={timerColor} />
          <Text style={[styles.timerText, { color: timerColor }]}>{timeLeft}s</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {isLoading && (
          <View style={[styles.loadingBanner, { backgroundColor: colors.cardHighlightBg }]}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.loadingBannerText, { color: colors.primary }]}>Loading quiz questions...</Text>
          </View>
        )}

        {/* Timer Bar */}
        <View style={[styles.timerBarBg, { backgroundColor: colors.surfaceAlt }]}>
          <View
            style={[
              styles.timerBarFill,
              { width: `${timerPercent}%`, backgroundColor: timerColor },
            ]}
          />
        </View>

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
            {/* Question Progress */}
            <View style={styles.progressRow}>
              <Text style={[styles.progressTitle, { color: colors.text }]}>Question Progress</Text>
              <Text style={[styles.progressCount, { color: colors.primary }]}>
                {currentIndex + 1} of {totalCount}
              </Text>
            </View>
            <View style={[styles.progressBarBg, { backgroundColor: colors.surfaceAlt }]}>
              <View style={[styles.progressBarFill, { width: `${progressPercent}%`, backgroundColor: colors.primary }]} />
            </View>

            {/* Question Card */}
            <View style={[styles.questionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.questionNumber, { color: colors.textMuted }]}>QUESTION {currentIndex + 1}</Text>
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
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    backgroundColor: '#FFFFFF',
  },
  timerText: {
    fontSize: 13,
    fontWeight: '800',
  },
  timerBarBg: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginBottom: 16,
    overflow: 'hidden',
  },
  timerBarFill: {
    height: 4,
    borderRadius: 2,
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
    marginBottom: 24,
  },
  progressBarFill: {
    height: 6,
    backgroundColor: '#127A71',
    borderRadius: 3,
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
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#FFFFFF',
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
