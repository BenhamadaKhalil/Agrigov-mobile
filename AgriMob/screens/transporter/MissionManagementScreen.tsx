// screens/MissionManagementScreen.tsx

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Animated,
  Easing,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";

import { transporterApi, ApiMission, ApiVehicle } from "../../apis/transporter.api";
import { useAuth } from "../../context/AuthContext";

// ─── types ────────────────────────────────────────────────────────────────────

type TabKey = "missions" | "available" | "history";
type CargoType = "Perishable" | "Fragile" | "Dry Goods" | "Bulk";
type MissionStatus = "pending" | "accepted" | "picked_up" | "in_transit" | "delivered" | "cancelled";

interface MissionCardData {
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

interface AvailableMissionCard {
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

interface HistoryItem {
  id: string;
  orderId: string;
  date: string;
  title: string;
  buyer: string;
  weight: string;
  payout: number;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function getStatusDisplay(status: MissionStatus): { label: string; bg: string; text: string } {
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

function getCargoTypeFromOrder(orderTotalPrice?: number | null, notes?: string): CargoType {
  const noteLower = (notes || "").toLowerCase();
  if (noteLower.includes("tomato") || noteLower.includes("fresh") || noteLower.includes("perish")) return "Perishable";
  if (noteLower.includes("egg") || noteLower.includes("glass") || noteLower.includes("fragile")) return "Fragile";
  if (noteLower.includes("grain") || noteLower.includes("wheat") || noteLower.includes("rice") || noteLower.includes("bulk")) return "Bulk";
  return "Dry Goods";
}

function getCargoBadgeStyle(type: CargoType) {
  if (type === "Perishable") return { bg: "#dcfce7", text: "#166534", icon: "eco" as const };
  if (type === "Fragile")    return { bg: "#fef3c7", text: "#92400e", icon: "warning" as const };
  if (type === "Dry Goods")  return { bg: "#e0f2fe", text: "#075985", icon: "inventory-2" as const };
  return                            { bg: "#f3f4f6", text: "#374151", icon: "category" as const };
}

function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
}

function formatWeight(kg: number): string {
  return kg >= 1000 ? `${(kg / 1000).toFixed(2)} Tons` : `${kg} kg`;
}

function calculateETA(pickupAddress: string, deliveryAddress: string): string {
  // Simple estimate based on address length (placeholder - should use real distance)
  const baseMins = 30 + Math.floor(Math.random() * 60);
  return `~${baseMins} min`;
}

function parseAddressToCoords(address: string): { lat: number; lng: number } | null {
  // Placeholder - backend should provide coordinates
  return null;
}

// ─── sub-components ───────────────────────────────────────────────────────────

const LiveDot = () => {
  const opacity = useRef(new Animated.Value(1)).current;
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.3, duration: 750, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(opacity, { toValue: 1,   duration: 750, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ])
    ).start();
  }, [opacity]);
  return <Animated.View style={[styles.liveDot, { opacity }]} />;
};

