// src/screens/HomeScreen.tsx
import * as React from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  const [count, setCount] = React.useState(0);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Subscription Tracker</Text>
      <Text style={styles.subtitle}>
        If you can see this, navigation + your custom screen are working ✅
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Subscriptions this month</Text>
        <Text style={styles.cardValue}>{count}</Text>
        <Pressable
          onPress={() => setCount((c) => c + 1)}
          style={({ pressed }) => [styles.button, pressed && { opacity: 0.8 }]}
        >
          <Text style={styles.buttonText}>Fake Add +1</Text>
        </Pressable>
      </View>

      <Pressable
        onPress={() => Alert.alert("Looks good!", "Everything is wired up.")}
        style={({ pressed }) => [
          styles.secondaryButton,
          pressed && { opacity: 0.8 },
        ]}
      >
        <Text style={styles.secondaryText}>Run check</Text>
      </Pressable>

      <Text style={styles.footer}>
        Next: create Add / Details screens and wire real data.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 32,
    gap: 16,
    backgroundColor: "#0B132B",
  },
  title: { fontSize: 24, fontWeight: "700", color: "#FFFFFF" },
  subtitle: { fontSize: 14, color: "#B8C1EC" },
  card: {
    backgroundColor: "#1C2541",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
    gap: 10,
  },
  cardTitle: { color: "#B8C1EC", fontSize: 14 },
  cardValue: { color: "#FFFFFF", fontSize: 48, fontWeight: "800" },
  button: {
    marginTop: 8,
    backgroundColor: "#5BC0BE",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: { color: "#0B132B", fontWeight: "700" },
  secondaryButton: {
    marginTop: 4,
    backgroundColor: "#3A506B",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  secondaryText: { color: "#E0FBFC", fontWeight: "600" },
  footer: { color: "#93A3BC", marginTop: 8, fontSize: 12 },
});
