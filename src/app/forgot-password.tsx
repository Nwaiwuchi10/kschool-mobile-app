import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import InputField from '@/components/ui/InputField';
import PrimaryButton from '@/components/ui/PrimaryButton';
import ResponseMessageModal from '@/components/ui/ResponseMessageModal';
import { useResponseModal } from '@/hooks/useResponseModal';
import { authService } from '@/services/auth.service';
import { useAppTheme } from '@/hooks/useAppTheme';

export default function ForgotPasswordScreen() {
  const { colors, isDark } = useAppTheme();
  const { modalConfig, showSuccess, showError, hideModal } = useResponseModal();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRequestCode = async () => {
    setErrorMessage(null);

    if (!email.trim()) {
      const msg = 'Please enter your email address.';
      setErrorMessage(msg);
      showError('Email Required', msg);
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      const msg = 'Please enter a valid email address.';
      setErrorMessage(msg);
      showError('Invalid Email', msg);
      return;
    }

    try {
      setIsLoading(true);
      await authService.forgotPassword(email.trim());

      showSuccess(
        'Verification Code Sent!',
        `A 4-digit reset code has been sent to ${email.trim().toLowerCase()}. Please check your inbox.`,
        () => {
          router.push({
            pathname: '/verify-reset',
            params: { email: email.trim().toLowerCase() },
          });
        },
        'Enter Verification Code'
      );
    } catch (err: any) {
      const msg = err.message || 'Failed to send reset code. Please try again.';
      setErrorMessage(msg);
      showError('Request Failed', msg);
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

      <KeyboardAwareScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid={true}
        extraScrollHeight={24}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Icon */}
        <View style={[styles.iconBox, { backgroundColor: colors.badgeYellowBg }]}>
          <Ionicons name="lock-closed-outline" size={28} color={colors.badgeYellowText} />
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: colors.text }]}>Forgot Password?</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Enter your registered email address and we'll send you a 4-digit verification code to reset your password.
        </Text>

        {/* Error Banner */}
        {errorMessage ? (
          <View style={[styles.errorBanner, { backgroundColor: colors.dangerBg, borderColor: colors.danger }]}>
            <Ionicons name="alert-circle" size={20} color={colors.danger} />
            <Text style={[styles.errorText, { color: colors.danger }]}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Form */}
        <View style={styles.formContainer}>
          <InputField
            label="Email Address"
            placeholder="e.g. classmate@example.com"
            value={email}
            onChangeText={(val) => {
              setEmail(val);
              if (errorMessage) setErrorMessage(null);
            }}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <PrimaryButton 
            title="Send Verification Code" 
            loading={isLoading}
            onPress={handleRequestCode} 
          />
        </View>
      </KeyboardAwareScrollView>

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
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 28,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  formContainer: {
    marginBottom: 24,
  },
  actionsContainer: {
    marginTop: 'auto',
  },
});
