# Proposal: Base de datos real con Supabase (Postgres + Auth)

## Intent

Hoy no hay base de datos en ningún lado del sistema:

- `ikeep-backend` (FastAPI) es puro cómputo — recibe actividades + contexto en cada request, corre el solver CP-SAT, devuelve un horario. No persiste nada. El `DATABASE_URL=sqlite:///./ikeep.db` en su `.env` no está conectado a ningún código (no hay ORM, no hay modelos, es una variable muerta).
- `ikeep-app` (React Native) guarda todo en `AsyncStorage` como blobs JSON sueltos: actividades (`@kerotime_activities`), usuario (`@kerotime_user`), horario generado (`@schedule`), historial de energía (`@kerotime/energy_history`), límites de día (`@day_start_hour`, `@per_day_start_hours`, etc.). Si el usuario reinstala la app o cambia de celular, pierde todo. No hay cuentas de usuario.
- Ya existían 3 carpetas vacías en `ikeep-backend/openspec/{changes/supabase-integration, specs/user-authentication, specs/activity-persistence}` — nunca se llegó a escribir el contenido, pero confirma que esto ya se había planteado antes.

Decisión del usuario (confirmada): el objetivo es **cuentas + sincronización multi-dispositivo**, usando **Supabase** (Postgres + Auth gestionado) como fuente de verdad. El usuario ya tiene un proyecto Supabase creado.

## Scope

### In Scope
- Esquema SQL en Supabase: `profiles`, `activities`, `schedules`, `energy_records`, `user_settings` — todos con `user_id` + Row Level Security (RLS) para que cada usuario solo vea/edite lo suyo.
- Autenticación con Supabase Auth (email + contraseña) en la app: pantallas de login/signup, sesión persistida (el SDK de supabase-js ya usa AsyncStorage internamente para el token, no hay que reinventar eso), gate de navegación (si no hay sesión, mostrar login antes que `OnBoardingView`/`MainTabs`).
- Nuevos adaptadores que implementan los **mismos ports** que ya existen (`ActivityRepository`, `UserRepository`, `DayLimitPersistence`) pero contra Supabase en vez de AsyncStorage — gracias a la arquitectura hexagonal ya presente, esto es un cambio de cableado en `di/Dependencies.ts`, no una reescritura de los use-cases.
- `EnergyHistoryService` pasa de AsyncStorage a Supabase (tabla `energy_records`).
- El horario generado (`@schedule`) pasa a persistirse en `schedules` (jsonb) — así sobrevive a reinstalar la app y se puede ver desde otro dispositivo sin tener que re-generarlo.

### Out of Scope (por ahora)
- **`ikeep-backend` no cambia.** Sigue siendo un servicio de cómputo puro (recibe actividades por request, corre CP-SAT, responde). La app habla directo con Supabase para todo el CRUD; el backend nunca toca la base de datos. Esto evita duplicar lógica CRUD en Python y mantiene el backend simple.
- Modo offline / caché local con reconciliación — la app va a requerir conexión para leer/escribir datos (Supabase). Se deja como mejora futura (fase 2) si hace falta.
- Migración automática de los datos que ya tenés guardados localmente (AsyncStorage) hacia la nube — se puede agregar como una fase corta aparte una vez que el login esté andando, para no perder lo que ya generaste probando la app.
- Login social (Google/Apple) — se arranca con email + contraseña, el método más simple de Supabase Auth. Se puede sumar después.
- Compartir horarios entre usuarios / features colaborativas.

## Approach

Ver `design.md` para el esquema SQL completo, las políticas RLS, y el mapeo detallado de cada entidad de dominio actual a su tabla.

## Affected Areas

