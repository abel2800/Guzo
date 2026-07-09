import { Tabs } from 'expo-router';
import { FloatingTabBar, colors, type TabConfig } from '@guzo/mobile-ui';

const BRANCH_TABS: TabConfig[] = [
  { name: 'home', label: 'Home', icon: 'grid-outline', iconActive: 'grid' },
  { name: 'receive', label: 'Receive', icon: 'download-outline', iconActive: 'download' },
  { name: 'pickup', label: 'Pickup', icon: 'qr-code-outline', iconActive: 'qr-code' },
  { name: 'profile', label: 'Profile', icon: 'person-outline', iconActive: 'person' },
];

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} tabs={BRANCH_TABS} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="receive" />
      <Tabs.Screen name="pickup" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
