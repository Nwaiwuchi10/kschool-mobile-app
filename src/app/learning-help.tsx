import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useAppTheme } from '@/hooks/useAppTheme';

interface LessonHelpStep {
  step: number;
  title: string;
  titleIcon?: keyof typeof Ionicons.glyphMap;
  description: string;
}

interface LessonHelpCallout {
  title: string;
  description: string;
  actionText?: string;
  actionRoute?: string;
}

interface LessonHelpTopic {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  subtitle: string;
  steps: LessonHelpStep[];
  callout?: LessonHelpCallout;
}

const LEARNING_HELP_TOPICS: LessonHelpTopic[] = [
  {
    id: 'finding-my-subjects',
    title: 'Finding My Subjects',
    icon: 'book-outline',
    subtitle: 'Find the subjects and topics for your class.',
    steps: [
      {
        step: 1,
        title: 'Check your class in Profile',
        titleIcon: 'person-outline',
        description:
          'Open Profile and confirm that your class is correct.',
      },
      {
        step: 2,
        title: 'Open Subjects',
        description:
          'Go to Subjects to see the subjects for your class.',
      },
      {
        step: 3,
        title: 'Choose a subject',
        description:
          'Tap the subject you want to learn.',
      },
      {
        step: 4,
        title: 'Open an available topic',
        description:
          'Choose an unlocked topic to see its lessons.',
      },
    ],
    callout: {
      title: 'Is your class incorrect?',
      description:
        'Go to Account & Login Help and choose Incorrect Class or School for help.',
      actionRoute: '/account-help',
    },
  },
  {
    id: 'opening-lessons',
    title: 'Opening Lessons',
    icon: 'book-outline',
    subtitle: 'Start a lesson from an available topic in your subject.',
    steps: [
      {
        step: 1,
        title: 'Choose your class subject',
        description:
          'Open Subjects and tap a subject for your class.',
      },
      {
        step: 2,
        title: 'Open an available topic',
        description:
          'Choose an unlocked topic from the topic list.',
      },
      {
        step: 3,
        title: 'Open a lesson',
        description:
          'Tap an available lesson in that topic to begin.',
      },
      {
        step: 4,
        title: 'Continue the required lessons',
        description:
          'Work through the required lessons, then open the topic exercise/quiz.',
      },
    ],
    callout: {
      title: 'Why is a topic locked?',
      description:
        'Complete the preceding topic’s required lessons and topic exercise before the next topic unlocks.',
    },
  },
  {
    id: 'reading-and-listening',
    title: 'Reading and Listening to Lessons',
    icon: 'headset-outline',
    subtitle:
      'Learn with the written notes or the lesson’s audio option.',
    steps: [
      {
        step: 1,
        title: 'Open an available lesson',
        description:
          'Choose your subject, open an unlocked topic, then tap a lesson.',
      },
      {
        step: 2,
        title: 'Read or choose audio',
        description:
          'Read the written notes, or choose the lesson’s audio option.',
      },
      {
        step: 3,
        title: 'Use the audio controls',
        description:
          'Use the controls shown in the lesson to listen to the audio.',
      },
      {
        step: 4,
        title: 'Finish the required lessons',
        description:
          'Complete the required lessons in the topic before moving to its exercise/quiz.',
      },
    ],
    callout: {
      title: 'Need to go over it again?',
      description:
        'Completed topics remain available, so you can revisit their lessons for revision.',
    },
  },
  {
    id: 'completing-exercises-quizzes',
    title: 'Completing Exercises and Quizzes',
    icon: 'clipboard-outline',
    subtitle:
      'Test your understanding of each topic with practice exercises and quizzes.',
    steps: [
      {
        step: 1,
        title: 'Complete topic lessons',
        description:
          'Read or listen through all the required lessons inside your topic.',
      },
      {
        step: 2,
        title: 'Start the exercise or quiz',
        description:
          'Tap the Exercise or Quiz button at the bottom of the topic lesson list.',
      },
      {
        step: 3,
        title: 'Answer the questions',
        description:
          'Select your answers and submit each question before time runs out.',
      },
      {
        step: 4,
        title: 'Review your score',
        description:
          'Meet or exceed the cut-off mark to earn your score and unlock the next topic.',
      },
    ],
    callout: {
      title: 'Did not reach the pass mark?',
      description:
        'You can retake the quiz after reviewing the lesson notes to achieve the passing score.',
    },
  },
  {
    id: 'unlocking-next-topic',
    title: 'Unlocking the Next Topic',
    icon: 'lock-open-outline',
    subtitle:
      'Learn how the sequential topic progression works on KSCHOOLMATE.',
    steps: [
      {
        step: 1,
        title: 'Follow the learning order',
        description:
          'Topics are arranged sequentially to ensure strong mastery of foundational concepts.',
      },
      {
        step: 2,
        title: 'Pass the topic quiz',
        description:
          'Score at least the minimum cut-off mark in the previous topic’s quiz.',
      },
      {
        step: 3,
        title: 'Active subscription check',
        description:
          'Subsequent topics require an active class subscription to unlock fully.',
      },
      {
        step: 4,
        title: 'Explore the next topic',
        description:
          'Once unlocked, you can start the lessons and exercises of the next topic immediately.',
      },
    ],
    callout: {
      title: 'Subscription required?',
      description:
        'If your subscription has expired or is inactive, visit Subscription & Payments to renew.',
      actionRoute: '/subscription',
    },
  },
  {
    id: 'tracking-progress',
    title: 'Tracking My Progress',
    icon: 'stats-chart-outline',
    subtitle:
      'Keep an eye on completed topics, scores, and overall learning milestones.',
    steps: [
      {
        step: 1,
        title: 'Check your Dashboard',
        description:
          'Your Home Dashboard provides a high-level overview of overall course progress.',
      },
      {
        step: 2,
        title: 'View Subject breakdown',
        description:
          'Open any subject to see which topics are completed, in progress, or locked.',
      },
      {
        step: 3,
        title: 'Check Quiz results',
        description:
          'Your quiz scores and completion badges are displayed upon completing quizzes.',
      },
      {
        step: 4,
        title: 'Keep learning consistently',
        description:
          'Consistent daily study will steadily fill your progress meters.',
      },
    ],
  },
  {
    id: 'offline-downloads',
    title: 'Downloading Lessons for Offline Learning',
    icon: 'cloud-download-outline',
    subtitle:
      'Information on saving study notes and audio for times when you are offline.',
    steps: [
      {
        step: 1,
        title: 'Check account eligibility',
        description:
          'Offline downloading capabilities depend on your school and subscription package.',
      },
      {
        step: 2,
        title: 'Look for the download icon',
        description:
          'Where available, an offline icon appears alongside the lesson or audio player.',
      },
      {
        step: 3,
        title: 'Ensure adequate storage',
        description:
          'Make sure your device has sufficient free storage space before downloading media.',
      },
      {
        step: 4,
        title: 'Need assistance?',
        description:
          'Contact Support below if you have inquiries about offline downloads for your class.',
      },
    ],
  },
];

