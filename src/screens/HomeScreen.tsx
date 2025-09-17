import { DrawerActions, useIsFocused } from "@react-navigation/native";
import * as React from "react";
import { Pressable, SectionList, StyleSheet, Text, View } from "react-native";
import SubscriptionCard from "../components/SubscriptionCard";
import {
  getAllSubscriptions,
  updateSubscription,
} from "../db/repositories/subscriptions.repo";
import { colors } from "../theme/colors";
import { Subscription } from "../types/subscription";
import { rollForwardNextPayment } from "../utils/dateHelpers";

export default function HomeScreen({ navigation }: any) {
  const [subscriptions, setSubscriptions] = React.useState<Subscription[]>([]);
  const [sortBy, setSortBy] = React.useState<
    "Price" | "Next Payment" | "Start Date"
  >("Next Payment");
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

      // Apply sorting
      const sorted = [...subs].sort((a, b) => {
        if (sortBy === "Price") return b.price - a.price;
        if (sortBy === "Start Date")
          return (
            new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
          );
        return (
          new Date(a.nextPaymentDate).getTime() -
          new Date(b.nextPaymentDate).getTime()
        );
      });

      setSubscriptions(sorted);
    } catch (err) {
      console.error("Failed to load subscriptions:", err);
    }
  };

  React.useEffect(() => {
    if (isFocused) loadData();
  }, [isFocused, sortBy]);

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
      <View style={styles.header}>
        <Pressable
          style={styles.menuButton}
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        >
          <Text style={styles.menuIcon}>☰</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Subscriptions</Text>
      </View>

      {/* Sorting Bar */}
      <View style={styles.sortWrapper}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        <View style={styles.sortButtons}>
          {["Price", "Next Payment", "Start Date"].map((opt) => (
            <Pressable
              key={opt}
              style={[
                styles.sortButton,
                sortBy === opt && styles.sortButtonActive,
              ]}
              onPress={() => setSortBy(opt as any)}
            >
              <Text
                style={[
                  styles.sortButtonText,
                  sortBy === opt && styles.sortButtonTextActive,
                ]}
              >
                {opt}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

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

  // Sorting
  sortWrapper: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  sortLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: "PoppinsRegular",
    marginBottom: 6,
  },
  sortButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 4,
  },
  sortButton: {
    flex: 1,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 8,
    alignItems: "center",
  },
  sortButtonActive: {
    backgroundColor: colors.accent,
  },
  sortButtonText: {
    fontFamily: "PoppinsRegular",
    fontSize: 14,
    color: colors.text,
  },
  sortButtonTextActive: {
    fontFamily: "PoppinsBold",
    color: colors.background,
  },

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
    bottom: 30,
    right: 30,
    backgroundColor: colors.accent,
    width: 70,
    height: 70,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  fabText: { fontSize: 28, color: colors.background, fontWeight: "bold" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 5,
    backgroundColor: colors.accent,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  menuIcon: {
    fontSize: 18,
    color: colors.background,
    fontFamily: "PoppinsBold",
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "PoppinsBold",
    color: colors.text,
  },
});
