/**
 * La cadena semanal.
 *
 * Semana fija de lunes a domingo: el lunes del 12/09/2026 es el 07/09. Los
 * días pasados con algo hecho van llenos, hoy lleva anillo, y los que aún no
 * llegan van apagados.
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import { RachaSemanal } from '../RachaSemanal';
import { COLORS } from '../../../theme/colors';

/** Sábado 12 de septiembre de 2026. Su semana va del 07 al 13. */
const HOY = new Date(2026, 8, 12);

describe('RachaSemanal', () => {
  it('dibuja los siete días de la semana actual, de lunes a domingo', async () => {
    const vista = await render(<RachaSemanal hechos={[]} hoy={HOY} />);

    expect(vista.getByTestId('racha-dia-2026-09-07')).toBeTruthy();
    expect(vista.getByTestId('racha-dia-2026-09-13')).toBeTruthy();
    expect(vista.queryByTestId('racha-dia-2026-09-06')).toBeNull();
    expect(vista.queryByTestId('racha-dia-2026-09-14')).toBeNull();
  });

  it('llena los días con algo hecho', async () => {
    const vista = await render(
      <RachaSemanal hechos={['2026-09-08', '2026-09-10']} hoy={HOY} />
    );

    const lleno = vista.getByTestId('racha-dia-2026-09-08');
    const vacio = vista.getByTestId('racha-dia-2026-09-09');
    expect(lleno).toHaveStyle({ backgroundColor: COLORS.warning });
    expect(vacio).not.toHaveStyle({ backgroundColor: COLORS.warning });
  });

  it('hoy se marca con un anillo', async () => {
    const vista = await render(<RachaSemanal hechos={[]} hoy={HOY} />);

    expect(vista.getByTestId('racha-dia-2026-09-12')).toHaveStyle({
      borderWidth: 2,
    });
  });

  it('los días que no llegaron van apagados', async () => {
    const vista = await render(<RachaSemanal hechos={[]} hoy={HOY} />);

    expect(vista.getByTestId('racha-dia-2026-09-13')).toHaveStyle({
      opacity: 0.3,
    });
    expect(vista.getByTestId('racha-dia-2026-09-07')).not.toHaveStyle({
      opacity: 0.3,
    });
  });
});