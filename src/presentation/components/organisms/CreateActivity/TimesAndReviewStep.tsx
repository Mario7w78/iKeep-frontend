import React from 'react';

import TimeConfigStep from './TimeConfigStep';
import SummaryStep from './SummaryStep';

/**
 * "¿A qué hora?" — el segundo y último paso del wizard.
 *
 * El resumen dejó de ser pantalla propia. Era un eco de solo lectura de lo que
 * el usuario acababa de escribir, y cobraba un toque de "Siguiente" para
 * llegar y otro de "Atrás" para corregir cualquier cosa: el precio se pagaba
 * siempre, el beneficio solo cuando alguien lo leía.
 *
 * Va plegado al pie, sobre el botón de crear. Quien quiera revisar lo abre;
 * quien ya sabe lo que escribió, no paga nada.
 *
 * Se compone acá y no dentro de `TimeConfigStep` para que ese siga siendo lo
 * que dice ser: el editor de horarios, sin saber que existe un resumen.
 */
export const TimesAndReviewStep: React.FC<any> = ({ resumen, ...horarios }) => (
  <TimeConfigStep {...horarios} pie={<SummaryStep {...resumen} embebido />} />
);
