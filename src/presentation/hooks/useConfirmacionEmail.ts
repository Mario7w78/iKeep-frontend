import { useEffect } from 'react';
import * as Linking from 'expo-linking';
import { useAuthStore } from '../../infrastructure/store/useAuthStore';

/**
 * El path del deep link de confirmación (la parte después del scheme `lotus://`).
 * Lo mantenemos como constante para comparar sin desarmar la URL entera.
 */
const RUTA_CONFIRMAR = 'confirmar-email';

/**
 * Registra la escucha de deep links y confirma el email cuando llega el enlace
 * de confirmación de Supabase.
 *
 * Flujo: la app pide signUp con emailRedirectTo = lotus://confirmar-email.
 * Supabase manda el correo con un enlace que apunta a ese deep link. Al tocarlo,
 * la app se abre (o pasa a foreground) y este hook recibe la URL, extrae el
 * token/código y llama a supabase.auth.verifyOtp para completar la sesión.
 *
 * Se monta una sola vez en App.tsx, en la raíz, para que escuche siempre.
 */
export function useConfirmacionEmail() {
  const confirmarEmail = useAuthStore((s) => s.confirmarEmail);

  useEffect(() => {
    // middleware que decide si una URL es la de confirmación y, de ser así,
    // la confirma.
    const procesarUrl = async (url: string) => {
      // LOG TEMPORAL: para diagnóstico del TODO #7. Captura la URL exacta que
      // llega a la app por el deep link. Eliminar cuando se confirme el flujo.
      console.log('[useConfirmacionEmail] URL recibida por deep link:', url);

      const { hostname, queryParams } = Linking.parse(url);
      console.log('[useConfirmacionEmail] hostname:', hostname, 'queryParams:', JSON.stringify(queryParams));
      if (hostname !== RUTA_CONFIRMAR) return;

      // Supabase manda el credencial como `token` (flujo de confirmación de
      // email) o como `code` (flujo PKCE). Cubrimos ambos.
      const credencial = String(queryParams?.token ?? queryParams?.code ?? '');
      if (!credencial) return;

      const { error } = await confirmarEmail(credencial);
      // El resultado de la confirmación (sesión creada o error) ya lo maneja el
      // store de auth: onAuthStateChange actualiza `session` y la UI reacciona.
      // En este hook solo nos interesa registrar que el flujo terminó.
      if (error) {
        // Si falla, no rompemos en silencio: se deja registro para debugging.
        // El usuario podría tener el email pendiente aún y reintentar.
        // TODO: exponer este error a la UI (banner/toast) cuando exista.
        console.warn('[useConfirmacionEmail] No se pudo confirmar el email:', error);
      }
    };

    // URL inicial: la app arrancó porque el usuario tocó el enlace.
    Linking.getInitialURL().then((url) => {
      if (url) void procesarUrl(url);
    });

    // URLs entrantes mientras la app ya está abierta (se reabre o se trae a
    // foreground con el enlace).
    const sub = Linking.addEventListener('url', ({ url }) => {
      void procesarUrl(url);
    });

    return () => sub.remove();
  }, [confirmarEmail]);
}
