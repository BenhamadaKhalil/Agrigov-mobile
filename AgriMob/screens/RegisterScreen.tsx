import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../navigation/AuthNavigator";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { RegisterRole, WILAYAS, VEHICLE_TYPES } from "./resgister";
import { apiFetch } from "../apis/api";
import * as ImagePicker from "expo-image-picker";

type ImageAsset = ImagePicker.ImagePickerAsset;

type NavProp = NativeStackNavigationProp<AuthStackParamList, "Register">;
type Step = 1 | 2 | 3;

// ─── Role config ──────────────────────────────────────────────────────────────

const ROLES: {
  name: RegisterRole;
  icon: "agriculture" | "storefront" | "local-shipping";
  label: string;
  description: string;
  color: string;
}[] = [
  {
    name: "FARMER",
    icon: "agriculture",
    label: "Farmer",
    description: "Register your farm and sell produce directly to buyers.",
    color: "#d1fae5",
  },
  {
    name: "BUYER",
    icon: "storefront",
    label: "Buyer",
    description: "Purchase agricultural products at competitive prices.",
    color: "#dbeafe",
  },
  {
    name: "TRANSPORTER",
    icon: "local-shipping",
    label: "Transporter",
    description: "Provide transport services for agricultural goods.",
    color: "#fef3c7",
  },
];

const ROLE_ICON_MAP: Record<
  RegisterRole,
  "agriculture" | "storefront" | "local-shipping"
> = {
  FARMER: "agriculture",
  BUYER: "storefront",
  TRANSPORTER: "local-shipping",
};

// ─── STEP LABELS ──────────────────────────────────────────────────────────────

