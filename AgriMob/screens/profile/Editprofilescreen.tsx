// screens/EditProfileScreen.tsx

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../../context/AuthContext";
import { profileApi } from "../../apis/profile.api";

interface FormField {
  key: string;
  label: string;
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
  placeholder?: string;
  keyboardType?: "default" | "email-address" | "phone-pad";
  editable?: boolean;
}

const personalFields: FormField[] = [
  { key: "fullName",  label: "Full Name",  icon: "person",    placeholder: "Your full name" },
  { key: "username",  label: "Username",   icon: "alternate-email", placeholder: "@username" },
  { key: "email",     label: "Email",      icon: "mail",      keyboardType: "email-address", placeholder: "you@example.com" },
  { key: "phone",     label: "Phone",      icon: "phone",     keyboardType: "phone-pad", placeholder: "+1 (555) 000-0000" },
  { key: "location",  label: "Location",   icon: "place",     placeholder: "City, State" },
];

const farmFields: FormField[] = [
  { key: "farmName",   label: "Farm Name",   icon: "agriculture", placeholder: "Your farm name" },
  { key: "bio",        label: "Bio",         icon: "notes",        placeholder: "Short description of your farm…" },
  { key: "specialty",  label: "Speciality",  icon: "eco",          placeholder: "e.g. Grains, Vegetables" },
];

const InputField = ({
  field,
  value,
  onChange,
}: {
  field: FormField;
  value: string;
  onChange: (v: string) => void;
}) => (
  <View style={styles.fieldWrap}>
    <Text style={styles.fieldLabel}>{field.label}</Text>
    <View style={styles.inputRow}>
      <MaterialIcons name={field.icon} size={16} color="#9ca3af" />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={field.placeholder}
        placeholderTextColor="#c4c4c4"
        keyboardType={field.keyboardType ?? "default"}
        autoCapitalize="none"
      />
    </View>
  </View>
);

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();

  const [saving, setSaving] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [form, setForm] = useState<Record<string, string>>({
    fullName:  user?.username ?? "",
    username:  user?.username ? `@${user.username}` : "",
    email:     user?.email ?? "",
    phone:     "",
    location:  "",
    farmName:  "",
    bio:       "",
    specialty: "",
  });

  const update = (key: string) => (val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Please allow access to your photo library to choose a profile picture.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setSelectedImage(result.assets[0]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Map form keys → backend field names accepted by MeView.patch()
      const payload: Record<string, string> = {};
      if (form.username)  payload.username = form.username.replace(/^@/, "");
      if (form.email)     payload.email    = form.email;
      if (form.phone)     payload.phone    = form.phone;

      await profileApi.update(payload);

      if (selectedImage && user?.role) {
        await profileApi.updateImage(
          user.role,
          selectedImage.uri,
          selectedImage.mimeType || "image/jpeg",
          selectedImage.fileName || "profile.jpg"
        );
      }

      navigation.goBack();
    } catch (e) {
      Alert.alert("Error", "Could not save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const showRoleFields = user?.role === "FARMER";

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* TOP BAR */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={20} color="#1a2e1a" />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Edit Profile</Text>
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#065f46" />
          ) : (
            <Text style={styles.saveBtnText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* AVATAR */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={pickImage} style={styles.avatarWrap}>
            <View style={styles.avatarCircle}>
              {selectedImage ? (
                <Image source={{ uri: selectedImage.uri }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarInitials}>
                  {(user?.username ?? user?.email ?? "U").slice(0, 2).toUpperCase()}
                </Text>
              )}
            </View>
            <View style={styles.editBadge}>
              <MaterialIcons name="edit" size={12} color="#065f46" />
            </View>
          </TouchableOpacity>
          <Text style={styles.changePhotoText}>Change Photo</Text>
        </View>

        {/* PERSONAL DETAILS */}
        <Text style={styles.sectionHead}>Personal details</Text>
        <View style={styles.card}>
          {personalFields.map((f) => (
            <InputField key={f.key} field={f} value={form[f.key]} onChange={update(f.key)} />
          ))}
        </View>

        {/* FARM / ROLE DETAILS */}
        {showRoleFields && (
          <>
            <Text style={styles.sectionHead}>Farm profile</Text>
            <View style={styles.card}>
              {farmFields.map((f) => (
                <InputField key={f.key} field={f} value={form[f.key]} onChange={update(f.key)} />
              ))}
            </View>
          </>
        )}

        {/* INFO NOTICE */}
        <View style={styles.notice}>
          <MaterialIcons name="info-outline" size={16} color="#047857" />
          <Text style={styles.noticeText}>
            Changes to verified accounts are reviewed within 24 hours before going live.
          </Text>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
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

  saveBtn: {
    backgroundColor: "#0df20d",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    minWidth: 60,
    alignItems: "center",
  },

  saveBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#065f46",
  },

  /* AVATAR */
  avatarSection: {
    alignItems: "center",
    paddingVertical: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e4efe4",
    marginBottom: 4,
  },

  avatarWrap: {
    position: "relative",
  },

  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#d1fae5",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#e4efe4",
    overflow: "hidden",
  },

  avatarImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  avatarInitials: {
    fontSize: 28,
    fontWeight: "800",
    color: "#047857",
  },

  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#0df20d",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#f5f8f5",
  },

  changePhotoText: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: "700",
    color: "#047857",
  },

  /* SECTION */
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

  fieldWrap: {
    padding: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f3f4f6",
  },

  fieldLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#9ca3af",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginBottom: 6,
  },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#1a2e1a",
    padding: 0,
  },

  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#f0faf0",
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: "#c6e8c6",
    padding: 14,
    marginHorizontal: 16,
    marginTop: 16,
  },

  noticeText: {
    flex: 1,
    fontSize: 12,
    color: "#047857",
    lineHeight: 18,
  },
});