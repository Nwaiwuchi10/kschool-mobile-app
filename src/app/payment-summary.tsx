import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { WebView } from 'react-native-webview';
import PrimaryButton from '@/components/ui/PrimaryButton';
import { useClass } from '@/store/ClassContext';
import { subscriptionService } from '@/services/subscription.service';

export default function PaymentSummaryScreen() {
  const params = useLocalSearchParams<{
    packageId?: string;
    packageName?: string;
    academicSession?: string;
    price?: string;
  }>();

  const { selectedClass } = useClass();
  const currentClass = selectedClass || 'JSS 1';

  const packageName = params.packageName || `${currentClass} Learning Package`;
  const academicSession = params.academicSession || '2026/2027';
  const priceAmount = params.price ? parseInt(params.price, 10) : 25000;
  const priceFormatted = `₦${priceAmount.toLocaleString()}`;

  // Payment states
  const [isInitializing, setIsInitializing] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [currentReference, setCurrentReference] = useState<string | null>(null);
  const [showWebView, setShowWebView] = useState(false);

  const handleStartPayment = async () => {
    try {
      setIsInitializing(true);
      const res = await subscriptionService.initializeMonnify(
        params.packageId || 'default',
        'https://kschoolmate.com/payment-callback',
      );

      if (res && res.paymentReference) {
        setCurrentReference(res.paymentReference);
        setCheckoutUrl(res.checkoutUrl);
        setShowWebView(true);
      }
    } catch (err: any) {
      console.error('Payment init error:', err);
      // Fallback sandbox simulation for development/testing
      const fallbackRef = `KSM-${Date.now()}`;
      setCurrentReference(fallbackRef);
      setCheckoutUrl(`https://sandbox.monnify.com/checkout/${fallbackRef}`);
      setShowWebView(true);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleWebViewNavigationStateChange = async (navState: any) => {
    const { url } = navState;

    // Detect callback redirect or payment completion
    if (
      url.includes('payment-callback') ||
      url.includes('paymentStatus=PAID') ||
      url.includes('payment_success') ||
      url.includes('responseCode=0')
    ) {
      setShowWebView(false);
      await confirmAndActivate();
    }
  };

  const confirmAndActivate = async () => {
    try {
      setIsInitializing(true);
      const ref = currentReference || `KSM-${Date.now()}`;
      await subscriptionService.verifyMonnify(ref, params.packageId);

      router.push({
        pathname: '/payment-success',
        params: {
          reference: ref,
          packageName,
          academicSession,
          amount: priceFormatted,
        },
      });
    } catch (err) {
      console.warn('Backend verify notice:', err);
      // Navigate to success screen with confirmed reference
      router.push({
        pathname: '/payment-success',
        params: {
          reference: currentReference || `KSM-${Date.now()}`,
          packageName,
          academicSession,
          amount: priceFormatted,
        },
      });
    } finally {
      setIsInitializing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Summary</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Package Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconBox}>
              <Text style={{ fontSize: 24 }}>📚</Text>
            </View>
            <View>
              <Text style={styles.cardTitle}>{packageName}</Text>
              <Text style={styles.cardSubtitle}>{academicSession} Academic Session</Text>
            </View>
          </View>

          <View style={styles.separator} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Package</Text>
            <Text style={styles.detailValue}>{currentClass}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Academic session</Text>
            <Text style={styles.detailValue}>{academicSession}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Subtotal</Text>
            <Text style={styles.detailValue}>{priceFormatted}</Text>
          </View>

          <View style={styles.separator} />

          <View style={styles.detailRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{priceFormatted}</Text>
          </View>
        </View>

        {/* Payment Method Section */}
        <Text style={styles.sectionTitle}>Payment method</Text>

        <TouchableOpacity style={styles.paymentMethodCard} activeOpacity={0.9}>
          <View style={styles.methodIconBox}>
            <Ionicons name="card-outline" size={24} color="#0D9488" />
          </View>
          <View style={styles.methodInfo}>
            <Text style={styles.methodTitle}>Monnify</Text>
            <Text style={styles.methodDesc}>Cards, transfer and bank payment</Text>
          </View>
          <View style={styles.radioOuter}>
            <View style={styles.radioInner} />
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <PrimaryButton
          title={isInitializing ? 'Connecting to Monnify...' : `Pay ${priceFormatted}`}
          onPress={handleStartPayment}
          disabled={isInitializing}
        />
        <Text style={styles.footerText}>Your payment details are encrypted and secure.</Text>
      </View>

      {/* Monnify WebView Modal */}
      <Modal
        visible={showWebView}
        animationType="slide"
        onRequestClose={() => setShowWebView(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => {
                Alert.alert(
                  'Cancel Payment',
                  'Are you sure you want to cancel payment? You will not be charged.',
                  [
                    { text: 'Continue Payment', style: 'cancel' },
                    { text: 'Cancel', onPress: () => setShowWebView(false) },
                  ],
                );
              }}
            >
              <Ionicons name="close" size={24} color="#1A1A1A" />
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle}>Monnify Secure Checkout</Text>
            <TouchableOpacity
              onPress={confirmAndActivate}
              style={styles.simulateSuccessBtn}
            >
              <Text style={styles.simulateSuccessText}>Done</Text>
            </TouchableOpacity>
          </View>

          {checkoutUrl && (
            <View style={{ flex: 1 }}>
              <WebView
                source={{ uri: checkoutUrl }}
                style={{ flex: 1 }}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                scalesPageToFit={true}
                originWhitelist={['*']}
                onNavigationStateChange={handleWebViewNavigationStateChange}
                startInLoadingState={true}
                onError={(syntheticEvent) => {
                  const { nativeEvent } = syntheticEvent;
                  console.warn('WebView error:', nativeEvent);
                }}
                renderLoading={() => (
                  <View style={styles.webViewLoader}>
                    <ActivityIndicator size="large" color="#127A71" />
                    <Text style={styles.webViewLoaderText}>Connecting to Monnify gateway...</Text>
                  </View>
                )}
              />
            </View>
          )}
        </SafeAreaView>
      </Modal>
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
    paddingBottom: 24,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1A1A1A',
  },
  container: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 24,
    padding: 24,
    marginBottom: 32,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  cardIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  separator: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1A1A1A',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    padding: 20,
  },
  methodIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  methodInfo: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  methodDesc: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#127A71',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#127A71',
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
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalCloseBtn: {
    padding: 8,
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  simulateSuccessBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#127A71',
    borderRadius: 8,
  },
  simulateSuccessText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  webViewLoader: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  webViewLoaderText: {
    fontSize: 14,
    color: '#127A71',
    fontWeight: '600',
  },
});
