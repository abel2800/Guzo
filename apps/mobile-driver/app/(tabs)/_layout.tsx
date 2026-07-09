import { Tabs } from 'expo-router';
import { FloatingTabBar, colors, type TabConfig } from '@guzo/mobile-ui';

const DRIVER_TABS: TabConfig[] = [
  { name: 'home', label: 'Home', icon: 'home-outline', iconActive: 'home' },
  { name: 'jobs', label: 'Jobs', icon: 'briefcase-outline', iconActive: 'briefcase' },
  { name: 'active', label: 'Active', icon: 'navigate-outline', iconActive: 'navigate' },
  { name: 'profile', label: 'Profile', icon: 'person-outline', iconActive: 'person' },
];

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} tabs={DRIVER_TABS} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="jobs" options={{ title: 'Jobs' }} />
      <Tabs.Screen name="active" options={{ title: 'Active' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
