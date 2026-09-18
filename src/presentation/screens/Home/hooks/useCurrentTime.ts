import { useState, useEffect } from "react";
import { AppState } from "react-native";

/**
 * Hook que provee la hora actual actualizada cada 10 segundos.
 * Útil para timers y cálculos de tiempo restante sin depender de
 * re-renders del componente padre.
 *
 * Cuando la app pasa a primer plano se recalcula al instante: los timers se
 * pausan en background y al volver tras un día entero quedarían desfasados
 * hasta el siguiente tick.
 */
export const useCurrentTime = (): Date => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 10_000);

    const sub = AppState.addEventListener("change", (estado) => {
      if (estado === "active") {
        setCurrentTime(new Date());
      }
    });

    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, []);

  return currentTime;
};