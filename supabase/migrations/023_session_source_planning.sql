-- 023: distinguer sessions planifiées / manuelles + garder le lien complet avec le planning GMassignee.
-- is_manual est dérivé (pas d'écriture côté app) : une session manuelle n'a pas d'assignment_id.

alter table public.vr_sessions
  add column if not exists is_manual boolean generated always as (assignment_id is null) stored,
  add column if not exists planned_end_time time,
  add column if not exists planning_activity_id text;

comment on column public.vr_sessions.is_manual is 'true = démarrée via « Démarrer une session manuelle » (hors planning).';
comment on column public.vr_sessions.planned_end_time is 'Heure de fin prévue au planning GMassignee.';
comment on column public.vr_sessions.planning_activity_id is 'activities.id du planning GMassignee (app Lovable).';
