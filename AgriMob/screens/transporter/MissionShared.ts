import { StyleSheet } from "react-native";
import { ApiMission } from "../../apis/transporter.api";

// ─── types ────────────────────────────────────────────────────────────────────

export type TabKey = "missions" | "available" | "history";
export type CargoType = "Perishable" | "Fragile" | "Dry Goods" | "Bulk";
export type MissionStatus = "pending" | "accepted" | "picked_up" | "in_transit" | "delivered" | "cancelled";

export interface MissionCardData {
  id: string;
  orderId: string;
  title: string;
  status: MissionStatus;
  payout: number;
  pickup: string;
  dropoff: string;
  cargo: string;
  cargoType: CargoType;
  weight: string;
  distance: string;
  eta?: string;
  routeProgress?: number;
}

export interface AvailableMissionCard {
  id: string;
  title: string;
  cargoType: CargoType;
  cargo: string;
  payout: number;
  weight: string;
  distance: string;
  eta: string;
  pickup: string;
  dropoff: string;
}

export interface HistoryItem {
  id: string;
  orderId: string;
  date: string;
  title: string;
  buyer: string;
  weight: string;
  payout: number;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

export function getStatusDisplay(status: MissionStatus): { label: string; bg: string; text: string } {
  const map: Record<MissionStatus, { label: string; bg: string; text: string }> = {
    pending: { label: "Pending", bg: "#fef3c7", text: "#92400e" },
    accepted: { label: "Accepted", bg: "#dbeafe", text: "#1e40af" },
    picked_up: { label: "Picked Up", bg: "#e0e7ff", text: "#3730a3" },
    in_transit: { label: "In Transit", bg: "#d1fae5", text: "#047857" },
    delivered: { label: "Delivered", bg: "#dcfce7", text: "#166534" },
    cancelled: { label: "Cancelled", bg: "#fee2e2", text: "#991b1b" },
  };
  return map[status] || { label: status, bg: "#f3f4f6", text: "#6b7280" };
}

export function getCargoTypeFromOrder(orderTotalPrice?: number | null, notes?: string): CargoType {
  const noteLower = (notes || "").toLowerCase();
  if (noteLower.includes("tomato") || noteLower.includes("fresh") || noteLower.includes("perish")) return "Perishable";
  if (noteLower.includes("egg") || noteLower.includes("glass") || noteLower.includes("fragile")) return "Fragile";
  if (noteLower.includes("grain") || noteLower.includes("wheat") || noteLower.includes("rice") || noteLower.includes("bulk")) return "Bulk";
  return "Dry Goods";
}

export function getCargoBadgeStyle(type: CargoType) {
  if (type === "Perishable") return { bg: "#dcfce7", text: "#166534", icon: "eco" as const };
  if (type === "Fragile")    return { bg: "#fef3c7", text: "#92400e", icon: "warning" as const };
  if (type === "Dry Goods")  return { bg: "#e0f2fe", text: "#075985", icon: "inventory-2" as const };
  return                            { bg: "#f3f4f6", text: "#374151", icon: "category" as const };
}

export function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
}

export function formatWeight(kg: number): string {
  return kg >= 1000 ? `${(kg / 1000).toFixed(2)} Tons` : `${kg} kg`;
}

export function calculateETA(pickupAddress: string, deliveryAddress: string): string {
  // Simple estimate based on address length (placeholder - should use real distance)
  const baseMins = 30 + Math.floor(Math.random() * 60);
  return `~${baseMins} min`;
}

export function parseAddressToCoords(address: string): { lat: number; lng: number } | null {
  // Placeholder - backend should provide coordinates
  return null;
}


