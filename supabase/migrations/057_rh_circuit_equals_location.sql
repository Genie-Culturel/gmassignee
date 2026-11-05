-- Migration 057 : compétence RH → circuit (lieu) entier + fiches générales
-- À coller dans l'éditeur SQL Lovable / Supabase dnxyidnkmtrmkxucqrry.
-- Idempotent. Ne pas publier Lovable.
--
-- Règle Julien 2026-11-06 :
--   une compétence sur un jeu ouvre TOUT le circuit du lieu de ce jeu
--   + les fiches « Tout le monde ». 0 compétence → 0 fiche.
--   Admin / formateur_suivi : tout (inchangé, has_formateur_role).
--
-- Circuits :
--   ARcheo Game - Sion              → ARCHEO SION
--   Da Vinci Code / Kids / Vinum    → ESCAPE LIFE SION
--   Evenement outdoor               → EVENT
--   Planta, Magi Room, RAVE, SAGA,
--     SchoolCrafter, Serviteur I/II → VR CENTER
--   Le Feu Sacré                    → ESCAPE LIFE SIERRE
--   Nettoyage centre VR             → NETTOYAGE CENTER
--
-- Le filtre client (competenceFilter.ts) applique circuit = lieu, avec override
-- de slug pour Archeogame / Nettoyage tant que ce SQL n'est pas appliqué.

-- ============================================================================
-- 1. Lieux / circuits manquants
-- ============================================================================

INSERT INTO public.gh_locations (slug, name, short_name, kind, sort_index)
SELECT v.slug, v.name, v.short_name, v.kind, v.sort_index
FROM (VALUES
  ('archeo_sion', 'ARCHEO Sion', 'ARCHEO Sion', 'ar', 5),
  ('nettoyage_center', 'Nettoyage Center', 'Nettoyage', 'ops', 6),
  ('event', 'Événement outdoor', 'Event', 'event', 7)
) AS v(slug, name, short_name, kind, sort_index)
WHERE NOT EXISTS (SELECT 1 FROM public.gh_locations l WHERE l.slug = v.slug);

UPDATE public.gh_locations SET name = 'ARCHEO Sion', short_name = 'ARCHEO Sion' WHERE slug = 'archeo_sion';
UPDATE public.gh_locations SET name = 'Nettoyage Center', short_name = 'Nettoyage' WHERE slug = 'nettoyage_center';
UPDATE public.gh_locations SET name = 'Événement outdoor', short_name = 'Event' WHERE slug = 'event';

-- ============================================================================
-- 2. Jeux training : créer / ranger sur le bon circuit
-- ============================================================================

INSERT INTO public.gh_games (location_id, slug, name, sort_index)
SELECT l.id, v.slug, v.name, v.sort_index
FROM public.gh_locations l
JOIN (VALUES
  ('vr_center', 'magi_room', 'Magi Room', 7),
  ('vr_center', 'rave', 'RAVE', 8),
  ('escape_sion', 'davinci_kids', 'Da Vinci Kids', 2),
  ('escape_sion', 'davinci_vinum', 'Da Vinci Vinum', 3),
  ('event', 'event_outdoor', 'Événement outdoor', 1),
  ('archeo_sion', 'archeogame', 'ARcheo Game', 1),
  ('nettoyage_center', 'nettoyage', 'Nettoyage centre VR', 1)
) AS v(location_slug, slug, name, sort_index) ON v.location_slug = l.slug
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  location_id = EXCLUDED.location_id,
  sort_index = EXCLUDED.sort_index;

UPDATE public.gh_games g
SET location_id = l.id, name = 'ARcheo Game', sort_index = 1
FROM public.gh_locations l
WHERE g.slug = 'archeogame' AND l.slug = 'archeo_sion';

UPDATE public.gh_games g
SET location_id = l.id, name = 'Nettoyage centre VR', sort_index = 1
FROM public.gh_locations l
WHERE g.slug = 'nettoyage' AND l.slug = 'nettoyage_center';

-- ============================================================================
-- 3. Mapping RH public.games → gh_games (les 14 compétences)
-- ============================================================================

INSERT INTO public.gh_game_rh_map (games_id, gh_games_id, notes)
SELECT g.id, ghg.id, v.notes
FROM (VALUES
  ('ARcheo Game - Sion', 'archeogame', 'ARcheo Game → circuit ARCHEO SION'),
  ('Da Vinci Code', 'davinci', 'Da Vinci Code → circuit Escape Life Sion'),
  ('Da Vinci Kids', 'davinci_kids', 'Da Vinci Kids → circuit Escape Life Sion'),
  ('Da Vinci Vinum', 'davinci_vinum', 'Da Vinci Vinum → circuit Escape Life Sion'),
  ('Evenement outdoor', 'event_outdoor', 'Evenement outdoor → circuit EVENT'),
  ('La Bataille de la Planta - L''assaut', 'planta', 'Planta → circuit VR Center'),
  ('Le Feu Sacré', 'feux_sacres', 'Feu Sacré → circuit Escape Life Sierre'),
  ('Magi Room', 'magi_room', 'Magi Room → circuit VR Center'),
  ('Nettoyage centre VR', 'nettoyage', 'Nettoyage → circuit NETTOYAGE CENTER'),
  ('RAVE', 'rave', 'RAVE → circuit VR Center'),
  ('SAGA - SR I & II', 'saga', 'SAGA → circuit VR Center'),
  ('SchoolCrafter', 'schoolcrafter', 'SchoolCrafter → circuit VR Center'),
  ('Serviteur de la Rédemption I', 'serviteur', 'Serviteur I → circuit VR Center'),
  ('Serviteur de la Rédemption II', 'serviteur', 'Serviteur II → circuit VR Center')
) AS v(rh_name, gh_slug, notes)
JOIN public.games g ON g.name = v.rh_name
JOIN public.gh_games ghg ON ghg.slug = v.gh_slug
ON CONFLICT (games_id, gh_games_id) DO UPDATE SET notes = EXCLUDED.notes;

