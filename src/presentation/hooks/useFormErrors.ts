import { useCallback, useState } from 'react';

/**
 * Errores de validación asociados al campo que los provoca.
 *
 * Reemplaza a `Alert.alert`, que tenía tres problemas: tapa la pantalla justo
 * cuando el usuario necesita ver qué está mal, desaparece al tocarlo —así que
 * el mensaje se pierde y hay que reintentar para volver a leerlo— y no dice
 * dónde estaba el problema, solo lo describe.
 *
 * Un mensaje bajo el campo se queda ahí mientras el error exista y señala el
 * lugar exacto sin que el usuario tenga que buscarlo.
 */
export type CampoConError =
  | 'nombre'
  | 'dias'
  | 'horario'
  | 'duracion'
  | 'ventana'
  | 'general';

export interface FormErrors {
  errores: Partial<Record<CampoConError, string>>;
  error: (campo: CampoConError) => string | undefined;
  setError: (campo: CampoConError, mensaje: string) => void;
  limpiar: (campo: CampoConError) => void;
  limpiarTodos: () => void;
  hayErrores: boolean;
}

export function useFormErrors(): FormErrors {
  const [errores, setErrores] = useState<Partial<Record<CampoConError, string>>>({});

  const setError = useCallback((campo: CampoConError, mensaje: string) => {
    setErrores((prev) => ({ ...prev, [campo]: mensaje }));
  }, []);

  const limpiar = useCallback((campo: CampoConError) => {
    setErrores((prev) => {
      // Si no estaba, se devuelve el mismo objeto: cambiar la referencia
      // provocaria un render por cada tecla que el usuario escribe.
      if (!(campo in prev)) return prev;
      const { [campo]: _, ...resto } = prev;
      return resto;
    });
  }, []);

  const limpiarTodos = useCallback(() => setErrores({}), []);

  const error = useCallback(
    (campo: CampoConError) => errores[campo],
    [errores]
  );

  return {
    errores,
    error,
    setError,
    limpiar,
    limpiarTodos,
    hayErrores: Object.keys(errores).length > 0,
  };
}
