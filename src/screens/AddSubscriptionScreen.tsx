// src/screens/AddSubscriptionScreen.tsx
import type { RootStackParamList } from "@/navigation/RootNavigator";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as React from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type Props = NativeStackScreenProps<RootStackParamList, "AddSubscription">;

export default function AddSubscriptionScreen({ navigation }: Props) {
  const [name, setName] = React.useState("");
  const [price, setPrice] = React.useState("");
  const [category, setCategory] = React.useState("");

  const handleSave = () => {
    if (!name || !price) {
      Alert.alert("Validation", "Please enter name and price");
      return;
    }

    Alert.alert(
      "Saved!",
      `Name: ${name}\nPrice: $${price}\nCategory: ${category || "N/A"}`
    );
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
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

      <TextInput
        style={styles.input}
        placeholder="Category (e.g. Streaming)"
        placeholderTextColor="#aaa"
        value={category}
        onChangeText={setCategory}
      />

      <Pressable style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveText}>Save</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B132B", padding: 20 },
  title: { fontSize: 22, fontWeight: "700", color: "#FFF", marginBottom: 20 },
  input: {
    backgroundColor: "#1C2541",
    color: "#FFF",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  saveButton: {
    backgroundColor: "#5BC0BE",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  saveText: { color: "#0B132B", fontWeight: "700", fontSize: 16 },
});
