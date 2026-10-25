import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import PrimaryButton from '@/components/ui/PrimaryButton';
import { useAuth } from '@/store/AuthContext';
import { useAppTheme } from '@/hooks/useAppTheme';

export default function ProfileScreen() {
  const { colors, isDark } = useAppTheme();
  const { user } = useAuth();
  const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Student';
  const initial = (user?.firstName || 'S').charAt(0).toUpperCase();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      
      {/* Top Background Section */}
      <View style={[styles.topSection, { backgroundColor: colors.primary }]}>
        <SafeAreaView>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
          </View>

          {/* Profile Info */}
          <View style={styles.profileInfoContainer}>
            <View style={styles.avatarBorder}>
              <View style={[styles.avatarContainer, { backgroundColor: colors.surfaceAlt }]}>
                <Text style={{ fontSize: 32, fontWeight: '800', color: colors.primary }}>{initial}</Text>
              </View>
            </View>
            <Text style={styles.name}>{fullName}</Text>
            <View style={styles.classPill}>
              <Text style={styles.classPillText}>{user?.class || 'Student'}</Text>
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* Bottom Content Section */}
      <ScrollView contentContainerStyle={styles.bottomSection} showsVerticalScrollIndicator={false}>
        
        <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.iconBox, { backgroundColor: colors.primaryMint }]}>
            <Ionicons name="mail-outline" size={24} color={colors.primary} />
          </View>
          <View style={styles.infoContent}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Email Address</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{user?.email || 'N/A'}</Text>
          </View>
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.iconBox, { backgroundColor: colors.primaryMint }]}>
            <Ionicons name="call-outline" size={24} color={colors.primary} />
          </View>
          <View style={styles.infoContent}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Phone Number</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{user?.phoneNumber || 'Not provided'}</Text>
          </View>
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.iconBox, { backgroundColor: colors.primaryMint }]}>
            <Ionicons name="book-outline" size={24} color={colors.primary} />
          </View>
          <View style={styles.infoContent}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Current Academic Class</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{user?.class || 'No class assigned yet'}</Text>
          </View>
        </View>

      </ScrollView>
      
      {/* Fixed Bottom Button */}
      <View style={[styles.footer, { backgroundColor: colors.background }]}>
        <PrimaryButton 
          title="Edit Profile" 
          onPress={() => router.push('/edit-profile')} 
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  topSection: {
    backgroundColor: '#127A71',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginLeft: -8,
  },
  backText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  profileInfoContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  avatarBorder: {
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  name: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  classPill: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  classPillText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
    gap: 16,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#D1FAE5', // Light cyan
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 16,
    backgroundColor: '#FAFAFA',
  },
});
