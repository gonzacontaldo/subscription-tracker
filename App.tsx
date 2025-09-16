// App.tsx
import { NavigationContainer } from "@react-navigation/native";
import * as React from "react";
import "react-native-gesture-handler"; // MUST be first
import RootNavigator from "./src/navigation/RootNavigator";

export default function App() {
  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
}
