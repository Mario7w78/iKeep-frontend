import React from 'react';
import { render } from '@testing-library/react-native';
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

  it('renders directly to Step 1 (manual form) instead of showing mode selection', async () => {
    const { getByText, getByPlaceholderText, queryByText } = await render(
      <CreateActivityView navigation={mockNavigation} route={mockRoute} />
    );

    // Verify header title and progress subtitle indicate step 1
    expect(getByText('Nueva Actividad')).toBeTruthy();
    expect(getByText('Paso 1 de 4')).toBeTruthy();

    // Verify that manual step 1 elements are directly visible
    expect(getByText('Nombre de la actividad')).toBeTruthy();
    expect(getByPlaceholderText('Ej. Seminario de investigación o Trabajo')).toBeTruthy();

    // Verify choose mode step options are NOT visible
    expect(queryByText('Texto libre')).toBeNull();
    expect(queryByText('Formulario manual')).toBeNull();
  });
});
