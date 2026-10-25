import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { subjectService, MobileSubject } from '@/services/subject.service';
import { useAppTheme } from '@/hooks/useAppTheme';

export default function SubjectDetailsScreen() {
  const { colors, isDark } = useAppTheme();
  const params = useLocalSearchParams<{ id?: string; name?: string }>();
  const subjectId = params.id;
  const subjectName = params.name || 'Subject Curriculum';

  const [units, setUnits] = useState<any[]>([]);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSubscription, setHasSubscription] = useState(false);

  useEffect(() => {
    const fetchSubjectDetails = async () => {
      if (!subjectId) return;

      try {
        setIsLoading(true);
        const { subscriptionService } = await import('@/services/subscription.service');
        const [subStatus, data] = await Promise.all([
          subscriptionService.getMyActiveSubscription().catch(() => null),
          subjectService.getSubjectById(subjectId),
        ]);

        const isSubscribed = !!subStatus && (subStatus.status === 'active' || subStatus.status === 'grace');
        setHasSubscription(isSubscribed);

        if (data && data.topics && data.topics.length > 0) {
          const mappedUnits = data.topics.map((t, idx) => {
            const numStr = (idx + 1).toString().padStart(2, '0');
            // If user has subscription: all topics unlocked.
            // If first timer (no subscription): only first topic (idx === 0) is accessible, others locked.
            let status = 'locked';
            if (isSubscribed) {
              status = idx === 0 ? 'completed' : 'active';
            } else {
              status = idx === 0 ? 'active' : 'locked';
            }

            return {
              id: numStr,
              title: t.title,
              status,
              _id: t._id,
              isLocked: !isSubscribed && idx > 0,
            };
          });
          setUnits(mappedUnits);
          setProgress(data.progress || (isSubscribed ? 30 : 10));
        } else {
          setUnits([]);
          setProgress(0);
        }
      } catch (err) {
        console.warn('Failed to fetch subject details from backend:', err);
        setUnits([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubjectDetails();
  }, [subjectId]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{subjectName}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Overall Progress Card */}
        <View style={[styles.progressCard, { backgroundColor: colors.cardHighlightBg, borderColor: colors.cardHighlightBorder }]}>
          <View style={[styles.progressCardIcon, { backgroundColor: colors.primary }]}>
            <Ionicons name="layers" size={20} color="#FFFFFF" />
          </View>
          <View style={styles.progressCardContent}>
            <View style={styles.progressCardHeader}>
              <Text style={[styles.progressCardTitle, { color: colors.text }]}>Overall Progress</Text>
              <Text style={[styles.progressCardPercent, { color: colors.primary }]}>{progress}%</Text>
            </View>
            <View style={[styles.progressBarBg, { backgroundColor: colors.surfaceAlt }]}>
              <View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: colors.primary }]} />
            </View>
          </View>
        </View>

        {/* Syllabus Units Header */}
        <View style={styles.syllabusHeader}>
          <Text style={[styles.syllabusTitle, { color: colors.text }]}>Syllabus Units</Text>
          <View style={styles.sequentialTag}>
            <Ionicons name="lock-closed-outline" size={12} color={colors.primary} style={{ marginRight: 4 }} />
            <Text style={[styles.sequentialText, { color: colors.primary }]}>Sequential Order</Text>
          </View>
        </View>

        {/* Units List */}
        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading curriculum units...</Text>
          </View>
        ) : units.length === 0 ? (
          <View style={[styles.emptyContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="documents-outline" size={48} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Syllabus Units Yet</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>The administrator will upload topics and lessons for {subjectName} soon.</Text>
          </View>
        ) : (
          <View style={styles.unitsContainer}>
            {units.map((unit) => {
              const handleOpenUnit = () => {
                router.push({
                  pathname: '/topic-details',
                  params: {
                    topicId: unit._id || unit.id,
                    topicTitle: unit.title,
                    subjectName,
                  },
                });
              };

              if (unit.status === 'completed') {
                return (
                  <TouchableOpacity
                    key={unit.id}
                    style={[styles.unitCard, { backgroundColor: colors.surface, borderColor: colors.cardHighlightBorder }]}
                    onPress={handleOpenUnit}
                    activeOpacity={0.7}
                  >
                    <View style={styles.unitLeft}>
                      <View style={[styles.unitNumberBox, { backgroundColor: colors.primaryMint }]}>
                        <Text style={[styles.unitNumberText, { color: colors.primary }]}>{unit.id}</Text>
                      </View>
                      <View>
                        <Text style={[styles.unitTitle, { color: colors.text }]}>{unit.title}</Text>
                        <Text style={[styles.unitSubtitle, { color: colors.textSecondary }]}>Completed</Text>
                      </View>
                    </View>
                    <View style={[styles.completedIcon, { backgroundColor: colors.primary }]}>
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    </View>
                  </TouchableOpacity>
                );
              }

              if (unit.status === 'active') {
                return (
                  <View key={unit.id} style={styles.activeContainer}>
                    <TouchableOpacity
                      style={[styles.unitCard, { backgroundColor: colors.cardHighlightBg, borderColor: colors.primary, borderWidth: 2 }]}
                      onPress={handleOpenUnit}
                      activeOpacity={0.7}
                    >
                      <View style={styles.unitLeft}>
                        <View style={[styles.unitNumberBox, { backgroundColor: colors.primary }]}>
                          <Text style={[styles.unitNumberText, { color: '#FFFFFF' }]}>{unit.id}</Text>
                        </View>
                        <View>
                          <Text style={[styles.unitTitle, { color: colors.text }]}>{unit.title}</Text>
                          <Text style={[styles.unitSubtitleActive, { color: colors.primary }]}>Active Unit</Text>
                        </View>
                      </View>
                      <Ionicons name="play-circle" size={32} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.continueButton, { backgroundColor: colors.primary }]}
                      onPress={handleOpenUnit}
                    >
                      <Text style={styles.continueButtonText}>Continue Lesson</Text>
                    </TouchableOpacity>
                  </View>
                );
              }

              // Locked
              return (
                <TouchableOpacity
                  key={unit.id}
                  style={[styles.unitCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
                  onPress={() => router.push('/premium-access')}
                  activeOpacity={0.7}
                >
                  <View style={styles.unitLeft}>
                    <Text style={[styles.unitNumberTextLocked, { color: colors.textMuted }]}>{unit.id}</Text>
                    <View style={{ marginLeft: 24 }}>
                      <Text style={[styles.unitTitleLocked, { color: colors.textMuted }]}>{unit.title}</Text>
                      <Text style={[styles.unitSubtitleLocked, { color: colors.warning }]}>Premium Topic • Tap to Unlock</Text>
                    </View>
                  </View>
                  <Ionicons name="lock-closed" size={20} color={colors.warning} />
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
  progressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5', // Light cyan background
    borderWidth: 1,
    borderColor: '#127A71',
    borderRadius: 16,
    padding: 16,
    marginBottom: 32,
  },
  progressCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#127A71',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
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
    color: '#1A1A1A',
  },
  progressCardPercent: {
    fontSize: 16,
    fontWeight: '800',
    color: '#127A71',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
  },
  progressBarFill: {
    height: 6,
    backgroundColor: '#127A71',
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
    color: '#1A1A1A',
  },
  sequentialTag: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sequentialText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#127A71',
  },
  loadingBox: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
    color: '#6B7280',
  },
  unitsContainer: {
    gap: 12,
  },
  unitCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
  },
  unitCardCompleted: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D1FAE5',
  },
  unitCardActive: {
    backgroundColor: '#D1FAE5',
    borderColor: '#127A71',
  },
  unitCardLocked: {
    backgroundColor: '#F9FAFB',
    borderColor: '#F3F4F6',
  },
  unitLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unitNumberBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  unitNumberBoxCompleted: {
    backgroundColor: '#D1FAE5',
  },
  unitNumberBoxActive: {
    backgroundColor: '#127A71',
  },
  unitNumberText: {
    fontSize: 16,
    fontWeight: '800',
  },
  unitNumberTextCompleted: {
    color: '#127A71',
  },
  unitNumberTextActive: {
    color: '#FFFFFF',
  },
  unitNumberTextLocked: {
    fontSize: 16,
    fontWeight: '800',
    color: '#D1D5DB',
    width: 40,
    textAlign: 'center',
  },
  unitTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  unitTitleLocked: {
    fontSize: 16,
    fontWeight: '800',
    color: '#9CA3AF',
    marginBottom: 4,
  },
  unitSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  unitSubtitleActive: {
    fontSize: 12,
    color: '#127A71',
  },
  unitSubtitleLocked: {
    fontSize: 12,
    color: '#D1D5DB',
  },
  completedIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#127A71',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeContainer: {
    gap: 8,
  },
  continueButton: {
    backgroundColor: '#127A71',
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
    marginTop: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
});
