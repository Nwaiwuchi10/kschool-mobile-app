import React, { useState, useRef, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import PrimaryButton from '@/components/ui/PrimaryButton';
import ResponseMessageModal from '@/components/ui/ResponseMessageModal';
import { useResponseModal } from '@/hooks/useResponseModal';
import { authService } from '@/services/auth.service';

export default function VerifyResetScreen() {
  const { modalConfig, showSuccess, showError, hideModal } = useResponseModal();
  const params = useLocalSearchParams<{ email: string }>();
  const email = params.email || '';

  const [code, setCode] = useState(['', '', '', '']);
  const inputs = useRef<Array<TextInput | null>>([]);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let interval: any = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (text: string, index: number) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    const newCode = [...code];
    newCode[index] = cleaned.slice(-1);
    setCode(newCode);

    if (errorMessage) setErrorMessage(null);

    if (cleaned && index < 3) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleResend = async () => {
    if (!canResend || !email) return;
    try {
      setErrorMessage(null);
      await authService.forgotPassword(email);
      setSuccessMessage('A new code has been sent to your email.');
      setTimer(60);
      setCanResend(false);
      showSuccess(
        'Code Resent!',
        'A new 4-digit verification code has been sent to your email address.',
        undefined,
        'Got It'
      );
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      const msg = err.message || 'Failed to resend code.';
      setErrorMessage(msg);
      showError('Resend Failed', msg);
    }
  };

  const handleContinue = async () => {
    const fullCode = code.join('');
    if (fullCode.length < 4) {
      const msg = 'Please enter the complete 4-digit verification code.';
      setErrorMessage(msg);
      showError('Incomplete Code', msg);
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);
      await authService.verifyResetCode(email, fullCode);

      showSuccess(
        'Code Verified!',
        'Verification code confirmed. You can now create your new password.',
        () => {
          router.push({
            pathname: '/create-new-password',
            params: { email, code: fullCode },
          });
        },
        'Set New Password'
      );
    } catch (err: any) {
      const msg = err.message || 'Invalid or expired verification code.';
      setErrorMessage(msg);
      showError('Verification Failed', msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAwareScrollView 
        contentContainerStyle={styles.container}
        enableOnAndroid={true}
        extraScrollHeight={24}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Text style={styles.title}>Enter Verification Code</Text>
        <Text style={styles.subtitle}>
          We sent a 4-digit verification code to <Text style={styles.emailHighlight}>{email || 'your email'}</Text>. Please enter it below.
        </Text>

        {/* Error Banner */}
        {errorMessage ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={20} color="#DC2626" />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Success Banner */}
        {successMessage ? (
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle" size={20} color="#166534" />
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        ) : null}

        {/* OTP Input */}
        <View style={styles.otpContainer}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => { inputs.current[index] = ref; }}
              style={[
                styles.otpInput,
                digit ? styles.otpInputActive : null,
              ]}
              maxLength={1}
              keyboardType="number-pad"
              value={digit}
              onChangeText={(text) => handleChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              autoFocus={index === 0}
            />
          ))}
        </View>

        {/* Resend */}
        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Didn't receive a code? </Text>
          {canResend ? (
            <TouchableOpacity onPress={handleResend}>
              <Text style={styles.resendLink}>Resend Code</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.timerText}>Resend in {timer}s</Text>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <PrimaryButton 
            title="Continue" 
            loading={isLoading}
            onPress={handleContinue} 
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginLeft: 8,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
    marginBottom: 32,
  },
  emailHighlight: {
    color: '#127A71',
    fontWeight: '700',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  errorText: {
    flex: 1,
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '600',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  successText: {
    flex: 1,
    color: '#166534',
    fontSize: 13,
    fontWeight: '600',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  otpInput: {
    width: 64,
    height: 64,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  otpInputActive: {
    borderColor: '#127A71',
    borderWidth: 2,
    backgroundColor: '#F0FDF4',
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resendText: {
    fontSize: 14,
    color: '#6B7280',
  },
  resendLink: {
    fontSize: 14,
    color: '#127A71',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  timerText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  actionsContainer: {
    marginTop: 'auto',
    marginBottom: 40,
  },
});
