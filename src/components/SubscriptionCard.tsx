import * as React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { subscriptionIcons } from "../constants/icons";
import { colors } from "../theme/colors";
import type { Subscription } from "../types/subscription";

type Props = { item: Subscription };

export default function SubscriptionCard({ item }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.iconWrapper}>
          <Image
            source={subscriptionIcons[item.iconKey || "default"]}
            style={styles.icon}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.category}>{item.category}</Text>
        </View>
        <Text style={styles.price}>
          {item.currency} {item.price.toFixed(2)}
        </Text>
      </View>
      <Text style={styles.nextPayment}>
        Next: {new Date(item.nextPaymentDate).toDateString()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  row: { flexDirection: "row", alignItems: "center" },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.accentSecondary,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  icon: { width: 32, height: 32, resizeMode: "contain" },
  name: { color: colors.text, fontSize: 18, fontFamily: "PoppinsBold" },
  price: { color: colors.accent, fontSize: 16, fontFamily: "PoppinsBold" },
  category: { color: colors.textSecondary, fontFamily: "PoppinsRegular" },
  nextPayment: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 6,
    fontFamily: "PoppinsRegular",
  },
});
