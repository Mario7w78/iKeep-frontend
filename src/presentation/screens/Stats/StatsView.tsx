import React, { useEffect, useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme, ThemeColors } from "../../components/theme/colors";
import { ESPACIO, PESO, RADIO, TEXTO } from "../../components/theme/tokens";
import { fechaLocal } from "../../../infrastructure/api/RewardsApiService";
import { useRewardsStore } from "../../../infrastructure/store/useRewardsStore";
import { useActivityStore, useScheduleStore } from "../../../di/Dependencies";
import { moverOcurrencia } from "../../utils/moverOcurrencia";
import { LifeFlower } from "../../components/organisms/Rewards/LifeFlower";
import { RachaHero } from "../../components/molecules/Rewards/RachaHero";
import { CarryOverInline } from "../../components/molecules/Rewards/CarryOverInline";
import { useTipoSapo } from "../Home/hooks/useTipoSapo";

/**
 * Lo que llevas hecho.
 *
 * Era un placeholder de 49 líneas que ni siquiera estaba en las pestañas:
 * decía "tus métricas aparecerán aquí" desde hacía meses. La pantalla es hoy
 * un hito a la Duolingo: el héroe de la racha con la mascota celebrando y la
 * barra hacia el siguiente COMPONENTE CRÍTICO, las reprogramaciones
 * pendientes como tarjeta integrada, el progreso del día y, abajo, la
 * cuadrícula de los últimos diez semanas y la flor del equilibrio.
 *
 * Muestra lo que el usuario hizo, nunca lo que dejó de hacer —la racha rota
 * ya se siente sola, no hace falta un gráfico que la subraye.
 */

/** Cuántos días atrás dibuja la cuadrícula. Diez semanas entran en pantalla. */
const DIAS = 70;

