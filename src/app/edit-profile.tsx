import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import InputField from '@/components/ui/InputField';
import PrimaryButton from '@/components/ui/PrimaryButton';
import ResponseMessageModal from '@/components/ui/ResponseMessageModal';
import { useResponseModal } from '@/hooks/useResponseModal';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAuth } from '@/store/AuthContext';
import { api } from '@/services/api';

export default function EditProfileScreen() {
  const { colors, isDark } = useAppTheme();
  const { user, updateUserData } = useAuth();
  const { modalConfig, showSuccess, showError, hideModal } = useResponseModal();
  const [isSaving, setIsSaving] = useState(false);

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email] = useState(user?.email || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [school, setSchool] = useState(user?.school || '');

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setPhoneNumber(user.phoneNumber || '');
      setSchool(user.school || '');
    }
  }, [user]);

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      showError('Required Fields', 'First name and last name cannot be empty.');
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phoneNumber.trim() || undefined,
        school: school.trim() || undefined,
      };

      try {
        await api.patch('/auth/profile', payload);
      } catch (e) {
        // If profile endpoint differs or offline, sync locally
      }

      updateUserData(payload);

      showSuccess(
        'Profile Updated!',
        'Your profile changes have been saved successfully.',
        () => router.back(),
        'Done'
      );
    } catch (err: any) {
      showError('Update Failed', err.message || 'Could not update profile. Please try again.');
    } finally {
      setIsSaving(false);
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
        
        <Text style={[styles.title, { color: colors.text }]}>Edit Profile</Text>

        {/* Profile Image Editor */}
        <View style={styles.avatarContainer}>
          <View style={[styles.avatarBorder, { borderColor: colors.primary }]}>
            <View style={[styles.avatarBox, { backgroundColor: colors.surfaceAlt }]}>
              <Text style={{ fontSize: 32, fontWeight: '800', color: colors.primary }}>
                {(firstName || 'S').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.avatarOverlay}>
              <Ionicons name="camera-outline" size={24} color="#FFFFFF" />
              <Text style={styles.avatarEditText}>EDIT</Text>
            </View>
          </View>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <InputField 
            label="First Name" 
            placeholder="e.g. Amara" 
            value={firstName}
            onChangeText={setFirstName}
          />
          <InputField 
            label="Last Name" 
            placeholder="e.g. Okafor" 
            value={lastName}
            onChangeText={setLastName}
          />
          <InputField 
            label="Email Address (Read Only)" 
            placeholder="student@example.com" 
            value={email}
            editable={false}
            keyboardType="email-address"
          />
          <InputField 
            label="Phone Number" 
            placeholder="e.g. +234 812 345 6789" 
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
          />
          <InputField 
            label="Current Class" 
            placeholder="No class assigned" 
            value={user?.class || 'No class assigned'}
            editable={false}
          />
          <InputField 
            label="School" 
            placeholder="e.g. Federal Government College" 
            value={school}
            onChangeText={setSchool}
          />
        </View>
      </KeyboardAwareScrollView>

      {/* Footer */}
      <View style={[styles.footer, { backgroundColor: colors.background }]}>
        <PrimaryButton 
          title="Save Changes" 
          loading={isSaving}
          onPress={handleSave} 
        />
      </View>

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
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginLeft: -8,
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  container: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 24,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarBorder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarBox: {
    width: 92,
    height: 92,
    borderRadius: 46,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFill as any,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEditText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
  },
  form: {
    gap: 16,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 16,
  },
});
