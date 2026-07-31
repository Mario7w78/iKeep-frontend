# Design: Supabase (Postgres + Auth) Integration

## 1. Esquema SQL

Se corre una sola vez en el **SQL Editor** del dashboard de Supabase del usuario. `auth.users` ya existe (lo gestiona Supabase Auth), todo lo demás referencia `auth.users.id`.

```sql
-- Perfil de usuario (1:1 con auth.users). Mapea a src/domain/entities/User.ts
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  energy_level smallint check (energy_level between 1 and 5),
  wake_up_time text,   -- 'HH:mm'
  sleep_time text,     -- 'HH:mm'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Actividades. Mapea a src/domain/entities/Activity.ts (activity.types.ts)
create table public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  type text not null,
  identity text not null default 'tarea',
  priority smallint not null default 3,
  difficulty text not null default 'media',
  deadline timestamptz,
  days_enabled jsonb not null default '[]',
  days_config jsonb not null default '{}',
  optional_day boolean not null default false,
  day_from text,
  day_to text,
  is_anchor boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Horario generado (derivado, pero se persiste para no tener que re-generar
-- ni perderlo al reinstalar). Mapea a src/domain/entities/Schedule.ts
create table public.schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  estado text,
  mensaje text,
  recomendaciones jsonb not null default '[]',
  tareas_omitidas jsonb not null default '[]',
  scheduled_activities jsonb not null default '[]', -- array de ScheduledActivity tal cual hoy en AsyncStorage
  created_at timestamptz not null default now()
);
-- Un usuario tiene "el" horario vigente; se simplifica con upsert por user_id
create unique index schedules_user_id_key on public.schedules(user_id);

-- Historial de energía. Mapea a EnergyHistoryService.ts EnergyRecord
create table public.energy_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  timestamp timestamptz not null,
  nivel smallint not null,
  dia_semana smallint not null,
  contexto text
);

-- Configuración de horario/semana. Mapea a DayLimitPersistence (useScheduleStore.ts)
create table public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  start_hour int not null default 240,
  end_hour int not null default 1320,
  dia_inicio int not null default 0,
  dias_totales int not null default 7,
  per_day_start_hours jsonb, -- number[] | null
  per_day_end_hours jsonb,   -- number[] | null
  custom_energy_pattern text,
  updated_at timestamptz not null default now()
);
```

### Row Level Security (obligatorio en las 5 tablas)

```sql
alter table public.profiles enable row level security;
alter table public.activities enable row level security;
alter table public.schedules enable row level security;
alter table public.energy_records enable row level security;
alter table public.user_settings enable row level security;

-- profiles: el id de la fila ES el user id
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- Resto de tablas: patrón repetido con user_id
create policy "activities_all_own" on public.activities for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "schedules_all_own" on public.schedules for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "energy_records_all_own" on public.energy_records for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "user_settings_all_own" on public.user_settings for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

### Trigger opcional: crear `profiles` automáticamente al registrarse

```sql
create function public.handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

## 2. Cliente Supabase en la app

```ts
// src/infrastructure/supabase/client.ts
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage, // persiste la sesión (el token, no los datos de negocio)
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

Variables de entorno vía el prefijo `EXPO_PUBLIC_*` (soporte nativo de Expo, sin librerías extra) en un `.env` en la raíz de `ikeep-app` (no se commitea, se agrega a `.gitignore`):

```
EXPO_PUBLIC_SUPABASE_URL=https://<tu-proyecto>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<tu anon/public key>
```

## 3. Adaptadores — mismo port, nueva implementación

Ejemplo para `ActivityRepository` (el port ya existente, sin tocar):

```ts
// src/infrastructure/repositories/SupabaseActivityRepository.ts
export class SupabaseActivityRepository implements ActivityRepository {
  async getAll(): Promise<Activity[]> {
    const { data, error } = await supabase.from('activities').select('*');
    if (error) throw error;
    return (data ?? []).map(rowToActivity);
  }
  async save(activity: Activity): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No hay sesión activa');
    await supabase.from('activities').upsert(activityToRow(activity, user.id));
  }
  async delete(id: string): Promise<void> {
    await supabase.from('activities').delete().eq('id', id);
  }
}
```

Mismo patrón para `SupabaseUserRepository` (tabla `profiles`), `SupabaseDayLimitPersistence` (tabla `user_settings`, con upsert), y el `EnergyHistoryService`/`useScheduleStore` reescritos para llamar a `supabase.from(...)` en vez de `AsyncStorage`.

`di/Dependencies.ts` cambia solo estas 2 líneas (el resto de use-cases/stores no se tocan):

```diff
- const activityRepository: ActivityRepository = new AsyncStorageActivityRepository();
- const userRepository: UserRepository = new AsyncStorageUserRepository();
+ const activityRepository: ActivityRepository = new SupabaseActivityRepository();
+ const userRepository: UserRepository = new SupabaseUserRepository();
```

## 4. Auth: pantallas + gate de navegación

- `src/infrastructure/store/useAuthStore.ts`: estado `session`, `isLoading`; se suscribe a `supabase.auth.onAuthStateChange` al montar la app.
- `src/presentation/screens/Auth/LoginView.tsx` / `SignUpView.tsx`: formularios simples (email + password), llaman a `supabase.auth.signInWithPassword` / `supabase.auth.signUp`.
- `AppNavigator.tsx`: el `Stack.Navigator` gana un chequeo adicional antes del `initialRouteName` actual:

```tsx
if (authLoading) return <SplashScreen />;
if (!session) return <AuthStack />; // Login/SignUp
return <ExistingStackWithOnboardingAndTabs />;
```

Esto no reemplaza el `OnBoardingView` existente — la secuencia queda: **Auth → Onboarding (si es primera vez) → MainTabs**.

## 5. Qué NO se toca

- `ikeep-backend`: cero cambios. Sigue recibiendo `ContextoUsuario` + actividades por request y devolviendo el horario calculado; no sabe que existe Supabase.
- El formato de `ScheduledActivity`/`Activity` en el dominio de la app no cambia — Supabase solo guarda su representación serializada (jsonb para arrays/objetos anidados como `daysConfig` o `scheduled_activities`).

## 6. Migración de datos locales existentes (fase opcional, no bloqueante)

Si se quiere no perder lo que ya está en AsyncStorage al activar Supabase:

1. Al detectar sesión nueva + AsyncStorage con datos (`@kerotime_activities` no vacío) + `activities` vacío en Supabase → ofrecer un diálogo "¿Importar tus datos locales a tu cuenta?".
2. Si acepta: leer todo con los repositorios AsyncStorage viejos (quedan en el repo, no se borran) y hacer `save()` uno por uno contra los nuevos repositorios Supabase.
3. Es un one-shot, no una sincronización continua.
