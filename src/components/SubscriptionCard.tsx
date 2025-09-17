import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { subscriptionIcons } from "../constants/icons";
import { colors } from "../theme/colors";
import { Subscription } from "../types/subscription";
import { daysUntil } from "../utils/dataHelpers";

type Props = {
  subscription: Subscription;
  onPress: () => void;
};

export default function SubscriptionCard({ subscription, onPress }: Props) {
  const iconSource =
    subscription.iconKey && subscriptionIcons[subscription.iconKey]
      ? subscriptionIcons[subscription.iconKey]
      : subscriptionIcons.default;

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.row}>
        <Image source={iconSource} style={styles.icon} />
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{subscription.name}</Text>
          <Text style={styles.category}>{subscription.category}</Text>
          <Text style={styles.nextPayment}>
            Next Payment in {daysUntil(subscription.nextPaymentDate)} days
          </Text>
        </View>
        <Text style={styles.price}>
          {subscription.currency} {subscription.price.toFixed(2)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  row: { flexDirection: "row", alignItems: "center" },
  icon: { width: 32, height: 32, marginRight: 12, resizeMode: "contain" },
  name: {
    fontSize: 16,
    fontFamily: "PoppinsBold",
    color: colors.text,
  },
  category: {
    fontSize: 14,
    fontFamily: "PoppinsRegular",
    color: colors.textSecondary,
  },
  nextPayment: {
    fontSize: 14,
    fontFamily: "PoppinsRegular",
    color: colors.muted,
  },
  price: {
    fontSize: 16,
    fontFamily: "PoppinsBold",
    color: colors.accent,
  },
});
