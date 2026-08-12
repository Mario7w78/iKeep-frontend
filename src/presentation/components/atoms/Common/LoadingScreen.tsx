import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { ThemeColors, useTheme } from '../../theme/colors';
import { ESPACIO, PESO, TEXTO } from '../../theme/tokens';

interface Props {
  mensaje?: string;
}

/**
 * Mientras los datos vienen en camino.
 *
 * Existe porque las pantallas mostraban su estado vacío durante la carga: al
 * abrir la app aparecía "No hay actividades / Crea tu primera actividad", que
 * para quien tiene veinte creadas se lee como que se le borraron. Con el
 * backend dormido eso dura hasta un minuto.
 *
 * Un estado vacío es una afirmación sobre los datos —"no hay ninguno"— y
 * mientras no llegaron, esa afirmación no se puede hacer.
 */
export const LoadingScreen: React.FC<Props> = ({ mensaje = 'Cargando tus actividades...' }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.contenedor} testID="loading-screen">
      <ActivityIndicator size="large" color={colors.secondaryAccent} />
      <Text style={styles.texto}>{mensaje}</Text>
      {/* El aviso del arranque en frío es deliberadamente discreto: no es un
          error, pero sin él un minuto de espera parece que la app se colgó. */}
      <Text style={styles.nota}>La primera carga del día puede tardar un poco.</Text>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    contenedor: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: ESPACIO.md,
      paddingHorizontal: ESPACIO.xxxl,
      backgroundColor: colors.screenBackground,
    },
    texto: {
      fontSize: TEXTO.cuerpo,
      fontWeight: PESO.fuerte,
      color: colors.surface,
      textAlign: 'center',
    },
    nota: {
      fontSize: TEXTO.pie,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });
