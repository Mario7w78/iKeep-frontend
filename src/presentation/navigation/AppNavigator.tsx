import React from "react";
import { TouchableOpacity, View, StyleSheet } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform } from "react-native";

import OnBoardingView from "../components/organisms/Onboarding/OnboardingVIew";
import ActivityListScreen from "../screens/Activity/activityList/ActivityListView";
import ScheduleScreen from "../screens/Schedule/ScheduleView";
import CreateActivityScreen from "../screens/Activity/activityCreation/CreateActivityView";
import { Theme } from "../components/theme/colors";
import { useAppStore } from "../../infrastructure/store/useAppStore";
import SettingsView from "../screens/Settings/SettingsView";
import { useScheduleStore } from "../../infrastructure/store/useScheduleStore";

export type RootStackParamList = {
  MainTabs: undefined;
  CreateActivityModal: undefined;
  OnBoardingView: undefined;
};

export type MainTabParamList = {
  ActivityList: undefined;
  Schedule: undefined;
  Setting: undefined
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function FABButton() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.fabBG,
        {
          bottom: insets.bottom + (Platform.OS === "android" ? 70 : 65),
          right: 15
        },
      ]}
    >
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => navigation.navigate("CreateActivityModal")}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

function TabNavigator() {
  const insets = useSafeAreaInsets();
  return (
    <>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: Theme.colors.primary,
          tabBarInactiveTintColor: Theme.colors.surface,
          tabBarShowLabel: true,
          tabBarIcon: ({ focused, color, size }) => {
            const icons: Record<string, [string, string]> = {
              ActivityList: ["list", "list-outline"],
              Schedule: ["calendar", "calendar-outline"],
              Setting: ["settings", "settings-outline"],
            };
            const [active, inactive] = icons[route.name] ?? [
              "ellipse",
              "ellipse-outline",
            ];
            return (
              <Ionicons
                name={
                  (focused
                    ? active
                    : inactive) as keyof typeof Ionicons.glyphMap
                }
                size={size}
                color={color}
              />
            );
          },
          tabBarStyle: [
            styles.tabBar,
            {
              height: Platform.OS === "ios" ? 80 : 50 + insets.bottom,
              paddingBottom: Platform.OS === "ios" ? 10 : insets.bottom,
            },
          ],
          tabBarLabelStyle: styles.tabLabel,
        })}
      >
        <Tab.Screen
          name="ActivityList"
          options={{ title: "Actividades" }}
          component={ActivityListScreen}
        />
        <Tab.Screen
          name="Schedule"
          options={{ title: "Horario" }}
          component={ScheduleScreen}
        />
        <Tab.Screen
          name="Setting"
          options={{ title: "Configuración" }}
          component={SettingsView}
        />
      </Tab.Navigator>
      <FABButton />
    </>
  );
}

export default function AppNavigator() {
  const hasSeenOnboarding = useAppStore((s) => s.hasSeenOnboarding);
  const loadDayLimits = useScheduleStore((s) => s.loadDayLimits);

  React.useEffect(() => {
    loadDayLimits();
  }, []);

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={hasSeenOnboarding ? "MainTabs" : "OnBoardingView"}
    >
      <Stack.Screen name="OnBoardingView" component={OnBoardingView} />
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen
        name="CreateActivityModal"
        component={CreateActivityScreen}
        options={{ animation: "slide_from_bottom" }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Theme.colors.lightBackground,
    borderTopWidth: 0,
  },
  tabLabel: {
    fontSize: 12,
  },
  fabBG: {
    position: "absolute",
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
