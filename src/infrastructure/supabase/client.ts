import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // No se lanza un error acá: este módulo se importa transitivamente desde
  // Dependencies.ts, que a su vez importan pantallas cubiertas por tests
  // unitarios (sin .env real). Cualquier llamada real a Supabase sin
  // credenciales fallará igual, con un error de red/auth claro en runtime.
  console.warn(
    'Faltan EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY. Definilas en un archivo .env en la raíz de ikeep-app.'
  );
}

export const supabase = createClient(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'placeholder-anon-key',
  {
    auth: {
      storage: AsyncStorage, // persiste la sesión (el token, no los datos de negocio)
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
