import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
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
import { authService } from '@/services/auth.service';

export default function EditProfileScreen() {
  const { colors, isDark } = useAppTheme();
  const { user, updateUserData } = useAuth();
  const { modalConfig, showSuccess, showError, hideModal } = useResponseModal();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email] = useState(user?.email || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [school, setSchool] = useState(user?.school || '');

  useEffect(() => {
    if (user) {
      setAvatar(user.avatar || '');
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setPhoneNumber(user.phoneNumber || '');
      setSchool(user.school || '');
    }
  }, [user]);

  const handlePickImage = async () => {
    try {
      let ImagePicker: any;
      try {
        ImagePicker = await import('expo-image-picker');
      } catch (err: any) {
        showError(
          'Image Picker Unavailable',
          'Native image picker module is not linked in your current build. Please rebuild your development build (npx expo run:android).'
        );
        return;
      }

      if (!ImagePicker || typeof ImagePicker.launchImageLibraryAsync !== 'function') {
        showError(
          'Image Picker Unavailable',
          'Image picker is not available on this device build.'
        );
        return;
      }

      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        showError('Permission Required', 'Camera roll permissions are required to select a profile photo.');
        return;
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (pickerResult.canceled || !pickerResult.assets || pickerResult.assets.length === 0) {
        return;
      }

      const asset = pickerResult.assets[0];
      const localUri = asset.uri;
      const filename = localUri.split('/').pop() || 'profile.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const mimeType = match ? `image/${match[1]}` : 'image/jpeg';

      setIsUploadingImage(true);

      const formData = new FormData();
      formData.append('file', {
        uri: localUri,
        name: filename,
        type: mimeType,
      } as any);
      formData.append('folder', 'kschoolmate/avatars');

      const uploadRes = await api.post('/uploads', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const uploadedUrl = uploadRes.data?.url;
      if (uploadedUrl) {
        setAvatar(uploadedUrl);
        updateUserData({ avatar: uploadedUrl });
        // Also persist immediately to backend profile
        try {
          await authService.updateProfile({ avatar: uploadedUrl });
        } catch (e) {
          console.log('Background avatar sync notice:', e);
        }
        showSuccess('Photo Updated', 'Your profile photo has been successfully updated.');
      } else {
        throw new Error('Upload succeeded but no image URL was returned.');
      }
    } catch (err: any) {
      console.error('Image upload failed:', err);
      showError('Upload Failed', err?.message || 'Could not upload selected image. Please try again.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      showError('Required Fields', 'First name and last name cannot be empty.');
      return;
    }

    try {
      setIsSaving(true);
      const payload: any = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phoneNumber.trim() || undefined,
        school: school.trim() || undefined,
        avatar: avatar || undefined,
      };

      try {
        await authService.updateProfile(payload);
      } catch (e) {
        // Fallback direct endpoint
        await api.patch('/auth/profile', payload);
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
          <TouchableOpacity 
            style={[styles.avatarBorder, { borderColor: colors.primary }]}
            onPress={handlePickImage}
            disabled={isUploadingImage}
            activeOpacity={0.8}
          >
            {avatar ? (
              <Image 
                source={{ uri: avatar }} 
                style={styles.avatarImage} 
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.avatarBox, { backgroundColor: colors.surfaceAlt }]}>
                <Text style={{ fontSize: 32, fontWeight: '800', color: colors.primary }}>
                  {(firstName || 'S').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}

            <View style={styles.avatarOverlay}>
              {isUploadingImage ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="camera-outline" size={22} color="#FFFFFF" />
                  <Text style={styles.avatarEditText}>EDIT</Text>
                </>
              )}
            </View>
          </TouchableOpacity>
          <Text style={[styles.avatarHint, { color: colors.textSecondary }]}>
            Tap image to change photo
          </Text>
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
  avatarImage: {
    width: 92,
    height: 92,
    borderRadius: 46,
  },
  avatarHint: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
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
