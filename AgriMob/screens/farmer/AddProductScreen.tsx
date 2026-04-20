import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { InventoryStackParamList } from "../../navigation/FarmerTabNavigator";

const TOTAL_STEPS = 4;
const CURRENT_STEP = 2;

const storageOptions = ["Cold", "Dry", "Ambient"];
const categoryOptions = ["Grains", "Vegetables", "Fruits", "Legumes", "Dairy"];

export default function AddProductScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<InventoryStackParamList>>();

  const [form, setForm] = useState({
    category: "Grains",
    variety: "",
    quantity: "",
    price: "",
    date: "",
    storage: "Cold",
  });

  const handleSave = () => {
    navigation.goBack();
  };

  const handlePublish = () => {
    navigation.goBack();
  };

  const progress = (CURRENT_STEP / TOTAL_STEPS) * 100;

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={20} color="#1a2e1a" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.title}>Add New Product</Text>
          <Text style={styles.subtitle}>
            Step {CURRENT_STEP} of {TOTAL_STEPS}
          </Text>
        </View>
        <Text style={styles.pctLabel}>{progress.toFixed(0)}%</Text>
      </View>

      {/* STEP PROGRESS */}
      <View style={styles.stepsRow}>
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.stepSeg,
              i < CURRENT_STEP ? styles.stepFilled : styles.stepEmpty,
            ]}
          />
        ))}
      </View>

      {/* FORM CARD */}
      <View style={styles.formCard}>
        {/* CATEGORY */}
        <Text style={styles.label}>Category</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.optionScroll}
          contentContainerStyle={{ gap: 8 }}
        >
          {categoryOptions.map((c) => (
            <TouchableOpacity
              key={c}
              style={[
                styles.optionChip,
                form.category === c && styles.optionChipActive,
              ]}
              onPress={() => setForm({ ...form, category: c })}
            >
              <Text
                style={[
                  styles.optionChipText,
                  form.category === c && styles.optionChipTextActive,
                ]}
              >
                {c}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* VARIETY */}
        <Text style={styles.label}>Variety / Grade</Text>
        <View style={styles.inputWrap}>
          <MaterialIcons name="eco" size={16} color="#9ca3af" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="e.g. Grade A"
            placeholderTextColor="#c4c4c4"
            onChangeText={(text) => setForm({ ...form, variety: text })}
            value={form.variety}
          />
        </View>

        {/* QUANTITY */}
        <Text style={styles.label}>Quantity (kg)</Text>
        <View style={styles.inputWrap}>
          <MaterialIcons name="scale" size={16} color="#9ca3af" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#c4c4c4"
            onChangeText={(text) => setForm({ ...form, quantity: text })}
            value={form.quantity}
          />
        </View>

        {/* PRICE */}
        <Text style={styles.label}>Price per kg</Text>
        <View style={styles.inputWrap}>
          <Text style={[styles.inputIcon, { fontSize: 14, color: "#9ca3af" }]}>$</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="0.00"
            placeholderTextColor="#c4c4c4"
            onChangeText={(text) => setForm({ ...form, price: text })}
            value={form.price}
          />
        </View>

        {/* HARVEST DATE */}
        <Text style={styles.label}>Harvest Date</Text>
        <View style={styles.inputWrap}>
          <MaterialIcons name="event" size={16} color="#9ca3af" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#c4c4c4"
            onChangeText={(text) => setForm({ ...form, date: text })}
            value={form.date}
          />
        </View>

        {/* STORAGE */}
        <Text style={styles.label}>Storage Type</Text>
        <View style={styles.storageRow}>
          {storageOptions.map((s) => (
            <TouchableOpacity
              key={s}
              style={[
                styles.storageChip,
                form.storage === s && styles.storageChipActive,
              ]}
              onPress={() => setForm({ ...form, storage: s })}
            >
              <Text
                style={[
                  styles.storageText,
                  form.storage === s && styles.storageTextActive,
                ]}
              >
                {s}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* IMAGE UPLOAD */}
        <TouchableOpacity style={styles.uploadBox}>
          <View style={styles.uploadIconCircle}>
            <MaterialIcons name="add-a-photo" size={22} color="#0df20d" />
          </View>
          <Text style={styles.uploadTitle}>Upload Images</Text>
          <Text style={styles.uploadSub}>Drag & drop or tap to browse</Text>
        </TouchableOpacity>

        {/* WARNING */}
        <View style={styles.warningBox}>
          <MaterialIcons name="info-outline" size={18} color="#c05c00" />
          <Text style={styles.warningText}>
            Price should be close to the official market price.
          </Text>
        </View>
      </View>

      {/* ACTION BUTTONS */}
      <View style={styles.buttons}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={handleSave}>
          <Text style={styles.secondaryText}>Save Draft</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.primaryBtn} onPress={handlePublish}>
          <Text style={styles.primaryText}>Publish</Text>
          <MaterialIcons name="arrow-forward" size={16} color="#065f46" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f8f5",
    padding: 16,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },

  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.5,
    borderColor: "#e4efe4",
  },

  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1a2e1a",
    letterSpacing: -0.3,
  },

  subtitle: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 1,
  },

  pctLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#047857",
  },

  stepsRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 18,
  },

  stepSeg: {
    flex: 1,
    height: 5,
    borderRadius: 10,
  },

  stepFilled: {
    backgroundColor: "#0df20d",
  },

  stepEmpty: {
    backgroundColor: "#e4efe4",
  },

  formCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,
    borderWidth: 0.5,
    borderColor: "#e4efe4",
    marginBottom: 14,
  },

  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
    marginTop: 14,
    marginBottom: 6,
    letterSpacing: 0.2,
  },

  optionScroll: {
    marginBottom: 2,
  },

  optionChip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: "#e4efe4",
    backgroundColor: "#f5f8f5",
  },

  optionChipActive: {
    backgroundColor: "#047857",
    borderColor: "#047857",
  },

  optionChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
  },

  optionChipTextActive: {
    color: "#fff",
  },

  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8faf8",
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: "#e4efe4",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },

  inputIcon: {
    marginRight: 2,
  },

  input: {
    flex: 1,
    fontSize: 14,
    color: "#1a2e1a",
  },

  storageRow: {
    flexDirection: "row",
    gap: 8,
  },

  storageChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: "#e4efe4",
    backgroundColor: "#f5f8f5",
    alignItems: "center",
  },

  storageChipActive: {
    backgroundColor: "#f0faf0",
    borderColor: "#047857",
  },

  storageText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
  },

  storageTextActive: {
    color: "#047857",
  },

  uploadBox: {
    marginTop: 18,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#0df20d",
    borderRadius: 14,
    padding: 24,
    alignItems: "center",
    backgroundColor: "#f9fff9",
  },

  uploadIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#e6ffe6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },

  uploadTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1a2e1a",
  },

  uploadSub: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 2,
  },

  warningBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#fff8e1",
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
    borderWidth: 0.5,
    borderColor: "#fde68a",
  },

  warningText: {
    flex: 1,
    fontSize: 12,
    color: "#854d0e",
    lineHeight: 18,
  },

  buttons: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 40,
  },

  primaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#0df20d",
    paddingVertical: 14,
    borderRadius: 14,
  },

  primaryText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#065f46",
  },

  secondaryBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: "#e4efe4",
  },

  secondaryText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
  },
});