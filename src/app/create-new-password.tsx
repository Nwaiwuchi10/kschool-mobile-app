import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import InputField from '@/components/ui/InputField';
import PrimaryButton from '@/components/ui/PrimaryButton';
import ResponseMessageModal from '@/components/ui/ResponseMessageModal';
import { useResponseModal } from '@/hooks/useResponseModal';
import { authService } from '@/services/auth.service';
import { useAppTheme } from '@/hooks/useAppTheme';

export default function CreateNewPasswordScreen() {
  const { colors, isDark } = useAppTheme();
  const { modalConfig, showSuccess, showError, hideModal } = useResponseModal();
  const params = useLocalSearchParams<{ email: string; code: string }>();
  const email = params.email || '';
  const code = params.code || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleUpdatePassword = async () => {
    setErrorMessage(null);

    if (!newPassword) {
      const msg = 'Please enter a new password.';
      setErrorMessage(msg);
      showError('Password Required', msg);
      return;
    }
    if (newPassword.length < 6) {
      const msg = 'Password must be at least 6 characters long.';
      setErrorMessage(msg);
      showError('Weak Password', msg);
      return;
    }
    if (newPassword !== confirmPassword) {
      const msg = 'Passwords do not match.';
      setErrorMessage(msg);
      showError('Password Mismatch', msg);
      return;
    }

    try {
      setIsLoading(true);
      await authService.resetPassword({
        email,
        code,
        newPassword,
      });

      showSuccess(
        'Password Updated!',
        'Your password has been reset successfully. You can now log in with your new password.',
        () => {
          router.replace('/password-updated');
        },
        'Continue'
      );
    } catch (err: any) {
      const msg = err.message || 'Failed to update password. Please try again.';
      setErrorMessage(msg);
      showError('Update Failed', msg);
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
        enableOnAndroid={true} 
        extraScrollHeight={24} 
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Text style={[styles.title, { color: colors.text }]}>Create New Password</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Create a secure new password for your KSCHOOLMATE account.
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
            label="New Password"
            placeholder="Minimum 6 characters"
            value={newPassword}
            onChangeText={(val) => {
              setNewPassword(val);
              if (errorMessage) setErrorMessage(null);
            }}
            isPassword
          />
          <InputField
            label="Confirm Password"
            placeholder="Repeat new password"
            value={confirmPassword}
            onChangeText={(val) => {
              setConfirmPassword(val);
              if (errorMessage) setErrorMessage(null);
            }}
            isPassword
          />
          <Text style={[styles.helperText, { color: colors.textSecondary }]}>
            Must be at least 6 characters. Make it unique to stay secure.
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <PrimaryButton 
            title="Update Password" 
            loading={isLoading}
            onPress={handleUpdatePassword} 
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
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 10,
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
  helperText: {
    fontSize: 13,
    marginTop: -8,
  },
  actionsContainer: {
    marginTop: 'auto',
  },
});
