/**
 * The onboarding now runs before sign-in, so it has no session to persist
 * with. It parks the day limits here and they are flushed to the backend the
 * moment a session appears.
 */

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

import { useAppStore } from '../useAppStore';

const initialState = useAppStore.getState();

beforeEach(() => {
  useAppStore.setState(initialState, true);
});

describe('horarios pendientes del onboarding', () => {
  it('arranca sin nada pendiente', () => {
    expect(useAppStore.getState().pendingDayLimits).toBeNull();
  });

  it('guarda el rango que eligio el usuario', () => {
    useAppStore.getState().setPendingDayLimits({ startHour: 420, endHour: 1380 });

    expect(useAppStore.getState().pendingDayLimits).toEqual({
      startHour: 420,
      endHour: 1380,
    });
  });

  it('los limpia una vez volcados', () => {
    useAppStore.getState().setPendingDayLimits({ startHour: 420, endHour: 1380 });

    useAppStore.getState().clearPendingDayLimits();

    expect(useAppStore.getState().pendingDayLimits).toBeNull();
  });

  it('el ultimo rango elegido reemplaza al anterior', () => {
    useAppStore.getState().setPendingDayLimits({ startHour: 400, endHour: 1300 });
    useAppStore.getState().setPendingDayLimits({ startHour: 480, endHour: 1320 });

    expect(useAppStore.getState().pendingDayLimits).toEqual({
      startHour: 480,
      endHour: 1320,
    });
  });
});

describe('estado del onboarding', () => {
  it('empieza sin haberlo visto', () => {
    expect(useAppStore.getState().hasSeenOnboarding).toBe(false);
  });

  it('recuerda que ya se completo', () => {
    useAppStore.getState().setHasSeenOnboarding(true);

    expect(useAppStore.getState().hasSeenOnboarding).toBe(true);
  });
});
