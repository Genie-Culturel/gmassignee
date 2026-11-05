-- Migration 049: Fix formateur_suivi RLS policies for scope junction tables
-- La migration 047 a corrigé les politiques pour gh_procedure_fiches mais a oublié
-- les tables de jonction gh_fiche_scope_locations et gh_fiche_scope_games.
-- Un formateur qui sauvegarde une fiche avec un scope (lieu/jeu) reçoit une erreur RLS.

-- Contexte:
-- - has_formateur_role() existe déjà (créé en migration 046)
-- - gh_procedure_fiches autorise déjà has_formateur_role() pour CRUD (migration 047)
-- - Mais gh_fiche_scope_locations et gh_fiche_scope_games utilisent toujours is_admin()
-- - Le client (trainingRepository.ts) supprime/insère dans ces tables lors de la sauvegarde

-- 1. gh_fiche_scope_locations: permettre aux formateurs de gérer les liens fiche↔lieu

DROP POLICY IF EXISTS "Admins manage fiche_scope_locations" ON public.gh_fiche_scope_locations;
DROP POLICY IF EXISTS "Admins manage gh_fiche_scope_locations" ON public.gh_fiche_scope_locations;

CREATE POLICY "Formateurs can manage fiche_scope_locations"
  ON public.gh_fiche_scope_locations FOR ALL
  USING (public.has_formateur_role())
  WITH CHECK (public.has_formateur_role());

-- 2. gh_fiche_scope_games: permettre aux formateurs de gérer les liens fiche↔jeu

DROP POLICY IF EXISTS "Admins manage fiche_scope_games" ON public.gh_fiche_scope_games;
DROP POLICY IF EXISTS "Admins manage gh_fiche_scope_games" ON public.gh_fiche_scope_games;

CREATE POLICY "Formateurs can manage fiche_scope_games"
  ON public.gh_fiche_scope_games FOR ALL
  USING (public.has_formateur_role())
  WITH CHECK (public.has_formateur_role());

-- Note: Les politiques SELECT pour authenticated restent inchangées (déjà créées en migration 015).
-- Note: Les tables gh_locations et gh_games restent admin-only (catalogue géré uniquement par admins).

-- Documentation
COMMENT ON POLICY "Formateurs can manage fiche_scope_locations" ON public.gh_fiche_scope_locations IS
  'Permet aux formateurs (has_formateur_role) de créer/supprimer les associations fiche↔lieu lors de la sauvegarde du scope.';

COMMENT ON POLICY "Formateurs can manage fiche_scope_games" ON public.gh_fiche_scope_games IS
  'Permet aux formateurs (has_formateur_role) de créer/supprimer les associations fiche↔jeu lors de la sauvegarde du scope.';
