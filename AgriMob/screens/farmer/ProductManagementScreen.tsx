import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

type ProductStatus = "Active" | "Out of Stock" | "Draft";

interface Product {
  id: string;
  name: string;
  type: string;
  variety: string;
  quantity: string;
  price: string;
  marketPrice: string;
  status: ProductStatus;
  emoji: string;
}

const statusConfig: Record<ProductStatus, { bg: string; text: string }> = {
  Active:        { bg: "#d1fae5", text: "#047857" },
  "Out of Stock":{ bg: "#f3f4f6", text: "#6b7280" },
  Draft:         { bg: "#fff3e0", text: "#c05c00" },
};

const products: Product[] = [
  {
    id: "1",
    name: "Roma Tomatoes",
    type: "Vegetable",
    variety: "Heirloom Roma",
    quantity: "500 kg",
    price: "$2.20/kg",
    marketPrice: "$2.00",
    status: "Active",
    emoji: "🍅",
  },
  {
    id: "2",
    name: "Honey Corn",
    type: "Grain",
    variety: "Extra Sweet",
    quantity: "1200 units",
    price: "$0.45/unit",
    marketPrice: "$0.50",
    status: "Active",
    emoji: "🌽",
  },
  {
    id: "3",
    name: "California Peppers",
    type: "Vegetable",
    variety: "Bell Pepper",
    quantity: "0 kg",
    price: "$3.50/kg",
    marketPrice: "$3.50",
    status: "Out of Stock",
    emoji: "🫑",
  },
];

const filters: Array<"All" | ProductStatus> = [
  "All",
  "Active",
  "Out of Stock",
  "Draft",
];

export default function ProductManagementScreen() {
  const [activeFilter, setActiveFilter] = useState<"All" | ProductStatus>("All");

  const filtered =
    activeFilter === "All"
      ? products
      : products.filter((p) => p.status === activeFilter);

  const renderItem = ({ item }: { item: Product }) => {
    const cfg = statusConfig[item.status];
    const aboveMarket = parseFloat(item.price) > parseFloat(item.marketPrice);

    return (
      <View style={styles.card}>
        {/* EMOJI ICON */}
        <View style={styles.emojiBox}>
          <Text style={styles.emoji}>{item.emoji}</Text>
        </View>

        {/* INFO */}
        <View style={styles.info}>
          <Text style={styles.productName}>{item.name}</Text>
          <Text style={styles.productType}>{item.type} · {item.variety}</Text>

          <Text style={styles.meta}>Qty: {item.quantity}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.meta}>
              {item.price}
            </Text>
            {aboveMarket && (
              <MaterialIcons name="arrow-upward" size={12} color="#047857" />
            )}
            <Text style={[styles.meta, { color: "#9ca3af" }]}>
              Mkt {item.marketPrice}
            </Text>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
            <Text style={[styles.statusText, { color: cfg.text }]}>
              {item.status}
            </Text>
          </View>
        </View>

        {/* ACTIONS */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.iconBtn}>
            <MaterialIcons name="edit" size={16} color="#047857" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <MaterialIcons name="visibility-off" size={16} color="#9ca3af" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Products</Text>
          <Text style={styles.headerSub}>{products.length} listings</Text>
        </View>
        <TouchableOpacity style={styles.addButton}>
          <MaterialIcons name="add" size={18} color="#065f46" />
          <Text style={styles.addText}>Add Listing</Text>
        </TouchableOpacity>
      </View>

      {/* FILTER CHIPS */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        {filters.map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterChip,
              activeFilter === f && styles.filterChipActive,
            ]}
            onPress={() => setActiveFilter(f)}
          >
            <Text
              style={[
                styles.filterText,
                activeFilter === f && styles.filterTextActive,
              ]}
            >
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* LIST */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No products in this category.</Text>
          </View>
        }
      />
    </View>
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
    marginBottom: 14,
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1a2e1a",
    letterSpacing: -0.5,
  },

  headerSub: {
    fontSize: 13,
    color: "#9ca3af",
    marginTop: 1,
  },

  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#0df20d",
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 12,
  },

  addText: {
    fontWeight: "700",
    color: "#065f46",
    fontSize: 13,
  },

  filterScroll: {
    marginBottom: 14,
  },

  filterContent: {
    gap: 8,
    paddingRight: 4,
  },

  filterChip: {
    backgroundColor: "#fff",
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: "#e4efe4",
  },

  filterChipActive: {
    backgroundColor: "#047857",
    borderColor: "#047857",
  },

  filterText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
  },

  filterTextActive: {
    color: "#fff",
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: "#e4efe4",
  },

  emojiBox: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: "#f0faf0",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  emoji: {
    fontSize: 26,
  },

  info: {
    flex: 1,
    minWidth: 0,
  },

  productName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1a2e1a",
  },

  productType: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 1,
    marginBottom: 4,
  },

  meta: {
    fontSize: 11,
    color: "#6b7280",
  },

  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 1,
  },

  statusBadge: {
    alignSelf: "flex-start",
    borderRadius: 20,
    paddingVertical: 3,
    paddingHorizontal: 10,
    marginTop: 6,
  },

  statusText: {
    fontSize: 10,
    fontWeight: "700",
  },

  actions: {
    gap: 8,
    alignItems: "center",
  },

  iconBtn: {
    width: 32,
    height: 32,
    backgroundColor: "#f5f8f5",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  empty: {
    alignItems: "center",
    paddingVertical: 40,
  },

  emptyText: {
    fontSize: 14,
    color: "#9ca3af",
  },
});