import { NavigationContainer } from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import * as React from "react";
import { ActivityIndicator, View } from "react-native";
import "react-native-gesture-handler";
import { initDatabase } from "./src/db/database";
import RootNavigator from "./src/navigation/RootNavigator";
import { loadFonts } from "./src/theme/fonts";

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

export default function App() {
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        await loadFonts();
        await initDatabase();
      } catch (e) {
        console.error("Init failed", e);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
}