| Área | Impacto | Descripción |
|------|---------|-------------|
| Supabase (dashboard del usuario) | **Nuevo** | Tablas `profiles`, `activities`, `schedules`, `energy_records`, `user_settings` + políticas RLS. Se entrega como script SQL para correr en el SQL Editor de Supabase (no puedo ejecutarlo yo sin las credenciales del proyecto). |
| `ikeep-app/package.json` | Modificado | Nueva dependencia `@supabase/supabase-js` (+ `react-native-url-polyfill`, requerido por el SDK en React Native) |
| `ikeep-app/src/infrastructure/supabase/client.ts` | **Nuevo** | Cliente Supabase inicializado con `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` |
| `ikeep-app/src/infrastructure/repositories/Supabase*Repository.ts` | **Nuevo** | Implementaciones de `ActivityRepository`, `UserRepository` contra Supabase |
| `ikeep-app/src/infrastructure/persistence/SupabaseDayLimitPersistence.ts` | **Nuevo** | Implementación de `DayLimitPersistence` contra `user_settings` |
| `ikeep-app/src/infrastructure/persistence/EnergyHistoryService.ts` | Modificado | Pasa de AsyncStorage a Supabase (tabla `energy_records`) |
| `ikeep-app/src/infrastructure/store/useScheduleStore.ts` | Modificado | `saveScheduleToStorage`/`loadSchedule` pasan de AsyncStorage (`@schedule`) a la tabla `schedules` |
| `ikeep-app/src/di/Dependencies.ts` | Modificado | Cablear los nuevos adaptadores Supabase en vez de los AsyncStorage |
| `ikeep-app/src/presentation/screens/Auth/*` | **Nuevo** | Pantallas de Login/Signup |
| `ikeep-app/src/infrastructure/store/useAuthStore.ts` | **Nuevo** | Store de sesión (usuario logueado, `onAuthStateChange` de Supabase) |
| `ikeep-app/src/presentation/navigation/AppNavigator.tsx` | Modificado | Gate: sin sesión → pantalla de Auth; con sesión → flujo actual (Onboarding/MainTabs) |
| `ikeep-backend/` | **Sin cambios** | Confirma que las carpetas vacías `supabase-integration`/`user-authentication`/`activity-persistence` en su openspec quedan documentadas acá como "decidido: no aplica al backend" |

## Risks

| Riesgo | Probabilidad | Mitigación |
|--------|--------------|------------|
| App deja de funcionar sin internet (hoy funciona 100% offline) | Alta (es un trade-off aceptado) | Documentar claramente; considerar cache local de solo-lectura como mejora futura |
| Perder los datos de prueba que ya tenés en AsyncStorage al pasar a Supabase | Media | Fase corta de migración local→nube post-login (opcional, se propone como tarea aparte) |
| RLS mal configurada expone datos de un usuario a otro | Alta si se hace mal | Cada tabla con policy explícita `user_id = auth.uid()` para SELECT/INSERT/UPDATE/DELETE, se entrega ya escrita en el script SQL, no hay que improvisarla en el dashboard |
| Necesito las credenciales reales (`SUPABASE_URL`, `anon key`) para probar la integración de punta a punta | Alta | Se piden explícitamente al usuario (no la `service_role key`, esa nunca se comparte ni se usa desde el cliente) |

## Rollback Plan

Revertir `di/Dependencies.ts` a los adaptadores AsyncStorage originales (quedan sin borrar en el repo). Las tablas en Supabase se pueden dejar existir sin uso o borrarse desde el dashboard. Sin cambios en `ikeep-backend`, sin riesgo de romper el solver.

## Dependencies

- `@supabase/supabase-js` (cliente oficial)
- `react-native-url-polyfill` (requerido por supabase-js para `fetch`/`URL` en React Native/Hermes)
- Credenciales del proyecto Supabase del usuario: `SUPABASE_URL` y `anon` key (Project Settings → API en el dashboard de Supabase)

## Success Criteria

- [ ] Un usuario nuevo puede crear cuenta (email + contraseña) y loguearse
- [ ] Actividades, horario generado, historial de energía y configuración de horario se guardan en Supabase, no en AsyncStorage
- [ ] Cerrar sesión y volver a loguearse (o hacerlo desde otro dispositivo/emulador) muestra los mismos datos
- [ ] RLS impide que un usuario vea datos de otro (verificable con 2 cuentas de prueba)
- [ ] `ikeep-backend` sigue funcionando exactamente igual que antes, sin tocar Supabase
- [ ] `pnpm tsc --noEmit` sin errores nuevos
