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

interface HelpTopicStep {
  step: number;
  title: string;
  description: string;
}

interface HelpTopic {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  subtitle: string;
  warningNote?: string;
  steps: HelpTopicStep[];
}

const ACCOUNT_HELP_TOPICS: HelpTopic[] = [
  {
    id: 'cannot-log-in',
    title: 'Cannot Log In',
    icon: 'log-in-outline',
    subtitle: 'Having trouble signing in? Try these steps to get back to learning.',
    steps: [
      {
        step: 1,
        title: 'Check your connection',
        description: 'Make sure your internet is working, then try signing in again.',
      },
      {
        step: 2,
        title: 'Check your sign-in details',
        description:
          'Use the email you registered with. Carefully re-enter your password and check for typing mistakes.',
      },
      {
        step: 3,
        title: 'Try Forgot Password',
        description:
          'If you cannot remember your password, choose Forgot Password on the login screen.',
      },
      {
        step: 4,
        title: 'Still cannot log in?',
        description:
          'Contact Support below if the problem continues. Tell us which screen you were on.',
      },
    ],
  },
  {
    id: 'forgot-password',
    title: 'Forgot Password',
    icon: 'key-outline',
    subtitle: 'You can reset your password after completing the verification steps.',
    warningNote: 'Never share your password or verification codes with anyone, including support.',
    steps: [
      {
        step: 1,
        title: 'Choose Forgot Password',
        description:
          'On the login screen, choose Forgot Password to start the reset process.',
      },
      {
        step: 2,
        title: 'Follow the reset instructions',
        description:
          'Enter the details requested on screen and complete the required verification.',
      },
      {
        step: 3,
        title: 'Choose a new password',
        description:
          'Only after verification, create a new password and follow the on-screen instructions.',
      },
      {
        step: 4,
        title: 'Need help with the reset?',
        description:
          'If you cannot complete a step, Contact Support below and describe where you got stuck.',
      },
    ],
  },
  {
    id: 'verification-code',
    title: 'Verification Code Not Received',
    icon: 'chatbubble-ellipses-outline',
    subtitle:
      'Waiting for a code? These checks may help you find it or request another.',
    steps: [
      {
        step: 1,
        title: 'Check your contact details',
        description:
          'Make sure the contact details you entered are correct. Fix any typing mistakes.',
      },
      {
        step: 2,
        title: 'Look for the message',
        description:
          'Check your messages. If you used email, also look in your spam or junk folder.',
      },
      {
        step: 3,
        title: 'Try Resend Code',
        description:
          'Allow time for the code to arrive. If it has not arrived, choose Resend Code on screen.',
      },
      {
        step: 4,
        title: 'Still no code?',
        description:
          'Contact Support below if the code still does not arrive. Do not send any verification codes.',
      },
    ],
  },
  {
    id: 'trouble-creating-account',
    title: 'Trouble Creating an Account',
    icon: 'person-add-outline',
    subtitle:
      'Let’s check a few things so you can finish setting up your account.',
    steps: [
      {
        step: 1,
        title: 'Check your connection',
        description:
          'Make sure your internet is working before trying to create your account again.',
      },
      {
        step: 2,
        title: 'Review the required details',
        description:
          'Fill in all required fields carefully. Check for typing mistakes and any on-screen messages.',
      },
      {
        step: 3,
        title: 'Already have an account?',
        description:
          'Try signing in instead. If you do not remember your password, choose Forgot Password.',
      },
      {
        step: 4,
        title: 'Ask for help',
        description:
          'Contact Support below if you still cannot create an account. Tell us where you got stuck.',
      },
    ],
  },
  {
    id: 'incorrect-class-school',
    title: 'Incorrect Class or School',
    icon: 'school-outline',
    subtitle:
      'If your class or school looks wrong, check your profile before making a change.',
    steps: [
      {
        step: 1,
        title: 'Check your Profile',
        description:
          'Open Settings, then Profile. Check the class and school recorded on your account.',
      },
      {
        step: 2,
        title: 'Look in Edit Profile',
        description:
          'Choose Edit Profile. If a class or school change is available, follow the on-screen steps.',
      },
      {
        step: 3,
        title: 'Check your learning content',
        description:
          'Class and school changes follow the app’s account rules. Learning content follows an eligible class change.',
      },
      {
        step: 4,
        title: 'Cannot make a correction?',
        description:
          'Contact Support below if the correction is unavailable or you need help with your class or school.',
      },
    ],
  },
  {
    id: 'update-account-details',
    title: 'Update Account Details',
    icon: 'settings-outline',
    subtitle:
      'Keep your profile up to date by changing the details available to edit.',
    steps: [
      {
        step: 1,
        title: 'Open your Profile',
        description:
          'Go to Settings, then choose Profile to view your account details.',
      },
      {
        step: 2,
        title: 'Choose Edit Profile',
        description:
          'Select Edit Profile to see which details you can change.',
      },
      {
        step: 3,
        title: 'Update and save',
        description:
          'Change your name, phone number, avatar or other editable details. Select Save Changes when you are done.',
      },
      {
        step: 4,
        title: 'Need to change something else?',
        description:
          'Class and school follow account rules. If a detail cannot be edited or saved, Contact Support below.',
      },
    ],
  },
];

