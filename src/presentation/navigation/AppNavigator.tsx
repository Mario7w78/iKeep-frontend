import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import OnBoardingView from '../components/organisms/Onboarding/OnboardingVIew';
import ActivityListScreen from '../screens/Activity/activityList/ActivityListView';
import ScheduleScreen from '../screens/Schedule/ScheduleView';
import CreateActivityScreen from '../screens/Activity/activityCreation/CreateActivityView';
import { Theme } from '../components/theme/colors';
import { useAppStore } from '../../infrastructure/store/useAppStore';

export type RootStackParamList = {
  MainTabs: undefined;
  CreateActivityModal: undefined;
  OnBoardingView: undefined
};

export type MainTabParamList = {
  ActivityList: undefined;
  Schedule: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function FABButton() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  return (
    <View style={styles.fabBG}>
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('CreateActivityModal')}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );

}

function TabNavigator() {
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
              ActivityList: ['list', 'list-outline'],
              Schedule: ['calendar', 'calendar-outline'],
            };
            const [active, inactive] = icons[route.name] ?? ['ellipse', 'ellipse-outline'];
            return (
              <Ionicons
                name={(focused ? active : inactive) as keyof typeof Ionicons.glyphMap}
                size={size}
                color={color}
              />
            );
          },
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.tabLabel,
        })}
      >
        <Tab.Screen name="ActivityList" options={{ title: 'Actividades' }} component={ActivityListScreen} />
        <Tab.Screen name="Schedule" options={{ title: 'Horario' }} component={ScheduleScreen} />
      </Tab.Navigator>
      <FABButton />
    </>
  );
}

export default function AppNavigator() {
  const hasSeenOnboarding = useAppStore((s) => s.hasSeenOnboarding);

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={hasSeenOnboarding ? 'MainTabs' : 'OnBoardingView'}
    >
      <Stack.Screen name="OnBoardingView" component={OnBoardingView} />
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen
        name="CreateActivityModal"
        component={CreateActivityScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Theme.colors.lightBackground,
    borderTopWidth: 0,
    height: 72,
    paddingBottom: 10,
  },
  tabLabel: {
    fontSize: 12,
  },
  fabBG: {
    position: 'absolute',
    bottom: 15,
    alignSelf: 'center',
    backgroundColor: Theme.colors.lightBackground,
    padding: 10,
    borderRadius: 50,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});