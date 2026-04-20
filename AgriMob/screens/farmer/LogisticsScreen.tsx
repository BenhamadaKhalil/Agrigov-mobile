import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

type OrderStatus = "Pending" | "Loaded" | "Transit" | "Delivered";

interface Order {
  id: string;
  buyer: string;
  product: string;
  emoji: string;
  transporter: string;
  status: OrderStatus;
}

const statusConfig: Record<OrderStatus, { bg: string; text: string; label: string }> = {
  Pending:   { bg: "#fff3e0", text: "#c05c00", label: "Pending" },
  Loaded:    { bg: "#e3f0ff", text: "#1a5fa8", label: "Loaded" },
  Transit:   { bg: "#f0ecff", text: "#6336c7", label: "Transit" },
  Delivered: { bg: "#d1fae5", text: "#047857", label: "Delivered" },
};

const orders: Order[] = [
  {
    id: "#ORD-4022",
    buyer: "FreshMarket Inc.",
    product: "Corn · 5 Tons",
    emoji: "🌽",
    transporter: "SwiftHaul",
    status: "Pending",
  },
  {
    id: "#ORD-4019",
    buyer: "Gov Grain Reserve",
    product: "Wheat · 12.5 Tons",
    emoji: "🌾",
    transporter: "AgriTrans",
    status: "Loaded",
  },
  {
    id: "#ORD-3988",
    buyer: "City Supermarkets",
    product: "Tomatoes · 2 Tons",
    emoji: "🍅",
    transporter: "FastFresh",
    status: "Transit",
  },
  {
    id: "#ORD-3850",
    buyer: "Organic Wholesalers",
    product: "Soybeans · 8 Tons",
    emoji: "🫘",
    transporter: "GreenRoute",
    status: "Delivered",
  },
];

const StatCard = ({
  icon,
  title,
  value,
  dark,
}: {
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
  title: string;
  value: string;
  dark?: boolean;
}) => (
  <View style={[styles.statCard, dark && styles.statCardDark]}>
    <View style={[styles.statIconWrap, dark && styles.statIconWrapLight]}>
      <MaterialIcons name={icon} size={18} color={dark ? "#047857" : "#0df20d"} />
    </View>
    <Text style={[styles.statValue, dark && styles.statValueLight]}>{value}</Text>
    <Text style={[styles.statLabel, dark && styles.statLabelLight]}>{title}</Text>
  </View>
);

