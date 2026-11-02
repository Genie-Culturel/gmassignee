-- Fix admin RLS: auth.jwt() ->> 'role' is always 'authenticated' on hosted
-- Supabase (the JWT role claim is the Postgres role, not the app role).
-- App-level admin is stored in JWT app_metadata.role.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$;

COMMENT ON FUNCTION public.is_admin() IS
  'True when the JWT app_metadata.role is admin. Use in RLS instead of auth.jwt() ->> ''role''.';

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- procedure_fiches
DROP POLICY IF EXISTS "Admins can manage fiches" ON public.procedure_fiches;
CREATE POLICY "Admins can manage fiches"
  ON public.procedure_fiches FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- checklist_template_fiches
DROP POLICY IF EXISTS "Admins can manage checklist fiche links" ON public.checklist_template_fiches;
CREATE POLICY "Admins can manage checklist fiche links"
  ON public.checklist_template_fiches FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- session_step_fiches
DROP POLICY IF EXISTS "Admins can manage session step fiche links" ON public.session_step_fiches;
CREATE POLICY "Admins can manage session step fiche links"
  ON public.session_step_fiches FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- gm_checkins
DROP POLICY IF EXISTS "Admins can read all check-ins" ON public.gm_checkins;
CREATE POLICY "Admins can read all check-ins"
  ON public.gm_checkins FOR SELECT
  USING (public.is_admin());

-- checklist_templates
DROP POLICY IF EXISTS "Admins can manage checklist templates" ON public.checklist_templates;
CREATE POLICY "Admins can manage checklist templates"
  ON public.checklist_templates FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- checklist_completions
DROP POLICY IF EXISTS "Admins can read all completions" ON public.checklist_completions;
CREATE POLICY "Admins can read all completions"
  ON public.checklist_completions FOR SELECT
  USING (public.is_admin());

-- vr_sessions
DROP POLICY IF EXISTS "Admins can read all sessions" ON public.vr_sessions;
CREATE POLICY "Admins can read all sessions"
  ON public.vr_sessions FOR SELECT
  USING (public.is_admin());

-- session_steps
DROP POLICY IF EXISTS "Admins can read all session steps" ON public.session_steps;
CREATE POLICY "Admins can read all session steps"
  ON public.session_steps FOR SELECT
  USING (public.is_admin());

-- sales_products
DROP POLICY IF EXISTS "Admins can manage sales products" ON public.sales_products;
CREATE POLICY "Admins can manage sales products"
  ON public.sales_products FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- session_sales
DROP POLICY IF EXISTS "Admins can read all session sales" ON public.session_sales;
CREATE POLICY "Admins can read all session sales"
  ON public.session_sales FOR SELECT
  USING (public.is_admin());
