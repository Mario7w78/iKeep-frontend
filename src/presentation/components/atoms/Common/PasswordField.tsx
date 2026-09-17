import React, { useMemo, useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, ThemeColors } from '../../theme/colors';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  autoComplete?: React.ComponentProps<typeof TextInput>['autoComplete'];
  testID?: string;
}

/**
 * Campo de contraseña con el ojo para alternar visibilidad.
 *
 * El gesto de ver lo que se tipea evita el error de contraseña de más: quien
 * no ve lo que escribe, escribe cualquier cosa. Comparte la identidad visual
 * de los inputs de Login/SignUp pero maneja su propio estado de visibilidad.
 */
export const PasswordField = ({ value, onChangeText, placeholder, autoComplete = 'password', testID }: Props) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [mostrar, setMostrar] = useState(false);

  return (
    <View style={styles.wrapper}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
        autoComplete={autoComplete}
        secureTextEntry={!mostrar}
        testID={testID}
      />
      <TouchableOpacity
        style={styles.eye}
        onPress={() => setMostrar((v) => !v)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityRole="button"
        accessibilityLabel={mostrar ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        testID={testID ? `${testID}-ojo` : undefined}
      >
        <Ionicons
          name={mostrar ? 'eye-off-outline' : 'eye-outline'}
          size={22}
          color={colors.textSecondary}
        />
      </TouchableOpacity>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrapper: {
      position: 'relative',
    },
    input: {
      backgroundColor: colors.cardBackground,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      paddingRight: 48,
      fontSize: 16,
      color: colors.surface,
    },
    eye: {
      position: 'absolute',
      right: 8,
      top: 0,
      bottom: 0,
      justifyContent: 'center',
      paddingHorizontal: 6,
    },
  });