export default function AccountHelpScreen() {
  const { colors, isDark } = useAppTheme();
  const params = useLocalSearchParams<{ topic?: string }>();
  
  // Selected topic ID, if null then shows the Hub view
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(
    params.topic || null
  );

  const selectedTopic = ACCOUNT_HELP_TOPICS.find((t) => t.id === selectedTopicId);

  const handleEmailSupport = () => {
    const topicSubject = selectedTopic ? selectedTopic.title : 'Account Help';
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
        {/* VIEW 1: Main Topic Hub */}
        {!selectedTopic && (
          <>
            <Text style={[styles.title, { color: colors.text }]}>
              Account & Login Help
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Need a hand? Choose a topic below to find simple steps to help with your account.
            </Text>

            <View style={styles.listContainer}>
              {ACCOUNT_HELP_TOPICS.map((topic, index) => (
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
                  {index < ACCOUNT_HELP_TOPICS.length - 1 && (
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

        {/* VIEW 2: Detail Step-by-Step Guide for Selected Topic */}
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
              {selectedTopic.steps.map((s) => (
                <View key={s.step} style={styles.stepRow}>
                  <View
                    style={[
                      styles.stepNumberBadge,
                      {
                        backgroundColor: isDark ? colors.surfaceAlt : '#F3F4F6',
                        borderColor: isDark ? colors.border : '#E5E7EB',
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
                    <Text style={[styles.stepTitle, { color: colors.text }]}>
                      {s.title}
                    </Text>
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
              ))}
            </View>

            {/* Optional security warning note */}
            {selectedTopic.warningNote && (
              <View
                style={[
                  styles.warningNoteContainer,
                  { borderTopColor: isDark ? colors.border : '#E5E7EB' },
                ]}
              >
                <Text
                  style={[
                    styles.warningNoteText,
                    { color: isDark ? '#D1D5DB' : '#1A1A1A' },
                  ]}
                >
                  {selectedTopic.warningNote}
                </Text>
              </View>
            )}
          </>
        )}

        {/* Shared Bottom Contact Card & Privacy Notice */}
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
              Briefly describe the problem and the screen where it happened.{'\n'}
              <Text style={styles.boldDisclaimer}>
                Do not send passwords or verification codes.
              </Text>
              {'\n'}
              You can ask a trusted adult for help.
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
    marginBottom: 24,
  },
  listContainer: {
    marginBottom: 32,
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
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 22,
  },
  stepNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
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
  stepTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '400',
  },
  warningNoteContainer: {
    marginTop: 8,
    marginBottom: 24,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  warningNoteText: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
  bottomSection: {
    marginTop: 12,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    marginBottom: 16,
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

