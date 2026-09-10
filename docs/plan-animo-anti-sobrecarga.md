# Plan completo: atacar los ítems del cuestionario de estrés académico (sin medición)

> Documento de trabajo. Define **acciones concretas** sobre la app para reducir
> los factores del cuestionario SISCO (estresores, síntomas y estrategias),
> **sin** encuestas, sin tablas nuevas y sin tocar la base de datos.

---

## 1. Objetivo y alcance

- **Atacar** los ítems del cuestionario mediante la funcionalidad existente, con **deltas pequeños**.
- **No medir**: no hay escalas, no hay persistencia de respuestas, no hay sondeo.
- **No alterar la app por completo**: nada de rediseños ni migraciones de datos.
- Regla transversal: **toda acción (partir en pasos, reprogramar, reemplazar) parte de una propuesta que el usuario acepta explícitamente**. Nada se ofrece "así nomás" ni se ejecuta sin consentimiento.

### Fuera de alcance (explícito)
- Encuestas, cuestionarios o escalas (1–5).
- Nuevas tablas, columnas o migraciones en Supabase.
- Cambios al sistema de energía, racha o progreso.
- Notificaciones aleatorias puras (sería ruido y haría que la gente las apague).

### Decisiones cerradas (input del usuario)

| # | Decisión |
|---|---|
| D1 | Hacer **todo lo que el usuario pida** (hora fija, día puntual, orden…), pero **siempre proponer antes de actuar**. La propuesta por defecto es: pasos optimizables sin hora fija que el solver reparte por la semana. |
| D2 | **Rompemos** la regla "solo se avisa con algo que perder o hacer": el aviso de ánimo es diario, con mensaje **variado cada día**. Mecanismo elegido: rotación por día de semana (determinista y testeable). |
| D3 | **Carry-over** sí (lo pendiente del día anterior aparece al día siguiente dentro del margen de gracia). La tarjeta **siempre pregunta primero** (hechas / no hechas / reprogramar) y **nunca actúa sin permiso**. |

---

## 2. Cómo funciona hoy (contexto para las decisiones)

| Pieza | Ubicación | Estado actual |
|---|---|---|
| Estados de una actividad | `ikeep-backend/domain/services/rewards/completion.py` | `pendiente`, `en_curso`, `sin_resolver`, `hecha`, `no_hecha`, `cancelada`. No marcar ≠ decir que no. |
| Racha / progreso | `ikeep-backend/domain/services/rewards/streak.py` | Racha = ≥1 actividad hecha por día; hoy nunca se castiga de madrugada; día sin nada programado = 100%. |
| Avisos (notificaciones) | `ikeep-app/src/domain/services/reengagementReminders.ts` | Regla: "solo se avisa cuando hay algo que perder o algo que hacer". Dos avisos: matutino y racha-en-riesgo. |
| Programación de avisos | `ikeep-app/src/infrastructure/notifications/ExpoNotificationScheduler.ts`, `SyncReengagementReminders.ts` | Diarios, reconciliados por estado; solo si el usuario dio permiso. |
| Asistente | `ikeep-backend/domain/services/assistant/system_prompt.py` | Ya exige confirmación antes de crear ("nunca guardas nada directamente"), habla neutro. |
| Cierre del día | `ikeep-app/src/presentation/components/organisms/Rewards/DayClose.tsx` / `DayRecap.tsx` | Filosofía: los números nunca juzgan, en especial en el variante `dificil`. |
| Sesión de foco | `ikeep-app/src/presentation/components/organisms/Focus/FocusSession.tsx`, `useFocusSessionStore.ts` | Ya existe un flujo de concentración. |

**Lo que ya se cumple (no hay que construirlo):**
- La app no castiga una actividad no hecha; lo que rompe la racha es el día entero sin nada marcado.
- El refuerzo positivo es filosofía explícita (Stats solo muestra lo hecho, nunca los huecos).
- El asistente ya pide confirmación antes de guardar.

---

## 3. Mapa: ítems SISCO → acciones de la app

