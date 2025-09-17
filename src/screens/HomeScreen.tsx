import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as React from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import SubscriptionCard from "../components/SubscriptionCard";
import { getAllSubscriptions } from "../db/repositories/subscriptions.repo";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors } from "../theme/colors";
import { Subscription } from "../types/subscription";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export default function HomeScreen({ navigation }: Props) {
  const [subs, setSubs] = React.useState<Subscription[]>([]);
  const [loading, setLoading] = React.useState(true);

  const loadData = async () => {
    try {
      const data = await getAllSubscriptions();
      setSubs(data);
    } catch (err) {
      console.error("Failed to load subscriptions:", err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    const unsubscribe = navigation.addListener("focus", loadData);
    return unsubscribe;
  }, [navigation]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={subs}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              navigation.navigate("Details", { id: String(item.id) })
            }
          >
            <SubscriptionCard item={item} />
          </Pressable>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No subscriptions yet.</Text>
        }
      />
      <Pressable
        style={styles.addButton}
        onPress={() => navigation.navigate("AddSubscription")}
      >
        <Text style={styles.addText}>＋</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 20 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: { color: colors.textSecondary, textAlign: "center", marginTop: 20 },
  addButton: {
    position: "absolute",
    bottom: 30,
    right: 30,
    backgroundColor: colors.accent,
    borderRadius: 30,
    width: 60,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  addText: {
    color: colors.background,
    fontSize: 30,
    fontFamily: "PoppinsBold",
  },
});
