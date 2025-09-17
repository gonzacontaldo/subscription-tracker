import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as React from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { categories } from "../constants/categories";
import { getIconKeyForName } from "../constants/icons";
import {
  deleteSubscription,
  getSubscriptionById,
  updateSubscription,
} from "../db/repositories/subscriptions.repo";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors } from "../theme/colors";
import type { Subscription } from "../types/subscription";

type Props = NativeStackScreenProps<RootStackParamList, "Details">;

export default function DetailsScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const [sub, setSub] = React.useState<Subscription | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [editing, setEditing] = React.useState(false);
  const [showDatePicker, setShowDatePicker] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        const result = await getSubscriptionById(Number(id));
        setSub(result);
      } catch (err) {
        console.error("Failed to load subscription:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleUpdate = async () => {
    if (!sub) return;
    try {
      await updateSubscription({
        ...sub,
        iconKey: getIconKeyForName(sub.name), // auto-update icon if name changes
      });
      setEditing(false);
      Alert.alert("Success", "Subscription updated");
    } catch (err) {
      console.error("Update failed:", err);
      Alert.alert("Error", "Could not update subscription");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteSubscription(Number(id));
      Alert.alert("Deleted", "Subscription removed");
      navigation.goBack();
    } catch (err) {
      console.error("Delete failed:", err);
      Alert.alert("Error", "Could not delete subscription");
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!sub) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Subscription not found ❌</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {editing ? (
        <>
          <TextInput
            style={styles.input}
            value={sub.name}
            onChangeText={(t) => setSub({ ...sub, name: t })}
          />
          <TextInput
            style={styles.input}
            value={String(sub.price)}
            keyboardType="numeric"
            onChangeText={(t) => setSub({ ...sub, price: parseFloat(t) || 0 })}
          />

          <Text style={styles.label}>Category</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={sub.category}
              onValueChange={(val) => setSub({ ...sub, category: val })}
              style={styles.picker}
            >
              {categories.map((cat) => (
                <Picker.Item key={cat} label={cat} value={cat} />
              ))}
            </Picker>
          </View>

          <Text style={styles.label}>Billing Cycle</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={sub.billingCycle}
              onValueChange={(val) =>
                setSub({
                  ...sub,
                  billingCycle: val as Subscription["billingCycle"],
                })
              }
              style={styles.picker}
            >
              <Picker.Item label="Monthly" value="monthly" />
              <Picker.Item label="Yearly" value="yearly" />
              <Picker.Item label="Weekly" value="weekly" />
              <Picker.Item label="Custom" value="custom" />
            </Picker>
          </View>

          <Text style={styles.label}>Start Date</Text>
          <Pressable
            onPress={() => setShowDatePicker(true)}
            style={styles.input}
          >
            <Text style={{ color: colors.text }}>
              {sub.startDate
                ? new Date(sub.startDate).toDateString()
                : "Pick a date"}
            </Text>
          </Pressable>
          {showDatePicker && (
            <DateTimePicker
              value={sub.startDate ? new Date(sub.startDate) : new Date()}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate)
                  setSub({ ...sub, startDate: selectedDate.toISOString() });
              }}
            />
          )}

          <Pressable style={styles.saveButton} onPress={handleUpdate}>
            <Text style={styles.saveText}>💾 Save</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text style={styles.name}>{sub.name}</Text>
          <Text style={styles.price}>
            {sub.currency} {sub.price.toFixed(2)}
          </Text>
          <Text style={styles.category}>Category: {sub.category}</Text>
          <Text style={styles.detail}>Billing Cycle: {sub.billingCycle}</Text>
          <Text style={styles.detail}>
            Start Date: {new Date(sub.startDate).toDateString()}
          </Text>
          <Text style={styles.detail}>
            Next Payment: {new Date(sub.nextPaymentDate).toDateString()}
          </Text>
        </>
      )}

      <View style={styles.row}>
        <Pressable style={styles.button} onPress={() => setEditing((e) => !e)}>
          <Text style={styles.buttonText}>
            {editing ? "Cancel" : "✏️ Edit"}
          </Text>
        </Pressable>

        <Pressable
          style={[styles.button, { backgroundColor: colors.danger }]}
          onPress={handleDelete}
        >
          <Text style={styles.buttonText}>🗑 Delete</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 20 },
  name: {
    fontSize: 26,
    fontFamily: "PoppinsBold",
    color: colors.text,
    marginBottom: 8,
  },
  price: {
    fontSize: 20,
    color: colors.accent,
    fontFamily: "PoppinsBold",
    marginBottom: 16,
  },
  category: { color: colors.textSecondary, marginBottom: 8, fontSize: 16 },
  detail: {
    color: colors.muted,
    marginBottom: 6,
    fontFamily: "PoppinsRegular",
  },
  input: {
    backgroundColor: colors.card,
    color: colors.text,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    fontFamily: "PoppinsRegular",
  },
  label: {
    fontFamily: "PoppinsBold",
    color: colors.textSecondary,
    marginBottom: 4,
  },
  pickerWrapper: {
    backgroundColor: colors.card,
    borderRadius: 8,
    marginBottom: 12,
  },
  picker: { color: colors.text },
  saveButton: {
    backgroundColor: colors.accent,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  saveText: {
    color: colors.background,
    fontFamily: "PoppinsBold",
    fontSize: 16,
  },
  row: { flexDirection: "row", justifyContent: "space-between", marginTop: 20 },
  button: {
    flex: 1,
    backgroundColor: colors.accent,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 4,
  },
  buttonText: { color: colors.text, fontFamily: "PoppinsBold" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  error: { color: colors.danger, fontSize: 16 },
});
