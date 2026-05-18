import React, { useState, useEffect, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, ScrollView, Alert, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { transporterApi, ApiMission, ApiVehicle } from "../../apis/transporter.api";
import { useAuth } from "../../context/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { styles, TabKey } from "./MissionShared";
import { LiveDot, MapArea, MissionCard, AvailableCard, VehicleSelectionModal, MissionStepper } from "./MissionComponents";

// ─── main screen ─────────────────────────────────────────────────────────────

export default function MissionManagementScreen() {
  const [activeTab, setActiveTab] = useState<TabKey>("missions");
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const navigation = useNavigation<any>();

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

  const totalEarned = completedMissions.reduce((sum, m) => sum + (Number(m.order_total_price) || 0), 0);

  const getDistance = (lat1: number | null, lon1: number | null, lat2: number | null, lon2: number | null) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
    const p = 0.017453292519943295;
    const c = Math.cos;
    const a = 0.5 - c((lat2 - lat1) * p)/2 + c(lat1 * p) * c(lat2 * p) * (1 - c((lon2 - lon1) * p))/2;
    return 12742 * Math.asin(Math.sqrt(a));
  };

  const totalKm = completedMissions.reduce((sum, m) => sum + getDistance(m.pickup_latitude, m.pickup_longitude, m.delivery_latitude, m.delivery_longitude), 0);

  const onTimeCount = completedMissions.filter(m => {
    if (!m.accepted_at || !m.delivered_at) return true;
    const accepted = new Date(m.accepted_at).getTime();
    const delivered = new Date(m.delivered_at).getTime();
    return (delivered - accepted) <= 3 * 24 * 60 * 60 * 1000;
  }).length;
  const onTimePercentage = completedMissions.length > 0 ? Math.round((onTimeCount / completedMissions.length) * 100) : 100;

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
            <TouchableOpacity
              style={styles.notifBtn}
              onPress={() => navigation.navigate("Profile", { screen: "Notifications" })}
            >
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
                {totalEarned.toFixed(0)}DA
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

