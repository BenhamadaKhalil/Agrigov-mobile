// screens/farmer/OrderDetailScreen.tsx

import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { orderApi } from "../../apis/order.api";
import { farmerApi, FarmerMission } from "../../apis/farmer.api";

// ─── types ────────────────────────────────────────────────────────────────────

type OrderDetailRouteParams = {
  OrderDetail: { orderId: number };
};

interface OrderFull {
  id: number;
  buyer: string;
  farm: string;
  total_price: string;
  status: string;
  created_at: string;
  items: Array<{
    id: number;
    product: {
      id: number;
      title: string;
      category_name: string;
      unit_price: string;
    };
    quantity: number;
    total_price: number;
  }>;
  allowed_statuses: string[];
}

// ─── helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: string }> = {
  pending:    { label: "Pending",    bg: "#fff3e0", text: "#c05c00", icon: "schedule" },
  confirmed:  { label: "Confirmed",  bg: "#dbeafe", text: "#1d4ed8", icon: "check-circle" },
  shipped:    { label: "Shipped",    bg: "#f0ecff", text: "#6336c7", icon: "local-shipping" },
  delivered:  { label: "Delivered",  bg: "#d1fae5", text: "#047857", icon: "done-all" },
  cancelled:  { label: "Cancelled",  bg: "#fee2e2", text: "#b91c1c", icon: "cancel" },
};

