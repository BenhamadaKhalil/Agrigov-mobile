// screens/OfficialPricesScreen.tsx

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  FlatList,
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
import { officialPriceApi, OfficialPrice } from "../../apis/officialPrice.api";

// ─── types ────────────────────────────────────────────────────────────────────

interface SummaryStats {
  total_products: number;
  total_wilayas:  number;
  last_updated:   string;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

const CATEGORY_EMOJI: Record<string, string> = {
  cereals:    "🌾",
  grains:     "🌾",
  wheat:      "🌾",
  corn:       "🌽",
  barley:     "🌾",
  vegetables: "🥬",
  tomato:     "🍅",
  tomatoes:   "🍅",
  potato:     "🥔",
  onion:      "🧅",
  fruits:     "🍎",
  olive:      "🫒",
  olives:     "🫒",
  date:       "🌴",
  dates:      "🌴",
  legumes:    "🫘",
  dairy:      "🥛",
  milk:       "🥛",
  meat:       "🥩",
  poultry:    "🍗",
  eggs:       "🥚",
  default:    "📦",
};

function priceEmoji(item: OfficialPrice): string {
  const name = (item.product_detail?.name ?? "").toLowerCase();
  for (const [key, val] of Object.entries(CATEGORY_EMOJI)) {
    if (name.includes(key)) return val;
  }
  return CATEGORY_EMOJI.default;
}

function midpoint(min: number, max: number): number {
  return Math.round((min + max) / 2);
}

/** 0-1 position of midpoint within a wider market band (purely cosmetic) */
function barProgress(min: number, max: number): number {
  const mid = (min + max) / 2;
  const spread = max - min || 1;
  return Math.min(0.95, Math.max(0.05, (mid / (max + spread * 0.5))));
}

function formatPrice(val: number): string {
  return val.toLocaleString("fr-DZ");
}

// ─── animated live dot ───────────────────────────────────────────────────────

const PulseDot = ({ color = "#0df20d" }: { color?: string }) => {
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.3, duration: 900, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(opacity, { toValue: 1,   duration: 900, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ])
    ).start();
  }, [opacity]);
  return (
    <Animated.View style={[styles.pulseDot, { backgroundColor: color, opacity }]} />
  );
};

// ─── price card ───────────────────────────────────────────────────────────────

const PriceCard = ({ item }: { item: OfficialPrice }) => {
  const isNational = !item.wilaya;
  const minPrice   = Number(item.min_price);
  const maxPrice   = Number(item.max_price);
  const mid        = midpoint(minPrice, maxPrice);
  const progress   = barProgress(minPrice, maxPrice);
  const emoji      = priceEmoji(item);

  // Detect rising prices (heuristic: spread > 30% of min means volatile)
  const spread      = maxPrice - minPrice;
  const isHighSpread = spread / (minPrice || 1) > 0.3;
  const barColor    = isHighSpread ? "#f59e0b" : "#0df20d";

  return (
    <View style={styles.priceCard}>
      {/* TOP ROW */}
      <View style={styles.pcTopRow}>
        <View style={styles.pcEmojiBox}>
          <Text style={styles.pcEmoji}>{emoji}</Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.pcName} numberOfLines={1}>
            {item.product_detail?.name ?? "Unknown Product"}
          </Text>
          <View style={styles.pcLocRow}>
            <MaterialIcons
              name={isNational ? "public" : "location-on"}
              size={11}
              color="#9ca3af"
            />
            <Text style={styles.pcLocText}>
              {isNational
                ? "National Price"
                : [item.wilaya, item.region_name && item.region_name !== "National" ? item.region_name : null]
                    .filter(Boolean)
                    .join(" · ")}
            </Text>
          </View>
        </View>

        <View style={[styles.pcScopeBadge, isNational ? styles.badgeNational : styles.badgeWilaya]}>
          <MaterialIcons
            name={isNational ? "public" : "place"}
            size={10}
            color={isNational ? "#1d4ed8" : "#6336c7"}
          />
          <Text style={[styles.pcScopeText, isNational ? styles.badgeNationalText : styles.badgeWilayaText]}>
            {isNational ? "National" : "Wilaya"}
          </Text>
        </View>
      </View>

      {/* PRICE ROW */}
      <View style={styles.pcPriceRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.pcPriceLbl}>Price range</Text>
          <Text style={styles.pcPriceVal}>
            {formatPrice(minPrice)} – {formatPrice(maxPrice)}
          </Text>
          <Text style={styles.pcUnit}>DZD / {item.unit ?? "kg"}</Text>
        </View>

        <View style={styles.pcDivider} />

        <View style={styles.pcMid}>
          <Text style={styles.pcPriceLbl}>Midpoint</Text>
          <Text style={styles.pcMidVal}>{formatPrice(mid)}</Text>
          <Text style={styles.pcUnit}>DZD</Text>
        </View>
      </View>

      {/* TREND BAR */}
      <View style={styles.trendWrap}>
        <Text style={styles.trendLbl}>Market spread</Text>
        <View style={styles.trendTrack}>
          <View
            style={[
              styles.trendFill,
              { width: `${Math.round(progress * 100)}%` as any, backgroundColor: barColor },
            ]}
          />
        </View>
      </View>

      {/* UPDATED ROW */}
      <View style={styles.updatedRow}>
        {isHighSpread ? (
          <>
            <PulseDot color="#f59e0b" />
            <Text style={[styles.updatedText, { color: "#c05c00", fontWeight: "700" }]}>
              Wide price spread — monitor closely
            </Text>
          </>
        ) : (
          <>
            <PulseDot />
            <Text style={styles.updatedText}>
              {item.effective_date
                ? `Updated ${item.effective_date}`
                : "Prices are current"}
            </Text>
          </>
        )}
      </View>
    </View>
  );
};

