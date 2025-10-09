import { NavigationContainer } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import * as React from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-gesture-handler';

import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import AuthNavigator from './src/navigation/AuthNavigator';
import RootNavigator from './src/navigation/RootNavigator';
import { loadFonts } from './src/theme/fonts';

// Configure notifications so they appear in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function AppNavigation() {
  const { user, initializing } = useAuth();

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <RootNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

export default function App() {
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    void (async () => {
      try {
        await loadFonts();
      } catch (e) {
        console.error('Init failed', e);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <AuthProvider>
      <AppNavigation />
    </AuthProvider>
  );
}
