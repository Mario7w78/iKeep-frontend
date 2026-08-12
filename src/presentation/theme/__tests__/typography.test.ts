/**
 * La traduccion de peso a familia.
 *
 * Con una fuente custom, `fontWeight: '800'` no selecciona el archivo: hay
 * que nombrar la familia exacta o se ve todo en regular.
 */

import { conFamilia, familiaPara } from '../typography';

describe('familiaPara', () => {
  it('traduce los pesos que la app usa', () => {
    expect(familiaPara('800')).toBe('Nunito_800ExtraBold');
    expect(familiaPara('900')).toBe('Nunito_900Black');
    expect(familiaPara('600')).toBe('Nunito_600SemiBold');
  });

  it('sin peso declarado usa el regular', () => {
    expect(familiaPara(undefined)).toBe('Nunito_400Regular');
    expect(familiaPara(null)).toBe('Nunito_400Regular');
  });

  it('un peso que no se cargo no deja el texto sin dibujar', () => {
    // Preferible un poco mas liviano que invisible.
    expect(familiaPara('250')).toBe('Nunito_400Regular');
  });

  it('acepta los alias de RN', () => {
    expect(familiaPara('bold')).toBe('Nunito_800ExtraBold');
    expect(familiaPara('normal')).toBe('Nunito_400Regular');
  });
});

describe('conFamilia', () => {
  it('completa la familia segun el peso del estilo', () => {
    const salida = conFamilia({ fontWeight: '900', fontSize: 20 });

    expect(salida[0].fontFamily).toBe('Nunito_900Black');
  });

  it('en un array gana el ultimo peso, igual que la cascada de RN', () => {
    const salida = conFamilia([{ fontWeight: '400' }, { fontWeight: '800' }]);

    expect(salida[0].fontFamily).toBe('Nunito_800ExtraBold');
  });

  it('ignora las capas falsy de un estilo condicional', () => {
    const salida = conFamilia([{ fontWeight: '600' }, false, undefined]);

    expect(salida[0].fontFamily).toBe('Nunito_600SemiBold');
  });

  it('una familia explicita del estilo pisa a la nuestra', () => {
    // Alguien pidiendo otra fuente a proposito.
    const salida = conFamilia({ fontFamily: 'Courier', fontWeight: '800' });
    const plano = Object.assign({}, ...salida.filter(Boolean));

    expect(plano.fontFamily).toBe('Courier');
  });

  it('sin estilo tampoco rompe', () => {
    expect(conFamilia(undefined)[0].fontFamily).toBe('Nunito_400Regular');
  });
});
