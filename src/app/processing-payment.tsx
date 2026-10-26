import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function ProcessingPaymentScreen() {
  // Auto-redirect to success screen after a short delay to simulate processing
  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/payment-success');
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirming Payment</Text>
      </View>

      <View style={styles.container}>
        
        <View style={styles.spinnerContainer}>
          <View style={styles.spinnerCircle}>
            <ActivityIndicator size="large" color="#127A71" />
            <View style={styles.lockOverlay}>
              <Ionicons name="lock-closed-outline" size={16} color="#127A71" />
            </View>
          </View>
        </View>

        <Text style={styles.title}>Processing Payment</Text>
        <Text style={styles.subtitle}>
          Please wait while we confirm your payment.
        </Text>

        <View style={styles.pillBox}>
          <Text style={styles.pillText}>₦25,000 • Paystack</Text>
        </View>

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
    fontSize: 20,
    fontWeight: '900',
    color: '#1A1A1A',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 64,
  },
  spinnerContainer: {
    marginBottom: 32,
  },
  spinnerCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#D1FAE5', // Light cyan
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 4,
    borderColor: '#127A71',
    borderStyle: 'dashed', // Simulating the overlapping ring design
  },
  lockOverlay: {
    position: 'absolute',
    bottom: -8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  pillBox: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  pillText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A1A1A',
  },
});
