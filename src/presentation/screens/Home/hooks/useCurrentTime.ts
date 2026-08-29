import { useState, useEffect } from "react";

/**
 * Hook que provee la hora actual actualizada cada 10 segundos.
 * Útil para timers y cálculos de tiempo restante sin depender de
 * re-renders del componente padre.
 */
export const useCurrentTime = (): Date => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 10_000);

    return () => clearInterval(interval);
  }, []);

  return currentTime;
};