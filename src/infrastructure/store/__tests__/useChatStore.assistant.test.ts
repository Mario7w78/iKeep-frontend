/**
 * El camino nuevo del chat.
 *
 * Lo que más importa verificar es que el borrador y los turnos se conserven
 * entre mensajes: son la memoria del asistente, y perderlos aquí desharía
 * todo el trabajo del backend.
 *
 * El flag se fuerza encendido en estos tests. En la app arranca apagado hasta
 * probarlo en dispositivo.
 */

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

jest.mock('../../../config/featureFlags', () => ({
  USA_BACKEND_PARA_DATOS: false,
  USA_ASISTENTE_V2: true,
}));

import { createChatStore } from '../useChatStore';

const ACTIVIDAD = {
  id: 'act-7',
  title: 'Gimnasio',
  identity: 'tarea',
  priority: 3,
  difficulty: 'media',
  deadline: null,
  daysConfig: {},
  daysEnabled: [],
  preferredStartTime: null,
  preferredEndTime: null,
  optionalDay: false,
  isAnchor: false,
  isFixed: () => true,
};

function crearStore(conversar: jest.Mock, extras: any = {}) {
  const activityStore = {
    getState: () => ({
      activities: [ACTIVIDAD],
      handleCreateActivity: jest.fn().mockResolvedValue(undefined),
      handleDeleteActivity: extras.handleDeleteActivity ?? jest.fn().mockResolvedValue(undefined),
    }),
  };
  const scheduleStore = {
    getState: () => ({
      schedule: { getItemsByDay: jest.fn().mockReturnValue([]) },
      perDayStartHours: null,
      startHour: 0,
      handleGenerateSchedule:
        extras.handleGenerateSchedule ?? jest.fn().mockResolvedValue(undefined),
    }),
  };
  return createChatStore(activityStore, scheduleStore, jest.fn(), conversar);
}

function respuesta(over: any = {}) {
  return {
    tipo: 'pregunta',
    mensaje: 'Que dias?',
    borrador: {},
    turnos: [],
    propuesta: null,
    ...over,
  };
}

