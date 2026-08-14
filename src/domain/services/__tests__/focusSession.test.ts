/**
 * La sesion enfocada.
 *
 * Forest no sirve tal cual, y fui yo quien lo propuso. Matar el arbol al
 * salir de la app es exactamente lo que no hay que hacer: `AppState` no
 * distingue "se fue a Instagram" de "le escribio la madre" ni de "bloqueo la
 * pantalla para leer el libro".
 */

import {
  estadoDe,
  iniciar,
  minutosAcreditables,
  progreso,
  registrarSalida,
  transcurrido,
} from '../focusSession';

const INICIO = new Date('2026-08-14T09:00:00.000Z');
const luego = (minutos: number) =>
  new Date(INICIO.getTime() + minutos * 60000);

const sesion = () => iniciar('act-1', 25, INICIO);

describe('el tiempo sale del reloj, no de un contador', () => {
  it('cuenta los minutos transcurridos', () => {
    expect(transcurrido(sesion(), luego(10))).toBe(10);
  });

  it('sobrevive a que la app deje de existir', () => {
    // iOS suspende el JS al rato de irse a background. Un contador que suma
    // cada segundo se queda dormido y la sesion cuenta de MENOS, justo cuando
    // el usuario hizo lo correcto: guardar el telefono.
    const s = sesion();

    // Nadie llamo a nada en el medio; el reloj siguio igual.
    expect(transcurrido(s, luego(40))).toBe(40);
  });

  it('nunca cuenta hacia atras', () => {
    // Si el usuario cambia la hora del telefono, cero es mejor que negativo.
    expect(transcurrido(sesion(), luego(-30))).toBe(0);
  });
});

describe('los tres estados', () => {
  it('antes de la meta esta en curso', () => {
    expect(estadoDe(sesion(), luego(10))).toBe('en_curso');
  });

  it('al llegar a la meta queda lista, no hecha', () => {
    // Nunca se marca sola. Llegar a la meta es estar lista para confirmar.
    expect(estadoDe(sesion(), luego(25))).toBe('lista');
  });

  it('sigue lista si el usuario se quedo mas rato', () => {
    expect(estadoDe(sesion(), luego(90))).toBe('lista');
  });

  it('al dia siguiente caduca', () => {
    // Empezar una sesion de 25 minutos y volver a abrir la app a la manana
    // siguiente no significa haber estudiado catorce horas. La ficcion
    // envenena el dato.
    expect(estadoDe(sesion(), luego(14 * 60))).toBe('caducada');
  });

  it('el borde de caducidad son 12 horas', () => {
    expect(estadoDe(sesion(), luego(12 * 60 - 1))).toBe('lista');
    expect(estadoDe(sesion(), luego(12 * 60))).toBe('caducada');
  });
});

describe('irse de la app', () => {
  it('no cancela nada', () => {
    // La sesion no muere: registra presencia y se puede retomar.
    const s = registrarSalida(sesion());

    expect(estadoDe(s, luego(10))).toBe('en_curso');
    expect(transcurrido(s, luego(10))).toBe(10);
  });

  it('solo se anota, y no resta', () => {
    let s = sesion();
    s = registrarSalida(s);
    s = registrarSalida(s);

    expect(s.salidas).toBe(2);
    expect(minutosAcreditables(s, luego(25))).toBe(25);
  });

  it('no muta la sesion original', () => {
    const original = sesion();
    registrarSalida(original);

    expect(original.salidas).toBe(0);
  });
});

describe('lo que se puede afirmar al terminar', () => {
  it('se recorta a la meta', () => {
    // Dejar la sesion abierta cuatro horas para una tarea de 25 minutos no
    // prueba cuatro horas de trabajo. Lo unico cierto es que la hizo.
    expect(minutosAcreditables(sesion(), luego(240))).toBe(25);
  });

  it('terminar antes acredita lo que de verdad paso', () => {
    expect(minutosAcreditables(sesion(), luego(12))).toBe(12);
  });
});

describe('el progreso que se dibuja', () => {
  it('va de 0 a 1', () => {
    expect(progreso(sesion(), INICIO)).toBe(0);
    expect(progreso(sesion(), luego(12.5))).toBeCloseTo(0.5, 1);
    expect(progreso(sesion(), luego(25))).toBe(1);
  });

  it('quedarse mas no es mas del cien por ciento', () => {
    // Es haber cumplido y seguir, no haberse pasado.
    expect(progreso(sesion(), luego(200))).toBe(1);
  });

  it('una meta de cero no divide por cero', () => {
    expect(progreso(iniciar('a', 0, INICIO), luego(5))).toBe(1);
  });
});

describe('lo que la sesion NO puede hacer', () => {
  it('no existe forma de cancelarla desde fuera', () => {
    // Es deliberado: si hubiera un `cancelar(sesion)`, alguien lo llamaria
    // desde el listener de AppState y el diseno se perderia en una sola
    // linea. Que no exista es la garantia.
    const modulo = require('../focusSession');

    expect(Object.keys(modulo)).not.toContain('cancelar');
    expect(Object.keys(modulo)).not.toContain('matar');
  });
});
