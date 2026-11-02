import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';
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
import { router } from 'expo-router';
import { useAppTheme } from '@/hooks/useAppTheme';

interface Section {
  number: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
}

const SECTIONS: Section[] = [
  {
    number: '1.',
    title: 'Introduction',
    paragraphs: [
      'KSCHOOLMATE is an educational technology service platform providing digital lessons, revision tests, exercises, and interactive learning tools. Our mission is to make quality foundational education accessible, engaging, and measurable for every student.',
      'This Privacy Policy describes how we collect, use, store, and protect information when you access or use our mobile applications, websites, services, and related educational platforms (collectively, the "Services").',
      'By visiting, downloading, or using our Services, you agree to the collection and use of your information in accordance with this Privacy Policy and applicable data protection regulations. If you do not agree with this policy, please do not use our Services.',
      'We understand the special sensitivity around data relating to children and learners. Protecting your trust and safeguarding your personal information is at the core of everything we build.',
    ],
  },
  {
    number: '2.',
    title: 'Who This Policy Covers',
    paragraphs: [
      'This Privacy Policy applies to all individuals who access or use our Services, including students, parents, guardians, teachers, and school administrators.',
      'The platform serves three main user groups:',
    ],
    bullets: [
      'Learners and students using the app to study, complete exercises, and take quizzes.',
      'Parents and guardians managing learning subscriptions and monitoring progress.',
      'Schools and partner educators utilizing school-managed accounts.',
    ],
  },
  {
    number: '3.',
    title: 'Information We Collect',
    paragraphs: [
      'Information You Provide: When registering an account, you or your parent/school may provide personal details such as your full name, email address, phone number, school name, and current grade or class level.',
      'Learning & Usage Information: As you engage with KSCHOOLMATE, we automatically collect details about your learning activity, completed lessons, exercise and quiz attempts, scores, time spent per topic, and playback preferences.',
      'Device and Technical Information: We collect basic technical information including device model, operating system version, app version, unique identifiers, and crash logs to ensure app performance and fix technical bugs.',
    ],
  },
  {
    number: '4.',
    title: 'How We Use Information and Our Lawful Bases',
    paragraphs: [
      'We use the information we collect strictly to deliver, maintain, personalize, and improve your educational experience on KSCHOOLMATE.',
      'Key uses include: providing access to curriculum-aligned lessons, recording quiz and test scores, generating progress analytics, verifying subscriptions and payment status, providing customer support, preventing unauthorized access, and complying with applicable legal obligations.',
    ],
  },
  {
    number: '5.',
    title: "Children's Privacy and Parent or Guardian Involvement",
    paragraphs: [
      'KSCHOOLMATE is designed for learners, many of whom are young students. We are committed to adhering strictly to applicable child data protection standards.',
      'Where a student is under the age of digital consent, parental or guardian consent must be provided before creating an individual account. Parents and guardians may review, update, or request the deletion of their child’s personal information at any time by contacting support@kschoolmate.com.',
    ],
  },
  {
    number: '6.',
    title: 'School-Managed Accounts',
    paragraphs: [
      'When an account is created or provided by a participating school or educational institution, the school acts as the primary administrator of the student roster.',
      'In these cases, KSCHOOLMATE processes student data as an authorized educational service provider, and any student record access is governed by the agreement between KSCHOOLMATE and the respective school.',
    ],
  },
  {
    number: '7.',
    title: 'Sharing Personal Information',
    paragraphs: [
      'We do NOT sell, rent, or trade student personal information to third parties or advertisers under any circumstances.',
      'We may share data solely with trusted third-party service providers (such as cloud hosting infrastructure and secure payment processors) who are contractually bound by confidentiality and data protection standards to operate exclusively on our behalf.',
    ],
  },
  {
    number: '8.',
    title: 'Subscriptions and Payments',
    paragraphs: [
      'Payments for KSCHOOLMATE premium subscriptions are handled via authorized, PCI-compliant payment gateways. KSCHOOLMATE does not store full credit card numbers or sensitive banking PINs on its own servers.',
    ],
  },
  {
    number: '9.',
    title: 'Data Retention and Account Closure',
    paragraphs: [
      'We retain your personal information only for as long as your account remains active or as needed to provide you with educational services and maintain historical learning progress.',
      'Upon request or account closure, we securely delete or anonymize personal data in accordance with our retention policy and applicable laws.',
    ],
  },
  {
    number: '10.',
    title: 'Security',
    paragraphs: [
      'We implement industry-standard organizational, technical, and physical security measures to safeguard your personal data from unauthorized access, loss, alteration, or disclosure.',
      'While no system can guarantee 100% security, we continually review and update our safeguards to protect your personal information.',
    ],
  },
  {
    number: '11.',
    title: 'International Data Transfers',
    paragraphs: [
      'Your information may be stored and processed on secure cloud servers. Where cross-border data transfers occur, we take all reasonable steps to ensure data is handled securely and in compliance with this Privacy Policy.',
    ],
  },
  {
    number: '12.',
    title: 'Your Privacy Rights and Choices',
    paragraphs: [
      'Depending on your location and applicable law, you have rights regarding your personal information, including: the right to access the data we hold about you, the right to correct inaccurate records, the right to request deletion of your account and associated data, and the right to object to specific data processing.',
      'To exercise any of these rights, please contact our support team at support@kschoolmate.com.',
    ],
  },
  {
    number: '13.',
    title: 'Cookies, Analytics and Communications',
    paragraphs: [
      'We may use strictly necessary cookies and analytics tools to understand application performance, resolve crashes, and enhance user experience. We do not use third-party tracking cookies for targeted behavioral advertising.',
    ],
  },
  {
    number: '14.',
    title: 'Changes to This Policy',
    paragraphs: [
      'We may update this Privacy Policy from time to time to reflect changes in our practices or applicable regulatory standards. Any material changes will be announced in the app or via registered email notifications.',
    ],
  },
  {
    number: '15.',
    title: 'Contact Us',
    paragraphs: [
      'If you have questions, concerns, or requests regarding this Privacy Policy or your personal information, please contact us:',
      'Email: support@kschoolmate.com',
      'Privacy Officer / Data Protection Officer, KSCHOOLMATE Educational Services.',
    ],
  },
];

