import { create, StoreApi, UseBoundStore } from 'zustand';
import { ChatMessage } from '../../presentation/components/molecules/CreateActivity/MessageBubble';
import { MessageDto, ParseNLResponseDto } from '../api/dto/ParseNLDto';
import { mapParsedResponseToFormState } from '../../application/mappers/parseNlMapper';
import {
  dateToMinutes,
  areOverlapping,
  calculateDurationAcrossMidnight,
  formatTime,
} from '../../presentation/utils/timeUtils';

export interface ChatStoreState {
  messages: ChatMessage[];
  isThinking: boolean;
  inputText: string;
  createdActivityId: string | null;

  addMessage: (message: ChatMessage) => void;
  setThinking: (thinking: boolean) => void;
  setInputText: (text: string) => void;
  clearChat: () => void;
  sendMessage: (text: string) => Promise<void>;
  retry: () => void;
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

export function createChatStore(
  activityStore: any,
  scheduleStore: any,
  sendConversationFn: (text: string, history: MessageDto[]) => Promise<any>
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
              throw new Error(`El horario del día ${day} (${formatTime(part.startHour)} - ${formatTime(part.endHour)}) se superpone con la actividad ya establecida "${item.activity?.title ?? 'Actividad sin nombre'}" (${item.assignedStartTime} - ${item.assignedEndTime}).`);
            }
          }
        }
      } else {
        if (prefStart !== null && prefEnd !== null) {
          let blockedMinutes = 0;
          let overlappingActivities: string[] = [];

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
            }
          }

          const totalWindowMinutes = calculateDurationAcrossMidnight(prefStart, prefEnd);
          const freeMinutes = totalWindowMinutes - blockedMinutes;

          if (freeMinutes < duration) {
            const overlapText = overlappingActivities.length > 0
              ? ` debido a la superposición con: ${overlappingActivities.join(', ')}`
              : '';
            throw new Error(`La ventana preferida el día ${day} (${minutesToTimeStr(prefStart)} - ${minutesToTimeStr(prefEnd)}) no deja suficiente tiempo libre para realizar la actividad (${duration} min)${overlapText}.`);
          }
        }
      }
    }
  };

  const greetingMessage: ChatMessage = {
    id: 'sapo-greeting',
    role: 'assistant',
    content: '¡Hola! Soy Sapo 🐸, tu asistente virtual. Decime qué actividad querés agregar y te ayudo a organizar tu día.',
    timestamp: Date.now(),
  };

  return create<ChatStoreState>((set, get) => ({
    messages: [greetingMessage],
    isThinking: false,
    inputText: '',
    createdActivityId: null,

    addMessage: (message) => set({ messages: [...get().messages, message] }),
    setThinking: (thinking) => set({ isThinking: thinking }),
    setInputText: (text) => set({ inputText: text }),

    clearChat: () =>
      set({
        messages: [{ ...greetingMessage, timestamp: Date.now() }],
        isThinking: false,
        inputText: '',
        createdActivityId: null,
      }),

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

      const history: MessageDto[] = get().messages
        .filter((m) => !m.isError)
        .map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));

      let creatingMsgId: string | null = null;
      try {
        const response = await sendConversationFn(text, history);

        if (response.type === 'question') {
          const aiMsg: ChatMessage = {
            id: `ai-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            role: 'assistant',
            content: response.ai_message,
            timestamp: Date.now(),
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
            null,
            parsedState.isFixed,
            parsedState.selectedDays,
            parsedState.daysDict,
            parsedState.horaPreferidaInicio,
            parsedState.horaPreferidaFin,
            parsedState.duracionMinutos ?? 60
          );

          creatingMsgId = `creating-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
          const creatingMsg: ChatMessage = {
            id: creatingMsgId,
            role: 'assistant',
            content: '¡Listo! Estoy creando tu actividad...',
            timestamp: Date.now(),
          };
          set({
            messages: [...get().messages, creatingMsg],
          });

          const priorityMap: Record<'baja' | 'media' | 'alta', number> = {
            baja: 1,
            media: 3,
            alta: 5,
          };
          const finalPriority = parsedState.isFixed ? 5 : priorityMap[parsedState.priority || 'media'];
          const finalDifficulty = parsedState.isFixed ? 'media' : (parsedState.difficulty || 'media');
          const finalId = Date.now().toString();

          await activityStore.getState().handleCreateActivity({
            id: finalId,
            activityName: parsedState.activityName,
            isFixed: parsedState.isFixed,
            identity: parsedState.identity || 'clase',
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

          await scheduleStore.getState().handleGenerateSchedule();

          const successMsg: ChatMessage = {
            id: `success-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            role: 'assistant',
            content: '¡Actividad creada con éxito! Si no estás de acuerdo con la configuración, puedes pedirme cambios en este mismo chat o editarla.',
            timestamp: Date.now(),
            isCreated: true,
          };

          set({
            createdActivityId: finalId,
            messages: [
              ...get().messages.filter((m) => m.id !== creatingMsgId),
              successMsg,
            ],
            isThinking: false,
          });
        }
      } catch (error: any) {
        console.error('Error in chat store sendMessage:', error);
        const errorMsg: ChatMessage = {
          id: `error-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          role: 'assistant',
          content: error.message || 'Ups, hubo un error al conectar con la IA.',
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
