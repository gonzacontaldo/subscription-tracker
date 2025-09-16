// src/components/SubscriptionCard.tsx
import type { Subscription } from "@/types/subscription";
import * as React from "react";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  item: Subscription;
};

export default function SubscriptionCard({ item }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.price}>
          {item.currency} {item.price.toFixed(2)}
        </Text>
      </View>
      <Text style={styles.category}>{item.category}</Text>
      <Text style={styles.nextPayment}>Next: {item.nextPaymentDate}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1C2541",
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  name: { color: "#FFFFFF", fontSize: 18, fontWeight: "600" },
  price: { color: "#5BC0BE", fontSize: 16, fontWeight: "700" },
  category: { color: "#B8C1EC", fontSize: 14 },
  nextPayment: { color: "#E0FBFC", fontSize: 12, marginTop: 6 },
});
