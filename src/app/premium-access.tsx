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

export default function PremiumAccessScreen() {
  const { colors, isDark } = useAppTheme();
  const { selectedClass } = useClass();
  const currentClass = selectedClass || 'JSS 1';

  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [selectedPkg, setSelectedPkg] = useState<SubscriptionPackage | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchPackages = async () => {
      try {
        setIsLoading(true);
        const data = await subscriptionService.getPackages();
        if (isMounted && data && data.length > 0) {
          setPackages(data);
          const matched = data.find((p) => p.name.includes(currentClass)) || data[0];
          setSelectedPkg(matched);
        }
      } catch (err) {
        console.warn('Error fetching packages for premium access:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchPackages();
    return () => {
      isMounted = false;
    };
  }, [currentClass]);

  const handleSubscribe = () => {
    if (!selectedPkg) return;
    router.push({
      pathname: '/payment-summary',
      params: {
        packageId: selectedPkg._id,
        packageName: selectedPkg.name,
        academicSession: selectedPkg.academicSession || '2026/2027',
        price: selectedPkg.price.toString(),
      },
    });
  };

  const packageName = selectedPkg?.name || `${currentClass} Learning Package`;
  const academicSession = selectedPkg?.academicSession || 'Full Session Subscription';
  const priceDisplay = selectedPkg?.price ? `₦${selectedPkg.price.toLocaleString()}` : '₦0';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backCircleBtn, { backgroundColor: colors.surfaceAlt }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Premium Access</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Center Graduation Cap Icon */}
        <View style={styles.iconContainer}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primary, shadowColor: colors.primary }]}>
            <Ionicons name="school" size={36} color="#FFFFFF" />
          </View>
        </View>

        <Text style={[styles.title, { color: colors.text }]}>Ready to Keep Learning?</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          You have enjoyed your complimentary first lesson and exercise! Subscribe to unlock all lessons, subjects, and practice quizzes for {currentClass}.
        </Text>

        {isLoading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={{ marginTop: 8, fontSize: 13, color: colors.textSecondary }}>Loading package details...</Text>
          </View>
        ) : (
          /* Subscription Card */
          <View style={[styles.subscriptionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconBox, { backgroundColor: isDark ? colors.surfaceAlt : colors.primaryMint }]}>
                <Text style={{ fontSize: 24 }}>📚</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{packageName}</Text>
                <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>{academicSession}</Text>
              </View>
            </View>

            <View style={[styles.separator, { backgroundColor: colors.border }]} />

            <View style={styles.featuresList}>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                <Text style={[styles.featureText, { color: colors.text }]}>All {currentClass} curriculum subjects</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                <Text style={[styles.featureText, { color: colors.text }]}>Full audio narration with Google Cloud TTS</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                <Text style={[styles.featureText, { color: colors.text }]}>All exercises, practice tests & quizzes</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                <Text style={[styles.featureText, { color: colors.text }]}>Full academic session access & progress tracking</Text>
              </View>
            </View>

            <View style={styles.priceContainer}>
              <Text style={[styles.priceAmount, { color: colors.primary }]}>{priceDisplay}</Text>
              <Text style={[styles.pricePeriod, { color: colors.textSecondary }]}>/ Academic Session</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <PrimaryButton title="Subscribe with Monnify" onPress={handleSubscribe} disabled={isLoading || !selectedPkg} />
        <Text style={[styles.footerText, { color: colors.textMuted }]}>Secure payment powered by Monnify</Text>
      </View>
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  backCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  container: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  iconContainer: {
    marginVertical: 20,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
    paddingHorizontal: 16,
  },
  subscriptionCard: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 24,
    padding: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  cardIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  separator: {
    height: 1,
    marginVertical: 20,
  },
  featuresList: {
    gap: 16,
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 8,
  },
  priceAmount: {
    fontSize: 32,
    fontWeight: '900',
  },
  pricePeriod: {
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 16,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
  },
});
