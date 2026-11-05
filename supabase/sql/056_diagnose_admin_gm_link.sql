-- Diagnostic (lecture seule) — coller dans l'éditeur SQL Lovable / Supabase
-- Projet dnxyidnkmtrmkxucqrry. Ne pas publier Lovable.
--
-- Cause Suivi admin : fetchFromGmassigneePlanning lit profiles.gm_id pour auth.uid().
-- Si le profil existe mais gm_id IS NULL → l'ancien code throwait
-- « Votre profil n'est pas lié à un GM ».
-- Le correctif code (admin / formateur_suivi) retourne un planning vide.
-- Ce SQL sert à vérifier les comptes info@ / Julien et, seulement si voulu,
-- lier un game_masters existant.

-- 0. Rôles staff (admin / formateur_suivi) — l'onglet Éditeur Pages lit user_roles
--    (plus .maybeSingle() : 2 lignes admin+formateur_suivi ne doivent plus casser isFormateur).
select u.email, ur.role, ur.created_at
from auth.users u
join public.user_roles ur on ur.user_id = u.id
where u.email in (
  'info@genieculturel.ch',
  'julien.quinodoz@gmail.com',
  'julien.quinodoz@genieculturel.ch'
)
order by u.email, ur.role;

-- Si info@ n'a AUCUNE ligne user_roles.admin / formateur_suivi :
-- insert into public.user_roles (user_id, role)
-- select id, 'admin'::public.app_role from auth.users where email = 'info@genieculturel.ch'
-- on conflict (user_id, role) do nothing;

-- 1. Comptes concernés + profil + rôle + GM lié
select
  u.id as user_id,
  u.email,
  p.id as profile_id,
  p.gm_id,
  ur.role,
  gm.name as linked_gm_name
from auth.users u
left join public.profiles p on p.user_id = u.id
left join public.user_roles ur on ur.user_id = u.id
left join public.game_masters gm on gm.id = p.gm_id
where u.email in (
  'info@genieculturel.ch',
  'julien.quinodoz@gmail.com',
  'julien.quinodoz@genieculturel.ch'
)
order by u.email, ur.role;

-- 2. GM existants dont le nom ressemble à Julien / info (candidats de liaison)
select id, name, created_at
from public.game_masters
where name ilike '%julien%'
   or name ilike '%quinodoz%'
   or name ilike '%info%'
order by name;

-- 3. OPTIONNEL — seulement si un game_masters est bien l'identité planning de ce compte.
-- Ne pas lier un admin à un GM au hasard : le Suivi afficherait alors les parties de ce GM.
--
-- update public.profiles
-- set gm_id = '<uuid game_masters>'
-- where user_id = (select id from auth.users where email = 'info@genieculturel.ch' limit 1)
--   and gm_id is null;
--
-- update public.profiles
-- set gm_id = '<uuid game_masters>'
-- where user_id = (select id from auth.users where email = 'julien.quinodoz@gmail.com' limit 1)
--   and gm_id is null;
