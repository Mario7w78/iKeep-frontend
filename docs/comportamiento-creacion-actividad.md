# Comportamiento del Flujo de Creación de Actividades

Este documento detalla el comportamiento lógico, las reglas de validación y la estructura del asistente para la creación de nuevas actividades en la aplicación **iKeep**. El asistente recopila y valida los datos necesarios para que el algoritmo optimizador del backend pueda calendarizar las tareas de manera óptima.

## Flujo Rápido

El asistente consta de un proceso dinámico estructurado en los siguientes pasos lógicos:

1. **Definición de Datos Básicos:** Ingresar nombre de la actividad, identidad, tipo de asignación y dificultad.
2. **Priorización y Vencimiento:** Definir nivel de prioridad y fecha límite opcional.
3. **Selección de Días:** Indicar los días en los que se repetirá la actividad.
4. **Configuración de Horario (Sub-flujo iterativo):** Definir hora de inicio, duración, traslados y agregar múltiples segmentos o divisiones para los días seleccionados.
5. **Verificación y Confirmación:** Validar el resumen consolidado de la actividad antes de guardarla localmente.

---

## Detalles del Asistente (Paso a Paso)

| Paso | Pantalla / Componente | Reglas de Negocio y Comportamiento |
| :--- | :--- | :--- |
| **1** | `NameTypeStep` | <ul><li>**Nombre:** Obligatorio. Campo de texto libre.</li><li>**Identidad:** Selector entre `Clase`, `Trabajo` o `Tarea`.</li><li>**Tipo:** Selector entre `Fijo` (anclado a un horario estricto) u `Optimizable` (flexible para ser ubicado por el backend). *Nota: Si la identidad es `Clase`, el tipo se bloquea automáticamente en `Fijo`.*</li><li>**Dificultad:** Selector entre `Baja`, `Normal` o `Alta` (usado por el optimizador para estimar el desgaste de energía).</li></ul> |
| **2** | `PriorityDeadlineStep` | <ul><li>**Prioridad:** Selector entre `Baja` (mapea a prioridad `1`), `Media` (prioridad `3`) o `Alta` (prioridad `5`).</li><li>**Fecha Límite:** Switch para habilitar opcionalmente una fecha de entrega. Al activarse, renderiza un botón que abre el calendario nativo para elegir el vencimiento.</li></ul> |
| **3** | `DaySelectionStep` | <ul><li>Permite seleccionar uno o varios días del calendario de lunes a domingo.</li><li>**Bifurcación:** Si el usuario selecciona días y presiona *"Configurar horario"*, avanza al **Paso 4**. Si no selecciona nuevos días pero ya tiene configurados de antemano, presiona *"Ver resumen"* y salta al **Paso 5**.</li><li>Muestra la lista de grupos de días ya configurados para permitir su edición o eliminación.</li></ul> |
| **4** | `TimeConfigStep` | <ul><li>Define los parámetros horarios aplicados a los días elegidos en el Paso 3.</li><li>**Ocultar Hora de Inicio:** Si la actividad es de tipo `Optimizable` (no fija), se oculta el selector de "Hora de inicio" y se muestra un mensaje informativo. El algoritmo del backend decidirá el mejor horario de inicio, por lo que el usuario solo define duración y traslados.</li><li>**Clarificación de Bloques:** El título de la sección se renombró a "Horarios del día" e incluye un subtítulo aclaratorio sobre cómo añadir bloques para hacer la actividad en más de un horario el mismo día.</li><li>**Traslado "Sin":** Permite indicar la ausencia de traslado mediante la selección de un chip denominado "Sin" (equivale a 0 minutos).</li><li>**Particiones:** Permite añadir múltiples segmentos/bloques por día (por ejemplo, doble turno escolar).</li><li>**Validación al Confirmar:** Al presionar *"Guardar horario"*, se valida que (si es fija) no exceda los límites operativos ni colisione con otras actividades.</li></ul> |
| **5** | `SummaryStep` | <ul><li>Muestra una tarjeta consolidada con todas las opciones seleccionadas y los minutos totales configurados por semana.</li><li>Al presionar *"Crear actividad"*, la guarda en el repositorio local y cierra el modal.</li></ul> |

---

## Mapeo con el Modelo de Datos del Backend

Cuando el usuario solicita generar o replanificar su horario, las actividades persistidas localmente a través de `AsyncStorage` se traducen mediante el mapeador de la siguiente forma hacia los DTOs del backend:

| Propiedad Frontend | Campo Backend DTO | Tipo / Formato | Mapeo |
| :--- | :--- | :--- | :--- |
| `title` | `nombre` | `string` | Nombre legible por el usuario. |
| `identity` | `tipo` | `"clase" \| "trabajo" \| "tarea"` | Identidad de la tarea. |
| `isFixed` | DTO Destino | `actividades_fijas` o `actividades_optimizables` | Las fijas no se mueven; las optimizables se distribuyen. |
| `difficulty` | `dificultad` | `"baja" \| "media" \| "alta"` | Mapea la carga cognitiva o física. |
| `priority` | `prioridad` | `number` (0 a 5) | `Baja -> 1`, `Media -> 3`, `Alta -> 5`. |
| `deadline` | `fecha_limite` | `string (ISO 8601) \| null` | Fecha límite para finalizar la actividad. |
| `daysConfig` | `dia` | `number` (0 a 6) | `Lunes -> 0` hasta `Domingo -> 6`. |
| `startHour` | `hora_inicio` | `number` (minutos desde medianoche) | Ejemplo: `08:00` se traduce a `480` minutos. |
| `endHour` | `hora_fin` | `number` (minutos desde medianoche) | Ejemplo: `09:00` se traduce a `540` minutos. |

---

## Listado de Verificación para Desarrolladores

- [ ] Validar que un cambio en la Identidad (`Clase`) mantenga bloqueado el switch a `Fijo`.
- [ ] Comprobar que al presionar "Atrás" desde el Paso 4 (configuración de horas) se limpie la selección temporal de días en el Paso 3.
- [ ] Asegurar que el cálculo de `minutos desde medianoche` convierta adecuadamente formatos AM/PM y respete zonas horarias.
- [ ] Confirmar que las validaciones de solapamiento en `useTimeForm.ts` devuelvan mensajes de alerta claros al usuario final.
