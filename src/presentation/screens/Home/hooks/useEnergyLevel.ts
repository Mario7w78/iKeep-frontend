import { useState, useEffect, useCallback } from "react";
import { Alert } from "react-native";

import {
  saveEnergyRecord,
  makeEnergyRecord,
  getEnergyHistory,
} from "../../../../infrastructure/persistence/EnergyHistoryService";
import { EnergyRecord } from "../../../../application/ports/out/EnergyRepository";
import { Reflexion, reflexionar } from "../../../../domain/services/energyReflection";
import { DIAS_DE_HISTORIAL, ENERGY_LEVELS_CONFIG, EnergyLevelConfig } from "../HomeView.utils";

type HandleGenerateSchedule = (
  energyData?: { nivel_energia: number; historial_energia: EnergyRecord[] },
  showSuccessAlert?: boolean
) => Promise<void>;

interface UseEnergyLevelParams {
  energyLevels: (EnergyLevelConfig & { gradient: readonly [string, string] })[];
  handleGenerateSchedule: HandleGenerateSchedule;
}

interface UseEnergyLevelReturn {
  energyIndex: number;
  setEnergyIndex: React.Dispatch<React.SetStateAction<number>>;
  savedEnergyIndex: number;
  historialEnergia: EnergyRecord[];
  reflexion: Reflexion | null;
  selectedEnergy: (EnergyLevelConfig & { gradient: readonly [string, string] });
  moveEnergy: (direction: -1 | 1) => void;
  handleSaveEnergy: () => void;
}

/**
 * Hook que maneja toda la lógica del selector de nivel de energía:
 * - Estado del selector (energyIndex)
 * - Historial persistido
 * - Reflexión generada
 * - Guardado y regeneración de horario
 */
export const useEnergyLevel = ({
  energyLevels,
  handleGenerateSchedule,
}: UseEnergyLevelParams): UseEnergyLevelReturn => {
  const [energyIndex, setEnergyIndex] = useState(0);
  const [savedEnergyIndex, setSavedEnergyIndex] = useState(0);
  const [historialEnergia, setHistorialEnergia] = useState<EnergyRecord[]>([]);
  const [reflexion, setReflexion] = useState<Reflexion | null>(null);

  // Cargar historial al montar
  useEffect(() => {
    const initEnergy = async () => {
      try {
        const history = await getEnergyHistory(DIAS_DE_HISTORIAL);
        setHistorialEnergia(history);

        if (history.length > 0) {
          const latest = history[history.length - 1];
          const idx = latest.nivel - 1;
          if (idx >= 0 && idx < energyLevels.length) {
            setEnergyIndex(idx);
            setSavedEnergyIndex(idx);
          }
          setReflexion(reflexionar(latest.nivel, history));
        } else {
          setEnergyIndex(1); // Default: estable
          setSavedEnergyIndex(1);
        }
      } catch (e) {
        console.error("Error loading energy history:", e);
      }
    };
    initEnergy();
  }, [energyLevels.length]);

  const moveEnergy = useCallback((direction: -1 | 1) => {
    setEnergyIndex((current) => {
      const next = current + direction;
      if (next < 0) return energyLevels.length - 1;
      if (next >= energyLevels.length) return 0;
      return next;
    });
  }, [energyLevels.length]);

  const handleSaveEnergy = useCallback(async () => {
    const selected = energyLevels[energyIndex];
    Alert.alert(
      "Actualizar horario",
      `¿Estás seguro de que quieres actualizar tu horario para adaptarlo a un nivel de "${selected.label.toLowerCase()}"?`,
      [
        {
          text: "Cancelar",
          style: "cancel",
          onPress: () => setEnergyIndex(savedEnergyIndex),
        },
        {
          text: "Sí, actualizar",
          style: "default",
          onPress: async () => {
            setSavedEnergyIndex(energyIndex);
            try {
              const nivel = energyIndex + 1;
              await saveEnergyRecord(makeEnergyRecord(nivel));
              const historial = await getEnergyHistory(DIAS_DE_HISTORIAL);
              setHistorialEnergia(historial);
              setReflexion(reflexionar(nivel, historial));
              await handleGenerateSchedule(
                { nivel_energia: nivel, historial_energia: historial },
                true
              );
            } catch (e) {
              console.error("Error updating schedule with energy:", e);
            }
          },
        },
      ]
    );
  }, [energyIndex, savedEnergyIndex, energyLevels, handleGenerateSchedule]);

  const selectedEnergy = energyLevels[energyIndex];

  return {
    energyIndex,
    setEnergyIndex,
    savedEnergyIndex,
    historialEnergia,
    reflexion,
    selectedEnergy,
    moveEnergy,
    handleSaveEnergy,
  };
};