-- Filet si le nom RH diffère légèrement (Kids/Vinum déjà mappés vers davinci en 054)
INSERT INTO public.gh_game_rh_map (games_id, gh_games_id, notes)
SELECT g.id, ghg.id, 'Da Vinci (filet) → circuit Escape Life Sion'
FROM public.games g
CROSS JOIN public.gh_games ghg
WHERE g.name ILIKE '%Da%Vinci%'
  AND ghg.slug IN ('davinci', 'davinci_kids', 'davinci_vinum')
  AND (
    (g.name ILIKE '%Kids%' AND ghg.slug = 'davinci_kids')
    OR (g.name ILIKE '%Vinum%' AND ghg.slug = 'davinci_vinum')
    OR (g.name ILIKE '%Code%' AND ghg.slug = 'davinci')
    OR (g.name NOT ILIKE '%Kids%' AND g.name NOT ILIKE '%Vinum%' AND ghg.slug = 'davinci')
  )
ON CONFLICT (games_id, gh_games_id) DO NOTHING;

INSERT INTO public.gh_game_rh_map (games_id, gh_games_id, notes)
SELECT g.id, ghg.id, v.notes
FROM (VALUES
  ('%Magi%Room%', 'magi_room', 'Magi Room (filet) → circuit VR Center'),
  ('%RAVE%', 'rave', 'RAVE (filet) → circuit VR Center'),
  ('%Feu%Sacr%', 'feux_sacres', 'Feu Sacré (filet) → circuit Escape Life Sierre'),
  ('%Evenement%outdoor%', 'event_outdoor', 'Event outdoor (filet) → circuit EVENT'),
  ('%Événement%outdoor%', 'event_outdoor', 'Event outdoor (filet accent) → circuit EVENT')
) AS v(pattern, gh_slug, notes)
JOIN public.games g ON g.name ILIKE v.pattern
JOIN public.gh_games ghg ON ghg.slug = v.gh_slug
ON CONFLICT (games_id, gh_games_id) DO NOTHING;

-- ============================================================================
-- 4. Fiches nettoyage de boucle VR : aussi visibles du circuit Nettoyage
--    (la boucle VR reste taguée vr_center pour Planta / Saga / …)
-- ============================================================================

INSERT INTO public.gh_fiche_scope_locations (fiche_id, location_id)
SELECT f.id, loc.id
FROM public.gh_procedure_fiches f
CROSS JOIN public.gh_locations loc
WHERE loc.slug = 'nettoyage_center'
  AND f.deleted_at IS NULL
  AND (
    f.title ILIKE '%nettoyage%'
    OR f.title ILIKE '%ménage%'
  )
  AND EXISTS (
    SELECT 1
    FROM public.gh_fiche_scope_locations s
    JOIN public.gh_locations l ON l.id = s.location_id
    WHERE s.fiche_id = f.id AND l.slug = 'vr_center'
  )
ON CONFLICT (fiche_id, location_id) DO NOTHING;

COMMENT ON TABLE public.gh_game_rh_map IS
  'Maps Lovable RH games to gh_games. Le filtre Formations élargit au circuit (lieu) du jeu.
   Archeogame → archeo_sion ; Nettoyage → nettoyage_center ; Magi Room / RAVE / Planta / SAGA /
   SchoolCrafter / Serviteur → vr_center ; Da Vinci* → escape_sion ; Feu Sacré → escape_sierre ;
   Event → event.';

-- ============================================================================
-- 5. Vérifications
-- ============================================================================
-- SELECT slug, name, short_name FROM public.gh_locations ORDER BY sort_index;
-- SELECT g.slug, g.name, l.slug AS circuit FROM public.gh_games g JOIN public.gh_locations l ON l.id = g.location_id ORDER BY l.sort_index, g.sort_index;
-- SELECT g.name AS rh, ghg.slug, m.notes FROM public.gh_game_rh_map m JOIN public.games g ON g.id = m.games_id JOIN public.gh_games ghg ON ghg.id = m.gh_games_id ORDER BY g.name;
-- -- TEST-1 Planta + Da Vinci :
-- SELECT public.gh_get_authorized_game_ids('f813a743-3d17-4977-85bb-35771754fd7b'::uuid);
