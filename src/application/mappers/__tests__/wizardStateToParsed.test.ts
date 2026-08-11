/**
 * La vuelta del wizard al chat.
 */

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

import { formStateToDraft } from '../formStateToDraft';
import { wizardStateToParsed } from '../wizardStateToParsed';

const ESTADO: any = {
  activityName: 'Calculo',
  identity: 'clase',
  comportamiento: 'horaFija',
  selectedDays: ['Martes'],
  daysDict: { Martes: { partitions: [] } },
  difficulty: 'alta',
  priority: 'baja',
};

describe('wizardStateToParsed', () => {
  it('traduce el eje unico de vuelta a banderas', () => {
    expect(wizardStateToParsed(ESTADO)).toMatchObject({ isFixed: true, isAnchor: false });
    expect(wizardStateToParsed({ ...ESTADO, comportamiento: 'diaFijo' }))
      .toMatchObject({ isFixed: false, isAnchor: true });
    expect(wizardStateToParsed({ ...ESTADO, comportamiento: 'flexible' }))
      .toMatchObject({ isFixed: false, isAnchor: false });
  });

  it('no toca los campos que el wizard no conoce', () => {
    /** Devolver `duracionMinutos: undefined` los borraria del parsedState. */
    const parche = wizardStateToParsed(ESTADO);

    expect('duracionMinutos' in parche).toBe(false);
    expect('dayOnlySlots' in parche).toBe(false);
    expect('horaPreferidaInicio' in parche).toBe(false);
  });

  it('ida y vuelta conserva lo que el formulario si edita', () => {
    const parsed: any = {
      activityName: 'Gimnasio',
      identity: 'tarea',
      isFixed: false,
      isAnchor: true,
      difficulty: 'baja',
      priority: 'alta',
      selectedDays: ['Lunes'],
      daysDict: { Lunes: { partitions: [] } },
    };

    const vuelta = wizardStateToParsed(formStateToDraft(parsed) as any);

    expect(vuelta).toMatchObject({
      activityName: 'Gimnasio',
      identity: 'tarea',
      isFixed: false,
      isAnchor: true,
      difficulty: 'baja',
      priority: 'alta',
      selectedDays: ['Lunes'],
    });
  });
});
