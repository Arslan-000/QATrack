-- ==============================================================================
-- PulseWave QA Platform — Complete Supabase Database & Auth Wipe / Reset Script
-- ==============================================================================
-- RUN THIS SCRIPT IN: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- WARNING: This will permanently delete all authentication accounts (auth.users),
-- user profiles, spaces, projects, issues, test cases, test runs, sprints, and chats.
-- ==============================================================================

BEGIN;

-- 1. Disable triggers temporarily to avoid foreign key constraints during wipe
SET session_replication_role = 'replica';

-- 2. Delete all records from Application Tables (Cascade Clean)
TRUNCATE TABLE 
    public.chat_message_links,
    public.chat_message_attachments,
    public.chat_message_mentions,
    public.chat_message_reactions,
    public.chat_messages,
    public.chat_conversation_members,
    public.chat_conversations,
    public.documents,
    public.document_templates,
    public.ai_email_logs,
    public.ai_generations,
    public.release_issue_links,
    public.release_decisions,
    public.project_quality_settings,
    public.release_risk_factors,
    public.release_quality_assessments,
    public.releases,
    public.test_reports,
    public.test_results,
    public.test_runs,
    public.test_suites,
    public.test_issue_links,
    public.test_executions,
    public.test_cases,
    public.sprints,
    public.issues,
    public.project_invitations,
    public.project_members,
    public.projects,
    public.workspace_invitations,
    public.workspace_members,
    public.spaces,
    public.profiles
CASCADE;

-- 3. Delete all Supabase Auth Accounts (Users)
-- This deletes all registered accounts from Supabase Authentication
DELETE FROM auth.users;

-- 4. Re-enable standard triggers & replication
SET session_replication_role = 'origin';

COMMIT;

-- Verify Clean State
SELECT 
    (SELECT COUNT(*) FROM auth.users) AS remaining_auth_users,
    (SELECT COUNT(*) FROM public.profiles) AS remaining_profiles,
    (SELECT COUNT(*) FROM public.spaces) AS remaining_spaces,
    (SELECT COUNT(*) FROM public.projects) AS remaining_projects,
    (SELECT COUNT(*) FROM public.issues) AS remaining_issues,
    (SELECT COUNT(*) FROM public.test_cases) AS remaining_test_cases;
