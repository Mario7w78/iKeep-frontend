/**
 * Reconciliar los avisos con el estado.
 */

import { AVISO_MATUTINO, AVISO_RACHA } from '../../../domain/services/reengagementReminders';
import { sincronizarAvisos } from '../SyncReengagementReminders';

function crearScheduler(permiso = 'granted') {
  return {
    getPermissionStatus: jest.fn().mockResolvedValue(permiso),
    requestPermissions: jest.fn(),
    cancelAll: jest.fn(),
    cancel: jest.fn().mockResolvedValue(undefined),
    scheduleDaily: jest.fn().mockResolvedValue('id'),
    scheduleWeekly: jest.fn(),
  } as any;
}

const CON_TODO = { rachaActual: 4, diaTerminado: false, actividadesHoy: 3 };

describe('sincronizarAvisos', () => {
  it('programa lo que corresponde', async () => {
    const scheduler = crearScheduler();

    await sincronizarAvisos(scheduler, CON_TODO);

    const programados = scheduler.scheduleDaily.mock.calls.map((c: any[]) => c[0].identifier);
    expect(programados).toEqual([AVISO_MATUTINO, AVISO_RACHA]);
  });

  it('cancela lo que dejo de corresponder', async () => {
    // Una racha que se rompe deja de avisar sin que nadie lo ordene.
    const scheduler = crearScheduler();

    await sincronizarAvisos(scheduler, { ...CON_TODO, rachaActual: 0 });

    expect(scheduler.cancel).toHaveBeenCalledWith(AVISO_RACHA);
    expect(scheduler.cancel).not.toHaveBeenCalledWith(AVISO_MATUTINO);
  });

  it('sin permiso no hace nada, ni lo pide', async () => {
    // Pedirlo aca seria sacarle un dialogo del sistema mientras marca algo.
    const scheduler = crearScheduler('undetermined');

    await sincronizarAvisos(scheduler, CON_TODO);

    expect(scheduler.scheduleDaily).not.toHaveBeenCalled();
    expect(scheduler.requestPermissions).not.toHaveBeenCalled();
  });

  it('un fallo al programar no rompe el resto', async () => {
    const scheduler = crearScheduler();
    scheduler.scheduleDaily.mockRejectedValueOnce(new Error('sin espacio'));

    await expect(sincronizarAvisos(scheduler, CON_TODO)).resolves.toBeUndefined();
    expect(scheduler.scheduleDaily).toHaveBeenCalledTimes(2);
  });

  it('un dia sin nada cancela los dos', async () => {
    const scheduler = crearScheduler();

    await sincronizarAvisos(scheduler, { rachaActual: 0, diaTerminado: false, actividadesHoy: 0 });

    expect(scheduler.cancel).toHaveBeenCalledTimes(2);
    expect(scheduler.scheduleDaily).not.toHaveBeenCalled();
  });
});
