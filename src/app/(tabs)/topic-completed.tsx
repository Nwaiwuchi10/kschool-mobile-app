import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';
import { View, Text, StyleSheet,} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import PrimaryButton from '@/components/ui/PrimaryButton';

export default function TopicCompletedScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      
      <View style={styles.container}>
        <View style={styles.content}>
          
          <View style={styles.iconContainer}>
            <View style={styles.iconOuterRing}>
              <View style={styles.iconInnerCircle}>
                <Ionicons name="school-outline" size={32} color="#FFFFFF" />
              </View>
              {/* Sparkles */}
              <Ionicons name="sparkles" size={16} color="#127A71" style={styles.sparkle1} />
              <Ionicons name="sparkles" size={12} color="#127A71" style={styles.sparkle2} />
            </View>
          </View>

          <Text style={styles.title}>Topic Completed! 🎉</Text>
          <Text style={styles.subtitle}>
            You've completed your free learning experience.
          </Text>

          <View style={styles.courseCard}>
            <View style={styles.courseIconBox}>
              <Text style={styles.courseIconText}>JSS</Text>
            </View>
            <View style={styles.courseInfo}>
              <Text style={styles.courseLabel}>JSS 1 ENGLISH LANGUAGE</Text>
              <Text style={styles.courseName}>Introduction To Verbs</Text>
            </View>
            <Ionicons name="checkmark-circle" size={24} color="#127A71" />
          </View>

        </View>

        <View style={styles.footer}>
          <PrimaryButton 
            title="Continue" 
            onPress={() => router.push('/premium-access')} 
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
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 40,
  },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 40,
  },
  iconOuterRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#D1FAE5',
    borderWidth: 2,
    borderColor: '#127A71',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  iconInnerCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#127A71',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sparkle1: {
    position: 'absolute',
    top: 20,
    left: 10,
  },
  sparkle2: {
    position: 'absolute',
    bottom: 24,
    right: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1A1A1A',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 40,
  },
  courseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1FAE5',
    borderRadius: 20,
    padding: 16,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  courseIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  courseIconText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#127A71',
  },
  courseInfo: {
    flex: 1,
  },
  courseLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#127A71',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  courseName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  footer: {
    width: '100%',
  },
});
