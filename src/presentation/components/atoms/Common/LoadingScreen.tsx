import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useTipoSapo } from '../../../screens/Home/hooks/useTipoSapo';
import { ThemeColors, useTheme } from '../../theme/colors';
import { ESPACIO, PESO, TEXTO } from '../../theme/tokens';
import { MascotLoading } from '../Mascot/MascotLoading';

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
  const { etapa } = useTipoSapo();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.contenedor} testID="loading-screen">
      <MascotLoading etapa={etapa} width={WIDTH_MASCOTA} />
      <Text style={styles.texto}>{mensaje}</Text>
      {/* La mascota es estática: sin la rueda una carga larga parece app
          congelada. Toma el acento de marca y no bloquea el mensaje. */}
      <ActivityIndicator size="large" color={colors.accent} />
      {/* El aviso del arranque en frío es deliberadamente discreto: no es un
          error, pero sin él un minuto de espera parece que la app se colgó. */}
      <Text style={styles.nota}>La primera carga del día puede tardar un poco.</Text>
    </View>
  );
};

/** La mascota se ve junto al mensaje. */
const WIDTH_MASCOTA = 200;

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
