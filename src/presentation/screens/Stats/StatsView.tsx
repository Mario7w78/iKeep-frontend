import React, { useEffect, useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme, ThemeColors } from "../../components/theme/colors";
import { ESPACIO, PESO, RADIO, TEXTO } from "../../components/theme/tokens";
import { fechaLocal } from "../../../infrastructure/api/RewardsApiService";
import { useRewardsStore } from "../../../infrastructure/store/useRewardsStore";

/**
 * Lo que llevas hecho.
 *
 * Era un placeholder de 49 líneas que ni siquiera estaba en las pestañas:
 * decía "tus métricas aparecerán aquí" desde hacía meses. Ahora que existe el
 * evento de completar, hay algo real que mostrar.
 *
 * Solo muestra lo que el usuario hizo, nunca lo que dejó de hacer. Una app de
 * estudio que te recuerda tus huecos es una que se cierra: la racha rota ya
 * se siente sola, no hace falta un gráfico que la subraye.
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

  useEffect(() => {
    cargar();
  }, [cargar]);

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

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.titulo}>Tu progreso</Text>

        <View style={styles.fila}>
          <Tarjeta
            styles={styles}
            icono="flame"
            color="#ff9f43"
            valor={racha.actual}
            etiqueta={racha.actual === 1 ? "día seguido" : "días seguidos"}
          />
          <Tarjeta
            styles={styles}
            icono="trophy"
            color={colors.secondaryAccent}
            valor={racha.mejor}
            etiqueta="tu mejor racha"
          />
        </View>

        <View style={styles.fila}>
          <Tarjeta
            styles={styles}
            icono="checkmark-done"
            color={colors.secondaryAccent}
            valor={totalDias}
            etiqueta={totalDias === 1 ? "día con algo hecho" : "días con algo hecho"}
          />
          <Tarjeta
            styles={styles}
            icono="today"
            color="#7EC8E3"
            valor={progreso.completadas}
            etiqueta={`de ${progreso.total} hoy`}
          />
        </View>

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

const Tarjeta: React.FC<{
  styles: ReturnType<typeof createStyles>;
  icono: string;
  color: string;
  valor: number;
  etiqueta: string;
}> = ({ styles, icono, color, valor, etiqueta }) => (
  <View style={styles.tarjeta}>
    <Ionicons name={icono as any} size={20} color={color} />
    <Text style={styles.valor}>{valor}</Text>
    <Text style={styles.etiqueta}>{etiqueta}</Text>
  </View>
);

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.screenBackground,
    },
    content: {
      padding: ESPACIO.xl,
      gap: ESPACIO.md,
    },
    titulo: {
      fontSize: TEXTO.display,
      fontWeight: PESO.maximo,
      color: colors.surface,
      marginBottom: ESPACIO.sm,
    },
    fila: {
      flexDirection: "row",
      gap: ESPACIO.md,
    },
    tarjeta: {
      flex: 1,
      gap: ESPACIO.xs,
      padding: ESPACIO.lg,
      borderRadius: RADIO.lg,
      backgroundColor: colors.cardBackground,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    valor: {
      fontSize: TEXTO.display,
      fontWeight: PESO.maximo,
      color: colors.surface,
    },
    etiqueta: {
      fontSize: TEXTO.pie,
      color: colors.textSecondary,
    },
    seccion: {
      gap: ESPACIO.md,
      padding: ESPACIO.lg,
      borderRadius: RADIO.lg,
      backgroundColor: colors.cardBackground,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      marginTop: ESPACIO.sm,
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
      backgroundColor: colors.secondaryAccent,
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
