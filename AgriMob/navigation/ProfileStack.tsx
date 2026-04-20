// navigation/ProfileStack.tsx

import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Screens
import ProfileScreen from "../screens/profile/ProfileScreen";
import EditProfileScreen from "../screens/profile/Editprofilescreen";
import NotificationsScreen from "../screens/profile/Notificationsscreen";
import PaymentMethodsScreen from "../screens/profile/Paymentmethodsscreen";
import SecurityScreen from "../screens/profile/Securityscreen";
import HelpSupportScreen from "../screens/profile/Helpsupportscreen";
export type ProfileStackParamList = {
  ProfileMain: undefined;
  EditProfile: undefined;
  Notifications: undefined;
  PaymentMethods: undefined;
  Security: undefined;
  HelpSupport: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
      <Stack.Screen name="Security" component={SecurityScreen} />
      <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
    </Stack.Navigator>
  );
}