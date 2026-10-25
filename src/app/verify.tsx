import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import PrimaryButton from '@/components/ui/PrimaryButton';
import ResponseMessageModal from '@/components/ui/ResponseMessageModal';
import { useResponseModal } from '@/hooks/useResponseModal';

export default function VerifyScreen() {
  const { modalConfig, showSuccess, showError, hideModal } = useResponseModal();
  const [code, setCode] = useState(['5', '2', '', '']);
  const inputs = useRef<Array<TextInput | null>>([]);

  const handleChange = (text: string, index: number) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    if (text && index < 3) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleContinue = () => {
    const fullCode = code.join('');
    if (fullCode.length < 4) {
      showError('Incomplete Code', 'Please enter the complete 4-digit verification code.');
      return;
    }

    showSuccess(
      'Verification Successful!',
      'Your email has been verified successfully. Let’s proceed with setting up your profile.',
      () => router.push('/select-class'),
      'Continue'
    );
  };

  const handleResend = () => {
    showSuccess(
      'Code Resent!',
      'A new 4-digit verification code has been sent to your email address.',
      undefined,
      'Got It'
    );
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
          We sent a 4-digit verification code to amara@KSCHOOLMATE.com. Please enter it below.
        </Text>

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
            />
          ))}
        </View>

        {/* Resend */}
        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Didn't receive a code? </Text>
          <TouchableOpacity onPress={handleResend}>
            <Text style={styles.resendLink}>Resend Code</Text>
          </TouchableOpacity>
          <Text style={styles.timerText}> (0:59)</Text>
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <PrimaryButton 
            title="Continue" 
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
    fontSize: 32,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 40,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 16,
    marginBottom: 32,
  },
  otpInput: {
    width: 64,
    height: 64,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  otpInputActive: {
    borderColor: '#127A71',
    borderWidth: 2,
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
  },
  actionsContainer: {
    marginTop: 'auto',
    marginBottom: 40,
  },
});
