import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { useTheme } from '../../theme/colors';
import { RADIO } from '../../theme/tokens';
import { useGoogleCalendarStore } from '../../../../infrastructure/store/useGoogleCalendarStore';

/**
 * Recordatorio discreto para conectar Google Calendar.
 *
 * Solo aparece cuando el vinculo no existe: los fallos y el flujo completo de
 * la conexion siguen viviendo en la tarjeta de Configuracion (D7), y este CTA
 * se limita a llevar al usuario ahi.
 */
export const GoogleCalendarCta: React.FC = () => {
  const { colors, comfyColors } = useTheme();
  const styles = useMemo(() => createStyles(colors, comfyColors), [colors, comfyColors]);
  const navigation = useNavigation<any>();

  const estado = useGoogleCalendarStore((s) => s.estado);

  if (estado === 'conectado') {
    return null;
  }

  return (
    <TouchableOpacity
      style={styles.cta}
      activeOpacity={0.7}
      testID="google-cta"
      accessibilityLabel="Conectar Google Calendar en Configuración"
      onPress={() => navigation.navigate('Setting')}
    >
      <View style={styles.icono}>
        <Ionicons name="logo-google" size={18} color={comfyColors.green} />
      </View>
      <View style={styles.texto}>
        <Text style={styles.titulo}>Sincronizá tu Google Calendar</Text>
        <Text style={styles.descripcion}>
          Importa tus eventos al calendario mensual. Conectá una vez desde
          Configuración.
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
    </TouchableOpacity>
  );
};

const createStyles = (
  colors: ReturnType<typeof useTheme>['colors'],
  comfyColors: ReturnType<typeof useTheme>['comfyColors'],
) =>
  StyleSheet.create({
    cta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: colors.cardBackground,
      borderRadius: RADIO.lg,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      paddingVertical: 12,
      paddingHorizontal: 14,
    },
    icono: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(141, 255, 104, 0.12)',
    },
    texto: {
      flex: 1,
      gap: 2,
    },
    titulo: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.surface,
    },
    descripcion: {
      fontSize: 12,
      lineHeight: 16,
      color: colors.textSecondary,
    },
  });