### Dimensión Estresores
| Ítem | Acción que lo ataca |
|---|---|
| 3. Sobrecarga de tareas diarias | Avisar cuando un día queda al límite de tiempo; asistente que redistribuye (I1, I3). |
| 8. Tiempo limitado | Reprogramación / reemplazo de bloques tras un "no" (I3). |
| 9. Poca claridad de la consigna | **Partir en pasos con consentimiento**: asistente que traduce una tarea vaga en pasos concretos (I1). |
| 4–7. Profesores / exigencia | No controlables; el asistente vuelve la exigencia **explícita y manejable** al fijar pasos (I1, efecto indirecto). |

### Dimensión Síntomas
| Ítem | Acción |
|---|---|
| 10. Fatiga crónica | El check-in de energía y su reflexión ya existen; se refuerzan con el tono de I2. |
| 13. Problemas de concentración | Sesión de foco ya existe; I2 extiende el ánimo a los momentos de desgano. |
| 16. Desgano | El sistema de recompensas y celebración ya existe; I2 suma mensajes de ánimo event-driven. |

### Dimensión Estrategias de afrontamiento
| Ítem | Acción |
|---|---|
| 17–19, 22. Resolver, plan, ejecutar | El horario ES el plan; partir en pasos (I1) hace el plan explícito y ejecutable. |
| 20. Control emocional | Ánimo sin culpa, reframe tras un "no" (I2, I3). |
| 23. Destacar lo positivo | Ya es la filosofía de la app (Stats/DayRecap); I2 la hace llegar también por notificación. |

---

## 4. Entregables

### D1 — Asistente anti-sobrecarga con **consentimiento** (máximo impacto, solo texto)

**Objetivo:** que el asistente convierta una tarea grande/vaga en un plan de pasos concretos, **solo si el usuario lo acepta**, haciendo **todo lo que el usuario pida** (proponiendo antes de actuar).

**Cambio:** `ikeep-backend/domain/services/assistant/system_prompt.py`

Requisitos:

0. **Hacer lo que pida, proponiendo antes:** si el usuario pide algo concreto —hora fija, un día puntual, un orden, una sola actividad— se hace **eso**, nunca la default sobre él. La regla general no cambia: nada se guarda sin confirmación.
   - **Default propuesta:** pasos como actividades **optimizables sin hora fija** (`is_fixed=false`, con `duracion_minutos`, opcional `hora_preferida_inicio/fin` y rango de días abierto), para que el solver los reparta por la semana según energía y límites.
   - La suma de duraciones de los pasos ≈ el tiempo real de la tarea completa (nunca multiplicarla).
   - Los pasos **reemplazan** a la tarea grande; jamás crear ambas.
   - Orden: nombres numerados ("Paso 1 de 3: …") y `fecha_limite` escalonada (no hay campo de dependencias).
   - Límite de 2–3 pasos para no volver el día `INFACTIBLE`.

1. **Detección:** el asistente SOLO puede proponer partir en pasos cuando la tarea es genuinamente grande o ambigua (ej. "tengo una monografía", "estudiar para el parcial"). No lo propone para tareas normales (estudiar 1h, una lectura).
   - `SHOULD`: una tarea es "grande" si tiene más pasos verosímiles de los que una sola actividad puede capturar (subtemas, fases, entregas).

2. **Consentimiento:** partir en pasos se dispara únicamente por confirmación explícita.
   - El asistente pregunta UNA vez: "¿Quieres que la divida en pasos concretos?".
   - Si el usuario dice que no o duda, se procede con una sola actividad o solo charla. Nada de insistir, nada de partir igualmente.
   - Si el usuario dice sí, los pasos se proponen **uno a uno** con el flujo existente de `proponer_actividad`; cada actividad se guarda solo tras su confirmación.
   - `MUST NOT`: crear más de una actividad sin una confirmación explícita del plan completo o de cada paso.

3. **Coherencia con lo existente:** no se repite la invitación "la tarjeta tiene un botón para ajustar" más de una vez por conversación (ya está en el prompt actual).

4. **Tono:** sin tecnicismos, frases cortas, neutro (reglas actuales del prompt se mantienen).

**Acceptance (manual, chat):**
- "Tengo que hacer una monografía de historia" → pregunta UNAvez si partir; sin acción hasta el sí.
- "El martes tengo que estudiar" (tarea normal) → NO propone partir.
- Tras el sí, propone 2–3 pasos; nada se guarda sin la confirmación de cada uno.

### D2 — Ánimo diario con variedad (chat + notificación)

