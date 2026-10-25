import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import PrimaryButton from '@/components/ui/PrimaryButton';
import ResponseMessageModal from '@/components/ui/ResponseMessageModal';
import { useResponseModal } from '@/hooks/useResponseModal';
import { useAuth } from '@/store/AuthContext';
import { subjectService } from '@/services/subject.service';
import { useAppTheme } from '@/hooks/useAppTheme';

export default function SelectSubjectsScreen() {
  const { colors, isDark } = useAppTheme();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ class?: string }>();
  const currentClass = params.class || user?.class || 'JSS 1';
  const { modalConfig, showWarning, hideModal } = useResponseModal();

  const [subjectsList, setSubjectsList] = useState<any[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getSubjectIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('math')) return 'calculator-outline' as const;
    if (lower.includes('english')) return 'book-outline' as const;
    if (lower.includes('science') || lower.includes('physics') || lower.includes('chemistry') || lower.includes('biology')) return 'flask-outline' as const;
    if (lower.includes('tech') || lower.includes('computer')) return 'hardware-chip-outline' as const;
    if (lower.includes('civic')) return 'shield-outline' as const;
    if (lower.includes('social')) return 'globe-outline' as const;
    if (lower.includes('business')) return 'briefcase-outline' as const;
    if (lower.includes('agric')) return 'leaf-outline' as const;
    if (lower.includes('health') || lower.includes('physical')) return 'pulse-outline' as const;
    return 'book-outline' as const;
  };

  useEffect(() => {
    const fetchClassSubjects = async () => {
      try {
        setIsLoading(true);
        const data = await subjectService.getSubjects(currentClass);
        if (data && data.length > 0) {
          const mapped = data.map((item) => ({
            id: item._id,
            name: item.name,
            icon: getSubjectIcon(item.name),
          }));
          setSubjectsList(mapped);
          // Auto-select ALL subjects uploaded for this class
          setSelectedSubjects(mapped.map((s) => s.id));
        } else {
          setSubjectsList([]);
          setSelectedSubjects([]);
        }
      } catch (err) {
        console.warn('Failed to load class subjects from backend:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClassSubjects();
  }, [currentClass]);

  const handleSubjectCardPress = (subjectName: string) => {
    showWarning(
      'Full Curriculum Enrollment',
      `As an enrolled student in ${currentClass}, you are automatically entitled to all ${subjectName} lessons and curriculum materials. All subjects are included.`,
      undefined,
      'Got It'
    );
  };

  const handleContinue = () => {
    router.push('/success');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
          <Text style={[styles.backText, { color: colors.text }]}>Back</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        {/* Title */}
        <Text style={[styles.classTitle, { color: colors.text }]}>{currentClass}</Text>
        <Text style={[styles.title, { color: colors.text }]}>Your Curriculum Subjects</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          All subjects uploaded for <Text style={[styles.highlightClass, { color: colors.primary }]}>{currentClass}</Text> are automatically included. You have complete access to all subjects in your class!
        </Text>

        {/* Subjects Grid */}
        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading curriculum subjects...</Text>
          </View>
        ) : subjectsList.length === 0 ? (
          <View style={[styles.emptyBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="folder-open-outline" size={48} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Subjects Uploaded Yet</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>The administrator will upload curriculum subjects for {currentClass} shortly.</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.gridContainer} showsVerticalScrollIndicator={false}>
            {subjectsList.map((subject) => {
              return (
                <TouchableOpacity
                  key={subject.id}
                  style={[
                    styles.subjectCard,
                    {
                      backgroundColor: colors.cardHighlightBg,
                      borderColor: colors.cardHighlightBorder,
                      borderWidth: 2,
                    },
                  ]}
                  onPress={() => handleSubjectCardPress(subject.name)}
                  activeOpacity={0.8}
                >
                  <View style={styles.cardHeaderRow}>
                    <View style={[styles.iconBox, { backgroundColor: colors.primaryMint }]}>
                      <Ionicons name={subject.icon} size={20} color={colors.primary} />
                    </View>
                    <View style={[styles.checkBadge, { backgroundColor: colors.success }]}>
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                    </View>
                  </View>
                  <Text style={[styles.subjectText, { color: colors.text }]}>
                    {subject.name}
                  </Text>
                  <View style={styles.enrolledRow}>
                    <Ionicons name="lock-closed" size={11} color={colors.success} />
                    <Text style={[styles.enrolledText, { color: colors.success }]}>Enrolled (All Included)</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <PrimaryButton 
            title="Continue" 
            onPress={handleContinue} 
          />
        </View>
      </View>

      <ResponseMessageModal
        visible={modalConfig.visible}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        primaryButtonText={modalConfig.primaryButtonText}
        secondaryButtonText={modalConfig.secondaryButtonText}
        onPrimaryPress={modalConfig.onPrimaryPress}
        onSecondaryPress={modalConfig.onSecondaryPress}
        onClose={hideModal}
        timeoutMs={modalConfig.timeoutMs}
      />
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
    paddingBottom: 24,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  classTitle: {
    fontSize: 24,
    fontWeight: '800',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  highlightClass: {
    fontWeight: '800',
  },
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyBox: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 20,
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
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 20,
    gap: 16,
  },
  subjectCard: {
    width: '47%',
    minHeight: 130,
    borderRadius: 20,
    padding: 14,
    justifyContent: 'space-between',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subjectText: {
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
    marginBottom: 8,
  },
  enrolledRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  enrolledText: {
    fontSize: 11,
    fontWeight: '700',
  },
  actionsContainer: {
    marginTop: 'auto',
    marginBottom: 40,
    paddingTop: 16,
  },
});
