# Tasks: Supabase Integration

## Review Workload Forecast

| Metric | Value |
|--------|-------|
| New files | ~9 (schema SQL, client, 4 adaptadores, 2 pantallas Auth, authStore) |
| Modified files | ~5 (`Dependencies.ts`, `AppNavigator.tsx`, `useScheduleStore.ts`, `EnergyHistoryService.ts`, `package.json`) |
| Review budget risk | Medio-Alto (toca auth y persistencia, cambio transversal) |
| Chained PRs recommended | Sí — Fase 1 (schema) puede correr sola; Fase 2 (auth) y Fase 3 (repos) en paralelo una vez que hay sesión |
| Delivery | 3 PRs sugeridos |
| Bloqueante externo | Necesita `SUPABASE_URL` + `anon key` reales del usuario antes de poder probar Fase 2+ de punta a punta |

## Fase 0: Credenciales (bloqueante, la hace el usuario)

- [ ] 0.1 Usuario provee `SUPABASE_URL` y `anon key` (Project Settings → API en supabase.com) — **nunca** la `service_role key`
- [x] 0.2 Confirmar método de auth: email + contraseña (recomendado/default) vs. magic link → **email + contraseña**

## Fase 1: Esquema en Supabase (no depende de credenciales para escribirse, sí para correrse)

- [x] 1.1 Escribir y entregar el script SQL completo (tablas + RLS + trigger) — `ikeep-app/supabase/schema.sql`. Corrección sobre el diseño original: `activities.id` es `text`, no `uuid` (el id se genera en el cliente vía `Date.now().toString()`, no es un UUID válido); `schedules.id` queda `uuid default gen_random_uuid()` sin que el cliente lo fuerce, porque el upsert es por `user_id`.
- [ ] 1.2 Usuario corre el script en el SQL Editor de su proyecto Supabase
- [ ] 1.3 Verificar en el dashboard que las 5 tablas existen con RLS habilitado

## Fase 2: Cliente + Auth en la app

- [x] 2.1 `pnpm add @supabase/supabase-js react-native-url-polyfill`
- [ ] 2.2 `.env` con `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` — bloqueado por permisos del entorno de la sesión que generó el código (no pudo escribir `.env.example`); `.gitignore` ya actualizado para excluir `.env`. Pendiente que el usuario cree el archivo.
- [x] 2.3 `src/infrastructure/supabase/client.ts` (con fallback a URL placeholder + `console.warn` si faltan las env vars, para no romper los tests unitarios que importan `Dependencies.ts` transitivamente)
- [x] 2.4 `src/infrastructure/store/useAuthStore.ts` (sesión + `onAuthStateChange`)
- [x] 2.5 `src/presentation/screens/Auth/LoginView.tsx` + `SignUpView.tsx`
- [x] 2.6 `AppNavigator.tsx`: gate de sesión (splash → Auth → Onboarding/MainTabs); además el `useEffect` que carga día/horario/permisos de notificaciones ahora espera a que haya sesión antes de correr
- [x] 2.7 (no listado originalmente) `SettingsView.tsx`: botón "Cerrar sesión" — necesario para poder probar el criterio de éxito 5.4

## Fase 3: Swap de repositorios (AsyncStorage → Supabase)

- [x] 3.1 `SupabaseActivityRepository.ts` (implementa `ActivityRepository`)
- [x] 3.2 `SupabaseUserRepository.ts` (implementa `UserRepository`, tabla `profiles`; trata perfil con campos null —onboarding no completado— como "sin perfil", igual que AsyncStorage devolvía `null`)
- [x] 3.3 `SupabaseDayLimitPersistence.ts` (implementa `DayLimitPersistence`, tabla `user_settings`)
- [x] 3.4 `EnergyHistoryService.ts`: reescrito contra `supabase.from('energy_records')` + `user_settings.custom_energy_pattern`
- [x] 3.5 `useScheduleStore.ts`: `saveScheduleToStorage`/`loadSchedule` contra tabla `schedules` (upsert por `user_id`)
- [x] 3.6 `di/Dependencies.ts`: cableados los nuevos adaptadores
- [x] 3.7 `pnpm tsc --noEmit` sin errores nuevos (verificado) + `pnpm jest` 53/53 tests pasando

## Fase 4: Migración de datos locales existentes (opcional, no ejecutada)

Fuera de alcance de esta pasada — sigue igual que en el proposal original ("no bloqueante"). No se tocó.

- [ ] 4.1 Detectar AsyncStorage con datos + Supabase vacío tras login
- [ ] 4.2 Diálogo de confirmación + import one-shot (activities, energy_records, user_settings)

## Fase 5: Verificación (pendiente — requiere credenciales reales, Fase 0/1.2)

- [ ] 5.1 Signup + login funcionan de punta a punta
- [ ] 5.2 Crear actividad → aparece en la tabla `activities` de Supabase (verificable en el dashboard)
- [ ] 5.3 Generar horario → persiste en `schedules`, sobrevive a cerrar/reabrir la app
- [ ] 5.4 Logout + login con 2da cuenta de prueba → RLS confirma que no ve datos de la primera cuenta
- [x] 5.5 `ikeep-backend` sigue respondiendo igual que antes — confirmado, ningún archivo bajo `ikeep-backend/` fue tocado en esta pasada