const MissionStepper = ({ status }: { status: MissionStatus }) => {
  const steps: Array<{ label: string; status: MissionStatus }> = [
    { label: "Accepted", status: "accepted" },
    { label: "Picked Up", status: "picked_up" },
    { label: "In Transit", status: "in_transit" },
    { label: "Delivered", status: "delivered" },
  ];

  const currentIndex = steps.findIndex(s => s.status === status);
  const effectiveIndex = currentIndex < 0 ? 0 : currentIndex;

  return (
    <View style={styles.stepper}>
      {steps.map((s, i) => {
        const isDone = i < effectiveIndex || (status === "delivered");
        const isActive = i === effectiveIndex && status !== "delivered";
        return (
          <React.Fragment key={s.label}>
            <View style={styles.stepItem}>
              <View
                style={[
                  styles.stepCircle,
                  isDone   && styles.stepCircleDone,
                  isActive && styles.stepCircleActive,
                  !isDone && !isActive && styles.stepCircleInactive,
                ]}
              >
                {isDone ? (
                  <MaterialIcons name="check" size={12} color="#065f46" />
                ) : isActive ? (
                  <MaterialIcons name="cached" size={12} color="#a7f3d0" />
                ) : null}
              </View>
              <Text style={styles.stepLabel}>{s.label}</Text>
            </View>
            {i < steps.length - 1 && (
              <View style={[styles.stepLine, isDone && styles.stepLineDone]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
};

const RouteVisual = ({
  pickup,
  dropoff,
  progress = 0,
}: {
  pickup: string;
  dropoff: string;
  progress?: number;
}) => (
  <View style={styles.routeVisual}>
    <View style={styles.routeLineTrack} />
    <View style={[styles.routeLineFill, { height: 52 * progress }]} />
    <View style={styles.routeStop}>
      <View style={styles.routeDotFrom} />
      <View style={{ flex: 1 }}>
        <Text style={styles.routeStopLabel}>Pickup</Text>
        <Text style={styles.routeStopName}>{pickup}</Text>
      </View>
    </View>
    <View style={{ height: 20 }} />
    <View style={styles.routeStop}>
      <View style={styles.routeDotTo} />
      <View style={{ flex: 1 }}>
        <Text style={styles.routeStopLabel}>Dropoff</Text>
        <Text style={styles.routeStopName}>{dropoff}</Text>
      </View>
    </View>
  </View>
);

const AvailRoute = ({ pickup, dropoff }: { pickup: string; dropoff: string }) => (
  <View style={styles.availRoute}>
    <View style={styles.availRouteLine} />
    <View style={styles.routeStop}>
      <View style={[styles.routeDotFrom, { backgroundColor: "#9ca3af" }]} />
      <Text style={styles.availStopText}>{pickup}</Text>
    </View>
    <View style={{ height: 14 }} />
    <View style={styles.routeStop}>
      <View style={styles.routeDotTo} />
      <Text style={styles.availStopText}>{dropoff}</Text>
    </View>
  </View>
);

// ─── map area ────────────────────────────────────────────────────────────────

// Default center (Algeria ~center)
const DEFAULT_REGION = {
  latitude: 36.75,
  longitude: 3.05,
  latitudeDelta: 0.5,
  longitudeDelta: 0.5,
};

const MapArea = ({ missions }: { missions: ApiMission[] }) => {
  const mapRef = useRef<MapView>(null);
  const activeMission = missions.find(m => m.status === "in_transit" || m.status === "picked_up");

  // All missions with coordinates (for markers)
  const missionsWithCoords = missions.filter(
    m => m.pickup_latitude && m.pickup_longitude && ["accepted", "picked_up", "in_transit"].includes(m.status)
  );

  // Fit map to markers when data changes
  useEffect(() => {
    if (!mapRef.current) return;
    if (activeMission?.pickup_latitude && activeMission?.delivery_latitude) {
      const coords = [
        { latitude: activeMission.pickup_latitude, longitude: activeMission.pickup_longitude! },
        { latitude: activeMission.delivery_latitude, longitude: activeMission.delivery_longitude! },
      ];
      setTimeout(() => {
        mapRef.current?.fitToCoordinates(coords, {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true,
        });
      }, 500);
    } else if (missionsWithCoords.length > 0) {
      const coords = missionsWithCoords
        .filter(m => m.pickup_latitude && m.pickup_longitude)
        .map(m => ({ latitude: m.pickup_latitude!, longitude: m.pickup_longitude! }));
      if (coords.length > 0) {
        setTimeout(() => {
          mapRef.current?.fitToCoordinates(coords, {
            edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
            animated: true,
          });
        }, 500);
      }
    }
  }, [activeMission, missionsWithCoords.length]);

  if (!activeMission && missionsWithCoords.length === 0) {
    return (
      <View style={[styles.mapArea, { alignItems: "center", justifyContent: "center" }]}>
        <MaterialIcons name="map" size={48} color="#9ca3af" />
        <Text style={{ color: "#9ca3af", marginTop: 8, fontWeight: "600" }}>No active route</Text>
      </View>
    );
  }

  const initialRegion = activeMission?.pickup_latitude
    ? {
        latitude: activeMission.pickup_latitude,
        longitude: activeMission.pickup_longitude!,
        latitudeDelta: 0.15,
        longitudeDelta: 0.15,
      }
    : missionsWithCoords[0]?.pickup_latitude
    ? {
        latitude: missionsWithCoords[0].pickup_latitude,
        longitude: missionsWithCoords[0].pickup_longitude!,
        latitudeDelta: 0.15,
        longitudeDelta: 0.15,
      }
    : DEFAULT_REGION;

  return (
    <View style={styles.mapArea}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton={false}
        customMapStyle={mapStyle}
      >
        {/* Active mission markers + route line */}
        {activeMission?.pickup_latitude && activeMission?.pickup_longitude && (
          <Marker
            coordinate={{
              latitude: activeMission.pickup_latitude,
              longitude: activeMission.pickup_longitude,
            }}
            title="Pickup"
            description={activeMission.pickup_address}
            pinColor="#047857"
          />
        )}
        {activeMission?.delivery_latitude && activeMission?.delivery_longitude && (
          <Marker
            coordinate={{
              latitude: activeMission.delivery_latitude,
              longitude: activeMission.delivery_longitude,
            }}
            title="Delivery"
            description={activeMission.delivery_address}
            pinColor="#ef4444"
          />
        )}
        {activeMission?.pickup_latitude && activeMission?.delivery_latitude && (
          <Polyline
            coordinates={[
              { latitude: activeMission.pickup_latitude, longitude: activeMission.pickup_longitude! },
              { latitude: activeMission.delivery_latitude, longitude: activeMission.delivery_longitude! },
            ]}
            strokeColor="#047857"
            strokeWidth={3}
            lineDashPattern={[8, 6]}
          />
        )}

        {/* Other missions markers */}
        {missionsWithCoords
          .filter(m => m.id !== activeMission?.id)
          .map(m => (
            <React.Fragment key={m.id}>
              {m.pickup_latitude && m.pickup_longitude && (
                <Marker
                  coordinate={{ latitude: m.pickup_latitude, longitude: m.pickup_longitude }}
                  title={`Order #${m.order}`}
                  description={m.pickup_address}
                  pinColor="#6b7280"
                  opacity={0.7}
                />
              )}
            </React.Fragment>
          ))}
      </MapView>

      {/* ETA overlay pill */}
      {activeMission && (
        <View style={styles.mapEtaPill}>
          <View style={styles.mapLiveDot} />
          <Text style={styles.mapEtaText}>
            {activeMission.status === "in_transit" ? "In Transit" : "Picked Up"}
          </Text>
        </View>
      )}
    </View>
  );
};

// Google Maps custom style (subtle green tint)
const mapStyle = [
  { elementType: "geometry", stylers: [{ color: "#f0f7f0" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#374151" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#d1d5db" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#e2e8f0" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#bfdbfe" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#d1fae5" }] },
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
];

// ─── mission card ─────────────────────────────────────────────────────────────

const MissionCard = ({
  mission,
  onUpdateStatus
}: {
  mission: ApiMission;
  onUpdateStatus: (id: number, newStatus: "picked_up" | "in_transit" | "delivered") => void;
}) => {
  const badge = getStatusDisplay(mission.status);
  const cargoType = getCargoTypeFromOrder(undefined, mission.notes);
  const cargo = getCargoBadgeStyle(cargoType);

  const canUpdate = ["accepted", "picked_up", "in_transit"].includes(mission.status);

  const handleStatusUpdate = () => {
    if (mission.status === "accepted") {
      onUpdateStatus(mission.id, "picked_up");
    } else if (mission.status === "picked_up") {
      onUpdateStatus(mission.id, "in_transit");
    } else if (mission.status === "in_transit") {
      onUpdateStatus(mission.id, "delivered");
    }
  };

  return (
    <View style={styles.missionCard}>
      <View style={[styles.mcAccent, { backgroundColor: badge.text }]} />

      <View style={styles.mcTop}>
        <View>
          <Text style={styles.mcOrderId}>Order #{mission.order}</Text>
          <Text style={styles.mcTitle}>{mission.pickup_address.split(",")[0] || "Delivery"}</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={styles.mcPayout}>${mission.order_total_price ? Number(mission.order_total_price).toFixed(0) : "—"}</Text>
          <Text style={styles.mcPayoutLbl}>Payout</Text>
        </View>
      </View>

      <View style={styles.cargoPills}>
        <View style={[styles.cargoPill, { backgroundColor: cargo.bg }]}>
          <MaterialIcons name={cargo.icon} size={12} color={cargo.text} />
          <Text style={[styles.cargoPillText, { color: cargo.text }]}>{cargoType}</Text>
        </View>
        <View style={styles.metaPill}>
          <MaterialIcons name="route" size={11} color="#6b7280" />
          <Text style={styles.metaPillText}>{mission.wilaya}</Text>
        </View>
        {mission.vehicle_info && (
          <View style={styles.metaPill}>
            <MaterialIcons name="local-shipping" size={11} color="#6b7280" />
            <Text style={styles.metaPillText}>{mission.vehicle_info}</Text>
          </View>
        )}
      </View>

      <RouteVisual
        pickup={mission.pickup_address}
        dropoff={mission.delivery_address}
        progress={mission.status === "delivered" ? 1 : mission.status === "in_transit" ? 0.7 : mission.status === "picked_up" ? 0.3 : 0}
      />

      <View style={styles.mcFooter}>
        <View style={[styles.mcBadge, { backgroundColor: badge.bg }]}>
          <Text style={[styles.mcBadgeText, { color: badge.text }]}>{badge.label}</Text>
        </View>
        {canUpdate ? (
          <TouchableOpacity style={styles.btnContinue} onPress={handleStatusUpdate}>
            <Text style={styles.actionBtnText}>
              {mission.status === "accepted" ? "Mark Picked Up" : mission.status === "picked_up" ? "Mark In Transit" : "Mark Delivered"}
            </Text>
            <MaterialIcons name="arrow-forward" size={16} color="#065f46" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.btnView}>
            <Text style={[styles.actionBtnText, { color: "#047857" }]}>View Details</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const AvailableCard = ({
  mission,
  onAccept,
  onDecline,
}: {
  mission: ApiMission;
  onAccept: (id: number) => void;
  onDecline: (id: number) => void;
}) => {
  const cargoType = getCargoTypeFromOrder(undefined, mission.notes);
  const cargo = getCargoBadgeStyle(cargoType);

  return (
    <View style={styles.availCard}>
      <View style={styles.mcTop}>
        <View>
          <View style={[styles.availBadge, { backgroundColor: cargo.bg }]}>
            <MaterialIcons name={cargo.icon} size={11} color={cargo.text} />
            <Text style={[styles.availBadgeText, { color: cargo.text }]}>{cargoType}</Text>
          </View>
          <Text style={styles.mcTitle}>{mission.pickup_address.split(",")[0] || "Delivery"}</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={styles.availEarn}>${mission.order_total_price ? Number(mission.order_total_price).toFixed(0) : "—"}</Text>
          <Text style={styles.mcPayoutLbl}>Est. pay</Text>
        </View>
      </View>

      <View style={styles.cargoPills}>
        <View style={styles.metaPill}>
          <MaterialIcons name="place" size={11} color="#6b7280" />
          <Text style={styles.metaPillText}>{mission.wilaya}</Text>
        </View>
        {mission.baladiya && (
          <View style={styles.metaPill}>
            <MaterialIcons name="location-on" size={11} color="#6b7280" />
            <Text style={styles.metaPillText}>{mission.baladiya}</Text>
          </View>
        )}
      </View>

      <AvailRoute pickup={mission.pickup_address} dropoff={mission.delivery_address} />

      <View style={styles.availBtnRow}>
        <TouchableOpacity style={styles.declineBtn} onPress={() => onDecline(mission.id)}>
          <Text style={styles.declineBtnText}>Decline</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.acceptBtn} onPress={() => onAccept(mission.id)}>
          <MaterialIcons name="check-circle" size={15} color="#065f46" />
          <Text style={styles.acceptBtnText}>Accept Mission</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Vehicle Selection Modal ──────────────────────────────────────────────────

interface VehicleSelectionModalProps {
  visible: boolean;
  vehicles: ApiVehicle[];
  onSelect: (vehicleId?: number) => void;
  onCancel: () => void;
}

const VehicleSelectionModal = ({ visible, vehicles, onSelect, onCancel }: VehicleSelectionModalProps) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Vehicle</Text>
            <TouchableOpacity onPress={onCancel}>
              <MaterialIcons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalSubtitle}>Choose a vehicle for this mission (optional)</Text>

          <FlatList
            data={vehicles}
            keyExtractor={(item) => String(item.id)}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.vehicleList}
            ListHeaderComponent={
              <TouchableOpacity
                style={styles.vehicleOption}
                onPress={() => onSelect(undefined)}
              >
                <View style={styles.vehicleIconBox}>
                  <MaterialIcons name="local-shipping" size={24} color="#047857" />
                </View>
                <View style={styles.vehicleInfo}>
                  <Text style={styles.vehicleType}>No vehicle specified</Text>
                  <Text style={styles.vehicleDetail}>Accept without assigning a vehicle</Text>
                </View>
              </TouchableOpacity>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.vehicleOption}
                onPress={() => onSelect(item.id)}
              >
                <View style={styles.vehicleIconBox}>
                  <MaterialIcons name="directions-car" size={24} color="#047857" />
                </View>
                <View style={styles.vehicleInfo}>
                  <Text style={styles.vehicleType}>{item.type} - {item.model}</Text>
                  <Text style={styles.vehicleDetail}>{item.year} · {item.capacity} tons capacity</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );
};

// ─── main screen ─────────────────────────────────────────────────────────────

export default function MissionManagementScreen() {
  const [activeTab, setActiveTab] = useState<TabKey>("missions");
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Data
  const [availableMissions, setAvailableMissions] = useState<ApiMission[]>([]);
  const [myMissions, setMyMissions] = useState<ApiMission[]>([]);
  const [vehicles, setVehicles] = useState<ApiVehicle[]>([]);

  // Vehicle selection for accepting
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [pendingMissionId, setPendingMissionId] = useState<number | null>(null);

  const { user } = useAuth();

  // ─── Fetch data ─────────────────────────────────────────────────────────────

  const fetchAvailableMissions = useCallback(async () => {
    try {
      const res: any = await transporterApi.availableMissions();
      const missions = res?.results ?? res ?? [];
      setAvailableMissions(Array.isArray(missions) ? missions : []);
    } catch (err: any) {
      console.error("Failed to fetch available missions:", err.message);
      setAvailableMissions([]);
    }
  }, []);

  const fetchMyMissions = useCallback(async () => {
    try {
      const res: any = await transporterApi.myMissions();
      const missions = res?.results ?? res ?? [];
      setMyMissions(Array.isArray(missions) ? missions : []);
    } catch (err: any) {
      console.error("Failed to fetch my missions:", err.message);
      setMyMissions([]);
    }
  }, []);

  const fetchVehicles = useCallback(async () => {
    try {
      const res: any = await transporterApi.myVehicles();
      const veh = res?.results ?? res ?? [];
      setVehicles(Array.isArray(veh) ? veh : []);
    } catch (err: any) {
      console.error("Failed to fetch vehicles:", err.message);
      setVehicles([]);
    }
  }, []);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchAvailableMissions(), fetchMyMissions(), fetchVehicles()]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // ─── Actions ────────────────────────────────────────────────────────────────

  const handleAcceptMission = (id: number) => {
    if (vehicles.length > 0) {
      // Show vehicle selection if user has vehicles
      setPendingMissionId(id);
      setShowVehicleModal(true);
    } else {
      // Accept without vehicle
      acceptMission(id, undefined);
    }
  };

  const acceptMission = async (id: number, vehicleId?: number) => {
    try {
      await transporterApi.acceptMission(id, vehicleId);
      Alert.alert("Success", "Mission accepted successfully", [
        { text: "OK", onPress: () => {
          setShowVehicleModal(false);
          setPendingMissionId(null);
          loadData();
          setActiveTab("missions");
        }}
      ]);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to accept mission");
    }
  };

  const handleDeclineMission = async (id: number) => {
    Alert.alert(
      "Decline Mission",
      "Are you sure you want to decline this mission?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Decline",
          style: "destructive",
          onPress: async () => {
            try {
              await transporterApi.declineMission(id);
              setAvailableMissions(prev => prev.filter(m => m.id !== id));
              Alert.alert("Success", "Mission declined");
            } catch (err: any) {
              Alert.alert("Error", err.message || "Failed to decline mission");
            }
          }
        }
      ]
    );
  };

  const handleUpdateStatus = async (id: number, newStatus: "picked_up" | "in_transit" | "delivered") => {
    Alert.alert(
      "Update Status",
      `Mark this mission as ${newStatus.replace("_", " ")}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            try {
              await transporterApi.updateStatus(id, newStatus);
              Alert.alert("Success", "Mission status updated", [
                { text: "OK", onPress: loadData }
              ]);
            } catch (err: any) {
              Alert.alert("Error", err.message || "Failed to update status");
            }
          }
        }
      ]
    );
  };

  // ─── Render helpers ─────────────────────────────────────────────────────────

  const activeMission = myMissions.find(m => ["in_transit", "picked_up"].includes(m.status));
  const upcomingMissions = myMissions.filter(m => ["accepted", "pending"].includes(m.status));
  const completedMissions = myMissions.filter(m => m.status === "delivered");

  const TABS: Array<{ key: TabKey; label: string; count?: number }> = [
    { key: "missions",  label: "My Missions", count: myMissions.length },
    { key: "available", label: "Available", count: availableMissions.length },
    { key: "history",   label: "History" },
  ];

  // ─── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator size="large" color="#047857" />
        <Text style={{ marginTop: 16, color: "#9ca3af" }}>Loading missions...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* ── TOP BAR ── */}
      <View style={styles.topBar}>
        <View style={styles.tbRow}>
          <View>
            <Text style={styles.tbSubtitle}>MISSION CONTROL</Text>
            <Text style={styles.tbTitle}>AgriLogistics</Text>
          </View>
          <View style={styles.tbRight}>
            <View style={styles.onlinePill}>
              <LiveDot />
              <Text style={styles.onlineText}>Online</Text>
            </View>
            <TouchableOpacity style={styles.notifBtn}>
              <MaterialIcons name="notifications" size={18} color="#fff" />
              <View style={styles.notifDot} />
            </TouchableOpacity>
          </View>
        </View>

        {/* STATS */}
        <View style={styles.statsRow}>
          <View style={styles.statMini}>
            <Text style={styles.statMiniLabel}>Earnings</Text>
            <Text style={styles.statMiniVal}>
              ${completedMissions.reduce((sum, m) => sum + (Number(m.order_total_price) || 0), 0).toFixed(0)}
            </Text>
            <Text style={styles.statMiniSub}>{completedMissions.length} delivered</Text>
          </View>
          <View style={styles.statMini}>
            <Text style={styles.statMiniLabel}>Missions</Text>
            <Text style={styles.statMiniVal}>{myMissions.length}</Text>
            <Text style={styles.statMiniSub}>
              {myMissions.filter(m => ["accepted", "picked_up", "in_transit"].includes(m.status)).length} active
            </Text>
          </View>
        </View>
      </View>

      {/* ── TABS ── */}
      <View style={styles.tabsWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.tabs}>
            {TABS.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                  {tab.label}{tab.count !== undefined ? ` (${tab.count})` : ""}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* ── MY MISSIONS ── */}
      {activeTab === "missions" && (
        <FlatList
          data={[...activeMission ? [activeMission] : [], ...upcomingMissions]}
          keyExtractor={(item) => String(item.id)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListHeaderComponent={
            <>
              <MapArea missions={myMissions} />

              {activeMission && (
                <>
                  <Text style={styles.sectionHead}>Active Mission</Text>
                  <View style={styles.activeMissionCard}>
                    <View style={styles.amHeader}>
                      <Text style={styles.amId}>Order #{activeMission.order}</Text>
                      <View style={styles.amTransitBadge}>
                        <Text style={styles.amTransitText}>
                          {activeMission.status === "in_transit" ? "In Transit" : "Picked Up"}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.amTitle}>{activeMission.pickup_address.split(",")[0]}</Text>
                    <Text style={styles.amRoute}>
                      {activeMission.pickup_address} → {activeMission.delivery_address}
                    </Text>
                    <MissionStepper status={activeMission.status} />
                    {activeMission.status !== "delivered" && (
                      <TouchableOpacity
                        style={styles.updateStatusBtn}
                        onPress={() => handleUpdateStatus(
                          activeMission.id,
                          activeMission.status === "accepted"
                            ? "picked_up"
                            : activeMission.status === "picked_up"
                            ? "in_transit"
                            : "delivered"
                        )}
                      >
                        <Text style={styles.updateStatusText}>Update Status</Text>
                        <MaterialIcons name="arrow-forward" size={16} color="#065f46" />
                      </TouchableOpacity>
                    )}
                  </View>
                </>
              )}

              {upcomingMissions.length > 0 && (
                <Text style={styles.sectionHead}>
                  {activeMission ? "Other Missions" : "Your Missions"}
                </Text>
              )}
            </>
          }
          renderItem={({ item }) =>
            item.id !== activeMission?.id ? (
              <MissionCard mission={item} onUpdateStatus={handleUpdateStatus} />
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialIcons name="inventory-2" size={36} color="#d1d5db" />
              <Text style={styles.emptyTitle}>No missions yet</Text>
              <Text style={styles.emptySub}>Accept missions from the Available tab to see them here</Text>
            </View>
          }
          ListFooterComponent={<View style={{ height: 24 }} />}
        />
      )}

      {/* ── AVAILABLE ── */}
      {activeTab === "available" && (
        <FlatList
          data={availableMissions}
          keyExtractor={(item) => String(item.id)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListHeaderComponent={
            <Text style={styles.sectionHead}>
              Nearby Requests · {availableMissions.length} available
            </Text>
          }
          renderItem={({ item }) => (
            <AvailableCard
              mission={item}
              onAccept={handleAcceptMission}
              onDecline={handleDeclineMission}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialIcons name="search-off" size={36} color="#d1d5db" />
              <Text style={styles.emptyTitle}>No missions nearby</Text>
              <Text style={styles.emptySub}>Check back soon or expand your search radius</Text>
            </View>
          }
          ListFooterComponent={<View style={{ height: 24 }} />}
        />
      )}

      {/* ── HISTORY ── */}
      {activeTab === "history" && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <Text style={styles.sectionHead}>Completed Missions</Text>
          {completedMissions.length > 0 ? (
            <View style={styles.historyCard}>
              {completedMissions.map((item, i) => (
                <View
                  key={item.id}
                  style={[
                    styles.historyRow,
                    i < completedMissions.length - 1 && styles.historyRowBorder,
                  ]}
                >
                  <View style={styles.historyIconBox}>
                    <MaterialIcons name="check-circle" size={18} color="#047857" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyOrderId}>
                      Order #{item.order} · {new Date(item.delivered_at || item.created_at).toLocaleDateString()}
                    </Text>
                    <Text style={styles.historyTitle}>{item.pickup_address.split(",")[0]}</Text>
                    <Text style={styles.historySub}>
                      {item.wilaya} · {item.vehicle_info || "No vehicle"}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.historyPayout}>${Number(item.order_total_price || 0).toFixed(0)}</Text>
                    <Text style={styles.historyDelivered}>Delivered</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="history" size={36} color="#d1d5db" />
              <Text style={styles.emptyTitle}>No completed missions</Text>
              <Text style={styles.emptySub}>Your completed missions will appear here</Text>
            </View>
          )}

          {/* WEEKLY SUMMARY */}
          <Text style={styles.sectionHead}>Weekly Summary</Text>
          <View style={styles.weeklySummary}>
            <Text style={styles.weeklyHeading}>Performance</Text>
            <View style={styles.weeklyGrid}>
              {[
                { label: "Total Earned", value: "$2,400" },
                { label: "Missions Done", value: String(completedMissions.length) },
                { label: "Km Driven", value: "312 km" },
                { label: "On-Time", value: "100%", highlight: true },
              ].map((s) => (
                <View key={s.label} style={styles.weeklyCell}>
                  <Text style={styles.weeklyCellLabel}>{s.label}</Text>
                  <Text style={[styles.weeklyCellVal, s.highlight && styles.weeklyCellHighlight]}>
                    {s.value}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>
      )}

      {/* Vehicle Selection Modal */}
      <VehicleSelectionModal
        visible={showVehicleModal}
        vehicles={vehicles}
        onSelect={(vehicleId) => {
          if (pendingMissionId) {
            acceptMission(pendingMissionId, vehicleId);
          }
        }}
        onCancel={() => {
          setShowVehicleModal(false);
          setPendingMissionId(null);
        }}
      />
    </SafeAreaView>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
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
