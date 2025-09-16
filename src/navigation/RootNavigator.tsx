// src/navigation/RootNavigator.tsx
import AddSubscriptionScreen from "@/screens/AddSubscriptionScreen";
import DetailsScreen from "@/screens/DetailsScreen";
import HomeScreen from "@/screens/HomeScreen";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as React from "react";

export type RootStackParamList = {
  Home: undefined;
  AddSubscription: undefined;
  Details: { id: string }; // pass subscription id later
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: "Subscriptions" }}
      />
      <Stack.Screen
        name="AddSubscription"
        component={AddSubscriptionScreen}
        options={{ title: "Add Subscription" }}
      />
      <Stack.Screen
        name="Details"
        component={DetailsScreen}
        options={{ title: "Details" }}
      />
    </Stack.Navigator>
  );
}
