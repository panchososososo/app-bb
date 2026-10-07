-- ============================================================
-- Nosotros — tabla en la nube (Supabase)
-- Pegar completo en: Supabase → SQL Editor → New query → Run
-- Se puede correr en el mismo proyecto de Base Lunar: no toca sus tablas.
-- ============================================================

-- Cada fila es una sección de la app (regalos, cartas, citas…) de UNA persona.
create table if not exists public.nosotros (
  user_id     uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  clave       text        not null,
  valor       jsonb,
  actualizado timestamptz not null default now(),
  primary key (user_id, clave)
);

-- ---------- seguridad ----------
-- Cada usuario ve y edita SOLO sus propios datos. Aunque otra persona tenga
-- cuenta en este mismo proyecto (por ejemplo para Base Lunar), no puede leer
-- tus cartas ni tu lista de regalos.
alter table public.nosotros enable row level security;

drop policy if exists "nosotros_solo_dueno" on public.nosotros;
create policy "nosotros_solo_dueno" on public.nosotros
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------- nunca retroceder ----------
-- Si un teléfono que estuvo sin señal sube una versión más vieja que la que
-- ya está en la nube, se ignora y gana la más reciente.
create or replace function public.nosotros_no_retroceder()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.actualizado < old.actualizado then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists nosotros_no_retroceder on public.nosotros;
create trigger nosotros_no_retroceder
  before update on public.nosotros
  for each row execute function public.nosotros_no_retroceder();
