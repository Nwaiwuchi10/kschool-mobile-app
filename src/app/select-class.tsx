import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import PrimaryButton from '@/components/ui/PrimaryButton';
import ResponseMessageModal from '@/components/ui/ResponseMessageModal';
import { useResponseModal } from '@/hooks/useResponseModal';
import { useClass } from '@/store/ClassContext';
import { useAppTheme } from '@/hooks/useAppTheme';

export default function SelectClassScreen() {
  const { colors, isDark } = useAppTheme();
  const { classes, selectedClass, paidClass, isClassLocked, isLoadingClasses, selectClass } = useClass();
  const { modalConfig, showError, showWarning, hideModal } = useResponseModal();
  
  const [currentSelected, setCurrentSelected] = useState<string>(selectedClass || 'JSS 1');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (selectedClass) {
      setCurrentSelected(selectedClass);
    }
  }, [selectedClass]);

  const handleClassPress = (className: string) => {
    if (isClassLocked && paidClass && paidClass.toLowerCase() !== className.toLowerCase()) {
      showWarning(
        'Subscribed Class Locked',
        `You have an active paid subscription for ${paidClass}. In accordance with your academic enrollment, your learning content is locked to this class for the session.`,
        undefined,
        'Understood'
      );
      return;
    }
    setCurrentSelected(className);
  };

  const handleContinue = async () => {
    if (!currentSelected) {
      showError('Class Required', 'Please select a class to continue.');
      return;
    }

    try {
      setIsLoading(true);
      await selectClass(currentSelected);

      router.push({
        pathname: '/select-subjects',
        params: { class: currentSelected },
      });
    } catch (err: any) {
      showError('Selection Error', err.message || 'Failed to select class. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
        <Text style={[styles.title, { color: colors.text }]}>What class are you in?</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Select your current curriculum class level
        </Text>

        {/* Locked Class Notice Banner */}
        {isClassLocked && paidClass ? (
          <View style={[styles.lockedBanner, { backgroundColor: colors.cardHighlightBg, borderColor: colors.cardHighlightBorder }]}>
            <Ionicons name="lock-closed" size={18} color={colors.primary} />
            <Text style={[styles.lockedBannerText, { color: colors.primary }]}>
              Enrolled in <Text style={{ fontWeight: '800' }}>{paidClass}</Text> (Active Subscription)
            </Text>
          </View>
        ) : null}

        {/* Classes Grid */}
        {isLoadingClasses ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading curriculum classes...</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.gridContainer} showsVerticalScrollIndicator={false}>
            {classes.map((cls) => {
              const isSelected = currentSelected === cls.name;
              const isUserPaidClass = paidClass && paidClass.toLowerCase() === cls.name.toLowerCase();

              return (
                <TouchableOpacity
                  key={cls._id || cls.code || cls.name}
                  style={[
                    styles.classPill,
                    {
                      backgroundColor: isSelected ? colors.cardHighlightBg : colors.surface,
                      borderColor: isSelected ? colors.primary : colors.border,
                      borderWidth: isSelected ? 2 : 1,
                    },
                  ]}
                  onPress={() => handleClassPress(cls.name)}
                >
                  <Text style={[
                    styles.classText,
                    { color: isSelected ? colors.primary : colors.text },
                    isUserPaidClass && { color: colors.primary },
                  ]}>
                    {cls.name}
                  </Text>
                  {isUserPaidClass && (
                    <View style={styles.badgeContainer}>
                      <Ionicons name="shield-checkmark" size={12} color={colors.primary} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <PrimaryButton 
            title="Continue" 
            loading={isLoading}
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
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
  },
  lockedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    marginBottom: 20,
    gap: 8,
  },
  lockedBannerText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  classPill: {
    width: '30%',
    height: 58,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  classText: {
    fontSize: 15,
    fontWeight: '700',
  },
  badgeContainer: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  actionsContainer: {
    marginTop: 'auto',
    marginBottom: 40,
    paddingTop: 16,
  },
});
