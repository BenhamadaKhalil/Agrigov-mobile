// screens/farmer/AddProductScreen.tsx

import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import { InventoryStackParamList } from "../../navigation/FarmerTabNavigator";
import { farmerApi } from "../../apis/farmer.api";
import { productApi } from "../../apis/product.api";

const TOTAL_STEPS   = 4;
const CURRENT_STEP  = 2;

const SEASONS = [
  { key: "winter", label: "Winter", icon: "ac-unit" as const },
  { key: "spring", label: "Spring", icon: "local-florist" as const },
  { key: "summer", label: "Summer", icon: "wb-sunny" as const },
  { key: "fall",   label: "Fall",   icon: "eco" as const },
];

interface FormState {
  ministry_product_id: number | null;
  farm_id: number | null;
  description: string;
  season: string;
  unit_price: string;
  stock: string;
}

const INITIAL_FORM: FormState = {
  ministry_product_id: null,
  farm_id: null,
  description: "",
  season: "summer",
  unit_price: "",
  stock: "",
};

const Field = ({ label, icon, children }: { label: string; icon?: React.ComponentProps<typeof MaterialIcons>["name"]; children: React.ReactNode; }) => (
  <View style={styles.fieldWrap}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View style={styles.inputRow}>
      {icon && <MaterialIcons name={icon} size={15} color="#9ca3af" />}
      {children}
    </View>
  </View>
);

