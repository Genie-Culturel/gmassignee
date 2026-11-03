-- 024: suppression d'une session par un admin (« Sessions enregistrées »).
-- Les tables liées sont en ON DELETE CASCADE (session_steps, session_sales, session_media)
-- ou SET NULL (bug_sessions.vr_session_id). Le jeton client (videos_download_token) est
-- porté par vr_sessions : il devient invalide avec la ligne.
-- Les fichiers du bucket « session-media » ne peuvent pas être supprimés en SQL
-- (trigger storage.protect_delete) : l'app les retire via l'API Storage (policy delete is_admin())
-- AVANT d'appeler cette fonction.

create or replace function public.admin_delete_session(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_steps int;
  v_sales int;
  v_media int;
begin
  if not public.is_admin() then
    raise exception 'Réservé aux admins' using errcode = '42501';
  end if;
  if not exists (select 1 from public.vr_sessions where id = p_session_id) then
    raise exception 'Session introuvable' using errcode = 'P0002';
  end if;

  select count(*) into v_steps from public.session_steps where session_id = p_session_id;
  select count(*) into v_sales from public.session_sales where session_id = p_session_id;
  select count(*) into v_media from public.session_media where session_id = p_session_id;

  delete from public.session_steps where session_id = p_session_id;
  delete from public.session_sales where session_id = p_session_id;
  delete from public.session_media where session_id = p_session_id;
  update public.bug_sessions set vr_session_id = null where vr_session_id = p_session_id;
  delete from public.vr_sessions where id = p_session_id;

  return jsonb_build_object('steps', v_steps, 'sales', v_sales, 'media', v_media);
end;
$$;

revoke all on function public.admin_delete_session(uuid) from public, anon;
grant execute on function public.admin_delete_session(uuid) to authenticated;
