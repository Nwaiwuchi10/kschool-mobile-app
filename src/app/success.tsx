import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import PrimaryButton from '@/components/ui/PrimaryButton';

const { width } = Dimensions.get('window');

export default function SuccessScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        
        {/* Header Logo */}
        <View style={styles.headerLogoContainer}>
          <View style={styles.logoBox}>
            <Ionicons name="school-outline" size={24} color="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.logoTitle}>KSCHOOLMATE</Text>
            <Text style={styles.logoSubtitle}>Your School in Your Pocket</Text>
          </View>
        </View>

        {/* Success Icon Graphic */}
        <View style={styles.graphicContainer}>
          <View style={styles.outerCircle}>
            <View style={styles.innerCircle}>
              <Ionicons name="trophy-outline" size={64} color="#1A1A1A" />
            </View>
          </View>
        </View>

        {/* Text Content */}
        <Text style={styles.title}>You're All Set!</Text>
        <Text style={styles.subtitle}>
          Your KSCHOOLMATE space is prepared with your class topics and lessons. Let's make learning fun!
        </Text>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <PrimaryButton 
            title="Go to Dashboard" 
            onPress={() => router.replace('/(tabs)')} 
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
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  headerLogoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 60,
  },
  logoBox: {
    width: 48,
    height: 48,
    backgroundColor: '#127A71',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1A1A1A',
    letterSpacing: 0.5,
  },
  logoSubtitle: {
    fontSize: 12,
    color: '#127A71',
    fontWeight: '500',
  },
  graphicContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 48,
  },
  outerCircle: {
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: (width * 0.6) / 2,
    backgroundColor: '#D1FAE5', // Light mint/cyan
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerCircle: {
    width: width * 0.35,
    height: width * 0.35,
    borderRadius: (width * 0.35) / 2,
    backgroundColor: '#FEF3C7', // Soft yellow
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
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
  },
});
