// screens/ProfileScreen.tsx

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, CommonActions } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "../../context/AuthContext";
import { profileApi } from "../../apis/profile.api";
import { notificationApi } from "../../apis/notification.api";
import { transporterApi, ApiMission } from "../../apis/transporter.api";
import { useFocusEffect } from "@react-navigation/native";

// ─── types ────────────────────────────────────────────────────────────────────

type ProfileNav = NativeStackNavigationProp<any>;

// ─── role-aware stat config ───────────────────────────────────────────────────

function getRoleStat(
  role: string,
  extras: Record<string, number>,
): {
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
  value: number;
  label: string;
} {
  if (role === "FARMER") {
    return {
      icon: "agriculture",
      value: extras?.farms_count ?? 0,
      label: "Farms",
    };
  }
  if (role === "TRANSPORTER") {
    return {
      icon: "local-shipping",
      value: extras?.vehicles_count ?? 0,
      label: "Vehicles",
    };
  }
  return {
    icon: "shopping-bag",
    value: extras?.orders_count ?? 0,
    label: "Orders",
  };
}

// ─── mission status config ────────────────────────────────────────────────────

function getMissionStatusDisplay(status: string): {
  label: string;
  bg: string;
  text: string;
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
} {
  const map: Record<
    string,
    {
      label: string;
      bg: string;
      text: string;
      icon: React.ComponentProps<typeof MaterialIcons>["name"];
    }
  > = {
    pending: {
      label: "Available",
      bg: "#fef3c7",
      text: "#92400e",
      icon: "schedule",
    },
    accepted: {
      label: "Accepted",
      bg: "#dbeafe",
      text: "#1e40af",
      icon: "check-circle",
    },
    picked_up: {
      label: "Picked Up",
      bg: "#e0e7ff",
      text: "#3730a3",
      icon: "local-shipping",
    },
    in_transit: {
      label: "In Transit",
      bg: "#d1fae5",
      text: "#047857",
      icon: "map",
    },
    delivered: {
      label: "Delivered",
      bg: "#dcfce7",
      text: "#166534",
      icon: "task-alt",
    },
    cancelled: {
      label: "Cancelled",
      bg: "#fee2e2",
      text: "#991b1b",
      icon: "cancel",
    },
  };
  return (
    map[status] || {
      label: status,
      bg: "#f3f4f6",
      text: "#6b7280",
      icon: "help",
    }
  );
}

// ─── get badge info ───────────────────────────────────────────────────────────

function getAchievementBadge(
  value: number,
  type: "rating" | "member",
): { text: string; color: string } | null {
  if (type === "rating") {
    if (value >= 4.5) return { text: "Excellent Rating", color: "#d97706" };
    if (value >= 4.0) return { text: "Great Rating", color: "#059669" };
    return null;
  }
  if (type === "member") {
    if (value >= 3) return { text: "Loyal Member", color: "#059669" };
    if (value >= 1) return { text: "Verified Member", color: "#047857" };
    return null;
  }
  return null;
}

// ─── sub-components ───────────────────────────────────────────────────────────

