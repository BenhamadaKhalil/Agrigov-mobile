import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { orderApi } from "../../apis/order.api";
import { useAuth } from "../../context/AuthContext";

const formatDZD = (value: number) =>
  new Intl.NumberFormat("fr-DZ").format(Math.round(value)) + " DZD";

type OrderStatus = "Delivered" | "In Transit" | "Pending" | "Cancelled";

/** Maps backend snake_case statuses → display labels */
const STATUS_MAP: Record<string, OrderStatus> = {
  delivered: "Delivered",
  in_transit: "In Transit",
  pending: "Pending",
  confirmed: "Pending",   // treat confirmed as Pending visually
  cancelled: "Cancelled",
};

function mapStatus(raw: string | undefined): OrderStatus {
  if (!raw) return "Pending";
  return STATUS_MAP[raw.toLowerCase()] ?? "Pending";
}

/** Safely extracts a display name from supplier/farm which may be string or object */
function extractName(val: any): string {
  if (!val) return "Unknown Farm";
  if (typeof val === "string") return val;
  if (typeof val === "object") return val.name ?? val.title ?? val.farm_name ?? "Unknown Farm";
  return String(val);
}

interface MappedOrder {
  id: number;
  order_id: string;
  supplier: string;
  product: string;
  quantity: string;
  amount: number;
  status: OrderStatus;
  date: string;
  invoice_pdf: string | null;
}

function statusStyle(status: OrderStatus) {
  if (status === "Delivered")
    return { bg: "#d1fae5", text: "#047857", accent: "#9ca3af" };
  if (status === "In Transit")
    return { bg: "#dbeafe", text: "#1d4ed8", accent: "#0df20d" };
  if (status === "Pending")
    return { bg: "#fef3c7", text: "#92400e", accent: "#f59e0b" };
  return { bg: "#fee2e2", text: "#b91c1c", accent: "#ef4444" };
}

function statusIcon(status: OrderStatus): keyof typeof MaterialIcons.glyphMap {
  if (status === "Delivered") return "check-circle";
  if (status === "In Transit") return "local-shipping";
  if (status === "Pending") return "schedule";
  return "cancel";
}

