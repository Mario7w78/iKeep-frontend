import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useTheme } from '../../theme/colors';
import { RADIO } from '../../theme/tokens';
import { useGoogleCalendarStore } from '../../../../infrastructure/store/useGoogleCalendarStore';

/** Cuánto tiempo queda visible antes de esconderse solo. */
const TIEMPO_VISIBLE_MS = 8000;

/** Ventana en la que el "ya se mostró" sigue valiendo (7 días). */
const VENTANA_DESCARTA_MS = 7 * 24 * 60 * 60 * 1000;

/** Clave de AsyncStorage para el timestamp de la última vez que se mostró. */
const CLAVE_CTA_VISTO = '@google_cta_visto';

/**
 * Recordatorio discreto para conectar Google Calendar.
 *
 * Solo aparece cuando el vinculo no existe: los fallos y el flujo completo de
 * la conexion siguen viviendo en la tarjeta de Configuracion (D7), y este CTA
 * se limita a llevar al usuario ahi.
 *
 * Tras unos segundos se esconde solo y deja el registro persistente para no
 * volver a aparecer en cada visita a la pantalla. Al reconectar se borra ese
 * registro, para que una posterior desconexión vuelva a ofrecerlo.
 */
export const GoogleCalendarCta: React.FC = () => {
  const { colors, comfyColors } = useTheme();
  const styles = useMemo(() => createStyles(colors, comfyColors), [colors, comfyColors]);
  const navigation = useNavigation<any>();

  const estado = useGoogleCalendarStore((s) => s.estado);
  const [oculto, setOculto] = useState(false);

  useEffect(() => {
    if (estado === 'conectado') {
      // Al reconectar, borramos el "ya lo viste": si se desconecta de nuevo,
      // el CTA vuelve a ofrecerse.
      AsyncStorage.removeItem(CLAVE_CTA_VISTO).catch(() => {});
      return;
    }

    let activo = true;

    // Si se vio hace poco, no vuelve a mostrarse en esta visita.
    AsyncStorage.getItem(CLAVE_CTA_VISTO).then((raw) => {
      if (!activo) return;
      const visto = raw ? parseInt(raw, 10) : 0;
      if (visto && Date.now() - visto < VENTANA_DESCARTA_MS) setOculto(true);
    });

    // Se esconde solo tras un rato.
    const timer = setTimeout(() => {
      // Si mientras tanto se conectó, no hace falta guardar nada.
      if (useGoogleCalendarStore.getState().estado === 'conectado') return;
      setOculto(true);
      AsyncStorage.setItem(CLAVE_CTA_VISTO, String(Date.now())).catch(() => {});
    }, TIEMPO_VISIBLE_MS);

    return () => {
      activo = false;
      clearTimeout(timer);
    };
  }, [estado]);

  if (estado === 'conectado' || oculto) {
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
        <Text style={styles.titulo}>Sincroniza tu Google Calendar</Text>
        <Text style={styles.descripcion}>
          Importa tus eventos al calendario mensual. Conecta una vez desde
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