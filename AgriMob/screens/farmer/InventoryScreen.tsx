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

const products = [
  {
    id: "1",
    name: "Russet Potatoes",
    quantity: "1200 kg",
    price: "$0.85/kg",
    status: "In Stock",
    emoji: "🥔",
  },
  {
    id: "2",
    name: "Iceberg Lettuce",
    quantity: "150 heads",
    price: "$1.20/unit",
    status: "Low Stock",
    emoji: "🥬",
  },
  {
    id: "3",
    name: "Sweet Corn",
    quantity: "5.5 Tons",
    price: "$190/ton",
    status: "In Stock",
    emoji: "🌽",
  },
];

const stats = [
  { label: "Revenue", value: "$12,450" },
  { label: "Stock", value: "45.2 T" },
  { label: "Pending", value: "3 Orders" },
];

export default function InventoryScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<InventoryStackParamList>>();
  const [search, setSearch] = useState("");

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Inventory</Text>
          <Text style={styles.subtitle}>Track your stock & manage harvests</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate("AddProduct")}
        >
          <MaterialIcons name="add" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* STATS */}
      <View style={styles.statsRow}>
        {stats.map((s, i) => (
          <View key={i} style={styles.statCard}>
            <Text style={styles.statLabel}>{s.label}</Text>
            <Text style={styles.statValue}>{s.value}</Text>
          </View>
        ))}
      </View>

      {/* SEARCH */}
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={18} color="#9ca3af" />
        <TextInput
          placeholder="Search products…"
          placeholderTextColor="#9ca3af"
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <MaterialIcons name="close" size={16} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>

      {/* PRODUCT GRID */}
      <View style={styles.grid}>
        {filtered.map((item) => (
          <View key={item.id} style={styles.productCard}>
            <View style={styles.emojiBox}>
              <Text style={styles.emoji}>{item.emoji}</Text>
            </View>

            <View style={styles.productInfo}>
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.productMeta}>{item.quantity}</Text>
              <Text style={styles.productMeta}>{item.price}</Text>

              <View
                style={[
                  styles.statusBadge,
                  item.status === "Low Stock"
                    ? styles.badgeOrange
                    : styles.badgeGreen,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    item.status === "Low Stock"
                      ? styles.textOrange
                      : styles.textGreen,
                  ]}
                >
                  {item.status}
                </Text>
              </View>

              <TouchableOpacity style={styles.editBtn}>
                <Text style={styles.editText}>Edit</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* ADD PLACEHOLDER */}
        <TouchableOpacity
          style={styles.addCard}
          onPress={() => navigation.navigate("AddProduct")}
        >
          <MaterialIcons name="add-circle-outline" size={32} color="#0df20d" />
          <Text style={styles.addCardText}>Add Product</Text>
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
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },

  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1a2e1a",
    letterSpacing: -0.5,
  },

  subtitle: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
  },

  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#047857",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
  },

  addButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },

  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },

  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: "#e4efe4",
  },

  statLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginBottom: 4,
  },

  statValue: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1a2e1a",
    letterSpacing: -0.3,
  },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    padding: 11,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 0.5,
    borderColor: "#e4efe4",
  },

  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#1a2e1a",
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  productCard: {
    width: "47.5%",
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: "#e4efe4",
  },

  emojiBox: {
    backgroundColor: "#f0faf0",
    height: 100,
    alignItems: "center",
    justifyContent: "center",
  },

  emoji: {
    fontSize: 40,
  },

  productInfo: {
    padding: 10,
  },

  productName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1a2e1a",
    marginBottom: 3,
  },

  productMeta: {
    fontSize: 11,
    color: "#6b7280",
    lineHeight: 16,
  },

  statusBadge: {
    alignSelf: "flex-start",
    borderRadius: 20,
    paddingVertical: 3,
    paddingHorizontal: 8,
    marginTop: 6,
  },

  badgeGreen: {
    backgroundColor: "#d1fae5",
  },

  badgeOrange: {
    backgroundColor: "#fff3cd",
  },

  statusText: {
    fontSize: 10,
    fontWeight: "700",
  },

  textGreen: {
    color: "#047857",
  },

  textOrange: {
    color: "#c05c00",
  },

  editBtn: {
    marginTop: 8,
    backgroundColor: "#0df20d",
    paddingVertical: 7,
    borderRadius: 10,
    alignItems: "center",
  },

  editText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#065f46",
  },

  addCard: {
    width: "47.5%",
    backgroundColor: "#f9fdf9",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#c6e8c6",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 180,
    gap: 8,
  },

  addCardText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
  },
});