import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { studentDashboardService, AnnouncementItem } from '@/services/dashboard.service';
import { useAppTheme } from '@/hooks/useAppTheme';

interface NotificationItem {
  id: string;
  title: string;
  time: string;
  content: string;
  icon: any;
  color: string;
  unread: boolean;
  audience?: string;
  authorName?: string;
}

export default function NotificationsScreen() {
  const { colors, isDark } = useAppTheme();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const formatTimeAgo = (dateStr?: string) => {
    if (!dateStr) return 'Recently';
    const date = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 172800) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const fetchNotifications = useCallback(async () => {
    try {
      const announcements = await studentDashboardService.getAnnouncements();

      if (Array.isArray(announcements) && announcements.length > 0) {
        const mapped: NotificationItem[] = announcements.map((item, idx) => ({
          id: item._id || String(idx),
          title: item.title,
          time: formatTimeAgo(item.createdAt),
          content: item.content,
          icon: item.pinned ? 'alert-circle-outline' : 'megaphone-outline',
          color: item.pinned ? '#FEE2E2' : '#DBEAFE',
          unread: idx < 2,
          audience: item.audience || 'All Students',
          authorName: item.authorName || 'School Administrator',
        }));
        setNotifications(mapped);
        setUnreadCount(mapped.filter((n) => n.unread).length);
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (err) {
      console.warn('Failed to fetch announcements from backend:', err);
      setNotifications([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchNotifications();
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    setUnreadCount(0);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)');
            }
          }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={{ fontSize: 11, color: colors.primary, fontWeight: '700' }}>
              {unreadCount} unread announcement{unreadCount === 1 ? '' : 's'}
            </Text>
          )}
        </View>
        {notifications.length > 0 && (
          <TouchableOpacity style={styles.markReadBtn} onPress={handleMarkAllRead}>
            <Text style={[styles.markReadText, { color: colors.primary }]}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading notifications...</Text>
          </View>
        ) : notifications.length === 0 ? (
          <View style={[styles.emptyContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.emptyIconCircle, { backgroundColor: colors.surfaceAlt }]}>
              <Ionicons name="notifications-off-outline" size={40} color={colors.textMuted} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Notifications Yet</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Official school announcements, curriculum updates, and reminders from your teachers will appear here.
            </Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {notifications.map((item) => (
              <View
                key={item.id}
                style={[
                  styles.notificationCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: item.unread ? colors.primary : colors.border,
                    borderWidth: item.unread ? 1.5 : 1,
                  },
                ]}
              >
                {item.unread && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
                
                <View style={[styles.iconBox, { backgroundColor: item.color }]}>
                  <Ionicons name={item.icon as any} size={20} color="#1E293B" />
                </View>
                
                <View style={styles.contentContainer}>
                  <View style={styles.titleRow}>
                    <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={[styles.time, { color: colors.textMuted }]}>{item.time}</Text>
                  </View>
                  <Text style={[styles.content, { color: colors.textSecondary }]}>{item.content}</Text>
                  {item.authorName && (
                    <View style={styles.authorRow}>
                      <Ionicons name="person-circle-outline" size={13} color={colors.primary} />
                      <Text style={[styles.authorText, { color: colors.primary }]}>{item.authorName}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
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
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  authorText: {
    fontSize: 11,
    fontWeight: '700',
  },
  loadingBox: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    paddingVertical: 48,
    paddingHorizontal: 24,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
});
