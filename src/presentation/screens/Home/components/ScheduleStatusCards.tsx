import React from "react";
import { View, Text, ViewStyle, TextStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../components/theme/colors";
import { Schedule } from "../../../../domain/entities/Schedule";

interface ScheduleStatusCardsProps {
  schedule: Schedule | null;
}

export const ScheduleStatusCards = ({ schedule }: ScheduleStatusCardsProps) => {
  const { colors, comfyColors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors, comfyColors), [colors]);

  return (
    <>
      {schedule?.estado === 'INFACTIBLE' && (
        <View style={[styles.card, styles.infactibleCard]}>
          <View style={styles.infactibleHeader}>
            <Ionicons name="warning-outline" size={22} color={comfyColors.yellow} />
            <Text style={styles.infactibleTitle}>Horario parcialmente generado</Text>
          </View>
          {schedule.recomendaciones.length > 0 && (
            <View style={styles.infactibleSection}>
              <Text style={styles.infactibleSectionTitle}>Recomendaciones:</Text>
              {schedule.recomendaciones.map((rec, idx) => (
                <Text key={idx} style={styles.infactibleBullet}>• {rec}</Text>
              ))}
            </View>
          )}
          {schedule.tareasOmitidas.length > 0 && (
            <View style={styles.infactibleSection}>
              <Text style={styles.infactibleSectionTitle}>
                {schedule.tareasOmitidas.length} tarea{schedule.tareasOmitidas.length > 1 ? 's' : ''} no se pudieron programar:
              </Text>
              {schedule.tareasOmitidas.map((name, idx) => (
                <Text key={idx} style={styles.infactibleBullet}>• {name}</Text>
              ))}
            </View>
          )}
        </View>
      )}

      {schedule?.estado === 'DESCONOCIDO' && (
        <View style={[styles.card, styles.desconocidoCard]}>
          <View style={styles.infactibleHeader}>
            <Ionicons name="time-outline" size={20} color={comfyColors.yellow} />
            <Text style={styles.desconocidoText}>
              El servidor no encontró respuesta a tiempo, mostrando horario base
            </Text>
          </View>
        </View>
      )}
    </>
  );
};

function createStyles(
  colors: ReturnType<typeof import("../../../components/theme/colors").useTheme>['colors'],
  comfyColors: ReturnType<typeof import("../../../components/theme/colors").useTheme>['comfyColors']
): Record<string, ViewStyle | TextStyle> {
  return {
    card: {
      backgroundColor: colors.cardBackground,
      borderColor: colors.cardBorder,
      borderWidth: 1,
      borderRadius: 14,
      paddingHorizontal: 18,
      paddingVertical: 18,
      marginBottom: 22,
    },
    infactibleCard: {
      backgroundColor: 'rgba(255, 183, 77, 0.12)',
      borderColor: comfyColors.yellow,
    },
    infactibleHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    infactibleTitle: {
      color: comfyColors.yellow,
      fontSize: 16,
      fontWeight: '900',
    },
    infactibleSection: {
      marginTop: 8,
      paddingLeft: 4,
    },
    infactibleSectionTitle: {
      color: colors.surface,
      fontSize: 13,
      fontWeight: '700',
      marginBottom: 4,
    },
    infactibleBullet: {
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 20,
      paddingLeft: 8,
    },
    desconocidoCard: {
      backgroundColor: 'rgba(255, 183, 77, 0.08)',
      borderColor: comfyColors.yellow,
      paddingVertical: 12,
    },
    desconocidoText: {
      color: comfyColors.yellow,
      fontSize: 13,
      fontWeight: '600',
      flex: 1,
    },
  };
}