const MissionCard = ({
  mission,
  onPress,
  compact = false,
}: {
  mission: ApiMission;
  onPress?: () => void;
  compact?: boolean;
}) => {
  const statusDisplay = getMissionStatusDisplay(mission.status);
  const itemsInfo = mission.order_items_summary;

  if (compact) {
    return (
      <TouchableOpacity
        style={styles.missionCardCompact}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.missionCompactHeader}>
          <View
            style={[styles.statusBadge, { backgroundColor: statusDisplay.bg }]}
          >
            <MaterialIcons
              name={statusDisplay.icon}
              size={12}
              color={statusDisplay.text}
            />
            <Text
              style={[styles.statusBadgeText, { color: statusDisplay.text }]}
            >
              {statusDisplay.label}
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={18} color="#d1d5db" />
        </View>
        <Text style={styles.missionCompactOrder}>Order #{mission.order}</Text>
        <Text style={styles.missionCompactLocation} numberOfLines={1}>
          {mission.pickup_address || mission.wilaya}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.missionCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.missionHeader}>
        <View>
          <Text style={styles.missionOrderId}>Order #{mission.order}</Text>
          <Text style={styles.missionWilaya}>{mission.wilaya}</Text>
        </View>
        <View
          style={[styles.statusBadge, { backgroundColor: statusDisplay.bg }]}
        >
          <MaterialIcons
            name={statusDisplay.icon}
            size={12}
            color={statusDisplay.text}
          />
          <Text style={[styles.statusBadgeText, { color: statusDisplay.text }]}>
            {statusDisplay.label}
          </Text>
        </View>
      </View>

      {itemsInfo && (
        <Text style={styles.missionSummary} numberOfLines={2}>
          {itemsInfo.description}
        </Text>
      )}

      <View style={styles.missionDetailsRow}>
        <View style={styles.missionDetail}>
          <MaterialIcons name="location-on" size={14} color="#047857" />
          <Text style={styles.missionDetailText} numberOfLines={1}>
            {mission.pickup_address || "Pickup"}
          </Text>
        </View>
        <MaterialIcons name="arrow-forward" size={14} color="#d1d5db" />
        <View style={styles.missionDetail}>
          <MaterialIcons name="location-on" size={14} color="#ef4444" />
          <Text style={styles.missionDetailText} numberOfLines={1}>
            {mission.delivery_address || "Delivery"}
          </Text>
        </View>
      </View>

      {mission.order_total_price && (
        <View style={styles.missionFooter}>
          <Text style={styles.missionPrice}>
            {mission.order_total_price.toFixed(2)} DA
          </Text>
          <Text style={styles.missionDate}>
            {new Date(mission.created_at).toLocaleDateString()}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const HeroStat = ({
  value,
  label,
  icon,
  badge,
}: {
  value: string | number;
  label: string;
  icon?: React.ComponentProps<typeof MaterialIcons>["name"];
  badge?: { text: string; color: string } | null;
}) => (
  <View style={styles.heroStatBox}>
    {icon && (
      <MaterialIcons
        name={icon}
        size={18}
        color="#a7f3d0"
        style={styles.heroStatIcon}
      />
    )}
    <Text style={styles.heroStatVal}>{value}</Text>
    <Text style={styles.heroStatLbl}>{label}</Text>
    {badge && (
      <View style={[styles.heroStatBadge, { backgroundColor: badge.color }]}>
        <Text style={styles.heroStatBadgeText}>{badge.text}</Text>
      </View>
    )}
  </View>
);

const SettingRow = ({
  icon,
  iconBg,
  label,
  sub,
  onPress,
}: {
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
  iconBg: string;
  label: string;
  sub?: string;
  onPress?: () => void;
}) => (
  <TouchableOpacity
    style={styles.settingRow}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={[styles.settingIcon, { backgroundColor: iconBg }]}>
      <MaterialIcons name={icon} size={18} color="#555" />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.settingLabel}>{label}</Text>
      {sub && <Text style={styles.settingSub}>{sub}</Text>}
    </View>
    <MaterialIcons name="chevron-right" size={20} color="#d1d5db" />
  </TouchableOpacity>
);

// ─── main screen ─────────────────────────────────────────────────────────────

const ProfileScreen = () => {
  const navigation = useNavigation<ProfileNav>();
  const { user, logout } = useAuth();
  const [profileData, setProfileData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [missions, setMissions] = React.useState<ApiMission[]>([]);
  const [missionsLoading, setMissionsLoading] = React.useState(false);
  const [selectedActiveMission, setSelectedActiveMission] =
    React.useState<ApiMission | null>(null);
  const [showMissionModal, setShowMissionModal] = React.useState(false);

  // Use focus effect so count updates when returning from Notifications screen
  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;
      (async () => {
        try {
          // Fetch profile and unread notifications concurrently
          const [profileRes, unreadRes] = await Promise.all([
            profileApi.me(),
            notificationApi.getUnreadCount(),
          ]);

          if (isActive) {
            setProfileData(profileRes);
            setUnreadCount((unreadRes as any)?.unread_count || 0);
          }
        } catch (e) {
          console.error("Profile/Notification fetch error:", e);
        } finally {
          if (isActive) setLoading(false);
        }
      })();
      return () => {
        isActive = false;
      };
    }, []),
  );

  // Fetch missions for transporter
  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;

      (async () => {
        if (user?.role !== "TRANSPORTER") return;

        try {
          setMissionsLoading(true);
          const response = await transporterApi.myMissions();
          if (isActive) {
            setMissions(response.results || []);
          }
        } catch (e) {
          console.error("Missions fetch error:", e);
        } finally {
          if (isActive) setMissionsLoading(false);
        }
      })();

      return () => {
        isActive = false;
      };
    }, [user?.role]),
  );

  // MeView returns { status, code, data: { user, profile, extras } }
  const meData = profileData?.data ?? profileData; // handle both shapes
  const role = user?.role ?? "BUYER";
  const extras = meData?.extras ?? {};
  const roleStat = getRoleStat(role, extras);
  const displayName = user?.username ?? user?.email ?? "User";
  const initials = displayName.slice(0, 2).toUpperCase();

  // Compute real stats with proper formatting
  const ratingValue = extras?.rating ?? 0;
  const ratingDisplay = ratingValue > 0 ? `${ratingValue.toFixed(1)}★` : "—";
  const ratingBadge =
    ratingValue > 0 ? getAchievementBadge(ratingValue, "rating") : null;

  const memberYears = extras?.member_since_years ?? 0;
  const memberDisplay = `${memberYears}y`;
  const memberBadge =
    memberYears > 0 ? getAchievementBadge(memberYears, "member") : null;

  // Organize missions by status
  const availableMissions = missions.filter((m) => m.status === "pending");
  const activeMissions = missions.filter((m) =>
    ["accepted", "picked_up", "in_transit"].includes(m.status),
  );
  const historyMissions = missions.filter((m) =>
    ["delivered", "cancelled"].includes(m.status),
  );

  // Navigate to the Orders tab (sibling tab in BuyerTabNavigator)
  const goToOrders = () =>
    navigation.dispatch(CommonActions.navigate({ name: "Orders" }));

  const navigateToMissions = () => {
    navigation.getParent()?.navigate("Missions");
  };

  const handleSelectActiveMission = (mission: ApiMission) => {
    setSelectedActiveMission(mission);
    setShowMissionModal(true);
  };

  const formatCoordinate = (
    coord: number | string | null | undefined,
  ): string => {
    if (!coord) return "N/A";
    if (typeof coord === "string") {
      const num = parseFloat(coord);
      return isNaN(num) ? "N/A" : num.toFixed(4);
    }
    return coord.toFixed(4);
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color="#047857" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ── HERO HEADER ── */}
        <View style={styles.hero}>
          <View style={styles.heroTopRow}>
            <Text style={styles.appName}>AGRICONNECT</Text>
            <TouchableOpacity
              style={styles.settingsBtn}
              onPress={() => navigation.navigate("EditProfile")}
            >
              <MaterialIcons
                name="settings"
                size={20}
                color="rgba(255,255,255,0.8)"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.avatarRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroName}>{displayName}</Text>
              <View style={styles.roleRow}>
                <View style={styles.roleDot} />
                <Text style={styles.roleText}>{role} · Verified</Text>
              </View>
              <View style={styles.activeBadge}>
                <MaterialIcons name="verified" size={12} color="#047857" />
                <Text style={styles.activeBadgeText}>Active Account</Text>
              </View>
            </View>
          </View>

          <View style={styles.heroStats}>
            <HeroStat
              icon={roleStat.icon}
              value={roleStat.value}
              label={roleStat.label}
            />
            <View style={styles.heroStatDivider} />
            <HeroStat
              icon="shopping-bag"
              value={extras?.orders_count ?? 0}
              label="Orders"
            />
            <View style={styles.heroStatDivider} />
            <HeroStat
              icon="star"
              value={ratingDisplay}
              label="Rating"
              badge={ratingBadge}
            />
            <View style={styles.heroStatDivider} />
            <HeroStat
              icon="calendar-today"
              value={memberDisplay}
              label="Member"
              badge={memberBadge}
            />
          </View>
        </View>

        {/* ── MISSIONS (TRANSPORTER ONLY) ── */}
        {role === "TRANSPORTER" && (
          <>
            {/* AVAILABLE MISSIONS */}
            {availableMissions.length > 0 && (
              <>
                <View style={styles.missionsHeader}>
                  <Text style={styles.sectionHead}>Available Missions</Text>
                  <View style={styles.missionBadge}>
                    <Text style={styles.missionBadgeText}>
                      {availableMissions.length}
                    </Text>
                  </View>
                </View>
                <View style={[styles.card, { marginBottom: 12 }]}>
                  {availableMissions.slice(0, 3).map((mission, idx) => (
                    <React.Fragment key={mission.id}>
                      <MissionCard
                        mission={mission}
                        onPress={navigateToMissions}
                        compact
                      />
                      {idx < Math.min(2, availableMissions.length - 1) && (
                        <View style={styles.missionDivider} />
                      )}
                    </React.Fragment>
                  ))}
                  {availableMissions.length > 3 && (
                    <TouchableOpacity
                      style={styles.seeMoreMission}
                      onPress={navigateToMissions}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.seeMoreText}>
                        See all {availableMissions.length} available missions
                      </Text>
                      <MaterialIcons
                        name="arrow-forward"
                        size={16}
                        color="#047857"
                      />
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}

            {/* ACTIVE MISSIONS */}
            {activeMissions.length > 0 && (
              <>
                <View style={styles.missionsHeader}>
                  <Text style={styles.sectionHead}>Active Missions</Text>
                  <View
                    style={[
                      styles.missionBadge,
                      { backgroundColor: "#dbeafe" },
                    ]}
                  >
                    <Text
                      style={[styles.missionBadgeText, { color: "#1e40af" }]}
                    >
                      {activeMissions.length}
                    </Text>
                  </View>
                </View>
                <View style={[styles.card, { marginBottom: 12 }]}>
                  {activeMissions.map((mission) => (
                    <TouchableOpacity
                      key={mission.id}
                      style={styles.activeSelectMission}
                      onPress={() => handleSelectActiveMission(mission)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.activeSelectLeft}>
                        <MaterialIcons
                          name="local-shipping"
                          size={20}
                          color="#047857"
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.activeSelectTitle}>
                            {getMissionStatusDisplay(mission.status).label}
                          </Text>
                          <Text
                            style={styles.activeSelectSub}
                            numberOfLines={1}
                          >
                            Order #{mission.order} • {mission.wilaya}
                          </Text>
                        </View>
                      </View>
                      <MaterialIcons
                        name={
                          selectedActiveMission?.id === mission.id
                            ? "radio-button-checked"
                            : "radio-button-unchecked"
                        }
                        size={22}
                        color={
                          selectedActiveMission?.id === mission.id
                            ? "#047857"
                            : "#d1d5db"
                        }
                      />
                    </TouchableOpacity>
                  ))}
                  {selectedActiveMission && (
                    <TouchableOpacity
                      style={styles.selectMissionButton}
                      onPress={() => {
                        Alert.alert(
                          "Work on Mission",
                          `Start working on Order #${selectedActiveMission.order}?`,
                        );
                        setShowMissionModal(true);
                      }}
                      activeOpacity={0.8}
                    >
                      <MaterialIcons name="play-arrow" size={18} color="#fff" />
                      <Text style={styles.selectMissionButtonText}>
                        Work on This Mission
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}

            {/* HISTORY */}
            {historyMissions.length > 0 && (
              <>
                <View style={styles.missionsHeader}>
                  <Text style={styles.sectionHead}>Mission History</Text>
                  <View
                    style={[
                      styles.missionBadge,
                      { backgroundColor: "#f3f4f6" },
                    ]}
                  >
                    <Text
                      style={[styles.missionBadgeText, { color: "#6b7280" }]}
                    >
                      {historyMissions.length}
                    </Text>
                  </View>
                </View>
                <View style={[styles.card, { marginBottom: 12 }]}>
                  {historyMissions.slice(0, 3).map((mission, idx) => {
                    const statusDisplay = getMissionStatusDisplay(
                      mission.status,
                    );
                    return (
                      <React.Fragment key={mission.id}>
                        <TouchableOpacity
                          style={styles.historyMissionItem}
                          onPress={navigateToMissions}
                          activeOpacity={0.7}
                        >
                          <View style={styles.historyMissionLeft}>
                            <View
                              style={[
                                styles.historyStatusIcon,
                                { backgroundColor: statusDisplay.bg },
                              ]}
                            >
                              <MaterialIcons
                                name={statusDisplay.icon}
                                size={16}
                                color={statusDisplay.text}
                              />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.historyMissionTitle}>
                                Order #{mission.order}
                              </Text>
                              <Text style={styles.historyMissionSub}>
                                {mission.wilaya} • {mission.baladiya}
                              </Text>
                              <Text style={styles.historyMissionDate}>
                                {new Date(
                                  mission.updated_at || mission.created_at,
                                ).toLocaleDateString()}
                              </Text>
                            </View>
                          </View>
                          {mission.order_total_price && (
                            <View style={styles.historyMissionPrice}>
                              <Text style={styles.historyPrice}>
                                {mission.order_total_price.toFixed(0)} DA
                              </Text>
                            </View>
                          )}
                        </TouchableOpacity>
                        {idx < Math.min(2, historyMissions.length - 1) && (
                          <View style={styles.missionDivider} />
                        )}
                      </React.Fragment>
                    );
                  })}
                  {historyMissions.length > 3 && (
                    <TouchableOpacity
                      style={styles.seeMoreMission}
                      onPress={navigateToMissions}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.seeMoreText}>
                        View all {historyMissions.length} completed missions
                      </Text>
                      <MaterialIcons
                        name="arrow-forward"
                        size={16}
                        color="#047857"
                      />
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          </>
        )}

        {/* ── ACCOUNT SETTINGS ── */}
        <Text style={styles.sectionHead}>Account Settings</Text>
        <View style={styles.card}>
          <SettingRow
            icon="person"
            iconBg="#f0faf0"
            label="Personal Information"
            sub="Name, email, phone"
            onPress={() => navigation.navigate("EditProfile")}
          />
          <SettingRow
            icon="payments"
            iconBg="#faf0ff"
            label="Payment Methods"
            sub="Cards & bank accounts"
            onPress={() => navigation.navigate("PaymentMethods")}
          />
          <SettingRow
            icon="notifications"
            iconBg="#fff8f0"
            label="Notifications"
            sub={
              unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
                : "Alerts & preferences"
            }
            onPress={() => navigation.navigate("Notifications")}
          />
          <SettingRow
            icon="security"
            iconBg="#f0f4ff"
            label="Security & PIN"
            sub="Password, PIN, 2FA"
            onPress={() => navigation.navigate("Security")}
          />
        </View>

        {/* ── ACTIVITY ── */}
        <Text style={styles.sectionHead}>Activity</Text>
        <View style={styles.card}>
          <SettingRow
            icon="star"
            iconBg="#f0faf0"
            label="Reviews & Ratings"
            sub="View your product reviews"
            onPress={() => navigation.navigate("MyReviews")}
          />
        </View>

        {/* ── SUPPORT ── */}
        <TouchableOpacity
          style={styles.supportCard}
          onPress={() => navigation.navigate("HelpSupport")}
          activeOpacity={0.85}
        >
          <View style={styles.supportIconBox}>
            <MaterialIcons
              name="support-agent"
              size={22}
              color="rgba(255,255,255,0.9)"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.supportTitle}>Help & Support</Text>
            <Text style={styles.supportSub}>FAQs, guides & live chat</Text>
          </View>
          <View style={styles.supportOpenBtn}>
            <Text style={styles.supportOpenText}>Open</Text>
          </View>
        </TouchableOpacity>

        {/* ── LOGOUT ── */}
        <TouchableOpacity
          style={styles.logoutRow}
          onPress={logout}
          activeOpacity={0.8}
        >
          <MaterialIcons name="logout" size={18} color="#b91c1c" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── MISSION DETAIL MODAL ── */}
      <Modal
        visible={showMissionModal && !!selectedActiveMission}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMissionModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setShowMissionModal(false)}
              activeOpacity={0.7}
            >
              <MaterialIcons name="close" size={24} color="#047857" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Mission Details</Text>
            <View style={{ width: 40 }} />
          </View>

          {selectedActiveMission && (
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.modalContent}
            >
              <MissionCard mission={selectedActiveMission} />

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Pickup Information</Text>
                <View style={styles.modalInfoBox}>
                  <MaterialIcons name="location-on" size={18} color="#047857" />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.modalInfoLabel}>Address</Text>
                    <Text style={styles.modalInfoValue}>
                      {selectedActiveMission.pickup_address || "Not specified"}
                    </Text>
                  </View>
                </View>
                {selectedActiveMission.pickup_latitude !== null &&
                  selectedActiveMission.pickup_latitude !== undefined &&
                  selectedActiveMission.pickup_longitude !== null &&
                  selectedActiveMission.pickup_longitude !== undefined && (
                    <Text style={styles.modalCoords}>
                      {formatCoordinate(selectedActiveMission.pickup_latitude)},{" "}
                      {formatCoordinate(selectedActiveMission.pickup_longitude)}
                    </Text>
                  )}
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>
                  Delivery Information
                </Text>
                <View style={styles.modalInfoBox}>
                  <MaterialIcons name="location-on" size={18} color="#ef4444" />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.modalInfoLabel}>Address</Text>
                    <Text style={styles.modalInfoValue}>
                      {selectedActiveMission.delivery_address ||
                        "Not specified"}
                    </Text>
                  </View>
                </View>
                {selectedActiveMission.delivery_latitude !== null &&
                  selectedActiveMission.delivery_latitude !== undefined &&
                  selectedActiveMission.delivery_longitude !== null &&
                  selectedActiveMission.delivery_longitude !== undefined && (
                    <Text style={styles.modalCoords}>
                      {formatCoordinate(
                        selectedActiveMission.delivery_latitude,
                      )}
                      ,{" "}
                      {formatCoordinate(
                        selectedActiveMission.delivery_longitude,
                      )}
                    </Text>
                  )}
              </View>

              {selectedActiveMission.notes && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Notes</Text>
                  <Text style={styles.modalNotes}>
                    {selectedActiveMission.notes}
                  </Text>
                </View>
              )}

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Order Details</Text>
                <View style={styles.modalDetailRow}>
                  <Text style={styles.modalDetailLabel}>Order ID</Text>
                  <Text style={styles.modalDetailValue}>
                    #{selectedActiveMission.order}
                  </Text>
                </View>
                {selectedActiveMission.order_total_price && (
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Total Price</Text>
                    <Text style={styles.modalDetailValue}>
                      {selectedActiveMission.order_total_price.toFixed(2)} DA
                    </Text>
                  </View>
                )}
                <View style={styles.modalDetailRow}>
                  <Text style={styles.modalDetailLabel}>Status</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: getMissionStatusDisplay(
                          selectedActiveMission.status,
                        ).bg,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        {
                          color: getMissionStatusDisplay(
                            selectedActiveMission.status,
                          ).text,
                        },
                      ]}
                    >
                      {
                        getMissionStatusDisplay(selectedActiveMission.status)
                          .label
                      }
                    </Text>
                  </View>
                </View>
              </View>

              {selectedActiveMission.order_items_summary && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Items Summary</Text>
                  <Text style={styles.modalSummary}>
                    {selectedActiveMission.order_items_summary.items_count}{" "}
                    item(s) •{" "}
                    {selectedActiveMission.order_items_summary.total_quantity}{" "}
                    unit(s)
                  </Text>
                  <Text style={styles.modalSummaryDesc}>
                    {selectedActiveMission.order_items_summary.description}
                  </Text>
                </View>
              )}
            </ScrollView>
          )}

          <TouchableOpacity
            style={styles.modalActionButton}
            onPress={() => {
              setShowMissionModal(false);
              navigateToMissions();
            }}
            activeOpacity={0.8}
          >
            <MaterialIcons name="local-shipping" size={18} color="#fff" />
            <Text style={styles.modalActionButtonText}>
              Go to Mission Tracker
            </Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