**Objetivo:** que el refuerzo positivo llegue todos los días y que el texto sea **variado diariamente**. **Decisión del usuario: se rompe deliberadamente** la regla "solo se avisa con algo que perder o hacer" — el aviso de ánimo es diario (sigue gated por el permiso). La variedad va en el *texto* (rotación por día de semana, determinista), no en el *cuándo*.

**Cambio principal (notificación):** `ikeep-app/src/domain/services/reengagementReminders.ts`

1. **Nuevo aviso de ánimo** (`AVISO_ANIMO`, id `kerotime-animo`):
   - Se agenda **todos los días** a las 20:00 (después del aviso de racha de las 19:00).
   - `TODOS_LOS_AVISOS` pasa a incluir `AVISO_ANIMO` para que el reconciler lo mantenga activo.
   - **Variedad:** `avisosQueCorresponden(estado, hoy)` toma la fecha y elige la frase con `FRASES_ANIMO[hoy.getDay() % n]` — determinista, testeable (una semana vista es siempre 7 textos distintos).
   - Excepción documentada en comentario: "regla del ruido rota por decisión del usuario".

2. **Chat:** `ikeep-backend/domain/services/assistant/system_prompt.py`
   - Instrucción: variar el elogio y, cuando el usuario reporta haber hecho algo difícil o marcado algo como hecho en la conversación, incluir una línea cálida que nombre **lo logrado**, nunca lo ausente.
   - `MUST`: no usar las mismas palabras dos días seguidos.

3. **Cierre del día:** sin cambios de lógica; el copy cálido ya existe (`DayRecap`, variante `dificil` sin números). Se verifica que siga cumpliéndose.

**Acceptance:**
- El aviso de ánimo existe siempre que haya permiso de notificaciones (independiente de racha/día).
- Una semana recorrida produce 7 textos distintos (`FRASES_ANIMO[hoy.getDay() % n]`).
- Marcar "hecha" algo difícil en el chat → el asistente responde con una línea cálida y concreta.

### D3 — Compensación honesta (reframe + reprogramar) con **carry-over**

**Objetivo:** cuando una actividad queda `no_hecha` (el usuario dijo que no), ofrecer **compensar con lo que sí hizo**, sin culpa y con reprogramación real. El pendiente que no se respondió hoy **aparece al día siguiente** (carry-over dentro del margen de gracia), y **todo se pregunta primero**: nada actúa sin permiso.

**Cambios:**

1. **Compensación post-cierre:** tras el recap del cierre, un aviso único: "¿Quieres reprogramar las que no hiciste?" → botón que reusa el mover existente. Solo un "sí" lo dispara; no se insiste.
2. **Reframe en el "no":** si el usuario dice que una actividad no se hizo, el asistente nombra lo hecho y ofrece (una sola vez) reprogramar o aliviar el día. Sin palabras de castigo.
3. **Carry-over al día siguiente:** nueva función `sinResponderPasados`: incluye lo no resuelto de hoy **y** lo de días previos dentro de `DIAS_DE_GRACIA = 2`. Al abrir Home, si ese set no está vacío, aparece una **tarjeta separada** (no mezclada con "¿cómo te fue hoy?"):
   - "Ayer te quedaron N sin marcar." con opciones **hechas / no hechas / reprogramar**.
   - **`MUST`**: mostrar la pregunta SIEMPRE antes de cualquier acción; sin respuesta del usuario no se toca nada (ni se marca, ni se reprograma).
   - Las acciones de marcar respetan la gracia del backend (`validar_marcado`).
   - Si el usuario responde, el día previo queda resuelto y la tarjeta no vuelve a aparecer por ese tramo.

**Acceptance:**
- Marcar "no" a un bloque → aparece UNA propuesta: reprogramar o aliviar; nada se ejecuta sin confirmar.
- Si no se abre la app el día X, al abrirla el día X+1 aparece la tarjeta con lo pendiente de X (dentro de gracia).
- La tarjeta siempre presenta opciones; nunca actúa por sí sola.

**Sin cambios de datos:** todo es flujo de conversación y reuso de acciones existentes (mover, aliviar, marcar). El reframe no contiene "perdiste"/"fallaste" (hay un test existente que lo vela: `DayClose.test.tsx` no permite `fallaste|no lograste`).

---

## 5. Archivos a tocar (resumen)