describe('chat con el asistente nuevo', () => {
  describe('memoria de la conversacion', () => {
    it('guarda el borrador que devuelve el backend', async () => {
      const conversar = jest.fn().mockResolvedValue(
        respuesta({ borrador: { name: 'Calculo' } })
      );
      const store = crearStore(conversar);

      await store.getState().sendMessage('clase de calculo');

      expect(store.getState().borrador.name).toBe('Calculo');
    });

    it('reenvia el borrador en el mensaje siguiente', async () => {
      /** El test del "se olvida" desde la app. */
      const conversar = jest
        .fn()
        .mockResolvedValueOnce(respuesta({ borrador: { name: 'Calculo' } }))
        .mockResolvedValueOnce(respuesta({ borrador: { name: 'Calculo', is_fixed: true } }));
      const store = crearStore(conversar);

      await store.getState().sendMessage('clase de calculo');
      await store.getState().sendMessage('los martes');

      expect(conversar.mock.calls[1][0].borrador).toEqual({ name: 'Calculo' });
    });

    it('reenvia los turnos verbatim', async () => {
      const turnos = [
        { role: 'assistant', content: '', tool_calls: [{ id: 'c1' }] },
        { role: 'tool', tool_call_id: 'c1', content: '{"ok":true}' },
      ];
      const conversar = jest
        .fn()
        .mockResolvedValueOnce(respuesta({ turnos }))
        .mockResolvedValueOnce(respuesta());
      const store = crearStore(conversar);

      await store.getState().sendMessage('hola');
      await store.getState().sendMessage('y?');

      expect(conversar.mock.calls[1][0].turnos).toEqual(turnos);
    });

    it('empezar de cero borra la memoria', async () => {
      const conversar = jest.fn().mockResolvedValue(
        respuesta({ borrador: { name: 'Calculo' } })
      );
      const store = crearStore(conversar);
      await store.getState().sendMessage('calculo');

      store.getState().clearChat();

      expect(store.getState().borrador).toEqual({});
      expect(store.getState().llmTurns).toEqual([]);
    });
  });

  describe('respuestas', () => {
    it('una pregunta se muestra como mensaje', async () => {
      const store = crearStore(jest.fn().mockResolvedValue(respuesta()));

      await store.getState().sendMessage('hola');

      const ultimo = store.getState().messages.at(-1);
      expect(ultimo?.content).toBe('Que dias?');
      expect(ultimo?.type).toBe('question');
    });

    it('deja de pensar al terminar', async () => {
      const store = crearStore(jest.fn().mockResolvedValue(respuesta()));

      await store.getState().sendMessage('hola');

      expect(store.getState().isThinking).toBe(false);
    });

    it('un fallo de red no rompe el chat', async () => {
      const store = crearStore(jest.fn().mockRejectedValue(new Error('sin red')));

      await store.getState().sendMessage('hola');

      expect(store.getState().messages.at(-1)?.isError).toBe(true);
      expect(store.getState().isThinking).toBe(false);
    });
  });

  describe('propuestas', () => {
    it('crear arma la tarjeta con el borrador mapeado', async () => {
      const store = crearStore(
        jest.fn().mockResolvedValue(
          respuesta({
            tipo: 'propuesta',
            propuesta: { tipo: 'crear', borrador: { name: 'Calculo', is_fixed: false } },
          })
        )
      );

      await store.getState().sendMessage('dale');

      const pendiente = store.getState().messages.at(-1)?.pendingActivity as any;
      expect(pendiente.kind).toBe('crear');
      expect(pendiente.parsedState.activityName).toBe('Calculo');
      expect(pendiente.isModification).toBe(false);
    });

    it('modificar usa el id que dio el backend', async () => {
      /** Reemplaza al match por substring, donde un nombre corto podia
       *  apuntar a la actividad equivocada. */
      const store = crearStore(
        jest.fn().mockResolvedValue(
          respuesta({
            tipo: 'propuesta',
            propuesta: {
              tipo: 'modificar',
              activity_id: 'act-7',
              borrador: { name: 'Gimnasio', is_fixed: false, duracion_minutos: 60 },
            },
          })
        )
      );

      await store.getState().sendMessage('cambia el gimnasio');

      const pendiente = store.getState().messages.at(-1)?.pendingActivity as any;
      expect(pendiente.isModification).toBe(true);
      expect(pendiente.id).toBe('act-7');
      expect(pendiente.originalActivityProps.activityName).toBe('Gimnasio');
    });

    it('eliminar arma una tarjeta de borrado', async () => {
      const store = crearStore(
        jest.fn().mockResolvedValue(
          respuesta({
            tipo: 'propuesta',
            propuesta: { tipo: 'eliminar', activity_id: 'act-7' },
          })
        )
      );

      await store.getState().sendMessage('borra el gimnasio');

      const pendiente = store.getState().messages.at(-1)?.pendingActivity as any;
      expect(pendiente.kind).toBe('eliminar');
      expect(pendiente.id).toBe('act-7');
    });

    it('eliminar algo inexistente no ofrece confirmar', async () => {
      /** Sin actividad no hay nada que borrar: mostrar el boton invitaria a
       *  confirmar una accion sobre nada. */
      const store = crearStore(
        jest.fn().mockResolvedValue(
          respuesta({
            tipo: 'propuesta',
            propuesta: { tipo: 'eliminar', activity_id: 'act-inexistente' },
          })
        )
      );

      await store.getState().sendMessage('borra eso');

      expect(store.getState().messages.at(-1)?.pendingActivity).toBeUndefined();
    });

    it('regenerar no necesita actividad', async () => {
      const store = crearStore(
        jest.fn().mockResolvedValue(
          respuesta({ tipo: 'propuesta', propuesta: { tipo: 'regenerar' } })
        )
      );

      await store.getState().sendMessage('reorganiza mi semana');

      expect((store.getState().messages.at(-1)?.pendingActivity as any).kind).toBe(
        'regenerar'
      );
    });

    it('una propuesta nueva desactiva la anterior sin confirmar', async () => {
      /** Dejar vivos los botones viejos permitiria crear la actividad dos
       *  veces. */
      const propuesta = respuesta({
        tipo: 'propuesta',
        propuesta: { tipo: 'crear', borrador: { name: 'Calculo', is_fixed: false } },
      });
      const store = crearStore(jest.fn().mockResolvedValue(propuesta));

      await store.getState().sendMessage('dale');
      await store.getState().sendMessage('mejor cambialo');

      const conPendiente = store
        .getState()
        .messages.filter((m) => m.pendingActivity && !m.isCancelled);
      expect(conPendiente).toHaveLength(1);
    });
  });

  describe('confirmacion de acciones simples', () => {
    it('eliminar borra y regenera el horario', async () => {
      const handleDeleteActivity = jest.fn().mockResolvedValue(undefined);
      const handleGenerateSchedule = jest.fn().mockResolvedValue(undefined);
      const store = crearStore(
        jest.fn().mockResolvedValue(
          respuesta({
            tipo: 'propuesta',
            propuesta: { tipo: 'eliminar', activity_id: 'act-7' },
          })
        ),
        { handleDeleteActivity, handleGenerateSchedule }
      );
      await store.getState().sendMessage('borra el gimnasio');
      const id = store.getState().messages.at(-1)!.id;

      await store.getState().confirmPendingActivity(id);

      expect(handleDeleteActivity).toHaveBeenCalledWith('act-7');
      // Quitar una actividad deja el horario vigente desactualizado.
      expect(handleGenerateSchedule).toHaveBeenCalled();
    });

    it('regenerar solo rehace el horario', async () => {
      const handleDeleteActivity = jest.fn();
      const handleGenerateSchedule = jest.fn().mockResolvedValue(undefined);
      const store = crearStore(
        jest.fn().mockResolvedValue(
          respuesta({ tipo: 'propuesta', propuesta: { tipo: 'regenerar' } })
        ),
        { handleDeleteActivity, handleGenerateSchedule }
      );
      await store.getState().sendMessage('reorganiza');
      const id = store.getState().messages.at(-1)!.id;

      await store.getState().confirmPendingActivity(id);

      expect(handleDeleteActivity).not.toHaveBeenCalled();
      expect(handleGenerateSchedule).toHaveBeenCalled();
    });

    it('un fallo al eliminar se muestra sin romper el chat', async () => {
      const store = crearStore(
        jest.fn().mockResolvedValue(
          respuesta({
            tipo: 'propuesta',
            propuesta: { tipo: 'eliminar', activity_id: 'act-7' },
          })
        ),
        { handleDeleteActivity: jest.fn().mockRejectedValue(new Error('falló')) }
      );
      await store.getState().sendMessage('borra el gimnasio');
      const id = store.getState().messages.at(-1)!.id;

      await store.getState().confirmPendingActivity(id);

      expect(store.getState().messages.at(-1)?.isError).toBe(true);
      expect(store.getState().isThinking).toBe(false);
    });
  });
});
