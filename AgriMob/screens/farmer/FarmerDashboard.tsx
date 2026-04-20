import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

const tasks = [
  { title: "Update Wheat Inventory", sub: "Log data for Section B" },
  { title: "Check Logistics: Tomato Pickup", sub: "Route arrival at 14:00" },
  { title: "Calibrate Soil Sensors", sub: "Completed at 06:30 AM", done: true },
];

export default function FarmerDashboard() {
  return (
    <SafeAreaView style={styles.safe}>
      {/* TOP BAR */}
      <View style={styles.topBar}>
        <TouchableOpacity>
          <MaterialIcons name="menu" size={26} color="#047857" />
        </TouchableOpacity>
        <Text style={styles.appName}>Digital Harvest</Text>
        <TouchableOpacity>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>ET</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* GREETING HERO */}
        <View style={styles.hero}>
          <Text style={styles.heroLabel}>GOOD MORNING</Text>
          <Text style={styles.heroName}>Elias Thorne</Text>
          <Text style={styles.heroSub}>
            Everything is growing according to plan today.
          </Text>

          <View style={styles.weatherRow}>
            {[
              { icon: "🌡️", label: "24°C" },
              { icon: "💧", label: "68%" },
              { icon: "🌧️", label: "15%" },
            ].map((w, i) => (
              <View key={i} style={styles.weatherPill}>
                <Text style={styles.weatherText}>{w.icon} {w.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* STATS ROW */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Active Listings</Text>
            <Text style={styles.statValue}>12</Text>
          </View>

          <View style={[styles.statCard, styles.statCardDark]}>
            <Text style={[styles.statLabel, styles.statLabelLight]}>Monthly Revenue</Text>
            <Text style={[styles.statValue, styles.statValueLight]}>$8.4k</Text>
          </View>

          <View style={[styles.statCard, styles.statCardFull]}>
            <View style={styles.rowBetween}>
              <View>
                <Text style={styles.statLabel}>Pending Orders</Text>
                <Text style={[styles.statValue, { fontSize: 28 }]}>08</Text>
              </View>
              <MaterialIcons name="local-shipping" size={36} color="#047857" />
            </View>
          </View>
        </View>

        {/* FROST ALERT */}
        <View style={styles.alertBox}>
          <View style={styles.alertIconWrap}>
            <MaterialIcons name="warning" size={20} color="#dc2626" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.alertTitle}>Frost Alert</Text>
            <Text style={styles.alertSub}>
              Temperatures dropping tonight in North Field.
            </Text>
          </View>
        </View>

        {/* TASKS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Tasks</Text>

          {tasks.map((task, i) => (
            <View
              key={i}
              style={[styles.taskRow, i < tasks.length - 1 && styles.taskBorder]}
            >
              <View style={[styles.checkbox, task.done && styles.checkboxDone]}>
                {task.done && (
                  <MaterialIcons name="check" size={12} color="#fff" />
                )}
              </View>

              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.taskTitle,
                    task.done && styles.taskTitleDone,
                  ]}
                >
                  {task.title}
                </Text>
                <Text style={styles.taskSub}>{task.sub}</Text>
              </View>

              <MaterialIcons name="chevron-right" size={20} color="#d1d5db" />
            </View>
          ))}
        </View>

        {/* PROGRESS */}
        <View style={styles.section}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Harvest Goal</Text>
            <Text style={styles.progressPct}>72%</Text>
          </View>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: "72%" }]} />
          </View>

          <View style={[styles.rowBetween, { marginTop: 8 }]}>
            <Text style={styles.progressLabel}>350 Tons Logged</Text>
            <Text style={styles.progressLabel}>Goal: 500 Tons</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f5f8f5" },

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#f5f8f5",
  },

  appName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#065f46",
    letterSpacing: -0.3,
  },

  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#047857",
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },

  container: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },

  /* HERO */
  hero: {
    backgroundColor: "#047857",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },

  heroLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#a7f3d0",
    letterSpacing: 1,
    marginBottom: 4,
  },

  heroName: {
    fontSize: 26,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.5,
  },

  heroSub: {
    fontSize: 13,
    color: "#a7f3d0",
    marginTop: 4,
  },

  weatherRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },

  weatherPill: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },

  weatherText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "600",
  },

  /* STATS */
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 14,
  },

  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 0.5,
    borderColor: "#e4efe4",
  },

  statCardDark: {
    backgroundColor: "#047857",
    borderColor: "#047857",
  },

  statCardFull: {
    width: "100%",
    flex: 0,
  },

  statLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6b7280",
    letterSpacing: 0.3,
    textTransform: "uppercase",
    marginBottom: 4,
  },

  statLabelLight: {
    color: "#a7f3d0",
  },

  statValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1a2e1a",
    letterSpacing: -0.5,
  },

  statValueLight: {
    color: "#fff",
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  /* ALERT */
  alertBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fee2e2",
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 0.5,
    borderColor: "#fecaca",
  },

  alertIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#fecaca",
    alignItems: "center",
    justifyContent: "center",
  },

  alertTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#991b1b",
  },

  alertSub: {
    fontSize: 12,
    color: "#9b2c2c",
    marginTop: 2,
  },

  /* SECTION */
  section: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 0.5,
    borderColor: "#e4efe4",
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a2e1a",
    marginBottom: 12,
  },

  /* TASKS */
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
  },

  taskBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: "#f3f4f6",
  },

  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#047857",
    alignItems: "center",
    justifyContent: "center",
  },

  checkboxDone: {
    backgroundColor: "#047857",
    borderColor: "#047857",
  },

  taskTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1a2e1a",
  },

  taskTitleDone: {
    textDecorationLine: "line-through",
    color: "#9ca3af",
  },

  taskSub: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 1,
  },

  /* PROGRESS */
  progressPct: {
    fontSize: 18,
    fontWeight: "800",
    color: "#047857",
  },

  progressTrack: {
    height: 8,
    backgroundColor: "#e5e7eb",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 4,
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#0df20d",
    borderRadius: 10,
  },

  progressLabel: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 4,
  },
});