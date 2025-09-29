import { createDrawerNavigator } from "@react-navigation/drawer";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as React from "react";
import AddSubscriptionScreen from "../screens/AddSubscriptionScreen";
import AnalyticsScreen from "../screens/AnalyticsScreen";
import DetailsScreen from "../screens/DetailsScreen";
import HomeScreen from "../screens/HomeScreen";
import { colors } from "../theme/colors";

export type RootStackParamList = {
  Home: undefined;
  AddSubscription: undefined;
  Details: { id: number };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Drawer = createDrawerNavigator();

function MainStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="AddSubscription" component={AddSubscriptionScreen} />
      <Stack.Screen name="Details" component={DetailsScreen} />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          backgroundColor: colors.background,
          width: 240,
        },
        drawerActiveTintColor: colors.accent,
        drawerInactiveTintColor: colors.textSecondary,
        drawerLabelStyle: {
          fontFamily: "PoppinsRegular",
          fontSize: 15,
        },
      }}
    >
      <Drawer.Screen
        name="Main"
        component={MainStack}
        options={{ drawerLabel: "Home" }}
      />
      <Drawer.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{ drawerLabel: "Analytics" }}
      />
      {/* Later add: <Drawer.Screen name="Filters" component={FiltersScreen} /> */}
    </Drawer.Navigator>
  );
}
