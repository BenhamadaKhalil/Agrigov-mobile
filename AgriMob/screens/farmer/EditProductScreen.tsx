// screens/farmer/EditProductScreen.tsx

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
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { InventoryStackParamList } from "../../navigation/FarmerTabNavigator";
import * as ImagePicker from "expo-image-picker";
import { farmerApi } from "../../apis/farmer.api";
import { productApi } from "../../apis/product.api";

type EditProductRouteProp = RouteProp<InventoryStackParamList, "EditProduct">;

const SEASONS = [
  { key: "winter", label: "Winter", icon: "ac-unit" as const },
  { key: "spring", label: "Spring", icon: "local-florist" as const },
  { key: "summer", label: "Summer", icon: "wb-sunny" as const },
  { key: "fall",   label: "Fall",   icon: "eco" as const },
];

interface FormState {
  description: string;
  season: string;
  unit_price: string;
  stock: string;
}

const INITIAL_FORM: FormState = {
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

export default function EditProductScreen() {
  const route = useRoute<EditProductRouteProp>();
  const { productId } = route.params;
  const navigation = useNavigation();

  const [form, setForm]     = useState<FormState>(INITIAL_FORM);
  const [images, setImages] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingInit, setLoadingInit] = useState(true);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  
  const [productData, setProductData] = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const product: any = await productApi.detail(productId);
        setProductData(product);
        setForm({
          description: product.description || "",
          season:      product.season || "summer",
          unit_price:  String(product.unit_price || ""),
          stock:       String(product.stock || ""),
        });
        if (product.images) setExistingImages(product.images);
      } catch {
        Alert.alert("Error", "Could not load product details.");
        navigation.goBack();
      } finally {
        setLoadingInit(false);
      }
    })();
  }, [productId]);

  const update = <K extends keyof FormState>(key: K) => (val: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return Alert.alert("Permission required", "Allow access to your photo library.");
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 5 - existingImages.length,
    });
    if (!result.canceled) {
      setImages((prev) => [...prev, ...result.assets.map((a: any) => a.uri)].slice(0, 5 - existingImages.length));
    }
  };

  const removeNewImage = (uri: string) => setImages((prev) => prev.filter((u) => u !== uri));

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!form.description.trim()) newErrors.description = "Required";
    if (!form.stock.trim() || isNaN(Number(form.stock)) || Number(form.stock) < 0) newErrors.stock = "Enter a valid stock";
    if (!form.unit_price.trim() || isNaN(Number(form.unit_price)) || Number(form.unit_price) <= 0) newErrors.unit_price = "Enter a valid price";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("description", form.description);
      fd.append("season", form.season);
      fd.append("stock", form.stock);
      fd.append("unit_price", form.unit_price);

      images.forEach((uri, i) => {
        fd.append("images", { uri, name: `edit_image_${i}.jpg`, type: "image/jpeg" } as any);
      });

      await farmerApi.updateProduct(productId, fd);
      Alert.alert("Saved", "Product updated successfully.", [{ text: "OK", onPress: () => navigation.goBack() }]);
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Could not save changes.");
    } finally {
      setSaving(false);
    }
  };

  if (loadingInit) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#047857" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.hero}>
          <View style={styles.heroRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <MaterialIcons name="arrow-back" size={18} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.heroLabel}>EDIT PRODUCT</Text>
              <Text style={styles.heroTitle}>{productData?.ministry_product?.name || "Product"}</Text>
              <Text style={styles.heroSub}>{productData?.farm?.name || "Farm"}</Text>
            </View>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <Field label="Description" icon="description">
              <TextInput style={[styles.input, errors.description && styles.inputError]} placeholder="Describe your product..." placeholderTextColor="#c4c4c4" value={form.description} onChangeText={update("description")} />
            </Field>
            {errors.description && <Text style={styles.errMsg}>{errors.description}</Text>}

            <Field label="Stock Quantity (kg/units)" icon="inventory">
              <TextInput style={[styles.input, errors.stock && styles.inputError]} placeholder="0" placeholderTextColor="#c4c4c4" keyboardType="numeric" value={form.stock} onChangeText={update("stock")} />
            </Field>
            {errors.stock && <Text style={styles.errMsg}>{errors.stock}</Text>}

            <Field label="Unit Price" icon="attach-money">
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
            {(existingImages.length > 0 || images.length > 0) && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imagePreviewRow}>
                {existingImages.map((img: any) => (
                  <View key={img.id} style={styles.imageThumbWrap}>
                    <Image source={{ uri: img.image }} style={styles.imageThumb} />
                    <View style={styles.existingTag}><Text style={styles.existingTagText}>Old</Text></View>
                  </View>
                ))}
                {images.map((uri) => (
                  <View key={uri} style={styles.imageThumbWrap}>
                    <Image source={{ uri }} style={styles.imageThumb} />
                    <TouchableOpacity style={styles.removeImageBtn} onPress={() => removeNewImage(uri)}>
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
              <Text style={styles.uploadTitle}>{images.length + existingImages.length > 0 ? `${images.length + existingImages.length}/5 photos added` : "Upload Images"}</Text>
              <Text style={styles.uploadSub}>Tap to pick from gallery · Max 5 photos</Text>
            </TouchableOpacity>
            {images.length > 0 && <Text style={styles.noteText}>Note: Uploading new images will replace ALL old images.</Text>}
          </View>

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color="#fff" /> : <><Text style={styles.primaryText}>Save Changes</Text></>}
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
  scrollContent: { padding: 14 },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 14, borderWidth: 0.5, borderColor: "#e4efe4", marginBottom: 12 },
  fieldLabel: { fontSize: 9, fontWeight: "700", color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6, marginTop: 10 },
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
  existingTag: { position: "absolute", bottom: 4, left: 4, backgroundColor: "rgba(0,0,0,0.5)", paddingHorizontal: 4, borderRadius: 4 },
  existingTagText: { color: "#fff", fontSize: 8, fontWeight: "bold" },
  uploadBox: { height: 90, borderRadius: 14, borderWidth: 1.5, borderColor: "#e4efe4", borderStyle: "dashed", backgroundColor: "#f9faf9", alignItems: "center", justifyContent: "center" },
  uploadIconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#ecfdf5", alignItems: "center", justifyContent: "center", marginBottom: 6 },
  uploadTitle: { fontSize: 12, fontWeight: "700", color: "#374151" },
  uploadSub: { fontSize: 10, color: "#9ca3af", marginTop: 2 },
  noteText: { fontSize: 10, color: "#9ca3af", marginTop: 8, fontStyle: "italic" },
  btnRow: { flexDirection: "row", gap: 10 },
  primaryBtn: { flex: 1, height: 50, borderRadius: 14, backgroundColor: "#047857", alignItems: "center", justifyContent: "center" },
  primaryText: { fontSize: 14, fontWeight: "800", color: "#fff" },
});