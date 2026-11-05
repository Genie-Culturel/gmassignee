-- Migration 054: recoupe compétences RH → fiches Formations / Suivi
-- À appliquer sur Lovable Supabase dnxyidnkmtrmkxucqrry (Cloud SQL).
-- Idempotent. Ne publie pas l'app Lovable.
--
-- Règles Julien :
--   0 compétence RH            → 0 fiche (plus de circuit VR Center par défaut)
--   Jeu VR Centre (Planta, Serviteur, Saga, SchoolCrafter, ou autre jeu
--     clairement VR Centre déjà mappé, hors Archeogame / nettoyage)
--                          → circuit VR Center (lieu vr_center / parcours vr_centre_client)
--                            + fiches du jeu
--   Archeogame seulement       → fiches Archeogame (pas le circuit VR)
--   Nettoyage centre VR        → fiches nettoyage seulement
--   Da Vinci / Chandoline      → fiches du jeu + lieu du parcours, PAS le circuit VR
--   admin / formateur_suivi    → tout (inchangé, via has_formateur_role)
--
-- Le filtre client (src/lib/competenceFilter.ts) applique ces règles.
-- Ce SQL complète le mapping RH manquant et tague les fiches.

-- ============================================================================
-- 1. Jeux training manquants (catalogue gh_games)
-- ============================================================================

INSERT INTO public.gh_games (location_id, slug, name, sort_index)
SELECT l.id, v.slug, v.name, v.sort_index
FROM public.gh_locations l
JOIN (VALUES
  ('vr_center', 'archeogame', 'ARcheo Game', 5),
  ('vr_center', 'nettoyage', 'Nettoyage centre VR', 6)
) AS v(location_slug, slug, name, sort_index) ON v.location_slug = l.slug
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  location_id = EXCLUDED.location_id,
  sort_index = EXCLUDED.sort_index;

-- ============================================================================
-- 2. Mapping RH public.games → gh_games (gaps 050)
-- ============================================================================

