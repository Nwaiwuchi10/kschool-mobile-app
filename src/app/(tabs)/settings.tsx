import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/store/AuthContext';
import ResponseMessageModal from '@/components/ui/ResponseMessageModal';
import { useResponseModal } from '@/hooks/useResponseModal';
import { useAppTheme } from '@/hooks/useAppTheme';

const SETTINGS_ITEMS = [
  { id: '1', title: 'Dashboard', icon: 'grid-outline', route: '/(tabs)' },
  { id: '2', title: 'Profile', icon: 'person-outline', route: '/profile' },
  { id: '3', title: 'Switch / Subscribe Class', icon: 'school-outline', route: '/select-class' },
  { id: '4', title: 'Subscription & Payments', icon: 'card-outline', route: '/subscription' },
  { id: '5', title: 'Notification', icon: 'notifications-outline', route: '/notifications' },
  { id: '6', title: 'Change Password', icon: 'lock-closed-outline', route: '/change-password' },
  { id: '7', title: 'Help & Support', icon: 'help-circle-outline', route: '/support' },
  { id: '8', title: 'About KSCHOOLMATE', icon: 'information-circle-outline', route: '/about' },
];

export default function SettingsScreen() {
  const { logout } = useAuth();
  const { modalConfig, showWarning, hideModal } = useResponseModal();
  const { colors, isDark, toggleTheme } = useAppTheme();

  const handleLogout = () => {
    showWarning(
      'Log Out',
      'Are you sure you want to log out of your KSCHOOLMATE account?',
      async () => {
        try {
          await logout();
        } finally {
          router.replace('/login');
        }
      },
      'Yes, Log Out',
      'Cancel',
      hideModal
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Appearance / Theme Switch Card */}
        <View style={[styles.themeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(26, 181, 167, 0.15)' : '#E0F2F1' }]}>
            <Ionicons name={isDark ? 'moon' : 'sunny-outline'} size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.itemTitle, { color: colors.text }]}>Dark Mode</Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>{isDark ? 'Dark theme enabled' : 'Light theme enabled'}</Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: '#E5E7EB', true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={styles.listContainer}>
          {SETTINGS_ITEMS.map((item, index) => (
            <React.Fragment key={item.id}>
              <TouchableOpacity 
                style={styles.itemRow}
                onPress={() => item.route ? router.push(item.route as any) : null}
              >
                <View style={[styles.iconBox, { backgroundColor: colors.surfaceAlt }]}>
                  <Ionicons name={item.icon as any} size={20} color={colors.text} />
                </View>
                <Text style={[styles.itemTitle, { color: colors.text }]}>{item.title}</Text>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              </TouchableOpacity>
              {index < SETTINGS_ITEMS.length - 1 && (
                <View style={[styles.separator, { backgroundColor: colors.borderLight }]} />
              )}
            </React.Fragment>
          ))}
        </View>

        <View style={[styles.logoutSeparator, { backgroundColor: colors.border }]} />

        <TouchableOpacity style={styles.logoutRow} onPress={handleLogout}>
          <View style={styles.logoutIconBox}>
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          </View>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

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
    backgroundColor: '#FAFAFA',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1A1A1A',
  },
  container: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  listContainer: {
    marginBottom: 32,
  },
  themeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E5E7EB', // Light grey box
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  itemTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  separator: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 56, // Align with text
  },
  logoutSeparator: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 24,
  },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FEE2E2', // Light red box
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#EF4444',
  },
});