| Archivo | Cambio | Estado |
|---|---|---|
| `ikeep-backend/domain/services/assistant/system_prompt.py` | Reglas de partir-en-pasos con consentimiento + variar elogios (D1, D2 chatbot). | ✅ implementado |
| `ikeep-app/src/domain/services/reengagementReminders.ts` | Nuevo `AVISO_ANIMO` diario con rotación de frases por día de semana (D2). | ✅ implementado |
| `ikeep-backend/infrastructure/adapters/inbound/api/v1/rewards_router.py` | `pendientes_pasados` en `/resumen`: dias anteriores (gracia) con items sin responder (D3). | ✅ implementado |
| `ikeep-app/src/infrastructure/api/RewardsApiService.ts` | Tipos y parseo de `pendientes_pasados`. | ✅ implementado |
| `ikeep-app/src/infrastructure/store/useRewardsStore.ts` | Estado `pendientesPasados` + acción `marcarPasado`. | ✅ implementado |
| `ikeep-app/src/presentation/components/organisms/Rewards/CarryOverCard.tsx` | Tarjeta que siempre pregunta (hecha/no/ahora-no + reprogramar). | ✅ implementado |
| `ikeep-app/src/presentation/screens/Home/HomeView.tsx` | Render del carry-over + handlers (marcar, reprogramar con `useCalendarStore.mover`). | ✅ implementado |

**Nota de alcance:** a diferencia de D1/D2 (solo texto/notificación), D3 requirió **una extensión de endpoint**, no una migración. No se toca el esquema de Supabase.

**No se tocan:** esquema de Supabase, `completion.py`, `streak.py`, scheduler de avisos (solo se agrega un id nuevo al mapa `TODOS_LOS_AVISOS`), generación de horarios.

---

## 6. Orden de trabajo y verificación

### Fase A — D1 (asistente anti-sobrecarga)
1. Editar `system_prompt.py` con las reglas de consentimiento.
2. Probar a mano los 3 escenarios de acceptance vía chat.
3. `pnpm tsc --noEmit` (comando de build del repo) sin errores nuevos (quedan solo los 6 pre-existentes de tests).

### Fase B — D2 (ánimo diario variado)
1. Agregar `AVISO_ANIMO` y `FRASES_ANIMO`; sumar id a `TODOS_LOS_AVISOS`.
2. `avisosQueCorresponden(estado, hoy)` incluye el aviso de ánimo siempre, con frase por `hoy.getDay() % n`.
3. Ajustar la regla del chat en el prompt.
4. Verificar: con permiso concedido, el aviso existe 7 días corridos con 7 textos distintos; los avisos viejo (matutino/racha) no cambian.

### Fase C — D3 (compensación / carry-over)
1. Backend: `_pendientes_pasados` calcula los dias anteriores (gracia) con items sin resolver y los expone en `/resumen`.
2. Frontend: `obtenerResumen` parsea `pendientes_pasados`; el store los guarda.
3. UI: `CarryOverCard` pregunta siempre (hecha / no hecha / reprogramar / ahora-no); reprogramar reusa `useCalendarStore.mover`.
4. Verificar: al abrir la app el día X+1 aparece la tarjeta con lo de X (dentro de gracia); cada acción la elige el usuario; nada se marca ni se mueve solo.

### Verificación global
- `pnpm tsc --noEmit` limpio (solo errores pre-existentes).
- Pruebas de tono existentes (`__tests__`) siguen en verde (no pueden correr en este entorno, se verifica cuando el entorno de Jest esté arreglado).
- Nada de migraciones ni nuevas tablas.

---

## 7. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| El ánimo diario por notificación es ruido | Decisión explícita del usuario (regla rota a propósito). El daño está limitado: 1 notificación al día a las 20:00, texto neutro, y siempre gated por el permiso. |
| El asistente parte en pasos sin que se lo pidan | Regla explícita en el prompt: preguntar UNA vez y no ejecutar nada sin confirmación. La filosofía "nunca guardas nada directamente" ya protege esto. |
| El "no" se siente como castigo | Reframe obligatorio: se nombra lo hecho; las palabras prohibidas tienen test que lo vela. |
| Prompt demasiado largo / pierde el tono | El prompt es deliberadamente corto; los cambios son 2–3 reglas, no un párrafo nuevo por cada ítem. |