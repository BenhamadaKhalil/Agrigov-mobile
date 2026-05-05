// screens/NotificationsScreen.tsx

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { notificationApi, Notification } from "../../apis/notification.api";

// ─── types ────────────────────────────────────────────────────────────────────

interface NotifItem {
  id: string;
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
  iconBg: string;
  title: string;
  body: string;
  time: string;
  unread: boolean;
}

interface PrefItem {
  key: string;
  label: string;
  sub: string;
}

// ─── data ─────────────────────────────────────────────────────────────────────

const PREFS: PrefItem[] = [
  { key: "orders",    label: "Order Updates",      sub: "Pickup, transit & delivery alerts" },
  { key: "prices",    label: "Price Alerts",        sub: "Market price changes" },
  { key: "stock",     label: "Low Stock Warnings",  sub: "When inventory falls below threshold" },
  { key: "promos",    label: "Promotions",          sub: "Platform offers and news" },
  { key: "sms",       label: "SMS Notifications",   sub: "Critical alerts via text message" },
];

function getIconForType(type: string): { icon: React.ComponentProps<typeof MaterialIcons>["name"], bg: string } {
  switch (type) {
    case "ORDER_STATUS": return { icon: "local-shipping", bg: "#d1fae5" };
    case "LOW_STOCK": return { icon: "warning", bg: "#fff3e0" };
    case "PRICE_UPDATE": return { icon: "price-change", bg: "#e0e7ff" };
    case "SYSTEM_ALERT": return { icon: "info", bg: "#dbeafe" };
    case "NEW_REVIEW": return { icon: "star", bg: "#fef3c7" };
    default: return { icon: "notifications", bg: "#f3f4f6" };
  }
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return "Just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return "Yesterday";
  return `${diffInDays}d ago`;
}

// ─── sub-components ───────────────────────────────────────────────────────────

const NotifCard = ({
  item,
  onDismiss,
  onPress,
}: {
  item: Notification;
  onDismiss: (id: number) => void;
  onPress: (id: number) => void;
}) => {
  const { icon, bg } = getIconForType(item.notification_type);
  const unread = !item.is_read;

  return (
    <TouchableOpacity onPress={() => onPress(item.id)} activeOpacity={0.8}>
      <View style={[styles.notifRow, unread && styles.notifUnread]}>
        <View style={[styles.notifIcon, { backgroundColor: bg }]}>
          <MaterialIcons name={icon} size={18} color="#555" />
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.notifHeader}>
            <Text style={styles.notifTitle}>{item.title}</Text>
            <Text style={styles.notifTime}>{formatRelativeTime(item.created_at)}</Text>
          </View>
          <Text style={styles.notifBody}>{item.message}</Text>
        </View>
        {unread && <View style={styles.unreadDot} />}
      </View>
    </TouchableOpacity>
  );
};

// ─── main screen ─────────────────────────────────────────────────────────────

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [prefs, setPrefs] = useState<Record<string, boolean>>({
    orders: true,
    prices: true,
    stock: true,
    promos: false,
    sms: true,
  });

  React.useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data: any = await notificationApi.getNotifications();
      const results = Array.isArray(data) ? data : data.results || [];
      setItems(results);
    } catch (e) {
      console.error("Failed to fetch notifications", e);
    } finally {
      setLoading(false);
    }
  };

  const unreadCount = items.filter((i) => !i.is_read).length;

  const markAllRead = async () => {
    try {
      await notificationApi.markAllRead();
      setItems((prev) => prev.map((i) => ({ ...i, is_read: true })));
    } catch (e) {
      console.error("Failed to mark all as read", e);
    }
  };

  const handlePress = async (id: number) => {
    try {
      const item = items.find((i) => i.id === id);
      if (item && !item.is_read) {
        await notificationApi.markRead(id);
        setItems((prev) =>
          prev.map((i) => (i.id === id ? { ...i, is_read: true } : i))
        );
      }
    } catch (e) {
      console.error("Failed to mark as read", e);
    }
  };

  const togglePref = (key: string) =>
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* TOP BAR */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={20} color="#1a2e1a" />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markBtn} onPress={markAllRead}>
            <Text style={styles.markBtnText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* UNREAD COUNT */}
        {unreadCount > 0 && (
          <View style={styles.unreadBanner}>
            <View style={styles.unreadDotLg} />
            <Text style={styles.unreadText}>{unreadCount} unread notification{unreadCount > 1 ? "s" : ""}</Text>
          </View>
        )}

        <Text style={styles.sectionHead}>Recent</Text>
        <View style={styles.card}>
          {loading ? (
            <View style={{ padding: 20, alignItems: "center" }}>
              <Text style={{ color: "#9ca3af" }}>Loading notifications...</Text>
            </View>
          ) : items.length === 0 ? (
            <View style={{ padding: 20, alignItems: "center" }}>
              <Text style={{ color: "#9ca3af" }}>No notifications.</Text>
            </View>
          ) : (
            items.map((item) => (
              <NotifCard key={item.id} item={item} onDismiss={() => {}} onPress={handlePress} />
            ))
          )}
        </View>

        <Text style={styles.sectionHead}>Preferences</Text>
        <View style={styles.card}>
          {PREFS.map((pref) => (
            <View key={pref.key} style={styles.prefRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.prefLabel}>{pref.label}</Text>
                <Text style={styles.prefSub}>{pref.sub}</Text>
              </View>
              <Switch
                value={prefs[pref.key]}
                onValueChange={() => togglePref(pref.key)}
                trackColor={{ false: "#e5e7eb", true: "#0df20d" }}
                thumbColor="#fff"
                ios_backgroundColor="#e5e7eb"
              />
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f8f5",
  },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#fff",
    borderWidth: 0.5,
    borderColor: "#e4efe4",
    alignItems: "center",
    justifyContent: "center",
  },

  pageTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "800",
    color: "#1a2e1a",
    letterSpacing: -0.3,
  },

  markBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#f0faf0",
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: "#c6e8c6",
  },

  markBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#047857",
  },

  unreadBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f0faf0",
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 8,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: "#c6e8c6",
    paddingVertical: 10,
    paddingHorizontal: 14,
  },

  unreadDotLg: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#0df20d",
  },

  unreadText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#047857",
  },

  sectionHead: {
    fontSize: 10,
    fontWeight: "700",
    color: "#9ca3af",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginHorizontal: 16,
    borderWidth: 0.5,
    borderColor: "#e4efe4",
    overflow: "hidden",
  },

  notifRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f3f4f6",
  },

  notifUnread: {
    backgroundColor: "#fafff8",
  },

  notifIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  notifHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 3,
  },

  notifTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1a2e1a",
    flex: 1,
  },

  notifTime: {
    fontSize: 10,
    color: "#9ca3af",
    marginLeft: 8,
  },

  notifBody: {
    fontSize: 12,
    color: "#6b7280",
    lineHeight: 17,
  },

  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#0df20d",
    flexShrink: 0,
    marginTop: 4,
  },

  prefRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f3f4f6",
  },

  prefLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1a2e1a",
  },

  prefSub: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 2,
  },
});