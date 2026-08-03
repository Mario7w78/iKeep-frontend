import React, { useEffect } from "react";
import { StyleSheet, useWindowDimensions, View, ActivityIndicator } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ScreenOrientation from "expo-screen-orientation";

import OnBoardingView from "../components/organisms/Onboarding/OnboardingVIew";
import HomeScreen from "../screens/Home/HomeView";
import ScheduleScreen from "../screens/Schedule/ScheduleView";
import StatsView from "../screens/Stats/StatsView";
import CreateActivityScreen from "../screens/Activity/activityCreation/CreateActivityView";
import SettingsView from "../screens/Settings/SettingsView";
import ManageActivitiesView from "../screens/Activity/ManageActivitiesView";
import LoginView from "../screens/Auth/LoginView";
import SignUpView from "../screens/Auth/SignUpView";
import { useAppStore } from "../../infrastructure/store/useAppStore";
import { useAuthStore } from "../../infrastructure/store/useAuthStore";
import { useScheduleStore, notificationScheduler } from "../../di/Dependencies";
import { Theme, useTheme, ThemeProvider, applyThemeToStaticTheme } from "../components/theme/colors";
import AIChatView from "../screens/AIChat/AIChatView";

export type RootStackParamList = {
  MainTabs: undefined;
  CreateActivityModal?: { activityId?: string };
  ManageActivities: undefined;
  AIChatView: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
};

const DummyComponent = () => null;

export type MainTabParamList = {
  Home: undefined;
  Schedule: undefined;
  Activities: undefined;
  // Stats: undefined;
  Setting: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginView} />
      <AuthStack.Screen name="SignUp" component={SignUpView} />
    </AuthStack.Navigator>
  );
}

const TAB_ICONS: Record<keyof MainTabParamList, [string, string]> = {
  Home: ["home", "home-outline"],
  Schedule: ["calendar", "calendar-outline"],
  Activities: ["list", "list-outline"],
  // Stats: ["bar-chart", "bar-chart-outline"],
  Setting: ["options", "options-outline"],
};

function TabNavigator() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  // Landscape is only ever active on the Schedule screen (see ScheduleView),
  // which uses it to show the full week. Hiding the tab bar there reclaims
  // real vertical space for the calendar instead of wasting it on navigation
  // the user can't even reach without rotating back to portrait first.
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
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
        tabBarStyle: isLandscape
          ? { display: 'none' }
          : [
              styles.tabBar,
              {
                height: 50 + insets.bottom,
                paddingBottom: Math.max(insets.bottom, 10),
                backgroundColor: colors.tabBarBackground,
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
        name="Activities"
        options={{ title: "Actividades" }}
        component={ManageActivitiesView}
      />
      <Tab.Screen
        name="Schedule"
        options={{ title: "Calendario" }}
        component={ScheduleScreen}
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
  const themeId = useAppStore((s) => s.themeId);
  const pendingDayLimits = useAppStore((s) => s.pendingDayLimits);
  const clearPendingDayLimits = useAppStore((s) => s.clearPendingDayLimits);
  const loadDayLimits = useScheduleStore((s) => s.loadDayLimits);
  const loadSchedule = useScheduleStore((s) => s.loadSchedule);
  const setStartHour = useScheduleStore((s) => s.setStartHour);
  const setEndHour = useScheduleStore((s) => s.setEndHour);

  const initializeAuth = useAuthStore((s) => s.initialize);
  const session = useAuthStore((s) => s.session);
  const authLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Los datos (actividades, horario, configuración) viven en Supabase detrás
  // de RLS — no tiene sentido pedirlos sin sesión, y fallarían igual.
  useEffect(() => {
    if (!session) return;
    (async () => {
      await notificationScheduler.requestPermissions();
      // Lo que el usuario eligió en el onboarding se guarda recién acá: ese
      // paso corre antes de iniciar sesión y no tenía a quién asociarlo.
      // Va antes de loadDayLimits para que no lo pise con los valores por
      // defecto de una cuenta recién creada.
      if (pendingDayLimits) {
        await setStartHour(pendingDayLimits.startHour);
        await setEndHour(pendingDayLimits.endHour);
        clearPendingDayLimits();
      }
      await loadDayLimits();
      await loadSchedule();
    })();
    // pendingDayLimits queda fuera de las dependencias a propósito: se limpia
    // dentro del efecto y volver a dispararlo sería un ciclo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, loadDayLimits, loadSchedule]);

  // App-wide default: portrait only. The Schedule screen is the single
  // exception — it unlocks orientation while focused (see ScheduleView) and
  // relocks portrait when the user navigates away.
  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
  }, []);

  // Sync static Theme on mount (for components that import Theme directly)
  useEffect(() => {
    applyThemeToStaticTheme(themeId);
  }, [themeId]);

  if (authLoading) {
    return (
      <ThemeProvider>
        <View style={styles.splash}>
          <ActivityIndicator size="large" color={Theme.colors.surface} />
        </View>
      </ThemeProvider>
    );
  }

  // El onboarding va antes de pedir credenciales: el usuario ve para qué
  // sirve la app antes de tener que registrarse. No toca la base de datos —
  // lo que elige queda pendiente hasta que haya sesión.
  if (!hasSeenOnboarding) {
    return (
      <ThemeProvider>
        <OnBoardingView />
      </ThemeProvider>
    );
  }

  if (!session) {
    return (
      <ThemeProvider>
        <AuthNavigator />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName="MainTabs"
      >
        <Stack.Screen name="MainTabs" component={TabNavigator} />
        <Stack.Screen name="ManageActivities" component={ManageActivitiesView} />
        <Stack.Screen
          name="CreateActivityModal"
          component={CreateActivityScreen}
          options={{
            presentation: 'containedTransparentModal',
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="AIChatView"
          component={AIChatView}
          options={{
            presentation: 'containedTransparentModal',
            animation: 'fade',
          }}
        />
      </Stack.Navigator>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Theme.colors.screenBackground,
  },
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
