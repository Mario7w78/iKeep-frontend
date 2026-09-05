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
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '../../components/theme/colors';
import { PrimaryButton } from '../../components/atoms/Common/PrimaryButton';
import { useAuthStore } from '../../../infrastructure/store/useAuthStore';
import { AuthStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignUp'>;

export default function SignUpView({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const signUp = useAuthStore((s) => s.signUp);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setInfo(null);
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setIsSubmitting(true);
    const { error: authError, requireConfirmation } = await signUp(email.trim(), password);
    setIsSubmitting(false);
    if (authError) {
      setError(authError);
      return;
    }
    if (requireConfirmation) {
      // Confirmación por email habilitada: Supabase acaba de mandar el enlace a
      // lotus://confirmar-email. El aviso es notable (#6) para que el usuario
      // sepa que hay un paso más antes de poder entrar.
      setInfo(
        'Revisa tu correo y toca el enlace de confirmación. Volverás automáticamente a la app para continuar.'
      );
      return;
    }
    setInfo('Cuenta creada. Ya puedes iniciar sesión.');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.topBar}>
          <TouchableOpacity
            testID="back-to-login"
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel="Volver a iniciar sesión"
          >
            <Ionicons name="arrow-back" size={24} color={colors.surface} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Crear cuenta</Text>

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
            placeholder="Contraseña (mínimo 6 caracteres)"
            placeholderTextColor={colors.textTertiary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password-new"
          />
          <TextInput
            style={styles.input}
            placeholder="Repetir contraseña"
            placeholderTextColor={colors.textTertiary}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoComplete="password-new"
          />

          {error && <Text style={styles.error}>{error}</Text>}
          {info && (
            <View style={styles.infoCard} testID="aviso-confirmacion">
              <Ionicons name="mail" size={26} color={colors.accentText} />
              <Text style={styles.infoCardText}>{info}</Text>
            </View>
          )}

          <PrimaryButton
            title={isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
            onPress={handleSubmit}
            style={styles.button}
          />

          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.link}>¿Ya tienes cuenta? Inicia sesión</Text>
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
    topBar: {
      position: 'absolute',
      top: 8,
      left: 16,
      zIndex: 10,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.cardBackground,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 24,
      gap: 12,
    },
    title: {
      fontSize: 28,
      fontWeight: '900',
      color: colors.surface,
      marginBottom: 16,
      textAlign: 'center',
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
    infoCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      backgroundColor: colors.success,
      borderRadius: 14,
      paddingVertical: 16,
      paddingHorizontal: 16,
      // Borde oscuro para que el verde resalte sobre el fondo de pantalla.
      borderWidth: 2,
      borderColor: colors.accentText,
    },
    infoCardText: {
      flex: 1,
      color: colors.accentText,
      fontSize: 16,
      fontWeight: '800',
      lineHeight: 22,
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
  });