export default function AddProductScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<InventoryStackParamList>>();

  const [form, setForm]     = useState<FormState>(INITIAL_FORM);
  const [images, setImages] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const [farms, setFarms] = useState<any[]>([]);
  const [ministryProducts, setMinistryProducts] = useState<any[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  const [productSearch, setProductSearch] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [fData, mpData] = await Promise.all([
          farmerApi.myFarms(),
          productApi.ministryProducts(),
        ]);
        const fResults = Array.isArray(fData) ? fData : (fData as any)?.results || [];
        const mpResults = Array.isArray(mpData) ? mpData : (mpData as any)?.results || [];
        setFarms(fResults);
        setMinistryProducts(mpResults);
        
        setForm(prev => ({
          ...prev, 
          farm_id: fResults.length === 1 ? fResults[0].id : null,
          ministry_product_id: mpResults.length === 1 ? mpResults[0].id : null
        }));
      } catch (err) {
        Alert.alert("Error", "Could not load data.");
      } finally {
        setLoadingInitial(false);
      }
    })();
  }, []);

  const update = <K extends keyof FormState>(key: K) => (val: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return Alert.alert("Permission required", "Allow access to your photo library.");
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 5 - images.length,
    });
    if (!result.canceled) setImages((prev) => [...prev, ...result.assets.map((a) => a.uri)].slice(0, 5));
  };

  const removeImage = (uri: string) => setImages((prev) => prev.filter((u) => u !== uri));

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!form.ministry_product_id) newErrors.ministry_product_id = "Please select a product";
    if (!form.farm_id) newErrors.farm_id = "Please select a farm";
    if (!form.description.trim()) newErrors.description = "Description is required";
    if (!form.stock.trim() || isNaN(Number(form.stock)) || Number(form.stock) < 0) newErrors.stock = "Enter a valid stock";
    if (!form.unit_price.trim() || isNaN(Number(form.unit_price)) || Number(form.unit_price) <= 0) newErrors.unit_price = "Enter a valid price";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildFormData = (): FormData => {
    const fd = new FormData();
    if (form.ministry_product_id) fd.append("ministry_product_id", form.ministry_product_id.toString());
    if (form.farm_id) fd.append("farm_id", form.farm_id.toString());
    fd.append("description", form.description);
    fd.append("season", form.season);
    fd.append("stock", form.stock);
    fd.append("unit_price", form.unit_price);

    images.forEach((uri, i) => {
      fd.append("images", { uri, name: `product_image_${i}.jpg`, type: "image/jpeg" } as any);
    });
    return fd;
  };

  const handlePublish = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await farmerApi.createProduct(buildFormData());
      Alert.alert("Published!", "Your product is now live.", [{ text: "OK", onPress: () => navigation.goBack() }]);
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Could not publish product.");
    } finally {
      setSaving(false);
    }
  };

  if (loadingInitial) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#047857" />
      </SafeAreaView>
    );
  }

  const progress = (CURRENT_STEP / TOTAL_STEPS) * 100;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.hero}>
          <View style={styles.heroRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <MaterialIcons name="arrow-back" size={18} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.heroLabel}>DIGITAL HARVEST</Text>
              <Text style={styles.heroTitle}>Add New Product</Text>
              <Text style={styles.heroSub}>Step {CURRENT_STEP} of {TOTAL_STEPS}</Text>
            </View>
            <Text style={styles.pctLabel}>{Math.round(progress)}%</Text>
          </View>
          <View style={styles.stepsRow}>
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <View key={i} style={[styles.stepSeg, i < CURRENT_STEP ? styles.stepFilled : styles.stepEmpty]} />
            ))}
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>
          
          <View style={styles.card}>
            <View style={styles.productHeaderRow}>
              <Text style={[styles.fieldLabel, { marginTop: 0 }]}>Official Ministry Product</Text>
              <View style={styles.miniSearch}>
                <MaterialIcons name="search" size={14} color="#9ca3af" />
                <TextInput
                  style={styles.miniSearchInput}
                  placeholder="Search products..."
                  placeholderTextColor="#c4c4c4"
                  value={productSearch}
                  onChangeText={setProductSearch}
                />
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {ministryProducts
                .filter(mp => mp.name.toLowerCase().includes(productSearch.toLowerCase()))
                .map((mp) => (
                <TouchableOpacity key={mp.id} style={[styles.chip, form.ministry_product_id === mp.id && styles.chipActive]} onPress={() => update("ministry_product_id")(mp.id)}>
                  <Text style={[styles.chipText, form.ministry_product_id === mp.id && styles.chipTextActive]}>{mp.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {errors.ministry_product_id && <Text style={styles.errMsg}>{errors.ministry_product_id}</Text>}

            <Text style={styles.fieldLabel}>Select Farm</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {farms.map((f) => (
                <TouchableOpacity key={f.id} style={[styles.chip, form.farm_id === f.id && styles.chipActive]} onPress={() => update("farm_id")(f.id)}>
                  <Text style={[styles.chipText, form.farm_id === f.id && styles.chipTextActive]}>{f.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {errors.farm_id && <Text style={styles.errMsg}>{errors.farm_id}</Text>}

            <Field label="Description" icon="description">
              <TextInput style={[styles.input, errors.description && styles.inputError]} placeholder="Describe your product..." placeholderTextColor="#c4c4c4" value={form.description} onChangeText={update("description")} />
            </Field>
            {errors.description && <Text style={styles.errMsg}>{errors.description}</Text>}

            <Field label="Stock Quantity (kg/units)" icon="inventory">
              <TextInput style={[styles.input, errors.stock && styles.inputError]} placeholder="0" placeholderTextColor="#c4c4c4" keyboardType="numeric" value={form.stock} onChangeText={update("stock")} />
            </Field>
            {errors.stock && <Text style={styles.errMsg}>{errors.stock}</Text>}

            <Field label="Unit Price (DZD)" icon="payments">
              <TextInput style={[styles.input, errors.unit_price && styles.inputError]} placeholder="0.00" placeholderTextColor="#c4c4c4" keyboardType="numeric" value={form.unit_price} onChangeText={update("unit_price")} />
            </Field>
            {errors.unit_price && <Text style={styles.errMsg}>{errors.unit_price}</Text>}

            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Season</Text>
            <View style={styles.storageRow}>
              {SEASONS.map((s) => (
                <TouchableOpacity key={s.key} style={[styles.storageChip, form.season === s.key && styles.storageChipActive]} onPress={() => update("season")(s.key)}>
                  <MaterialIcons name={s.icon} size={16} color={form.season === s.key ? "#047857" : "#9ca3af"} />
                  <Text style={[styles.storageText, form.season === s.key && styles.storageTextActive]}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Product Images</Text>
            {images.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imagePreviewRow}>
                {images.map((uri) => (
                  <View key={uri} style={styles.imageThumbWrap}>
                    <Image source={{ uri }} style={styles.imageThumb} />
                    <TouchableOpacity style={styles.removeImageBtn} onPress={() => removeImage(uri)}>
                      <MaterialIcons name="close" size={12} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
            <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
              <View style={styles.uploadIconCircle}>
                <MaterialIcons name="add-a-photo" size={22} color="#0df20d" />
              </View>
              <Text style={styles.uploadTitle}>{images.length > 0 ? `${images.length}/5 photos added` : "Upload Images"}</Text>
              <Text style={styles.uploadSub}>Tap to pick from gallery · Max 5 photos</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.warningBox}>
            <MaterialIcons name="info-outline" size={16} color="#c05c00" />
            <Text style={styles.warningText}>Price should be close to the official market price. Listings more than 20% above market are flagged for review.</Text>
          </View>

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.primaryBtn} onPress={handlePublish} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color="#065f46" /> : <><Text style={styles.primaryText}>Publish Product</Text><MaterialIcons name="arrow-forward" size={16} color="#065f46" /></>}
            </TouchableOpacity>
          </View>
          <View style={{ height: 30 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f5f8f5" },
  hero: { backgroundColor: "#047857", paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14 },
  heroRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  backBtn: { width: 32, height: 32, borderRadius: 9, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  heroLabel: { fontSize: 9, fontWeight: "700", color: "#a7f3d0", letterSpacing: 1, marginBottom: 1 },
  heroTitle: { fontSize: 16, fontWeight: "800", color: "#fff", letterSpacing: -0.3 },
  heroSub: { fontSize: 11, color: "#a7f3d0", marginTop: 1 },
  pctLabel: { fontSize: 14, fontWeight: "800", color: "#0df20d" },
  stepsRow: { flexDirection: "row", gap: 5 },
  stepSeg: { flex: 1, height: 4, borderRadius: 10 },
  stepFilled: { backgroundColor: "#0df20d" },
  stepEmpty: { backgroundColor: "rgba(255,255,255,0.2)" },
  scrollContent: { padding: 14 },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 14, borderWidth: 0.5, borderColor: "#e4efe4", marginBottom: 12 },
  fieldLabel: { fontSize: 9, fontWeight: "700", color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6, marginTop: 10 },
  chipRow: { gap: 7, paddingBottom: 2 },
  chip: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, backgroundColor: "#f5f8f5", borderWidth: 0.5, borderColor: "#e4efe4" },
  chipActive: { backgroundColor: "#047857", borderColor: "#047857" },
  chipText: { fontSize: 12, fontWeight: "700", color: "#6b7280" },
  chipTextActive: { color: "#fff" },
  fieldWrap: { marginTop: 4 },
  inputRow: { flexDirection: "row", alignItems: "center", height: 46, backgroundColor: "#f9faf9", borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: "#f1f5f1" },
  input: { flex: 1, fontSize: 14, fontWeight: "600", color: "#374151", marginLeft: 8 },
  inputError: { borderColor: "#ef4444" },
  errMsg: { fontSize: 10, color: "#ef4444", marginTop: 4, marginLeft: 2 },
  storageRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  storageChip: { flexDirection: "row", alignItems: "center", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, backgroundColor: "#f9faf9", borderWidth: 1, borderColor: "#f1f5f1", gap: 6 },
  storageChipActive: { backgroundColor: "#ecfdf5", borderColor: "#a7f3d0" },
  storageText: { fontSize: 12, fontWeight: "700", color: "#9ca3af" },
  storageTextActive: { color: "#047857" },
  imagePreviewRow: { gap: 10, marginBottom: 12 },
  imageThumbWrap: { width: 70, height: 70, borderRadius: 12, overflow: "hidden" },
  imageThumb: { width: "100%", height: "100%", backgroundColor: "#e5e7eb" },
  removeImageBtn: { position: "absolute", top: 4, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" },
  uploadBox: { height: 90, borderRadius: 14, borderWidth: 1.5, borderColor: "#e4efe4", borderStyle: "dashed", backgroundColor: "#f9faf9", alignItems: "center", justifyContent: "center" },
  uploadIconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#ecfdf5", alignItems: "center", justifyContent: "center", marginBottom: 6 },
  uploadTitle: { fontSize: 12, fontWeight: "700", color: "#374151" },
  uploadSub: { fontSize: 10, color: "#9ca3af", marginTop: 2 },
  warningBox: { flexDirection: "row", backgroundColor: "#fffbeb", padding: 12, borderRadius: 12, borderWidth: 1, borderColor: "#fef3c7", marginBottom: 20, gap: 10 },
  warningText: { flex: 1, fontSize: 11, color: "#92400e", lineHeight: 16 },
  btnRow: { flexDirection: "row", gap: 10 },
  secondaryBtn: { flex: 1, height: 50, borderRadius: 14, backgroundColor: "#f3f4f6", alignItems: "center", justifyContent: "center" },
  secondaryText: { fontSize: 14, fontWeight: "700", color: "#374151" },
  primaryBtn: { flex: 2, height: 50, borderRadius: 14, backgroundColor: "#0df20d", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  primaryText: { fontSize: 14, fontWeight: "800", color: "#065f46" },
  productHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6, marginTop: 10 },
  miniSearch: { flexDirection: "row", alignItems: "center", backgroundColor: "#f9faf9", borderRadius: 8, paddingHorizontal: 8, height: 32, borderWidth: 1, borderColor: "#f1f5f1", width: 150 },
  miniSearchInput: { flex: 1, fontSize: 12, marginLeft: 6, color: "#1a2e1a" },
});