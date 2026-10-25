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

export default function LoginScreen() {
  const { colors, isDark } = useAppTheme();
  const { login } = useAuth();
  const { modalConfig, showSuccess, showError, hideModal } = useResponseModal();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async () => {
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
    if (!password) {
      const msg = 'Please enter your password.';
      setErrorMessage(msg);
      showError('Password Required', msg);
      return;
    }

    try {
      setIsLoading(true);
      const res = await login({
        email: email.trim(),
        password,
      });

      const userClass = res.user?.class;
      const hasSelectedClass = Boolean(userClass && userClass.trim().length > 0);

      if (hasSelectedClass) {
        showSuccess(
          'Welcome Back!',
          'You have logged in successfully. Proceeding to your school dashboard.',
          () => router.replace('/(tabs)'),
          'Go to Dashboard'
        );
      } else {
        showSuccess(
          'Welcome to KSCHOOLMATE!',
          'You have logged in successfully. Please select your class to continue.',
          () => router.replace('/select-class'),
          'Select Class'
        );
      }
    } catch (err: any) {
      console.warn('[LOGIN ERROR]', err);
      const backendMessage =
        err?.response?.data?.message ||
        (Array.isArray(err?.response?.data?.message) ? err.response.data.message.join(', ') : null) ||
        err?.message ||
        'Invalid email or password. Please verify your credentials.';

      const msg = typeof backendMessage === 'string' ? backendMessage : 'Invalid email or password. Please check your credentials and try again.';
      setErrorMessage(msg);
      // timeoutMs: 0 ensures the error dialog remains visible until the user taps 'Try Again' or closes it
      showError('Login Failed', msg, undefined, 'Try Again', 0);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModalClose = () => {
    const action = modalConfig.onPrimaryPress;
    hideModal();
    if (modalConfig.type === 'success' && action) {
      action();
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
        <Text style={[styles.title, { color: colors.text }]}>Welcome Back!</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Log in to continue your personalized{'\n'}KSCHOOLMATE learning path.
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

          <InputField
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={(val) => {
              setPassword(val);
              if (errorMessage) setErrorMessage(null);
            }}
            isPassword
          />

          <TouchableOpacity style={styles.forgotPassword} onPress={() => router.push('/forgot-password')}>
            <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <PrimaryButton
            title="Login"
            loading={isLoading}
            onPress={handleLogin}
          />

          <View style={styles.signupPrompt}>
            <Text style={[styles.promptText, { color: colors.textSecondary }]}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/signup')}>
              <Text style={[styles.promptLink, { color: colors.primary }]}>Sign Up</Text>
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
        onClose={handleModalClose}
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
    marginBottom: 36,
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -8,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionsContainer: {
    marginTop: 'auto',
  },
  signupPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  promptText: {
    fontSize: 14,
  },
  promptLink: {
    fontSize: 14,
    fontWeight: '700',
  },
});
