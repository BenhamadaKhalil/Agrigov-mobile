import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TextInput, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { officialPriceApi, OfficialPrice } from "../../apis/officialPrice.api";

export default function OfficialPricesScreen() {
  const [prices, setPrices] = useState<OfficialPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchPrices();
  }, []);

  const fetchPrices = async () => {
    try {
      setLoading(true);
      const data: any = await officialPriceApi.activePrices();
      // DRF list views might return { results: [...] } or [...]
      const results = Array.isArray(data) ? data : data.results || [];
      setPrices(results);
    } catch (err) {
      console.error("Failed to load prices", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPrices = prices.filter((p) =>
    p.product_detail?.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.wilaya?.toLowerCase().includes(search.toLowerCase())
  );

  const renderItem = ({ item }: { item: OfficialPrice }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconBox}>
          <MaterialIcons name="local-offer" size={20} color="#047857" />
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.product_detail?.name || "Unknown Product"}</Text>
          {item.wilaya ? (
            <View style={styles.locationRow}>
              <MaterialIcons name="location-on" size={12} color="#6b7280" />
              <Text style={styles.wilayaText}>{item.wilaya} {item.region_name && item.region_name !== "National" ? `- ${item.region_name}` : ""}</Text>
            </View>
          ) : (
            <View style={styles.locationRow}>
              <MaterialIcons name="public" size={12} color="#6b7280" />
              <Text style={styles.wilayaText}>National Price</Text>
            </View>
          )}
        </View>
        <View style={styles.priceWrap}>
          <Text style={styles.priceVal}>{Number(item.min_price).toLocaleString("fr-DZ")} - {Number(item.max_price).toLocaleString("fr-DZ")} DZD</Text>
          <Text style={styles.priceUnit}>per {item.unit || "kg"}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>MINISTRY GUIDELINES</Text>
          <Text style={styles.headerTitle}>Official Prices</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchPrices}>
          <Ionicons name="refresh" size={20} color="#047857" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrap}>
        <MaterialIcons name="search" size={18} color="#9ca3af" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by product or wilaya..."
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <MaterialIcons name="close" size={18} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0df20d" />
        </View>
      ) : filteredPrices.length === 0 ? (
        <View style={styles.center}>
          <MaterialIcons name="info-outline" size={48} color="#d1d5db" />
          <Text style={styles.emptyText}>No official prices found.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredPrices}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f8f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb",
  },
  headerSub: {
    fontSize: 10,
    fontWeight: "700",
    color: "#047857",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1a2e1a",
    letterSpacing: -0.5,
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#ecfdf5",
    alignItems: "center",
    justifyContent: "center",
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#374151",
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#ecfdf5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 2,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  wilayaText: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },
  priceWrap: {
    alignItems: "flex-end",
  },
  priceVal: {
    fontSize: 16,
    fontWeight: "800",
    color: "#047857",
  },
  priceUnit: {
    fontSize: 10,
    fontWeight: "600",
    color: "#9ca3af",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: "#9ca3af",
  },
});
