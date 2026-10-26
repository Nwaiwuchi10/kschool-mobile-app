import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import PrimaryButton from '@/components/ui/PrimaryButton';
import { useAppTheme } from '@/hooks/useAppTheme';

export default function QuizResultScreen() {
  const { colors, isDark } = useAppTheme();
  const params = useLocalSearchParams<{
    score?: string;
    total?: string;
    passed?: string;
    title?: string;
    topicId?: string;
    lessonId?: string;
  }>();

  const scoreNum = params.score ? parseInt(params.score, 10) : 0;
  const totalNum = params.total ? parseInt(params.total, 10) : 0;
  const percent = totalNum > 0 ? Math.min(100, Math.max(0, Math.round((scoreNum / totalNum) * 100))) : 0;
  const isPassed = params.passed ? params.passed === 'true' : percent >= 70;
  const incorrectNum = Math.max(0, totalNum - scoreNum);
  const quizTitle = params.title || 'Curriculum Quiz';

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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Quiz Result</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Result Card */}
        <View style={[styles.resultCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.trophyIconBox, { backgroundColor: isPassed ? colors.primaryMint : colors.warningBg }]}>
            <Ionicons
              name={isPassed ? 'trophy' : 'ribbon-outline'}
              size={32}
              color={isPassed ? colors.warning : colors.textSecondary}
            />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>{isPassed ? 'Quiz Completed!' : 'Keep Going!'}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {isPassed
              ? `Outstanding effort! You have successfully mastered the ${quizTitle}.`
              : `Good practice! Review the lesson materials and try ${quizTitle} again to reach 70%.`}
          </Text>

          <View style={[styles.scoreBox, { backgroundColor: colors.surfaceAlt }]}>
            <Text style={[styles.scoreLabel, { color: colors.textSecondary }]}>YOUR SCORE</Text>
            <View style={styles.scoreValueRow}>
              <Text style={[styles.scorePercent, { color: isPassed ? colors.primary : colors.warning }]}>
                {percent}%
              </Text>
              <Text style={[styles.scoreFraction, { color: colors.textSecondary }]}>
                {' '}
                ({scoreNum}/{totalNum})
              </Text>
            </View>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.statIconBoxCorrect, { backgroundColor: colors.successBg }]}>
              <Ionicons name="checkmark" size={16} color={colors.success} />
            </View>
            <View>
              <Text style={[styles.statNumberCorrect, { color: colors.success }]}>{scoreNum}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Correct</Text>
            </View>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.statIconBoxIncorrect, { backgroundColor: colors.dangerBg }]}>
              <Ionicons name="close" size={16} color={colors.danger} />
            </View>
            <View>
              <Text style={[styles.statNumberIncorrect, { color: colors.danger }]}>{incorrectNum}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Incorrect</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <PrimaryButton
            title="Continue Journey"
            onPress={() => {
              if (params.topicId) {
                router.replace({
                  pathname: '/topic-details',
                  params: { topicId: params.topicId },
                });
              } else {
                router.replace('/(tabs)/subjects');
              }
            }}
          />
          <TouchableOpacity
            style={[styles.secondaryBtn, styles.btnOutlineTeal, { borderColor: colors.primary, backgroundColor: colors.surface }]}
            onPress={() => {
              if (params.lessonId) {
                router.push({
                  pathname: '/lesson',
                  params: { id: params.lessonId, topicId: params.topicId },
                });
              } else {
                router.push('/lesson');
              }
            }}
          >
            <Text style={[styles.btnTextTeal, { color: colors.primary }]}>Review Lesson</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.secondaryBtn, styles.btnOutlineGrey, { borderColor: colors.border, backgroundColor: colors.surface }]}
            onPress={() => router.back()}
          >
            <Text style={[styles.btnTextGrey, { color: colors.textSecondary }]}>Retry Quiz</Text>
          </TouchableOpacity>
        </View>

        {/* Unlock Status */}
        <View style={styles.unlockStatus}>
          <Ionicons
            name={isPassed ? 'lock-open-outline' : 'lock-closed-outline'}
            size={16}
            color={isPassed ? colors.primary : colors.textSecondary}
          />
          <Text style={[styles.unlockText, { color: isPassed ? colors.primary : colors.textSecondary }]}>
            {isPassed
              ? 'Topic Completed! Next topic unlocked.'
              : 'Pass with 70% or higher to unlock next topic.'}
          </Text>
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
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
  },
  trophyIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  trophyIconBoxFailed: {
    backgroundColor: '#FEF3C7',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  scoreBox: {
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    width: '100%',
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  scoreValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scorePercent: {
    fontSize: 32,
    fontWeight: '900',
    color: '#127A71',
  },
  scoreFraction: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B7280',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
  },
  statIconBoxCorrect: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statIconBoxIncorrect: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statNumberCorrect: {
    fontSize: 18,
    fontWeight: '900',
    color: '#10B981',
  },
  statNumberIncorrect: {
    fontSize: 18,
    fontWeight: '900',
    color: '#EF4444',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  actionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  secondaryBtn: {
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnOutlineTeal: {
    borderWidth: 1.5,
    borderColor: '#127A71',
    backgroundColor: '#FFFFFF',
  },
  btnTextTeal: {
    color: '#127A71',
    fontSize: 15,
    fontWeight: '700',
  },
  btnOutlineGrey: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  btnTextGrey: {
    color: '#6B7280',
    fontSize: 15,
    fontWeight: '700',
  },
  unlockStatus: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  unlockText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#127A71',
  },
});
