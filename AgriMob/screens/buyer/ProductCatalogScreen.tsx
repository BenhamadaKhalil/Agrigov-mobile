import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  StatusBar,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MarketStackParamList } from "../../navigation/BuyerTabNavigator";
import { productApi } from "../../apis/product.api";

const formatDZD = (value: number) =>
  new Intl.NumberFormat("fr-DZ").format(value) + " DZD";

const CATEGORIES: {
  label: string;
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
}[] = [
  { label: "All",        icon: "apps" },
  { label: "Vegetables", icon: "eco" },
  { label: "Grains",     icon: "grass" },
  { label: "Fruits",     icon: "local-florist" },
  { label: "Legumes",    icon: "spa" },
  { label: "Dairy",      icon: "water-drop" },
];

interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  unit: string;
  image: string;
  location: string;
  grade: string;
}

function gradeColor(grade: string) {
  if (grade === "A") return { bg: "#d1fae5", text: "#047857" };
  if (grade === "B") return { bg: "#dbeafe", text: "#1d4ed8" };
  return { bg: "#f3f4f6", text: "#6b7280" };
}

export default function ProductCatalogScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<MarketStackParamList>>();

  const [products, setProducts]             = useState<Product[]>([]);
  const [search, setSearch]                 = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [loading, setLoading]               = useState(true);
  const [filterVisible, setFilterVisible]   = useState(false);
  const [sortOrder, setSortOrder]           = useState("none");
  const [gradeFilter, setGradeFilter]       = useState("All");
  const [locationFilter, setLocationFilter] = useState("All");
  const [priceRangeFilter, setPriceRangeFilter] = useState("All");

  useEffect(() => {
    (async () => {
      try {
        const response: any = await productApi.list("");
        const results = response.results ? response.results : response;
        const mapped: Product[] = results.map((item: any) => ({
          id:          item.id.toString(),
          name:        item.ministry_product?.name || "Unknown Product",
          category:    item.category_name || "Uncategorized",
          description: item.description || "",
          price:       parseFloat(item.unit_price) || 0,
          unit:        "kg",
          image:       item.images?.[0]?.image || "https://via.placeholder.com/400x200",
          location:    item.farm?.wilaya || "Unknown Location",
          grade:       "A",
        }));
        setProducts(mapped);
      } catch (e) {
        console.error("Error fetching products:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const availableLocations = ["All", ...Array.from(new Set(products.map(p => p.location).filter(Boolean)))].slice(0, 8);

  // FIX: trim + lowercase on both sides, also searches description & location
  const filtered = products.filter((p) => {
    const term = search.trim().toLowerCase();
    const matchSearch =
      !term ||
      p.name.toLowerCase().includes(term) ||
      p.description.toLowerCase().includes(term) ||
      p.location.toLowerCase().includes(term);
    const matchCat =
      activeCategory === "All" ||
      p.category.trim().toLowerCase() === activeCategory.trim().toLowerCase();
    const matchGrade = gradeFilter === "All" || p.grade === gradeFilter;
    const matchLoc = locationFilter === "All" || p.location === locationFilter;
    
    let matchPrice = true;
    if (priceRangeFilter === "Under 100") matchPrice = p.price < 100;
    else if (priceRangeFilter === "100 - 500") matchPrice = p.price >= 100 && p.price <= 500;
    else if (priceRangeFilter === "500+") matchPrice = p.price > 500;

    return matchSearch && matchCat && matchGrade && matchLoc && matchPrice;
  }).sort((a, b) => {
    if (sortOrder === "asc") return a.price - b.price;
    if (sortOrder === "desc") return b.price - a.price;
    return 0;
  });

  const handleCardPress = useCallback(
    (id: string) => navigation.navigate("ProductDetails", { productId: id }),
    [navigation]
  );

  const renderItem = ({ item }: { item: Product }) => {
    const gc = gradeColor(item.grade);
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handleCardPress(item.id)}
        activeOpacity={0.92}
      >
        {/* Hero image with floating badges */}
        <View style={styles.imageWrap}>
          <Image
            source={{ uri: item.image }}
            style={styles.cardImage}
            resizeMode="cover"
          />

          {/* Category tag — top left */}
          <View style={styles.categoryTag}>
            <Text style={styles.categoryTagText}>{item.category}</Text>
          </View>

          {/* Grade badge — top right */}
          <View style={[styles.gradeBadge, { backgroundColor: gc.bg }]}>
            <MaterialIcons name="verified" size={11} color={gc.text} />
            <Text style={[styles.gradeBadgeText, { color: gc.text }]}>
              Grade {item.grade}
            </Text>
          </View>

          {/* Location chip — bottom left over image */}
          <View style={styles.locationChip}>
            <MaterialIcons name="place" size={11} color="#fff" />
            <Text style={styles.locationChipText}>{item.location}</Text>
          </View>
        </View>

        {/* Card body */}
        <View style={styles.cardBody}>
          <Text style={styles.cardName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.cardDesc} numberOfLines={2}>
            {item.description || "Premium quality agricultural product."}
          </Text>

          <View style={styles.priceRow}>
            <View>
              <Text style={styles.cardPrice}>{formatDZD(item.price)}</Text>
              <Text style={styles.cardUnit}>per {item.unit}</Text>
            </View>
            <View style={styles.tapHint}>
              <Text style={styles.tapHintText}>View details</Text>
              <View style={styles.tapArrow}>
                <MaterialIcons name="arrow-forward" size={14} color="#065f46" />
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const ListHeader = () => (
    <>
      {/* Search */}
      <View style={styles.searchWrap}>
        <MaterialIcons name="search" size={17} color="#9ca3af" />
        <TextInput
          placeholder="Search products, farms, locations…"
          placeholderTextColor="#b0c0b0"
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {search.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearch("")}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialIcons name="close" size={16} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>

      {/* Category pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryRow}
        decelerationRate="fast"
      >
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.label;
          return (
            <TouchableOpacity
              key={cat.label}
              style={[styles.catPill, isActive && styles.catPillActive]}
              onPress={() => setActiveCategory(cat.label)}
              activeOpacity={0.75}
            >
              <MaterialIcons
                name={cat.icon}
                size={14}
                color={isActive ? "#047857" : "#9ca3af"}
              />
              <Text
                style={[
                  styles.catPillText,
                  isActive && styles.catPillTextActive,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Results count + clear filters */}
      <View style={styles.resultsRow}>
        <Text style={styles.resultsCount}>
          {filtered.length}{" "}
          {filtered.length === 1 ? "product" : "products"}
          {activeCategory !== "All" ? ` in ${activeCategory}` : ""}
        </Text>
        {(search.trim().length > 0 || activeCategory !== "All" || gradeFilter !== "All" || sortOrder !== "none" || locationFilter !== "All" || priceRangeFilter !== "All") && (
          <TouchableOpacity
            style={styles.clearFiltersBtn}
            onPress={() => {
              setSearch("");
              setActiveCategory("All");
              setGradeFilter("All");
              setSortOrder("none");
              setLocationFilter("All");
              setPriceRangeFilter("All");
            }}
          >
            <MaterialIcons name="filter-alt-off" size={13} color="#ef4444" />
            <Text style={styles.clearFiltersText}>Clear filters</Text>
          </TouchableOpacity>
        )}
      </View>
    </>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={["top"]}>
        <StatusBar barStyle="dark-content" backgroundColor="#f5f8f5" />
        <View style={styles.loadingInner}>
          <View style={styles.loadingIconBox}>
            <MaterialIcons name="agriculture" size={28} color="#047857" />
          </View>
          <ActivityIndicator
            size="large"
            color="#0df20d"
            style={{ marginTop: 16 }}
          />
          <Text style={styles.loadingText}>Loading market…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Sticky top bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.topBarSub}>AGRIMARKET</Text>
          <Text style={styles.topBarTitle}>Marketplace</Text>
        </View>
        <View style={styles.topBarRight}>
          <View style={styles.productCountBadge}>
            <Text style={styles.productCountText}>{products.length}</Text>
          </View>
          <TouchableOpacity 
            style={styles.filterIconBtn}
            onPress={() => setFilterVisible(true)}
          >
            <MaterialIcons name="tune" size={18} color="#047857" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={<ListHeader />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconBox}>
              <MaterialIcons name="search-off" size={30} color="#9ca3af" />
            </View>
            <Text style={styles.emptyTitle}>No products found</Text>
            <Text style={styles.emptySub}>
              {search.trim()
                ? `No results for "${search}"`
                : `No products in ${activeCategory}`}
            </Text>
            <TouchableOpacity
              style={styles.emptyResetBtn}
              onPress={() => {
                setSearch("");
                setActiveCategory("All");
              }}
            >
              <Text style={styles.emptyResetText}>Show all products</Text>
            </TouchableOpacity>
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      />

      {/* FILTER MODAL */}
      <Modal
        visible={filterVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFilterVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPressOut={() => setFilterVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter & Sort</Text>
              <TouchableOpacity onPress={() => setFilterVisible(false)}>
                <MaterialIcons name="close" size={24} color="#1a2e1a" />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalSectionTitle}>Sort by Price</Text>
              <View style={styles.modalRow}>
                {[
                  { id: "none", label: "Default" },
                  { id: "asc", label: "Low to High" },
                  { id: "desc", label: "High to Low" }
                ].map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={[styles.modalChip, sortOrder === s.id && styles.modalChipActive]}
                    onPress={() => setSortOrder(s.id)}
                  >
                    <Text style={[styles.modalChipText, sortOrder === s.id && styles.modalChipTextActive]}>{s.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.modalSectionTitle}>Price Range</Text>
              <View style={styles.modalRow}>
                {["All", "Under 100", "100 - 500", "500+"].map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.modalChip, priceRangeFilter === p && styles.modalChipActive]}
                    onPress={() => setPriceRangeFilter(p)}
                  >
                    <Text style={[styles.modalChipText, priceRangeFilter === p && styles.modalChipTextActive]}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.modalSectionTitle}>Location</Text>
              <View style={styles.modalRow}>
                {availableLocations.map((loc) => (
                  <TouchableOpacity
                    key={loc}
                    style={[styles.modalChip, locationFilter === loc && styles.modalChipActive]}
                    onPress={() => setLocationFilter(loc)}
                  >
                    <Text style={[styles.modalChipText, locationFilter === loc && styles.modalChipTextActive]}>{loc}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.modalSectionTitle}>Grade</Text>
              <View style={styles.modalRow}>
                {["All", "A", "B", "C"].map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.modalChip, gradeFilter === g && styles.modalChipActive]}
                    onPress={() => setGradeFilter(g)}
                  >
                    <Text style={[styles.modalChipText, gradeFilter === g && styles.modalChipTextActive]}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <TouchableOpacity 
                style={styles.modalApplyBtn}
                onPress={() => setFilterVisible(false)}
              >
                <Text style={styles.modalApplyText}>Show Results</Text>
              </TouchableOpacity>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: "#f5f8f5" },
  loadingContainer: { flex: 1, backgroundColor: "#f5f8f5" },
  loadingInner:     { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingIconBox:   { width: 64, height: 64, borderRadius: 20, backgroundColor: "#d1fae5", alignItems: "center", justifyContent: "center" },
  loadingText:      { fontSize: 13, fontWeight: "600", color: "#9ca3af", marginTop: 10 },

  // TOP BAR
  topBar:            { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, backgroundColor: "#fff", borderBottomWidth: 0.5, borderBottomColor: "#eef2ee" },
  topBarSub:         { fontSize: 9, fontWeight: "800", color: "#047857", letterSpacing: 0.8, marginBottom: 2 },
  topBarTitle:       { fontSize: 22, fontWeight: "800", color: "#1a2e1a", letterSpacing: -0.5 },
  topBarRight:       { flexDirection: "row", alignItems: "center", gap: 8 },
  productCountBadge: { backgroundColor: "#f0fdf4", borderRadius: 10, borderWidth: 0.5, borderColor: "#d1fae5", paddingHorizontal: 10, paddingVertical: 4 },
  productCountText:  { fontSize: 12, fontWeight: "800", color: "#047857" },
  filterIconBtn:     { width: 36, height: 36, borderRadius: 10, backgroundColor: "#d1fae5", alignItems: "center", justifyContent: "center" },

  listContent: { paddingHorizontal: 14, paddingBottom: 24 },

  // SEARCH
  searchWrap:  { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#fff", marginTop: 14, marginBottom: 2, borderRadius: 14, borderWidth: 0.5, borderColor: "#e4efe4", paddingHorizontal: 14, paddingVertical: 12, shadowColor: "#1a2e1a", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  searchInput: { flex: 1, fontSize: 13, color: "#1a2e1a", padding: 0, fontWeight: "500" },

  // CATEGORY PILLS
  categoryRow:       { paddingVertical: 12, gap: 8 },
  catPill:           { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#fff", borderWidth: 0.5, borderColor: "#e4efe4", borderRadius: 20, paddingHorizontal: 13, paddingVertical: 7, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 2, elevation: 1 },
  catPillActive:     { backgroundColor: "#d1fae5", borderColor: "#6ee7b7", borderWidth: 1 },
  catPillText:       { fontSize: 12, fontWeight: "700", color: "#9ca3af" },
  catPillTextActive: { color: "#047857" },

  // RESULTS ROW
  resultsRow:       { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10, paddingHorizontal: 2 },
  resultsCount:     { fontSize: 12, fontWeight: "700", color: "#9ca3af" },
  clearFiltersBtn:  { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#fff5f5", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 0.5, borderColor: "#fecaca" },
  clearFiltersText: { fontSize: 11, fontWeight: "700", color: "#ef4444" },

  // CARD
  card:      { backgroundColor: "#fff", borderRadius: 20, overflow: "hidden", borderWidth: 0.5, borderColor: "#e4efe4", shadowColor: "#1a2e1a", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  imageWrap: { position: "relative", width: "100%", height: 190 },
  cardImage: { width: "100%", height: "100%" },

  // Floating image overlays
  gradeBadge:       { position: "absolute", top: 12, right: 12, flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 3, elevation: 3 },
  gradeBadgeText:   { fontSize: 10, fontWeight: "800", letterSpacing: 0.2 },
  categoryTag:      { position: "absolute", top: 12, left: 12, backgroundColor: "rgba(0,0,0,0.55)", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  categoryTagText:  { fontSize: 10, fontWeight: "800", color: "#fff", letterSpacing: 0.3, textTransform: "uppercase" },
  locationChip:     { position: "absolute", bottom: 10, left: 12, flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  locationChipText: { fontSize: 11, color: "#fff", fontWeight: "600" },

  // Card body
  cardBody:      { padding: 16 },
  cardName:      { fontSize: 18, fontWeight: "800", color: "#1a2e1a", letterSpacing: -0.4, marginBottom: 5 },
  cardDesc:      { fontSize: 13, color: "#9ca3af", lineHeight: 18, marginBottom: 14, fontWeight: "500" },
  priceRow:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardPrice:     { fontSize: 18, fontWeight: "800", color: "#1a2e1a", letterSpacing: -0.4 },
  cardUnit:      { fontSize: 11, color: "#9ca3af", fontWeight: "600", marginTop: 1 },
  tapHint:       { flexDirection: "row", alignItems: "center", gap: 6 },
  tapHintText:   { fontSize: 12, fontWeight: "700", color: "#047857" },
  tapArrow:      { width: 30, height: 30, borderRadius: 10, backgroundColor: "#d1fae5", alignItems: "center", justifyContent: "center" },

  // EMPTY
  emptyState:     { alignItems: "center", paddingVertical: 50, gap: 10 },
  emptyIconBox:   { width: 64, height: 64, borderRadius: 20, backgroundColor: "#f3f4f6", alignItems: "center", justifyContent: "center", marginBottom: 4 },
  emptyTitle:     { fontSize: 16, fontWeight: "800", color: "#374151" },
  emptySub:       { fontSize: 13, color: "#9ca3af", textAlign: "center", fontWeight: "500" },
  emptyResetBtn:  { marginTop: 6, backgroundColor: "#d1fae5", borderRadius: 20, paddingHorizontal: 18, paddingVertical: 9 },
  emptyResetText: { fontSize: 13, fontWeight: "800", color: "#047857" },

  // MODAL
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", paddingHorizontal: 20 },
  modalContent: { backgroundColor: "#fff", borderRadius: 24, padding: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5, maxHeight: "80%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: "800", color: "#1a2e1a", letterSpacing: -0.5 },
  modalSectionTitle: { fontSize: 13, fontWeight: "700", color: "#9ca3af", marginBottom: 12, marginTop: 16, textTransform: "uppercase", letterSpacing: 0.5 },
  modalRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  modalChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: "#f5f8f5", borderWidth: 1, borderColor: "#e4efe4" },
  modalChipActive: { backgroundColor: "#d1fae5", borderColor: "#0df20d" },
  modalChipText: { fontSize: 13, fontWeight: "700", color: "#6b7280" },
  modalChipTextActive: { color: "#047857" },
  modalApplyBtn: { marginTop: 30, backgroundColor: "#047857", paddingVertical: 14, borderRadius: 16, alignItems: "center" },
  modalApplyText: { color: "#fff", fontSize: 15, fontWeight: "800" },
});