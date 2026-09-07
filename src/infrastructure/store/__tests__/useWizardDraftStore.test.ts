/**
 * El borrador del wizard.
 *
 * La confirmacion de descarte de la Fase 0 evita perder el trabajo por
 * accidente, pero obliga a decidir en el momento y no sirve si la app se
 * cierra sola o si el usuario quiere ir a mirar algo y volver. Con el
 * borrador guardado, cerrar deja de ser destructivo.
 */

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

import { useWizardDraftStore, BorradorWizard } from '../useWizardDraftStore';

const BASE: Omit<BorradorWizard, 'guardadoEn'> = {
  activityName: 'Calculo',
  area: 'estudio',
  identity: 'clase',
  comportamiento: 'horaFija',
  selectedDays: ['Martes'],
  daysDict: {},
  difficulty: 'media',
  priority: 'alta',
  deadline: null,
  description: '',
};

beforeEach(() => {
  useWizardDraftStore.setState({ borrador: null });
  jest.useRealTimers();
});

describe('guardar y recuperar', () => {
  it('sin nada guardado no devuelve nada', () => {
    expect(useWizardDraftStore.getState().recuperar()).toBeNull();
  });

  it('devuelve lo que se guardo', () => {
    useWizardDraftStore.getState().guardar(BASE);

    const recuperado = useWizardDraftStore.getState().recuperar();

    expect(recuperado?.activityName).toBe('Calculo');
    expect(recuperado?.selectedDays).toEqual(['Martes']);
  });

  it('registra cuando se guardo', () => {
    useWizardDraftStore.getState().guardar(BASE);

    expect(useWizardDraftStore.getState().recuperar()?.guardadoEn).toBeGreaterThan(0);
  });

  it('el ultimo guardado reemplaza al anterior', () => {
    useWizardDraftStore.getState().guardar(BASE);
    useWizardDraftStore.getState().guardar({ ...BASE, activityName: 'Algebra' });

    expect(useWizardDraftStore.getState().recuperar()?.activityName).toBe('Algebra');
  });
});

describe('caducidad', () => {
  it('un borrador de hace un dia ya no se ofrece', () => {
    /** Pasado ese tiempo el usuario no recuerda que estaba creando, y
     *  restaurarle un formulario a medias confunde mas que empezar limpio. */
    useWizardDraftStore.setState({
      borrador: { ...BASE, guardadoEn: Date.now() - 25 * 60 * 60 * 1000 },
    });

    expect(useWizardDraftStore.getState().recuperar()).toBeNull();
  });

  it('uno reciente si', () => {
    useWizardDraftStore.setState({
      borrador: { ...BASE, guardadoEn: Date.now() - 60 * 1000 },
    });

    expect(useWizardDraftStore.getState().recuperar()).not.toBeNull();
  });

  it('al caducar se borra, no solo se ignora', () => {
    /** Si solo se ignorara, quedaria ocupando espacio para siempre. */
    useWizardDraftStore.setState({
      borrador: { ...BASE, guardadoEn: Date.now() - 25 * 60 * 60 * 1000 },
    });

    useWizardDraftStore.getState().recuperar();

    expect(useWizardDraftStore.getState().borrador).toBeNull();
  });
});

describe('limpiar', () => {
  it('deja el wizard sin borrador', () => {
    useWizardDraftStore.getState().guardar(BASE);

    useWizardDraftStore.getState().limpiar();

    expect(useWizardDraftStore.getState().recuperar()).toBeNull();
  });
});

describe('las horas de los turnos', () => {
  /**
   * El borrador viaja por AsyncStorage, asi que pasa por JSON y los Date
   * llegan como texto ISO. El DateTimePicker exige un Date de verdad: con el
   * texto crudo revienta con "`value` prop must be an instance of Date
   * object" en cuanto el usuario toca una hora.
   */
  const CON_TURNOS = {
    ...BASE,
    daysDict: {
      Martes: {
        groupId: 1,
        partitions: [
          {
            startHour: '2026-08-11T15:00:00.000Z',
            endHour: '2026-08-11T17:00:00.000Z',
            durationTime: 120,
          },
        ],
      },
    },
  };

  it('vuelven a ser Date y no texto', () => {
    useWizardDraftStore.getState().guardar(CON_TURNOS);

    const particion = useWizardDraftStore.getState().recuperar()!.daysDict.Martes
      .partitions[0];

    expect(particion.startHour).toBeInstanceOf(Date);
    expect(particion.endHour).toBeInstanceOf(Date);
  });

  it('conservan la hora que representaban', () => {
    useWizardDraftStore.getState().guardar(CON_TURNOS);

    const particion = useWizardDraftStore.getState().recuperar()!.daysDict.Martes
      .partitions[0];

    expect(particion.startHour.toISOString()).toBe('2026-08-11T15:00:00.000Z');
  });

  it('un Date que nunca se serializo sigue siendo Date', () => {
    // El puente del chat guarda y recupera sin pasar por disco.
    useWizardDraftStore.getState().guardar({
      ...BASE,
      daysDict: {
        Martes: {
          groupId: 1,
          partitions: [
            { startHour: new Date(), endHour: new Date(), durationTime: 60 },
          ],
        },
      },
    });

    const particion = useWizardDraftStore.getState().recuperar()!.daysDict.Martes
      .partitions[0];

    expect(particion.startHour).toBeInstanceOf(Date);
  });

  it('sin dias configurados no rompe', () => {
    useWizardDraftStore.getState().guardar(BASE);

    expect(useWizardDraftStore.getState().recuperar()!.daysDict).toEqual({});
  });
});