const MISSION_STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: string }> = {
  pending:    { label: "Awaiting Transporter", bg: "#fff3e0", text: "#c05c00", icon: "hourglass-empty" },
  accepted:   { label: "Transporter Assigned", bg: "#dbeafe", text: "#1d4ed8", icon: "person-pin" },
  picked_up:  { label: "Picked Up",            bg: "#e3f0ff", text: "#1a5fa8", icon: "inventory" },
  in_transit: { label: "In Transit",           bg: "#f0ecff", text: "#6336c7", icon: "local-shipping" },
  delivered:  { label: "Delivered",            bg: "#d1fae5", text: "#047857", icon: "done-all" },
  cancelled:  { label: "Cancelled",            bg: "#fee2e2", text: "#b91c1c", icon: "cancel" },
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDateTime(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
    " at " + d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

// ─── main ─────────────────────────────────────────────────────────────────────

export default function OrderDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<OrderDetailRouteParams, "OrderDetail">>();
  const { orderId } = route.params;

  const [order, setOrder] = useState<OrderFull | null>(null);
  const [mission, setMission] = useState<FarmerMission | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [showMissionForm, setShowMissionForm] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setError(null);

      // Fetch order details
      let orderData: any;
      try {
        orderData = await orderApi.detail(orderId);
      } catch (e: any) {
        console.log("OrderDetail: failed to fetch order", orderId, e);
        setError("Could not load order details.");
        return;
      }

      if (!orderData || !orderData.id) {
        console.log("OrderDetail: empty/invalid order data", orderData);
        setError("Order not found.");
        return;
      }

      setOrder(orderData);

      // Try to fetch mission linked to this order (independent — don't fail the whole screen)
      try {
        const missionsData: any = await farmerApi.myMissions();
        const raw = missionsData?.results ?? missionsData ?? [];
        const linked = raw.find((m: any) => m.order === orderId);
        setMission(linked || null);
      } catch (e: any) {
        console.log("OrderDetail: failed to fetch missions", e);
        // No mission yet — that's fine
        setMission(null);
      }
    } catch (e: any) {
      console.log("OrderDetail: unexpected error", e);
      setError("Could not load order details.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [orderId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  // ─── Actions ────────────────────────────────────────────────────────────
  const handleConfirmOrder = async () => {
    if (!order) return;
    setActionLoading(true);
    try {
      await orderApi.updateStatus(order.id, "confirmed" as any);
      Alert.alert("Success", "Order confirmed!");
      fetchData();
    } catch {
      Alert.alert("Error", "Could not confirm order.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateMission = async () => {
    if (!order) return;
    setActionLoading(true);
    try {
      await farmerApi.createMission({
        order: order.id,
        delivery_address: deliveryAddress || undefined,
      });
      Alert.alert("Success", "Mission created! A transporter will be assigned.");
      setShowMissionForm(false);
      setDeliveryAddress("");
      fetchData();
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Could not create mission.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelMission = async () => {
    if (!mission) return;
    Alert.alert("Cancel Mission", "Are you sure?", [
      { text: "No" },
      {
        text: "Yes, Cancel",
        style: "destructive",
        onPress: async () => {
          setActionLoading(true);
          try {
            await farmerApi.cancelMission(mission.id);
            Alert.alert("Done", "Mission cancelled.");
            fetchData();
          } catch {
            Alert.alert("Error", "Could not cancel mission.");
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  // ─── Render ─────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <SafeAreaView style={styles.loadWrap} edges={["top"]}>
        <ActivityIndicator size="large" color="#047857" />
        <Text style={styles.loadText}>Loading order…</Text>
      </SafeAreaView>
    );
  }

  if (error || !order) {
    return (
      <SafeAreaView style={styles.loadWrap} edges={["top"]}>
        <MaterialIcons name="error-outline" size={36} color="#b91c1c" />
        <Text style={styles.errorMsg}>{error || "Order not found"}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchData}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
  const canConfirm = order.allowed_statuses?.includes("confirmed");
  const canCreateMission = order.status === "confirmed" && !mission;
  const canCancelMission = mission && ["pending", "accepted"].includes(mission.status);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* ── HEADER ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerLabel}>ORDER DETAILS</Text>
          <Text style={styles.headerTitle}>ORD-{order.id}</Text>
        </View>
        <View style={[styles.headerBadge, { backgroundColor: cfg.bg }]}>
          <Text style={[styles.headerBadgeText, { color: cfg.text }]}>{cfg.label}</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#047857" />}
      >
        <View style={styles.body}>
          {/* ── ORDER INFO CARD ── */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="receipt-long" size={18} color="#047857" />
              <Text style={styles.cardTitle}>Order Information</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Buyer</Text>
              <Text style={styles.infoValue}>{order.buyer}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Farm</Text>
              <Text style={styles.infoValue}>{order.farm}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Date</Text>
              <Text style={styles.infoValue}>{formatDate(order.created_at)}</Text>
            </View>
            <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.infoLabel}>Total</Text>
              <Text style={styles.totalValue}>${parseFloat(order.total_price).toFixed(2)}</Text>
            </View>
          </View>

          {/* ── ITEMS CARD ── */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="inventory-2" size={18} color="#047857" />
              <Text style={styles.cardTitle}>Items ({order.items.length})</Text>
            </View>
            {order.items.map((item, i) => (
              <View
                key={item.id}
                style={[styles.itemRow, i < order.items.length - 1 && styles.itemBorder]}
              >
                <View style={styles.itemIcon}>
                  <Text style={{ fontSize: 18 }}>📦</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{item.product?.title || "Product"}</Text>
                  <Text style={styles.itemMeta}>
                    {item.quantity} kg · ${item.product?.unit_price || "0"}/kg
                  </Text>
                </View>
                <Text style={styles.itemTotal}>
                  ${(item.total_price || 0).toFixed(2)}
                </Text>
              </View>
            ))}
          </View>

          {/* ── MISSION CARD ── */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="local-shipping" size={18} color="#047857" />
              <Text style={styles.cardTitle}>Delivery Mission</Text>
            </View>

            {mission ? (
              <>
                {/* Mission Status */}
                {(() => {
                  const mcfg = MISSION_STATUS_CONFIG[mission.status] ?? MISSION_STATUS_CONFIG.pending;
                  return (
                    <View style={styles.missionStatusRow}>
                      <View style={[styles.missionStatusIcon, { backgroundColor: mcfg.bg }]}>
                        <MaterialIcons name={mcfg.icon as any} size={18} color={mcfg.text} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.missionStatusLabel, { color: mcfg.text }]}>{mcfg.label}</Text>
                        <Text style={styles.missionSubtext}>Mission #{mission.id}</Text>
                      </View>
                      <View style={[styles.missionBadge, { backgroundColor: mcfg.bg }]}>
                        <Text style={[styles.missionBadgeText, { color: mcfg.text }]}>{mission.status.replace("_", " ")}</Text>
                      </View>
                    </View>
                  );
                })()}

                {/* Timeline */}
                <View style={styles.timeline}>
                  <TimelineItem label="Created" time={formatDateTime(mission.created_at)} done />
                  <TimelineItem
                    label="Transporter Accepted"
                    time={formatDateTime(mission.accepted_at)}
                    done={!!mission.accepted_at}
                  />
                  <TimelineItem
                    label="Picked Up"
                    time={formatDateTime(mission.picked_up_at)}
                    done={!!mission.picked_up_at}
                  />
                  <TimelineItem
                    label="Delivered"
                    time={formatDateTime(mission.delivered_at)}
                    done={!!mission.delivered_at}
                    isLast
                  />
                </View>

                {/* Transporter info */}
                {mission.transporter_email && (
                  <View style={styles.transporterCard}>
                    <View style={styles.transporterIcon}>
                      <MaterialIcons name="person" size={18} color="#047857" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.transporterName}>{mission.transporter_email}</Text>
                      {mission.vehicle_info && (
                        <Text style={styles.transporterVehicle}>🚚 {mission.vehicle_info}</Text>
                      )}
                    </View>
                  </View>
                )}

                {/* Addresses */}
                {(mission.pickup_address || mission.delivery_address) && (
                  <View style={styles.addressSection}>
                    {mission.pickup_address ? (
                      <View style={styles.addressRow}>
                        <MaterialIcons name="my-location" size={14} color="#047857" />
                        <Text style={styles.addressText}>{mission.pickup_address}</Text>
                      </View>
                    ) : null}
                    {mission.delivery_address ? (
                      <View style={styles.addressRow}>
                        <MaterialIcons name="place" size={14} color="#b91c1c" />
                        <Text style={styles.addressText}>{mission.delivery_address}</Text>
                      </View>
                    ) : null}
                  </View>
                )}

                {/* Cancel mission */}
                {canCancelMission && (
                  <TouchableOpacity
                    style={styles.cancelMissionBtn}
                    onPress={handleCancelMission}
                    disabled={actionLoading}
                  >
                    <MaterialIcons name="close" size={16} color="#b91c1c" />
                    <Text style={styles.cancelMissionText}>Cancel Mission</Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <View style={styles.noMission}>
                <MaterialIcons name="local-shipping" size={32} color="#d1d5db" />
                <Text style={styles.noMissionTitle}>
                  {order.status === "confirmed" ? "Ready to Ship" : "No Mission Yet"}
                </Text>
                <Text style={styles.noMissionSub}>
                  {order.status === "confirmed"
                    ? "Create a delivery mission to assign a transporter."
                    : order.status === "pending"
                    ? "Confirm this order first to create a mission."
                    : "Mission tracking is available for confirmed orders."}
                </Text>
              </View>
            )}
          </View>

          {/* ── CREATE MISSION FORM ── */}
          {canCreateMission && showMissionForm && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <MaterialIcons name="add-road" size={18} color="#047857" />
                <Text style={styles.cardTitle}>Create Mission</Text>
              </View>
              <Text style={styles.formLabel}>Delivery Address (optional)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter delivery address…"
                placeholderTextColor="#c4c4c4"
                value={deliveryAddress}
                onChangeText={setDeliveryAddress}
                multiline
              />
              <View style={styles.formActions}>
                <TouchableOpacity
                  style={styles.formCancelBtn}
                  onPress={() => setShowMissionForm(false)}
                >
                  <Text style={styles.formCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.formSubmitBtn}
                  onPress={handleCreateMission}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.formSubmitText}>Create Mission</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ── ACTION BUTTONS ── */}
          <View style={styles.actionsRow}>
            {canConfirm && (
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleConfirmOrder}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <MaterialIcons name="check" size={18} color="#fff" />
                    <Text style={styles.confirmText}>Confirm Order</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
            {canCreateMission && !showMissionForm && (
              <TouchableOpacity
                style={styles.createMissionBtn}
                onPress={() => setShowMissionForm(true)}
              >
                <MaterialIcons name="local-shipping" size={18} color="#047857" />
                <Text style={styles.createMissionText}>Create Mission</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Timeline sub-component ───────────────────────────────────────────────────

function TimelineItem({
  label,
  time,
  done,
  isLast,
}: {
  label: string;
  time: string;
  done: boolean;
  isLast?: boolean;
}) {
  return (
    <View style={styles.tlRow}>
      <View style={styles.tlDotCol}>
        <View style={[styles.tlDot, done && styles.tlDotDone]}>
          {done && <MaterialIcons name="check" size={10} color="#fff" />}
        </View>
        {!isLast && <View style={[styles.tlLine, done && styles.tlLineDone]} />}
      </View>
      <View style={styles.tlContent}>
        <Text style={[styles.tlLabel, done && styles.tlLabelDone]}>{label}</Text>
        <Text style={styles.tlTime}>{time}</Text>
      </View>
    </View>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f5f8f5" },

  loadWrap: { flex: 1, backgroundColor: "#f5f8f5", alignItems: "center", justifyContent: "center", gap: 12 },
  loadText: { fontSize: 13, color: "#9ca3af" },
  errorMsg: { fontSize: 14, color: "#b91c1c", textAlign: "center", marginHorizontal: 30 },
  retryBtn: { backgroundColor: "#047857", paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10, marginTop: 10 },
  retryBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  header: {
    backgroundColor: "#047857",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  headerLabel: { fontSize: 10, fontWeight: "700", color: "#a7f3d0", letterSpacing: 1 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#fff", letterSpacing: -0.3 },
  headerBadge: { borderRadius: 20, paddingVertical: 5, paddingHorizontal: 12 },
  headerBadgeText: { fontSize: 11, fontWeight: "700" },

  body: { padding: 14 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: "#e4efe4",
    overflow: "hidden",
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f3f4f6",
  },
  cardTitle: { fontSize: 14, fontWeight: "700", color: "#1a2e1a" },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f3f4f6",
  },
  infoLabel: { fontSize: 12, color: "#9ca3af" },
  infoValue: { fontSize: 13, fontWeight: "600", color: "#1a2e1a" },
  totalValue: { fontSize: 16, fontWeight: "800", color: "#047857" },

  itemRow: { flexDirection: "row", alignItems: "center", padding: 12, gap: 10 },
  itemBorder: { borderBottomWidth: 0.5, borderBottomColor: "#f3f4f6" },
  itemIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "#f0faf0",
    alignItems: "center", justifyContent: "center",
  },
  itemName: { fontSize: 13, fontWeight: "700", color: "#1a2e1a" },
  itemMeta: { fontSize: 11, color: "#9ca3af", marginTop: 1 },
  itemTotal: { fontSize: 13, fontWeight: "800", color: "#047857" },

  // Mission
  missionStatusRow: {
    flexDirection: "row", alignItems: "center", gap: 10, padding: 14,
    borderBottomWidth: 0.5, borderBottomColor: "#f3f4f6",
  },
  missionStatusIcon: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  missionStatusLabel: { fontSize: 13, fontWeight: "700" },
  missionSubtext: { fontSize: 11, color: "#9ca3af", marginTop: 1 },
  missionBadge: { borderRadius: 20, paddingVertical: 3, paddingHorizontal: 10 },
  missionBadgeText: { fontSize: 10, fontWeight: "700", textTransform: "capitalize" },

  // Timeline
  timeline: { paddingHorizontal: 14, paddingVertical: 10 },
  tlRow: { flexDirection: "row", minHeight: 40 },
  tlDotCol: { width: 24, alignItems: "center" },
  tlDot: {
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 2, borderColor: "#d1d5db",
    alignItems: "center", justifyContent: "center",
    backgroundColor: "#fff",
  },
  tlDotDone: { backgroundColor: "#047857", borderColor: "#047857" },
  tlLine: { flex: 1, width: 2, backgroundColor: "#e5e7eb" },
  tlLineDone: { backgroundColor: "#047857" },
  tlContent: { flex: 1, paddingLeft: 10, paddingBottom: 14 },
  tlLabel: { fontSize: 12, fontWeight: "600", color: "#9ca3af" },
  tlLabelDone: { color: "#1a2e1a" },
  tlTime: { fontSize: 10, color: "#c4c4c4", marginTop: 1 },

  // Transporter
  transporterCard: {
    flexDirection: "row", alignItems: "center", gap: 10,
    marginHorizontal: 14, marginBottom: 12,
    padding: 12, backgroundColor: "#f0faf0", borderRadius: 12,
  },
  transporterIcon: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: "#d1fae5",
    alignItems: "center", justifyContent: "center",
  },
  transporterName: { fontSize: 13, fontWeight: "700", color: "#1a2e1a" },
  transporterVehicle: { fontSize: 11, color: "#6b7280", marginTop: 2 },

  // Address
  addressSection: { paddingHorizontal: 14, paddingBottom: 12, gap: 6 },
  addressRow: { flexDirection: "row", alignItems: "flex-start", gap: 6 },
  addressText: { fontSize: 11, color: "#6b7280", flex: 1 },

  // No mission
  noMission: { alignItems: "center", padding: 24, gap: 6 },
  noMissionTitle: { fontSize: 14, fontWeight: "700", color: "#9ca3af" },
  noMissionSub: { fontSize: 12, color: "#c4c4c4", textAlign: "center", maxWidth: 260 },

  // Cancel mission
  cancelMissionBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, margin: 14, padding: 10,
    borderRadius: 10, borderWidth: 1, borderColor: "#fecaca", backgroundColor: "#fff5f5",
  },
  cancelMissionText: { fontSize: 12, fontWeight: "700", color: "#b91c1c" },

  // Form
  formLabel: { fontSize: 12, fontWeight: "600", color: "#6b7280", paddingHorizontal: 14, paddingTop: 10 },
  formInput: {
    marginHorizontal: 14, marginTop: 6, marginBottom: 10,
    backgroundColor: "#f9fdf9", borderRadius: 10, padding: 12,
    borderWidth: 0.5, borderColor: "#e4efe4",
    fontSize: 13, color: "#1a2e1a", minHeight: 60, textAlignVertical: "top",
  },
  formActions: { flexDirection: "row", gap: 8, paddingHorizontal: 14, paddingBottom: 14 },
  formCancelBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1, borderColor: "#e4efe4", alignItems: "center",
  },
  formCancelText: { fontSize: 13, fontWeight: "600", color: "#9ca3af" },
  formSubmitBtn: {
    flex: 2, paddingVertical: 10, borderRadius: 10,
    backgroundColor: "#047857", alignItems: "center",
  },
  formSubmitText: { fontSize: 13, fontWeight: "700", color: "#fff" },

  // Actions row
  actionsRow: { gap: 8 },
  confirmBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: "#047857", borderRadius: 12,
    paddingVertical: 14,
  },
  confirmText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  createMissionBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: "#d1fae5", borderRadius: 12,
    paddingVertical: 14,
  },
  createMissionText: { fontSize: 14, fontWeight: "700", color: "#047857" },
});
