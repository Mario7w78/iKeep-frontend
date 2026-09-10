import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '../../components/theme/colors';
import { PrimaryButton } from '../../components/atoms/Common/PrimaryButton';
import { useAuthStore } from '../../../infrastructure/store/useAuthStore';
import { AuthStackParamList } from '../../navigation/AppNavigator';
import { LotusFlower } from '../../components/atoms/Lotus/LotusFlower';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginView({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const signInWithPassword = useAuthStore((s) => s.signInWithPassword);
  const recienteConfirmadoEmail = useAuthStore((s) => s.recienteConfirmadoEmail);
  const limpiarRecienteConfirmado = useAuthStore((s) => s.limpiarRecienteConfirmado);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);
    const { error: authError } = await signInWithPassword(email.trim(), password);
    setIsSubmitting(false);
    if (authError) {
      setError(authError);
      return;
    }
    // El usuario ya entró: el aviso de "correo confirmado" cumplió su función.
    limpiarRecienteConfirmado();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <LotusFlower size={120} style={styles.flor} />
            <Text style={styles.wordmark} testID="wordmark">Lotus</Text>
            <Text style={styles.title}>Iniciar sesión</Text>
            <Text style={styles.subtitle}>
              Qué bueno verte de nuevo. El loto siempre te espera.
            </Text>
          </View>

          {recienteConfirmadoEmail && (
            <View style={styles.confirmadoCard} testID="correo-confirmado">
              <Ionicons name="checkmark-circle" size={24} color={colors.accentText} />
              <Text style={styles.confirmadoCardText}>
                ¡Correo confirmado! Ya puedes iniciar sesión.
              </Text>
            </View>
          )}

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={colors.textTertiary}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
          <TextInput
            style={styles.input}
            placeholder="Contraseña"
            placeholderTextColor={colors.textTertiary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <PrimaryButton
            title={isSubmitting ? 'Ingresando...' : 'Ingresar'}
            onPress={handleSubmit}
            style={styles.button}
          />

          <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
            <Text style={styles.link}>¿No tienes cuenta? Regístrate</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.screenBackground },
    flex: { flex: 1 },
    content: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 24,
      gap: 16,
    },
    header: {
      alignItems: 'center',
      marginBottom: 8,
      gap: 6,
    },
    flor: {
      marginBottom: 8,
    },
    wordmark: {
      fontSize: 18,
      fontWeight: '900',
      letterSpacing: 4,
      textTransform: 'uppercase',
      color: colors.accent,
    },
    title: {
      fontSize: 26,
      fontWeight: '900',
      color: colors.surface,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 15,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 21,
    },
    input: {
      backgroundColor: colors.cardBackground,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
      color: colors.surface,
    },
    error: {
      color: colors.error,
      fontSize: 14,
      textAlign: 'center',
    },
    button: {
      alignSelf: 'center',
      width: '100%',
      marginTop: 12,
    },
    link: {
      color: colors.textSecondary,
      fontSize: 14,
      textAlign: 'center',
      marginTop: 16,
    },
    confirmadoCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: colors.success,
      borderRadius: 14,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderWidth: 2,
      borderColor: colors.accentText,
    },
    confirmadoCardText: {
      flex: 1,
      color: colors.accentText,
      fontSize: 15,
      fontWeight: '700',
      lineHeight: 20,
    },
  });