export default function LogisticsScreen() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* HEADER */}
      <Text style={styles.title}>Logistics</Text>
      <Text style={styles.subtitle}>Manage shipments and deliveries</Text>

      {/* STATS */}
      <View style={styles.statsGrid}>
        <StatCard icon="inventory" title="Ready" value="12" />
        <StatCard icon="local-shipping" title="Transit" value="8" />
        <StatCard icon="check-circle" title="Delivered" value="24" />
        <StatCard icon="trending-up" title="On-Time" value="98%" dark />
      </View>

      {/* SEARCH */}
      <View style={styles.searchBox}>
        <MaterialIcons name="search" size={18} color="#9ca3af" />
        <TextInput
          placeholder="Search orders…"
          placeholderTextColor="#9ca3af"
          style={styles.searchInput}
        />
      </View>

      {/* ORDERS */}
      <Text style={styles.sectionTitle}>Active Orders</Text>
      {orders.map((order) => {
        const cfg = statusConfig[order.status];
        return (
          <View key={order.id} style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <Text style={styles.orderId}>{order.id}</Text>
              <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                <Text style={[styles.statusText, { color: cfg.text }]}>
                  {cfg.label}
                </Text>
              </View>
            </View>

            <View style={styles.orderBody}>
              <View style={styles.emojiBox}>
                <Text style={styles.emojiText}>{order.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.orderBuyer}>{order.buyer}</Text>
                <Text style={styles.orderMeta}>{order.product}</Text>
                <Text style={styles.orderTransporter}>🚚 {order.transporter}</Text>
              </View>
              <TouchableOpacity style={styles.moreBtn}>
                <MaterialIcons name="more-vert" size={18} color="#9ca3af" />
              </TouchableOpacity>
            </View>
          </View>
        );
      })}

      {/* UPCOMING PICKUPS */}
      <Text style={[styles.sectionTitle, { marginTop: 6 }]}>Upcoming Pickups</Text>
      <View style={styles.card}>
        {[
          { date: "Oct\n24", title: "SwiftHaul Logistics", desc: "Order #4022 · Corn" },
          { date: "Oct\n25", title: "AgriTrans Co.", desc: "Order #4025 · Rice" },
        ].map((p, i) => (
          <View
            key={i}
            style={[styles.pickupRow, i === 0 && styles.pickupBorder]}
          >
            <View style={styles.dateBox}>
              <Text style={styles.dateText}>{p.date}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.pickupTitle}>{p.title}</Text>
              <Text style={styles.orderMeta}>{p.desc}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={18} color="#d1d5db" />
          </View>
        ))}
      </View>

      {/* LIVE TRACKING */}
      <Text style={[styles.sectionTitle, { marginTop: 6 }]}>Live Tracking</Text>
      <View style={styles.trackCard}>
        <View style={styles.trackRow}>
          <View style={styles.liveDot} />
          <Text style={styles.trackTitle}>Truck TRK-8921</Text>
        </View>
        <Text style={styles.trackSub}>20 km away · Arrival in 45 min</Text>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: "65%" }]} />
        </View>
        <View style={styles.trackLabels}>
          <Text style={styles.trackLabel}>Farm</Text>
          <Text style={styles.trackLabel}>Destination</Text>
        </View>
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
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a2e1a",
    marginBottom: 10,
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },

  statCard: {
    width: "47.5%",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 0.5,
    borderColor: "#e4efe4",
  },

  statCardDark: {
    backgroundColor: "#047857",
    borderColor: "#047857",
  },

  statIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#f0faf0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },

  statIconWrapLight: {
    backgroundColor: "#a7f3d0",
  },

  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1a2e1a",
    letterSpacing: -0.3,
  },

  statValueLight: {
    color: "#fff",
  },

  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#9ca3af",
    marginTop: 2,
  },

  statLabelLight: {
    color: "#a7f3d0",
  },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    paddingVertical: 11,
    paddingHorizontal: 14,
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

  orderCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: "#e4efe4",
  },

  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  orderId: {
    fontSize: 12,
    fontWeight: "700",
    color: "#047857",
  },

  statusBadge: {
    borderRadius: 20,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },

  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },

  orderBody: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  emojiBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#f0faf0",
    alignItems: "center",
    justifyContent: "center",
  },

  emojiText: {
    fontSize: 20,
  },

  orderBuyer: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1a2e1a",
  },

  orderMeta: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 1,
  },

  orderTransporter: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },

  moreBtn: {
    padding: 4,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 0.5,
    borderColor: "#e4efe4",
    marginBottom: 14,
  },

  pickupRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },

  pickupBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: "#f3f4f6",
  },

  dateBox: {
    backgroundColor: "#0df20d",
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: "center",
    minWidth: 46,
  },

  dateText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#065f46",
    textAlign: "center",
  },

  pickupTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1a2e1a",
  },

  trackCard: {
    backgroundColor: "#047857",
    borderRadius: 16,
    padding: 16,
    marginBottom: 30,
  },

  trackRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },

  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#0df20d",
  },

  trackTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },

  trackSub: {
    fontSize: 12,
    color: "#a7f3d0",
    marginBottom: 12,
  },

  progressTrack: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 10,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#0df20d",
    borderRadius: 10,
  },

  trackLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
  },

  trackLabel: {
    fontSize: 10,
    color: "#a7f3d0",
  },
});