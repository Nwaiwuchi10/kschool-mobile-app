import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { subjectService, MobileSubject } from '@/services/subject.service';
import { useAuth } from '@/store/AuthContext';
import { useClass } from '@/store/ClassContext';

import { useAppTheme } from '@/hooks/useAppTheme';

export default function SubjectsScreen() {
  const { user } = useAuth();
  const { selectedClass } = useClass();
  const { colors, isDark } = useAppTheme();
  const currentClass = selectedClass || user?.class || 'JSS 1';

  const [subjects, setSubjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const getSubjectIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('math')) return 'calculator-outline' as const;
    if (lower.includes('english')) return 'book-outline' as const;
    if (lower.includes('science') || lower.includes('physics') || lower.includes('chemistry') || lower.includes('biology')) return 'flask-outline' as const;
    if (lower.includes('computer')) return 'desktop-outline' as const;
    if (lower.includes('civic')) return 'shield-outline' as const;
    if (lower.includes('social')) return 'globe-outline' as const;
    if (lower.includes('business')) return 'briefcase-outline' as const;
    return 'school-outline' as const;
  };

  const fetchSubjects = useCallback(async () => {
    try {
      const data = await subjectService.getSubjects(currentClass);
      if (data && data.length > 0) {
        const mapped = data.map((item) => {
          const totalTopics = item.topics?.length || 0;
          return {
            _id: item._id,
            name: item.name,
            progress: item.progress || 0,
            icon: getSubjectIcon(item.name),
            totalTopics,
          };
        });
        setSubjects(mapped);
      } else {
        setSubjects([]);
      }
    } catch (err) {
      console.warn('Failed to load subjects from backend:', err);
      setSubjects([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [currentClass]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchSubjects();
  };

  const handleSubjectPress = (subject: any) => {
    router.push({
      pathname: '/(tabs)/subject-details',
      params: { id: subject._id, name: subject.name },
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
              router.replace('/(tabs)');
            }
          }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>My Subjects</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        <Text style={[styles.title, { color: colors.text }]}>Your Curriculum</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Active curriculum for <Text style={{ fontWeight: '800', color: colors.primary }}>{currentClass}</Text>. Track your learning courses and master each topic.
        </Text>

        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading curriculum subjects...</Text>
          </View>
        ) : subjects.length === 0 ? (
          <View style={[styles.emptyContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="folder-open-outline" size={48} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Subjects Found</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No curriculum subjects have been uploaded for {currentClass} yet.</Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {subjects.map((subject) => (
              <TouchableOpacity 
                key={subject._id} 
                style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => handleSubjectPress(subject)}
              >
                <View style={[styles.iconBox, { backgroundColor: colors.primaryMint }]}>
                  <Ionicons name={subject.icon} size={24} color={colors.primary} />
                </View>
                <View style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <Text style={[styles.subjectName, { color: colors.text }]}>{subject.name}</Text>
                    <Text style={[styles.progressText, { color: colors.primary }]}>{subject.progress}%</Text>
                  </View>
                  <View style={[styles.progressBarBg, { backgroundColor: colors.surfaceAlt }]}>
                    <View style={[styles.progressBarFill, { backgroundColor: colors.primary, width: `${subject.progress}%` }]} />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
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
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 32,
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  listContainer: {
    gap: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    padding: 16,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#D1FAE5', // Light cyan
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  progressText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#127A71',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
  },
  progressBarFill: {
    height: 8,
    backgroundColor: '#127A71',
    borderRadius: 4,
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
