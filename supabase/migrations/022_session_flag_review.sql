-- 022: « Sessions enregistrées » (admin) — marquer un incident / une remarque comme relevé.
-- Colonnes de suivi + RPC réservée aux admins (pas de policy UPDATE large sur vr_sessions).

alter table public.vr_sessions
  add column if not exists flag_reviewed_at timestamptz,
  add column if not exists flag_reviewed_by uuid references auth.users(id) on delete set null;

create or replace function public.set_session_flag_reviewed(p_session_id uuid, p_reviewed boolean)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_at timestamptz;
begin
  if not public.is_admin() then
    raise exception 'Réservé aux admins' using errcode = '42501';
  end if;
  v_at := case when p_reviewed then now() else null end;
  update public.vr_sessions
     set flag_reviewed_at = v_at,
         flag_reviewed_by = case when p_reviewed then auth.uid() else null end
   where id = p_session_id;
  if not found then
    raise exception 'Session introuvable' using errcode = 'P0002';
  end if;
  return v_at;
end;
$$;

revoke all on function public.set_session_flag_reviewed(uuid, boolean) from public, anon;
grant execute on function public.set_session_flag_reviewed(uuid, boolean) to authenticated;