export default ProfileScreen;

// ─── styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f8f5",
  },

  /* HERO */
  hero: {
    backgroundColor: "#047857",
    paddingHorizontal: 16,
    paddingBottom: 4,
    paddingTop: 10,
  },

  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },

  appName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#a7f3d0",
    letterSpacing: 1,
  },

  settingsBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },

  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 20,
  },

  avatarCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#a7f3d0",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.25)",
    flexShrink: 0,
  },

  avatarInitials: {
    fontSize: 24,
    fontWeight: "800",
    color: "#047857",
  },

  heroName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.4,
  },

  roleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },

  roleDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#0df20d",
  },

  roleText: {
    fontSize: 12,
    color: "#a7f3d0",
    fontWeight: "600",
  },

  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#d1fae5",
    alignSelf: "flex-start",
    borderRadius: 20,
    paddingVertical: 3,
    paddingHorizontal: 10,
    marginTop: 8,
  },

  activeBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#047857",
  },

  heroStats: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.15)",
    marginHorizontal: -16,
    marginTop: 16,
    paddingHorizontal: 0,
  },

  heroStatBox: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: "center",
  },

  heroStatIcon: {
    marginBottom: 6,
  },

  heroStatVal: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 2,
  },

  heroStatLbl: {
    fontSize: 11,
    color: "#a7f3d0",
    fontWeight: "600",
  },

  heroStatBadge: {
    marginTop: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: "#d97706",
  },

  heroStatBadgeText: {
    fontSize: 8,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.3,
  },

  heroStatDivider: {
    width: 0.5,
    height: 28,
    backgroundColor: "rgba(255,255,255,0.15)",
  },

  /* SECTIONS */
  sectionHead: {
    fontSize: 10,
    fontWeight: "700",
    color: "#9ca3af",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 8,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginHorizontal: 16,
    borderWidth: 0.5,
    borderColor: "#e4efe4",
    overflow: "hidden",
    marginBottom: 4,
  },

  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f3f4f6",
  },

  settingIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  settingLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1a2e1a",
  },

  settingSub: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 1,
  },

  /* SUPPORT */
  supportCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#047857",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
  },

  supportIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  supportTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#fff",
  },

  supportSub: {
    fontSize: 12,
    color: "#a7f3d0",
    marginTop: 2,
  },

  supportOpenBtn: {
    backgroundColor: "#0df20d",
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },

  supportOpenText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#065f46",
  },

  /* LOGOUT */
  logoutRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 36,
    padding: 14,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: "#fee2e2",
  },

  logoutText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#b91c1c",
  },

  /* MISSIONS */
  missionsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 8,
  },

  missionBadge: {
    backgroundColor: "#fef3c7",
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    minWidth: 32,
    alignItems: "center",
    justifyContent: "center",
  },

  missionBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#92400e",
  },

  missionCard: {
    paddingVertical: 12,
    paddingHorizontal: 12,
  },

  missionCardCompact: {
    paddingVertical: 12,
    paddingHorizontal: 12,
  },

  missionCompactHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  missionCompactOrder: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1a2e1a",
    marginBottom: 4,
  },

  missionCompactLocation: {
    fontSize: 11,
    color: "#6b7280",
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },

  statusBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },

  missionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  missionOrderId: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1a2e1a",
  },

  missionWilaya: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 2,
  },

  missionSummary: {
    fontSize: 11,
    color: "#6b7280",
    marginBottom: 10,
    lineHeight: 16,
  },

  missionDetailsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },

  missionDetail: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  missionDetailText: {
    fontSize: 10,
    color: "#6b7280",
  },

  missionFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: "#f3f4f6",
  },

  missionPrice: {
    fontSize: 12,
    fontWeight: "700",
    color: "#047857",
  },

  missionDate: {
    fontSize: 10,
    color: "#9ca3af",
  },

  missionDivider: {
    height: 0.5,
    backgroundColor: "#f3f4f6",
    marginHorizontal: 12,
  },

  seeMoreMission: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
  },

  seeMoreText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#047857",
  },

  activeSelectMission: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f3f4f6",
  },

  activeSelectLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 10,
  },

  activeSelectTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1a2e1a",
  },

  activeSelectSub: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 2,
  },

  selectMissionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginVertical: 12,
    marginHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#047857",
    borderRadius: 12,
  },

  selectMissionButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },

  historyMissionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
  },

  historyMissionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 10,
  },

  historyStatusIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  historyMissionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1a2e1a",
  },

  historyMissionSub: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 2,
  },

  historyMissionDate: {
    fontSize: 10,
    color: "#9ca3af",
    marginTop: 2,
  },

  historyMissionPrice: {
    alignItems: "flex-end",
  },

  historyPrice: {
    fontSize: 12,
    fontWeight: "700",
    color: "#047857",
  },

  /* MODAL */
  modalContainer: {
    flex: 1,
    backgroundColor: "#f5f8f5",
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e4efe4",
  },

  modalCloseBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1a2e1a",
  },

  modalContent: {
    flex: 1,
    padding: 16,
  },

  modalSection: {
    marginBottom: 20,
  },

  modalSectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1a2e1a",
    marginBottom: 10,
  },

  modalInfoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: "#e4efe4",
  },

  modalInfoLabel: {
    fontSize: 10,
    color: "#9ca3af",
    fontWeight: "600",
  },

  modalInfoValue: {
    fontSize: 12,
    color: "#1a2e1a",
    fontWeight: "600",
    marginTop: 2,
  },

  modalCoords: {
    fontSize: 10,
    color: "#6b7280",
    marginTop: 8,
    fontFamily: "monospace",
  },

  modalNotes: {
    fontSize: 12,
    color: "#1a2e1a",
    lineHeight: 18,
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: "#e4efe4",
  },

  modalDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f3f4f6",
  },

  modalDetailLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "600",
  },

  modalDetailValue: {
    fontSize: 12,
    color: "#1a2e1a",
    fontWeight: "700",
  },

  modalSummary: {
    fontSize: 12,
    color: "#1a2e1a",
    fontWeight: "600",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: "#e4efe4",
    marginBottom: 8,
  },

  modalSummaryDesc: {
    fontSize: 11,
    color: "#6b7280",
    backgroundColor: "#f9faf9",
    padding: 10,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#047857",
  },

  modalActionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 14,
    backgroundColor: "#047857",
    borderRadius: 12,
  },

  modalActionButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
});
