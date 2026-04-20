import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

// Import farmer screens
import FarmerDashboard from "../screens/farmer/FarmerDashboard";
import InventoryScreen from "../screens/farmer/InventoryScreen";
import AddProductScreen from "../screens/farmer/AddProductScreen";
import EditProductScreen from "../screens/farmer/EditProductScreen";
import LogisticsScreen from "../screens/farmer/LogisticsScreen";
import ProfileStack from "./ProfileStack"; // Using the same profile screen

// Define types
export type InventoryStackParamList = {
  InventoryMain: undefined;
  AddProduct: undefined;
  EditProduct: { productId: number };
};

export type FarmerTabParamList = {
  Dashboard: undefined;
  Inventory: undefined;
  Logistics: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<FarmerTabParamList>();
const InventoryStack = createNativeStackNavigator<InventoryStackParamList>();

// Inventory Stack Navigator
function InventoryStackNavigator() {
  return (
    <InventoryStack.Navigator screenOptions={{ headerShown: false }}>
      <InventoryStack.Screen name="InventoryMain" component={InventoryScreen} />
      <InventoryStack.Screen name="AddProduct" component={AddProductScreen} />
      <InventoryStack.Screen name="EditProduct" component={EditProductScreen} />
    </InventoryStack.Navigator>
  );
}

// Main Farmer Tab Navigator
export default function FarmerTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === "Dashboard") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Inventory") {
            iconName = focused ? "cube" : "cube-outline";
          } else if (route.name === "Logistics") {
            iconName = focused ? "car" : "car-outline";
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline";
          } else {
            iconName = "help-circle-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#4CAF50",
        tabBarInactiveTintColor: "gray",
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={FarmerDashboard} />
      <Tab.Screen name="Inventory" component={InventoryStackNavigator} />
      <Tab.Screen name="Logistics" component={LogisticsScreen} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}
