// screens/farmer/FarmerDashboard.tsx

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
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
import { orderApi } from "../../apis/order.api";
import { useAuth } from "../../context/AuthContext";

// ─── types ────────────────────────────────────────────────────────────────────

interface DashboardData {
  stats: {
    active_listings: number;
    monthly_revenue: number;
    pending_orders: number;
    harvest_goal_pct: number;
    harvest_logged_tons: number;
    harvest_goal_tons: number;
    rating: number;
    member_since_years: number;
  };
  weather: {
    temp_c: number;
    humidity_pct: number;
    rain_chance_pct: number;
    alert?: string;
    alert_detail?: string;
  };
  tasks: Array<{
    id: string;
    title: string;
    sub: string;
    done: boolean;
  }>;
}

interface RecentOrder {
  id: number;
  order_number: string;
  buyer_name: string;
  product_name: string;
  quantity: string;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
}

// ─── helpers ──────────────────────────────────────────────────────────────────

const ORDER_STATUS_CONFIG: Record<
  RecentOrder["status"],
  { label: string; bg: string; text: string }
> = {
  pending:   { label: "Pending",   bg: "#fef3c7", text: "#92400e" },
  confirmed: { label: "Confirmed", bg: "#dbeafe", text: "#1d4ed8" },
  shipped:   { label: "Shipped",   bg: "#f0ecff", text: "#6336c7" },
  delivered: { label: "Delivered", bg: "#d1fae5", text: "#047857" },
  cancelled: { label: "Cancelled", bg: "#fee2e2", text: "#b91c1c" },
};

// ─── sub-components ───────────────────────────────────────────────────────────

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

const HeroStat = ({
  value,
  label,
}: {
  value: string | number;
  label: string;
}) => (
  <View style={styles.heroStatBox}>
    <Text style={styles.heroStatVal}>{value}</Text>
    <Text style={styles.heroStatLbl}>{label}</Text>
  </View>
);

const TaskRow = ({
  title,
  sub,
  done,
  borderBottom,
}: {
  title: string;
  sub: string;
  done: boolean;
  borderBottom: boolean;
}) => (
  <View style={[styles.taskRow, borderBottom && styles.taskBorder]}>
    <View style={[styles.checkbox, done && styles.checkboxDone]}>
      {done && <MaterialIcons name="check" size={11} color="#fff" />}
    </View>
    <View style={{ flex: 1 }}>
      <Text style={[styles.taskTitle, done && styles.taskDone]}>{title}</Text>
      <Text style={styles.taskSub}>{sub}</Text>
    </View>
    <MaterialIcons name="chevron-right" size={18} color="#d1d5db" />
  </View>
);

// ─── main ─────────────────────────────────────────────────────────────────────

