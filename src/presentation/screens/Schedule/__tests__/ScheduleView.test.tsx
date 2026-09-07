/**
 * ScheduleView en modo mes.
 *
 * La mitad de crear que no se ve en el wizard: al volver, el calendario se
 * recarga solo. Sin esto, la actividad recien creada no aparece hasta que el
 * usuario refresque a mano.
 */

import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

// El callback de foco se captura para poder dispararlo cuando queramos,
// simulando la vuelta del wizard sin un navegador completo.
const mockNavigate = jest.fn();
let mockFocusCb: (() => void) | undefined;
async function dispararFoco() {
  // Async y esperado: el act sincronico mezcla scopes y contamina el
  // siguiente render en RNTL v14.
  await act(async () => { mockFocusCb?.(); });
}

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
  // El foco real dispara una vez por enfocado, no en cada cambio de estado:
  // corremos el callback al montar y `dispararFoco` ejecuta siempre el mas
  // reciente (el del render vigente).
  useFocusEffect: (cb: () => void) => {
    const { useEffect, useRef } = require('react');
    const ultimo = useRef(cb);
    ultimo.current = cb;
    useEffect(() => {
      mockFocusCb = () => ultimo.current();
      ultimo.current();
    }, []);
  },
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: (props: any) => {
    const { View } = require('react-native');
    const { children, style, ...rest } = props;
    return <View style={style} {...rest}>{children}</View>;
  },
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(), getItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn(), clear: jest.fn(),
}));

