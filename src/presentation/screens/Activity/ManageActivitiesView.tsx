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
import { Ionicons } from "@expo/vector-icons";
import { useActivityStore, useScheduleStore } from "../../../di/Dependencies";
import { useTheme } from "../../components/theme/colors";
import { Activity } from "../../../domain/entities/Activity";
import { ActivityConfigDetailModal } from "../../components/organisms/Activity/ActivityConfigDetailModal";

export default function ManageActivitiesView({ navigation, route }: any) {
  const { colors, comfyColors, comfyFontColors } = useTheme();
  const { activities, loadActivities, handleDeleteActivity } = useActivityStore();
  const { handleGenerateSchedule } = useScheduleStore();
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  const styles = useMemo(() => createStyles(colors, comfyColors, comfyFontColors), [colors, comfyColors, comfyFontColors]);

  useEffect(() => {
    loadActivities();
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

  const getIdentityIcon = (val: string) => {
    switch (val) {
      case "clase": return "school-outline";
      case "trabajo": return "briefcase-outline";
      case "tarea": return "document-text-outline";
      default: return "document-text-outline";
    }
  };

  const getIdentityColor = (val: string) => {
    switch (val) {
      case "clase": return comfyColors.skyBlue;
      case "trabajo": return comfyColors.orange;
      case "tarea": return comfyColors.green;
      default: return comfyColors.green;
    }
  };

  const getIdentityLabel = (val: string) => {
    switch (val) {
      case "clase": return "Clase";
      case "trabajo": return "Trabajo";
      case "tarea": return "Tarea";
      default: return val;
    }
  };

  return (
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
          <View style={styles.activityCard}>
            <TouchableOpacity 
              style={styles.cardInfo}
              activeOpacity={0.7}
              onPress={() => setSelectedActivity(item)}
            >
              <View style={styles.cardInfoRow}>
                <View style={[styles.cardIcon, { backgroundColor: getIdentityColor(item.identity) + '20' }]}>
                  <Ionicons
                    name={getIdentityIcon(item.identity)}
                    size={20}
                    color={getIdentityColor(item.identity)}
                  />
                </View>
                <View style={styles.cardInfoText}>
                  <Text style={styles.activityTitle}>{item.title}</Text>
                  <View style={styles.badgeRow}>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{getIdentityLabel(item.identity)}</Text>
                    </View>
                    <View style={[styles.badge, styles.difficultyBadge]}>
                      <Text style={styles.badgeText}>Dificultad: {item.difficulty}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
            <View style={styles.actionButtonsCol}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => navigation.navigate("CreateActivityModal", { activityId: item.id })}
              >
                <Ionicons name="create-outline" size={22} color={colors.iconPrimary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => onDelete(item.id, item.title)}
              >
                <Ionicons name="trash-outline" size={22} color={colors.error} />
              </TouchableOpacity>
            </View>
          </View>
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
  activityCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.cardBackground,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    justifyContent: "space-between",
  },
  cardInfo: {
    flex: 1,
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
  deleteButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: `${colors.error}20`,
  },
  actionButtonsCol: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  editButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: `${colors.iconPrimary}20`,
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