// ─── filter chips ─────────────────────────────────────────────────────────────

type FilterKey = "all" | "national" | string; // "national" or a wilaya name

// ─── main screen ─────────────────────────────────────────────────────────────

export default function OfficialPricesScreen() {
  const [prices, setPrices]       = useState<OfficialPrice[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch]       = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [error, setError]         = useState<string | null>(null);

  // Derive stats from loaded prices
  const stats = {
    products: prices.length,
    wilayas:  new Set(prices.map((p) => p.wilaya).filter(Boolean)).size,
    updated:  "Today",
  };

  // Derive filter chips from available wilayas (max 4 to fit horizontally)
  const wilayaFilters: string[] = [
    ...new Set(prices.map((p) => p.wilaya).filter(Boolean) as string[]),
  ].slice(0, 4);

  const fetchPrices = useCallback(async () => {
    try {
      setError(null);
      const data: any = await officialPriceApi.activePrices();
      const results: OfficialPrice[] = Array.isArray(data)
        ? data
        : data.results ?? [];
      setPrices(results);
    } catch {
      setError("Could not load official prices. Pull to retry.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchPrices(); }, [fetchPrices]);

  const onRefresh = () => { setRefreshing(true); fetchPrices(); };

  // Apply search + filter
  const filtered = prices.filter((p) => {
    const name   = p.product_detail?.name?.toLowerCase() ?? "";
    const wilaya = p.wilaya?.toLowerCase() ?? "";
    const q      = search.toLowerCase();

    const matchesSearch = !q || name.includes(q) || wilaya.includes(q);
    const matchesFilter =
      activeFilter === "all" ||
      (activeFilter === "national" && !p.wilaya) ||
      p.wilaya?.toLowerCase() === activeFilter.toLowerCase();

    return matchesSearch && matchesFilter;
  });

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>

      {/* ── HERO ── */}
      <View style={styles.hero}>
        <View style={styles.heroTopRow}>
          <View>
            <Text style={styles.heroLabel}>Ministry Guidelines</Text>
            <Text style={styles.heroTitle}>Official Prices</Text>
            <Text style={styles.heroSub}>Government regulated market rates</Text>
          </View>
          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={() => { setRefreshing(true); fetchPrices(); }}
          >
            <MaterialIcons name="refresh" size={20} color="rgba(255,255,255,0.9)" />
          </TouchableOpacity>
        </View>

        {/* STATS */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLbl}>Products</Text>
            <Text style={styles.statVal}>{loading ? "—" : stats.products}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLbl}>Wilayas</Text>
            <Text style={styles.statVal}>{loading ? "—" : stats.wilayas}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLbl}>Updated</Text>
            <Text style={styles.statVal}>{stats.updated}</Text>
          </View>
        </View>
      </View>

      {/* ── SEARCH ── */}
      <View style={styles.searchWrap}>
        <MaterialIcons name="search" size={17} color="#9ca3af" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by product or wilaya…"
          placeholderTextColor="#c4c4c4"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <MaterialIcons name="close" size={15} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>

      {/* ── FILTER CHIPS ── */}
      <View style={styles.filterBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          {[
            { key: "all",      label: "All" },
            { key: "national", label: "National" },
            ...wilayaFilters.map((w) => ({ key: w, label: w })),
          ].map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, activeFilter === f.key && styles.filterChipActive]}
              onPress={() => setActiveFilter(f.key)}
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter === f.key && styles.filterTextActive,
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── CONTENT ── */}
      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#047857" />
          <Text style={styles.loadingText}>Loading market prices…</Text>
        </View>
      ) : error ? (
        <View style={styles.centerState}>
          <MaterialIcons name="wifi-off" size={36} color="#d1d5db" />
          <Text style={styles.emptyTitle}>Connection error</Text>
          <Text style={styles.emptySub}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchPrices}>
            <Text style={styles.retryBtnText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#047857"
            />
          }
          renderItem={({ item }) => <PriceCard item={item} />}
          ListHeaderComponent={
            filtered.length > 0 ? (
              <Text style={styles.sectionHead}>
                {filtered.length} price{filtered.length !== 1 ? "s" : ""} found
              </Text>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.centerState}>
              <MaterialIcons name="search-off" size={36} color="#d1d5db" />
              <Text style={styles.emptyTitle}>No prices found</Text>
              <Text style={styles.emptySub}>
                {search
                  ? `No results for "${search}"`
                  : "No prices available for this filter"}
              </Text>
            </View>
          }
          ListFooterComponent={<View style={{ height: 30 }} />}
        />
      )}
    </SafeAreaView>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f5f8f5" },

  // ── HERO
  hero: {
    backgroundColor: "#047857",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  heroLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#a7f3d0",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 3,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.4,
  },
  heroSub: { fontSize: 12, color: "#a7f3d0", marginTop: 2 },
  refreshBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },

  statsRow: { flexDirection: "row", gap: 8 },
  statBox: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    padding: 10,
  },
  statLbl: {
    fontSize: 9,
    fontWeight: "700",
    color: "#a7f3d0",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 3,
  },
  statVal: { fontSize: 17, fontWeight: "800", color: "#fff", letterSpacing: -0.3 },

  // ── SEARCH
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    marginHorizontal: 14,
    marginTop: 14,
    marginBottom: 0,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 13,
    borderWidth: 0.5,
    borderColor: "#e4efe4",
  },
  searchInput: { flex: 1, fontSize: 13, color: "#1a2e1a" },

  // ── FILTERS
  filterBar: {
    backgroundColor: "#fff",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e4efe4",
    marginTop: 10,
  },
  filterContent: { paddingHorizontal: 14, paddingVertical: 10, gap: 7 },
  filterChip: {
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#f5f8f5",
    borderWidth: 0.5,
    borderColor: "#e4efe4",
  },
  filterChipActive: { backgroundColor: "#047857", borderColor: "#047857" },
  filterText:       { fontSize: 12, fontWeight: "700", color: "#6b7280" },
  filterTextActive: { color: "#fff" },

  // ── SECTION HEAD
  sectionHead: {
    fontSize: 9,
    fontWeight: "700",
    color: "#9ca3af",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 10,
  },

  // ── PRICE CARD
  priceCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: "#e4efe4",
  },

  pcTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 11,
  },
  pcEmojiBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#f0faf0",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  pcEmoji: { fontSize: 20 },
  pcName: { fontSize: 14, fontWeight: "800", color: "#1a2e1a", letterSpacing: -0.2 },
  pcLocRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
  pcLocText: { fontSize: 11, color: "#9ca3af", fontWeight: "600" },

  pcScopeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 20,
    paddingVertical: 3,
    paddingHorizontal: 9,
    alignSelf: "flex-start",
  },
  badgeNational:     { backgroundColor: "#dbeafe" },
  badgeWilaya:       { backgroundColor: "#f0ecff" },
  pcScopeText:       { fontSize: 10, fontWeight: "700" },
  badgeNationalText: { color: "#1d4ed8" },
  badgeWilayaText:   { color: "#6336c7" },

  // PRICE BLOCK
  pcPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8faf8",
    borderRadius: 12,
    padding: 12,
    borderWidth: 0.5,
    borderColor: "#e4efe4",
  },
  pcPriceLbl: {
    fontSize: 9,
    fontWeight: "700",
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  pcPriceVal: {
    fontSize: 16,
    fontWeight: "800",
    color: "#047857",
    letterSpacing: -0.4,
  },
  pcUnit: { fontSize: 10, color: "#9ca3af", marginTop: 2 },
  pcDivider: {
    width: 0.5,
    height: 36,
    backgroundColor: "#e4efe4",
    marginHorizontal: 12,
  },
  pcMid: { alignItems: "flex-end" },
  pcMidVal: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1a2e1a",
    letterSpacing: -0.4,
  },

  // TREND BAR
  trendWrap: { marginTop: 10 },
  trendLbl: {
    fontSize: 9,
    fontWeight: "700",
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 5,
  },
  trendTrack: {
    height: 5,
    backgroundColor: "#e5e7eb",
    borderRadius: 10,
    overflow: "hidden",
  },
  trendFill: {
    height: "100%",
    borderRadius: 10,
  },

  // UPDATED ROW
  updatedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  pulseDot: { width: 6, height: 6, borderRadius: 3 },
  updatedText: { fontSize: 10, color: "#9ca3af", fontWeight: "600" },

  // ── LIST
  listContent: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 30 },

  // ── STATES
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    paddingHorizontal: 32,
    gap: 8,
  },
  loadingText: { fontSize: 13, color: "#9ca3af", marginTop: 4 },
  emptyTitle:  { fontSize: 14, fontWeight: "700", color: "#9ca3af" },
  emptySub:    { fontSize: 12, color: "#c4c4c4", textAlign: "center" },
  retryBtn: {
    marginTop: 8,
    backgroundColor: "#f0faf0",
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 20,
    borderWidth: 0.5,
    borderColor: "#c6e8c6",
  },
  retryBtnText: { fontSize: 13, fontWeight: "700", color: "#047857" },
});