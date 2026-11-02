import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAppTheme } from '@/hooks/useAppTheme';

interface MenuItem {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  route?: string;
  action?: () => void;
}

export default function SupportScreen() {
  const { colors, isDark } = useAppTheme();

  const handleEmailSupport = () => {
    Linking.openURL('mailto:support@kschoolmate.com?subject=Support%20Request%20-%20KSCHOOLMATE');
  };

  const handleReportProblem = () => {
    Linking.openURL('mailto:support@kschoolmate.com?subject=Report%20a%20Problem%20-%20KSCHOOLMATE&body=Please%20describe%20the%20issue%20and%20the%20screen%20where%20it%20happened:%0A%0AApp%20Version:%201.0.0%0APlatform:%20' + Platform.OS);
  };

  const MENU_ITEMS: MenuItem[] = [
    {
      id: '1',
      title: 'Frequently Asked Questions',
      icon: 'help-circle-outline',
      route: '/faq',
    },
    {
      id: '2',
      title: 'Account & Login Help',
      icon: 'person-outline',
      route: '/account-help',
    },
    {
      id: '3',
      title: 'Learning & Lessons',
      icon: 'phone-portrait-outline',
      route: '/learning-help',
    },
    {
      id: '4',
      title: 'Contact Support',
      icon: 'chatbubble-outline',
      action: handleEmailSupport,
    },
    {
      id: '5',
      title: 'Report a Problem',
      icon: 'warning-outline',
      action: handleReportProblem,
    },
  ];

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
          <Ionicons name="arrow-back" size={22} color={colors.text} />
          <Text style={[styles.backText, { color: colors.text }]}>Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.text }]}>Support & Help</Text>

        <View style={styles.listContainer}>
          {MENU_ITEMS.map((item, index) => (
            <React.Fragment key={item.id}>
              <TouchableOpacity
                style={styles.itemRow}
                activeOpacity={0.7}
                onPress={() => {
                  if (item.action) {
                    item.action();
                  } else if (item.route) {
                    router.push(item.route as any);
                  }
                }}
              >
                <View
                  style={[
                    styles.iconBox,
                    {
                      backgroundColor: isDark ? colors.surfaceAlt : '#E5E7EB',
                    },
                  ]}
                >
                  <Ionicons name={item.icon} size={22} color={colors.text} />
                </View>
                <Text style={[styles.itemTitle, { color: colors.text }]}>{item.title}</Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={isDark ? '#6B7280' : '#4B5563'}
                />
              </TouchableOpacity>
              {index < MENU_ITEMS.length - 1 && (
                <View
                  style={[
                    styles.separator,
                    { backgroundColor: isDark ? colors.border : '#E5E7EB' },
                  ]}
                />
              )}
            </React.Fragment>
          ))}
        </View>
      </ScrollView>

      {/* Footer Contact Box */}
      <View style={[styles.footer, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[
            styles.contactCard,
            {
              backgroundColor: isDark ? '#143834' : '#CCFBEF',
              borderColor: isDark ? '#1D5A53' : '#A7F3D0',
            },
          ]}
          activeOpacity={0.8}
          onPress={handleEmailSupport}
        >
          <View
            style={[
              styles.contactIconBox,
              {
                backgroundColor: isDark ? '#1A4D46' : '#FFFFFF',
              },
            ]}
          >
            <Ionicons name="mail-outline" size={24} color={isDark ? '#2DD4BF' : '#0F766E'} />
          </View>
          <View style={styles.contactTextBox}>
            <Text
              style={[
                styles.contactLabel,
                { color: isDark ? '#99F6E4' : '#374151' },
              ]}
            >
              Contact support directly
            </Text>
            <Text
              style={[
                styles.contactEmail,
                { color: isDark ? '#2DD4BF' : '#0F766E' },
              ]}
            >
              support@kschoolmate.com
            </Text>
          </View>
        </TouchableOpacity>
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
    paddingBottom: 4,
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
    paddingTop: 20,
    paddingBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 32,
  },
  listContainer: {
    marginBottom: 20,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  itemTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 60,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 24 : 32,
    paddingTop: 8,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderWidth: 1,
  },
  contactIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  contactTextBox: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  contactEmail: {
    fontSize: 15,
    fontWeight: '800',
  },
});
