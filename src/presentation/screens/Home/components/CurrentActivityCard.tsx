import React from "react";
import { View, Text, TouchableOpacity, Alert, ViewStyle, TextStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../components/theme/colors";
import { formatMinutesRemaining, areaTituloDe } from "../HomeView.utils";
import { ScheduledActivity } from "../../../../domain/entities/Schedule";
import { AreaIcon, areaColorMap } from "../../Activity/areaIcon";
import { CompleteToggle } from "../../../components/atoms/Rewards/CompleteToggle";
interface CurrentActivityCardProps {
  currentActivity: ScheduledActivity | null;
  firstNext: ScheduledActivity | null;
  freeTimeMinutes: number | null;
  todayItems: ScheduledActivity[];
  cardStatus: {
    pill: string;
    pillColor: string;
    pillText: string;
    label: string;
  };
  currentCardTitle: string;
  minutesLeft: number | null;
  completadas?: string[];
  alternarCompletada?: (id: string) => void;
  onPress: () => void;
  disabled: boolean;
}

export const CurrentActivityCard = ({
  currentActivity,
  firstNext,
  freeTimeMinutes,
  todayItems,
  cardStatus,
  currentCardTitle,
  minutesLeft,
  completadas = [],
  alternarCompletada,
  onPress,
  disabled,
}: CurrentActivityCardProps) => {
  const { colors, comfyColors, comfyFontColors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors, comfyColors, comfyFontColors), [colors]);

  const isCurrentTravel = currentActivity && (currentActivity.tipo === 'viaje' || !currentActivity.activity);

  const showCompleteToggle = !!currentActivity && !!currentActivity.activity && !!alternarCompletada;

  /**
   * Antes de marcar como hecha se confirma: la casilla es un objetivo chico y
   * fácil de tocar de paso (por eso tiene hitSlop agrandado). Desmarcar no se
   * confirma —corregir un check accidental es inocuo— y pedir confirmación en
   * los dos sentidos volvería el control molesto.
   */
  const alConfirmarToggle = () => {
    const actividad = currentActivity?.activity;
    if (!actividad || !alternarCompletada) return;
    const id = String(actividad.id);
    const yaCompletada = completadas.includes(id);
    if (yaCompletada) {
      alternarCompletada(id);
      return;
    }
    Alert.alert(
      'Marcar como hecha',
      `¿Confirmás que completaste "${actividad.title}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', onPress: () => alternarCompletada(id) },
      ]
    );
  };

  const actividad = currentActivity?.activity;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.75}
      onPress={onPress}
      disabled={disabled}
    >
      {/* Fila principal: el área es lo resaltado; el check-in, a la derecha. */}
      <View style={styles.statusRow}>
        <View style={styles.statusLeft}>
          {actividad && (
            <View style={[styles.cardIcon, { backgroundColor: areaColorMap[actividad.area] }]}>
              <AreaIcon area={actividad.area} size={20} />
            </View>
          )}
          <Text style={styles.areaTitle}>
            {actividad ? areaTituloDe(actividad.area) : currentCardTitle}
          </Text>
        </View>
        {showCompleteToggle && (
          <HechoToggle
            completada={completadas.includes(String(actividad!.id))}
            onToggle={alConfirmarToggle}
            nombre={actividad!.title}
          />
        )}
      </View>

      {/* Estado, ahora secundario: pill pequeña con su color semántico. */}
      {cardStatus.pill !== "Libre" && (
        <View style={styles.stateBadge}>
          <View style={[styles.stateDot, { backgroundColor: cardStatus.pillColor }]} />
          <Text style={styles.stateText}>{cardStatus.pill}</Text>
        </View>
      )}

      {currentActivity || firstNext ? (
        <Text style={styles.currentTitle}>{currentCardTitle}</Text>
      ) : null}

      {currentActivity ? (
        <View style={styles.timerRow}>
          <Text style={styles.timerText}>
            {formatMinutesRemaining(minutesLeft)}
          </Text>
          <Text style={styles.timerLabel}>restantes</Text>
        </View>
      ) : firstNext ? (
        <View style={styles.timerRow}>
          <Text style={[styles.timerText, { color: comfyColors.skyBlue }]}>
            {firstNext.assignedStartTime}
          </Text>
          <Text style={styles.timerLabel}>hora de inicio</Text>
        </View>
      ) : freeTimeMinutes !== null ? (
        <View style={styles.timerRow}>
          <Text style={[styles.timerText, { color: comfyColors.green }]}>
            {formatMinutesRemaining(freeTimeMinutes)}
          </Text>
          <Text style={styles.timerLabel}>
            {todayItems.length > 0 ? "hasta fin del día" : "libres hoy"}
          </Text>
        </View>
      ) : (
        <View style={styles.timerRow}>
          <Text style={[styles.timerText, { color: comfyColors.green }]}>
            Listo
          </Text>
          <Text style={styles.timerLabel}>¡Día completado!</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

/**
 * El check-in de "lo terminé", pensado para que su propósito sea evidente.
 *
 * A diferencia de la casilla desnuda, este es un botón que siempre dice
 * "Hecho": el texto elimina la ambigüedad de qué hace. Al completarse cambia
 * de borde hueco a relleno con check, de modo que el feedback es inmediato y
 * sin depender de leer un estado además del propio control.
 */
function HechoToggle({
  completada,
  onToggle,
  nombre,
}: {
  completada: boolean;
  onToggle: () => void;
  nombre?: string;
}) {
  const { colors, comfyColors, comfyFontColors } = useTheme();
  const styles = React.useMemo(
    () => createStyles(colors, comfyColors, comfyFontColors),
    [colors]
  );

  return (
    <TouchableOpacity
      style={[styles.hecho, completada && styles.hechoCompletada]}
      onPress={onToggle}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      activeOpacity={0.7}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: completada }}
      accessibilityLabel={
        nombre
          ? `${completada ? 'Desmarcar' : 'Marcar como hecha'} ${nombre}`
          : 'Marcar como hecha'
      }
    >
      <Ionicons
        name={completada ? "checkmark-circle" : "ellipse-outline"}
        size={18}
        color={completada ? comfyFontColors.green : colors.textTertiary}
      />
      <Text
        style={[styles.hechoText, completada && styles.hechoTextCompletada]}
      >
        Hecho
      </Text>
    </TouchableOpacity>
  );
}

function createStyles(
  colors: ReturnType<typeof import("../../../components/theme/colors").useTheme>['colors'],
  comfyColors: ReturnType<typeof import("../../../components/theme/colors").useTheme>['comfyColors'],
  comfyFontColors: ReturnType<typeof import("../../../components/theme/colors").useTheme>['comfyFontColors']
): Record<string, ViewStyle | TextStyle> {
  return {
    card: {
      backgroundColor: colors.cardBackground,
      borderColor: colors.cardBorder,
      borderWidth: 1,
      borderRadius: 14,
      paddingHorizontal: 18,
      paddingVertical: 18,
      marginBottom: 18,
    },
    statusRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      marginBottom: 14,
    },
    statusLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      flex: 1,
    },
    cardIcon: {
      width: 40,
      height: 40,
      borderRadius: 14,
      paddingTop: 4,
      alignItems: "center",
      justifyContent: "center",
    },
    areaTitle: {
      color: colors.surface,
      fontSize: 18,
      fontWeight: "900",
    },
    stateBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: 10,
    },
    stateDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    stateText: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    hecho: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderWidth: 1.5,
      borderColor: colors.cardBorder,
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 8,
      backgroundColor: colors.cardBackground,
    },
    hechoCompletada: {
      borderColor: comfyColors.green,
      backgroundColor: comfyColors.green,
    },
    hechoText: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: "800",
    },
    hechoTextCompletada: {
      color: comfyFontColors.green,
    },
    currentTitle: {
      color: colors.surface,
      fontSize: 20,
      fontWeight: "800",
      marginBottom: 12,
    },
    timerRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 8,
    },
    timerText: {
      color: comfyColors.green,
      fontSize: 42,
      lineHeight: 48,
      fontWeight: "900",
    },
    timerLabel: {
      color: colors.textTertiary,
      fontSize: 17,
      fontWeight: "700",
      marginBottom: 7,
    },
  };
}