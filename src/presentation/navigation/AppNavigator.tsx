import React from "react";
import { TouchableOpacity, View, StyleSheet, Platform } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import OnBoardingView from "../components/organisms/Onboarding/OnboardingVIew";
import ActivityListScreen from "../screens/Activity/activityList/ActivityListView";
import ScheduleScreen from "../screens/Schedule/ScheduleView";
import CreateActivityScreen from "../screens/Activity/activityCreation/CreateActivityView";
import SettingsView from "../screens/Settings/SettingsView";
import { Theme } from "../components/theme/colors";
import { useAppStore } from "../../infrastructure/store/useAppStore";
import { useScheduleStore } from "../../di/Dependencies";


export type RootStackParamList = {
  MainTabs: undefined;
  CreateActivityModal: undefined;
  OnBoardingView: undefined;
};

export type MainTabParamList = {
  ActivityList: undefined;
  Schedule: undefined;
  Setting: undefined;
};

// ─── Navigators ──────────────────────────────────────────────

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// 🐸 Lista de items en la tabview

const TAB_ICONS: Record<string, [string, string]> = {
  ActivityList: ["list", "list-outline"],
  Schedule: ["calendar", "calendar-outline"],
  Setting: ["settings", "settings-outline"],
};

const FAB_COLOR = Theme.componentColors.buttonBg;

// 🐸 Boton de creación de actividad 

function CreateActivityButton() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.fabContainer,
        { bottom: insets.bottom + (Platform.OS === "android" ? 70 : 65) },
      ]}
    >
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => navigation.navigate("CreateActivityModal")}
      >
        <Ionicons name="add" size={28} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
}

// ─── Tab Navigator ───────────────────────────────────────────

function TabNavigator() {
  const insets = useSafeAreaInsets();

  const tabBarDynamicStyle = {
    height: Platform.OS === "ios" ? 80 : 50 + insets.bottom,
    paddingBottom: Platform.OS === "ios" ? 20 : insets.bottom,
    paddingTop: Platform.OS === "ios" ? 6 : insets.top,
  };

  return (
    <>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: "white",
          tabBarInactiveTintColor: Theme.colors.font,
          tabBarShowLabel: true,
          tabBarIcon: ({ focused, color, size }) => {
            const [active, inactive] = TAB_ICONS[route.name] ?? [
              "ellipse",
              "ellipse-outline",
            ];
            const iconName = focused ? active : inactive;
            return (
              <Ionicons
                name={iconName as keyof typeof Ionicons.glyphMap}
                size={size}
                color={color}
              />
            );
          },
          tabBarStyle: [styles.tabBar, tabBarDynamicStyle],
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
      <CreateActivityButton />
    </>
  );
}

// ─── Root Navigator ──────────────────────────────────────────

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
    backgroundColor: Theme.componentColors.lightBackground,
    borderTopWidth: 0,
  },
  tabLabel: {
    fontSize: 12,
  },
  fabContainer: {
    position: "absolute",
    right: 15,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: FAB_COLOR,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
