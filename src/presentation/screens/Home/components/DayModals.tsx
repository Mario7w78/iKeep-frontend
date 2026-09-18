import React from "react";
import { Alert } from "react-native";
import { Celebration } from "../../../components/atoms/Rewards/Celebration";
import { FocusSession } from "../../../components/organisms/Focus/FocusSession";
import { DayClose } from "../../../components/organisms/Rewards/DayClose";
import { DayRecap } from "../../../components/organisms/Rewards/DayRecap";
import {
  RespuestaDeCierre,
  Racha,
  fechaLocal,
} from "../../../../infrastructure/api/RewardsApiService";
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
  /** "Hice algunas": el mazo verifica y cierra el día. */
  onAlgunas: () => void;
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
  diasCompletados: string[];
  /** Qué artboard de la mascota toca según la racha (`useTipoSapo`). */
  tipoSapo?: 0 | 1 | 2;
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
  onAlgunas,
  recapPendiente,
  diaCerrado,
  setRecapPendiente,
  respuestaDelCierre,
  setRespuestaDelCierre,
  areaDelDia,
startHour,
  selectedEnergy,
  diasCompletados,
  tipoSapo,
}: DayModalsProps) => {
  // El dia del usuario, no el del servidor: `toISOString()` normaliza a UTC,
  // y en Lima despues de las 19:00 ya devolveria el dia siguiente, que el
  // backend rechaza como fecha futura. Antes eso hacia que "hice todo" no
  // hiciera nada: el cierre fallaba con 422 y el error se tragaba en silencio.
  const hoyISO = fechaLocal();
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
        onResponder={async (respuesta) => {
          setCerrandoDia(true);
          try {
            await cerrar(respuesta, [], hoyISO);
            setDiaCerrado(hoyISO);
            setRespuestaDelCierre(respuesta);
            setRecapPendiente(true);
          } catch (error) {
            console.error('No se pudo cerrar el día:', error);
            Alert.alert(
              'No pudimos cerrar el día',
              'Revisá tu conexión y volvé a intentarlo.',
              [{ text: 'Entendido' }],
            );
          } finally {
            setCerrandoDia(false);
          }
        }}
        onVerificar={onAlgunas}
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
        diasCompletados={diasCompletados}
        tipoSapo={tipoSapo}
      />
    </>
  );
};