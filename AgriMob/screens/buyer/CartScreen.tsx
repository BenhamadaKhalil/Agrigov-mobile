import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useFocusEffect } from "@react-navigation/native";
import { BuyerTabParamList } from "../../navigation/BuyerTabNavigator";
import { cartApi } from "../../apis/cart.api";

const formatDZD = (value: number) =>
  new Intl.NumberFormat("fr-DZ").format(Math.round(value)) + " DZD";

export default function CartScreen() {
  const navigation =
    useNavigation<BottomTabNavigationProp<BuyerTabParamList>>();

  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCart = async () => {
    try {
      const res: any = await cartApi.get();
      setCart(res.items || []);
    } catch (err: any) {
      if (err.message) Alert.alert("Cart Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCart();
    }, []),
  );

  const updateQuantity = async (id: number, delta: number) => {
    const item = cart.find((i) => i.id === id);
    if (!item) return;
    const newQty = Math.max(1, item.quantity + delta);
    setCart((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, quantity: newQty, total_price: i.price * newQty }
          : i,
      ),
    );
    try {
      await cartApi.update(id, newQty);
    } catch {
      fetchCart();
    }
  };

  const removeItem = async (id: number) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
    try {
      await cartApi.remove(id);
    } catch {
      fetchCart();
    }
  };

  const subtotal = useMemo(
    () => cart.reduce((sum, i) => sum + parseFloat(i.total_price || 0), 0),
    [cart],
  );
  const levy = subtotal * 0.01;
  const total = subtotal + levy;

  const renderItem = ({ item }: any) => {
    const product = item.product || {};
    const title = product.ministry_product?.name || "Unknown Product";
    const imageUri =
      product.images?.[0]?.image || "https://via.placeholder.com/80";

    return (
      <View style={styles.cartCard}>
        {/* Left accent */}
        <View style={styles.cardAccent} />

        <Image source={{ uri: imageUri }} style={styles.cartImage} />

        <View style={styles.cartContent}>
          <View style={styles.cartTopRow}>
            <Text style={styles.cartName} numberOfLines={1}>
              {title}
            </Text>
            <TouchableOpacity
              onPress={() => removeItem(item.id)}
              style={styles.removeBtn}
            >
              <MaterialIcons name="close" size={14} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          <Text style={styles.cartUnit}>
            {formatDZD(parseFloat(item.price))} / kg
          </Text>

          <View style={styles.cartFooterRow}>
            <View style={styles.qtyStepper}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => updateQuantity(item.id, -1)}
              >
                <MaterialIcons name="remove" size={14} color="#047857" />
              </TouchableOpacity>
              <Text style={styles.qtyVal}>{item.quantity}</Text>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => updateQuantity(item.id, 1)}
              >
                <MaterialIcons name="add" size={14} color="#047857" />
              </TouchableOpacity>
            </View>

            <Text style={styles.cartTotal}>
              {formatDZD(parseFloat(item.total_price))}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={["top"]}>
        <ActivityIndicator size="large" color="#0df20d" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>YOUR BASKET</Text>
          <Text style={styles.headerTitle}>My Cart</Text>
        </View>
        {cart.length > 0 && (
          <TouchableOpacity
            onPress={() =>
              Alert.alert("Clear Cart", "Remove all items?", [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Clear",
                  style: "destructive",
                  onPress: () => cart.forEach((i) => removeItem(i.id)),
                },
              ])
            }
          >
            <Text style={styles.clearText}>Clear all</Text>
          </TouchableOpacity>
        )}
      </View>

      {cart.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconBox}>
            <MaterialIcons name="shopping-cart" size={32} color="#9ca3af" />
          </View>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySub}>
            Browse the marketplace and add products to your cart
          </Text>
        </View>
      ) : (
        <>
          <FlatList
            data={cart}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />

          {/* Summary Card */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Order Summary</Text>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                Subtotal ({cart.length} item{cart.length !== 1 ? "s" : ""})
              </Text>
              <Text style={styles.summaryVal}>{formatDZD(subtotal)}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Platform levy (1%)</Text>
              <Text style={styles.summaryVal}>{formatDZD(levy)}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalVal}>{formatDZD(total)}</Text>
            </View>

            <TouchableOpacity
              style={styles.checkoutBtn}
              onPress={() => navigation.navigate("Checkout")}
            >
              <Text style={styles.checkoutText}>Proceed to Checkout</Text>
              <MaterialIcons name="arrow-forward" size={16} color="#065f46" />
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f8f5",
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f8f5",
  },

  // ── HEADER
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 0.5,
    borderBottomColor: "#f0f0f0",
  },

  headerSub: {
    fontSize: 10,
    fontWeight: "700",
    color: "#047857",
    letterSpacing: 0.5,
    marginBottom: 2,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1a2e1a",
    letterSpacing: -0.4,
  },

  clearText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ef4444",
  },

  listContent: {
    padding: 14,
    paddingBottom: 8,
  },

  // ── CART CARD
  cartCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: "#e4efe4",
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    paddingRight: 14,
    paddingVertical: 12,
  },

  cardAccent: {
    width: 4,
    alignSelf: "stretch",
    backgroundColor: "#0df20d",
    marginRight: 12,
  },

  cartImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    marginRight: 12,
  },

  cartContent: {
    flex: 1,
  },

  cartTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 2,
  },

  cartName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1a2e1a",
    flex: 1,
    marginRight: 8,
  },

  removeBtn: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },

  cartUnit: {
    fontSize: 11,
    color: "#9ca3af",
    fontWeight: "600",
    marginBottom: 8,
  },

  cartFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  qtyStepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#f8faf8",
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: "#e4efe4",
    paddingHorizontal: 4,
    paddingVertical: 3,
  },

  qtyBtn: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: "#d1fae5",
    alignItems: "center",
    justifyContent: "center",
  },

  qtyVal: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1a2e1a",
    minWidth: 24,
    textAlign: "center",
  },

  cartTotal: {
    fontSize: 15,
    fontWeight: "800",
    color: "#047857",
    letterSpacing: -0.3,
  },

  // ── SUMMARY CARD
  summaryCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 18,
    borderTopWidth: 0.5,
    borderColor: "#e4efe4",
  },

  summaryTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1a2e1a",
    marginBottom: 12,
    letterSpacing: -0.1,
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 7,
  },

  summaryLabel: {
    fontSize: 12,
    color: "#9ca3af",
    fontWeight: "600",
  },

  summaryVal: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
  },

  divider: {
    height: 0.5,
    backgroundColor: "#e4efe4",
    marginVertical: 10,
  },

  totalLabel: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1a2e1a",
  },

  totalVal: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1a2e1a",
    letterSpacing: -0.4,
  },

  checkoutBtn: {
    backgroundColor: "#0df20d",
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 12,
  },

  checkoutText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#065f46",
  },

  // ── EMPTY
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 40,
  },

  emptyIconBox: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#374151",
  },

  emptySub: {
    fontSize: 13,
    color: "#9ca3af",
    textAlign: "center",
    lineHeight: 18,
  },
});
