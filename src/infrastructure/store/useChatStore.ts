import { create, StoreApi, UseBoundStore } from 'zustand';
import { ChatMessage } from '../../presentation/components/molecules/CreateActivity/MessageBubble';
import { MessageDto, ParseNLResponseDto } from '../api/dto/ParseNLDto';
import { mapParsedResponseToFormState } from '../../application/mappers/parseNlMapper';
import { draftToFormState } from '../../application/mappers/draftToFormState';
import {
  Borrador,
  LlmTurno,
  Propuesta,
  RespuestaAsistente,
} from '../../domain/entities/conversation.types';
import { USA_ASISTENTE_V2 } from '../../config/featureFlags';
import {
  dateToMinutes,
  areOverlapping,
  calculateDurationAcrossMidnight,
  formatTime,
} from '../../presentation/utils/timeUtils';
import { OverlapError, OverlapConflictData } from '../../domain/errors/OverlapError';

export interface ChatStoreState {
  messages: ChatMessage[];
  isThinking: boolean;
  inputText: string;
  createdActivityId: string | null;
  /**
   * La memoria del asistente. El backend es stateless: el borrador y los
   * turnos viajan en cada peticion y vuelven en cada respuesta.
   *
   * `llmTurns` corre en paralelo a `messages` y NO se deriva de el. Son dos
   * representaciones distintas: `messages` es lo que se muestra, `llmTurns`
   * es lo que ve el modelo, con sus invocaciones y resultados verbatim.
   * Reconstruir una parseando la otra es exactamente el error que causaba el
   * "se olvida".
   */
  borrador: Borrador;
  llmTurns: LlmTurno[];

  addMessage: (message: ChatMessage) => void;
  setThinking: (thinking: boolean) => void;
  setInputText: (text: string) => void;
  clearChat: () => void;
  sendMessage: (text: string) => Promise<void>;
  cancelMessage: () => void;
  retry: () => void;
  confirmPendingActivity: (messageId: string) => Promise<void>;
  cancelPendingActivity: (messageId: string) => void;
}

export type ChatStore = UseBoundStore<StoreApi<ChatStoreState>>;

const timeStrToMinutes = (timeStr: string): number => {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

const minutesToTimeStr = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const hStr = h < 10 ? `0${h}` : `${h}`;
  const mStr = m < 10 ? `0${m}` : `${m}`;
  return `${hStr}:${mStr}`;
};

const mapErrorToUserFriendlyMessage = (error: any, fallbackMessage: string): string => {
  const errMsg = error.message || '';
  const errStr = errMsg.toLowerCase();

  // If it's a rate limit error (429 or containing rate limit text)
  if (errStr.includes('rate limit') || errStr.includes('limit reached') || errStr.includes('429') || errStr.includes('too many requests')) {
    return '¡Hasta acá llegué por hoy! 🐸 Me voy a tomar una siestita arriba de un camalote. Intentemos de nuevo en un ratito.';
  }

  // If it's an API connection error (like network, timeout, Groq API down)
  if (
    errStr.includes('groq api error') ||
    errStr.includes('network error') ||
    errStr.includes('failed to parse') ||
    errStr.includes('fetch') ||
    errStr.includes('timeout') ||
    errStr.includes('503') ||
    errStr.includes('model not available') ||
    errStr.includes('service unavailable')
  ) {
    return '¡Glup! 🐸 Me hundí en el agua y perdí la conexión. ¿Probamos de nuevo en unos minutos?';
  }

  // Otherwise, return the specific validation message (e.g. overlap or format errors)
  return errMsg || fallbackMessage;
};


/**
 * Un turno con el motor conversacional nuevo.
 *
 * Vive fuera de createChatStore porque no necesita nada de su clausura, y
 * porque el sendMessage viejo ya tiene doscientas lineas: mezclarlos haria
 * ilegibles a los dos.
 *
 * La diferencia de fondo con el camino anterior es lo que NO hace: no
 * serializa la agenda, no recorta el historial y no adivina si el usuario
 * quiere editar buscando "modific" en su texto. El backend arma el contexto
 * desde la base y el modelo decide con tools.
 */
