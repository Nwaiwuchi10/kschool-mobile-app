import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const SUPPORT_ITEMS = [
  { id: '1', title: 'Frequently Asked Questions', icon: 'help-circle-outline' },
  { id: '2', title: 'Account & Login Help', icon: 'person-outline' },
  { id: '3', title: 'Learning & Lessons', icon: 'book-outline' },
  { id: '4', title: 'Contact Support', icon: 'chatbubble-outline' },
  { id: '5', title: 'Report a Problem', icon: 'warning-outline' },
];

export default function SupportScreen() {
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
        
        <Text style={styles.title}>Support & Help</Text>

        <View style={styles.listContainer}>
          {SUPPORT_ITEMS.map((item, index) => (
            <React.Fragment key={item.id}>
              <TouchableOpacity style={styles.itemRow}>
                <View style={styles.iconBox}>
                  <Ionicons name={item.icon as any} size={20} color="#1A1A1A" />
                </View>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>
              {index < SUPPORT_ITEMS.length - 1 && <View style={styles.separator} />}
            </React.Fragment>
          ))}
        </View>

      </ScrollView>

      {/* Footer Contact Box */}
      <View style={styles.footer}>
        <View style={styles.contactCard}>
          <View style={styles.contactIconBox}>
            <Ionicons name="mail-outline" size={24} color="#127A71" />
          </View>
          <View>
            <Text style={styles.contactLabel}>Contact support directly</Text>
            <Text style={styles.contactEmail}>support@kschoolmate.com</Text>
          </View>
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
    marginBottom: 32,
  },
  listContainer: {
    marginBottom: 32,
  },
  itemRow: {
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
  itemTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  separator: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 64, // Align with text
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 16,
    backgroundColor: '#FAFAFA',
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5', // Light cyan background
    borderRadius: 20,
    padding: 20,
  },
  contactIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contactLabel: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 4,
  },
  contactEmail: {
    fontSize: 15,
    fontWeight: '800',
    color: '#127A71',
  },
});
