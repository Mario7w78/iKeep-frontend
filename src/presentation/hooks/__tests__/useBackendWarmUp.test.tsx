/**
 * Waking the backend on mount only covers a cold app launch. The common case
 * is different: the user leaves the app open, switches away for a while, and
 * comes back to an instance that fell asleep meanwhile. Returning to the
 * foreground is therefore the moment that matters most.
 */

import React from 'react';
import { AppState } from 'react-native';
import { act, render } from '@testing-library/react-native';

import { warmUpBackend } from '../../../infrastructure/api/apiConfig';
import { useBackendWarmUp } from '../useBackendWarmUp';

jest.mock('../../../infrastructure/api/apiConfig', () => ({
  warmUpBackend: jest.fn(),
}));

function Probe() {
  useBackendWarmUp();
  return null;
}

describe('useBackendWarmUp', () => {
  let listener: (state: string) => void;
  let remove: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    remove = jest.fn();
    jest
      .spyOn(AppState, 'addEventListener')
      .mockImplementation((_event: any, handler: any) => {
        listener = handler;
        return { remove } as any;
      });
  });

  it('calienta el backend al montar', async () => {
    await render(<Probe />);

    expect(warmUpBackend).toHaveBeenCalledTimes(1);
  });

  it('vuelve a calentarlo al volver a primer plano', async () => {
    await render(<Probe />);

    listener('active');

    expect(warmUpBackend).toHaveBeenCalledTimes(2);
  });

  it('no lo calienta al pasar a segundo plano', async () => {
    await render(<Probe />);

    listener('background');
    listener('inactive');

    expect(warmUpBackend).toHaveBeenCalledTimes(1);
  });

  it('se desuscribe al desmontar', async () => {
    const view = await render(<Probe />);

    // React 19 programa la limpieza de efectos: sin act() el desmontaje
    // vuelve antes de que corra, y la suscripcion pareceria quedar viva.
    await act(async () => {
      view.unmount();
    });

    expect(remove).toHaveBeenCalledTimes(1);
  });
});
