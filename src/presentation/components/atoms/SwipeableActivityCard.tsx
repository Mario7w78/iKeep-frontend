import React, { useMemo, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme/colors";

export interface SwipeAction {
  key: string;
  label: string;
  icono: React.ComponentProps<typeof Ionicons>["name"];
  color: string;
  onPress: () => void;
}

export interface SwipeableActivityCardProps {
  children: React.ReactNode;
  actions: SwipeAction[];
  onPress?: () => void;
  disabled?: boolean;
}

const ACTION_WIDTH = 78;

/**
 * Card deslizable reutilizable que revela acciones a la derecha al
 * deslizar hacia la izquierda (tipo iOS mail).
 *
 * Se usa en ManageActivitiesView (Editar + Eliminar) y en
 * ScheduleTimeline (Editar + Ver detalle).
 */
export const SwipeableActivityCard: React.FC<SwipeableActivityCardProps> = ({
  children,
  actions,
  onPress,
  disabled = false,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const swipeableRef = useRef<Swipeable>(null);

  const renderRightActions = () => (
    <View style={styles.actionsRow}>
      {actions.map((action) => (
        <TouchableOpacity
          key={action.key}
          style={[styles.actionButton, { backgroundColor: action.color }]}
          activeOpacity={0.8}
          onPress={() => {
            swipeableRef.current?.close();
            action.onPress();
          }}
        >
          <Ionicons
            name={action.icono}
            size={20}
            color={colors.screenBackground}
          />
          <Text style={styles.actionLabel}>{action.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const Wrapper: React.ElementType = onPress && !disabled ? TouchableOpacity : View;

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      overshootRight={false}
      friction={2}
    >
      <Wrapper
        {...(onPress && !disabled ? { onPress, activeOpacity: 0.75 } : {})}
        disabled={disabled}
        style={styles.card}
      >
        {children}
      </Wrapper>
    </Swipeable>
  );
};

function createStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    actionsRow: {
      flexDirection: "row",
      alignItems: "stretch",
      borderRadius: 14,
      overflow: "hidden",
    },
    actionButton: {
      width: ACTION_WIDTH,
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
    },
    actionLabel: {
      color: colors.screenBackground,
      fontSize: 12,
      fontWeight: "800",
    },
    card: {
      backgroundColor: colors.cardBackground,
      borderColor: colors.cardBorder,
      borderWidth: 1,
      borderRadius: 14,
      padding: 16,
    },
  });
}
