// screens/farmer/LogisticsScreen.tsx

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { orderApi } from "../../apis/order.api";

// ─── types ────────────────────────────────────────────────────────────────────

type OrderStatus = "pending" | "confirmed" | "loaded" | "shipped" | "delivered" | "cancelled";

interface Order {
  id: number;
  order_number: string;
  buyer_name: string;
  product_name: string;
  cargo_emoji?: string;
  quantity: string;
  transporter_name?: string;
  status: OrderStatus;
  created_at: string;
}

interface LogisticsSummary {
  ready_count:    number;
  transit_count:  number;
  delivered_count: number;
  on_time_pct:    number;
}

interface Pickup {
  id: string;
  date_display: string;
  transporter:  string;
  order_number: string;
  product:      string;
}

interface LiveTruck {
  truck_id:      string;
  distance_km:   number;
  eta_minutes:   number;
  progress_pct:  number;
}

// ─── mocked logistics data (until backend adds these endpoints) ───────────────
// Replace these with real API calls once the endpoints exist:
//   GET /api/farmer/logistics/summary/
//   GET /api/farmer/pickups/upcoming/
//   GET /api/farmer/trucks/live/

async function fetchLogisticsSummary(): Promise<LogisticsSummary> {
  // TODO: replace with apiFetch("/api/farmer/logistics/summary/")
  return { ready_count: 12, transit_count: 8, delivered_count: 24, on_time_pct: 98 };
}

async function fetchUpcomingPickups(): Promise<Pickup[]> {
  // TODO: replace with apiFetch("/api/farmer/pickups/upcoming/")
  return [
    { id: "1", date_display: "Oct\n24", transporter: "SwiftHaul Logistics", order_number: "#4022", product: "Corn" },
    { id: "2", date_display: "Oct\n25", transporter: "AgriTrans Co.",        order_number: "#4025", product: "Rice" },
  ];
}

async function fetchLiveTrucks(): Promise<LiveTruck[]> {
  // TODO: replace with apiFetch("/api/farmer/trucks/live/")
  return [
    { truck_id: "TRK-8921", distance_km: 20, eta_minutes: 45, progress_pct: 65 },
  ];
}

// ─── status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<OrderStatus, { label: string; bg: string; text: string }> = {
  pending:   { label: "Pending",   bg: "#fff3e0", text: "#c05c00" },
  confirmed: { label: "Confirmed", bg: "#dbeafe", text: "#1d4ed8" },
  loaded:    { label: "Loaded",    bg: "#e3f0ff", text: "#1a5fa8" },
  shipped:   { label: "Shipped",   bg: "#f0ecff", text: "#6336c7" },
  delivered: { label: "Delivered", bg: "#d1fae5", text: "#047857" },
  cancelled: { label: "Cancelled", bg: "#fee2e2", text: "#b91c1c" },
};

const EMOJI_MAP: Partial<Record<string, string>> = {
  Corn: "🌽", Wheat: "🌾", Tomatoes: "🍅", Rice: "🍚",
  Soybeans: "🫘", Potatoes: "🥔", Lettuce: "🥬",
};

// ─── live dot ────────────────────────────────────────────────────────────────

const LiveDot = () => {
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(opacity, { toValue: 1,   duration: 800, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ])
    ).start();
  }, [opacity]);
  return <Animated.View style={[styles.liveDot, { opacity }]} />;
};

// ─── stat card ───────────────────────────────────────────────────────────────

