-- =====================================================================
-- TEMP_DISABLE_AUTH_RLS.sql
-- =====================================================================
-- Google/Supabase login hata kar site-wide username/password laga diya
-- hai. Ab app Supabase se ANON key ke saath baat karta hai — koi logged-in
-- Supabase user nahi hota.
--
-- Purane RLS policies sirf `authenticated` role ko allow karte the,
-- isliye ab:
--   - Employees / Non-employees list khaali dikhegi
--   - Save / edit / delete fail hoga
--
-- Ye script Supabase Dashboard -> SQL Editor mein paste karke RUN karo.
--
-- ⚠️  WARNING: iske baad tumhara anon key jis ke paas bhi hai (browser ke
--     network tab mein dikh jata hai) wo in tables ko read/write kar sakta
--     hai. Ye sirf temporary internal setup ke liye theek hai.
--     Google auth wapas aane par ROLLBACK section neeche diya hai.
-- =====================================================================


-- ---------------------------------------------------------------------
-- STEP 1: employees + non_employees ke saare purane policies hata do
-- ---------------------------------------------------------------------
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('employees', 'non_employees')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;


-- ---------------------------------------------------------------------
-- STEP 2: RLS on rakho, par anon + authenticated dono ko full access do
-- ---------------------------------------------------------------------
ALTER TABLE public.employees      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.non_employees  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "temp_public_access_employees"
  ON public.employees
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "temp_public_access_non_employees"
  ON public.non_employees
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);


-- ---------------------------------------------------------------------
-- STEP 3: Verify — dono tables par naya policy dikhna chahiye
-- ---------------------------------------------------------------------
SELECT tablename, policyname, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('employees', 'non_employees')
ORDER BY tablename, policyname;


-- =====================================================================
-- ROLLBACK (Google auth wapas laane ke baad ye chalao)
-- =====================================================================
-- DROP POLICY IF EXISTS "temp_public_access_employees"     ON public.employees;
-- DROP POLICY IF EXISTS "temp_public_access_non_employees" ON public.non_employees;
--
-- CREATE POLICY "authenticated_access_employees"
--   ON public.employees
--   FOR ALL
--   TO authenticated
--   USING (true)
--   WITH CHECK (true);
--
-- CREATE POLICY "authenticated_access_non_employees"
--   ON public.non_employees
--   FOR ALL
--   TO authenticated
--   USING (true)
--   WITH CHECK (true);
-- =====================================================================
