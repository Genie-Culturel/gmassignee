-- Migration 055: double tag jeu VR Centre + lieu VR Center
-- À coller dans Lovable Cloud SQL (dnxyidnkmtrmkxucqrry) si pas déjà appliqué.
-- Idempotent. Ne publie pas l'app Lovable.
--
-- Pitch / présentation / lancement Planta (et Serviteur, Saga, SchoolCrafter)
-- n'avaient que gh_fiche_scope_games → badge « Bataille de la Planta » seul.
-- On ajoute gh_fiche_scope_locations.vr_center. scope_kind reste `games`
-- pour ne pas transformer ces fiches en circuit visible à tous les GM VR.

INSERT INTO public.gh_fiche_scope_locations (fiche_id, location_id)
SELECT DISTINCT s.fiche_id, loc.id
FROM public.gh_fiche_scope_games s
JOIN public.gh_games g ON g.id = s.game_id
JOIN public.gh_locations loc ON loc.slug = 'vr_center'
JOIN public.gh_procedure_fiches f ON f.id = s.fiche_id
WHERE g.slug IN ('planta', 'serviteur', 'saga', 'schoolcrafter')
  AND f.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.gh_fiche_scope_locations existing
    WHERE existing.fiche_id = s.fiche_id
      AND existing.location_id = loc.id
  );

-- Vérif :
-- SELECT f.title, f.scope_kind, g.slug AS game, l.slug AS loc
-- FROM public.gh_procedure_fiches f
-- JOIN public.gh_fiche_scope_games s ON s.fiche_id = f.id
-- JOIN public.gh_games g ON g.id = s.game_id
-- LEFT JOIN public.gh_fiche_scope_locations sl ON sl.fiche_id = f.id
-- LEFT JOIN public.gh_locations l ON l.id = sl.location_id
-- WHERE g.slug IN ('planta','serviteur','saga','schoolcrafter')
--   AND f.deleted_at IS NULL
-- ORDER BY g.slug, f.title;
