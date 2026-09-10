import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import { useActivityStore, useScheduleStore } from "../../../di/Dependencies";
import { useTheme } from "../../components/theme/colors";
import { Activity } from "../../../domain/entities/Activity";
import { ActivityConfigDetailModal } from "../../components/organisms/Activity/ActivityConfigDetailModal";
import { AreaIcon, areaColorMap } from "./areaIcon";
import { areaTituloDe } from "../Home/HomeView.utils";
import {
  SwipeableActivityCard,
  SwipeAction,
} from "../../components/atoms/SwipeableActivityCard";

export default function ManageActivitiesView({ navigation, route }: any) {
  const { colors, comfyColors, comfyFontColors } = useTheme();
  const { activities, loadActivities, handleDeleteActivity } = useActivityStore();
  const { handleGenerateSchedule } = useScheduleStore();
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  const styles = useMemo(() => createStyles(colors, comfyColors, comfyFontColors), [colors, comfyColors, comfyFontColors]);

  useEffect(() => {
    loadActivities(true);
  }, []);

  useEffect(() => {
    if (route.params?.selectActivityId && activities.length > 0) {
      const found = activities.find((a) => a.id === route.params.selectActivityId);
      if (found) {
        setSelectedActivity(found);
        navigation.setParams({ selectActivityId: undefined });
        Alert.alert(
          "Actividad guardada",
          "La actividad se guardó con éxito y se actualizó tu calendario."
        );
      }
    }
  }, [route.params?.selectActivityId, activities, navigation]);

  const onDelete = (id: string, name: string) => {
    Alert.alert(
      "Eliminar actividad",
      `¿Estás seguro de que quieres eliminar "${name}"? Esto recalculará tu horario.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            await handleDeleteActivity(id);
            try {
              await handleGenerateSchedule();
            } catch (e) {
              console.error("Error generating schedule after delete:", e);
            }
          },
        },
      ]
    );
  };

  // Acciones ocultas del card: se revelan al deslizar hacia la izquierda.
  // `SwipeableActivityCard` se encarga de cerrar el swipe al presionar.
  const getSwipeActions = (item: Activity): SwipeAction[] => [
    {
      key: "editar",
      label: "Editar",
      icono: "create-outline",
      color: colors.secondaryAccent,
      onPress: () => navigation.navigate("CreateActivityModal", { activityId: item.id }),
    },
    {
      key: "eliminar",
      label: "Eliminar",
      icono: "trash-outline",
      color: colors.error,
      onPress: () => onDelete(item.id, item.title),
    },
  ];

  return (
    <GestureHandlerRootView style={styles.safe}>
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        {navigation.canGoBack?.() && (
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.surface} />
          </TouchableOpacity>
        )}
        <Text style={styles.title}>Mis Actividades</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={activities}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <SwipeableActivityCard
            actions={getSwipeActions(item)}
            onPress={() => setSelectedActivity(item)}
          >
            <View style={styles.cardInfoRow}>
              <View
                style={[styles.cardIcon, { backgroundColor: areaColorMap[item.area] }]}
              >
                <AreaIcon area={item.area} size={20} />
              </View>
              <View style={styles.cardInfoText}>
                <Text
                  style={styles.activityTitle}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {item.title}
                </Text>
                <View style={styles.badgeRow}>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{areaTituloDe(item.area)}</Text>
                  </View>
                  <View style={[styles.badge, styles.difficultyBadge]}>
                    <Text style={styles.badgeText}>Dificultad: {item.difficulty}</Text>
                  </View>
                </View>
              </View>
            </View>
          </SwipeableActivityCard>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="clipboard-outline" size={48} color={colors.iconPrimary} />
            <Text style={styles.emptyText}>No tienes actividades creadas</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              activeOpacity={0.8}
              onPress={() => navigation.navigate("CreateActivityModal")}
            >
              <Ionicons name="add-circle-outline" size={20} color={comfyFontColors.green} />
              <Text style={styles.emptyButtonText}>Crear actividad manualmente</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.emptyButton, styles.emptyButtonSecondary]}
              activeOpacity={0.8}
              onPress={() => navigation.navigate("AIChatView")}
            >
              <Ionicons name="chatbubbles-outline" size={20} color={comfyColors.green} />
              <Text style={[styles.emptyButtonText, { color: comfyColors.green }]}>Crear actividad con el asistente</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <ActivityConfigDetailModal
        visible={selectedActivity !== null}
        activity={selectedActivity}
        onClose={() => setSelectedActivity(null)}
      />
    </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const createStyles = (
  colors: ReturnType<typeof useTheme>['colors'],
  comfyColors: ReturnType<typeof useTheme>['comfyColors'],
  comfyFontColors: ReturnType<typeof useTheme>['comfyFontColors'],
) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.screenBackground,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.cardBackground,
  },
  title: {
    color: colors.surface,
    fontSize: 20,
    fontWeight: "900",
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  cardInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    paddingTop: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfoText: {
    flex: 1,
    gap: 6,
  },
  activityTitle: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: "800",
  },
  badgeRow: {
    flexDirection: "row",
    gap: 8,
  },
  badge: {
    backgroundColor: colors.screenBackground,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  difficultyBadge: {},
  badgeText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "800",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
    gap: 12,
    paddingHorizontal: 32,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 16,
  },
  emptyButton: {
    minHeight: 50,
    borderRadius: 18,
    backgroundColor: comfyColors.green,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 28,
    width: '100%',
  },
  emptyButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: comfyColors.green,
    marginTop: 12,
  },
  emptyButtonText: {
    color: comfyFontColors.green,
    textAlign: "center",
    fontSize: 15,
    fontWeight: "900",
  },
});
