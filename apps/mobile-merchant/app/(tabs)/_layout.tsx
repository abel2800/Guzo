import { Tabs } from 'expo-router';
import { FloatingTabBar, colors, type TabConfig } from '@guzo/mobile-ui';

const MERCHANT_TABS: TabConfig[] = [
  { name: 'dashboard', label: 'Home', icon: 'home-outline', iconActive: 'home' },
  { name: 'create', label: 'Create', icon: 'add-circle-outline', iconActive: 'add-circle' },
  { name: 'orders', label: 'Orders', icon: 'list-outline', iconActive: 'list' },
  { name: 'profile', label: 'Profile', icon: 'person-outline', iconActive: 'person' },
];

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} tabs={MERCHANT_TABS} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="dashboard" options={{ title: 'Dashboard' }} />
      <Tabs.Screen name="create" options={{ title: 'Create' }} />
      <Tabs.Screen name="orders" options={{ title: 'Orders' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      <Tabs.Screen name="bulk" options={{ href: null }} />
    </Tabs>
  );
}
