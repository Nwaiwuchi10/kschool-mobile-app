import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';
import { useAppTheme } from '@/hooks/useAppTheme';

export default function TabLayout() {
  const { colors } = useAppTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.tabIconActive,
        tabBarInactiveTintColor: colors.tabIconInactive,
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: colors.tabBarBg,
            borderTopColor: colors.tabBarBorder,
          },
        ],
        tabBarLabelStyle: styles.tabBarLabel,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="subjects"
        options={{
          title: 'Subjects',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'book' : 'book-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'bar-chart' : 'bar-chart-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'settings' : 'settings-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="lesson"
        options={{
          href: null, // Hides this screen from the bottom tab bar buttons
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="quiz"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="quiz-result"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="subject-details"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="topic-details"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="topic-completed"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    height: 80,
    paddingBottom: 24,
    paddingTop: 8,
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },
});
