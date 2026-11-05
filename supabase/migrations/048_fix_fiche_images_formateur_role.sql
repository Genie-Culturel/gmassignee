-- Migration 048: Fix fiche-images storage policies for formateur_suivi role
-- Les policies créées en 045 permettent uniquement is_admin() d'uploader des images.
-- Cette migration corrige pour autoriser has_formateur_role() (admin + formateur_suivi).

-- DROP les policies existantes créées en 045
DROP POLICY IF EXISTS "fiche_images_select" ON storage.objects;
DROP POLICY IF EXISTS "fiche_images_insert" ON storage.objects;
DROP POLICY IF EXISTS "fiche_images_update" ON storage.objects;
DROP POLICY IF EXISTS "fiche_images_delete" ON storage.objects;

-- Recréer les policies avec has_formateur_role() au lieu de is_admin()

-- SELECT: lecture publique (bucket public)
CREATE POLICY "fiche_images_select" ON storage.objects FOR SELECT
  USING (bucket_id = 'fiche-images');

-- INSERT: formateurs (admin + formateur_suivi) peuvent uploader
CREATE POLICY "fiche_images_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'fiche-images' AND public.has_formateur_role());

-- UPDATE: formateurs peuvent modifier
CREATE POLICY "fiche_images_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'fiche-images' AND public.has_formateur_role())
  WITH CHECK (bucket_id = 'fiche-images' AND public.has_formateur_role());

-- DELETE: formateurs peuvent supprimer
CREATE POLICY "fiche_images_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'fiche-images' AND public.has_formateur_role());

-- Documentation
COMMENT ON POLICY "fiche_images_insert" ON storage.objects IS
  'Formateurs (admin + formateur_suivi via has_formateur_role) peuvent uploader des images de fiches.';
