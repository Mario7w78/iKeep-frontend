/**
 * Helpers puros y constantes para HomeView.
 * Sin dependencias de React, testables en aislamiento.
 */

import { comfyColors } from "../../components/theme/colors";

/** Niveles de energía con sus metadatos visuales */
export const ENERGY_LEVELS_CONFIG = [
  {
    label: "Baja energía",
    color: comfyColors.yellow,
    icon: "battery-dead",
    iconColor: comfyColors.yellow,
  },
  {
    label: "Energía estable",
    color: comfyColors.green,
    icon: "battery-half",
    iconColor: comfyColors.green,
  },
  {
    label: "Alta energía",
    color: comfyColors.skyBlue,
    icon: "flash",
    iconColor: comfyColors.skyBlue,
  },
] as const;

export type EnergyLevelConfig = typeof ENERGY_LEVELS_CONFIG[number];

/** Nombres de días para display (clave = nombre corto en schedule) */
export const DAY_DISPLAY_NAMES: Record<string, string> = {
  Lunes: 'Lunes',
  Martes: 'Martes',
  Miercoles: 'Miércoles',
  Jueves: 'Jueves',
  Viernes: 'Viernes',
  Sabado: 'Sábado',
  Domingo: 'Domingo',
};

/** Formateador de fecha para el header */
export const dayFormatter = new Intl.DateTimeFormat("es-PE", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

/** Convierte "HH:MM" a minutos desde medianoche */
export const toMinutes = (time: string): number => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

/** Mapea identity a label legible */
export const getIdentityLabel = (val?: string): string => {
  switch (val) {
    case "clase": return "Clase";
    case "trabajo": return "Trabajo";
    default: return "Tarea";
  }
};

/** Formatea minutos a string legible (ej: "2h 30m", "45m") */
export const formatMinutesRemaining = (minutes: number | null): string => {
  if (minutes === null) return "--";
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
};

/** Días de historial de energía a cargar */
export const DIAS_DE_HISTORIAL = 30;

/** Genera la config de gradientes por tema */
export const makeEnergyLevels = (
  c: typeof comfyColors,
  cardBg: string,
  isLight: boolean
) => ENERGY_LEVELS_CONFIG.map((level, idx) => ({
  ...level,
  gradient: isLight
    ? [
        cardBg,
        idx === 0 ? "#FFF9E6" : idx === 1 ? "#E8F9F0" : "#EBF5FF"
      ] as const
    : [
        cardBg,
        idx === 0 ? "#4c4832" : idx === 1 ? "#2d3d33" : "#2c344d"
      ] as const,
}));