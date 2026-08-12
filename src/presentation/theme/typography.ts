import { Text, TextInput } from 'react-native';

/**
 * La tipografía de la app.
 *
 * Con una fuente del sistema, `fontWeight: '800'` alcanza. Con una fuente
 * custom no: en Android —y en iOS con familias que no son variables— el peso
 * no selecciona el archivo. Hay que nombrar la familia exacta,
 * `Nunito_800ExtraBold`, o se ve todo en regular.
 *
 * La app tiene pesos declarados en cerca de cien objetos de estilo. Migrarlos
 * uno por uno sería un diff imposible de revisar y dejaría la mitad de la app
 * con una fuente y la otra mitad con otra mientras dure.
 *
 * Así que la traducción se hace una sola vez, al arrancar: se interceptan los
 * defaults de `Text` y `TextInput` y se completa la familia a partir del peso
 * que el estilo ya declara. Nada más en la app cambia.
 */

/** Los pesos que se cargan. Agregar uno aquí obliga a cargarlo en App.tsx. */
export const FAMILIA: Record<string, string> = {
  '400': 'Nunito_400Regular',
  normal: 'Nunito_400Regular',
  '500': 'Nunito_500Medium',
  '600': 'Nunito_600SemiBold',
  '700': 'Nunito_700Bold',
  '800': 'Nunito_800ExtraBold',
  bold: 'Nunito_800ExtraBold',
  '900': 'Nunito_900Black',
};

const POR_DEFECTO = FAMILIA['400'];

/**
 * Qué archivo corresponde a un peso.
 *
 * Los pesos que no se cargaron caen al más cercano hacia abajo: es preferible
 * un texto un poco más liviano que uno que no se dibuja.
 */
export function familiaPara(peso: unknown): string {
  if (peso === undefined || peso === null) return POR_DEFECTO;
  return FAMILIA[String(peso)] ?? POR_DEFECTO;
}

/**
 * Extrae el peso de un `style`, que puede ser un objeto, un array anidado o
 * un id registrado por StyleSheet.
 */
function pesoDe(style: any): unknown {
  if (!style) return undefined;
  if (Array.isArray(style)) {
    // El último gana, igual que en la cascada de RN.
    for (let i = style.length - 1; i >= 0; i--) {
      const encontrado = pesoDe(style[i]);
      if (encontrado !== undefined) return encontrado;
    }
    return undefined;
  }
  return style.fontWeight;
}

/**
 * Devuelve el estilo con la familia puesta.
 *
 * Si el estilo ya nombra una familia, no se toca: eso es alguien pidiendo
 * algo distinto a propósito.
 */
export function conFamilia(style: any): any {
  const familia = { fontFamily: familiaPara(pesoDe(style)) };
  // La familia va primero para que un `fontFamily` explícito del estilo la
  // pise.
  return Array.isArray(style) ? [familia, ...style] : [familia, style];
}

let aplicada = false;

/**
 * Deja toda la app en Nunito. Se llama una vez, después de cargar la fuente.
 */
export function aplicarTipografiaGlobal(): void {
  if (aplicada) return;
  aplicada = true;

  for (const Componente of [Text, TextInput] as any[]) {
    const anterior = Componente.render;
    if (typeof anterior !== 'function') continue;

    Componente.render = function (...args: any[]) {
      const elemento = anterior.apply(this, args);
      return elemento
        ? { ...elemento, props: { ...elemento.props, style: conFamilia(elemento.props.style) } }
        : elemento;
    };
  }
}
