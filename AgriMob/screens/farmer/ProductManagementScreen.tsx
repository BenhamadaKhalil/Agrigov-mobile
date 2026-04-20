// screens/farmer/ProductManagementScreen.tsx

import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { farmerApi } from "../../apis/farmer.api";

// ─── types ────────────────────────────────────────────────────────────────────

type FilterKey = "all" | "active" | "out_of_stock" | "draft";

export interface FarmerProduct {
  id: number;
  name: string;
  category: string;
  variety: string;
  quantity_kg: number;
  unit: string;
  price_per_unit: number;
  market_price: number;
  status: "active" | "out_of_stock" | "draft";
  is_visible: boolean;
  emoji?: string;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  active:        { label: "Active",        bg: "#d1fae5", text: "#047857" },
  out_of_stock:  { label: "Out of Stock",  bg: "#f3f4f6", text: "#6b7280" },
  draft:         { label: "Draft",         bg: "#fef3c7", text: "#92400e" },
};

const FILTER_QS: Record<FilterKey, string> = {
  all:          "",
  active:       "status=active",
  out_of_stock: "status=out_of_stock",
  draft:        "status=draft",
};

const EMOJI_MAP: Record<string, string> = {
  Grains: "🌾", Vegetables: "🥬", Fruits: "🍎",
  Legumes: "🫘", Dairy: "🥛", Default: "📦",
};

function productEmoji(p: FarmerProduct) {
  return p.emoji ?? EMOJI_MAP[p.category] ?? EMOJI_MAP.Default;
}

// ─── product card ─────────────────────────────────────────────────────────────

const ProductCard = ({
  item,
  onEdit,
  onToggleVisibility,
  onDelete,
}: {
  item: FarmerProduct;
  onEdit: (id: number) => void;
  onToggleVisibility: (id: number, current: boolean) => void;
  onDelete: (id: number, name: string) => void;
}) => {
  const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.draft;
  const aboveMarket = item.price_per_unit > item.market_price;

  return (
    <View style={[styles.card, !item.is_visible && styles.cardHidden]}>
      {/* EMOJI */}
      <View style={styles.emojiBox}>
        <Text style={styles.emoji}>{productEmoji(item)}</Text>
        {!item.is_visible && (
          <View style={styles.hiddenOverlay}>
            <MaterialIcons name="visibility-off" size={18} color="#fff" />
          </View>
        )}
      </View>

      {/* INFO */}
      <View style={styles.info}>
        <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.productType}>
          {item.category} · {item.variety}
        </Text>
        <Text style={styles.meta}>
          {item.quantity_kg} {item.unit}
        </Text>
        <View style={styles.priceRow}>
          <Text style={styles.meta}>
            ${item.price_per_unit.toFixed(2)}/{item.unit}
          </Text>
          {aboveMarket && (
            <MaterialIcons name="trending-up" size={11} color="#047857" />
          )}
          <Text style={[styles.meta, { color: "#9ca3af" }]}>
            Mkt ${item.market_price.toFixed(2)}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
          <Text style={[styles.statusText, { color: cfg.text }]}>
            {cfg.label}
          </Text>
        </View>
      </View>

      {/* ACTIONS */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => onEdit(item.id)}
        >
          <MaterialIcons name="edit" size={15} color="#047857" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => onToggleVisibility(item.id, item.is_visible)}
        >
          <MaterialIcons
            name={item.is_visible ? "visibility-off" : "visibility"}
            size={15}
            color="#9ca3af"
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.iconBtn, styles.deleteBtn]}
          onPress={() => onDelete(item.id, item.name)}
        >
          <MaterialIcons name="delete-outline" size={15} color="#b91c1c" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── main ─────────────────────────────────────────────────────────────────────

