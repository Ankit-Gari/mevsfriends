import { DrawerContentComponentProps } from 'expo-router/drawer';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FontSize, Gradient, Palette, Radius, Spacing } from '@/constants/theme';
import { useProfile } from '@/hooks/use-profile';
import { signOut } from '@/lib/auth';
import { LinearGradient } from 'expo-linear-gradient';

type DrawerRoute = '/profile' | '/games' | '/coins' | '/leaderboard' | '/streak';

const NAV_ITEMS: { label: string; icon: string; route: DrawerRoute }[] = [
  { label: 'Profile', icon: '👤', route: '/profile' },
  { label: 'Games', icon: '🎮', route: '/games' },
  { label: 'Coins', icon: '🪙', route: '/coins' },
  { label: 'Leaderboard', icon: '🏆', route: '/leaderboard' },
  { label: 'Streak', icon: '🔥', route: '/streak' },
];

export function DrawerContent(props: DrawerContentComponentProps) {
  const { profile } = useProfile();

  const go = (route: DrawerRoute) => {
    props.navigation.closeDrawer();
    router.push(route as any);
  };

  const handleLogout = async () => {
    props.navigation.closeDrawer();
    await signOut();
    router.replace('/');
  };

  return (
    <LinearGradient colors={Gradient.page} style={styles.root}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarIcon}>{'👤'}</Text>
          </View>
          <Text style={styles.username}>{profile?.username ?? 'Guest'}</Text>
        </View>

        <View style={styles.items}>
          {NAV_ITEMS.map((item) => (
            <Pressable key={item.route} style={styles.item} onPress={() => go(item.route)}>
              <Text style={styles.itemIcon}>{item.icon}</Text>
              <Text style={styles.itemLabel}>{item.label}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable style={[styles.item, styles.logoutItem]} onPress={handleLogout}>
          <Text style={styles.itemIcon}>{'🚪'}</Text>
          <Text style={[styles.itemLabel, styles.logoutLabel]}>Logout</Text>
        </Pressable>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.four,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingBottom: Spacing.four,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
    marginBottom: Spacing.three,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Palette.surface,
    borderWidth: 2,
    borderColor: Palette.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarIcon: {
    fontSize: 24,
  },
  username: {
    color: Palette.text,
    fontSize: FontSize.subtitle,
    fontWeight: '700',
  },
  items: {
    gap: Spacing.one,
    flex: 1,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.medium,
  },
  itemIcon: {
    fontSize: FontSize.subtitle,
    width: 28,
    textAlign: 'center',
  },
  itemLabel: {
    color: Palette.text,
    fontSize: FontSize.body,
    fontWeight: '600',
  },
  logoutItem: {
    marginBottom: Spacing.four,
    borderTopWidth: 1,
    borderTopColor: Palette.border,
    paddingTop: Spacing.three,
  },
  logoutLabel: {
    color: Palette.danger,
  },
});