async function conversarConElAsistente(
  text: string,
  set: (partial: Partial<ChatStoreState>) => void,
  get: () => ChatStoreState,
  conversarFn: (peticion: {
    mensaje: string;
    borrador?: Borrador;
    turnos?: LlmTurno[];
  }) => Promise<RespuestaAsistente>,
  activityStore: any
): Promise<void> {
  try {
    const respuesta = await conversarFn({
      mensaje: text,
      borrador: get().borrador,
      turnos: get().llmTurns,
    });

    // El borrador y los turnos se guardan siempre, incluso cuando la
    // respuesta es una pregunta: son la memoria, y perderlos aca es
    // exactamente el bug que vino a arreglar todo esto.
    set({ borrador: respuesta.borrador ?? {}, llmTurns: respuesta.turnos ?? [] });

    if (respuesta.tipo !== 'propuesta' || !respuesta.propuesta) {
      set({
        messages: [
          ...get().messages,
          {
            id: `ai-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            role: 'assistant',
            content: respuesta.mensaje || 'Cuéntame un poco más.',
            timestamp: Date.now(),
            type: respuesta.tipo === 'charla' ? 'chat' : 'question',
          },
        ],
        isThinking: false,
      });
      return;
    }

    const confirmMsg = mensajeDePropuesta(respuesta.propuesta, respuesta.mensaje, activityStore);

    // Se desactivan las tarjetas anteriores sin confirmar: si el usuario pidio
    // cambios en vez de confirmar, dejar vivos los botones viejos permitiria
    // crear la actividad dos veces.
    const conPendientesCancelados = get().messages.map((m) =>
      m.pendingActivity && !m.isConfirmed && !m.isCancelled
        ? { ...m, isCancelled: true }
        : m
    );

    set({
      messages: [...conPendientesCancelados, confirmMsg],
      isThinking: false,
    });
  } catch (error: any) {
    console.error('Error hablando con el asistente:', error);
    set({
      messages: [
        ...get().messages,
        {
          id: `error-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          role: 'assistant',
          content: mapErrorToUserFriendlyMessage(
            error,
            'Ups, hubo un error al conectar con la IA.'
          ),
          timestamp: Date.now(),
          isError: true,
        },
      ],
      isThinking: false,
    });
  }
}

/** Arma la tarjeta de confirmacion segun lo que se este proponiendo. */
function mensajeDePropuesta(
  propuesta: Propuesta,
  mensaje: string | null | undefined,
  activityStore: any
): ChatMessage {
  const base = {
    id: `confirm-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    role: 'assistant' as const,
    timestamp: Date.now(),
    type: 'result' as const,
  };

  if (propuesta.tipo === 'regenerar') {
    return {
      ...base,
      content: mensaje || 'Voy a reorganizar tu horario. ¿Confirmas?',
      pendingActivity: { kind: 'regenerar', id: `regen-${Date.now()}` },
    } as ChatMessage;
  }

  const actividades = activityStore.getState().activities || [];
  // El id lo da el backend, que lo obtuvo con buscar_actividad. Reemplaza el
  // match por substring del cliente, donde "matematica" no encontraba
  // "Matemática" y cualquier nombre corto podia apuntar a la actividad
  // equivocada.
  const objetivo = propuesta.activity_id
    ? actividades.find((a: any) => String(a.id) === String(propuesta.activity_id))
    : null;

  if (propuesta.tipo === 'eliminar') {
    return {
      ...base,
      content: objetivo
        ? mensaje || `¿Elimino "${objetivo.title}"?`
        : 'No encontré esa actividad. ¿Puedes decirme el nombre exacto?',
      pendingActivity: objetivo
        ? { kind: 'eliminar', id: String(objetivo.id), originalName: objetivo.title }
        : undefined,
    } as ChatMessage;
  }

  const parsedState = draftToFormState(propuesta.borrador ?? {}, 0);
  const esModificacion = propuesta.tipo === 'modificar' && !!objetivo;

  return {
    ...base,
    content:
      mensaje ||
      (esModificacion
        ? `Encontré "${objetivo.title}". ¿Quieres modificarla con estos datos?`
        : '¿Quieres crear esta actividad con estos datos?'),
    pendingActivity: {
      kind: esModificacion ? 'modificar' : 'crear',
      id: esModificacion ? String(objetivo.id) : Date.now().toString(),
      isModification: esModificacion,
      originalName: esModificacion ? objetivo.title : null,
      originalActivityProps: esModificacion ? propsDeActividad(objetivo) : null,
      parsedState,
    },
  } as ChatMessage;
}

/**
 * Ejecuta las propuestas que no construyen una actividad.
 *
 * Las dos terminan regenerando el horario, porque quitar o reorganizar
 * actividades deja el horario vigente desactualizado.
 */
async function ejecutarAccionSimple(
  kind: 'eliminar' | 'regenerar',
  pendingActivity: any,
  messageId: string,
  set: (partial: Partial<ChatStoreState>) => void,
  get: () => ChatStoreState,
  activityStore: any,
  scheduleStore: any
): Promise<void> {
  set({ isThinking: true });

  try {
    if (kind === 'eliminar') {
      await activityStore.getState().handleDeleteActivity(pendingActivity.id);
    }
    await scheduleStore.getState().handleGenerateSchedule();

    set({
      messages: get().messages.map((m) =>
        m.id === messageId
          ? { ...m, isConfirmed: true }
          : m
      ).concat({
        id: `ok-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        role: 'assistant',
        content:
          kind === 'eliminar'
            ? `Listo, eliminé "${pendingActivity.originalName ?? 'la actividad'}" y reorganicé tu horario.`
            : 'Listo, reorganicé tu horario.',
        timestamp: Date.now(),
      } as ChatMessage),
      isThinking: false,
    });
  } catch (error: any) {
    console.error(`Error al ${kind}:`, error);
    set({
      messages: [
        ...get().messages,
        {
          id: `error-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          role: 'assistant',
          content: mapErrorToUserFriendlyMessage(
            error,
            `No pude ${kind === 'eliminar' ? 'eliminar la actividad' : 'reorganizar el horario'}.`
          ),
          timestamp: Date.now(),
          isError: true,
        } as ChatMessage,
      ],
      isThinking: false,
    });
  }
}

/** Snapshot para poder revertir si el guardado falla a mitad de camino. */
function propsDeActividad(actividad: any) {
  return {
    id: actividad.id,
    activityName: actividad.title,
    isFixed: actividad.isFixed(),
    identity: actividad.identity,
    priority: actividad.priority,
    difficulty: actividad.difficulty,
    deadline: actividad.deadline,
    daysConfig: actividad.daysConfig,
    days: actividad.daysEnabled,
    preferredStartTime: actividad.preferredStartTime,
    preferredEndTime: actividad.preferredEndTime,
    optionalDay: actividad.optionalDay,
    isAnchor: actividad.isAnchor,
  };
}

export function createChatStore(
  activityStore: any,
  scheduleStore: any,
  sendConversationFn: (
    text: string,
    history: MessageDto[],
    agendaContext?: string,
    currentDay?: string
  ) => Promise<any>,
  // Se inyecta igual que la anterior, para poder probar el store sin red.
  conversarFn?: (peticion: {
    mensaje: string;
    borrador?: Borrador;
    turnos?: LlmTurno[];
  }) => Promise<RespuestaAsistente>
): ChatStore {
  const validatePartitions = (
    parts: any[],
    days: string[],
    isFixed: boolean
  ): void => {
    if (isFixed) {
      for (let i = 0; i < parts.length; i++) {
        const sMin = dateToMinutes(new Date(parts[i].startHour));
        const eMin = dateToMinutes(new Date(parts[i].endHour));
        for (let j = i + 1; j < parts.length; j++) {
          const sMin2 = dateToMinutes(new Date(parts[j].startHour));
          const eMin2 = dateToMinutes(new Date(parts[j].endHour));
          if (areOverlapping(sMin, eMin, sMin2, eMin2)) {
            throw new Error(`Los bloques horarios para el día ${days.join(', ')} no pueden superponerse.`);
          }
        }
      }
    }
  };

  const validateOverlapWithSchedule = (
    currentId: string | null,
    isFixedActivity: boolean,
    days: string[],
    daysDict: any,
    prefStartGlobal: number | null,
    prefEndGlobal: number | null,
    durationGlobal: number
  ): void => {
    const schedule = scheduleStore.getState().schedule;
    if (!schedule) return;

    for (const day of days) {
      const dayIndex = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'].indexOf(day);
      const loopDisplayStartHour = scheduleStore.getState().perDayStartHours?.[dayIndex] ?? scheduleStore.getState().startHour;
      const scheduledItems = schedule.getItemsByDay(day, loopDisplayStartHour);
      const otherItems = scheduledItems.filter(
        (item: any) => item.activity && item.activity.id !== currentId && item.activity.type === 'FIXED'
      );

      const config = daysDict[day];
      if (!config) continue;

      const parts = config.partitions;
      const prefStart = config.preferredStartTime ?? prefStartGlobal;
      const prefEnd = config.preferredEndTime ?? prefEndGlobal;
      const duration = parts.reduce((sum: number, p: any) => sum + p.durationTime, 0);

      if (isFixedActivity) {
        for (const part of parts) {
          const partStart = dateToMinutes(new Date(part.startHour));
          const partEnd = dateToMinutes(new Date(part.endHour));

          for (const item of otherItems) {
            const itemStart = timeStrToMinutes(item.assignedStartTime);
            const itemEnd = timeStrToMinutes(item.assignedEndTime);

            if (partStart < itemEnd && partEnd > itemStart) {
              const fixedConflictData: OverlapConflictData = {
                day,
                conflictingActivity: {
                  id: item.activity.id,
                  title: item.activity?.title ?? 'Actividad sin nombre',
                  startTime: item.assignedStartTime,
                  endTime: item.assignedEndTime,
                },
                proposedTime: {
                  startTime: minutesToTimeStr(dateToMinutes(new Date(part.startHour))),
                  endTime: minutesToTimeStr(dateToMinutes(new Date(part.endHour))),
                },
              };
              throw new OverlapError(
                `El horario del día ${day} (${formatTime(part.startHour)} - ${formatTime(part.endHour)}) se superpone con la actividad ya establecida "${item.activity?.title ?? 'Actividad sin nombre'}" (${item.assignedStartTime} - ${item.assignedEndTime}).`,
                [fixedConflictData],
                day,
                'fixed',
              );
            }
          }
        }
      } else {
        if (prefStart !== null && prefEnd !== null) {
          let blockedMinutes = 0;
          let overlappingActivities: string[] = [];
          const flexibleConflicts: OverlapConflictData[] = [];

          let normPrefStart = prefStart;
          let normPrefEnd = prefEnd;
          if (normPrefEnd < normPrefStart) {
            normPrefEnd += 1440;
          }

          for (const item of otherItems) {
            const itemStart = timeStrToMinutes(item.assignedStartTime);
            let itemEnd = timeStrToMinutes(item.assignedEndTime);

            let normItemStart = itemStart;
            let normItemEnd = itemEnd;
            if (normItemEnd < normItemStart) {
              normItemEnd += 1440;
            }

            if (normItemEnd <= normPrefStart) {
              normItemStart += 1440;
              normItemEnd += 1440;
            }

            const overlapStart = Math.max(normPrefStart, normItemStart);
            const overlapEnd = Math.min(normPrefEnd, normItemEnd);

            if (overlapStart < overlapEnd) {
              blockedMinutes += (overlapEnd - overlapStart);
              overlappingActivities.push(`"${item.activity?.title ?? 'Actividad sin nombre'}" (${item.assignedStartTime} - ${item.assignedEndTime})`);
              flexibleConflicts.push({
                day,
                conflictingActivity: {
                  id: item.activity.id,
                  title: item.activity?.title ?? 'Actividad sin nombre',
                  startTime: item.assignedStartTime,
                  endTime: item.assignedEndTime,
                },
                proposedTime: {
                  startTime: minutesToTimeStr(prefStart),
                  endTime: minutesToTimeStr(prefEnd),
                },
              });
            }
          }

          const totalWindowMinutes = calculateDurationAcrossMidnight(prefStart, prefEnd);
          const freeMinutes = totalWindowMinutes - blockedMinutes;

          if (freeMinutes < duration) {
            const overlapText = overlappingActivities.length > 0
              ? ` debido a la superposición con: ${overlappingActivities.join(', ')}`
              : '';
            throw new OverlapError(
              `La ventana preferida el día ${day} (${minutesToTimeStr(prefStart)} - ${minutesToTimeStr(prefEnd)}) no deja suficiente tiempo libre para realizar la actividad (${duration} min)${overlapText}.`,
              flexibleConflicts,
              day,
              'flexible',
            );
          }
        }
      }
    }
  };

  const greetingMessage: ChatMessage = {
    id: 'sapo-greeting',
    role: 'assistant',
    content: '¡Hola! Soy Sapo 🐸, tu asistente virtual. Dime qué actividad quieres agregar y te ayudo a organizar tu día.',
    timestamp: Date.now(),
    type: 'chat',
  };

  return create<ChatStoreState>((set, get) => ({
    messages: [greetingMessage],
    isThinking: false,
    inputText: '',
    createdActivityId: null,
    borrador: {},
    llmTurns: [],

    addMessage: (message) => set({ messages: [...get().messages, message] }),
    setThinking: (thinking) => set({ isThinking: thinking }),
    setInputText: (text) => set({ inputText: text }),

    clearChat: () =>
      set({
        messages: [{ ...greetingMessage, timestamp: Date.now() }],
        isThinking: false,
        inputText: '',
        createdActivityId: null,
        // Sin esto, empezar de cero dejaria al asistente arrastrando la
        // actividad de la conversacion anterior.
        borrador: {},
        llmTurns: [],
      }),

    cancelMessage: () => {
      // El aborto real lo hace el AbortController de backendClient cuando se
      // agota el timeout. Aca solo se deja de esperar del lado de la UI: la
      // respuesta que llegue tarde se descarta porque el turno ya cerro.
      set({ isThinking: false });
    },

    sendMessage: async (text: string) => {
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        role: 'user',
        content: text,
        timestamp: Date.now(),
      };
      set({
        messages: [...get().messages, userMsg],
        isThinking: true,
      });

      if (USA_ASISTENTE_V2 && conversarFn) {
        await conversarConElAsistente(text, set, get, conversarFn, activityStore);
        return;
      }

      const activities = activityStore.getState().activities || [];
      // Groq/Llama: limitar descripciones para no quemar tokens
      const MAX_ACTIVITY_DESC = 10;
      const descriptions = activities.slice(0, MAX_ACTIVITY_DESC).map((a: any) => {
        const isFixed = a.isFixed();
        const parts: string[] = [];
        parts.push(`Nombre: "${a.title}"`);
        parts.push(`Categoría: "${a.identity || 'tarea'}"`);
        parts.push(`Horario: ${isFixed ? 'Fijo' : 'Flexible'}`);
        parts.push(`Días: [${a.daysEnabled ? a.daysEnabled.join(', ') : ''}]`);
        if (isFixed) {
          const dayTimes: string[] = [];
          if (a.daysConfig) {
            for (const day in a.daysConfig) {
              const cfg = a.daysConfig[day];
              if (cfg && cfg.partitions && cfg.partitions.length > 0) {
                const timings = cfg.partitions.map((p: any) => {
                  const s = minutesToTimeStr(dateToMinutes(new Date(p.startHour)));
                  const e = minutesToTimeStr(dateToMinutes(new Date(p.endHour)));
                  return `${s} - ${e}`;
                }).join(', ');
                dayTimes.push(`${day}: ${timings}`);
              }
            }
          }
          parts.push(`Horas: { ${dayTimes.join(' | ')} }`);
        } else {
          if (a.preferredStartTime !== null && a.preferredEndTime !== null && a.preferredStartTime !== undefined && a.preferredEndTime !== undefined) {
            parts.push(`Rango preferido: ${minutesToTimeStr(a.preferredStartTime)} a ${minutesToTimeStr(a.preferredEndTime)}`);
          }
          if (a.getTotalTimeRequired) {
            parts.push(`Duración: ${a.getTotalTimeRequired()} minutos`);
          }
          parts.push(`Prioridad: "${a.priority || 'media'}"`);
        }
        return `{ ${parts.join(' | ')} }`;
      });
      if (activities.length > MAX_ACTIVITY_DESC) {
        descriptions.push(`...[y ${activities.length - MAX_ACTIVITY_DESC} actividad(es) más, omitidas por brevedad]`);
      }

      // Groq/Llama: contexto limitado — solo últimas 4 exchanges (8 mensajes)
      const MAX_HISTORY_EXCHANGES = 4;
      const trimmedMessages = get().messages.filter((m) => !m.isError);
      const recentMessages = trimmedMessages.slice(-(MAX_HISTORY_EXCHANGES * 2));
      const history: MessageDto[] = recentMessages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
        type: m.type,
      }));

      const agendaContext = descriptions.length > 0 ? descriptions.join('\n') : undefined;
      const spanishDays = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
      const currentDay = spanishDays[new Date().getDay()];

      let creatingMsgId: string | null = null;
      try {
        const response = await sendConversationFn(text, history, agendaContext, currentDay);

        if (response.type === 'chat') {
          const aiMsg: ChatMessage = {
            id: `ai-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            role: 'assistant',
            content: response.ai_message,
            timestamp: Date.now(),
            type: 'chat',
          };
          set({
            messages: [...get().messages, aiMsg],
            isThinking: false,
          });
        } else if (response.type === 'question') {
          const aiMsg: ChatMessage = {
            id: `ai-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            role: 'assistant',
            content: response.ai_message,
            timestamp: Date.now(),
            type: 'question',
          };
          set({
            messages: [...get().messages, aiMsg],
            isThinking: false,
          });
        } else if (response.type === 'result') {
          const parsedState = mapParsedResponseToFormState(
            response as unknown as ParseNLResponseDto,
            0
          );

          if (!parsedState.activityName || parsedState.activityName.trim() === '') {
            const aiMsg: ChatMessage = {
              id: `ai-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
              role: 'assistant',
              content: 'Entendido. Dime si quieres agendar o modificar alguna actividad.',
              timestamp: Date.now(),
              type: 'question',
            };
            set({
              messages: [...get().messages, aiMsg],
              isThinking: false,
            });
            return;
          }

          // Find if there is a matching activity in the database to edit/modify
          const activities = activityStore.getState().activities || [];
          const parsedName = parsedState.activityName || '';
          const normalizedParsedName = parsedName.trim().toLowerCase();

          // Check if user has an edit intent in their input text
          const normalizedInput = text.toLowerCase();
          const isEditIntent = normalizedInput.includes('modific') || 
                               normalizedInput.includes('edit') || 
                               normalizedInput.includes('cambia') || 
                               normalizedInput.includes('actualiz');

          let matchingActivity: any = null;
          if (normalizedParsedName) {
            // 1. Exact match
            matchingActivity = activities.find(
              (a: any) => a.title.trim().toLowerCase() === normalizedParsedName
            );
            // 2. Partial match if edit intent
            if (!matchingActivity && isEditIntent) {
              matchingActivity = activities.find(
                (a: any) => a.title.toLowerCase().includes(normalizedParsedName) || 
                            normalizedParsedName.includes(a.title.toLowerCase())
              );
            }
            // 3. Fallback check user input if edit intent
            if (!matchingActivity && isEditIntent) {
              matchingActivity = activities.find(
                (a: any) => normalizedInput.includes(a.title.toLowerCase())
              );
            }
          }

          let originalActivityProps: any = null;
          if (matchingActivity) {
            originalActivityProps = {
              id: matchingActivity.id,
              activityName: matchingActivity.title,
              isFixed: matchingActivity.isFixed(),
              identity: matchingActivity.identity,
              priority: matchingActivity.priority,
              difficulty: matchingActivity.difficulty,
              deadline: matchingActivity.deadline,
              daysConfig: matchingActivity.daysConfig,
              days: matchingActivity.daysEnabled,
              preferredStartTime: matchingActivity.preferredStartTime,
              preferredEndTime: matchingActivity.preferredEndTime,
              optionalDay: matchingActivity.optionalDay,
              isAnchor: matchingActivity.isAnchor,
            };
          }

          const pendingActivity = {
            id: matchingActivity ? matchingActivity.id : Date.now().toString(),
            isModification: !!matchingActivity,
            originalName: matchingActivity ? matchingActivity.title : null,
            originalActivityProps,
            parsedState,
          };

          const confirmMsg: ChatMessage = {
            id: `confirm-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            role: 'assistant',
            content: matchingActivity
              ? `Encontré la actividad "${matchingActivity.title}" en la base de datos. ¿Quieres modificarla con los siguientes datos?`
              : '¿Quieres crear esta actividad con los siguientes datos?',
            timestamp: Date.now(),
            pendingActivity,
            type: 'result',
          };

          // Auto-cancelar pendings anteriores: si el usuario pidió cambios sin cancelar,
          // los viejos botones Confirmar/Cancelar se desactivan para evitar duplicados.
          const messagesWithCancelledPendings = get().messages.map((m) =>
            m.pendingActivity && !m.isConfirmed && !m.isCancelled
              ? { ...m, isCancelled: true }
              : m
          );

          set({
            messages: [...messagesWithCancelledPendings, confirmMsg],
            isThinking: false,
          });
        }
      } catch (error: any) {
        console.error('Error in chat store sendMessage:', error);
        const displayMessage = mapErrorToUserFriendlyMessage(error, 'Ups, hubo un error al conectar con la IA.');
        const errorMsg: ChatMessage = {
          id: `error-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          role: 'assistant',
          content: displayMessage,
          timestamp: Date.now(),
          isError: true,
        };
        set({
          messages: [
            ...get().messages.filter((m) => m.id !== creatingMsgId),
            errorMsg,
          ],
          isThinking: false,
        });
      }
    },

    confirmPendingActivity: async (messageId: string) => {
      const msg = get().messages.find((m) => m.id === messageId);
      if (!msg || !msg.pendingActivity) return;

      const { pendingActivity } = msg;

      // Eliminar y regenerar son caminos nuevos y cortos. Crear y modificar
      // siguen por el de siempre, que ya resuelve validacion de solapamientos,
      // guardado y rollback: reescribirlo seria arriesgar lo unico que hoy
      // funciona bien.
      const kind = (pendingActivity as any).kind;
      if (kind === 'eliminar' || kind === 'regenerar') {
        await ejecutarAccionSimple(
          kind,
          pendingActivity,
          messageId,
          set,
          get,
          activityStore,
          scheduleStore
        );
        return;
      }

      const { parsedState, id, isModification, originalActivityProps } = pendingActivity;

      set({ isThinking: true });

      const validatingMsgId = `validating-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const validatingMsg: ChatMessage = {
        id: validatingMsgId,
        role: 'assistant',
        content: isModification ? 'Modificando la actividad...' : 'Creando la actividad...',
        timestamp: Date.now(),
      };

      set({
        messages: [...get().messages, validatingMsg],
      });

      try {
        if (!parsedState.activityName || !parsedState.activityName.trim()) {
          throw new Error('Ingresa un nombre para la actividad');
        }
        if (!parsedState.selectedDays || parsedState.selectedDays.length === 0) {
          throw new Error('Guarda la configuración de al menos un día');
        }

        // Partitions validation
        for (const day of parsedState.selectedDays) {
          const config = parsedState.daysDict[day];
          if (config) {
            validatePartitions(config.partitions, [day], parsedState.isFixed);
          }
        }

        // Window validation
        for (const day of parsedState.selectedDays) {
          const dayConfig = parsedState.daysDict[day];
          if (dayConfig) {
            const prefStart = dayConfig.preferredStartTime;
            const prefEnd = dayConfig.preferredEndTime;
            if (prefStart != null && prefEnd != null) {
              const partDuration = dayConfig.partitions.reduce(
                (sum: number, p: any) => sum + p.durationTime,
                0
              );
              if (calculateDurationAcrossMidnight(prefStart, prefEnd) < partDuration) {
                throw new Error(`La ventana preferida del ${day} es más corta que la duración estimada de la actividad en ese día.`);
              }
            }
          }
        }

        // Overlaps validation
        validateOverlapWithSchedule(
          isModification ? id : null,
          parsedState.isFixed,
          parsedState.selectedDays,
          parsedState.daysDict,
          parsedState.horaPreferidaInicio,
          parsedState.horaPreferidaFin,
          parsedState.duracionMinutos ?? 60
        );

        const priorityMap: Record<'baja' | 'media' | 'alta', number> = {
          baja: 1,
          media: 3,
          alta: 5,
        };
        const priorityKey = (parsedState.priority || 'media') as 'baja' | 'media' | 'alta';
        const finalPriority = parsedState.isFixed ? 5 : priorityMap[priorityKey];
        const finalDifficulty = parsedState.isFixed ? 'media' : (parsedState.difficulty || 'media');

        // Domain rule: al modificar, preservar identity original cuando el AI
        // no lo haya especificado explícitamente. Al crear, default depende de isFixed:
        // clase → fijo, tarea → flexible. Nunca clase+flexible (se corrige en parseNlMapper).
        const resolvedIdentity = isModification && originalActivityProps
          ? (parsedState.identity || originalActivityProps.identity)
          : (parsedState.identity || (parsedState.isFixed ? 'clase' : 'tarea'));

        await activityStore.getState().handleCreateActivity({
          id,
          activityName: parsedState.activityName,
          isFixed: parsedState.isFixed,
          identity: resolvedIdentity,
          priority: finalPriority,
          difficulty: finalDifficulty,
          deadline: null,
          daysConfig: parsedState.daysDict,
          days: parsedState.selectedDays,
          preferredStartTime: parsedState.horaPreferidaInicio,
          preferredEndTime: parsedState.horaPreferidaFin,
          optionalDay: !parsedState.isFixed && !parsedState.isAnchor,
          isAnchor: parsedState.isAnchor || undefined,
        });

        try {
          await scheduleStore.getState().handleGenerateSchedule();
        } catch (scheduleError: any) {
          console.log('Error al generar el horario, revirtiendo cambios en la base de datos...');
          if (isModification && originalActivityProps) {
            await activityStore.getState().handleCreateActivity(originalActivityProps);
          } else {
            await activityStore.getState().handleDeleteActivity(id);
          }
          await scheduleStore.getState().handleGenerateSchedule();
          throw scheduleError;
        }

        set({
          createdActivityId: id,
          messages: get().messages
            .filter((m) => m.id !== validatingMsgId)
            .map((m) =>
              m.id === messageId
                ? { ...m, isConfirmed: true }
                : m
            ),
        });

        const successMsg: ChatMessage = {
          id: `success-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          role: 'assistant',
          content: isModification
            ? '¡Actividad modificada con éxito!'
            : '¡Actividad creada con éxito! Si no estás de acuerdo con la configuración, puedes pedirme cambios en este mismo chat o editarla.',
          timestamp: Date.now(),
          isCreated: true,
        };

        set({
          messages: [...get().messages, successMsg],
          isThinking: false,
        });
      } catch (error: any) {
        console.error('Error confirming pending activity:', error);

        set({
          messages: get().messages.filter((m) => m.id !== validatingMsgId),
        });

        if (error instanceof OverlapError) {
          const errorMsg: ChatMessage = {
            id: `error-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            role: 'assistant',
            content: error.message,
            timestamp: Date.now(),
            isError: true,
            overlapData: error.conflicts,
          };
          set({
            messages: [...get().messages, errorMsg],
            isThinking: false,
          });
        } else {
          const displayMessage = mapErrorToUserFriendlyMessage(error, 'Ups, hubo un error al procesar la actividad.');
          const errorMsg: ChatMessage = {
            id: `error-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            role: 'assistant',
            content: displayMessage,
            timestamp: Date.now(),
            isError: true,
          };

          set({
            messages: [...get().messages, errorMsg],
            isThinking: false,
          });
        }
      }
    },

    cancelPendingActivity: (messageId: string) => {
      set({
        messages: get().messages.map((m) =>
          m.id === messageId
            ? { ...m, isCancelled: true }
            : m
        ),
      });

      const cancelMsg: ChatMessage = {
        id: `cancel-msg-${Date.now()}`,
        role: 'assistant',
        content: 'Modificación/creación cancelada.',
        timestamp: Date.now(),
      };

      set({
        messages: [...get().messages, cancelMsg],
      });
    },

    retry: () => {
      const lastUserMsg = [...get().messages]
        .reverse()
        .find((m) => m.role === 'user');

      if (lastUserMsg) {
        set({
          messages: get().messages.filter((m) => !m.isError),
        });
        get().sendMessage(lastUserMsg.content);
      }
    },
  }));
}