-- Planta (RH « La Bataille de la Planta - L'assaut ») → planta + circuit VR
INSERT INTO public.gh_game_rh_map (games_id, gh_games_id, notes)
SELECT g.id, ghg.id, 'Planta → planta (ouvre le circuit VR Center)'
FROM public.games g
CROSS JOIN public.gh_games ghg
WHERE g.name ILIKE '%Planta%'
  AND ghg.slug = 'planta'
ON CONFLICT (games_id, gh_games_id) DO NOTHING;

-- Serviteur I / II → serviteur + circuit VR
INSERT INTO public.gh_game_rh_map (games_id, gh_games_id, notes)
SELECT g.id, ghg.id, 'Serviteur → serviteur (ouvre le circuit VR Center)'
FROM public.games g
CROSS JOIN public.gh_games ghg
WHERE g.name ILIKE '%Serviteur%'
  AND ghg.slug = 'serviteur'
ON CONFLICT (games_id, gh_games_id) DO NOTHING;

-- SAGA → saga + circuit VR
INSERT INTO public.gh_game_rh_map (games_id, gh_games_id, notes)
SELECT g.id, ghg.id, 'SAGA → saga (ouvre le circuit VR Center)'
FROM public.games g
CROSS JOIN public.gh_games ghg
WHERE (g.name ILIKE '%SAGA%' OR g.name ILIKE '%SR I%II%')
  AND ghg.slug = 'saga'
ON CONFLICT (games_id, gh_games_id) DO NOTHING;

-- SchoolCrafter / Schoolcrafter / ShoolCrafter → schoolcrafter + circuit VR
INSERT INTO public.gh_game_rh_map (games_id, gh_games_id, notes)
SELECT g.id, ghg.id, 'SchoolCrafter → schoolcrafter (ouvre le circuit VR Center)'
FROM public.games g
CROSS JOIN public.gh_games ghg
WHERE (
    g.name ILIKE '%choolcraft%'
    OR g.name ILIKE '%shoolcraft%'
    OR g.name ILIKE '%schoolcraft%'
  )
  AND ghg.slug = 'schoolcrafter'
ON CONFLICT (games_id, gh_games_id) DO NOTHING;

-- Da Vinci Code / Kids / Vinum → davinci (Escape Life Sion), PAS le circuit VR
INSERT INTO public.gh_game_rh_map (games_id, gh_games_id, notes)
SELECT g.id, ghg.id, 'Da Vinci → davinci (fiches / lieu Escape Life Sion, pas le circuit VR Center)'
FROM public.games g
CROSS JOIN public.gh_games ghg
WHERE g.name ILIKE '%Da%Vinci%'
  AND ghg.slug = 'davinci'
ON CONFLICT (games_id, gh_games_id) DO NOTHING;

-- ARcheo Game - Sion (catégorie ARcheoGame) → archeogame, SANS circuit VR
INSERT INTO public.gh_game_rh_map (games_id, gh_games_id, notes)
SELECT g.id, ghg.id, 'ARcheo Game → archeogame (pas de circuit VR Center)'
FROM public.games g
CROSS JOIN public.gh_games ghg
WHERE (g.name ILIKE '%archeo%' OR COALESCE(g.category, '') ILIKE '%archeo%')
  AND ghg.slug = 'archeogame'
ON CONFLICT (games_id, gh_games_id) DO NOTHING;

-- Nettoyage centre VR → nettoyage
INSERT INTO public.gh_game_rh_map (games_id, gh_games_id, notes)
SELECT g.id, ghg.id, 'Nettoyage centre VR → nettoyage (fiches nettoyage seulement)'
FROM public.games g
CROSS JOIN public.gh_games ghg
WHERE g.name ILIKE '%nettoyage%'
  AND ghg.slug = 'nettoyage'
ON CONFLICT (games_id, gh_games_id) DO NOTHING;

-- Chandoline / Novasphère : pas de ligne RH aujourd'hui ; mapping si le nom apparaît
INSERT INTO public.gh_game_rh_map (games_id, gh_games_id, notes)
SELECT g.id, ghg.id, 'Chandoline / Novasphère → usine_chandoline'
FROM public.games g
CROSS JOIN public.gh_games ghg
WHERE (
    g.name ILIKE '%chandoline%'
    OR g.name ILIKE '%novasphère%'
    OR g.name ILIKE '%novasphere%'
  )
  AND ghg.slug = 'usine_chandoline'
ON CONFLICT (games_id, gh_games_id) DO NOTHING;

-- ============================================================================
-- 3. Tags fiches (sans bump de version)
-- ============================================================================

-- Circuit VR Center : fiches lieu VR Center (lobby, pop-corn, salle, boissons, …)
UPDATE public.gh_procedure_fiches f
SET
  tags = (
    SELECT ARRAY(SELECT DISTINCT t FROM unnest(COALESCE(f.tags, ARRAY[]::text[]) || ARRAY['rh_vr_circuit']) AS t)
  ),
  skip_version_bump = true
WHERE f.deleted_at IS NULL
  AND f.scope_kind = 'locations'
  AND EXISTS (
    SELECT 1
    FROM public.gh_fiche_scope_locations s
    JOIN public.gh_locations l ON l.id = s.location_id
    WHERE s.fiche_id = f.id AND l.slug = 'vr_center'
  )
  AND NOT COALESCE(f.tags, ARRAY[]::text[]) @> ARRAY['rh_vr_circuit'];

-- Fiches nettoyage (session) : visibles compétence nettoyage ET circuit VR
UPDATE public.gh_procedure_fiches f
SET
  tags = (
    SELECT ARRAY(SELECT DISTINCT t FROM unnest(COALESCE(f.tags, ARRAY[]::text[]) || ARRAY['rh_nettoyage']) AS t)
  ),
  skip_version_bump = true
WHERE f.deleted_at IS NULL
  AND (
    f.title ILIKE '%nettoyage%'
    OR COALESCE(f.tags, ARRAY[]::text[]) && ARRAY['nettoyage']
  )
  AND NOT COALESCE(f.tags, ARRAY[]::text[]) @> ARRAY['rh_nettoyage'];

UPDATE public.gh_procedure_fiches
SET skip_version_bump = false
WHERE skip_version_bump IS TRUE;

COMMENT ON TABLE public.gh_game_rh_map IS
  'Maps Lovable RH games to gh_games.
   Circuit VR (filtre client) : slugs planta, serviteur, saga, schoolcrafter
   — plus tout autre jeu gh_games situé au lieu vr_center, hors archeogame / nettoyage.
   archeogame : pas de circuit VR.
   nettoyage : fiches nettoyage seulement.
   Gaps restants : RAVE, Magi Room, Evenement outdoor n''ont pas de fiches training.
   Chandoline/Novasphère : aucune ligne RH games à ce jour ; le INSERT ci-dessus matchera si le nom est ajouté.';

-- ============================================================================
-- 4. Vérifications (à lancer après application)
-- ============================================================================
-- SELECT g.name AS rh, ghg.slug, m.notes
-- FROM public.gh_game_rh_map m
-- JOIN public.games g ON g.id = m.games_id
-- JOIN public.gh_games ghg ON ghg.id = m.gh_games_id
-- ORDER BY g.name;
--
-- -- TEST TEST-1 (Planta + Da Vinci Code) → [planta.id, davinci.id]
-- SELECT public.gh_get_authorized_game_ids('f813a743-3d17-4977-85bb-35771754fd7b'::uuid);
--
-- SELECT slug, name FROM public.gh_games ORDER BY sort_index, slug;
