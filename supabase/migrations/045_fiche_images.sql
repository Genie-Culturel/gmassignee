-- Optional images (screenshots/photos) on fiche steps: public bucket, admin write.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('fiche-images', 'fiche-images', true, 10485760, ARRAY['image/jpeg','image/png','image/webp','image/gif'])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = EXCLUDED.file_size_limit, allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "fiche_images_select" ON storage.objects;
CREATE POLICY "fiche_images_select" ON storage.objects FOR SELECT
  USING (bucket_id = 'fiche-images');
DROP POLICY IF EXISTS "fiche_images_insert" ON storage.objects;
CREATE POLICY "fiche_images_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'fiche-images' AND public.is_admin());
DROP POLICY IF EXISTS "fiche_images_update" ON storage.objects;
CREATE POLICY "fiche_images_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'fiche-images' AND public.is_admin())
  WITH CHECK (bucket_id = 'fiche-images' AND public.is_admin());
DROP POLICY IF EXISTS "fiche_images_delete" ON storage.objects;
CREATE POLICY "fiche_images_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'fiche-images' AND public.is_admin());
