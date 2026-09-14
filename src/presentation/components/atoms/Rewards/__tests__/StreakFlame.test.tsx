/**
 * La llama de la racha.
 *
 * Lo que importa no es el fuego sino su semántica: nunca se apaga mientras
 * haya algo que perder, y el riesgo se cuenta (anillo) en vez de apagarse
 * (gris). Los dígitos se pueden ocultar: el día difícil no se cifra.
 */

import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

import { StreakFlame } from '../StreakFlame';

describe('StreakFlame', () => {
  it('muestra los días seguidos como número', async () => {
    const vista = await render(<StreakFlame dias={5} enRiesgo={false} />);

    expect(vista.getByText('5')).toBeTruthy();
  });

  it('en cero no aparece: un contador vacío no motiva', async () => {
    const vista = await render(<StreakFlame dias={0} enRiesgo={false} />);

    expect(vista.queryByTestId('streak-flame')).toBeNull();
  });

  it('la llama sigue encendida en riesgo; el anillo es el que avisa', async () => {
    const vista = await render(
      <StreakFlame dias={3} enRiesgo restaDelDia={0.5} />
    );

    expect(vista.queryByTestId('streak-flame')).toBeTruthy();
    expect(vista.getByTestId('streak-anillo')).toBeTruthy();
    expect(vista.getByLabelText(/en riesgo/)).toBeTruthy();
  });

  it('sin dato del día el anillo no se dibuja', async () => {
    const vista = await render(<StreakFlame dias={3} enRiesgo />);

    expect(vista.queryByTestId('streak-anillo')).toBeNull();
  });

  it('el número se puede ocultar (el día difícil no se cifra)', async () => {
    const vista = await render(
      <StreakFlame dias={3} enRiesgo={false} mostrarNumero={false} />
    );

    expect(vista.getByTestId('streak-flame')).toBeTruthy();
    expect(vista.queryByText('3')).toBeNull();
  });
});