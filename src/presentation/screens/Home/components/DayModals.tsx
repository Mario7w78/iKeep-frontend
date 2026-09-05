import React from "react";
import { Celebration } from "../../../components/atoms/Rewards/Celebration";
import { FocusSession } from "../../../components/organisms/Focus/FocusSession";
import { DayClose } from "../../../components/organisms/Rewards/DayClose";
import { DayRecap } from "../../../components/organisms/Rewards/DayRecap";
import { RespuestaDeCierre, Racha } from "../../../../infrastructure/api/RewardsApiService";
import { AreaDeVida } from "../../../../domain/entities/lifeArea";
import { Pendiente } from "../../../../domain/services/pendingAnswers";
import { ScheduledActivity } from "../../../../domain/entities/Schedule";
import { EnergyLevelConfig } from "../HomeView.utils";

interface DayModalsProps {
  diasTerminados: number;
  racha: Racha;
  progreso: { 
    completadas: number; 
    total: number; 
    fraccion: number; 
    terminado: boolean;
    completadosIds: string[];
    noHechasIds: string[];
  };
  sesion: any;
  guardandoSesion: boolean;
  todayItems: ScheduledActivity[];
  onSalir: () => void;
  onDescartar: () => void;
  onTerminar: () => Promise<void>;
  ofrecerCierre: boolean;
  sinResolver: Pendiente[];
  cerrandoDia: boolean;
  setCerrandoDia: (value: boolean) => void;
  setDiaCerrado: (value: string) => void;
  cerrar: (respuesta: RespuestaDeCierre, hechas?: string[], fecha?: string) => Promise<void>;
  recapPendiente: boolean;
  diaCerrado: string | null;
  setRecapPendiente: (value: boolean) => void;
  respuestaDelCierre: RespuestaDeCierre | null;
  setRespuestaDelCierre: (value: RespuestaDeCierre | null) => void;
  areaDelDia: AreaDeVida | null;
  /** Hora de inicio del día (minutos desde medianoche) para mostrar en el resumen. */
  startHour: number;
  /** Energía seleccionada del día para el resumen de Sapo. */
  selectedEnergy: EnergyLevelConfig;
}

export const DayModals = ({
  diasTerminados,
  racha,
  progreso,
  sesion,
  guardandoSesion,
  todayItems,
  onSalir,
  onDescartar,
  onTerminar,
  ofrecerCierre,
  sinResolver,
  cerrandoDia,
  setCerrandoDia,
  setDiaCerrado,
  cerrar,
  recapPendiente,
  diaCerrado,
  setRecapPendiente,
  respuestaDelCierre,
  setRespuestaDelCierre,
  areaDelDia,
startHour,
  selectedEnergy,
}: DayModalsProps) => {
  const hoyISO = new Date().toISOString().split('T')[0];
  const rachaNueva = racha.actual > 1 && progreso.terminado;

  return (
    <>
      <Celebration
        key={diasTerminados}
        disparo={diasTerminados}
        mensaje={rachaNueva ? `¡${racha.actual} días seguidos!` : undefined}
      />

      <FocusSession
        sesion={sesion}
        titulo={
          todayItems.find((i) => i.activity?.id === sesion?.activityId)?.activity
            ?.title ?? 'Sesión'
        }
        guardando={guardandoSesion}
        onSalir={onSalir}
        onDescartar={onDescartar}
        onTerminar={onTerminar}
      />

      <DayClose
        visible={ofrecerCierre}
        pendientes={sinResolver}
        guardando={cerrandoDia}
        onCerrar={() => setDiaCerrado(hoyISO)}
        onResponder={async (respuesta, hechas) => {
          setDiaCerrado(hoyISO);
          setCerrandoDia(true);
          try {
            await cerrar(respuesta, hechas, hoyISO);
            setRespuestaDelCierre(respuesta);
            setRecapPendiente(true);
          } catch {
            // El store ya revirtio y avisa por consola
          } finally {
            setCerrandoDia(false);
          }
        }}
      />

      <DayRecap
        visible={recapPendiente && diaCerrado === hoyISO}
        progreso={progreso}
        racha={racha}
        areaDestacada={areaDelDia}
        respuestaCierre={respuestaDelCierre ?? 'algunas'}
        onDismiss={() => setRecapPendiente(false)}
        startHour={startHour}
        selectedEnergy={selectedEnergy}
      />
    </>
  );
};