export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f8f5" },

  // ── TOP BAR
  topBar: {
    backgroundColor: "#047857",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
  },

  tbRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  tbSubtitle: {
    fontSize: 9,
    fontWeight: "700",
    color: "#a7f3d0",
    letterSpacing: 1,
    marginBottom: 2,
  },

  tbTitle: { fontSize: 20, fontWeight: "800", color: "#fff", letterSpacing: -0.5 },

  tbRight: { flexDirection: "row", alignItems: "center", gap: 8 },

  onlinePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },

  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#0df20d" },

  onlineText: { fontSize: 11, fontWeight: "700", color: "#fff" },

  notifBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  notifDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#ef4444",
    borderWidth: 1.5,
    borderColor: "#047857",
  },

  statsRow: { flexDirection: "row", gap: 10 },

  statMini: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    padding: 10,
  },

  statMiniLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#a7f3d0",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 3,
  },

  statMiniVal: { fontSize: 20, fontWeight: "800", color: "#fff", letterSpacing: -0.4 },
  statMiniSub: { fontSize: 10, color: "#a7f3d0", marginTop: 2 },

  // ── TABS
  tabsWrap: {
    backgroundColor: "#fff",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e4efe4",
    paddingHorizontal: 16,
    paddingTop: 4,
  },

  tabs: { flexDirection: "row", gap: 0 },

  tab: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 2.5,
    borderBottomColor: "transparent",
    marginBottom: -0.5,
  },

  tabActive: { borderBottomColor: "#0df20d" },

  tabText: { fontSize: 12, fontWeight: "700", color: "#9ca3af" },
  tabTextActive: { color: "#047857" },

  // ── LIST
  listContent: { padding: 14, paddingTop: 14 },

  sectionHead: {
    fontSize: 10,
    fontWeight: "700",
    color: "#9ca3af",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 10,
    marginTop: 4,
  },

  // ── MAP
  mapArea: {
    height: 200,
    backgroundColor: "#e8f0e8",
    borderRadius: 16,
    marginBottom: 14,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: "#d4e8d4",
  },

  mapGrid: {
    backgroundColor: "#eaf3ea",
  },

  mapRoadH: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "38%",
    height: 10,
    backgroundColor: "#fff",
    borderRadius: 2,
  },

  mapRoadV: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: "52%",
    width: 8,
    backgroundColor: "#fff",
    borderRadius: 2,
  },

  mapRiver: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: "22%",
    height: 14,
    backgroundColor: "#bfdbfe",
    borderRadius: 4,
    transform: [{ skewY: "-2deg" }],
  },

  mapPin: {
    position: "absolute",
    alignItems: "center",
  },

  mapPinCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },

  mapPinStem: {
    width: 3,
    height: 8,
    borderRadius: 2,
    marginTop: -2,
  },

  mapEtaPill: {
    position: "absolute",
    top: 8,
    right: 10,
    backgroundColor: "rgba(4,120,87,0.92)",
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  mapLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#0df20d",
  },

  mapEtaText: { fontSize: 12, fontWeight: "800", color: "#fff" },

  // ── ACTIVE MISSION
  activeMissionCard: {
    backgroundColor: "#047857",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },

  amHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  amId: { fontSize: 10, fontWeight: "700", color: "#a7f3d0", letterSpacing: 0.4, textTransform: "uppercase" },

  amTransitBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },

  amTransitText: { fontSize: 10, fontWeight: "700", color: "#fff" },

  amTitle: { fontSize: 16, fontWeight: "800", color: "#fff", letterSpacing: -0.3, marginBottom: 2 },
  amRoute: { fontSize: 11, color: "#a7f3d0", marginBottom: 2 },

  // ── STEPPER
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 14,
  },

  stepItem: { alignItems: "center", gap: 4 },

  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  stepCircleDone:     { backgroundColor: "#0df20d" },
  stepCircleActive:   { backgroundColor: "rgba(13,242,13,0.2)", borderWidth: 2, borderColor: "#0df20d" },
  stepCircleInactive: { backgroundColor: "rgba(255,255,255,0.1)", borderWidth: 2, borderColor: "rgba(255,255,255,0.2)" },

  stepLabel: { fontSize: 9, fontWeight: "600", color: "#a7f3d0" },

  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginHorizontal: 4,
    marginBottom: 14,
  },

  stepLineDone: { backgroundColor: "#0df20d" },

  updateStatusBtn: {
    backgroundColor: "#0df20d",
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  updateStatusText: { fontSize: 14, fontWeight: "800", color: "#065f46" },

  // ── MISSION CARD
  missionCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: "#e4efe4",
    overflow: "hidden",
  },

  mcAccent: { position: "absolute", left: 0, top: 0, bottom: 0, width: 4 },

  mcTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
    paddingLeft: 20,
  },

  mcOrderId: { fontSize: 10, fontWeight: "700", color: "#047857", marginBottom: 2 },
  mcTitle: { fontSize: 15, fontWeight: "800", color: "#1a2e1a", letterSpacing: -0.2 },
  mcPayout: { fontSize: 18, fontWeight: "800", color: "#0df20d", letterSpacing: -0.4 },
  mcPayoutLbl: { fontSize: 9, color: "#9ca3af", textAlign: "right" },

  cargoPills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    paddingHorizontal: 16,
    paddingLeft: 20,
    marginBottom: 10,
    marginTop: 6,
  },

  cargoPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },

  cargoPillText: { fontSize: 11, fontWeight: "700" },

  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f8faf8",
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 0.5,
    borderColor: "#e4efe4",
  },

  metaPillText: { fontSize: 11, fontWeight: "600", color: "#6b7280" },

  // ── ROUTE VISUAL
  routeVisual: {
    backgroundColor: "#f8faf8",
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 12,
    marginBottom: 10,
    position: "relative",
  },

  routeLineTrack: {
    position: "absolute",
    left: 20,
    top: 24,
    bottom: 24,
    width: 2,
    backgroundColor: "#e5e7eb",
    borderRadius: 1,
  },

  routeLineFill: {
    position: "absolute",
    left: 20,
    top: 24,
    width: 2,
    backgroundColor: "#0df20d",
    borderRadius: 1,
  },

  routeStop: { flexDirection: "row", alignItems: "center", gap: 10 },

  routeDotFrom: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#6b7280",
    borderWidth: 2,
    borderColor: "#fff",
    zIndex: 1,
  },

  routeDotTo: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#0df20d",
    borderWidth: 2,
    borderColor: "#fff",
    zIndex: 1,
  },

  routeStopLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#9ca3af",
    letterSpacing: 0.3,
    textTransform: "uppercase",
    marginBottom: 1,
  },

  routeStopName: { fontSize: 13, fontWeight: "700", color: "#1a2e1a" },

  mcFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 0.5,
    borderTopColor: "#f3f4f6",
  },

  mcBadge: {
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },

  mcBadgeText: { fontSize: 10, fontWeight: "700" },

  actionBtn: {
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  btnContinue: { backgroundColor: "#0df20d", borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 6 },
  btnView: { backgroundColor: "#f0faf0", borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16 },

  actionBtnText: { fontSize: 12, fontWeight: "800", color: "#065f46" },

  // ── AVAILABLE CARD
  availCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: "#e4efe4",
  },

  availBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    borderRadius: 20,
    paddingVertical: 3,
    paddingHorizontal: 10,
    marginBottom: 4,
  },

  availBadgeText: { fontSize: 10, fontWeight: "700" },
  availEarn: { fontSize: 20, fontWeight: "800", color: "#0df20d", letterSpacing: -0.4 },

  availRoute: {
    backgroundColor: "#f8faf8",
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    position: "relative",
  },

  availRouteLine: {
    position: "absolute",
    left: 17,
    top: 20,
    bottom: 20,
    width: 1.5,
    borderLeftWidth: 1.5,
    borderLeftColor: "#d1d5db",
    borderStyle: "dashed",
  },

  availStopText: { fontSize: 12, fontWeight: "600", color: "#374151" },

  availBtnRow: { flexDirection: "row", gap: 8 },

  declineBtn: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    padding: 11,
    alignItems: "center",
  },

  declineBtnText: { fontSize: 13, fontWeight: "700", color: "#6b7280" },

  acceptBtn: {
    flex: 2,
    backgroundColor: "#0df20d",
    borderRadius: 10,
    padding: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  acceptBtnText: { fontSize: 13, fontWeight: "800", color: "#065f46" },

  // ── HISTORY
  historyCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: "#e4efe4",
    overflow: "hidden",
    marginBottom: 14,
  },

  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
  },

  historyRowBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: "#f3f4f6",
  },

  historyIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#d1fae5",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  historyOrderId: { fontSize: 10, fontWeight: "700", color: "#9ca3af", marginBottom: 2 },
  historyTitle:   { fontSize: 14, fontWeight: "700", color: "#1a2e1a" },
  historySub:     { fontSize: 11, color: "#9ca3af", marginTop: 2 },

  historyPayout:    { fontSize: 16, fontWeight: "800", color: "#047857" },
  historyDelivered: { fontSize: 10, color: "#9ca3af", marginTop: 2 },

  // ── WEEKLY SUMMARY
  weeklySummary: {
    backgroundColor: "#047857",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },

  weeklyHeading: {
    fontSize: 10,
    fontWeight: "700",
    color: "#a7f3d0",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 10,
  },

  weeklyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  weeklyCell: {
    width: "47%",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 12,
    padding: 12,
  },

  weeklyCellLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#a7f3d0",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 4,
  },

  weeklyCellVal:       { fontSize: 20, fontWeight: "800", color: "#fff", letterSpacing: -0.3 },
  weeklyCellHighlight: { color: "#0df20d" },

  // ── EMPTY STATE
  emptyState: {
    alignItems: "center",
    paddingVertical: 50,
    gap: 8,
  },

  emptyTitle: { fontSize: 15, fontWeight: "700", color: "#9ca3af" },
  emptySub:   { fontSize: 12, color: "#c4c4c4", textAlign: "center", paddingHorizontal: 32 },

  // ── MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },

  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "70%",
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1a2e1a",
  },

  modalSubtitle: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 16,
  },

  vehicleList: {
    paddingBottom: 8,
  },

  vehicleOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginBottom: 4,
  },

  vehicleIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#d1fae5",
    alignItems: "center",
    justifyContent: "center",
  },

  vehicleInfo: {
    flex: 1,
  },

  vehicleType: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1a2e1a",
  },

  vehicleDetail: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
});
