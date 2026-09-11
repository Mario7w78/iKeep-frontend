import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';

import { useTheme } from '../../theme/colors';
import { RADIO } from '../../theme/tokens';
import { useGoogleCalendarStore } from '../../../../infrastructure/store/useGoogleCalendarStore';
import { rangoDelMes } from '../../../../infrastructure/store/useCalendarStore';
import { iniciarConexion } from '../../../../infrastructure/api/GoogleCalendarApiService';

/**
 * La seccion CALENDARIO DE GOOGLE de Configuracion.
 *
 * Todo lo que toca a Google vive aqui adentro: conectar abre el navegador
 * de consentimiento, desconectar pide confirmacion, y cualquier fallo —sin
 * servidor, sin credenciales, token revocado— se dice en esta tarjeta y en
 * NINGUNA otra parte de la app (D7).
 */

/** El backend devuelve al usuario por este deep link cuando termina el
 * consentimiento: primero Google manda el navegador al callback del backend
 * (donde se cambia el code por tokens) y el backend reenvía un 302 hacia aca.
 * Por eso el redirectUrl de la app es el deep link lotus://, no la URL https
 * de ese callback (D6). */
const REDIRECT_GOOGLE = 'lotus://google/callback';

export const GoogleCalendarSection: React.FC = () => {
  const { colors, comfyColors } = useTheme();
  const styles = useMemo(() => createStyles(colors, comfyColors), [colors, comfyColors]);

  const estado = useGoogleCalendarStore((s) => s.estado);
  const cargando = useGoogleCalendarStore((s) => s.cargando);
  const errorDeSincronizacion = useGoogleCalendarStore((s) => s.error);
  const ultimoConteo = useGoogleCalendarStore((s) => s.ultimoConteo);
  const verificarEstado = useGoogleCalendarStore((s) => s.verificarEstado);
  const confirmarConexion = useGoogleCalendarStore((s) => s.confirmarConexion);
  const cargar = useGoogleCalendarStore((s) => s.cargar);
  const desconectar = useGoogleCalendarStore((s) => s.desconectar);

  /** Error propio del flujo de conexion; distinto del de sincronizacion. */
  const [errorDeConexion, setErrorDeConexion] = useState<string | null>(null);
  const [conectando, setConectando] = useState(false);

  // Al abrir Settings se pregunta una vez si el vinculo sigue vivo: si
  // Google revoco el token mientras tanto, aparece "reconexion" sin esperar
  // a que falle una sincronizacion.
  useEffect(() => {
    verificarEstado();
  }, [verificarEstado]);

  const conectar = useCallback(async () => {
    setConectando(true);
    setErrorDeConexion(null);
    try {
      const url = await iniciarConexion();
      // El PKCE completo vive en el backend (el verifier viaja firmado en el
      // state): la app solo abre el navegador y espera. Si el deep link se
      // pierde, openAuthSessionAsync resuelve igual al cerrar el browser y
      // /estado confirma la verdad — nunca confiamos solo en el redirect.
      await WebBrowser.openAuthSessionAsync(url, REDIRECT_GOOGLE);
      const seConecto = await confirmarConexion();
      if (seConecto) {
        // La primera sincronización se dispara aca, no solo cuando se abre
        // la vista del mes: así el usuario VEE que el botón hizo algo (los
        // eventos ya están en el servidor) y el banner con el conteo llena
        // el vacío de "no pasó nada".
        const hoy = rangoDelMes(new Date());
        await cargar(hoy.desde, hoy.hasta, true);
      }
    } catch (e: any) {
      // 503 = credenciales de Google sin configurar (o cuota): mensaje
      // accionable, no un crash ni un "algo salio mal" generico.
      setErrorDeConexion(
        e?.status === 503
          ? 'El servidor aún no tiene Google Calendar configurado.'
          : 'No se pudo iniciar la conexión. Revisá tu internet.'
      );
    } finally {
      setConectando(false);
    }
  }, [iniciarConexion, confirmarConexion, cargar]);

  const pedirConfirmacionDesconectar = useCallback(() => {
    Alert.alert(
      '¿Desconectar Google Calendar?',
      'Tus eventos importados desaparecen del calendario y dejamos de sincronizar.',
      [
        { text: 'Conservar', style: 'cancel' },
        { text: 'Desconectar', style: 'destructive', onPress: () => { void desconectar(); } },
      ]
    );
  }, [desconectar]);

  const conectado = estado === 'conectado';
  const reconexion = estado === 'reconexion';
  const etiqueta = conectado ? 'Conectado' : reconexion ? 'Reconexión necesaria' : 'Sin conectar';

  return (
    <View style={styles.section} testID="google-section">
      <View style={styles.fila}>
        <Ionicons name="logo-google" size={18} color={colors.textSecondary} />
        <Text style={styles.titulo}>Calendario de Google</Text>
        <Text
          style={[styles.estado, conectado && styles.estadoOk]}
          testID="google-estado"
        >
          {etiqueta}
        </Text>
      </View>

      {(errorDeSincronizacion || errorDeConexion) && (
        <Text style={styles.error} testID="google-error">
          {errorDeConexion ?? errorDeSincronizacion}
        </Text>
      )}

      {conectado && ultimoConteo !== null && (
        <Text style={styles.nota} testID="google-banner-conteo">
          {ultimoConteo === 0
            ? 'Sincronizado: no hay eventos en los próximos días.'
            : `Se sincronizaron ${ultimoConteo} ${ultimoConteo === 1 ? 'evento' : 'eventos'} del mes.`}
        </Text>
      )}

      {reconexion && (
        <Text style={styles.nota}>
          Google revocó el acceso o la sesión venció. Volvé a conectar para seguir
          importando tus eventos.
        </Text>
      )}

      <TouchableOpacity
        testID={conectado ? 'google-desconectar' : 'google-conectar'}
        style={[
          styles.boton,
          conectado && styles.botonPeligro,
          reconexion && styles.botonAtencion,
        ]}
        activeOpacity={0.7}
        disabled={conectando || cargando}
        onPress={() => { void (conectado ? pedirConfirmacionDesconectar() : conectar()); }}
        accessibilityLabel={
          conectado ? 'Desconectar Google Calendar' : 'Conectar Google Calendar'
        }
      >
        {conectando || cargando ? (
          <>
            <ActivityIndicator size="small" color={colors.iconPrimary} />
            <Text
              style={[
                styles.botonTexto,
                conectado && styles.botonTextoPeligro,
                !conectado && styles.botonTextoOk,
              ]}
            >
              {cargando ? 'Sincronizando...' : 'Conectando...'}
            </Text>
          </>
        ) : (
          <>
            <Ionicons
              name={conectado ? 'link-outline' : 'log-in-outline'}
              size={15}
              color={conectado ? colors.error : comfyColors.green}
            />
            <Text
              style={[
                styles.botonTexto,
                conectado && styles.botonTextoPeligro,
                !conectado && styles.botonTextoOk,
              ]}
            >
              {conectado ? 'Desconectar' : reconexion ? 'Reconectar' : 'Conectar'}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

const createStyles = (
  colors: ReturnType<typeof useTheme>['colors'],
  comfyColors: ReturnType<typeof useTheme>['comfyColors'],
) =>
  StyleSheet.create({
    section: {
      backgroundColor: colors.cardBackground,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      paddingVertical: 6,
      paddingHorizontal: 16,
      gap: 10,
    },
    fila: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 12,
    },
    titulo: {
      flex: 1,
      fontSize: 16,
      fontWeight: '600',
      color: colors.surface,
    },
    estado: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    estadoOk: { color: comfyColors.green },
    error: {
      fontSize: 12,
      lineHeight: 16,
      color: colors.error,
    },
    nota: {
      fontSize: 12,
      lineHeight: 16,
      color: colors.textSecondary,
    },
    boton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 11,
      borderRadius: RADIO.pill,
      borderWidth: 1.5,
      borderColor: comfyColors.green,
      marginBottom: 10,
    },
    botonPeligro: { borderColor: colors.error },
    botonAtencion: { borderColor: comfyColors.skyBlue },
    botonTexto: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.surface,
    },
    botonTextoOk: { color: comfyColors.green },
    botonTextoPeligro: { color: colors.error },
  });