export default function FarmerDashboard() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [orders, setOrders]       = useState<RecentOrder[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const displayName = user?.username ?? user?.email ?? "Farmer";
  const initials    = displayName.slice(0, 2).toUpperCase();

  const fetchAll = useCallback(async () => {
    try {
      setError(null);
      const [dash, ordersData]: [any, any] = await Promise.all([
        farmerApi.dashboard(),
        orderApi.myOrders(),
      ]);
      setDashboard(dash);
      const rawOrders = (ordersData?.results ?? ordersData ?? []).slice(0, 3);
      const mappedOrders = rawOrders.map((o: any) => ({
        id: o.id,
        order_number: o.id ? `ORD-${o.id}` : "Unknown",
        buyer_name: o.buyer || "Unknown",
        product_name: o.items?.[0]?.product?.title || o.items?.[0]?.product?.category_name || "Multiple Items",
        quantity: o.items?.[0]?.quantity ? `${o.items[0].quantity} kg` : "0 kg",
        status: o.status || "pending",
        created_at: o.created_at || new Date().toISOString(),
      }));
      setOrders(mappedOrders);
    } catch (e: any) {
      setError("Could not load dashboard. Pull down to retry.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAll();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#047857" />
        <Text style={styles.loadingText}>Loading your farm…</Text>
      </SafeAreaView>
    );
  }

  const s = dashboard?.stats;
  const w = dashboard?.weather;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#047857"
          />
        }
      >
        {/* ── HERO ── */}
        <View style={styles.hero}>
          <View style={styles.heroTopRow}>
            <View>
              <Text style={styles.heroLabel}>DIGITAL HARVEST</Text>
              <Text style={styles.heroName}>{displayName}</Text>
              <Text style={styles.heroSub}>
                Everything is growing according to plan.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.avatarCircle}
              onPress={() => navigation.navigate("Profile")}
            >
              <Text style={styles.avatarText}>{initials}</Text>
            </TouchableOpacity>
          </View>

          {/* WEATHER */}
          {w && (
            <View style={styles.weatherRow}>
              <View style={styles.weatherPill}>
                <Text style={styles.weatherText}>🌡️ {w.temp_c}°C</Text>
              </View>
              <View style={styles.weatherPill}>
                <Text style={styles.weatherText}>💧 {w.humidity_pct}%</Text>
              </View>
              <View style={styles.weatherPill}>
                <Text style={styles.weatherText}>🌧️ {w.rain_chance_pct}%</Text>
              </View>
            </View>
          )}

          {/* INLINE STATS */}
          <View style={styles.heroStats}>
            <HeroStat value={s?.active_listings ?? 0} label="Listings" />
            <View style={styles.heroStatDivider} />
            <HeroStat value={`$${((s?.monthly_revenue ?? 0) / 1000).toFixed(1)}k`} label="Revenue" />
            <View style={styles.heroStatDivider} />
            <HeroStat value={s?.pending_orders ?? 0} label="Orders" />
            <View style={styles.heroStatDivider} />
            <HeroStat value={`${s?.rating?.toFixed(1) ?? "—"}★`} label="Rating" />
          </View>
        </View>

        <View style={styles.body}>
          {/* ERROR BANNER */}
          {error && (
            <View style={styles.errorBanner}>
              <MaterialIcons name="wifi-off" size={16} color="#b91c1c" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* WEATHER ALERT */}
          {w?.alert && (
            <View style={styles.alertBox}>
              <View style={styles.alertIconWrap}>
                <MaterialIcons name="warning" size={18} color="#dc2626" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.alertTitle}>{w.alert}</Text>
                {w.alert_detail && (
                  <Text style={styles.alertSub}>{w.alert_detail}</Text>
                )}
              </View>
            </View>
          )}

          {/* TASKS */}
          <Text style={styles.sectionHead}>Daily Tasks</Text>
          <View style={styles.card}>
            {(dashboard?.tasks ?? []).map((task, i) => (
              <TaskRow
                key={task.id}
                title={task.title}
                sub={task.sub}
                done={task.done}
                borderBottom={i < (dashboard?.tasks?.length ?? 0) - 1}
              />
            ))}
            {(dashboard?.tasks ?? []).length === 0 && (
              <View style={styles.emptyState}>
                <MaterialIcons name="check-circle" size={28} color="#d1fae5" />
                <Text style={styles.emptyText}>All tasks complete!</Text>
              </View>
            )}
          </View>

          {/* HARVEST GOAL */}
          <Text style={styles.sectionHead}>Harvest Goal</Text>
          <View style={styles.card}>
            <View style={styles.cardPad}>
              <View style={styles.rowBetween}>
                <Text style={styles.cardTitle}>Season Progress</Text>
                <Text style={styles.progressPct}>
                  {s?.harvest_goal_pct ?? 0}%
                </Text>
              </View>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${s?.harvest_goal_pct ?? 0}%` as any },
                  ]}
                />
              </View>
              <View style={styles.rowBetween}>
                <Text style={styles.progressLabel}>
                  {s?.harvest_logged_tons ?? 0} Tons Logged
                </Text>
                <Text style={styles.progressLabel}>
                  Goal: {s?.harvest_goal_tons ?? 500} Tons
                </Text>
              </View>
            </View>
          </View>

          {/* RECENT ORDERS */}
          <View style={styles.rowBetween}>
            <Text style={styles.sectionHead}>Recent Orders</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Logistics")}>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.card}>
            {orders.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="inbox" size={28} color="#d1d5db" />
                <Text style={styles.emptyText}>No recent orders</Text>
              </View>
            ) : (
              orders.map((order, i) => {
                const cfg =
                  ORDER_STATUS_CONFIG[order.status] ??
                  ORDER_STATUS_CONFIG.pending;
                return (
                  <View
                    key={order.id}
                    style={[
                      styles.orderRow,
                      i < orders.length - 1 && styles.orderBorder,
                    ]}
                  >
                    <View
                      style={[
                        styles.orderIconBox,
                        { backgroundColor: cfg.bg },
                      ]}
                    >
                      <MaterialIcons name="inventory-2" size={16} color={cfg.text} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.orderBuyer}>{order.buyer_name}</Text>
                      <Text style={styles.orderMeta}>
                        {order.product_name} · {order.quantity} · {order.order_number}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.orderBadge,
                        { backgroundColor: cfg.bg },
                      ]}
                    >
                      <Text style={[styles.orderBadgeText, { color: cfg.text }]}>
                        {cfg.label}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f5f8f5" },

  loadingContainer: {
    flex: 1,
    backgroundColor: "#f5f8f5",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: { fontSize: 13, color: "#9ca3af" },

  // HERO
  hero: {
    backgroundColor: "#047857",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 0,
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
    marginBottom: 3,
  },
  heroName: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.5,
  },
  heroSub: { fontSize: 12, color: "#a7f3d0", marginTop: 3 },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 13, fontWeight: "800", color: "#fff" },

  weatherRow: { flexDirection: "row", gap: 7, marginBottom: 14 },
  weatherPill: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  weatherText: { fontSize: 11, fontWeight: "600", color: "#fff" },

  heroStats: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    marginHorizontal: -16,
  },
  heroStatBox: { flex: 1, paddingVertical: 12, alignItems: "center" },
  heroStatVal: { fontSize: 15, fontWeight: "800", color: "#fff" },
  heroStatLbl: { fontSize: 9, color: "#a7f3d0", marginTop: 1 },
  heroStatDivider: {
    width: 0.5,
    height: 24,
    backgroundColor: "rgba(255,255,255,0.15)",
  },

  // BODY
  body: { padding: 14, paddingTop: 14 },

  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fee2e2",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: "#fecaca",
  },
  errorText: { fontSize: 12, color: "#b91c1c", flex: 1 },

  alertBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fee2e2",
    borderRadius: 14,
    padding: 13,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: "#fecaca",
  },
  alertIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#fecaca",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  alertTitle: { fontSize: 12, fontWeight: "700", color: "#991b1b" },
  alertSub:   { fontSize: 11, color: "#9b2c2c", marginTop: 2 },

  sectionHead: {
    fontSize: 9,
    fontWeight: "700",
    color: "#9ca3af",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 8,
    marginTop: 4,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#047857",
    marginBottom: 8,
  },

  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: "#e4efe4",
    overflow: "hidden",
    marginBottom: 14,
  },
  cardPad: { padding: 14 },
  cardTitle: { fontSize: 13, fontWeight: "700", color: "#374151" },

  // TASKS
  taskRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 13 },
  taskBorder: { borderBottomWidth: 0.5, borderBottomColor: "#f3f4f6" },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#047857",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  checkboxDone: { backgroundColor: "#047857", borderColor: "#047857" },
  taskTitle:    { fontSize: 12, fontWeight: "600", color: "#1a2e1a" },
  taskDone:     { textDecorationLine: "line-through", color: "#9ca3af" },
  taskSub:      { fontSize: 11, color: "#9ca3af", marginTop: 1 },

  // PROGRESS
  progressPct:   { fontSize: 18, fontWeight: "800", color: "#047857" },
  progressTrack: {
    height: 7,
    backgroundColor: "#e5e7eb",
    borderRadius: 10,
    overflow: "hidden",
    marginVertical: 6,
  },
  progressFill: { height: "100%", backgroundColor: "#0df20d", borderRadius: 10 },
  progressLabel: { fontSize: 10, color: "#9ca3af" },

  // ORDERS
  orderRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12 },
  orderBorder: { borderBottomWidth: 0.5, borderBottomColor: "#f3f4f6" },
  orderIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  orderBuyer: { fontSize: 12, fontWeight: "700", color: "#1a2e1a" },
  orderMeta:  { fontSize: 10, color: "#9ca3af", marginTop: 1 },
  orderBadge: { borderRadius: 20, paddingVertical: 3, paddingHorizontal: 9 },
  orderBadgeText: { fontSize: 10, fontWeight: "700" },

  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#0df20d" },

  emptyState: { alignItems: "center", padding: 24, gap: 6 },
  emptyText:  { fontSize: 13, color: "#9ca3af" },
});