export default function StatsView() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const racha = useRewardsStore((s) => s.racha);
  const progreso = useRewardsStore((s) => s.progreso);
  const diasCompletados = useRewardsStore((s) => s.diasCompletados);
  const cargar = useRewardsStore((s) => s.cargar);
  const flor = useRewardsStore((s) => s.flor);
  const cargarFlor = useRewardsStore((s) => s.cargarFlor);
  const pendientesPasados = useRewardsStore((s) => s.pendientesPasados);
  const marcarPasado = useRewardsStore((s) => s.marcarPasado);
  const { tipoSapo } = useTipoSapo();

  useEffect(() => {
    cargar();
    cargarFlor();
    // Reprogramar desde acá necesita saber si la actividad es a hora fija y
    // con qué choca el día destino, igual que el mazo y el mes.
    useActivityStore.getState().loadActivities();
    useScheduleStore.getState().loadSchedule();
  }, [cargar, cargarFlor]);

  const hechos = useMemo(() => new Set(diasCompletados), [diasCompletados]);

  /** Los últimos DIAS días, del más viejo al de hoy. */
  const cuadricula = useMemo(() => {
    const hoy = new Date();
    return Array.from({ length: DIAS }, (_, i) => {
      const d = new Date(hoy);
      d.setDate(hoy.getDate() - (DIAS - 1 - i));
      const clave = fechaLocal(d);
      return { clave, hecho: hechos.has(clave) };
    });
  }, [hechos]);

  const totalDias = hechos.size;

  /** Cuánto del día queda (0..1), para el anillo de la llama en riesgo. */
  const restaDelDia = useMemo(() => {
    const ahora = new Date();
    const minutos = ahora.getHours() * 60 + ahora.getMinutes();
    return 1 - minutos / 1440;
  }, []);

  const reprogramarPasado = async (activityId: string, fecha: string, nuevaFecha: string) => {
    await moverOcurrencia(activityId, fecha, nuevaFecha);
    await cargar();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.titulo}>Tu progreso</Text>

        {racha.actual > 0 ? (
          <RachaHero
            actual={racha.actual}
            mejor={racha.mejor}
            enRiesgo={racha.enRiesgo}
            hechos={diasCompletados}
            tipoSapo={tipoSapo}
            restaDelDia={racha.enRiesgo ? restaDelDia : undefined}
          />
        ) : (
          <View style={styles.rachaVacia} testID="racha-duolingo">
            <Ionicons name="flame-outline" size={32} color={colors.warning} />
            <Text style={styles.rachaVaciaTexto}>
              Tu racha se apagó. Hoy se enciende una nueva.
            </Text>
          </View>
        )}

        <CarryOverInline
          pendientes={pendientesPasados}
          onMarcar={async (activityId, fecha, hecha) => {
            await marcarPasado(activityId, fecha, hecha);
            await cargar();
          }}
          onReprogramar={reprogramarPasado}
        />

        <View style={styles.progresoDia} testID="progreso-dia">
          <View style={styles.progresoEncabezado}>
            <View style={styles.progresoIzquierda}>
              <Ionicons name="checkmark-circle" size={14} color={colors.accent} />
              <Text style={styles.progresoTitulo}>Progreso del día</Text>
            </View>
            <Text style={styles.progresoContador}>
              {progreso.completadas} de {progreso.total}
            </Text>
          </View>
          <View style={styles.carrilProgreso}>
            <View
              style={[styles.rellenoProgreso, { width: `${Math.round(progreso.fraccion * 100)}%` }]}
            />
          </View>
          <View style={styles.progresoPie}>
            <Ionicons name="leaf-outline" size={12} color={colors.textSecondary} />
            <Text style={styles.progresoPieTexto}>
              {totalDias === 1 ? "1 día con algo hecho" : `${totalDias} días con algo hecho`}
            </Text>
          </View>
        </View>

        {/* Va arriba de la cuadrícula a propósito: la cuadrícula dice
            cuánto, y los pétalos dicen de qué. La segunda pregunta es la que
            ninguna racha puede responder. */}
        {flor && <LifeFlower flor={flor} />}

        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Últimas 10 semanas</Text>
          <View style={styles.cuadricula}>
            {cuadricula.map((d) => (
              <View
                key={d.clave}
                testID={d.hecho ? "dia-hecho" : "dia-vacio"}
                style={[styles.celda, d.hecho && styles.celdaHecha]}
              />
            ))}
          </View>
          <Text style={styles.pie}>
            Cada cuadrito es un día. Los encendidos son los que hiciste algo.
          </Text>
        </View>

        {totalDias === 0 && (
          <View style={styles.vacio}>
            <Ionicons name="leaf-outline" size={32} color={colors.textSecondary} />
            <Text style={styles.vacioTexto}>
              Marca una actividad como hecha y esto empieza a llenarse.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.screenBackground,
    },
    content: {
      padding: ESPACIO.xl,
      gap: ESPACIO.lg,
    },
    titulo: {
      fontSize: TEXTO.display,
      fontWeight: PESO.maximo,
      color: colors.surface,
      marginBottom: -ESPACIO.xs,
    },
    rachaVacia: {
      alignItems: "center",
      gap: ESPACIO.sm,
      padding: ESPACIO.xxl,
      borderRadius: RADIO.xl,
      backgroundColor: colors.cardBackground,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    rachaVaciaTexto: {
      fontSize: TEXTO.pie,
      color: colors.textSecondary,
      textAlign: "center",
    },
    progresoDia: {
      gap: ESPACIO.sm - 2,
      padding: ESPACIO.lg,
      borderRadius: RADIO.lg,
      backgroundColor: colors.cardBackground,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    progresoEncabezado: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    progresoIzquierda: {
      flexDirection: "row",
      alignItems: "center",
      gap: ESPACIO.xs,
    },
    progresoTitulo: {
      fontSize: TEXTO.pie,
      fontWeight: PESO.fuerte,
      color: colors.surface,
    },
    progresoContador: {
      fontSize: TEXTO.pie,
      fontWeight: PESO.maximo,
      color: colors.accent,
    },
    carrilProgreso: {
      height: 8,
      borderRadius: RADIO.pill,
      backgroundColor: colors.cardBorder,
      overflow: "hidden",
    },
    rellenoProgreso: {
      height: "100%",
      borderRadius: RADIO.pill,
      backgroundColor: colors.accent,
    },
    progresoPie: {
      flexDirection: "row",
      alignItems: "center",
      gap: ESPACIO.xs,
    },
    progresoPieTexto: {
      fontSize: TEXTO.micro,
      color: colors.textSecondary,
    },
    seccion: {
      gap: ESPACIO.md,
      padding: ESPACIO.lg,
      borderRadius: RADIO.lg,
      backgroundColor: colors.cardBackground,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    seccionTitulo: {
      fontSize: TEXTO.cuerpo,
      fontWeight: PESO.fuerte,
      color: colors.surface,
    },
    cuadricula: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 5,
    },
    celda: {
      width: 20,
      height: 20,
      borderRadius: RADIO.sm - 2,
      backgroundColor: colors.cardBorder,
    },
    celdaHecha: {
      backgroundColor: colors.accent,
    },
    pie: {
      fontSize: TEXTO.micro,
      color: colors.textSecondary,
    },
    vacio: {
      alignItems: "center",
      gap: ESPACIO.sm,
      paddingVertical: ESPACIO.xxl,
    },
    vacioTexto: {
      fontSize: TEXTO.pie,
      color: colors.textSecondary,
      textAlign: "center",
    },
  });