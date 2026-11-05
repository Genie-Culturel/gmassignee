-- 052: Encaissement utilisé (y compris total 0.–) → flag cash « à relever » dans l’Historique.
-- total_collected DEFAULT 0 ne distingue pas « jamais utilisé » de « enregistré à 0.– ».
-- sales_recorded_at est posé dès qu’un GM sauvegarde le module Ventes & encaissement.

ALTER TABLE public.gh_vr_sessions
  ADD COLUMN IF NOT EXISTS sales_recorded_at timestamptz;

COMMENT ON COLUMN public.gh_vr_sessions.sales_recorded_at IS
  'Sauvegarde du module Ventes & encaissement. NULL = jamais utilisé. Non-NULL (même si total 0.–) = flag cash à relever.';

-- Sessions déjà passées par le module : lignes de vente, montants, ou facture.
UPDATE public.gh_vr_sessions s
SET sales_recorded_at = COALESCE(
  (
    SELECT MIN(ss.created_at)
    FROM public.gh_session_sales ss
    WHERE ss.session_id = s.id
  ),
  s.started_at
)
WHERE s.sales_recorded_at IS NULL
  AND (
    EXISTS (SELECT 1 FROM public.gh_session_sales ss WHERE ss.session_id = s.id)
    OR COALESCE(s.total_collected, 0) > 0
    OR COALESCE(s.total_to_invoice, 0) > 0
  );
