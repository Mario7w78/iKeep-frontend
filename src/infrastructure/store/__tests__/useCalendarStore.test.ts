/**
 * El mes que se esta mirando.
 */

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(), getItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn(), clear: jest.fn(),
}));

const mockVer = jest.fn();
const mockGuardar = jest.fn();
const mockBorrar = jest.fn();
jest.mock('../../api/CalendarApiService', () => ({
  verCalendario: (...a: any[]) => mockVer(...a),
  guardarExcepcion: (...a: any[]) => mockGuardar(...a),
  borrarExcepcion: (...a: any[]) => mockBorrar(...a),
  aFechaLocal: (d: Date) => {
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${m}-${dd}`;
  },
}));

import { rangoDelMes, useCalendarStore } from '../useCalendarStore';

describe('rangoDelMes', () => {
  it('cubre las semanas completas, no solo el mes', () => {
    // Agosto 2026 empieza sabado y el 31 cae lunes: la cuadricula necesita
    // dias del mes anterior y del siguiente para completar las semanas, y
    // esos dias tambien tienen actividades.
    const { desde, hasta } = rangoDelMes(new Date(2026, 7, 15));

    expect(desde).toBe('2026-07-27');   // lunes anterior al 1
    expect(hasta).toBe('2026-09-06');   // domingo posterior al 31
  });

  it('la semana arranca el lunes', () => {
    const { desde } = rangoDelMes(new Date(2026, 7, 15));

    expect(new Date(desde + 'T12:00:00').getDay()).toBe(1);
  });

  it('un mes que ya empieza lunes no agrega relleno al inicio', () => {
    // Junio 2026 empieza lunes.
    expect(rangoDelMes(new Date(2026, 5, 10)).desde).toBe('2026-06-01');
  });
});

describe('useCalendarStore', () => {
  beforeEach(() => {
    mockVer.mockReset().mockResolvedValue([]);
    mockGuardar.mockReset().mockResolvedValue(undefined);
    mockBorrar.mockReset().mockResolvedValue(undefined);
    useCalendarStore.setState({
      mesVisible: new Date(2026, 7, 15), porDia: {}, cargando: false, error: null,
      canceladasEnSesion: [],
    });
  });

  it('agrupa las ocurrencias por dia', async () => {
    mockVer.mockResolvedValue([
      { fecha: '2026-08-04', actividad: { id: '1' }, movidaDesde: null, esUnica: false },
      { fecha: '2026-08-04', actividad: { id: '2' }, movidaDesde: null, esUnica: false },
      { fecha: '2026-08-11', actividad: { id: '1' }, movidaDesde: null, esUnica: false },
    ]);

    await useCalendarStore.getState().cargarMes();

    const { porDia } = useCalendarStore.getState();
    expect(porDia['2026-08-04']).toHaveLength(2);
    expect(porDia['2026-08-11']).toHaveLength(1);
  });

  it('cambiar de mes limpia lo anterior antes de pedir', async () => {
    useCalendarStore.setState({ porDia: { '2026-08-04': [{} as any] } });
    let durante: any = null;
    mockVer.mockImplementation(async () => {
      durante = useCalendarStore.getState().porDia;
      return [];
    });

    await useCalendarStore.getState().irAlMes(1);

    // Mostrar agosto mientras carga septiembre hace leer fechas que no son.
    expect(durante).toEqual({});
  });

  it('avanzar y retroceder vuelve al mismo mes', async () => {
    await useCalendarStore.getState().irAlMes(1);
    await useCalendarStore.getState().irAlMes(-1);

    expect(useCalendarStore.getState().mesVisible.getMonth()).toBe(7);
  });

  it('un fallo se dice, no se muestra como mes vacio', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    mockVer.mockRejectedValue(new Error('sin red'));

    await useCalendarStore.getState().cargarMes();

    expect(useCalendarStore.getState().error).toBeTruthy();
    expect(useCalendarStore.getState().cargando).toBe(false);
  });

  it('cancelar guarda la excepcion y recarga', async () => {
    await useCalendarStore.getState().cancelar('act-1', '2026-08-11');

    expect(mockGuardar).toHaveBeenCalledWith({
      activityId: 'act-1', fecha: '2026-08-11', tipo: 'cancelada',
    });
    expect(mockVer).toHaveBeenCalled();
  });

  it('mover lleva el destino', async () => {
    await useCalendarStore.getState().mover('act-1', '2026-08-11', '2026-08-13');

    expect(mockGuardar).toHaveBeenCalledWith({
      activityId: 'act-1', fecha: '2026-08-11', tipo: 'movida', nuevaFecha: '2026-08-13',
    });
  });

  it('restaurar borra la excepcion', async () => {
    await useCalendarStore.getState().restaurar('act-1', '2026-08-11');

    expect(mockBorrar).toHaveBeenCalledWith('act-1', '2026-08-11');
  });

  // calendario-mensual: el servidor descarta las canceladas del GET, asi que
  // la lista local es la unica forma de ofrecer Restaurar despues de recargar.
  describe('canceladas en sesion', () => {
    const OCURRENCIA = {
      fecha: '2026-08-11',
      actividad: { id: 'act-1', title: 'Cálculo' },
      movidaDesde: null,
      esUnica: false,
    } as any;

    it('cancelar registra antes del PUT y sobrevive a la recarga', async () => {
      useCalendarStore.setState({ porDia: { '2026-08-11': [OCURRENCIA] } });
      let durante: any = null;
      mockGuardar.mockImplementation(async () => {
        durante = useCalendarStore.getState().canceladasEnSesion;
      });

      await useCalendarStore.getState().cancelar('act-1', '2026-08-11');

      // Antes del PUT ya estaba anotada; despues de recargar (el servidor
      // la descarta) sigue estando.
      expect(durante).toHaveLength(1);
      expect(useCalendarStore.getState().canceladasEnSesion).toEqual([OCURRENCIA]);
    });

    it('cancelar algo que no esta en porDia igual registra lo justo', async () => {
      await useCalendarStore.getState().cancelar('act-9', '2026-08-11');

      expect(useCalendarStore.getState().canceladasEnSesion).toEqual([
        { fecha: '2026-08-11', actividad: { id: 'act-9' }, movidaDesde: null, esUnica: false },
      ]);
    });

    it('un fallo no deja una fila restaurable fantasma y propaga', async () => {
      useCalendarStore.setState({ porDia: { '2026-08-11': [OCURRENCIA] } });
      mockGuardar.mockRejectedValue(new Error('sin red'));
      jest.spyOn(console, 'warn').mockImplementation(() => {});

      await expect(
        useCalendarStore.getState().cancelar('act-1', '2026-08-11')
      ).rejects.toThrow('sin red');

      expect(useCalendarStore.getState().canceladasEnSesion).toEqual([]);
    });

    it('restaurar quita la fila de la lista y recarga', async () => {
      useCalendarStore.setState({ canceladasEnSesion: [OCURRENCIA] });

      await useCalendarStore.getState().restaurar('act-1', '2026-08-11');

      expect(mockBorrar).toHaveBeenCalledWith('act-1', '2026-08-11');
      expect(useCalendarStore.getState().canceladasEnSesion).toEqual([]);
      expect(mockVer).toHaveBeenCalled();
    });

    it('cambiar de mes limpia las canceladas', async () => {
      useCalendarStore.setState({ canceladasEnSesion: [OCURRENCIA] });

      await useCalendarStore.getState().irAlMes(1);

      expect(useCalendarStore.getState().canceladasEnSesion).toEqual([]);
    });
  });
});
