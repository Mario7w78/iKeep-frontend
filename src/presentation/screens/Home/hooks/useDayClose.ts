import { useState, useMemo } from "react";

import { correspondeOfrecerCierre } from "../../../../domain/services/dayCloseTiming";
import { sinResponder } from "../../../../domain/services/pendingAnswers";
import { fechaLocal, RespuestaDeCierre } from "../../../../infrastructure/api/RewardsApiService";
import { ScheduledActivity } from "../../../../domain/entities/Schedule";

interface UseDayCloseParams {
  currentTime: Date;
  todayItems: ScheduledActivity[];
  completadas: string[];
  noHechas: string[];
}

interface UseDayCloseReturn {
  ofrecerCierre: boolean;
  diaCerrado: string | null;
  setDiaCerrado: (value: string | null) => void;
  cerrandoDia: boolean;
  setCerrandoDia: (value: boolean) => void;
  recapPendiente: boolean;
  setRecapPendiente: (value: boolean) => void;
  respuestaDelCierre: RespuestaDeCierre | null;
  setRespuestaDelCierre: (value: RespuestaDeCierre | null) => void;
  sinResolver: import("../../../../domain/services/pendingAnswers").Pendiente[];
}

/**
 * Hook que maneja la lógica de cierre de día:
 * - Cuándo ofrecer el cierre
 * - Estado del diálogo de cierre
 * - Respuesta del usuario y recap pendiente
 */
export const useDayClose = ({
  currentTime,
  todayItems,
  completadas,
  noHechas,
}: UseDayCloseParams): UseDayCloseReturn => {
  const [diaCerrado, setDiaCerrado] = useState<string | null>(null);
  const [cerrandoDia, setCerrandoDia] = useState(false);
  const [recapPendiente, setRecapPendiente] = useState(false);
  const [respuestaDelCierre, setRespuestaDelCierre] = useState<RespuestaDeCierre | null>(null);

  const sinResolver = useMemo(
    () =>
      sinResponder({
        items: todayItems,
        minutoActual: currentTime.getHours() * 60 + currentTime.getMinutes(),
        completadas,
        noHechas,
      }),
    [todayItems, currentTime, completadas, noHechas]
  );

  const hoyISO = fechaLocal();
  const ofrecerCierre = correspondeOfrecerCierre({
    hora: currentTime.getHours(),
    sinResolver: sinResolver.length,
    yaCerro: diaCerrado === hoyISO,
  });

  return {
    ofrecerCierre,
    diaCerrado,
    setDiaCerrado,
    cerrandoDia,
    setCerrandoDia,
    recapPendiente,
    setRecapPendiente,
    respuestaDelCierre,
    setRespuestaDelCierre,
    sinResolver,
  };
};