-- Sous-catégorie d'affichage des fiches (Formations et procédures + Ordre d'affichage).
-- null = « Général » (concerne tous les jeux / lieux) ; sinon un slug de lieu
-- (vr_center, escape_sion, escape_sierre, chandoline) ou 'escape_life' = Escape Life Sion et Sierre.
alter table public.procedure_fiches add column if not exists sub_group text;
comment on column public.procedure_fiches.sub_group is
  'Sous-catégorie d''affichage : null = Général, sinon slug de lieu ou escape_life (Sion + Sierre).';

-- Affectation initiale déduite de la portée existante (lieux / jeu -> lieu du jeu), sans bump de version.
with derived as (
  select f.id,
    case
      when f.scope_kind = 'all' then null
      when f.scope_kind = 'locations' then (
        select case when count(*) = 1 then min(l.slug)
                    when bool_and(l.slug in ('escape_sion','escape_sierre')) then 'escape_life'
                    else null end
        from fiche_scope_locations s join locations l on l.id = s.location_id where s.fiche_id = f.id)
      when f.scope_kind = 'games' then (
        select case when count(distinct l.slug) = 1 then min(l.slug) else null end
        from fiche_scope_games s join games g on g.id = s.game_id join locations l on l.id = g.location_id
        where s.fiche_id = f.id)
    end as grp
  from public.procedure_fiches f
)
update public.procedure_fiches f
   set sub_group = d.grp, skip_version_bump = true
  from derived d
 where d.id = f.id and f.sub_group is distinct from d.grp;

update public.procedure_fiches set skip_version_bump = false where skip_version_bump;
