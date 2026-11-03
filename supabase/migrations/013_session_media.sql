-- Session client videos: storage bucket, tracking table, send timestamp, cleanup.
-- Additive only.

ALTER TABLE public.vr_sessions
  ADD COLUMN IF NOT EXISTS client_email text,
  ADD COLUMN IF NOT EXISTS videos_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS videos_download_token uuid NOT NULL DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX IF NOT EXISTS idx_vr_sessions_download_token
  ON public.vr_sessions (videos_download_token);

COMMENT ON COLUMN public.vr_sessions.client_email IS
  'E-mail du client / groupe pour l''envoi des vidéos souvenirs.';
COMMENT ON COLUMN public.vr_sessions.videos_sent_at IS
  'Horodatage de l''envoi des vidéos au client.';
COMMENT ON COLUMN public.vr_sessions.videos_download_token IS
  'Jeton opaque pour la page de téléchargement (liens 14 jours).';

CREATE TABLE IF NOT EXISTS public.session_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.vr_sessions(id) ON DELETE CASCADE,
  path text NOT NULL,
  original_name text,
  size bigint NOT NULL DEFAULT 0,
  mime text,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  UNIQUE (session_id, path)
);

CREATE INDEX IF NOT EXISTS idx_session_media_session_id ON public.session_media (session_id);
CREATE INDEX IF NOT EXISTS idx_session_media_expires_at ON public.session_media (expires_at);

ALTER TABLE public.session_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "GMs manage own session media" ON public.session_media;
CREATE POLICY "GMs manage own session media"
  ON public.session_media FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.vr_sessions s
      WHERE s.id = session_media.session_id AND s.gm_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.vr_sessions s
      WHERE s.id = session_media.session_id AND s.gm_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins read all session media" ON public.session_media;
CREATE POLICY "Admins read all session media"
  ON public.session_media FOR SELECT
  USING (public.is_admin());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.session_media TO authenticated;

-- Private bucket, 50 MiB/file (free plan). Raise file_size_limit when moving to Pro.
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('session-media', 'session-media', false, 52428800)
ON CONFLICT (id) DO UPDATE SET file_size_limit = EXCLUDED.file_size_limit, public = false;

DROP POLICY IF EXISTS "session_media_storage_select" ON storage.objects;
CREATE POLICY "session_media_storage_select"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'session-media'
    AND (
      public.is_admin()
      OR EXISTS (
        SELECT 1 FROM public.vr_sessions s
        WHERE s.id::text = split_part(name, '/', 1)
          AND s.gm_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "session_media_storage_insert" ON storage.objects;
CREATE POLICY "session_media_storage_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'session-media'
    AND (
      public.is_admin()
      OR EXISTS (
        SELECT 1 FROM public.vr_sessions s
        WHERE s.id::text = split_part(name, '/', 1)
          AND s.gm_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "session_media_storage_update" ON storage.objects;
CREATE POLICY "session_media_storage_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'session-media'
    AND (
      public.is_admin()
      OR EXISTS (
        SELECT 1 FROM public.vr_sessions s
        WHERE s.id::text = split_part(name, '/', 1)
          AND s.gm_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "session_media_storage_delete" ON storage.objects;
CREATE POLICY "session_media_storage_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'session-media'
    AND (
      public.is_admin()
      OR EXISTS (
        SELECT 1 FROM public.vr_sessions s
        WHERE s.id::text = split_part(name, '/', 1)
          AND s.gm_id = auth.uid()
      )
    )
  );

-- Deletes expired storage objects + rows. Call daily (pg_cron or edge function).
CREATE OR REPLACE FUNCTION public.cleanup_expired_session_media()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  n integer := 0;
BEGIN
  BEGIN
    DELETE FROM storage.objects o
    WHERE o.bucket_id = 'session-media'
      AND o.name IN (
        SELECT m.path FROM public.session_media m WHERE m.expires_at < now()
      );
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'storage.objects delete skipped: %', SQLERRM;
  END;
  DELETE FROM public.session_media WHERE expires_at < now();
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cleanup_expired_session_media() TO service_role;

-- pg_cron is not enabled on this project yet; try to schedule, ignore if unavailable.
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_cron;
  PERFORM cron.schedule(
    'cleanup-session-media-daily',
    '20 3 * * *',
    'SELECT public.cleanup_expired_session_media()'
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'pg_cron not scheduled (%). Use the cleanup-session-media edge function or call cleanup_expired_session_media() daily.', SQLERRM;
END;
$$;
