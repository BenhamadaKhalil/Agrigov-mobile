import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useFocusEffect } from "@react-navigation/native";
import { cartApi } from "../../apis/cart.api";
import { orderApi } from "../../apis/order.api";

const formatDZD = (value: number) =>
  new Intl.NumberFormat("fr-DZ").format(Math.round(value)) + " DZD";

export default function CheckoutScreen() {
  const navigation = useNavigation<any>();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [subtotal, setSubtotal] = useState(0);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Delivery address state
  const [editingAddress, setEditingAddress] = useState(false);
  const [address, setAddress] = useState({
    fullName: "",
    wilaya: "",
    baladiya: "",
    phone: "",
    street: "",
  });

  // Fetch cart items
  useFocusEffect(
    useCallback(() => {
      const fetchCart = async () => {
        try {
          const res: any = await cartApi.get();
          setProducts(res.items || []);
          setSubtotal(parseFloat(res.total_price || 0));
        } catch (err) {
          console.error("Failed to fetch cart:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchCart();
    }, []),
  );

  // Fetch user profile to pre-fill address
  useFocusEffect(
    useCallback(() => {
      const fetchProfile = async () => {
        try {
          const { profileApi } = await import("../../apis/profile.api");
          const profile: any = await profileApi.me();
          setAddress({
            fullName: profile?.full_name || profile?.username || "",
            wilaya: profile?.wilaya || "",
            baladiya: profile?.baladiya || "",
            phone: profile?.phone || "",
            street: profile?.delivery_address || "",
          });
        } catch (err) {
          console.error("Failed to fetch profile:", err);
        }
      };
      fetchProfile();
    }, []),
  );

  const levy = subtotal * 0.01;
  const total = subtotal + levy;

  const handleCheckout = async () => {
    if (!address.wilaya || !address.baladiya || !address.phone) {
      Alert.alert("Missing Info", "Please fill in your delivery address details.");
      return;
    }

    setCheckoutLoading(true);
    try {
      const payload = {
        delivery_address: address.street || `${address.wilaya}, ${address.baladiya}`,
        wilaya: address.wilaya,
        baladiya: address.baladiya,
        phone: address.phone,
        notes: "",
      };

      await orderApi.checkout(payload);
      await cartApi.clear().catch(() => {});

      Alert.alert(
        "Order Placed! 🎉",
        "Your order has been placed successfully.",
        [{ text: "View Orders", onPress: () => navigation.navigate("Orders") }],
      );
    } catch (err: any) {
      console.error("Checkout error:", err);
      Alert.alert(
        "Checkout Failed",
        err.response?.data?.detail || err.message || "An error occurred",
      );
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={["top"]}>
        <ActivityIndicator size="large" color="#0df20d" />
      </SafeAreaView>
    );
  }

  const addressFilled =
    address.fullName || address.wilaya || address.baladiya || address.phone;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={20} color="#1a2e1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Step Indicator */}
          <View style={styles.stepRow}>
            {["Address", "Confirm"].map((step, i) => (
              <React.Fragment key={step}>
                <View style={styles.stepItem}>
                  <View style={[styles.stepDot, i === 0 && styles.stepDotActive]}>
                    {i === 0 ? (
                      <MaterialIcons name="check" size={10} color="#065f46" />
                    ) : (
                      <Text style={styles.stepDotNum}>{i + 1}</Text>
                    )}
                  </View>
                  <Text style={[styles.stepLabel, i === 0 && styles.stepLabelActive]}>
                    {step}
                  </Text>
                </View>
                {i < 1 && <View style={[styles.stepLine, i === 0 && styles.stepLineDone]} />}
              </React.Fragment>
            ))}
          </View>

          {/* Delivery Address Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconBox}>
                <MaterialIcons name="place" size={16} color="#047857" />
              </View>
              <Text style={styles.cardTitle}>Delivery Address</Text>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => setEditingAddress((v) => !v)}
              >
                <Text style={styles.editBtnText}>
                  {editingAddress ? "Done" : "Edit"}
                </Text>
              </TouchableOpacity>
            </View>

            {editingAddress ? (
              /* ── Editable fields ── */
              <View style={styles.editForm}>
                <View style={styles.editField}>
                  <Text style={styles.editFieldLabel}>Full Name</Text>
                  <TextInput
                    style={styles.editInput}
                    value={address.fullName}
                    onChangeText={(v) => setAddress({ ...address, fullName: v })}
                    placeholder="Your full name"
                    placeholderTextColor="#c4c4c4"
                  />
                </View>
                <View style={styles.editRow}>
                  <View style={[styles.editField, { flex: 1 }]}>
                    <Text style={styles.editFieldLabel}>Wilaya</Text>
                    <TextInput
                      style={styles.editInput}
                      value={address.wilaya}
                      onChangeText={(v) => setAddress({ ...address, wilaya: v })}
                      placeholder="e.g. Jijel"
                      placeholderTextColor="#c4c4c4"
                    />
                  </View>
                  <View style={[styles.editField, { flex: 1 }]}>
                    <Text style={styles.editFieldLabel}>Baladiya</Text>
                    <TextInput
                      style={styles.editInput}
                      value={address.baladiya}
                      onChangeText={(v) => setAddress({ ...address, baladiya: v })}
                      placeholder="e.g. Taher"
                      placeholderTextColor="#c4c4c4"
                    />
                  </View>
                </View>
                <View style={styles.editField}>
                  <Text style={styles.editFieldLabel}>Street / Additional Info</Text>
                  <TextInput
                    style={styles.editInput}
                    value={address.street}
                    onChangeText={(v) => setAddress({ ...address, street: v })}
                    placeholder="Street, building, apartment..."
                    placeholderTextColor="#c4c4c4"
                  />
                </View>
                <View style={styles.editField}>
                  <Text style={styles.editFieldLabel}>Phone</Text>
                  <TextInput
                    style={styles.editInput}
                    value={address.phone}
                    onChangeText={(v) => setAddress({ ...address, phone: v })}
                    placeholder="+213 XXX XXX XXX"
                    placeholderTextColor="#c4c4c4"
                    keyboardType="phone-pad"
                  />
                </View>
              </View>
            ) : (
              /* ── Display view ── */
              <View style={styles.addressBody}>
                {addressFilled ? (
                  <>
                    {address.fullName ? (
                      <Text style={styles.addressName}>{address.fullName}</Text>
                    ) : null}
                    {(address.wilaya || address.baladiya) ? (
                      <Text style={styles.addressSub}>
                        {[address.wilaya, address.baladiya].filter(Boolean).join(", ")}, Algeria
                      </Text>
                    ) : null}
                    {address.street ? (
                      <Text style={styles.addressSub}>{address.street}</Text>
                    ) : null}
                    {address.phone ? (
                      <View style={styles.addressPhoneRow}>
                        <MaterialIcons name="phone" size={12} color="#9ca3af" />
                        <Text style={styles.addressSub}>{address.phone}</Text>
                      </View>
                    ) : null}
                  </>
                ) : (
                  <TouchableOpacity
                    style={styles.noAddressPrompt}
                    onPress={() => setEditingAddress(true)}
                  >
                    <MaterialIcons name="add-location-alt" size={20} color="#047857" />
                    <Text style={styles.noAddressText}>Tap Edit to add your delivery address</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* Order Summary */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconBox}>
                <MaterialIcons name="receipt-long" size={16} color="#047857" />
              </View>
              <Text style={styles.cardTitle}>Order Summary</Text>
            </View>

            {products.map((p) => {
              const prod = p.product || {};
              return (
                <View key={p.id} style={styles.orderItem}>
                  <Image
                    source={{
                      uri: prod.images?.[0]?.image || "https://via.placeholder.com/100",
                    }}
                    style={styles.orderItemImage}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.orderItemName} numberOfLines={1}>
                      {prod.ministry_product?.name || "Unknown Product"}
                    </Text>
                    <Text style={styles.orderItemQty}>{p.quantity} kg</Text>
                  </View>
                  <Text style={styles.orderItemPrice}>
                    {formatDZD(parseFloat(p.total_price))}
                  </Text>
                </View>
              );
            })}

            <View style={styles.divider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                Subtotal ({products.length} item{products.length !== 1 ? "s" : ""})
              </Text>
              <Text style={styles.summaryVal}>{formatDZD(subtotal)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Platform levy (1%)</Text>
              <Text style={styles.summaryVal}>{formatDZD(levy)}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalVal}>{formatDZD(total)}</Text>
            </View>

            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={handleCheckout}
              disabled={checkoutLoading}
            >
              {checkoutLoading ? (
                <ActivityIndicator color="#065f46" />
              ) : (
                <>
                  <MaterialIcons name="check-circle" size={16} color="#065f46" />
                  <Text style={styles.confirmBtnText}>Place Order</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const Row = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.summaryRow}>
    <Text style={styles.summaryLabel}>{label}</Text>
    <Text style={styles.summaryVal}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f8f5" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f5f8f5" },
  scrollContent: { padding: 14 },

  // ── HEADER
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 0.5,
    borderBottomColor: "#f0f0f0",
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "#f8faf8", borderWidth: 0.5,
    borderColor: "#e4efe4", alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 15, fontWeight: "800", color: "#1a2e1a", letterSpacing: -0.2 },

  // ── STEPS
  stepRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#fff", borderRadius: 16,
    padding: 16, marginBottom: 12,
    borderWidth: 0.5, borderColor: "#e4efe4",
  },
  stepItem: { alignItems: "center", gap: 4 },
  stepDot: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: "#f3f4f6", alignItems: "center", justifyContent: "center",
  },
  stepDotActive: { backgroundColor: "#d1fae5" },
  stepDotNum: { fontSize: 10, fontWeight: "800", color: "#9ca3af" },
  stepLabel: { fontSize: 9, fontWeight: "700", color: "#c4c4c4", letterSpacing: 0.2 },
  stepLabelActive: { color: "#047857" },
  stepLine: { flex: 1, height: 1.5, backgroundColor: "#e5e7eb", marginHorizontal: 4, marginBottom: 14 },
  stepLineDone: { backgroundColor: "#0df20d" },

  // ── CARDS
  card: {
    backgroundColor: "#fff", borderRadius: 16,
    padding: 14, marginBottom: 10,
    borderWidth: 0.5, borderColor: "#e4efe4",
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  cardIconBox: {
    width: 32, height: 32, borderRadius: 9,
    backgroundColor: "#d1fae5", alignItems: "center", justifyContent: "center",
  },
  cardTitle: { fontSize: 14, fontWeight: "800", color: "#1a2e1a", flex: 1, letterSpacing: -0.2 },
  editBtn: {
    backgroundColor: "#f8faf8", borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 0.5, borderColor: "#e4efe4",
  },
  editBtnText: { fontSize: 11, fontWeight: "700", color: "#047857" },

  // ── ADDRESS DISPLAY
  addressBody: {
    backgroundColor: "#f8faf8", borderRadius: 12,
    padding: 12, borderWidth: 0.5, borderColor: "#e4efe4",
  },
  addressName: { fontSize: 14, fontWeight: "800", color: "#1a2e1a", marginBottom: 3 },
  addressSub: { fontSize: 12, color: "#9ca3af", fontWeight: "600", marginTop: 1 },
  addressPhoneRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  noAddressPrompt: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 6 },
  noAddressText: { fontSize: 13, color: "#047857", fontWeight: "600" },

  // ── ADDRESS EDIT FORM
  editForm: { gap: 10 },
  editRow: { flexDirection: "row", gap: 10 },
  editField: { gap: 4 },
  editFieldLabel: {
    fontSize: 9, fontWeight: "700", color: "#9ca3af",
    textTransform: "uppercase", letterSpacing: 0.4,
  },
  editInput: {
    backgroundColor: "#f9faf9", borderRadius: 10,
    borderWidth: 1, borderColor: "#e4efe4",
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 13, fontWeight: "600", color: "#1a2e1a",
  },

  // ── ORDER ITEMS
  orderItem: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  orderItemImage: { width: 44, height: 44, borderRadius: 10 },
  orderItemName: { fontSize: 13, fontWeight: "700", color: "#1a2e1a", marginBottom: 2 },
  orderItemQty: { fontSize: 11, color: "#9ca3af", fontWeight: "600" },
  orderItemPrice: { fontSize: 13, fontWeight: "800", color: "#374151" },

  // ── SUMMARY
  divider: { height: 0.5, backgroundColor: "#e4efe4", marginVertical: 10 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  summaryLabel: { fontSize: 12, color: "#9ca3af", fontWeight: "600" },
  summaryVal: { fontSize: 12, fontWeight: "700", color: "#374151" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  totalLabel: { fontSize: 15, fontWeight: "800", color: "#1a2e1a" },
  totalVal: { fontSize: 18, fontWeight: "800", color: "#1a2e1a", letterSpacing: -0.4 },

  // ── CONFIRM BTN
  confirmBtn: {
    backgroundColor: "#0df20d", borderRadius: 12,
    paddingVertical: 14, flexDirection: "row",
    alignItems: "center", justifyContent: "center", gap: 8,
  },
  confirmBtnText: { fontSize: 14, fontWeight: "800", color: "#065f46" },
});
