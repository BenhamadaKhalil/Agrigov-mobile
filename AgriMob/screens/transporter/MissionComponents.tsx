import React, { useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, Animated, Easing, FlatList, Modal, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { ApiMission, ApiVehicle } from "../../apis/transporter.api";
import { styles, getStatusDisplay, getCargoTypeFromOrder, getCargoBadgeStyle, MissionStatus, CargoType } from "./MissionShared";

// ─── sub-components ───────────────────────────────────────────────────────────

export const LiveDot = () => {
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

export const MissionStepper = ({ status }: { status: MissionStatus }) => {
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

export const RouteVisual = ({
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

export const AvailRoute = ({ pickup, dropoff }: { pickup: string; dropoff: string }) => (
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

export const MapArea = ({ missions }: { missions: ApiMission[] }) => {
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

export const MissionCard = ({
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

export const AvailableCard = ({
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

export const VehicleSelectionModal = ({ visible, vehicles, onSelect, onCancel }: VehicleSelectionModalProps) => {
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

