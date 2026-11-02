import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAppTheme } from '@/hooks/useAppTheme';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  defaultExpanded?: boolean;
}

interface FAQCategory {
  id: string;
  category: string;
  icon: keyof typeof Ionicons.glyphMap;
  items: FAQItem[];
}

const FAQ_CATEGORIES: FAQCategory[] = [
  {
    id: 'getting-started',
    category: 'Getting Started',
    icon: 'flag-outline',
    items: [
      {
        id: 'gs-1',
        question: 'How do I start learning?',
        answer: 'Open Subjects, choose a subject for your class, and start the available topic.',
        defaultExpanded: true,
      },
    ],
  },
  {
    id: 'account-login',
    category: 'Account and Login',
    icon: 'person-outline',
    items: [
      {
        id: 'al-1',
        question: 'What if I cannot sign in?',
        answer:
          'Check your email and password, then try again. If you still need help, contact Support & Help.',
        defaultExpanded: true,
      },
    ],
  },
  {
    id: 'classes-subjects',
    category: 'Classes and Subjects',
    icon: 'book-outline',
    items: [
      {
        id: 'cs-1',
        question: 'How do I access my class subjects?',
        answer:
          'Navigate to the Subjects tab or your Dashboard. Choose any enrolled subject to explore all included chapters and lessons.',
        defaultExpanded: false,
      },
      {
        id: 'cs-2',
        question: 'Why are some topics locked?',
        answer:
          'Topics unlock in order as you complete them. Premium content also requires an active subscription.',
        defaultExpanded: true,
      },
    ],
  },
  {
    id: 'lessons-audio',
    category: 'Lessons and Audio',
    icon: 'headset-outline',
    items: [
      {
        id: 'la-1',
        question: 'How do I listen to a lesson?',
        answer: 'Open an available lesson and choose the audio option to listen.',
        defaultExpanded: true,
      },
    ],
  },
  {
    id: 'exercises-quizzes',
    category: 'Exercises and Quizzes',
    icon: 'create-outline',
    items: [
      {
        id: 'eq-1',
        question: 'Where do I find topic exercises and quizzes?',
        answer: 'Open an available topic to access its exercises and quiz.',
        defaultExpanded: true,
      },
    ],
  },
  {
    id: 'learning-progress',
    category: 'Learning Progress',
    icon: 'trending-up-outline',
    items: [
      {
        id: 'lp-1',
        question: 'Why must I complete a topic before unlocking the next one?',
        answer:
          'Topics follow a set learning order. Complete the current topic and quiz to unlock the next topic.',
        defaultExpanded: true,
      },
      {
        id: 'lp-2',
        question: 'Where can I see my progress?',
        answer:
          'You can see your overall progress and completed lessons directly from your Home Dashboard and Subject overview screens.',
        defaultExpanded: false,
      },
    ],
  },
  {
    id: 'subscription-payments',
    category: 'Subscription and Payments',
    icon: 'card-outline',
    items: [
      {
        id: 'sp-1',
        question: 'How do I subscribe or check my payment status?',
        answer:
          'Choose Subscribe when prompted for premium access. Open Subscription & Payments to check your package and Payment History.',
        defaultExpanded: true,
      },
    ],
  },
  {
    id: 'offline-learning',
    category: 'Offline Learning',
    icon: 'cloud-offline-outline',
    items: [
      {
        id: 'ol-1',
        question: 'How do I download lessons for offline learning?',
        answer:
          'Contact Support & Help to confirm whether offline downloads are available for your account.',
        defaultExpanded: true,
      },
    ],
  },
];

