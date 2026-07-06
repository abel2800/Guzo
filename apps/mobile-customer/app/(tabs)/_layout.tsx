import { Tabs } from 'expo-router';
import { FloatingTabBar, colors, type TabConfig } from '@guzo/mobile-ui';

const CUSTOMER_TABS: TabConfig[] = [
  { name: 'home', label: 'Home', icon: 'home-outline', iconActive: 'home' },
  { name: 'book', label: 'Send', icon: 'cube-outline', iconActive: 'cube' },
  { name: 'notifications', label: 'Alerts', icon: 'notifications-outline', iconActive: 'notifications' },
  { name: 'profile', label: 'Profile', icon: 'person-outline', iconActive: 'person' },
];

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} tabs={CUSTOMER_TABS} />}
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="book" options={{ title: 'Send Order' }} />
      <Tabs.Screen name="notifications" options={{ title: 'Alerts' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      <Tabs.Screen name="orders" options={{ href: null, title: 'Orders' }} />
    </Tabs>
  );
}
