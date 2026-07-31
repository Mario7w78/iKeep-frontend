-- KeroTime / Supabase schema
-- Correr una sola vez en el SQL Editor del proyecto Supabase (Project > SQL Editor > New query).
-- auth.users ya existe (lo gestiona Supabase Auth); todo lo demás referencia auth.users.id.

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
--
-- NOTA: `id` es `text`, no `uuid`. El id se genera en el cliente
-- (CreateActivityUseCase.ts: `Date.now().toString()`, o el id que venga del
-- flujo de creación por lenguaje natural), no es un UUID válido. Si esta
-- columna fuera `uuid`, el insert/upsert fallaría con un error de casteo.
create table public.activities (
  id text primary key,
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
--
-- NOTA: a diferencia de `activities`, aquí SÍ dejamos `id uuid default
-- gen_random_uuid()`: el `Schedule.id` del cliente ("schedule-<timestamp>")
-- nunca se envía a esta columna — se hace upsert por `user_id` (un usuario
-- tiene "el" horario vigente) y Postgres es dueño de su propio `id`.
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
-- + el override de patrón de energía que hoy vive en EnergyHistoryService.ts.
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

-- ── Row Level Security (obligatorio en las 5 tablas) ──

alter table public.profiles enable row level security;
alter table public.activities enable row level security;
alter table public.schedules enable row level security;
alter table public.energy_records enable row level security;
alter table public.user_settings enable row level security;

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

create policy "activities_all_own" on public.activities for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "schedules_all_own" on public.schedules for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "energy_records_all_own" on public.energy_records for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "user_settings_all_own" on public.user_settings for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Trigger: crear la fila de `profiles` automáticamente al registrarse ──

create function public.handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
