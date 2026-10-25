import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function AboutScreen() {
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

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        <Text style={styles.title}>About KSCHOOLMATE</Text>

        <View style={styles.logoSection}>
          <View style={styles.logoBox}>
            <Ionicons name="school-outline" size={48} color="#FFFFFF" />
          </View>
          <Text style={styles.brandTitle}>KSCHOOLMATE</Text>
          <Text style={styles.brandSubtitle}>Your School in Your Pocket</Text>
          
          <Text style={styles.description}>
            KSCHOOLMATE is a smart learning platform designed to help students access lessons, track progress, and stay connected with their school community.
          </Text>

          <View style={styles.versionPill}>
            <Text style={styles.versionText}>Version 1.0.0</Text>
          </View>
        </View>

        <View style={styles.linksContainer}>
          <TouchableOpacity style={styles.linkRow}>
            <View style={styles.iconBox}>
              <Ionicons name="document-text-outline" size={20} color="#1A1A1A" />
            </View>
            <Text style={styles.linkTitle}>Terms & Conditions</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <View style={styles.separator} />

          <TouchableOpacity style={styles.linkRow}>
            <View style={styles.iconBox}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#1A1A1A" />
            </View>
            <Text style={styles.linkTitle}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2026 KSCHOOLMATE. All rights reserved.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAFA',
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
    color: '#1A1A1A',
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
    color: '#1A1A1A',
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
    backgroundColor: '#127A71',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  brandSubtitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#127A71',
    marginBottom: 24,
  },
  description: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  versionPill: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  versionText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4B5563',
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
    backgroundColor: '#E5E7EB', // Light grey box
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  linkTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  separator: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 64, // Align with text
    marginVertical: 4,
  },
  footer: {
    paddingBottom: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#6B7280',
  },
});
