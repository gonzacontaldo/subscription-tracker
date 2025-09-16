// src/screens/DetailsScreen.tsx
import type { RootStackParamList } from "@/navigation/RootNavigator";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as React from "react";
import { StyleSheet, Text, View } from "react-native";

type Props = NativeStackScreenProps<RootStackParamList, "Details">;

export default function DetailsScreen({ route }: Props) {
  const { id } = route.params; // later we’ll load details by id

  return (
    <View style={styles.container}>
      <Text style={styles.text}>📄 Details Screen</Text>
      <Text style={styles.subtext}>Subscription ID: {id}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  text: { fontSize: 20, fontWeight: "600" },
  subtext: { marginTop: 8, fontSize: 14, color: "#888" },
});
