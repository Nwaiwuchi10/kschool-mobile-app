import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import InputField from '@/components/ui/InputField';
import PrimaryButton from '@/components/ui/PrimaryButton';
import ResponseMessageModal from '@/components/ui/ResponseMessageModal';
import { useResponseModal } from '@/hooks/useResponseModal';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useAuth } from '@/store/AuthContext';
import { useAppTheme } from '@/hooks/useAppTheme';

export default function SignupScreen() {
  const { colors, isDark } = useAppTheme();
  const { register } = useAuth();
  const { modalConfig, showSuccess, showError, hideModal } = useResponseModal();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSignup = async () => {
    setErrorMessage(null);

    // Form validations
    if (!firstName.trim()) {
      const msg = 'Please enter your first name.';
      setErrorMessage(msg);
      showError('First Name Required', msg);
      return;
    }
    if (!lastName.trim()) {
      const msg = 'Please enter your last name.';
      setErrorMessage(msg);
      showError('Last Name Required', msg);
      return;
    }
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
    if (!password) {
      const msg = 'Please enter a password.';
      setErrorMessage(msg);
      showError('Password Required', msg);
      return;
    }
    if (password.length < 6) {
      const msg = 'Password must be at least 6 characters long.';
      setErrorMessage(msg);
      showError('Weak Password', msg);
      return;
    }
    if (password !== confirmPassword) {
      const msg = 'Passwords do not match.';
      setErrorMessage(msg);
      showError('Password Mismatch', msg);
      return;
    }

    try {
      setIsLoading(true);
      await register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim() || undefined,
        password,
      });

      showSuccess(
        'Account Created!',
        'Your KSCHOOLMATE account has been created successfully. Let’s configure your class and subjects.',
        () => router.replace('/select-class'),
        'Continue Setup'
      );
    } catch (err: any) {
      const msg = err.message || 'Failed to create account. Please try again.';
      setErrorMessage(msg);
      showError('Signup Failed', msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <KeyboardAwareScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid={true}
        extraScrollHeight={24}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Logo */}
        <View style={styles.headerLogoContainer}>
          <View style={[styles.logoBox, { backgroundColor: colors.primary }]}>
            <Ionicons name="school-outline" size={24} color="#FFFFFF" />
          </View>
          <View>
            <Text style={[styles.logoTitle, { color: colors.text }]}>KSCHOOLMATE</Text>
            <Text style={[styles.logoSubtitle, { color: colors.primary }]}>Your School in Your Pocket</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Join thousands of active students
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
          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <InputField
                label="First Name"
                placeholder="e.g. Amara"
                value={firstName}
                onChangeText={(val) => {
                  setFirstName(val);
                  if (errorMessage) setErrorMessage(null);
                }}
                autoCapitalize="words"
              />
            </View>
            <View style={styles.halfWidth}>
              <InputField
                label="Last Name"
                placeholder="e.g. Okafor"
                value={lastName}
                onChangeText={(val) => {
                  setLastName(val);
                  if (errorMessage) setErrorMessage(null);
                }}
                autoCapitalize="words"
              />
            </View>
          </View>

          <InputField
            label="Email Address"
            placeholder="e.g. amara@example.com"
            value={email}
            onChangeText={(val) => {
              setEmail(val);
              if (errorMessage) setErrorMessage(null);
            }}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <InputField
            label="Password"
            placeholder="Minimum 6 characters"
            value={password}
            onChangeText={(val) => {
              setPassword(val);
              if (errorMessage) setErrorMessage(null);
            }}
            isPassword
          />

          <InputField
            label="Confirm Password"
            placeholder="Repeat password"
            value={confirmPassword}
            onChangeText={(val) => {
              setConfirmPassword(val);
              if (errorMessage) setErrorMessage(null);
            }}
            isPassword
          />
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <PrimaryButton
            title="Create Account"
            loading={isLoading}
            onPress={handleSignup}
          />

          <View style={styles.loginPrompt}>
            <Text style={[styles.promptText, { color: colors.textSecondary }]}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/login')}>
              <Text style={[styles.promptLink, { color: colors.primary }]}>Login</Text>
            </TouchableOpacity>
          </View>
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
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  headerLogoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  logoBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  logoSubtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    marginBottom: 24,
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  actionsContainer: {
    marginTop: 'auto',
  },
  loginPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  promptText: {
    fontSize: 14,
  },
  promptLink: {
    fontSize: 14,
    fontWeight: '700',
  },
});
