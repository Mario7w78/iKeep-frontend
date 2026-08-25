import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import CreateActivityView from '../CreateActivityView';
import { LayoutAnimation } from 'react-native';

// Mock required modules
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

jest.mock('../../../../../infrastructure/api/ScheduleApiService', () => ({
  ScheduleApiService: jest.fn().mockResolvedValue({
    estado: 'FACTIBLE',
    bloques: [],
    mensaje: 'Generado con éxito',
    recomendaciones: [],
    tareas_omitidas: [],
  }),
}));

// Captura el comando que la pantalla manda al store al guardar. Vive aca
// para que los tests de flujo puedan afirmar sobre el payload real.
let comandoCapturado: any = null;
// Prefijo `mock` obligatorio: los factories de jest.mock no pueden leer
// variables del scope salvo las que empiezan asi.
const mockHandleCreateActivity = jest.fn(async (comando: any) => {
  comandoCapturado = comando;
  return 'act-nueva';
});

// Los stores reales tocan red y Supabase; el wizard solo necesita leerlos.
jest.mock('../../../../../di/Dependencies', () => ({
  useActivityStore: jest.fn((selector?: any) => {
    const state = {
      activities: [],
      isLoading: false,
      handleCreateActivity: mockHandleCreateActivity,
    };
    return selector ? selector(state) : state;
  }),
  useScheduleStore: Object.assign(
    jest.fn((selector?: any) => {
      const state = {
        startHour: 0,
        endHour: 1440,
        schedule: undefined,
        handleGenerateSchedule: jest.fn().mockResolvedValue(undefined),
      };
      return selector ? selector(state) : state;
    }),
    { getState: () => ({ schedule: undefined }) }
  ),
  useChatStore: jest.fn((selector?: any) =>
    selector ? selector({ resolverPropuestaDesdeWizard: jest.fn() }) : {}
  ),
}));

// Mock AsyncStorage since it is used in the repository
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock LayoutAnimation
if (LayoutAnimation) {
  LayoutAnimation.configureNext = jest.fn();
  (LayoutAnimation as any).Presets = {
    easeInEaseOut: 'easeInEaseOut',
    easeIn: 'easeIn',
    easeOut: 'easeOut',
    keyboard: 'keyboard',
    linear: 'linear',
    spring: 'spring',
  };
}

describe('CreateActivityView - Manual Wizard Flow', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
    setParams: jest.fn(),
  };

  const mockRoute = {
    params: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // El wizard bajo de cuatro pasos a dos: nombre y dias eran la misma
  // decision partida en dos pantallas, y el resumen era un eco de solo
  // lectura que ahora va plegado al pie de los horarios.
  it('renders directly to Step 1 (manual form) instead of showing mode selection', async () => {
    const { getByText, getByPlaceholderText, queryByText } = await render(
      <CreateActivityView navigation={mockNavigation} route={mockRoute} />
    );

    // Verify header title and progress subtitle indicate step 1
    expect(getByText('Nueva Actividad')).toBeTruthy();
    expect(getByText('Paso 1 de 2')).toBeTruthy();

    // Verify that manual step 1 elements are directly visible
    expect(getByText('Nombre de la actividad')).toBeTruthy();
    expect(getByPlaceholderText('Ej. Seminario, Trabajo...')).toBeTruthy();

    // Verify choose mode step options are NOT visible
    expect(queryByText('Texto libre')).toBeNull();
    expect(queryByText('Formulario manual')).toBeNull();
  });

  // calendario-mensual: el wizard con preset de fecha puntual.
  describe('modo solo día (fechaUnica)', () => {
    it('muestra "Solo este día" con la fecha del preset y sin selectores de días', async () => {
      const vista = await render(
        <CreateActivityView
          navigation={mockNavigation}
          route={{ params: { fechaUnica: '2026-09-10' } }}
        />
      );

      expect(vista.getByTestId('solo-este-dia')).toBeTruthy();
      expect(vista.getByText('Solo este día: 2026-09-10')).toBeTruthy();
    });

    it('un preset con forma inválida degrada al flujo estándar', async () => {
      const vista = await render(
        <CreateActivityView
          navigation={mockNavigation}
          route={{ params: { fechaUnica: '10/09/2026' } }}
        />
      );

      expect(vista.queryByTestId('solo-este-dia')).toBeNull();
    });

    it('guardar manda fecha_unica al comando y NO días recurrentes', async () => {
      const vista = await render(
        <CreateActivityView
          navigation={mockNavigation}
          route={{ params: { fechaUnica: '2026-09-10' } }}
        />
      );

      // act alrededor de cada paso: sin él, el press lee estado viejo.
      await act(async () => {
        fireEvent(
          vista.getByPlaceholderText('Ej. Seminario, Trabajo...'),
          'onChangeText',
          'Parcial'
        );
      });
      await act(async () => {
        fireEvent.press(vista.getByText('Continuar a horarios'));
      });
      await act(async () => {
        fireEvent.press(vista.getByText('Crear actividad'));
      });

      await waitFor(() => expect(mockHandleCreateActivity).toHaveBeenCalled());

      // El 2026-09-10 es jueves: ese día sintético carga la config horaria.
      const comando = comandoCapturado;
      expect(comando.activityName).toBe('Parcial');
      expect(comando.fechaUnica).toBe('2026-09-10');
      expect(comando.days).toEqual([]);
      expect(Object.keys(comando.daysConfig)).toContain('Jueves');
    });
  });
});