export default function OrdersScreen() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<MappedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<MappedOrder | null>(null);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("All");

  const FILTERS = ["All", "In Transit", "Pending", "Delivered"];

  React.useEffect(() => {
    // Only fetch orders when the logged-in user is a BUYER
    if (!user || user.role !== "BUYER") {
      setOrders([]);
      setLoading(false);
      return;
    }

    const fetchOrders = async () => {
      try {
        const response: any = await orderApi.myOrders();
        const results: any[] = response?.results
          ? response.results
          : Array.isArray(response)
          ? response
          : [];

        if (results.length === 0) {
          setOrders([]);
          setSelectedOrder(null);
          return;
        }

        const mapped: MappedOrder[] = results
          // Guard against null/undefined entries
          .filter((o: any) => o != null && o.id != null)
          .map((o: any) => ({
            id: o.id,
            order_id: `AG-${1000 + (o.id as number)}`,
            // farm/supplier can be a string, an object, or missing
            supplier: extractName(o.farm ?? o.supplier),
            product:
              o.items?.[0]?.product?.title ??
              o.items?.[0]?.product?.name ??
              (o.items?.length > 1 ? "Multiple Items" : "Unknown Product"),
            quantity:
              o.items?.[0]?.quantity != null
                ? `${o.items[0].quantity} kg`
                : "N/A",
            // total_price comes as a string from DRF serializer
            amount: parseFloat(o.total_price ?? "0"),
            // Map backend snake_case → display label
            status: mapStatus(o.status),
            date: o.created_at
              ? new Date(o.created_at).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "Unknown",
            invoice_pdf: o.invoice_pdf || null,
          }));

        setOrders(mapped);
        if (mapped.length > 0) setSelectedOrder(mapped[0]);
      } catch (err) {
        console.error("[OrdersScreen] Failed to fetch orders:", err);
        setOrders([]);
        setSelectedOrder(null);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  const filtered = orders.filter((o) => {
    const matchSearch =
      o.order_id.toLowerCase().includes(search.toLowerCase()) ||
      o.product.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      activeFilter === "All" || o.status === activeFilter;
    return matchSearch && matchFilter;
  });

  const renderItem = ({ item }: { item: MappedOrder }) => {
    const st = statusStyle(item.status);
    const isSelected = selectedOrder?.id === item.id;

    return (
      <TouchableOpacity
        style={[styles.orderCard, isSelected && styles.orderCardSelected]}
        onPress={() => setSelectedOrder(item)}
        activeOpacity={0.7}
      >
        {/* Left accent bar */}
        <View
          style={[styles.cardAccent, { backgroundColor: st.accent }]}
        />

        <View style={styles.orderLeft}>
          <Text style={styles.orderId}>#{item.order_id}</Text>
          <Text style={styles.orderProduct}>{item.product}</Text>
          <View style={styles.orderSupplierRow}>
            <MaterialIcons name="store" size={11} color="#9ca3af" />
            <Text style={styles.orderSupplier}>{item.supplier}</Text>
          </View>
          <Text style={styles.orderDate}>{item.date}</Text>
        </View>

        <View style={styles.orderRight}>
          <Text style={styles.orderAmount}>{formatDZD(item.amount)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
            <MaterialIcons
              name={statusIcon(item.status)}
              size={10}
              color={st.text}
            />
            <Text style={[styles.statusText, { color: st.text }]}>
              {item.status}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>PURCHASE HISTORY</Text>
          <Text style={styles.headerTitle}>My Orders</Text>
        </View>
        <View style={styles.orderCountBadge}>
          <Text style={styles.orderCountText}>{orders.length}</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <MaterialIcons name="search" size={16} color="#9ca3af" />
        <TextInput
          placeholder="Search orders, products…"
          placeholderTextColor="#9ca3af"
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <MaterialIcons name="close" size={16} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterPill, activeFilter === f && styles.filterPillActive]}
            onPress={() => setActiveFilter(f)}
          >
            <Text
              style={[
                styles.filterPillText,
                activeFilter === f && styles.filterPillTextActive,
              ]}
            >
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#0df20d" />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconBox}>
            <MaterialIcons name="receipt-long" size={32} color="#9ca3af" />
          </View>
          <Text style={styles.emptyTitle}>No orders found</Text>
          <Text style={styles.emptySub}>
            Try a different search or filter
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            selectedOrder ? (
              <InvoicePanel order={selectedOrder} />
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

// ── Invoice Panel ──────────────────────────────────────────────────────────

function InvoicePanel({ order }: { order: MappedOrder }) {
  const st = statusStyle(order.status);
  const transport = 0;
  const total = (order.amount || 0) + transport;
  const [downloading, setDownloading] = useState(false);

  if (!order || !order.id) {
    return null;
  }

  const handleDownloadInvoice = async () => {
    setDownloading(true);
    try {
      const { url, headers } = await orderApi.getInvoiceDownloadInfo(order.id);

      const fileUri = `${FileSystem.cacheDirectory}invoice_${order.id}.pdf`;

      const downloadResult = await FileSystem.downloadAsync(url, fileUri, {
        headers: headers as Record<string, string>,
      });

      if (downloadResult.status !== 200) {
        throw new Error(`Download failed with status ${downloadResult.status}`);
      }

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(downloadResult.uri, {
          mimeType: "application/pdf",
          dialogTitle: `Invoice #${order.order_id}`,
          UTI: "com.adobe.pdf",
        });
      } else {
        Alert.alert("Success", "Invoice downloaded successfully.");
      }
    } catch (err: any) {
      console.error("Invoice download error:", err);
      Alert.alert(
        "Download Failed",
        err?.message || "Could not download the invoice. Please try again."
      );
    } finally {
      setDownloading(false);
    }
  };

  return (
    <View style={styles.invoiceCard}>
      <View style={styles.invoiceHeader}>
        <View>
          <Text style={styles.invoiceTitle}>Invoice #{order.order_id}</Text>
          <Text style={styles.invoiceDate}>{order.date}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
          <MaterialIcons name={statusIcon(order.status)} size={10} color={st.text} />
          <Text style={[styles.statusText, { color: st.text }]}>{order.status}</Text>
        </View>
      </View>

      <View style={styles.invoiceSupplier}>
        <MaterialIcons name="store" size={14} color="#047857" />
        <Text style={styles.invoiceSupplierText}>{order.supplier}</Text>
      </View>

      <View style={styles.divider} />

      <InvRow label="Product" value={order.product || "N/A"} />
      <InvRow label="Quantity" value={order.quantity || "N/A"} />
      <InvRow label="Subtotal" value={formatDZD(order.amount || 0)} />
      <InvRow label="Transport" value={formatDZD(transport)} />

      <View style={styles.divider} />

      <View style={styles.invTotalRow}>
        <Text style={styles.invTotalLabel}>Total</Text>
        <Text style={styles.invTotalVal}>
          {formatDZD(total)}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.downloadBtn}
        onPress={handleDownloadInvoice}
        disabled={downloading}
        activeOpacity={0.7}
      >
        {downloading ? (
          <ActivityIndicator size="small" color="#047857" />
        ) : (
          <MaterialIcons name="download" size={16} color="#047857" />
        )}
        <Text style={styles.downloadBtnText}>
          {downloading ? "Generating Invoice…" : "Download Invoice PDF"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function InvRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.invRow}>
      <Text style={styles.invLabel}>{label}</Text>
      <Text style={styles.invVal}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f8f5",
  },

  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // ── HEADER
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 0.5,
    borderBottomColor: "#f0f0f0",
  },

  headerSub: {
    fontSize: 10,
    fontWeight: "700",
    color: "#047857",
    letterSpacing: 0.5,
    marginBottom: 2,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1a2e1a",
    letterSpacing: -0.4,
  },

  orderCountBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#d1fae5",
    alignItems: "center",
    justifyContent: "center",
  },

  orderCountText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#047857",
  },

  // ── SEARCH
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    marginHorizontal: 14,
    marginTop: 12,
    marginBottom: 4,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: "#e4efe4",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#1a2e1a",
    padding: 0,
  },

  // ── FILTER PILLS
  filterRow: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },

  filterPill: {
    backgroundColor: "#fff",
    borderWidth: 0.5,
    borderColor: "#e4efe4",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },

  filterPillActive: {
    backgroundColor: "#d1fae5",
    borderColor: "#a7f3d0",
  },

  filterPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6b7280",
  },

  filterPillTextActive: {
    color: "#047857",
  },

  listContent: {
    paddingHorizontal: 14,
    paddingBottom: 20,
  },

  // ── ORDER CARD
  orderCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: "#e4efe4",
    flexDirection: "row",
    overflow: "hidden",
  },

  orderCardSelected: {
    borderWidth: 1.5,
    borderColor: "#0df20d",
  },

  cardAccent: {
    width: 4,
    alignSelf: "stretch",
  },

  orderLeft: {
    flex: 1,
    padding: 14,
    paddingLeft: 12,
  },

  orderId: {
    fontSize: 10,
    fontWeight: "800",
    color: "#047857",
    letterSpacing: 0.3,
    marginBottom: 3,
  },

  orderProduct: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1a2e1a",
    letterSpacing: -0.2,
    marginBottom: 3,
  },

  orderSupplierRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginBottom: 3,
  },

  orderSupplier: {
    fontSize: 11,
    color: "#9ca3af",
    fontWeight: "600",
  },

  orderDate: {
    fontSize: 11,
    color: "#c4c4c4",
    fontWeight: "600",
  },

  orderRight: {
    padding: 14,
    alignItems: "flex-end",
    justifyContent: "space-between",
  },

  orderAmount: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1a2e1a",
    letterSpacing: -0.3,
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  statusText: {
    fontSize: 10,
    fontWeight: "800",
  },

  // ── INVOICE CARD
  invoiceCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 0.5,
    borderColor: "#e4efe4",
    marginTop: 2,
    marginBottom: 10,
  },

  invoiceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },

  invoiceTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1a2e1a",
    letterSpacing: -0.2,
    marginBottom: 2,
  },

  invoiceDate: {
    fontSize: 11,
    color: "#9ca3af",
    fontWeight: "600",
  },

  invoiceSupplier: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#f8faf8",
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    borderWidth: 0.5,
    borderColor: "#e4efe4",
  },

  invoiceSupplierText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
  },

  divider: {
    height: 0.5,
    backgroundColor: "#e4efe4",
    marginVertical: 10,
  },

  invRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },

  invLabel: {
    fontSize: 12,
    color: "#9ca3af",
    fontWeight: "600",
  },

  invVal: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
  },

  invTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  invTotalLabel: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1a2e1a",
  },

  invTotalVal: {
    fontSize: 18,
    fontWeight: "800",
    color: "#047857",
    letterSpacing: -0.4,
  },

  downloadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#f0fdf4",
    borderWidth: 0.5,
    borderColor: "#d1fae5",
    borderRadius: 12,
    paddingVertical: 12,
  },

  downloadBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#047857",
  },

  // ── EMPTY
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 40,
  },

  emptyIconBox: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#374151",
  },

  emptySub: {
    fontSize: 13,
    color: "#9ca3af",
    textAlign: "center",
    lineHeight: 18,
  },
});