const STEP_LABELS: Record<Step, string> = {
  1: "Choose Role",
  2: "Account Info",
  3: "Profile",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function RegisterScreen() {
  const [step, setStep] = useState<Step>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Step 1
  const [role, setRole] = useState<RegisterRole | "">("");

  // Step 2
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Step 3 — Farmer
  const [farmerAge, setFarmerAge] = useState("");
  const [wilaya, setWilaya] = useState("");
  const [baladiya, setBaladiya] = useState("");
  const [farmName, setFarmName] = useState("");
  const [farmSize, setFarmSize] = useState("");
  const [address, setAddress] = useState("");

  // Step 3 — Buyer
  const [buyerAge, setBuyerAge] = useState("");

  // Step 3 — Transporter
  const [transporterAge, setTransporterAge] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleYear, setVehicleYear] = useState("");
  const [vehicleCapacity, setVehicleCapacity] = useState("");

  // Step 3 — Document images
  const [profileImage, setProfileImage] = useState<ImageAsset | null>(null);

  // Farmer
  const [farmerCardImage, setFarmerCardImage] = useState<ImageAsset | null>(null);
  const [nationalIdImage, setNationalIdImage] = useState<ImageAsset | null>(null);
  // Transporter
  const [driverLicenseImage, setDriverLicenseImage] = useState<ImageAsset | null>(null);
  const [greyCardImage, setGreyCardImage] = useState<ImageAsset | null>(null);
  // Buyer
  const [businessLicenseImage, setBusinessLicenseImage] = useState<ImageAsset | null>(null);

  const { register } = useAuth();
  const navigation = useNavigation<NavProp>();

  const clearError = (key: string) => setErrors((p) => ({ ...p, [key]: "" }));

  // ─── Validation ─────────────────────────────────────────────────────────────

  const validateStep1 = (): boolean => {
    if (!role) {
      Alert.alert("Select a Role", "Please choose your role to continue.");
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    const e: Record<string, string> = {};

    if (!email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Invalid email address";

    if (!username.trim()) e.username = "Username is required";
    else if (username.trim().length < 3) e.username = "Min 3 characters";

    if (!phone.trim()) e.phone = "Phone number is required";

    if (!password) e.password = "Password is required";
    else if (password.length < 8) e.password = "Minimum 8 characters";

    if (!confirmPassword) e.confirmPassword = "Please confirm your password";
    else if (password !== confirmPassword)
      e.confirmPassword = "Passwords do not match";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep3 = (): boolean => {
    const e: Record<string, string> = {};

    if (role === "FARMER") {
      if (!farmerAge.trim()) e.farmerAge = "Age is required";
      else if (isNaN(Number(farmerAge)) || Number(farmerAge) < 18)
        e.farmerAge = "Must be 18 or older";

      if (!wilaya.trim()) e.wilaya = "Wilaya is required";
      if (!baladiya.trim()) e.baladiya = "Baladiya is required";
      if (!farmName.trim()) e.farmName = "Farm name is required";

      if (!farmSize.trim()) e.farmSize = "Farm size is required";
      else if (isNaN(Number(farmSize)) || Number(farmSize) <= 0)
        e.farmSize = "Enter a valid number";

      if (!address.trim()) e.address = "Address is required";

      if (!farmerCardImage) e.farmerCardImage = "Farmer card photo is required";
      if (!nationalIdImage) e.nationalIdImage = "National ID photo is required";
    }

    if (role === "BUYER") {
      if (!buyerAge.trim()) e.buyerAge = "Age is required";
      else if (isNaN(Number(buyerAge)) || Number(buyerAge) < 18)
        e.buyerAge = "Must be 18 or older";

      if (!businessLicenseImage) e.businessLicenseImage = "Business license photo is required";
    }

    if (role === "TRANSPORTER") {
      if (!transporterAge.trim()) e.transporterAge = "Age is required";
      else if (isNaN(Number(transporterAge)) || Number(transporterAge) < 18)
        e.transporterAge = "Must be 18 or older";

      if (!vehicleType.trim()) e.vehicleType = "Vehicle type is required";
      if (!vehicleModel.trim()) e.vehicleModel = "Vehicle model is required";

      if (!vehicleYear.trim()) e.vehicleYear = "Year is required";
      else if (
        isNaN(Number(vehicleYear)) ||
        Number(vehicleYear) < 1990 ||
        Number(vehicleYear) > new Date().getFullYear() + 1
      )
        e.vehicleYear = "Enter a valid year";

      if (!vehicleCapacity.trim()) e.vehicleCapacity = "Capacity is required";
      else if (isNaN(Number(vehicleCapacity)) || Number(vehicleCapacity) <= 0)
        e.vehicleCapacity = "Enter a valid capacity";

      if (!driverLicenseImage) e.driverLicenseImage = "Driver license photo is required";
      if (!greyCardImage) e.greyCardImage = "Grey card photo is required";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ─── Image picker helper ─────────────────────────────────────────────────────

  const pickImage = async (
    setter: (asset: ImageAsset) => void
  ): Promise<void> => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Please allow access to your photo library.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets.length > 0) {
      setter(result.assets[0]);
    }
  };

  // ─── Profile creation after registration ─────────────────────────────────────
  //
  // BUG FIX: The original code only called `register()` (creates the auth user)
  // but NEVER called the profile-creation API endpoint for BUYER or TRANSPORTER.
  // Only FARMER had any profile data even attempted. The fix below calls the
  // correct profile endpoint for each role right after the auth registration
  // succeeds. Adjust the API paths to match your Django URL config.

  const createProfile = async (role: RegisterRole): Promise<void> => {
    if (role === "FARMER") {
      const fd = new FormData();
      fd.append("age", String(parseInt(farmerAge)));
      fd.append("wilaya", wilaya.trim());
      fd.append("baladiya", baladiya.trim());
      fd.append("farm_size", String(parseFloat(farmSize)));
      fd.append("farm_name", farmName.trim());
      fd.append("address", address.trim());
      if (profileImage) {
        fd.append("profile_image_upload", {
          uri: profileImage.uri,
          name: profileImage.fileName ?? "profile.jpg",
          type: profileImage.mimeType ?? "image/jpeg",
        } as any);
      }
      if (farmerCardImage) {
        fd.append("farmer_card_image_upload", {
          uri: farmerCardImage.uri,
          name: farmerCardImage.fileName ?? "farmer_card.jpg",
          type: farmerCardImage.mimeType ?? "image/jpeg",
        } as any);
      }
      if (nationalIdImage) {
        fd.append("national_id_image_upload", {
          uri: nationalIdImage.uri,
          name: nationalIdImage.fileName ?? "national_id.jpg",
          type: nationalIdImage.mimeType ?? "image/jpeg",
        } as any);
      }
      await apiFetch("/api/users/auth/farmer-profile/", {
        method: "POST",
        body: fd,
      });
    }

    if (role === "BUYER") {
      const fd = new FormData();
      fd.append("age", String(buyerAge ? parseInt(buyerAge) : 18));
      if (profileImage) {
        fd.append("profile_image_upload", {
          uri: profileImage.uri,
          name: profileImage.fileName ?? "profile.jpg",
          type: profileImage.mimeType ?? "image/jpeg",
        } as any);
      }
      if (businessLicenseImage) {
        fd.append("bussiness_license_image_upload", {
          uri: businessLicenseImage.uri,
          name: businessLicenseImage.fileName ?? "business_license.jpg",
          type: businessLicenseImage.mimeType ?? "image/jpeg",
        } as any);
      }
      await apiFetch("/api/users/auth/buyer-profile/", {
        method: "POST",
        body: fd,
      });
    }

    if (role === "TRANSPORTER") {
      const fd = new FormData();
      fd.append("age", String(parseInt(transporterAge)));
      fd.append("vehicle_type", vehicleType.trim());
      fd.append("vehicle_model", vehicleModel.trim());
      fd.append("vehicle_year", String(parseInt(vehicleYear)));
      fd.append("vehicle_capacity", String(parseFloat(vehicleCapacity)));
      if (profileImage) {
        fd.append("profile_image", {
          uri: profileImage.uri,
          name: profileImage.fileName ?? "profile.jpg",
          type: profileImage.mimeType ?? "image/jpeg",
        } as any);
      }
      if (driverLicenseImage) {
        fd.append("driver_license_image", {
          uri: driverLicenseImage.uri,
          name: driverLicenseImage.fileName ?? "driver_license.jpg",
          type: driverLicenseImage.mimeType ?? "image/jpeg",
        } as any);
      }
      if (greyCardImage) {
        fd.append("grey_card_image", {
          uri: greyCardImage.uri,
          name: greyCardImage.fileName ?? "grey_card.jpg",
          type: greyCardImage.mimeType ?? "image/jpeg",
        } as any);
      }
      await apiFetch("/api/users/auth/transporter-profile/", {
        method: "POST",
        body: fd,
      });
    }
  };

  // Farm is now created by the farmer-profile serializer on the backend (via farm_name field).
  // Keeping this as a no-op to avoid breaking existing call sites.
  const createFarm = async (): Promise<void> => {};

  // ─── Submit ──────────────────────────────────────────────────────────────────

  const handleRegister = async () => {
    if (!validateStep3()) return;
    if (!role) return;

    setIsLoading(true);

    // Step A: Create the auth user account
    const result = await register({
      email: email.trim(),
      username: username.trim(),
      phone: phone.trim(),
      role,
      password,
    });

    if (!result.success) {
      setIsLoading(false);
      Alert.alert("Registration Failed", result.error);
      return;
    }

    // Step B: Create the role-specific profile
    // The auth token is now stored by AuthContext after register() succeeds.
    try {
      await createProfile(role as RegisterRole);
      if (role === "FARMER") {
        await createFarm();
      }
    } catch (profileErr: any) {
      // Profile or farm creation failed — user account exists but backend linking
      // is incomplete. Preserve the account, but warn the user to finish setup.
      console.warn("[Register] Profile creation failed:", profileErr?.message);
      Alert.alert(
        "Profile Incomplete",
        "Your account was created but the farmer backend profile was not fully linked. Please complete your profile in Settings.",
        [{ text: "OK" }],
      );
    }

    setIsLoading(false);
    // Navigation happens automatically via AuthContext → isAuthenticated
  };

  // ─── Renderers ───────────────────────────────────────────────────────────────

  const renderStepIndicator = () => (
    <View style={styles.stepRow}>
      {([1, 2, 3] as Step[]).map((s, i) => {
        const isDone = step > s;
        const isActive = step === s;
        return (
          <React.Fragment key={s}>
            <View style={styles.stepItem}>
              <View
                style={[
                  styles.stepDot,
                  isDone && styles.stepDotDone,
                  isActive && styles.stepDotActive,
                ]}
              >
                {isDone ? (
                  <MaterialIcons name="check" size={11} color="#065f46" />
                ) : (
                  <Text
                    style={[
                      styles.stepDotNum,
                      isActive && styles.stepDotNumActive,
                    ]}
                  >
                    {s}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  (isDone || isActive) && styles.stepLabelActive,
                ]}
              >
                {STEP_LABELS[s]}
              </Text>
            </View>
            {i < 2 && (
              <View style={[styles.stepLine, isDone && styles.stepLineDone]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardIconBox}>
          <MaterialIcons name="group" size={20} color="#047857" />
        </View>
        <View>
          <Text style={styles.cardTitle}>Choose Your Role</Text>
          <Text style={styles.cardSub}>How will you use the platform?</Text>
        </View>
      </View>

      <View style={styles.roleList}>
        {ROLES.map((r) => {
          const isSelected = role === r.name;
          return (
            <TouchableOpacity
              key={r.name}
              style={[styles.roleCard, isSelected && styles.roleCardSelected]}
              onPress={() => setRole(r.name)}
              activeOpacity={0.7}
            >
              {/* Left accent */}
              <View
                style={[
                  styles.roleAccent,
                  { backgroundColor: isSelected ? "#0df20d" : "transparent" },
                ]}
              />
              <View
                style={[
                  styles.roleIconBox,
                  { backgroundColor: isSelected ? "#d1fae5" : "#f3f4f6" },
                ]}
              >
                <MaterialIcons
                  name={r.icon}
                  size={22}
                  color={isSelected ? "#047857" : "#9ca3af"}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.roleCardLabel,
                    isSelected && styles.roleCardLabelSelected,
                  ]}
                >
                  {r.label}
                </Text>
                <Text style={styles.roleCardDesc}>{r.description}</Text>
              </View>
              <View
                style={[
                  styles.roleRadio,
                  isSelected && styles.roleRadioSelected,
                ]}
              >
                {isSelected && <View style={styles.roleRadioDot} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.btnRow}>
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={16} color="#6b7280" />
          <Text style={styles.secondaryBtnText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => validateStep1() && setStep(2)}
        >
          <Text style={styles.primaryBtnText}>Continue</Text>
          <MaterialIcons name="arrow-forward" size={16} color="#065f46" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardIconBox}>
          <MaterialIcons name="person" size={20} color="#047857" />
        </View>
        <View>
          <Text style={styles.cardTitle}>Account Information</Text>
          <Text style={styles.cardSub}>Create your credentials</Text>
        </View>
      </View>

      {/* Role badge */}
      {role ? (
        <View style={styles.roleBadge}>
          <MaterialIcons
            name={ROLE_ICON_MAP[role as RegisterRole]}
            size={14}
            color="#047857"
          />
          <Text style={styles.roleBadgeText}>Registering as: {role}</Text>
        </View>
      ) : null}

      <FormField
        label="Email"
        icon="mail-outline"
        placeholder="your@email.com"
        value={email}
        onChangeText={(t) => {
          setEmail(t);
          clearError("email");
        }}
        error={errors.email}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <FormField
        label="Username"
        icon="person-outline"
        placeholder="Choose a username"
        value={username}
        onChangeText={(t) => {
          setUsername(t);
          clearError("username");
        }}
        error={errors.username}
        autoCapitalize="none"
      />

      <FormField
        label="Phone Number"
        icon="phone"
        placeholder="+213 XXX XXX XXX"
        value={phone}
        onChangeText={(t) => {
          setPhone(t);
          clearError("phone");
        }}
        error={errors.phone}
        keyboardType="phone-pad"
      />

      <FormField
        label="Password"
        icon="lock-outline"
        placeholder="Minimum 8 characters"
        value={password}
        onChangeText={(t) => {
          setPassword(t);
          clearError("password");
        }}
        error={errors.password}
        secure
        showSecure={showPassword}
        onToggleSecure={() => setShowPassword(!showPassword)}
      />

      <FormField
        label="Confirm Password"
        icon="lock"
        placeholder="Repeat your password"
        value={confirmPassword}
        onChangeText={(t) => {
          setConfirmPassword(t);
          clearError("confirmPassword");
        }}
        error={errors.confirmPassword}
        secure
        showSecure={showConfirm}
        onToggleSecure={() => setShowConfirm(!showConfirm)}
      />

      <View style={styles.btnRow}>
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => setStep(1)}
        >
          <MaterialIcons name="arrow-back" size={16} color="#6b7280" />
          <Text style={styles.secondaryBtnText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => validateStep2() && setStep(3)}
        >
          <Text style={styles.primaryBtnText}>Continue</Text>
          <MaterialIcons name="arrow-forward" size={16} color="#065f46" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardIconBox}>
          <MaterialIcons name="badge" size={20} color="#047857" />
        </View>
        <View>
          <Text style={styles.cardTitle}>Profile Details</Text>
          <Text style={styles.cardSub}>Almost done!</Text>
        </View>
      </View>

      {/* ── BUYER ── */}
      {role === "BUYER" && (
        <>
          <FormField
            label="Age"
            icon="cake"
            placeholder="Your age"
            value={buyerAge}
            onChangeText={(t) => {
              setBuyerAge(t);
              clearError("buyerAge");
            }}
            error={errors.buyerAge}
            keyboardType="numeric"
          />

          <ImageUploadField
            label="Profile Photo (Optional)"
            description="Your public profile picture"
            icon="account-circle"
            image={profileImage}
            onPick={() => pickImage(setProfileImage)}
          />

          <ImageUploadField
            label="Business License"
            description="Photo of your business/commercial license"
            icon="business"
            image={businessLicenseImage}
            onPick={() => pickImage(setBusinessLicenseImage)}
            error={errors.businessLicenseImage}
          />
        </>
      )}

      {/* ── FARMER ── */}
      {role === "FARMER" && (
        <>
          <FormField
            label="Age"
            icon="cake"
            placeholder="Your age"
            value={farmerAge}
            onChangeText={(t) => {
              setFarmerAge(t);
              clearError("farmerAge");
            }}
            error={errors.farmerAge}
            keyboardType="numeric"
          />
          <FormField
            label="Wilaya"
            icon="place"
            placeholder="e.g. Constantine"
            value={wilaya}
            onChangeText={(t) => {
              setWilaya(t);
              clearError("wilaya");
            }}
            error={errors.wilaya}
          />
          <FormField
            label="Farm Name"
            icon="storefront"
            placeholder="Your farm's name"
            value={farmName}
            onChangeText={(t) => {
              setFarmName(t);
              clearError("farmName");
            }}
            error={errors.farmName}
          />
          <FormField
            label="Baladiya (Municipality)"
            icon="location-city"
            placeholder="Your municipality"
            value={baladiya}
            onChangeText={(t) => {
              setBaladiya(t);
              clearError("baladiya");
            }}
            error={errors.baladiya}
          />
          <FormField
            label="Farm Size (hectares)"
            icon="landscape"
            placeholder="e.g. 5.5"
            value={farmSize}
            onChangeText={(t) => {
              setFarmSize(t);
              clearError("farmSize");
            }}
            error={errors.farmSize}
            keyboardType="numeric"
          />
          <FormField
            label="Farm Address"
            icon="home"
            placeholder="Detailed address"
            value={address}
            onChangeText={(t) => {
              setAddress(t);
              clearError("address");
            }}
            error={errors.address}
          />

          <ImageUploadField
            label="Profile Photo (Optional)"
            description="Your public profile picture"
            icon="account-circle"
            image={profileImage}
            onPick={() => pickImage(setProfileImage)}
          />

          <ImageUploadField
            label="Farmer Card"
            description="Photo of your official farmer identification card"
            icon="badge"
            image={farmerCardImage}
            onPick={() => pickImage(setFarmerCardImage)}
            error={errors.farmerCardImage}
          />

          <ImageUploadField
            label="National ID"
            description="Photo of your national identity document"
            icon="credit-card"
            image={nationalIdImage}
            onPick={() => pickImage(setNationalIdImage)}
            error={errors.nationalIdImage}
          />
        </>
      )}

      {/* ── TRANSPORTER ── */}
      {role === "TRANSPORTER" && (
        <>
          <FormField
            label="Age"
            icon="cake"
            placeholder="Your age"
            value={transporterAge}
            onChangeText={(t) => {
              setTransporterAge(t);
              clearError("transporterAge");
            }}
            error={errors.transporterAge}
            keyboardType="numeric"
          />

          {/* Vehicle type selector */}
          <Text style={styles.label}>Vehicle Type</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.vehicleTypeRow}
          >
            {VEHICLE_TYPES.map((vt) => (
              <TouchableOpacity
                key={vt}
                style={[
                  styles.vehicleTypePill,
                  vehicleType === vt && styles.vehicleTypePillActive,
                ]}
                onPress={() => {
                  setVehicleType(vt);
                  clearError("vehicleType");
                }}
              >
                <Text
                  style={[
                    styles.vehicleTypePillText,
                    vehicleType === vt && styles.vehicleTypePillTextActive,
                  ]}
                >
                  {vt}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {errors.vehicleType ? (
            <Text style={styles.errorText}>{errors.vehicleType}</Text>
          ) : null}

          <FormField
            label="Vehicle Model"
            icon="directions-car"
            placeholder="e.g. Mercedes Actros"
            value={vehicleModel}
            onChangeText={(t) => {
              setVehicleModel(t);
              clearError("vehicleModel");
            }}
            error={errors.vehicleModel}
          />

          <View style={styles.twoCol}>
            <View style={{ flex: 1 }}>
              <FormField
                label="Year"
                icon="calendar-today"
                placeholder="e.g. 2020"
                value={vehicleYear}
                onChangeText={(t) => {
                  setVehicleYear(t);
                  clearError("vehicleYear");
                }}
                error={errors.vehicleYear}
                keyboardType="numeric"
              />
            </View>
            <View style={{ flex: 1 }}>
              <FormField
                label="Capacity (T)"
                icon="scale"
                placeholder="e.g. 10"
                value={vehicleCapacity}
                onChangeText={(t) => {
                  setVehicleCapacity(t);
                  clearError("vehicleCapacity");
                }}
                error={errors.vehicleCapacity}
                keyboardType="numeric"
              />
            </View>
          </View>

          <ImageUploadField
            label="Profile Photo (Optional)"
            description="Your public profile picture"
            icon="account-circle"
            image={profileImage}
            onPick={() => pickImage(setProfileImage)}
          />

          <ImageUploadField
            label="Driver License"
            description="Photo of your valid driver's license"
            icon="drive-eta"
            image={driverLicenseImage}
            onPick={() => pickImage(setDriverLicenseImage)}
            error={errors.driverLicenseImage}
          />

          <ImageUploadField
            label="Grey Card (Vehicle Registration)"
            description="Photo of your vehicle's grey registration card"
            icon="description"
            image={greyCardImage}
            onPick={() => pickImage(setGreyCardImage)}
            error={errors.greyCardImage}
          />
        </>
      )}

      <View style={styles.btnRow}>
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => setStep(2)}
        >
          <MaterialIcons name="arrow-back" size={16} color="#6b7280" />
          <Text style={styles.secondaryBtnText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.primaryBtn, isLoading && styles.primaryBtnDisabled]}
          onPress={handleRegister}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#065f46" size="small" />
          ) : (
            <>
              <Text style={styles.primaryBtnText}>Create Account</Text>
              <MaterialIcons name="check" size={16} color="#065f46" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  // ─── Root render ─────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Brand */}
        <View style={styles.brandRow}>
          <View style={styles.brandIcon}>
            <MaterialIcons name="agriculture" size={20} color="#047857" />
          </View>
          <Text style={styles.brandName}>AgriConnect DZ</Text>
        </View>

        <Text style={styles.pageTitle}>Create Account</Text>

        {/* Step indicator */}
        {renderStepIndicator()}

        {/* Steps */}
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}

        <Text style={styles.footer}>Ministry of Agriculture · Algeria</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── FormField helper ─────────────────────────────────────────────────────────

interface FormFieldProps {
  label: string;
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  error?: string;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  secure?: boolean;
  showSecure?: boolean;
  onToggleSecure?: () => void;
}

function FormField({
  label,
  icon,
  placeholder,
  value,
  onChangeText,
  error,
  keyboardType = "default",
  autoCapitalize,
  secure,
  showSecure,
  onToggleSecure,
}: FormFieldProps) {
  return (
    <View style={{ marginBottom: 4 }}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[styles.inputWrap, error ? styles.inputWrapError : undefined]}
      >
        <MaterialIcons name={icon} size={17} color="#9ca3af" />
        <TextInput
          style={styles.inputField}
          placeholder={placeholder}
          placeholderTextColor="#c0cfc0"
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize ?? "sentences"}
          autoCorrect={false}
          secureTextEntry={secure && !showSecure}
        />
        {secure && (
          <TouchableOpacity
            onPress={onToggleSecure}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialIcons
              name={showSecure ? "visibility" : "visibility-off"}
              size={17}
              color="#9ca3af"
            />
          </TouchableOpacity>
        )}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

// ─── ImageUploadField helper ───────────────────────────────────────────────────

interface ImageUploadFieldProps {
  label: string;
  description: string;
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
  image: ImageAsset | null;
  onPick: () => void;
  error?: string;
}

function ImageUploadField({
  label,
  description,
  icon,
  image,
  onPick,
  error,
}: ImageUploadFieldProps) {
  return (
    <View style={{ marginTop: 10, marginBottom: 4 }}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[
          styles.imageUploadBtn,
          image ? styles.imageUploadBtnDone : undefined,
          error ? styles.imageUploadBtnError : undefined,
        ]}
        onPress={onPick}
        activeOpacity={0.75}
      >
        {image ? (
          <>
            <Image
              source={{ uri: image.uri }}
              style={styles.imageUploadThumb}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.imageUploadDoneText}>Photo selected ✓</Text>
              <Text style={styles.imageUploadDesc} numberOfLines={1}>
                {image.fileName ?? "Selected image"}
              </Text>
            </View>
            <TouchableOpacity onPress={onPick} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialIcons name="edit" size={16} color="#047857" />
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.imageUploadIconBox}>
              <MaterialIcons name={icon} size={20} color="#9ca3af" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.imageUploadLabel}>Tap to upload</Text>
              <Text style={styles.imageUploadDesc}>{description}</Text>
            </View>
            <MaterialIcons name="add-photo-alternate" size={20} color="#9ca3af" />
          </>
        )}
      </TouchableOpacity>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f8f5",
  },

  scroll: {
    flexGrow: 1,
    padding: 16,
  },

  // ── BRAND
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 6,
  },

  brandIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#d1fae5",
    alignItems: "center",
    justifyContent: "center",
  },

  brandName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1a2e1a",
    letterSpacing: -0.3,
  },

  pageTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1a2e1a",
    letterSpacing: -0.5,
    marginBottom: 18,
    marginTop: 4,
  },

  // ── STEP INDICATOR
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 0.5,
    borderColor: "#e4efe4",
  },

  stepItem: {
    alignItems: "center",
    gap: 4,
  },

  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },

  stepDotActive: {
    backgroundColor: "#d1fae5",
    borderWidth: 1.5,
    borderColor: "#0df20d",
  },

  stepDotDone: {
    backgroundColor: "#d1fae5",
  },

  stepDotNum: {
    fontSize: 11,
    fontWeight: "800",
    color: "#9ca3af",
  },

  stepDotNumActive: {
    color: "#047857",
  },

  stepLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#c4c4c4",
    letterSpacing: 0.1,
  },

  stepLabelActive: {
    color: "#047857",
  },

  stepLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: "#e5e7eb",
    marginHorizontal: 4,
    marginBottom: 14,
  },

  stepLineDone: {
    backgroundColor: "#0df20d",
  },

  // ── CARD
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    borderWidth: 0.5,
    borderColor: "#e4efe4",
    marginBottom: 16,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 18,
  },

  cardIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#d1fae5",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1a2e1a",
    letterSpacing: -0.2,
  },

  cardSub: {
    fontSize: 12,
    color: "#9ca3af",
    fontWeight: "600",
    marginTop: 1,
  },

  // ── ROLE CARDS
  roleList: {
    gap: 10,
    marginBottom: 20,
  },

  roleCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: "#e4efe4",
    backgroundColor: "#f8faf8",
    overflow: "hidden",
    paddingRight: 14,
    paddingVertical: 14,
  },

  roleCardSelected: {
    borderWidth: 1.5,
    borderColor: "#0df20d",
    backgroundColor: "#f0fdf4",
  },

  roleAccent: {
    width: 4,
    alignSelf: "stretch",
  },

  roleIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  roleCardLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: "#6b7280",
    marginBottom: 2,
  },

  roleCardLabelSelected: {
    color: "#1a2e1a",
  },

  roleCardDesc: {
    fontSize: 11,
    color: "#9ca3af",
    lineHeight: 15,
    fontWeight: "500",
  },

  roleRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  roleRadioSelected: {
    borderColor: "#0df20d",
  },

  roleRadioDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#0df20d",
  },

  // ── ROLE BADGE (step 2)
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#d1fae5",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: "flex-start",
    marginBottom: 16,
  },

  roleBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#047857",
  },

  // ── FORM
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 6,
    marginTop: 8,
  },

  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f8faf8",
    borderWidth: 0.5,
    borderColor: "#e4efe4",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },

  inputWrapError: {
    borderColor: "#ef4444",
    borderWidth: 1,
    backgroundColor: "#fff5f5",
  },

  inputField: {
    flex: 1,
    fontSize: 13,
    color: "#1a2e1a",
    padding: 0,
  },

  errorText: {
    fontSize: 11,
    color: "#ef4444",
    fontWeight: "600",
    marginTop: 4,
    marginBottom: 4,
  },

  twoCol: {
    flexDirection: "row",
    gap: 10,
  },

  // ── VEHICLE TYPE
  vehicleTypeRow: {
    gap: 8,
    paddingBottom: 4,
    marginBottom: 8,
    marginTop: 2,
  },

  vehicleTypePill: {
    backgroundColor: "#f3f4f6",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 0.5,
    borderColor: "#e5e7eb",
  },

  vehicleTypePillActive: {
    backgroundColor: "#d1fae5",
    borderColor: "#a7f3d0",
  },

  vehicleTypePillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6b7280",
  },

  vehicleTypePillTextActive: {
    color: "#047857",
  },

  // ── INFO BOX
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#f8faf8",
    borderRadius: 12,
    padding: 12,
    borderWidth: 0.5,
    borderColor: "#e4efe4",
    marginTop: 12,
    marginBottom: 4,
  },

  infoText: {
    flex: 1,
    fontSize: 12,
    color: "#6b7280",
    lineHeight: 17,
    fontWeight: "500",
  },

  // ── BUTTONS
  btnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    gap: 10,
  },

  primaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#0df20d",
    paddingVertical: 13,
    borderRadius: 12,
  },

  primaryBtnDisabled: {
    backgroundColor: "#d1fae5",
  },

  primaryBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#065f46",
  },

  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#f8faf8",
    borderWidth: 0.5,
    borderColor: "#e4efe4",
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 12,
  },

  secondaryBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6b7280",
  },

  // ── FOOTER
  footer: {
    textAlign: "center",
    fontSize: 11,
    color: "#c4c4c4",
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 4,
  },

  // ── IMAGE UPLOAD
  imageUploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#f8faf8",
    borderWidth: 1.5,
    borderColor: "#e4efe4",
    borderRadius: 12,
    borderStyle: "dashed",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },

  imageUploadBtnDone: {
    borderStyle: "solid",
    borderColor: "#a7f3d0",
    backgroundColor: "#f0fdf4",
  },

  imageUploadBtnError: {
    borderColor: "#ef4444",
    backgroundColor: "#fff5f5",
  },

  imageUploadIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  imageUploadThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    flexShrink: 0,
  },

  imageUploadLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 2,
  },

  imageUploadDoneText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#047857",
    marginBottom: 2,
  },

  imageUploadDesc: {
    fontSize: 11,
    color: "#9ca3af",
    fontWeight: "500",
  },
});
