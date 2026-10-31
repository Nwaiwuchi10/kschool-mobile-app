import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useRef } from 'react';
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

const PAYSTACK_CALLBACK_URL = 'https://kschoolmate.com/payment-callback';

export default function PaymentSummaryScreen() {
  const params = useLocalSearchParams<{
    packageId?: string;
    packageName?: string;
    academicSession?: string;
    price?: string;
    classLevel?: string;
    topicId?: string;
    topicTitle?: string;
    subjectId?: string;
    subjectName?: string;
  }>();

  const { selectedClass, selectClass, refreshClassStatus } = useClass();
  const currentClass = params.classLevel || selectedClass || 'JSS 1';

  const packageName = params.packageName || `${currentClass} Learning Package`;
  const academicSession = params.academicSession || '2026/2027';
  const priceAmount = params.price ? parseInt(params.price, 10) : 25000;
  const priceFormatted = `₦${priceAmount.toLocaleString()}`;

  // Payment states
  const [isInitializing, setIsInitializing] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [currentReference, setCurrentReference] = useState<string | null>(null);
  const [showWebView, setShowWebView] = useState(false);
  const hasVerifiedRef = useRef(false);

  const extractRefFromUrl = (url: string): string | null => {
    try {
      const match = url.match(/[?&](?:reference|trxref)=([^&#]+)/i);
      return match && match[1] ? decodeURIComponent(match[1]) : null;
    } catch {
      return null;
    }
  };

  const isCallbackOrSuccessUrl = (url: string): boolean => {
    if (!url) return false;
    return (
      url.includes('payment-callback') ||
      url.includes('trxref=') ||
      url.includes('reference=') ||
      url.includes('paystack.com/success') ||
      url.includes('standard.paystack.co/close') ||
      url.includes('paymentStatus=PAID') ||
      url.includes('payment_success') ||
      url.includes('responseCode=0')
    );
  };

  const handleStartPayment = async () => {
    try {
      setIsInitializing(true);
      hasVerifiedRef.current = false;
      const res = await subscriptionService.initializePaystack(
        params.packageId || 'default',
        PAYSTACK_CALLBACK_URL,
        currentClass,
      );

      const targetUrl = res?.authorizationUrl || res?.checkoutUrl;
      const ref = res?.reference || res?.paymentReference;

      if (targetUrl) {
        setCurrentReference(ref || `PAYSTACK-KSM-${Date.now()}`);
        setCheckoutUrl(targetUrl);
        setShowWebView(true);
      } else {
        Alert.alert('Payment Error', 'Could not retrieve Paystack authorization URL. Please try again.');
      }
    } catch (err: any) {
      console.error('Payment init error:', err);
      Alert.alert(
        'Payment Connection Notice',
        err?.response?.data?.message || 'Unable to initialize Paystack checkout right now. Please check your connection and try again.'
      );
    } finally {
      setIsInitializing(false);
    }
  };

  const handleWebViewNavigationStateChange = (navState: any) => {
    const url = navState?.url || '';
    if (isCallbackOrSuccessUrl(url) && !hasVerifiedRef.current) {
      hasVerifiedRef.current = true;
      const urlRef = extractRefFromUrl(url);
      setShowWebView(false);
      confirmAndActivate(urlRef || undefined);
    }
  };

  const confirmAndActivate = async (overrideRef?: string) => {
    try {
      setIsInitializing(true);
      const ref = overrideRef || currentReference || `PAYSTACK-KSM-${Date.now()}`;
      await subscriptionService.verifyPaystack(ref, params.packageId || 'default', currentClass);
      await selectClass(currentClass).catch(() => {});
      await refreshClassStatus().catch(() => {});

      router.replace({
        pathname: '/payment-success',
        params: {
          reference: ref,
          packageName,
          academicSession,
          amount: priceFormatted,
          classLevel: currentClass,
          topicId: params.topicId,
          topicTitle: params.topicTitle,
          subjectId: params.subjectId,
          subjectName: params.subjectName,
        },
      });
    } catch (err: any) {
      console.warn('Backend verify error:', err);
      Alert.alert(
        'Verification Pending',
        err?.response?.data?.message ||
          'We could not verify your payment yet. If you completed the payment on Paystack, tap "Verify Again" to confirm.',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => { hasVerifiedRef.current = false; } },
          {
            text: 'Verify Again',
            onPress: () => {
              hasVerifiedRef.current = false;
              confirmAndActivate(overrideRef);
            },
          },
        ]
      );
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
            <Text style={styles.detailLabel}>Subscription Plan</Text>
            <Text style={styles.detailValue}>{packageName}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Selected Class (1 Year)</Text>
            <Text style={styles.detailValue}>{currentClass}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Duration</Text>
            <Text style={styles.detailValue}>1 Year ({academicSession})</Text>
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
            <Text style={styles.methodTitle}>Paystack</Text>
            <Text style={styles.methodDesc}>Cards, bank transfer, USSD and Apple Pay</Text>
          </View>
          <View style={styles.radioOuter}>
            <View style={styles.radioInner} />
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <PrimaryButton
          title={isInitializing ? 'Connecting to Paystack...' : `Pay ${priceFormatted}`}
          onPress={handleStartPayment}
          disabled={isInitializing}
        />
        <Text style={styles.footerText}>Your payment details are encrypted and secure.</Text>
      </View>

      {/* Paystack WebView Modal */}
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
            <Text style={styles.modalHeaderTitle}>Paystack Secure Checkout</Text>
            <TouchableOpacity
              onPress={() => {
                setShowWebView(false);
                confirmAndActivate();
              }}
              style={styles.simulateSuccessBtn}
            >
              <Text style={styles.simulateSuccessText}>Verify Payment</Text>
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
                onShouldStartLoadWithRequest={(request) => {
                  const reqUrl = request?.url || '';
                  if (isCallbackOrSuccessUrl(reqUrl) && !hasVerifiedRef.current) {
                    hasVerifiedRef.current = true;
                    const urlRef = extractRefFromUrl(reqUrl);
                    setShowWebView(false);
                    confirmAndActivate(urlRef || undefined);
                    return false;
                  }
                  return true;
                }}
                startInLoadingState={true}
                onError={(syntheticEvent) => {
                  const { nativeEvent } = syntheticEvent;
                  console.warn('WebView error:', nativeEvent);
                }}
                renderLoading={() => (
                  <View style={styles.webViewLoader}>
                    <ActivityIndicator size="large" color="#127A71" />
                    <Text style={styles.webViewLoaderText}>Connecting to Paystack gateway...</Text>
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
