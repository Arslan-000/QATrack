-- ==============================================================================
-- PulseWave QA Platform — Complete Supabase Database & Auth Wipe / Fresh Reset
-- ==============================================================================
-- HOW TO RUN:
-- 1. Open Supabase Dashboard (https://supabase.com/dashboard)
-- 2. Select your project ("wbtvsishoufterznmfot")
-- 3. In the left sidebar, click "SQL Editor" -> "+ New Query"
-- 4. Paste this entire script and click "Run" (or Ctrl+Enter / Cmd+Enter)
--
-- WHAT THIS DOES:
-- ✔ Deletes ALL Supabase Auth Accounts (auth.users)
-- ✔ Wipes ALL Application Tables (Spaces, Projects, Issues, Test Cases, Chats, etc.)
-- ✔ Deletes ALL uploaded files/attachments (storage.objects)
-- ✔ Resets your Supabase project to a 100% completely clean, brand-new state!
-- ==============================================================================

BEGIN;

-- 1. Disable triggers and foreign key constraints temporarily
SET session_replication_role = 'replica';

-- 2. Dynamically TRUNCATE every single table in the public schema
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'TRUNCATE TABLE public.' || quote_ident(r.tablename) || ' CASCADE;';
    END LOOP;
END $$;

-- 3. Delete all Supabase Auth Users & Sessions
DELETE FROM auth.users;

-- 4. Clean Supabase Storage objects (if any uploaded files exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'objects') THEN
        DELETE FROM storage.objects;
    END IF;
END $$;

-- 5. Re-enable standard triggers & constraints
SET session_replication_role = 'origin';

COMMIT;

-- ==============================================================================
-- VERIFICATION: Run count check to confirm everything is 0 (100% clean)
-- ==============================================================================
SELECT 
    (SELECT COUNT(*) FROM auth.users) AS remaining_auth_users,
    (SELECT COUNT(*) FROM public.profiles) AS remaining_profiles,
    (SELECT COUNT(*) FROM public.spaces) AS remaining_spaces,
    (SELECT COUNT(*) FROM public.projects) AS remaining_projects,
    (SELECT COUNT(*) FROM public.issues) AS remaining_issues,
    (SELECT COUNT(*) FROM public.test_cases) AS remaining_test_cases,
    (SELECT COUNT(*) FROM public.chat_messages) AS remaining_chat_messages;
