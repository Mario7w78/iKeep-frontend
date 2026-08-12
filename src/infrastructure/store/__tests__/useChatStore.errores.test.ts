/**
 * Lo que el chat muestra cuando algo falla.
 *
 * Un codigo de estado no le dice nada al usuario y lo asusta: "El servidor
 * respondio 500" no es informacion, es ruido con aspecto de culpa suya.
 */

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

import { BackendError } from '../../api/backendClient';
import { mensajeParaElUsuario } from '../chatErrorMessages';

describe('errores tecnicos', () => {
  it('un 500 no muestra el numero', () => {
    const texto = mensajeParaElUsuario(new BackendError('El servidor respondio 500.', 500));

    expect(texto).not.toMatch(/500/);
    expect(texto.length).toBeGreaterThan(10);
  });

  it('un tiempo agotado se explica como espera, no como falla', () => {
    const texto = mensajeParaElUsuario(
      new BackendError('El servidor tardo demasiado en responder.', null)
    );

    expect(texto).not.toMatch(/servidor/i);
  });

  it('sin sesion se dice que hay que entrar de nuevo', () => {
    const texto = mensajeParaElUsuario(new BackendError('No hay sesion activa.', 401));

    expect(texto.toLowerCase()).toMatch(/sesi[oó]n/);
  });

  it('nunca aparece la palabra BackendError', () => {
    for (const codigo of [400, 401, 409, 429, 500, 503, null]) {
      const texto = mensajeParaElUsuario(new BackendError('lo que sea', codigo as any));
      expect(texto).not.toMatch(/BackendError|Error:/);
    }
  });
});

describe('errores que si le importan al usuario', () => {
  it('un solapamiento se muestra tal cual: dice que corregir', () => {
    const mensaje =
      'El horario del día Lunes (10:00 - 12:00) se superpone con "Cálculo".';

    expect(mensajeParaElUsuario(new Error(mensaje))).toBe(mensaje);
  });

  it('sin mensaje cae en algo legible', () => {
    expect(mensajeParaElUsuario(new Error(''))).toMatch(/\w{4,}/);
  });
});

describe('el tono', () => {
  it('habla en espanol neutro', () => {
    const textos = [400, 429, 500, null].map((c) =>
      mensajeParaElUsuario(new BackendError('x', c as any))
    );

    // Nada de voseo ni regionalismos: la app se corrigio dos veces por esto.
    for (const t of textos) {
      expect(t).not.toMatch(/\bpodés|tenés|querés|camalote|dale\b/i);
    }
  });
});
