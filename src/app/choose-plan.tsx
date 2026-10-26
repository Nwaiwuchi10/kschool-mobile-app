import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import PrimaryButton from '@/components/ui/PrimaryButton';
import { useClass } from '@/store/ClassContext';
import { subscriptionService, SubscriptionPackage } from '@/services/subscription.service';
import { useAppTheme } from '@/hooks/useAppTheme';

export default function ChoosePlanScreen() {
  const { colors, isDark } = useAppTheme();
  const { selectedClass } = useClass();
  const currentClass = selectedClass || 'JSS 1';

  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [selectedPkg, setSelectedPkg] = useState<SubscriptionPackage | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadPackages = async () => {
      try {
        setIsLoading(true);
        const data = await subscriptionService.getPackages();
        if (data && data.length > 0) {
          setPackages(data);
          // Match current class package or default to first
          const matched = data.find((p) => p.name.includes(currentClass)) || data[0];
          setSelectedPkg(matched);
        }
      } catch (err) {
        console.warn('Error loading packages:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadPackages();
  }, [currentClass]);

  const packageName = selectedPkg?.name || `${currentClass} Learning Package`;
  const sessionName = selectedPkg?.academicSession || '2026/2027 Academic Session';
  const priceDisplay = selectedPkg?.price
    ? `₦${Number(selectedPkg.price).toLocaleString()}`
    : '₦0';

  const handleContinue = () => {
    if (!selectedPkg) return;
    router.push({
      pathname: '/payment-summary',
      params: {
        packageId: selectedPkg._id,
        packageName,
        academicSession: selectedPkg.academicSession || '2026/2027',
        price: selectedPkg.price.toString(),
      },
    });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={[styles.headerTag, { color: colors.primary }]}>PAYMENT & SUBSCRIPTION</Text>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Choose Learning Plan</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.text }]}>Learn without limits</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          One simple package for a complete academic session.
        </Text>

        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : (
          /* Plan Card */
          <View style={[styles.planCard, { backgroundColor: isDark ? colors.surfaceAlt : '#D7F5ED' }]}>
            <View style={[styles.cardIconBox, { backgroundColor: colors.surface }]}>
              <Text style={{ fontSize: 24 }}>📚</Text>
            </View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{packageName}</Text>
            <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>{sessionName}</Text>

            <View style={styles.featuresContainer}>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                <Text style={[styles.featureText, { color: colors.text }]}>Full access to all {currentClass} subjects</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                <Text style={[styles.featureText, { color: colors.text }]}>Interactive lessons and practice quizzes</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                <Text style={[styles.featureText, { color: colors.text }]}>Progress tracking throughout the session</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                <Text style={[styles.featureText, { color: colors.text }]}>New learning content as it is released</Text>
              </View>
            </View>

            <Text style={[styles.priceValue, { color: colors.primary }]}>{priceDisplay}</Text>
            <Text style={[styles.pricePeriod, { color: colors.textSecondary }]}>per Academic Session</Text>
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <PrimaryButton title="Continue to Payment" onPress={handleContinue} />
        <Text style={[styles.footerText, { color: colors.textMuted }]}>Secure payment powered by Paystack</Text>
      </View>
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
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
    marginLeft: -8,
  },
  headerTitleBox: {
    flex: 1,
    paddingTop: 4,
  },
  headerTag: {
    fontSize: 11,
    fontWeight: '800',
    color: '#127A71',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
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
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 28,
    lineHeight: 24,
  },
  loadingBox: {
    padding: 40,
    alignItems: 'center',
  },
  planCard: {
    backgroundColor: '#D7F5ED',
    borderRadius: 24,
    padding: 24,
  },
  cardIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
    fontWeight: '500',
  },
  featuresContainer: {
    gap: 16,
    marginBottom: 28,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
    flex: 1,
  },
  priceValue: {
    fontSize: 38,
    fontWeight: '900',
    color: '#127A71',
    marginBottom: 2,
  },
  pricePeriod: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 16,
  },
  footerText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
  },
});