export default function PrivacyPolicyScreen() {
  const { colors, isDark } = useAppTheme();

  const handleEmailSupport = () => {
    Linking.openURL('mailto:support@kschoolmate.com?subject=Privacy%20Inquiry%20-%20KSCHOOLMATE');
  };

  const handleWebsite = () => {
    Linking.openURL('https://kschoolmate.com');
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
          onPress={() => router.back()}
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
        {/* Title */}
        <Text style={[styles.title, { color: colors.text }]}>
          KSCHOOLMATE Privacy{'\n'}Policy
        </Text>

        {/* Short / plain English Pill */}
        <View
          style={[
            styles.badgePill,
            {
              backgroundColor: isDark ? '#143834' : '#CCFBEF',
              borderColor: isDark ? '#1D5A53' : '#A7F3D0',
            },
          ]}
        >
          <Text
            style={[
              styles.badgePillText,
              { color: isDark ? '#2DD4BF' : '#0F766E' },
            ]}
          >
            Short, plain-English summary
          </Text>
        </View>

        {/* Summary Grey Card */}
        <View
          style={[
            styles.summaryCard,
            {
              backgroundColor: isDark ? colors.surfaceAlt : '#F3F4F6',
              borderColor: isDark ? colors.border : '#E5E7EB',
            },
          ]}
        >
          <Text style={[styles.summaryCardText, { color: colors.textSecondary }]}>
            This privacy policy describes how KSCHOOLMATE collects, uses, and safeguards information when you use our educational services.
          </Text>
        </View>

        {/* Meta Info Box */}
        <View style={styles.metaContainer}>
          <Text style={[styles.metaRow, { color: colors.textSecondary }]}>
            <Text style={[styles.metaLabel, { color: colors.text }]}>
              Effective date:{' '}
            </Text>
            1 November 2026
          </Text>
          <Text style={[styles.metaRow, { color: colors.textSecondary }]}>
            <Text style={[styles.metaLabel, { color: colors.text }]}>
              Last updated:{' '}
            </Text>
            1 November 2026
          </Text>
          <TouchableOpacity onPress={handleEmailSupport} activeOpacity={0.7}>
            <Text style={[styles.metaRow, { color: colors.textSecondary }]}>
              <Text style={[styles.metaLabel, { color: colors.text }]}>
                Contact:{' '}
              </Text>
              <Text style={[styles.metaLink, { color: isDark ? '#2DD4BF' : '#0F766E' }]}>
                support@kschoolmate.com
              </Text>
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleWebsite} activeOpacity={0.7}>
            <Text style={[styles.metaRow, { color: colors.textSecondary }]}>
              <Text style={[styles.metaLabel, { color: colors.text }]}>
                Website:{' '}
              </Text>
              <Text style={[styles.metaLink, { color: isDark ? '#2DD4BF' : '#0F766E' }]}>
                kschoolmate.com
              </Text>
            </Text>
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.divider,
            { backgroundColor: isDark ? colors.border : '#E5E7EB' },
          ]}
        />

        {/* Numbered Sections 1 - 15 */}
        {SECTIONS.map((section) => (
          <View key={section.number} style={styles.sectionBlock}>
            <Text style={[styles.sectionHeading, { color: colors.text }]}>
              {section.number} {section.title}
            </Text>

            {section.paragraphs.map((para, pIdx) => (
              <Text
                key={pIdx}
                style={[styles.paragraphText, { color: colors.textSecondary }]}
              >
                {para}
              </Text>
            ))}

            {section.bullets && (
              <View style={styles.bulletList}>
                {section.bullets.map((bullet, bIdx) => (
                  <View key={bIdx} style={styles.bulletRow}>
                    <Text
                      style={[
                        styles.bulletDot,
                        { color: isDark ? '#2DD4BF' : '#0F766E' },
                      ]}
                    >
                      •{' '}
                    </Text>
                    <Text
                      style={[
                        styles.bulletText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {bullet}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}

        {/* Bottom Contact Support Card */}
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
    marginBottom: 14,
  },
  badgePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  badgePillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  summaryCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  summaryCardText: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
  },
  metaContainer: {
    marginBottom: 20,
  },
  metaRow: {
    fontSize: 13,
    lineHeight: 22,
  },
  metaLabel: {
    fontWeight: '700',
  },
  metaLink: {
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginBottom: 24,
  },
  sectionBlock: {
    marginBottom: 24,
  },
  sectionHeading: {
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  paragraphText: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '400',
    marginBottom: 8,
  },
  bulletList: {
    marginTop: 4,
    marginBottom: 8,
    paddingLeft: 6,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  bulletDot: {
    fontSize: 14,
    lineHeight: 18,
    marginRight: 6,
    fontWeight: '900',
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '400',
  },
  bottomSection: {
    marginTop: 16,
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
});
