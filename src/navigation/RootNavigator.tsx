/* eslint-disable react-native/no-unused-styles */
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItemList,
  type DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as React from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../contexts/AuthContext';
import AddSubscriptionScreen from '../screens/AddSubscriptionScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import DetailsScreen from '../screens/DetailsScreen';
import HomeScreen from '../screens/HomeScreen';
import { colors } from '../theme/colors';
import { responsiveFont, responsiveSpacing } from '../theme/layout';

export type RootStackParamList = {
  Home: undefined;
  AddSubscription: undefined;
  Details: { id: string };
};

export type RootDrawerParamList = {
  Main: undefined;
  Analytics: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Drawer = createDrawerNavigator<RootDrawerParamList>();

function CustomDrawerContent(props: DrawerContentComponentProps) {
  const { user, logout, switchAccount } = useAuth();
  const { width } = useWindowDimensions();
  const styles = React.useMemo(() => createDrawerStyles(width), [width]);

  const initials = React.useMemo(() => {
    if (!user?.displayName) {
      return user?.email?.charAt(0)?.toUpperCase() ?? '?';
    }
    return user.displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  }, [user]);

  const handleLogout = React.useCallback(() => {
    void logout().catch((err) => console.error('Logout failed', err));
  }, [logout]);

  const handleSwitchAccount = React.useCallback(() => {
    void switchAccount().catch((err) => console.error('Switch account failed', err));
  }, [switchAccount]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoContainer}>
          <View style={styles.logoFrame}>
            <Image
              source={require('../../assets/Tracker.png')}
              style={styles.logo}
              resizeMode="cover"
              accessible
              accessibilityLabel="Trackify logo"
            />
          </View>
        </View>
        <DrawerItemList {...props} />
      </DrawerContentScrollView>
      <View style={styles.footer}>
        <View style={styles.profileRow}>
          {user?.avatarUri ? (
            <Image source={{ uri: user.avatarUri }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}
          <View style={styles.profileText}>
            <Text style={styles.displayName}>{user?.displayName ?? 'Guest'}</Text>
            <Text style={styles.email}>{user?.email ?? 'No email'}</Text>
          </View>
        </View>
        <Pressable style={styles.actionButton} onPress={handleSwitchAccount}>
          <Text style={styles.actionLabel}>Change account</Text>
        </Pressable>
        <Pressable
          style={[styles.actionButton, styles.logoutButton]}
          onPress={handleLogout}
        >
          <Text style={[styles.actionLabel, styles.logoutLabel]}>Log out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function MainStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="AddSubscription" component={AddSubscriptionScreen} />
      <Stack.Screen name="Details" component={DetailsScreen} />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          backgroundColor: colors.background,
          width: 240,
        },
        drawerActiveTintColor: colors.accent,
        drawerInactiveTintColor: colors.textSecondary,
        drawerLabelStyle: {
          fontFamily: 'PoppinsRegular',
          fontSize: 15,
        },
      }}
    >
      <Drawer.Screen
        name="Main"
        component={MainStack}
        options={{ drawerLabel: 'Home' }}
      />
      <Drawer.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{ drawerLabel: 'Analytics' }}
      />
      {/* Later add: <Drawer.Screen name="Filters" component={FiltersScreen} /> */}
    </Drawer.Navigator>
  );
}

const createDrawerStyles = (width: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      paddingTop: responsiveSpacing(0.4, width),
      paddingHorizontal: 0,
    },
    logoContainer: {
      paddingHorizontal: responsiveSpacing(0.3, width),
      paddingBottom: responsiveSpacing(1, width),
      alignItems: 'flex-start',
    },
    logoFrame: {
      width: responsiveSpacing(18, width),
      height: responsiveSpacing(5.6, width),
      borderRadius: responsiveSpacing(1.2, width),
      overflow: 'hidden',
      backgroundColor: 'transparent',
      alignSelf: 'flex-start',
    },
    logo: {
      width: responsiveSpacing(36, width),
      height: responsiveSpacing(10.2, width),
      transform: [
        { translateX: -responsiveSpacing(9.2, width) },
        { translateY: -responsiveSpacing(3.1, width) },
      ],
    },
    footer: {
      paddingHorizontal: responsiveSpacing(1.4, width),
      paddingBottom: responsiveSpacing(1.4, width),
      gap: responsiveSpacing(0.8, width),
    },
    profileRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: responsiveSpacing(0.9, width),
      paddingVertical: responsiveSpacing(0.6, width),
      borderTopWidth: StyleSheet.hairlineWidth,
      borderColor: `${colors.textSecondary}33`,
    },
    avatar: {
      width: responsiveSpacing(4.8, width),
      height: responsiveSpacing(4.8, width),
      borderRadius: responsiveSpacing(2.4, width),
    },
    avatarFallback: {
      width: responsiveSpacing(4.8, width),
      height: responsiveSpacing(4.8, width),
      borderRadius: responsiveSpacing(2.4, width),
      backgroundColor: `${colors.accent}22`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarInitials: {
      fontFamily: 'PoppinsBold',
      color: colors.accent,
      fontSize: responsiveFont(15, width),
    },
    profileText: {
      flex: 1,
      gap: responsiveSpacing(0.2, width),
    },
    displayName: {
      fontFamily: 'PoppinsBold',
      color: colors.text,
      fontSize: responsiveFont(14, width),
    },
    email: {
      fontFamily: 'PoppinsRegular',
      color: colors.textSecondary,
      fontSize: responsiveFont(12, width),
    },
    actionButton: {
      paddingVertical: responsiveSpacing(0.8, width),
    },
    actionLabel: {
      fontFamily: 'PoppinsRegular',
      color: colors.text,
      fontSize: responsiveFont(13, width),
    },
    logoutButton: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderColor: `${colors.textSecondary}22`,
      marginTop: responsiveSpacing(0.2, width),
    },
    logoutLabel: {
      color: colors.danger,
      fontFamily: 'PoppinsBold',
    },
  });
