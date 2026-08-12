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

type Props = NativeStackScreenProps<AuthStackParamList, 'SignUp'>;

export default function SignUpView({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const signUp = useAuthStore((s) => s.signUp);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    setIsSubmitting(true);
    const { error: authError } = await signUp(email.trim(), password);
    setIsSubmitting(false);
    if (authError) {
      setError(authError);
      return;
    }
    setInfo('Cuenta creada. Si tu proyecto requiere confirmación por email, revisá tu correo antes de ingresar.');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
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

          {error && <Text style={styles.error}>{error}</Text>}
          {info && <Text style={styles.info}>{info}</Text>}

          <PrimaryButton
            title={isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
            onPress={handleSubmit}
            style={styles.button}
          />

          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.link}>¿Ya tenés cuenta? Iniciá sesión</Text>
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
    info: {
      color: colors.textSecondary,
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
  });
