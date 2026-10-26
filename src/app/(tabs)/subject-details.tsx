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
import { useAppTheme } from '@/hooks/useAppTheme';

export interface CurriculumItem {
  id: string; // e.g. "01", "02"
  _id: string;
  title: string;
  subtitle: string;
  status: 'active' | 'completed' | 'locked';
  isLocked: boolean;
  topicId?: string;
  duration?: string;
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

  useEffect(() => {
    const fetchSubjectDetails = async () => {
      if (!subjectId) return;

      try {
        setIsLoading(true);
        const [subStatus, data] = await Promise.all([
          subscriptionService.getMyActiveSubscription().catch(() => null),
          subjectService.getSubjectById(subjectId),
        ]);

        const isSubscribed =
          !!subStatus &&
          (subStatus.status === 'active' || subStatus.status === 'grace');
        setHasSubscription(isSubscribed);

        const topics = data?.topics || [];
        const flattenedItems: CurriculumItem[] = [];

        // Check if topics exist and if any topic has lessons
        topics.forEach((topic: any) => {
          const lessons = topic.lessons || [];
          if (lessons.length > 0) {
            lessons.forEach((l: any) => {
              flattenedItems.push({
                id: '',
                _id: l._id,
                title: l.title,
                subtitle: l.format || (l.audioUrl ? 'TTS Audio & Text' : 'Text Lesson'),
                status: 'locked',
                isLocked: true,
                topicId: topic._id,
                duration: l.duration || '10 mins',
              });
            });
          } else {
            flattenedItems.push({
              id: '',
              _id: topic._id,
              title: topic.title,
              subtitle: 'Curriculum Topic',
              status: 'locked',
              isLocked: true,
              topicId: topic._id,
            });
          }
        });

        // Set index numbering and sequential lock/unlock status
        const mappedList: CurriculumItem[] = flattenedItems.map((item, idx) => {
          const numStr = (idx + 1).toString().padStart(2, '0');
          let status: 'active' | 'completed' | 'locked' = 'locked';
          let isLocked = idx > 0;

          if (idx === 0) {
            status = 'active';
            isLocked = false;
          } else {
            status = isSubscribed ? 'completed' : 'locked';
            isLocked = !isSubscribed;
          }

          return {
            ...item,
            id: numStr,
            status,
            isLocked,
          };
        });

        setItems(mappedList);
        setProgress(Math.min(100, Math.max(0, data?.progress || (isSubscribed ? 45 : 10))));
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
      router.push('/premium-access');
      return;
    }

    router.push({
      pathname: '/lesson',
      params: {
        id: item._id,
        title: item.title,
        subject: `${subjectName} > ${item.title}`,
        topicId: item.topicId || '',
      },
    });
  };

  const handleContinueLearning = () => {
    const activeItem = items.find((i) => !i.isLocked) || items[0];
    if (activeItem) {
      handleItemPress(activeItem);
    } else {
      router.push('/lesson');
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
                    <View style={{ marginLeft: 20 }}>
                      <Text style={[styles.unitTitleLocked, { color: colors.textSecondary }]}>{item.title}</Text>
                      <Text style={[styles.unitSubtitleLocked, { color: colors.textMuted }]}>
                        {item.isLocked ? 'Locked Lesson' : item.subtitle}
                      </Text>
                    </View>
                  </View>
                  <Ionicons
                    name={item.isLocked ? 'lock-closed-outline' : 'chevron-forward'}
                    size={20}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
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
