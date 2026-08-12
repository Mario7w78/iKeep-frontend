# Marca

`AppLogo.svg` es el original. Todo lo que hay en `assets/` sale de acá, así
que un cambio de logo se hace sobre este archivo y se regenera — no se editan
los PNG a mano.

## Cómo se generó

`rsvg-convert` a 2048 px y de ahí se reduce a cada tamaño. Renderizar directo
al tamaño final ensucia los bordes curvos; reducir desde el doble los deja
limpios.

El logo es plano —sin filtros ni degradados—, que para un icono es lo que
conviene: a 60 px, que es como se ve en la pantalla de inicio, un degradado
se convierte en barro y una silueta clara sigue leyéndose.

| Archivo | Tamaño | Ocupación | Por qué |
|---|---|---|---|
| `icon.png` | 1024 | 80 % | iOS **no acepta transparencia**: sin fondo opaco el icono sale negro |
| `splash-icon.png` | 1024 | 62 % | El splash ya pinta `#2C2E3C` y usa `contain`, así que acá sí sirve el alfa |
| `android-icon-foreground.png` | 512 | 66 % | Es el borde de la zona segura del icono adaptativo; más grande y la máscara del lanzador le corta la cara |
| `android-icon-background.png` | 512 | — | `#2C2E3C` liso |
| `android-icon-monochrome.png` | 432 | 66 % | Silueta para los iconos temáticos de Android |
| `favicon.png` | 48 | 92 % | Web |

## El monocromo

Android lo recolorea según el fondo de pantalla del usuario, así que el color
propio no importa: solo la forma. Rellenar la silueta entera deja un borrón
sin cara — las pupilas y la boca se dejan como **huecos**, y eso es lo que
hace que se lea como un sapo.

Se recorta por luminancia (umbral 80) y no solo por alfa: con alfa sola entra
también el resplandor difuminado de los ojos y la silueta se redondea.

## El fondo

`#2C2E3C`, el mismo de la app. El de Android era `#E6F4FE`, celeste claro, y
sobre eso el verde del sapo pierde contraste.

## Antes de dar por bueno un logo nuevo

Comparar la mitad izquierda del render contra la derecha espejada. Una versión
anterior traía un filtro de desenfoque en un solo ojo —al simplificar el arte
quedó en uno y no en el otro—, y el resultado era una pupila con brillo de
esfera y la otra recortada como media luna. En pantalla grande no salta;
como icono, sí.
