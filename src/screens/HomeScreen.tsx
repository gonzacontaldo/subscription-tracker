import { useIsFocused } from "@react-navigation/native";
import * as React from "react";
import { Pressable, SectionList, StyleSheet, Text, View } from "react-native";
import SubscriptionCard from "../components/SubscriptionCard";
import {
  getAllSubscriptions,
  updateSubscription,
} from "../db/repositories/subscriptions.repo";
import { colors } from "../theme/colors";
import { Subscription } from "../types/subscription";
import { rollForwardNextPayment } from "../utils/dataHelpers";

export default function HomeScreen({ navigation }: any) {
  const [subscriptions, setSubscriptions] = React.useState<Subscription[]>([]);
  const isFocused = useIsFocused();

  const loadData = async () => {
    try {
      const subs = await getAllSubscriptions();

      // Auto-roll forward next payment dates if they are in the past
      for (let sub of subs) {
        const rolled = rollForwardNextPayment(
          sub.startDate,
          sub.billingCycle,
          sub.nextPaymentDate
        );
        if (rolled !== sub.nextPaymentDate) {
          await updateSubscription({ ...sub, nextPaymentDate: rolled });
          sub.nextPaymentDate = rolled; // update local state copy too
        }
      }

      setSubscriptions(subs);
    } catch (err) {
      console.error("Failed to load subscriptions:", err);
    }
  };

  React.useEffect(() => {
    if (isFocused) loadData();
  }, [isFocused]);

  // Group by category
  const grouped = subscriptions.reduce((acc: any, sub) => {
    const cat = sub.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(sub);
    return acc;
  }, {});

  const sections = Object.keys(grouped).map((cat) => ({
    title: cat,
    data: grouped[cat],
  }));

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id!.toString()}
        renderItem={({ item }) => (
          <SubscriptionCard
            subscription={item}
            onPress={() => navigation.navigate("Details", { id: item.id })}
          />
        )}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionHeader}>{title}</Text>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No subscriptions yet. Add one!</Text>
        }
      />

      <Pressable
        style={styles.fab}
        onPress={() => navigation.navigate("AddSubscription")}
      >
        <Text style={styles.fabText}>＋</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  sectionHeader: {
    fontSize: 18,
    fontFamily: "PoppinsBold",
    backgroundColor: colors.background,
    color: colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginTop: 12,
  },
  empty: {
    textAlign: "center",
    marginTop: 40,
    color: colors.textSecondary,
    fontFamily: "PoppinsRegular",
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: colors.accent,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  fabText: { fontSize: 28, color: colors.background, fontWeight: "bold" },
});
