// screens/ProfileScreen.tsx

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, CommonActions } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "../../context/AuthContext";
import { profileApi } from "../../apis/profile.api";
import { notificationApi } from "../../apis/notification.api";
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

  // Use focus effect so count updates when returning from Notifications screen
  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;
      (async () => {
        try {
          // Fetch profile and unread notifications concurrently
          const [profileRes, unreadRes] = await Promise.all([
            profileApi.me(),
            notificationApi.getUnreadCount()
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
      return () => { isActive = false; };
    }, [])
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

  // Navigate to the Orders tab (sibling tab in BuyerTabNavigator)
  const goToOrders = () =>
    navigation.dispatch(CommonActions.navigate({ name: "Orders" }));

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
            sub={unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "Alerts & preferences"}
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
});
