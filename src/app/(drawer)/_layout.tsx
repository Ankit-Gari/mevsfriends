import { Drawer } from 'expo-router/drawer';

import { DrawerContent } from '@/components/navigation/drawer-content';

export default function DrawerLayout() {
  return (
    <Drawer
      screenOptions={{ headerShown: false, drawerType: 'front' }}
      drawerContent={(props) => <DrawerContent {...props} />}>
      <Drawer.Screen name="index" />
      <Drawer.Screen name="profile" />
      <Drawer.Screen name="games" />
      <Drawer.Screen name="coins" />
      <Drawer.Screen name="leaderboard" />
      <Drawer.Screen name="streak" />
    </Drawer>
  );
}