const mockVer = jest.fn();
const mockGuardar = jest.fn();
const mockBorrar = jest.fn();
jest.mock('../../../../infrastructure/api/CalendarApiService', () => ({
  verCalendario: (...a: any[]) => mockVer(...a),
  guardarExcepcion: (...a: any[]) => mockGuardar(...a),
  borrarExcepcion: (...a: any[]) => mockBorrar(...a),
  MAXIMO_DIAS: 120,
  aFechaLocal: (d: Date) => {
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${m}-${dd}`;
  },
}));

// Lo de google se simula en el borde HTTP: el store queda real, que es lo
// que ScheduleView usa.
const mockGoogleEstado = jest.fn();
const mockGoogleCargarEventos = jest.fn();
jest.mock('../../../../infrastructure/api/GoogleCalendarApiService', () => ({
  iniciarConexion: jest.fn(),
  consultarEstado: (...a: any[]) => mockGoogleEstado(...a),
  cargarEventos: (...a: any[]) => mockGoogleCargarEventos(...a),
  desconectar: jest.fn(),
}));

// Stub del picker nativo: capturamos props para disparar onChange a mano.
const mockPickerProps: { current: any } = { current: null };
jest.mock('@react-native-community/datetimepicker', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: (props: any) => {
      mockPickerProps.current = props;
      return <View testID="datetimepicker-stub" />;
    },
  };
});

jest.mock('../../../../infrastructure/persistence/EnergyHistoryService', () => ({
  saveEnergyRecord: jest.fn(), makeEnergyRecord: jest.fn(), getEnergyHistory: jest.fn(),
}));

const mockSetSelectedDay = jest.fn();

// Project's Jest config allows mock-prefixed vars in jest.mock factories.
// Zustand's create() runs its initializer synchronously AT FACTORY TIME, which
// happens during import hoisting — before mockSetSelectedDay is assigned. So
// the store is created with placeholder setters and the real jest.fn()s are
// injected in beforeEach via the store API.
let mockScheduleStoreApi: { setState: (partial: Partial<any>) => void };
jest.mock('../../../../di/Dependencies', () => {
  const { create } = require('zustand');
  const useScheduleStoreMock = create(() => ({
    activitiesForDay: () => [],
    handleGenerateSchedule: jest.fn(),
    isLoading: false,
    schedule: { getAllItems: () => [{ id: 'x' }], getItemsByDay: () => [] },
    selectedDay: 'Lunes',
    setSelectedDay: jest.fn(),
    startHour: 8,
    endHour: 22,
    perDayStartHours: null,
    perDayEndHours: null,
    calendarViewMode: 'grid',
    setCalendarViewMode: jest.fn(),
  }));
  mockScheduleStoreApi = useScheduleStoreMock;
  const useActivityStoreMock = (selector: any) => {
    const state = { activities: [], loadActivities: mockLoadActivities, isLoading: false };
    return selector ? selector(state) : state;
  };
  return {
    useScheduleStore: useScheduleStoreMock,
    useActivityStore: useActivityStoreMock,
  };
});

const mockLoadActivities = jest.fn();

// Componentes ajenos a lo probado: su arbol de dependencias no aporta nada aqui.
jest.mock('../../../components/organisms/Schedule/ActivityDetailModal', () => ({
  ActivityDetailModal: () => null,
}));
jest.mock('../../../components/molecules/Energy/EnergyPicker', () => ({
  EnergyPicker: () => null,
}));

// El encabezado real dibuja iconos y dias; para este test basta con un boton
// que gire el modo de vista igual que el original.
jest.mock('../../../components/organisms/Schedule/ScheduleHeader', () => ({
  ScheduleHeader: ({ onToggleViewMode }: any) => {
    const { TouchableOpacity, Text } = require('react-native');
    return (
      <TouchableOpacity testID="toggle-vista" onPress={onToggleViewMode}>
        <Text>toggle</Text>
      </TouchableOpacity>
    );
  },
}));

import ScheduleView from '../ScheduleView';
import { useCalendarStore } from '../../../../infrastructure/store/useCalendarStore';
import { useGoogleCalendarStore } from '../../../../infrastructure/store/useGoogleCalendarStore';

describe('ScheduleView en modo mes', () => {
  let alertaEspia: jest.SpyInstance;

  beforeEach(() => {
    // Sin clearAllMocks global: borra implementaciones de mocks internos de
    // RNTL/RN y deja el siguiente render con el arbol vacio.
    mockVer.mockReset().mockResolvedValue([]);
    mockGuardar.mockReset().mockResolvedValue(undefined);
    mockBorrar.mockReset().mockResolvedValue(undefined);
    mockNavigate.mockClear();
    mockSetSelectedDay.mockClear();
    mockLoadActivities.mockReset().mockResolvedValue(undefined);
    // El store simulado vive fuera del mock factory (hoisting): se le
    // reinyectan los jest.fn y los setters que mutan de verdad, para que
    // irAMes (dos toques del toggle) cambie grid -> list -> mes.
    mockScheduleStoreApi.setState({
      setSelectedDay: mockSetSelectedDay,
      calendarViewMode: 'grid',
      setCalendarViewMode: (mode: any) =>
        mockScheduleStoreApi.setState({ calendarViewMode: mode }),
    });
    alertaEspia = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    useCalendarStore.setState({
      mesVisible: new Date(2026, 8, 15),
      porDia: {},
      cargando: false,
      error: null,
      canceladasEnSesion: [],
    });
  });

  afterEach(() => {
    alertaEspia.mockRestore();
  });

  // RNTL v14: render es async.
  function montar() {
    return render(<ScheduleView />);
  }

  describe('la sincronizacion de google (importar-google-calendar)', () => {
    beforeEach(() => {
      mockGoogleEstado.mockReset().mockResolvedValue(false);
      mockGoogleCargarEventos.mockReset().mockResolvedValue({
        conectado: true, eventos: [], diasPorEvento: {},
      });
      useGoogleCalendarStore.setState({
        estado: 'conectado', porDia: {}, cargando: false, error: null, verificado: true,
      });
    });

    it('entrar al modo mes sincroniza el MISMO rango que la cuadricula', async () => {
      const vista = await montar();
      await irAMes(vista);

      await waitFor(() => expect(mockGoogleCargarEventos).toHaveBeenCalled());
      // Septiembre 2026: lunes 31/8 al domingo 4/10, bordes de semana.
      expect(mockGoogleCargarEventos).toHaveBeenCalledWith('2026-08-31', '2026-10-04');
      // Conectado y verificado: ni una llamada a /estado de mas.
      expect(mockGoogleEstado).not.toHaveBeenCalled();
      await vista.unmount();
    });

    it('los importados llegan al grid con su punto propio', async () => {
      mockVer.mockResolvedValue([]);
      mockGoogleCargarEventos.mockResolvedValue({
        conectado: true,
        eventos: [{ id: 'g-1', titulo: 'Dentista', inicio: '2026-09-10T13:00:00Z', fin: '2026-09-10T14:00:00Z', todoElDia: false }],
        diasPorEvento: { 'g-1': ['2026-09-10'] },
      });

      const vista = await montar();
      await irAMes(vista);

      expect(await vista.findByTestId('punto-importado-g-1-2026-09-10')).toBeTruthy();
      await vista.unmount();
    });

    it('desconectado conocido: navegar meses dispara CERO llamadas google', async () => {
      // spec external-events-ui: tras desconectar, cero llamadas. El store
      // corta ANTES de la red; la pantalla solo tiene que no forzar nada.
      useGoogleCalendarStore.setState({ estado: 'desconectado', verificado: true });
      const vista = await montar();
      await irAMes(vista);

      await waitFor(() => expect(mockVer).toHaveBeenCalled());
      await act(async () => { fireEvent.press(vista.getByTestId('mes-siguiente')); });
      await waitFor(() => expect(mockVer).toHaveBeenCalledTimes(2));

      expect(mockGoogleCargarEventos).not.toHaveBeenCalled();
      expect(mockGoogleEstado).not.toHaveBeenCalled();
      await vista.unmount();
    });

    it('cambiar de mes vuelve a sincronizar, ahora con el rango nuevo', async () => {
      const vista = await montar();
      await irAMes(vista);
      await waitFor(() => expect(mockGoogleCargarEventos).toHaveBeenCalledTimes(1));

      await act(async () => { fireEvent.press(vista.getByTestId('mes-siguiente')); });

      await waitFor(() => expect(mockGoogleCargarEventos).toHaveBeenCalledTimes(2));
      // Octubre 2026: lunes 28/9 al domingo 1/11.
      expect(mockGoogleCargarEventos).toHaveBeenLastCalledWith('2026-09-28', '2026-11-01');
      await vista.unmount();
    });

    it('un fallo de google NO rompe la pantalla del mes', async () => {
      mockGoogleCargarEventos.mockRejectedValue(new Error('sin red'));
      jest.spyOn(console, 'warn').mockImplementation(() => {});

      const vista = await montar();
      await irAMes(vista);

      // El calendario propio carga igual; el grid esta ahi.
      await waitFor(() => expect(mockVer).toHaveBeenCalled());
      expect(await vista.findByTestId('month-grid')).toBeTruthy();
      await vista.unmount();
    });
  });

  async function irAMes(vista: Awaited<ReturnType<typeof montar>>) {
    // El ciclo es grid -> list -> mes.
    await act(async () => { fireEvent.press(vista.getByTestId('toggle-vista')); });
    await act(async () => { fireEvent.press(vista.getByTestId('toggle-vista')); });
  }

  it('en modo grid enfocar NO pide el mes', async () => {
    const vista = await montar();
    await dispararFoco();

    expect(mockVer).not.toHaveBeenCalled();
    await vista.unmount();
  });

  it('al entrar al modo mes carga el mes sin refrescar a mano', async () => {
    const vista = await montar();
    await irAMes(vista);

    await waitFor(() => expect(mockVer).toHaveBeenCalled());
    await vista.unmount();
  });

  it('volver del wizard reenfoca y recarga el mes con lo nuevo', async () => {
    const vista = await montar();
    await irAMes(vista);
    await waitFor(() => expect(mockVer).toHaveBeenCalledTimes(1));

    // La actividad creada en el wizard ahora existe para el servidor.
    mockVer.mockResolvedValue([
      {
        fecha: '2026-09-10',
        actividad: { id: 'nueva-1', title: 'Parcial' },
        movidaDesde: null,
        esUnica: true,
      },
    ]);

    await dispararFoco();

    await waitFor(() => expect(mockVer).toHaveBeenCalledTimes(2));
    // Y lo pedido se ve: la ocurrencia nueva aparece en el detalle del día.
    await act(async () => { fireEvent.press(vista.getByTestId('dia-2026-09-10')); });
    expect(await vista.findByText('Parcial')).toBeTruthy();
    await vista.unmount();
  });

  describe('mutaciones del panel', () => {
    const OCURRENCIA = {
      fecha: '2026-09-10',
      actividad: { id: 'act-1', title: 'Examen' },
      movidaDesde: null,
      esUnica: false,
    };

    async function montarConOcurrencia() {
      mockVer.mockResolvedValue([OCURRENCIA]);
      const vista = await montar();
      await irAMes(vista);
      await waitFor(() => expect(mockVer).toHaveBeenCalledTimes(1));
      await act(async () => { fireEvent.press(vista.getByTestId('dia-2026-09-10')); });
      // La fila esta lista cuando expone sus acciones (el titulo puede estar
      // repetido en la seccion Canceladas).
      await vista.findByTestId('cancelar-act-1');
      return vista;
    }

    it('mover: la fecha elegida viaja exacta, sin drift UTC, y el mes se recarga', async () => {
      const vista = await montarConOcurrencia();

      await act(async () => { fireEvent.press(vista.getByTestId('mover-act-1')); });
      expect(vista.queryByTestId('picker-destino')).toBeTruthy();

      // El usuario gira el spinner al 12 de septiembre de 2026.
      await act(async () => { mockPickerProps.current.onChange({}, new Date(2026, 8, 12)); });
      await act(async () => { fireEvent.press(vista.getByTestId('confirmar-movimiento')); });

      // La excepcion lleva el string local exacto: ni un byte de UTC.
      await waitFor(() =>
        expect(mockGuardar).toHaveBeenCalledWith({
          activityId: 'act-1', fecha: '2026-09-10', tipo: 'movida', nuevaFecha: '2026-09-12',
        })
      );
      // Y el grid se recargo solo (Requirement: refleja mutaciones al instante).
      await waitFor(() => expect(mockVer).toHaveBeenCalledTimes(2));
      expect(vista.queryByTestId('picker-destino')).toBeNull();
      await vista.unmount();
    });

    it('cancelar pide confirmacion destructiva y deja la fila en Canceladas', async () => {
      const vista = await montarConOcurrencia();

      await act(async () => { fireEvent.press(vista.getByTestId('cancelar-act-1')); });
      expect(alertaEspia).toHaveBeenCalledWith(
        '¿Cancelar esta actividad?',
        expect.any(String),
        expect.any(Array)
      );
      const [, , botones] = alertaEspia.mock.calls[0];
      const destructivo = botones.find((b: any) => b.style === 'destructive');
      await act(async () => { destructivo.onPress(); });

      await waitFor(() =>
        expect(mockGuardar).toHaveBeenCalledWith({
          activityId: 'act-1', fecha: '2026-09-10', tipo: 'cancelada',
        })
      );
      // Tras recargar (el servidor la descarta), la fila vive en Canceladas.
      expect(await vista.findByTestId('seccion-canceladas')).toBeTruthy();
      expect(vista.getByTestId('restaurar-act-1')).toBeTruthy();
      await vista.unmount();
    });

    it('restaurar borra la excepcion y recarga', async () => {
      useCalendarStore.setState({
        canceladasEnSesion: [{ ...OCURRENCIA } as any],
      });
      const vista = await montarConOcurrencia();

      expect(await vista.findByTestId('seccion-canceladas')).toBeTruthy();
      await act(async () => { fireEvent.press(vista.getByTestId('restaurar-act-1')); });

      await waitFor(() => expect(mockBorrar).toHaveBeenCalledWith('act-1', '2026-09-10'));
      await vista.unmount();
    });

    it('un fallo avisa con Alert y Reintentar repite la misma accion', async () => {
      mockGuardar.mockRejectedValueOnce(new Error('sin red'));
      const vista = await montarConOcurrencia();

      await act(async () => { fireEvent.press(vista.getByTestId('cancelar-act-1')); });
      const [, , botonesConfirmacion] = alertaEspia.mock.calls[0];
      const destructivo = botonesConfirmacion.find((b: any) => b.style === 'destructive');
      await act(async () => { destructivo.onPress(); });

      // El PUT fallo: aparece la alerta de error con Reintentar (D4).
      await waitFor(() => expect(alertaEspia).toHaveBeenCalledTimes(2));
      const [tituloError, , botonesError] = alertaEspia.mock.calls[1];
      expect(tituloError).toContain('No pudimos cancelar');
      const reintentar = botonesError.find((b: any) => b.text === 'Reintentar');
      expect(reintentar).toBeTruthy();

      await act(async () => { reintentar.onPress(); });
      await waitFor(() => expect(mockGuardar).toHaveBeenCalledTimes(2));
      await vista.unmount();
    });
  });
});