export default function ProductManagementScreen() {
  const navigation = useNavigation<any>();

  const [products, setProducts]   = useState<FarmerProduct[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [error, setError]         = useState<string | null>(null);

  const filters: Array<{ key: FilterKey; label: string }> = [
    { key: "all",          label: "All" },
    { key: "active",       label: "Active" },
    { key: "out_of_stock", label: "Out of Stock" },
    { key: "draft",        label: "Draft" },
  ];

  const fetchProducts = useCallback(async (filter: FilterKey = activeFilter) => {
    try {
      setError(null);
      const data: any = await farmerApi.myProducts(FILTER_QS[filter]);
      const rawProducts = Array.isArray(data) ? data : (data?.results || []);
      const mapped = rawProducts.map((p: any) => ({
        id: p.id,
        name: p.ministry_product?.name || p.description || "Unknown",
        category: p.category_name || "Unknown",
        quantity_kg: p.stock || 0,
        unit: "kg",
        price_per_unit: parseFloat(p.unit_price || "0"),
        status: p.in_stock ? "active" : "out_of_stock",
        is_visible: true, // Backend doesn't have is_visible, fallback to true
      }));
      setProducts(mapped);
    } catch {
      setError("Could not load products.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    setLoading(true);
    fetchProducts(activeFilter);
  }, [activeFilter]);

  const onRefresh = () => { setRefreshing(true); fetchProducts(); };

  const handleToggleVisibility = async (id: number, current: boolean) => {
    // Optimistic update
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_visible: !current } : p))
    );
    try {
      const fd = new FormData();
      fd.append("is_visible", String(!current));
      await farmerApi.updateProduct(id, fd);
    } catch {
      // Revert on failure
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, is_visible: current } : p))
      );
      Alert.alert("Error", "Could not update visibility.");
    }
  };

  const handleDelete = (id: number, name: string) => {
    Alert.alert(
      "Delete Product",
      `Are you sure you want to delete "${name}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            // Optimistic remove
            setProducts((prev) => prev.filter((p) => p.id !== id));
            try {
              await farmerApi.deleteProduct(id);
            } catch {
              Alert.alert("Error", "Could not delete product.");
              fetchProducts();
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* ── HERO ── */}
      <View style={styles.hero}>
        <View style={styles.heroTopRow}>
          <View>
            <Text style={styles.heroLabel}>DIGITAL HARVEST</Text>
            <Text style={styles.heroTitle}>Products</Text>
            <Text style={styles.heroSub}>
              {products.length} listing{products.length !== 1 ? "s" : ""} · Manage catalog
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate("AddProduct")}
          >
            <MaterialIcons name="add" size={18} color="#065f46" />
            <Text style={styles.addBtnText}>Add Listing</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── FILTERS ── */}
      <View style={styles.filterBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          {filters.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[
                styles.filterChip,
                activeFilter === f.key && styles.filterChipActive,
              ]}
              onPress={() => setActiveFilter(f.key)}
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter === f.key && styles.filterTextActive,
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── LIST ── */}
      {loading ? (
        <View style={styles.centerLoad}>
          <ActivityIndicator color="#047857" />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => String(item.id)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#047857" />
          }
          renderItem={({ item }) => (
            <ProductCard
              item={item}
              onEdit={(id) => navigation.navigate("EditProduct", { productId: id })}
              onToggleVisibility={handleToggleVisibility}
              onDelete={handleDelete}
            />
          )}
          ListHeaderComponent={
            error ? (
              <View style={styles.errorBanner}>
                <MaterialIcons name="wifi-off" size={14} color="#b91c1c" />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity onPress={() => fetchProducts()}>
                  <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialIcons name="inventory-2" size={36} color="#d1d5db" />
              <Text style={styles.emptyTitle}>No products found</Text>
              <Text style={styles.emptySub}>
                {activeFilter === "all"
                  ? "Tap Add Listing to create your first product"
                  : "No products in this category"}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f5f8f5" },

  hero: {
    backgroundColor: "#047857",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  heroLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#a7f3d0",
    letterSpacing: 1,
    marginBottom: 2,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.4,
  },
  heroSub: { fontSize: 12, color: "#a7f3d0", marginTop: 2 },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#0df20d",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  addBtnText: { fontSize: 12, fontWeight: "800", color: "#065f46" },

  filterBar: {
    backgroundColor: "#fff",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e4efe4",
  },
  filterContent: { padding: 10, gap: 7 },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#f5f8f5",
    borderWidth: 0.5,
    borderColor: "#e4efe4",
  },
  filterChipActive: { backgroundColor: "#047857", borderColor: "#047857" },
  filterText:       { fontSize: 12, fontWeight: "700", color: "#6b7280" },
  filterTextActive: { color: "#fff" },

  centerLoad: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 60 },
  listContent: { padding: 14, paddingBottom: 30 },

  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fee2e2",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  errorText: { flex: 1, fontSize: 12, color: "#b91c1c" },
  retryText:  { fontSize: 12, fontWeight: "700", color: "#047857" },

  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: "#e4efe4",
  },
  cardHidden: { opacity: 0.55 },

  emojiBox: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: "#f0faf0",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    position: "relative",
  },
  emoji: { fontSize: 24 },
  hiddenOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  info: { flex: 1, minWidth: 0 },
  productName: { fontSize: 13, fontWeight: "700", color: "#1a2e1a" },
  productType: { fontSize: 10, color: "#9ca3af", marginTop: 1, marginBottom: 3 },
  meta: { fontSize: 11, color: "#6b7280" },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 1 },
  statusBadge: {
    alignSelf: "flex-start",
    borderRadius: 20,
    paddingVertical: 2,
    paddingHorizontal: 9,
    marginTop: 5,
  },
  statusText: { fontSize: 9, fontWeight: "700" },

  actions: { gap: 6, alignItems: "center" },
  iconBtn: {
    width: 30,
    height: 30,
    backgroundColor: "#f5f8f5",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtn: { backgroundColor: "#fee2e2" },

  emptyState: { alignItems: "center", paddingVertical: 50, gap: 8 },
  emptyTitle: { fontSize: 14, fontWeight: "700", color: "#9ca3af" },
  emptySub:   { fontSize: 12, color: "#c4c4c4", textAlign: "center", paddingHorizontal: 30 },
});