const StatBox = ({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
  label: string;
  value: string;
  highlight?: boolean;
}) => (
  <View style={styles.statBox}>
    <View style={[styles.statIconWrap, highlight && styles.statIconHighlight]}>
      <MaterialIcons name={icon} size={16} color={highlight ? "#047857" : "#0df20d"} />
    </View>
    <Text style={styles.statVal}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

// ─── main ─────────────────────────────────────────────────────────────────────

export default function LogisticsScreen() {
  const [orders, setOrders]     = useState<Order[]>([]);
  const [summary, setSummary]   = useState<LogisticsSummary | null>(null);
  const [pickups, setPickups]   = useState<Pickup[]>([]);
  const [trucks, setTrucks]     = useState<LiveTruck[]>([]);
  const [search, setSearch]     = useState("");
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      setError(null);
      const [ordersData, sum, piks, liveT]: [any, any, any, any] = await Promise.all([
        orderApi.myOrders(),
        fetchLogisticsSummary(),
        fetchUpcomingPickups(),
        fetchLiveTrucks(),
      ]);
      setOrders(ordersData?.results ?? ordersData ?? []);
      setSummary(sum);
      setPickups(piks);
      setTrucks(liveT);
    } catch {
      setError("Could not load logistics data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const onRefresh = () => { setRefreshing(true); fetchAll(); };

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase();
    return (
      o.order_number.toLowerCase().includes(q) ||
      o.buyer_name.toLowerCase().includes(q) ||
      o.product_name.toLowerCase().includes(q)
    );
  });

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* ── HERO ── */}
      <View style={styles.hero}>
        <View style={styles.heroTopRow}>
          <View>
            <Text style={styles.heroLabel}>DIGITAL HARVEST</Text>
            <Text style={styles.heroTitle}>Logistics</Text>
            <Text style={styles.heroSub}>Manage shipments and deliveries</Text>
          </View>
        </View>

        {/* STATS */}
        <View style={styles.statsGrid}>
          <StatBox icon="inventory"      label="Ready"    value={String(summary?.ready_count    ?? "—")} />
          <StatBox icon="local-shipping" label="Transit"  value={String(summary?.transit_count  ?? "—")} />
          <StatBox icon="check-circle"   label="Delivered" value={String(summary?.delivered_count ?? "—")} />
          <StatBox icon="trending-up"    label="On-Time"
            value={summary ? `${summary.on_time_pct}%` : "—"}
            highlight
          />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
        }
      >
        <View style={styles.body}>
          {/* SEARCH */}
          <View style={styles.searchBox}>
            <MaterialIcons name="search" size={17} color="#9ca3af" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search orders…"
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
              <TouchableOpacity onPress={fetchAll}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ORDERS */}
          <Text style={styles.sectionHead}>Active Orders</Text>
          {loading ? (
            <ActivityIndicator color="#047857" style={{ marginTop: 20 }} />
          ) : filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="local-shipping" size={32} color="#d1d5db" />
              <Text style={styles.emptyText}>No orders found</Text>
            </View>
          ) : (
            filtered.map((order) => {
              const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
              const emoji =
                order.cargo_emoji ??
                EMOJI_MAP[order.product_name] ??
                "📦";
              return (
                <View key={order.id} style={styles.orderCard}>
                  <View style={styles.orderHeader}>
                    <Text style={styles.orderId}>{order.order_number}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                      <Text style={[styles.statusText, { color: cfg.text }]}>
                        {cfg.label}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.orderBody}>
                    <View style={styles.emojiBox}>
                      <Text style={styles.emojiText}>{emoji}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.orderBuyer}>{order.buyer_name}</Text>
                      <Text style={styles.orderMeta}>
                        {order.product_name} · {order.quantity}
                      </Text>
                      {order.transporter_name && (
                        <Text style={styles.orderTransporter}>
                          🚚 {order.transporter_name}
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity style={styles.moreBtn}>
                      <MaterialIcons name="more-vert" size={17} color="#9ca3af" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}

          {/* UPCOMING PICKUPS */}
          {pickups.length > 0 && (
            <>
              <Text style={styles.sectionHead}>Upcoming Pickups</Text>
              <View style={styles.card}>
                {pickups.map((p, i) => (
                  <View
                    key={p.id}
                    style={[
                      styles.pickupRow,
                      i < pickups.length - 1 && styles.pickupBorder,
                    ]}
                  >
                    <View style={styles.dateBox}>
                      <Text style={styles.dateText}>{p.date_display}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.pickupTitle}>{p.transporter}</Text>
                      <Text style={styles.orderMeta}>
                        {p.order_number} · {p.product}
                      </Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={17} color="#d1d5db" />
                  </View>
                ))}
              </View>
            </>
          )}

          {/* LIVE TRACKING */}
          {trucks.length > 0 && (
            <>
              <Text style={styles.sectionHead}>Live Tracking</Text>
              {trucks.map((truck) => (
                <View key={truck.truck_id} style={styles.trackCard}>
                  <View style={styles.trackRow}>
                    <LiveDot />
                    <Text style={styles.trackTitle}>Truck {truck.truck_id}</Text>
                  </View>
                  <Text style={styles.trackSub}>
                    {truck.distance_km} km away · Arrival in {truck.eta_minutes} min
                  </Text>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${truck.progress_pct}%` as any },
                      ]}
                    />
                  </View>
                  <View style={styles.trackLabels}>
                    <Text style={styles.trackLabel}>Farm</Text>
                    <Text style={styles.trackLabel}>Destination</Text>
                  </View>
                </View>
              ))}
            </>
          )}

          <View style={{ height: 30 }} />
        </View>
      </ScrollView>
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
  heroTitle: { fontSize: 22, fontWeight: "800", color: "#fff", letterSpacing: -0.4 },
  heroSub:   { fontSize: 12, color: "#a7f3d0", marginTop: 2 },

  statsGrid: { flexDirection: "row", gap: 7 },
  statBox: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    padding: 10,
    alignItems: "flex-start",
  },
  statIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "rgba(13,242,13,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  statIconHighlight: { backgroundColor: "#a7f3d0" },
  statVal:   { fontSize: 17, fontWeight: "800", color: "#fff", letterSpacing: -0.3 },
  statLabel: { fontSize: 9, fontWeight: "700", color: "#a7f3d0", marginTop: 1 },

  body: { padding: 14 },

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
    marginBottom: 14,
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

  sectionHead: {
    fontSize: 9,
    fontWeight: "700",
    color: "#9ca3af",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 8,
    marginTop: 4,
  },

  orderCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 13,
    marginBottom: 9,
    borderWidth: 0.5,
    borderColor: "#e4efe4",
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 9,
  },
  orderId:  { fontSize: 11, fontWeight: "700", color: "#047857" },
  statusBadge: { borderRadius: 20, paddingVertical: 3, paddingHorizontal: 10 },
  statusText:  { fontSize: 10, fontWeight: "700" },

  orderBody: { flexDirection: "row", alignItems: "center", gap: 10 },
  emojiBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#f0faf0",
    alignItems: "center",
    justifyContent: "center",
  },
  emojiText:        { fontSize: 18 },
  orderBuyer:       { fontSize: 13, fontWeight: "700", color: "#1a2e1a" },
  orderMeta:        { fontSize: 11, color: "#9ca3af", marginTop: 1 },
  orderTransporter: { fontSize: 11, color: "#6b7280", marginTop: 2 },
  moreBtn:          { padding: 4 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 13,
    borderWidth: 0.5,
    borderColor: "#e4efe4",
    marginBottom: 12,
  },
  pickupRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  pickupBorder: { borderBottomWidth: 0.5, borderBottomColor: "#f3f4f6" },
  dateBox: {
    backgroundColor: "#0df20d",
    borderRadius: 9,
    paddingVertical: 5,
    paddingHorizontal: 9,
    alignItems: "center",
    minWidth: 44,
  },
  dateText:    { fontSize: 10, fontWeight: "800", color: "#065f46", textAlign: "center" },
  pickupTitle: { fontSize: 12, fontWeight: "700", color: "#1a2e1a" },

  trackCard: {
    backgroundColor: "#047857",
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
  },
  trackRow:  { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 3 },
  liveDot:   { width: 7, height: 7, borderRadius: 4, backgroundColor: "#0df20d" },
  trackTitle: { fontSize: 14, fontWeight: "700", color: "#fff" },
  trackSub:   { fontSize: 11, color: "#a7f3d0", marginBottom: 10 },

  progressTrack: {
    height: 5,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 10,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: "#0df20d", borderRadius: 10 },
  trackLabels: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  trackLabel:  { fontSize: 9, color: "#a7f3d0" },

  emptyState: { alignItems: "center", paddingVertical: 30, gap: 6 },
  emptyText:  { fontSize: 13, color: "#9ca3af" },
});