export default function FAQScreen() {
  const { colors, isDark } = useAppTheme();
  const [searchQuery, setSearchQuery] = useState('');

  // Track expanded state for each FAQ item id
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    FAQ_CATEGORIES.forEach((cat) => {
      cat.items.forEach((item) => {
        if (item.defaultExpanded) {
          initial[item.id] = true;
        }
      });
    });
    return initial;
  });

  const toggleItem = (id: string) => {
    setExpandedMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleEmailSupport = () => {
    Linking.openURL('mailto:support@kschoolmate.com?subject=FAQ%20Inquiry%20-%20KSCHOOLMATE');
  };

  // Filter categories and questions based on search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) {
      return FAQ_CATEGORIES;
    }
    const query = searchQuery.toLowerCase().trim();

    return FAQ_CATEGORIES.map((cat) => {
      const filteredItems = cat.items.filter(
        (item) =>
          item.question.toLowerCase().includes(query) ||
          item.answer.toLowerCase().includes(query)
      );
      return {
        ...cat,
        items: filteredItems,
      };
    }).filter((cat) => cat.items.length > 0);
  }, [searchQuery]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
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
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { color: colors.text }]}>
          Frequently Asked{'\n'}Questions
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Find answers to your learning questions.
        </Text>

        {/* Search Input */}
        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor: isDark ? colors.surfaceAlt : '#F3F4F6',
              borderColor: isDark ? colors.border : '#E5E7EB',
            },
          ]}
        >
          <Ionicons
            name="search-outline"
            size={20}
            color={colors.textSecondary}
            style={styles.searchIcon}
          />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search questions"
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Categories & Accordions */}
        {filteredCategories.map((cat) => (
          <View key={cat.id} style={styles.categorySection}>
            {/* Category header with icon */}
            <View style={styles.categoryHeader}>
              <View
                style={[
                  styles.categoryIconBox,
                  {
                    backgroundColor: isDark ? colors.surfaceAlt : '#E5E7EB',
                  },
                ]}
              >
                <Ionicons name={cat.icon} size={18} color={colors.text} />
              </View>
              <Text style={[styles.categoryTitle, { color: colors.text }]}>
                {cat.category}
              </Text>
            </View>

            {/* Questions in category */}
            {cat.items.map((item) => {
              const isExpanded = expandedMap[item.id] ?? false;

              return (
                <View
                  key={item.id}
                  style={[
                    styles.faqCard,
                    {
                      backgroundColor: isDark ? colors.surface : '#FFFFFF',
                      borderColor: isDark ? colors.border : '#E5E7EB',
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={styles.cardHeader}
                    activeOpacity={0.7}
                    onPress={() => toggleItem(item.id)}
                  >
                    <Text style={[styles.questionText, { color: colors.text }]}>
                      {item.question}
                    </Text>
                    <View
                      style={[
                        styles.toggleButton,
                        {
                          backgroundColor: isExpanded
                            ? isDark
                              ? '#1A4D46'
                              : '#CCFBEF'
                            : isDark
                            ? colors.surfaceAlt
                            : '#F3F4F6',
                        },
                      ]}
                    >
                      <Ionicons
                        name={isExpanded ? 'remove' : 'add'}
                        size={18}
                        color={
                          isExpanded
                            ? isDark
                              ? '#2DD4BF'
                              : '#0F766E'
                            : isDark
                            ? colors.textSecondary
                            : '#6B7280'
                        }
                      />
                    </View>
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={styles.answerContainer}>
                      <Text
                        style={[
                          styles.answerText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {item.answer}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        ))}

        {filteredCategories.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="search" size={40} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No matching questions found for "{searchQuery}".
            </Text>
          </View>
        )}

        {/* Still need help? */}
        <View style={styles.stillNeedHelpSection}>
          <Text style={[styles.stillNeedHelpTitle, { color: colors.text }]}>
            Still need help?
          </Text>

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
                size={24}
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
                Contact support directly
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
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.5,
    lineHeight: 36,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 24,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  categoryTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  faqCard: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  questionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    paddingRight: 12,
    lineHeight: 22,
  },
  toggleButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  answerContainer: {
    marginTop: 12,
    paddingTop: 10,
  },
  answerText: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '400',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 15,
    textAlign: 'center',
  },
  stillNeedHelpSection: {
    marginTop: 20,
    marginBottom: 16,
  },
  stillNeedHelpTitle: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 16,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderWidth: 1,
  },
  contactIconBox: {
    width: 46,
    height: 46,
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
    marginBottom: 4,
  },
  contactEmail: {
    fontSize: 15,
    fontWeight: '800',
  },
});
