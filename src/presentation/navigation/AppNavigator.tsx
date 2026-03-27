import React from 'react';
import { TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import ActivityListScreen from '../screens/Activity/ActivityListScreen';
import ScheduleScreen from '../screens/ScheduleScreen';
import CreateActivityScreen from '../screens/Activity/CreateActivityScreen';

// 1. Tipos para el Stack principal y los Tabs
export type RootStackParamList = {
  MainTabs: undefined;
  CreateActivityModal: undefined; // El modal a pantalla completa
};

export type MainTabParamList = {
  ActivityList: undefined;
  Schedule: undefined;
  // Usamos un nombre falso para el botón del medio
  CreateActivityButton: undefined; 
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// 2. Tu Tab Navigator (El que tiene la barra inferior)
function TabNavigator() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#6200EE',
        tabBarInactiveTintColor: 'gray',
        tabBarShowLabel: true,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'list';
          if (route.name === 'ActivityList') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Schedule') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen 
        name="ActivityList" 
        component={ActivityListScreen} 
        options={{ title: 'Actividades' }} 
      />
      
      {/* EL TRUCO: Un botón falso que abre el Modal en lugar de una pestaña */}
      <Tab.Screen 
        name="CreateActivityButton" 
        // Un componente vacío porque nunca se va a renderizar
        component={ActivityListScreen} 
        options={{
          title: 'Crear',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle" size={size + 4} color={color} />
          ),
          tabBarButton: ({ style, children }) => (
            <TouchableOpacity 
              style={style} 
              onPress={() => navigation.navigate('CreateActivityModal')} 
            >
              {children}
            </TouchableOpacity>
          )
        }} 
      />

      <Tab.Screen 
        name="Schedule" 
        component={ScheduleScreen} 
        options={{ title: 'Horario' }} 
      />
    </Tab.Navigator>
  );
}

// 3. El Stack Navigator (El contenedor principal)
export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Tus pestañas normales */}
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      
      {/* La pantalla de crear, configurada para abrirse como modal sobre las pestañas */}
      <Stack.Screen 
        name="CreateActivityModal" 
        component={CreateActivityScreen} 
        options={{ 
          presentation: 'modal', // Animación de iOS que sube desde abajo
          animation: 'slide_from_bottom' // Para Android
        }} 
      />
    </Stack.Navigator>
  );
}