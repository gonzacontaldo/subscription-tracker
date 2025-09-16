// src/screens/HomeScreen.tsx
import SubscriptionCard from "@/components/SubscriptionCard";
import type { RootStackParamList } from "@/navigation/RootNavigator";
import { mockSubscriptions } from "@/types/subscription";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as React from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export default function HomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Subscriptions</Text>

      <FlatList
        data={mockSubscriptions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => navigation.navigate("Details", { id: item.id })}
          >
            <SubscriptionCard item={item} />
          </Pressable>
        )}
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      <Pressable
        style={styles.addButton}
        onPress={() => navigation.navigate("AddSubscription")}
      >
        <Text style={styles.addText}>+ Add Subscription</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#0B132B" },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: "#5BC0BE",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },
  addText: { color: "#0B132B", fontWeight: "700", fontSize: 16 },
});
