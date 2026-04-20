// screens/farmer/InventoryScreen.tsx

import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { InventoryStackParamList } from "../../navigation/FarmerTabNavigator";
import { farmerApi } from "../../apis/farmer.api";

// ─── types ────────────────────────────────────────────────────────────────────

export interface InventoryProduct {
  id: number;
  name: string;
  category: string;
  quantity_kg: number;
  unit: string;
  price_per_unit: number;
  status: "in_stock" | "low_stock" | "out_of_stock";
  emoji?: string;
}

interface InventorySummary {
  total_revenue: number;
  total_stock_tons: number;
  pending_orders: number;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

const EMOJI_MAP: Record<string, string> = {
  Grains: "🌾", Vegetables: "🥬", Fruits: "🍎",
  Legumes: "🫘", Dairy: "🥛", Default: "📦",
};

function productEmoji(p: InventoryProduct): string {
  return p.emoji ?? EMOJI_MAP[p.category] ?? EMOJI_MAP.Default;
}

function statusBadge(status: InventoryProduct["status"]) {
  if (status === "in_stock")    return { label: "In Stock",  bg: "#d1fae5", text: "#047857" };
  if (status === "low_stock")   return { label: "Low Stock", bg: "#fef3c7", text: "#92400e" };
  return                               { label: "Out",       bg: "#f3f4f6", text: "#6b7280" };
}

// ─── product card ─────────────────────────────────────────────────────────────

const ProductCard = ({
  item,
  onEdit,
}: {
  item: InventoryProduct;
  onEdit: (id: number) => void;
}) => {
  const badge = statusBadge(item.status);
  return (
    <View style={styles.productCard}>
      <View style={styles.emojiBox}>
        <Text style={styles.emoji}>{productEmoji(item)}</Text>
      </View>
      <View style={styles.productBody}>
        <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.productMeta}>
          {item.quantity_kg} {item.unit}
        </Text>
        <Text style={styles.productMeta}>
          ${item.price_per_unit.toFixed(2)}/{item.unit}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
          <Text style={[styles.statusText, { color: badge.text }]}>
            {badge.label}
          </Text>
        </View>
        <TouchableOpacity style={styles.editBtn} onPress={() => onEdit(item.id)}>
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── main ─────────────────────────────────────────────────────────────────────

export default function InventoryScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<InventoryStackParamList>>();

  const [products, setProducts]   = useState<InventoryProduct[]>([]);
  const [summary, setSummary]     = useState<InventorySummary | null>(null);
  const [search, setSearch]       = useState("");
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const fetchInventory = useCallback(async () => {
    try {
      setError(null);
      const data: any = await farmerApi.inventory();
      const rawProducts = Array.isArray(data) ? data : (data?.results || []);
      const mapped = rawProducts.map((p: any) => ({
        id: p.id,
        name: p.ministry_product?.name || "Unknown Product",
        category: p.category_name || "Unknown",
        quantity_kg: p.stock || 0,
        unit: "kg",
        price_per_unit: parseFloat(p.unit_price || "0"),
        status: p.in_stock ? "in_stock" : "out_of_stock",
      }));
      setProducts(mapped);
      if (data?.summary) setSummary(data.summary);
    } catch {
      setError("Could not load inventory.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  const onRefresh = () => { setRefreshing(true); fetchInventory(); };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const statsData = [
    {
      label: "Revenue",
      value: summary
        ? `$${(summary.total_revenue / 1000).toFixed(1)}k`
        : "—",
    },
    {
      label: "Stock",
      value: summary ? `${summary.total_stock_tons.toFixed(1)} T` : "—",
    },
    {
      label: "Pending",
      value: summary ? `${summary.pending_orders} Orders` : "—",
    },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* ── HERO ── */}
      <View style={styles.hero}>
        <View style={styles.heroTopRow}>
          <View>
            <Text style={styles.heroLabel}>DIGITAL HARVEST</Text>
            <Text style={styles.heroTitle}>Inventory</Text>
            <Text style={styles.heroSub}>Track stock & manage harvests</Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate("AddProduct")}
          >
            <MaterialIcons name="add" size={18} color="#065f46" />
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>

        {/* STATS */}
        <View style={styles.statsRow}>
          {statsData.map((s) => (
            <View key={s.label} style={styles.statBox}>
              <Text style={styles.statLabel}>{s.label}</Text>
              <Text style={styles.statVal}>{s.value}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── BODY ── */}
      <View style={styles.body}>
        {/* SEARCH */}
        <View style={styles.searchBox}>
          <MaterialIcons name="search" size={17} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products…"
            placeholderTextColor="#c4c4c4"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <MaterialIcons name="close" size={15} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>

        {/* ERROR */}
        {error && (
          <View style={styles.errorBanner}>
            <MaterialIcons name="wifi-off" size={14} color="#b91c1c" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={fetchInventory}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* LIST */}
        {loading ? (
          <View style={styles.centerLoad}>
            <ActivityIndicator color="#047857" />
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => String(item.id)}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.gridContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#047857" />
            }
            renderItem={({ item }) => (
              <ProductCard
                item={item}
                onEdit={(id) =>
                  navigation.navigate("EditProduct", { productId: id })
                }
              />
            )}
            ListFooterComponent={
              <TouchableOpacity
                style={styles.addCard}
                onPress={() => navigation.navigate("AddProduct")}
              >
                <MaterialIcons name="add-circle-outline" size={30} color="#0df20d" />
                <Text style={styles.addCardText}>Add Product</Text>
              </TouchableOpacity>
            }
            ListEmptyComponent={
              !loading ? (
                <View style={styles.emptyState}>
                  <MaterialIcons name="inventory-2" size={36} color="#d1d5db" />
                  <Text style={styles.emptyTitle}>
                    {search ? "No results" : "No products yet"}
                  </Text>
                  <Text style={styles.emptySub}>
                    {search
                      ? "Try different keywords"
                      : "Tap Add to list your first product"}
                  </Text>
                </View>
              ) : null
            }
          />
        )}
      </View>
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
    marginBottom: 14,
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
    paddingHorizontal: 14,
  },
  addBtnText: { fontSize: 13, fontWeight: "800", color: "#065f46" },

  statsRow: {
    flexDirection: "row",
    gap: 7,
  },
  statBox: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    padding: 10,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#a7f3d0",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  statVal: { fontSize: 15, fontWeight: "800", color: "#fff", letterSpacing: -0.3 },

  body: { flex: 1, paddingHorizontal: 14, paddingTop: 14 },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 0.5,
    borderColor: "#e4efe4",
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 13, color: "#1a2e1a" },

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

  centerLoad: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 60 },

  gridContent:   { paddingBottom: 30 },
  columnWrapper: { gap: 10, marginBottom: 10 },

  productCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: "#e4efe4",
  },
  emojiBox: {
    backgroundColor: "#f0faf0",
    height: 90,
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: { fontSize: 36 },
  productBody: { padding: 10 },
  productName: { fontSize: 12, fontWeight: "700", color: "#1a2e1a", marginBottom: 2 },
  productMeta: { fontSize: 10, color: "#9ca3af", lineHeight: 15 },

  statusBadge: {
    alignSelf: "flex-start",
    borderRadius: 20,
    paddingVertical: 2,
    paddingHorizontal: 8,
    marginTop: 5,
  },
  statusText: { fontSize: 9, fontWeight: "700" },

  editBtn: {
    marginTop: 7,
    backgroundColor: "#0df20d",
    paddingVertical: 6,
    borderRadius: 9,
    alignItems: "center",
  },
  editText: { fontSize: 11, fontWeight: "800", color: "#065f46" },

  addCard: {
    backgroundColor: "#f9fdf9",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#c6e8c6",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 160,
    gap: 7,
    marginBottom: 10,
  },
  addCardText: { fontSize: 12, fontWeight: "600", color: "#9ca3af" },

  emptyState: { alignItems: "center", paddingVertical: 40, gap: 6 },
  emptyTitle: { fontSize: 14, fontWeight: "700", color: "#9ca3af" },
  emptySub:   { fontSize: 12, color: "#c4c4c4", textAlign: "center" },
});