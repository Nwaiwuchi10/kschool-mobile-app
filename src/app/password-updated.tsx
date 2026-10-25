import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity,} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import PrimaryButton from '@/components/ui/PrimaryButton';

export default function PasswordUpdatedScreen() {
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

      <View style={styles.container}>
        {/* Top Icon */}
        <View style={styles.iconBox}>
          <Ionicons name="checkmark-outline" size={40} color="#127A71" />
        </View>

        {/* Text Content */}
        <Text style={styles.title}>Password Updated{'\n'}Successfully</Text>
        <Text style={styles.subtitle}>
          Your password has been updated successfully. You can now use your new password to sign in.
        </Text>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <PrimaryButton 
            title="Back to Login" 
            onPress={() => router.replace('/login')} 
          />
        </View>
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
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    paddingTop: 60,
  },
  iconBox: {
    width: 80,
    height: 80,
    backgroundColor: '#D1FAE5', // Light teal/cyan
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  actionsContainer: {
    marginTop: 'auto',
    marginBottom: 40,
    width: '100%',
  },
});
