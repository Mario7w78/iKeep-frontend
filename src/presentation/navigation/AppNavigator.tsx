import React from "react";
import { StyleSheet } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import OnBoardingView from "../components/organisms/Onboarding/OnboardingVIew";
import HomeScreen from "../screens/Home/HomeView";
import ScheduleScreen from "../screens/schedule/ScheduleView";
import StatsView from "../screens/Stats/StatsView";
import CreateActivityScreen from "../screens/Activity/activityCreation/CreateActivityView";
import SettingsView from "../screens/Settings/SettingsView";
import { useAppStore } from "../../infrastructure/store/useAppStore";
import { useScheduleStore } from "../../di/Dependencies";
import { Theme } from "../components/theme/colors";

export type RootStackParamList = {
  MainTabs: undefined;
  CreateActivityModal: undefined;
  OnBoardingView: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Schedule: undefined;
  Stats: undefined;
  Setting: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ICONS: Record<keyof MainTabParamList, [string, string]> = {
  Home: ["home", "home-outline"],
  Schedule: ["calendar", "calendar-outline"],
  Stats: ["bar-chart", "bar-chart-outline"],
  Setting: ["options", "options-outline"],
};

function TabNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Theme.colors.tabActive,
        tabBarInactiveTintColor: Theme.colors.tabInactive,
        tabBarShowLabel: true,
        tabBarIcon: ({ focused, color }) => {
          const [active, inactive] = TAB_ICONS[route.name];
          const iconName = focused ? active : inactive;

          return (
            <Ionicons
              name={iconName as keyof typeof Ionicons.glyphMap}
              size={24}
              color={color}
            />
          );
        },
        tabBarStyle: [
          styles.tabBar,
          {
            height: 50 + insets.bottom,
            paddingBottom: Math.max(insets.bottom, 10),
          },
        ],
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
      })}
    >
      <Tab.Screen
        name="Home"
        options={{ title: "Home" }}
        component={HomeScreen}
      />
      <Tab.Screen
        name="Schedule"
        options={{ title: "Calendario" }}
        component={ScheduleScreen}
      />
      <Tab.Screen
        name="Stats"
        options={{ title: "Estadisticas" }}
        component={StatsView}
      />
      <Tab.Screen
        name="Setting"
        options={{ title: "Configuracion" }}
        component={SettingsView}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const hasSeenOnboarding = useAppStore((s) => s.hasSeenOnboarding);
  const loadDayLimits = useScheduleStore((s) => s.loadDayLimits);

  React.useEffect(() => {
    loadDayLimits();
  }, [loadDayLimits]);

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
    backgroundColor: Theme.colors.tabBarBackground,
    borderTopWidth: 0,
    elevation: 0,
    paddingTop: 8,
    shadowOpacity: 0,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "800",
  },
  tabItem: {
    gap: 2,
  },
});