export default function LearningHelpScreen() {
  const { colors, isDark } = useAppTheme();
  const params = useLocalSearchParams<{ topic?: string }>();

  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(
    params.topic || null
  );

  const selectedTopic = LEARNING_HELP_TOPICS.find(
    (t) => t.id === selectedTopicId
  );

  const handleEmailSupport = () => {
    const topicSubject = selectedTopic
      ? selectedTopic.title
      : 'Learning & Lessons Help';
    Linking.openURL(
      `mailto:support@kschoolmate.com?subject=${encodeURIComponent(
        topicSubject + ' - KSCHOOLMATE'
      )}`
    );
  };

  const handleBack = () => {
    if (selectedTopicId) {
      setSelectedTopicId(null);
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
          <Text style={[styles.backText, { color: colors.text }]}>Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* VIEW 1: Main Learning Help Hub */}
        {!selectedTopic && (
          <>
            <Text style={[styles.title, { color: colors.text }]}>
              Learning & Lessons Help
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Need a hand with learning? Choose a topic below for simple steps.
            </Text>

            {/* Journey Box */}
            <View
              style={[
                styles.journeyCard,
                {
                  backgroundColor: isDark ? colors.surfaceAlt : '#F3F4F6',
                },
              ]}
            >
              <Text style={[styles.journeyHeader, { color: colors.text }]}>
                Your learning journey
              </Text>
              <Text style={[styles.journeyFlow, { color: colors.text }]}>
                Class <Ionicons name="arrow-forward" size={12} color={colors.text} /> Subject{' '}
                <Ionicons name="arrow-forward" size={12} color={colors.text} /> Topic
              </Text>
              <Text style={[styles.journeyFlowSecondary, { color: colors.text }]}>
                <Ionicons name="arrow-down" size={12} color={colors.text} /> Lessons{' '}
                <Ionicons name="arrow-forward" size={12} color={colors.text} /> Exercise/Quiz{' '}
                <Ionicons name="arrow-forward" size={12} color={colors.text} /> Result
              </Text>
            </View>

            <Text style={[styles.summaryNote, { color: colors.textSecondary }]}>
              Complete the required lessons and the topic exercise to unlock the next topic.
            </Text>
            <Text style={[styles.revisionNote, { color: colors.textSecondary }]}>
              Completed topics stay available for revision.
            </Text>

            {/* List of Topics */}
            <View style={styles.listContainer}>
              {LEARNING_HELP_TOPICS.map((topic, index) => (
                <React.Fragment key={topic.id}>
                  <TouchableOpacity
                    style={styles.itemRow}
                    activeOpacity={0.7}
                    onPress={() => setSelectedTopicId(topic.id)}
                  >
                    <View
                      style={[
                        styles.iconBox,
                        {
                          backgroundColor: isDark ? colors.surfaceAlt : '#E5E7EB',
                        },
                      ]}
                    >
                      <Ionicons
                        name={topic.icon}
                        size={20}
                        color={colors.text}
                      />
                    </View>
                    <Text style={[styles.itemTitle, { color: colors.text }]}>
                      {topic.title}
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={isDark ? '#6B7280' : '#4B5563'}
                    />
                  </TouchableOpacity>
                  {index < LEARNING_HELP_TOPICS.length - 1 && (
                    <View
                      style={[
                        styles.separator,
                        { backgroundColor: isDark ? colors.border : '#E5E7EB' },
                      ]}
                    />
                  )}
                </React.Fragment>
              ))}
            </View>
          </>
        )}

        {/* VIEW 2: Detail Screen for Selected Learning Topic */}
        {selectedTopic && (
          <>
            <Text style={[styles.title, { color: colors.text }]}>
              {selectedTopic.title}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {selectedTopic.subtitle}
            </Text>

            {/* Numbered Steps */}
            <View style={styles.stepsContainer}>
              {selectedTopic.steps.map((s, index) => (
                <View key={s.step} style={styles.stepBlock}>
                  <View style={styles.stepRow}>
                    <View
                      style={[
                        styles.stepNumberBadge,
                        {
                          backgroundColor: isDark ? colors.surfaceAlt : '#F3F4F6',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.stepNumberText,
                          { color: colors.text },
                        ]}
                      >
                        {s.step}
                      </Text>
                    </View>
                    <View style={styles.stepContent}>
                      <View style={styles.stepHeaderLine}>
                        {s.titleIcon && (
                          <Ionicons
                            name={s.titleIcon}
                            size={16}
                            color={colors.text}
                            style={styles.stepTitleIcon}
                          />
                        )}
                        <Text style={[styles.stepTitle, { color: colors.text }]}>
                          {s.title}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.stepDescription,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {s.description}
                      </Text>
                    </View>
                  </View>
                  {index < selectedTopic.steps.length - 1 && (
                    <View
                      style={[
                        styles.stepSeparator,
                        { backgroundColor: isDark ? colors.border : '#E5E7EB' },
                      ]}
                    />
                  )}
                </View>
              ))}
            </View>

            {/* Callout Card (e.g. "Is your class incorrect?", "Why is a topic locked?") */}
            {selectedTopic.callout && (
              <TouchableOpacity
                style={[
                  styles.calloutCard,
                  {
                    backgroundColor: isDark ? colors.surfaceAlt : '#F3F4F6',
                  },
                ]}
                activeOpacity={selectedTopic.callout.actionRoute ? 0.7 : 1}
                onPress={() => {
                  if (selectedTopic.callout?.actionRoute) {
                    router.push(selectedTopic.callout.actionRoute as any);
                  }
                }}
              >
                <Text style={[styles.calloutTitle, { color: colors.text }]}>
                  {selectedTopic.callout.title}
                </Text>
                <Text
                  style={[
                    styles.calloutDescription,
                    { color: colors.textSecondary },
                  ]}
                >
                  {selectedTopic.callout.description}
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {/* Bottom Contact Card & Privacy Notice */}
        <View style={styles.bottomSection}>
          <TouchableOpacity
            style={[
              styles.contactCard,
              {
                backgroundColor: isDark ? '#143834' : '#CCFBEF',
                borderColor: isDark ? '#1D5A53' : '#A7F3D0',
              },
            ]}
            activeOpacity={0.8}
            onPress={handleEmailSupport}
          >
            <View
              style={[
                styles.contactIconBox,
                {
                  backgroundColor: isDark ? '#1A4D46' : '#FFFFFF',
                },
              ]}
            >
              <Ionicons
                name="mail-outline"
                size={22}
                color={isDark ? '#2DD4BF' : '#0F766E'}
              />
            </View>
            <View style={styles.contactTextBox}>
              <Text
                style={[
                  styles.contactLabel,
                  { color: isDark ? '#99F6E4' : '#374151' },
                ]}
              >
                Contact Support
              </Text>
              <Text
                style={[
                  styles.contactEmail,
                  { color: isDark ? '#2DD4BF' : '#0F766E' },
                ]}
              >
                support@kschoolmate.com
              </Text>
            </View>
          </TouchableOpacity>

          {/* Privacy Disclaimer Note */}
          <View style={styles.disclaimerContainer}>
            <Text
              style={[
                styles.disclaimerText,
                { color: isDark ? '#9CA3AF' : '#6B7280' },
              ]}
            >
              Tell us where you got stuck. You can ask a trusted adult for help.{'\n'}
              <Text style={styles.boldDisclaimer}>
                Do not send passwords or verification codes.
              </Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
    lineHeight: 34,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    marginBottom: 20,
  },
  journeyCard: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  journeyHeader: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
  },
  journeyFlow: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 6,
  },
  journeyFlowSecondary: {
    fontSize: 14,
    fontWeight: '800',
  },
  summaryNote: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    marginBottom: 10,
  },
  revisionNote: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    marginBottom: 20,
  },
  listContainer: {
    marginBottom: 24,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  itemTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 60,
  },
  stepsContainer: {
    marginBottom: 20,
  },
  stepBlock: {
    marginBottom: 14,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 6,
  },
  stepNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: 15,
    fontWeight: '800',
  },
  stepContent: {
    flex: 1,
  },
  stepHeaderLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepTitleIcon: {
    marginRight: 6,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  stepDescription: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '400',
  },
  stepSeparator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 46,
    marginTop: 14,
  },
  calloutCard: {
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    marginBottom: 24,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  calloutDescription: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '400',
  },
  bottomSection: {
    marginTop: 8,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  contactIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  contactTextBox: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 2,
  },
  contactEmail: {
    fontSize: 15,
    fontWeight: '800',
  },
  disclaimerContainer: {
    paddingHorizontal: 4,
    marginBottom: 20,
  },
  disclaimerText: {
    fontSize: 12,
    lineHeight: 18,
  },
  boldDisclaimer: {
    fontWeight: '800',
  },
});
