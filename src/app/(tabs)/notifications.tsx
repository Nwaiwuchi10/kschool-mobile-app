import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const NOTIFICATIONS = [
  {
    section: 'TODAY',
    data: [
      { id: '1', title: 'New Lesson Available', time: '2h ago', content: 'Algebra: Quadratic Equations has been added to your Mathematics course.', icon: 'calculator-outline', color: '#D1FAE5', unread: true },
      { id: '2', title: 'Quiz Reminder', time: '4h ago', content: 'You have an incomplete quiz in English Language — Grammar Basics.', icon: 'create-outline', color: '#FEF3C7', unread: true },
      { id: '3', title: 'Teacher Announcement', time: '5h ago', content: "Mrs. Johnson: Please review Chapter 5 before Monday's class.", icon: 'megaphone-outline', color: '#DBEAFE', unread: true },
    ]
  },
  {
    section: 'YESTERDAY',
    data: [
      { id: '4', title: 'Topic Completed!', time: '3:45 PM', content: 'Congratulations! You completed Fractions in Mathematics.', icon: 'trophy-outline', color: '#FEF3C7', unread: false },
      { id: '5', title: 'School Announcement', time: '10:00 AM', content: 'Mid-term exams begin on March 15th. Check your schedule.', icon: 'business-outline', color: '#FCE7F3', unread: false },
    ]
  },
  {
    section: 'EARLIER',
    data: [
      { id: '6', title: 'Learning Reminder', time: 'Mon 8:00 AM', content: "You haven't studied in 2 days. Keep your streak going!", icon: 'notifications-outline', color: '#FEF3C7', unread: false },
    ]
  }
];

export default function NotificationsScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.push('/(tabs)')}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity style={styles.markReadBtn}>
          <Text style={styles.markReadText}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {NOTIFICATIONS.map((group) => (
          <View key={group.section} style={styles.sectionContainer}>
            <Text style={styles.sectionHeader}>{group.section}</Text>
            
            <View style={styles.listContainer}>
              {group.data.map((item) => (
                <View key={item.id} style={styles.notificationCard}>
                  {item.unread && <View style={styles.unreadDot} />}
                  
                  <View style={[styles.iconBox, { backgroundColor: item.color }]}>
                    <Ionicons name={item.icon as any} size={20} color="#4B5563" />
                  </View>
                  
                  <View style={styles.contentContainer}>
                    <View style={styles.titleRow}>
                      <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                      <Text style={styles.time}>{item.time}</Text>
                    </View>
                    <Text style={styles.content}>{item.content}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}

      </ScrollView>
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
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
    marginLeft: -8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  markReadBtn: {
    paddingVertical: 8,
  },
  markReadText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#127A71',
  },
  container: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 1,
    marginBottom: 16,
  },
  listContainer: {
    gap: 12,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    padding: 16,
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    left: 8,
    top: 24,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#127A71',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    marginLeft: 4, // Accommodate unread dot
  },
  contentContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A1A',
    marginRight: 8,
  },
  time: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  content: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
});
