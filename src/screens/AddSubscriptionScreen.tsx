import { Picker } from "@react-native-picker/picker";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as React from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { categories } from "../constants/categories";
import { getIconKeyForName } from "../constants/icons";
import { addSubscription } from "../db/repositories/subscriptions.repo";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors } from "../theme/colors";
import { calculateNextPayment } from "../utils/dateHelpers";

type Props = NativeStackScreenProps<RootStackParamList, "AddSubscription">;

export default function AddSubscriptionScreen({ navigation }: Props) {
  const [name, setName] = React.useState("");
  const [price, setPrice] = React.useState("");
  const [category, setCategory] = React.useState("Other");
  const [billingCycle, setBillingCycle] = React.useState("monthly");
  const [startDate, setStartDate] = React.useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = React.useState(false);

  const handleSave = async () => {
    if (!name || !price) {
      Alert.alert("Validation", "Please enter name and price");
      return;
    }

    try {
      await addSubscription({
        name,
        iconKey: getIconKeyForName(name),
        price: parseFloat(price),
        currency: "USD",
        category,
        billingCycle: billingCycle as any,
        startDate: startDate || new Date().toISOString(),
        nextPaymentDate: calculateNextPayment(
          startDate || new Date().toISOString(),
          billingCycle
        ),
        notes: "",
      });

      navigation.goBack();
    } catch (err) {
      console.error("Failed to add subscription:", err);
      Alert.alert("Error", "Could not save subscription");
    }
  };

  const handleDateConfirm = (date: Date) => {
    setStartDate(date.toISOString());
    setShowDatePicker(false);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <Text style={styles.title}>Add New Subscription</Text>

      <TextInput
        style={styles.input}
        placeholder="Name (e.g. Netflix)"
        placeholderTextColor="#aaa"
        value={name}
        onChangeText={setName}
      />

      <TextInput
        style={styles.input}
        placeholder="Price"
        placeholderTextColor="#aaa"
        keyboardType="numeric"
        value={price}
        onChangeText={setPrice}
      />

      <Text style={styles.label}>Category</Text>
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={category}
          onValueChange={(value) => setCategory(value)}
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
          selectedValue={billingCycle}
          onValueChange={(value) => setBillingCycle(value)}
          style={styles.picker}
        >
          <Picker.Item label="Monthly" value="monthly" />
          <Picker.Item label="Yearly" value="yearly" />
          <Picker.Item label="Weekly" value="weekly" />
          <Picker.Item label="Custom" value="custom" />
        </Picker>
      </View>

      <Text style={styles.label}>Start Date</Text>
      <Pressable onPress={() => setShowDatePicker(true)} style={styles.input}>
        <Text style={{ color: colors.text }}>
          {startDate ? new Date(startDate).toDateString() : "Pick a date"}
        </Text>
      </Pressable>

      <DateTimePickerModal
        isVisible={showDatePicker}
        mode="date"
        date={startDate ? new Date(startDate) : new Date()}
        onConfirm={handleDateConfirm}
        onCancel={() => setShowDatePicker(false)}
      />

      <Pressable style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveText}>Save</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 20 },
  title: {
    fontSize: 22,
    fontFamily: "PoppinsBold",
    color: colors.text,
    marginBottom: 20,
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
});
