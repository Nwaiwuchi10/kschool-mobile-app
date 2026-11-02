import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAppTheme } from '@/hooks/useAppTheme';

export default function AboutScreen() {
  const { colors, isDark } = useAppTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
          <Text style={[styles.backText, { color: colors.text }]}>Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        <Text style={[styles.title, { color: colors.text }]}>About KSCHOOLMATE</Text>

        <View style={styles.logoSection}>
          <View style={[styles.logoBox, { backgroundColor: colors.primary }]}>
            <Ionicons name="school-outline" size={48} color="#FFFFFF" />
          </View>
          <Text style={[styles.brandTitle, { color: colors.text }]}>KSCHOOLMATE</Text>
          <Text style={[styles.brandSubtitle, { color: colors.primary }]}>Your School in Your Pocket</Text>
          
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            KSCHOOLMATE is a smart learning platform designed to help students access lessons, track progress, and stay connected with their school community.
          </Text>

          <View style={[styles.versionPill, { backgroundColor: isDark ? colors.surfaceAlt : '#E5E7EB' }]}>
            <Text style={[styles.versionText, { color: isDark ? colors.textSecondary : '#4B5563' }]}>Version 1.0.0</Text>
          </View>
        </View>

        <View style={styles.linksContainer}>
          <TouchableOpacity
            style={styles.linkRow}
            activeOpacity={0.7}
            onPress={() => router.push('/privacy-policy')}
          >
            <View style={[styles.iconBox, { backgroundColor: isDark ? colors.surfaceAlt : '#E5E7EB' }]}>
              <Ionicons name="document-text-outline" size={20} color={colors.text} />
            </View>
            <Text style={[styles.linkTitle, { color: colors.text }]}>Terms & Conditions</Text>
            <Ionicons name="chevron-forward" size={20} color={isDark ? '#6B7280' : '#9CA3AF'} />
          </TouchableOpacity>

          <View style={[styles.separator, { backgroundColor: isDark ? colors.border : '#F3F4F6' }]} />

          <TouchableOpacity
            style={styles.linkRow}
            activeOpacity={0.7}
            onPress={() => router.push('/privacy-policy')}
          >
            <View style={[styles.iconBox, { backgroundColor: isDark ? colors.surfaceAlt : '#E5E7EB' }]}>
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.text} />
            </View>
            <Text style={[styles.linkTitle, { color: colors.text }]}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={20} color={isDark ? '#6B7280' : '#9CA3AF'} />
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.textMuted }]}>© 2026 KSCHOOLMATE. All rights reserved.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: 16,
    fontWeight: '700',
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
    marginBottom: 40,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoBox: {
    width: 96,
    height: 96,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 4,
  },
  brandSubtitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 24,
  },
  description: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  versionPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  versionText: {
    fontSize: 12,
    fontWeight: '800',
  },
  linksContainer: {
    marginBottom: 32,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  linkTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 64,
    marginVertical: 4,
  },
  footer: {
    paddingBottom: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
  },
});
