import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useGoogleCalendarStore } from '../../infrastructure/store/useGoogleCalendarStore';

/** Cuánto tiempo queda visible antes de esconderse solo. */
export const TIEMPO_VISIBLE_MS = 8000;

/** Ventana en la que el "ya se mostró" sigue valiendo (7 días). */
const VENTANA_DESCARTA_MS = 7 * 24 * 60 * 60 * 1000;

/** Clave compartida: mostrarlo una vez calla TODOS los avisos del calendario. */
export const CLAVE_AVISO_VISTO = '@google_cta_visto';

/**
 * Si corresponde mostrar un aviso para conectar Google Calendar.
 *
 * Es la misma regla en todos los lugares donde aparece —el Home y el
 * calendario—: se muestra solo al desconectado, se esconde solo a los pocos
 * segundos y deja registro para no volver a aparecer en una semana. Al
 * reconectar se borra el registro, así que una desconexión futura vuelve a
 * ofrecerlo.
 *
 * La clave es compartida a propósito: conectar el calendario es una sola
 * decisión, y ver el pedido repetido en dos pantallas distintas es justo lo
 * que incomoda.
 */
export function useAvisoGoogleCalendar(): boolean {
  const estado = useGoogleCalendarStore((s) => s.estado);
  const [oculto, setOculto] = useState(false);

  useEffect(() => {
    if (estado === 'conectado') {
      // Al reconectar, borramos el "ya lo viste": si se desconecta de nuevo,
      // el aviso vuelve a ofrecerse.
      AsyncStorage.removeItem(CLAVE_AVISO_VISTO).catch(() => {});
      return;
    }

    let activo = true;

    // Si se vio hace poco, no vuelve a mostrarse en esta visita.
    AsyncStorage.getItem(CLAVE_AVISO_VISTO).then((raw) => {
      if (!activo) return;
      const visto = raw ? parseInt(raw, 10) : 0;
      if (visto && Date.now() - visto < VENTANA_DESCARTA_MS) setOculto(true);
    });

    // Se esconde solo tras un rato.
    const timer = setTimeout(() => {
      // Si mientras tanto se conectó, no hace falta guardar nada.
      if (useGoogleCalendarStore.getState().estado === 'conectado') return;
      setOculto(true);
      AsyncStorage.setItem(CLAVE_AVISO_VISTO, String(Date.now())).catch(() => {});
    }, TIEMPO_VISIBLE_MS);

    return () => {
      activo = false;
      clearTimeout(timer);
    };
  }, [estado]);

  return estado !== 'conectado' && !oculto;
}
