/**
 * El puente del chat al wizard.
 *
 * Hoy los dos caminos estan incomunicados: si el asistente casi acierta, el
 * usuario tiene que cancelar y rehacer todo a mano.
 */

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

import { formStateToDraft } from '../formStateToDraft';

const BASE: any = {
  activityName: 'Calculo',
  identity: 'clase',
  isFixed: true,
  isAnchor: false,
  difficulty: 'alta',
  priority: 'baja',
  selectedDays: ['Martes'],
  daysDict: { Martes: { partitions: [] } },
};

describe('formStateToDraft', () => {
  it('lleva el nombre y la identidad', () => {
    const borrador = formStateToDraft(BASE);

    expect(borrador.activityName).toBe('Calculo');
    expect(borrador.identity).toBe('clase');
  });

  it('traduce las banderas al eje unico', () => {
    expect(formStateToDraft(BASE).comportamiento).toBe('horaFija');
    expect(formStateToDraft({ ...BASE, isFixed: false, isAnchor: true }).comportamiento).toBe('diaFijo');
    expect(formStateToDraft({ ...BASE, isFixed: false, isAnchor: false }).comportamiento).toBe('flexible');
  });

  it('conserva dificultad y prioridad', () => {
    /** Justo lo que el acoplamiento viejo pisaba. */
    const borrador = formStateToDraft(BASE);

    expect(borrador.difficulty).toBe('alta');
    expect(borrador.priority).toBe('baja');
  });

  it('lleva los dias y su configuracion', () => {
    const borrador = formStateToDraft(BASE);

    expect(borrador.selectedDays).toEqual(['Martes']);
    expect(borrador.daysDict).toHaveProperty('Martes');
  });

  it('un estado vacio no explota', () => {
    const borrador = formStateToDraft({ isFixed: false, isAnchor: false } as any);

    expect(borrador.activityName).toBe('');
    expect(borrador.selectedDays).toEqual([]);
  });
});
