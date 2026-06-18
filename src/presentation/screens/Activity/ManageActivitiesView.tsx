import React, { useEffect, useState } from "react";
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
import { Theme } from "../../components/theme/colors";
import { Activity } from "../../../domain/entities/Activity";
import { ActivityConfigDetailModal } from "../../components/organisms/Activity/ActivityConfigDetailModal";

export default function ManageActivitiesView({ navigation, route }: any) {
  const { activities, loadActivities, handleDeleteActivity } = useActivityStore();
  const { handleGenerateSchedule } = useScheduleStore();
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

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
      case "clase": return Theme.comfyColors.skyBlue;
      case "trabajo": return Theme.comfyColors.orange;
      case "tarea": return Theme.comfyColors.green;
      default: return Theme.comfyColors.green;
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
            <Ionicons name="arrow-back" size={24} color={Theme.colors.surface} />
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
                <Ionicons name="create-outline" size={22} color={Theme.colors.iconPrimary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => onDelete(item.id, item.title)}
              >
                <Ionicons name="trash-outline" size={22} color={Theme.colors.error} />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="clipboard-outline" size={48} color={Theme.colors.iconPrimary} />
            <Text style={styles.emptyText}>No tienes actividades creadas</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              activeOpacity={0.8}
              onPress={() => navigation.navigate("CreateActivityModal")}
            >
              <Ionicons name="add-circle-outline" size={20} color={Theme.comfyFontColors.green} />
              <Text style={styles.emptyButtonText}>Crear actividad manualmente</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.emptyButton, styles.emptyButtonSecondary]}
              activeOpacity={0.8}
              onPress={() => navigation.navigate("AIChatView")}
            >
              <Ionicons name="chatbubbles-outline" size={20} color={Theme.comfyColors.green} />
              <Text style={[styles.emptyButtonText, { color: Theme.comfyColors.green }]}>Crear actividad con el asistente Sapo</Text>
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

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Theme.colors.screenBackground,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.cardBorder,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Theme.colors.cardBackground,
  },
  title: {
    color: Theme.colors.surface,
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
    backgroundColor: Theme.colors.cardBackground,
    borderColor: Theme.colors.cardBorder,
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
    color: Theme.colors.surface,
    fontSize: 16,
    fontWeight: "800",
  },
  badgeRow: {
    flexDirection: "row",
    gap: 8,
  },
  badge: {
    backgroundColor: "#4c506e",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  difficultyBadge: {
    backgroundColor: "#525576",
  },
  badgeText: {
    color: Theme.colors.surface,
    fontSize: 12,
    fontWeight: "800",
  },
  deleteButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255, 77, 77, 0.1)",
  },
  actionButtonsCol: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  editButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "rgba(174, 190, 255, 0.1)",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
    gap: 12,
    paddingHorizontal: 32,
  },
  emptyText: {
    color: Theme.colors.textSecondary,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 16,
  },
  emptyButton: {
    minHeight: 50,
    borderRadius: 18,
    backgroundColor: Theme.comfyColors.green,
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
    borderColor: Theme.comfyColors.green,
    marginTop: 12,
  },
  emptyButtonText: {
    color: Theme.comfyFontColors.green,
    fontSize: 15,
    fontWeight: "900",
  },
});
