-- ==============================================================================
-- PulseWave QA Platform — Production Supabase PostgreSQL Relational Schema
-- ==============================================================================

-- 1. USER PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    avatar_url TEXT,
    role TEXT DEFAULT 'QA Engineer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. SPACES / WORKSPACES
CREATE TABLE IF NOT EXISTS public.spaces (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    company_name TEXT,
    workspace_type TEXT DEFAULT 'Software Company',
    logo_color TEXT DEFAULT 'bg-blue-600',
    logo_url TEXT,
    description TEXT,
    owner_id TEXT,
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. WORKSPACE MEMBERS
CREATE TABLE IF NOT EXISTS public.workspace_members (
    id TEXT PRIMARY KEY,
    workspace_id TEXT REFERENCES public.spaces(id) ON DELETE CASCADE,
    user_id TEXT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT DEFAULT 'QA_ENGINEER', -- OWNER, PROJECT_MANAGER, QA_ENGINEER, DEVELOPER, VIEWER
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(workspace_id, email)
);

-- 4. WORKSPACE INVITATIONS
CREATE TABLE IF NOT EXISTS public.workspace_invitations (
    id TEXT PRIMARY KEY,
    workspace_id TEXT REFERENCES public.spaces(id) ON DELETE CASCADE,
    invited_email TEXT NOT NULL,
    invited_by TEXT,
    role TEXT DEFAULT 'QA_ENGINEER',
    status TEXT DEFAULT 'Pending', -- Pending, Accepted, Expired, Cancelled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now() + interval '7 days') NOT NULL
);

-- 5. PROJECTS
CREATE TABLE IF NOT EXISTS public.projects (
    id TEXT PRIMARY KEY,
    workspace_id TEXT REFERENCES public.spaces(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'Core QA & Engineering',
    customer TEXT DEFAULT 'Enterprise Client',
    priority TEXT DEFAULT 'P1',
    status TEXT DEFAULT 'Active',
    health INTEGER DEFAULT 100,
    pm_id TEXT,
    start_date DATE,
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. PROJECT MEMBERS
CREATE TABLE IF NOT EXISTS public.project_members (
    id TEXT PRIMARY KEY,
    project_id TEXT REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id TEXT,
    email TEXT,
    role TEXT DEFAULT 'DEVELOPER', -- OWNER, QA_MANAGER, DEVELOPER, VIEWER, CLIENT_VIEWER
    status TEXT DEFAULT 'Active', -- Active, Suspended
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6b. PROJECT & SPACE INVITATIONS
CREATE TABLE IF NOT EXISTS public.project_invitations (
    id TEXT PRIMARY KEY,
    workspace_id TEXT REFERENCES public.spaces(id) ON DELETE CASCADE,
    project_id TEXT REFERENCES public.projects(id) ON DELETE CASCADE, -- NULL for Space-level invitations (e.g. QA, Space Viewer)
    scope TEXT NOT NULL DEFAULT 'PROJECT', -- 'SPACE' (Entire Space) or 'PROJECT' (Specific Project)
    invited_email TEXT NOT NULL,
    invited_by TEXT,
    role TEXT DEFAULT 'DEVELOPER', -- 'PM', 'QA', 'DEVELOPER', 'VIEWER'
    token TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'PENDING', -- PENDING, ACCEPTED, EXPIRED, CANCELLED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_project_members_project ON public.project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user ON public.project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_invitations_workspace ON public.project_invitations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_project_invitations_project ON public.project_invitations(project_id);
CREATE INDEX IF NOT EXISTS idx_project_invitations_token ON public.project_invitations(token);
CREATE INDEX IF NOT EXISTS idx_project_invitations_email ON public.project_invitations(invited_email);

-- 7. ISSUES & TICKETS
CREATE TABLE IF NOT EXISTS public.issues (
    id TEXT PRIMARY KEY,
    project_id TEXT REFERENCES public.projects(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT DEFAULT 'Story', -- Bug, Task, Story, Epic
    status TEXT DEFAULT 'Backlog', -- Backlog, Todo, In Progress, QA, Done, Closed
    priority TEXT DEFAULT 'Medium', -- Low, Medium, High, Critical
    qa_status TEXT DEFAULT 'Not Tested', -- Not Tested, Ready for QA, In QA, Passed, Failed
    assignee_id TEXT,
    reporter_id TEXT,
    developer_id TEXT,
    story_points INTEGER DEFAULT 3,
    sprint_id TEXT,
    environment TEXT DEFAULT 'Staging',
    release_version TEXT DEFAULT 'v1.0.0',
    build_version TEXT DEFAULT 'b101',
    reopen_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. SPRINTS
CREATE TABLE IF NOT EXISTS public.sprints (
    id TEXT PRIMARY KEY,
    project_id TEXT REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    goal TEXT,
    status TEXT DEFAULT 'Active', -- Planning, Active, Completed
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. TEST CASES, TEST EXECUTIONS & ISSUE LINKS
CREATE TABLE IF NOT EXISTS public.test_cases (
    id TEXT PRIMARY KEY,
    project_id TEXT REFERENCES public.projects(id) ON DELETE CASCADE,
    workspace_id TEXT REFERENCES public.spaces(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    module TEXT DEFAULT 'General',
    feature TEXT,
    type TEXT DEFAULT 'Functional', -- Functional, Smoke, Sanity, Regression, Integration, UAT, E2E, Exploratory
    priority TEXT DEFAULT 'Medium', -- Critical, High, Medium, Low / P0, P1, P2, P3
    status TEXT DEFAULT 'Active', -- Draft, Active, Archived
    preconditions TEXT,
    steps JSONB DEFAULT '[]'::jsonb, -- Array of { stepNumber, action, expectedResult }
    expected_result TEXT,
    test_data TEXT,
    environment TEXT DEFAULT 'Staging',
    browser TEXT DEFAULT 'Chrome / Desktop',
    tags JSONB DEFAULT '["Regression"]'::jsonb,
    assigned_to TEXT,
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9b. TEST EXECUTIONS (Immutable Historical Execution Runs)
CREATE TABLE IF NOT EXISTS public.test_executions (
    id TEXT PRIMARY KEY,
    project_id TEXT REFERENCES public.projects(id) ON DELETE CASCADE,
    workspace_id TEXT REFERENCES public.spaces(id) ON DELETE CASCADE,
    test_case_id TEXT REFERENCES public.test_cases(id) ON DELETE CASCADE,
    cycle_name TEXT DEFAULT 'QA Test Cycle',
    release_version TEXT DEFAULT 'v1.0.0',
    environment TEXT DEFAULT 'Staging',
    test_type TEXT DEFAULT 'Regression',
    status TEXT DEFAULT 'Passed', -- Passed, Failed, Blocked, Skipped, Not Run
    actual_result TEXT,
    comments TEXT,
    step_results JSONB DEFAULT '[]'::jsonb,
    evidence JSONB DEFAULT '[]'::jsonb,
    linked_defect_key TEXT,
    executed_by TEXT,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9c. TEST CASE & BUG LINKS
CREATE TABLE IF NOT EXISTS public.test_issue_links (
    id TEXT PRIMARY KEY,
    project_id TEXT REFERENCES public.projects(id) ON DELETE CASCADE,
    test_case_id TEXT REFERENCES public.test_cases(id) ON DELETE CASCADE,
    issue_id TEXT REFERENCES public.issues(id) ON DELETE CASCADE,
    issue_key TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_test_cases_project ON public.test_cases(project_id);
CREATE INDEX IF NOT EXISTS idx_test_cases_module ON public.test_cases(module);
CREATE INDEX IF NOT EXISTS idx_test_executions_project ON public.test_executions(project_id);
CREATE INDEX IF NOT EXISTS idx_test_executions_case ON public.test_executions(test_case_id);
CREATE INDEX IF NOT EXISTS idx_test_issue_links_case ON public.test_issue_links(test_case_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_issue_links ENABLE ROW LEVEL SECURITY;

-- Allow read & write access for authenticated and anonymous users
DROP POLICY IF EXISTS "Allow read/write on profiles" ON public.profiles;
CREATE POLICY "Allow read/write on profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read/write on spaces" ON public.spaces;
CREATE POLICY "Allow read/write on spaces" ON public.spaces FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read/write on workspace_members" ON public.workspace_members;
CREATE POLICY "Allow read/write on workspace_members" ON public.workspace_members FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read/write on workspace_invitations" ON public.workspace_invitations;
CREATE POLICY "Allow read/write on workspace_invitations" ON public.workspace_invitations FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read/write on projects" ON public.projects;
CREATE POLICY "Allow read/write on projects" ON public.projects FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read/write on project_members" ON public.project_members;
CREATE POLICY "Allow read/write on project_members" ON public.project_members FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read/write on project_invitations" ON public.project_invitations;
CREATE POLICY "Allow read/write on project_invitations" ON public.project_invitations FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read/write on issues" ON public.issues;
CREATE POLICY "Allow read/write on issues" ON public.issues FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read/write on sprints" ON public.sprints;
CREATE POLICY "Allow read/write on sprints" ON public.sprints FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read/write on test_cases" ON public.test_cases;
CREATE POLICY "Allow read/write on test_cases" ON public.test_cases FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read/write on test_executions" ON public.test_executions;
CREATE POLICY "Allow read/write on test_executions" ON public.test_executions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read/write on test_issue_links" ON public.test_issue_links;
CREATE POLICY "Allow read/write on test_issue_links" ON public.test_issue_links FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- 10. PULSEWAVE V2 — QA REPORT GENERATOR & STORAGE
-- ==============================================================================

-- 10a. QA Reports Record Table
CREATE TABLE IF NOT EXISTS public.qa_reports (
    id TEXT PRIMARY KEY,
    workspace_id TEXT REFERENCES public.spaces(id) ON DELETE CASCADE,
    project_id TEXT REFERENCES public.projects(id) ON DELETE CASCADE,
    report_name TEXT NOT NULL,
    template_name TEXT DEFAULT 'Annoushka Company Template',
    status TEXT DEFAULT 'DRAFT', -- DRAFT, GENERATED, IN_REVIEW, APPROVED, FINAL
    executive_summary TEXT,
    final_verdict TEXT DEFAULT 'READY FOR RELEASE', -- READY FOR RELEASE, BLOCKED
    lead_tester TEXT,
    reviewer TEXT,
    customer TEXT,
    release_version TEXT DEFAULT 'v2.4.1',
    start_date DATE,
    end_date DATE,
    total_test_cases INTEGER DEFAULT 0,
    passed_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    blocked_count INTEGER DEFAULT 0,
    not_executed_count INTEGER DEFAULT 0,
    pdf_storage_path TEXT,
    pdf_file_name TEXT,
    pdf_url TEXT,
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE
);

-- 10b. QA Report Test Cases
CREATE TABLE IF NOT EXISTS public.qa_test_cases (
    id TEXT PRIMARY KEY,
    report_id TEXT REFERENCES public.qa_reports(id) ON DELETE CASCADE,
    workspace_id TEXT REFERENCES public.spaces(id) ON DELETE CASCADE,
    project_id TEXT REFERENCES public.projects(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    title TEXT NOT NULL,
    software_application TEXT,
    tester_id TEXT,
    tester_name TEXT,
    test_reviewer TEXT,
    test_date DATE,
    description TEXT,
    pre_requisites TEXT,
    location_area TEXT,
    dependencies TEXT,
    required_configuration TEXT,
    results_summary TEXT,
    comments TEXT,
    linked_issue_id TEXT,
    order_index INTEGER DEFAULT 0,
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10c. QA Test Data (Multiple Key-Value rows per test case)
CREATE TABLE IF NOT EXISTS public.qa_test_data (
    id TEXT PRIMARY KEY,
    test_case_id TEXT REFERENCES public.qa_test_cases(id) ON DELETE CASCADE,
    data_key TEXT NOT NULL,
    data_value TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10d. QA Test Executions & Step Results
CREATE TABLE IF NOT EXISTS public.qa_test_executions (
    id TEXT PRIMARY KEY,
    test_case_id TEXT REFERENCES public.qa_test_cases(id) ON DELETE CASCADE,
    user_input TEXT,
    expected_result TEXT,
    actual_result TEXT,
    status TEXT DEFAULT 'NOT EXECUTED', -- PASS, FAIL, BLOCKED, NOT EXECUTED
    comments TEXT,
    executed_by TEXT,
    execution_date DATE,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for Fast Report & Test Case Queries
CREATE INDEX IF NOT EXISTS idx_qa_reports_project ON public.qa_reports(project_id);
CREATE INDEX IF NOT EXISTS idx_qa_reports_workspace ON public.qa_reports(workspace_id);
CREATE INDEX IF NOT EXISTS idx_qa_reports_status ON public.qa_reports(status);
CREATE INDEX IF NOT EXISTS idx_qa_test_cases_report ON public.qa_test_cases(report_id);
CREATE INDEX IF NOT EXISTS idx_qa_test_data_case ON public.qa_test_data(test_case_id);
CREATE INDEX IF NOT EXISTS idx_qa_test_exec_case ON public.qa_test_executions(test_case_id);

-- RLS Enablement
ALTER TABLE public.qa_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qa_test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qa_test_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qa_test_executions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read/write on qa_reports" ON public.qa_reports;
CREATE POLICY "Allow read/write on qa_reports" ON public.qa_reports FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read/write on qa_test_cases" ON public.qa_test_cases;
CREATE POLICY "Allow read/write on qa_test_cases" ON public.qa_test_cases FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read/write on qa_test_data" ON public.qa_test_data;
CREATE POLICY "Allow read/write on qa_test_data" ON public.qa_test_data FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read/write on qa_test_executions" ON public.qa_test_executions;
CREATE POLICY "Allow read/write on qa_test_executions" ON public.qa_test_executions FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- 11. SUPABASE STORAGE BUCKET: qa-reports
-- ==============================================================================
-- 12. PULSEWAVE — REAL-TIME PROJECT CHAT MODULE
-- ==============================================================================

-- 12a. Chat Conversations (Project General & Direct Messages)
CREATE TABLE IF NOT EXISTS public.chat_conversations (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('PROJECT', 'DIRECT')),
    name TEXT,
    created_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12b. Chat Conversation Members
CREATE TABLE IF NOT EXISTS public.chat_conversation_members (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    conversation_id TEXT NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_read_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(conversation_id, user_id)
);

-- 12c. Chat Messages
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    conversation_id TEXT NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL,
    message TEXT,
    reply_to_message_id TEXT REFERENCES public.chat_messages(id) ON DELETE SET NULL,
    edited_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12d. Chat Message Reactions
CREATE TABLE IF NOT EXISTS public.chat_message_reactions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    message_id TEXT NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    reaction TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(message_id, user_id, reaction)
);

-- 12e. Chat Message Mentions
CREATE TABLE IF NOT EXISTS public.chat_message_mentions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    message_id TEXT NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
    mentioned_user_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(message_id, mentioned_user_id)
);

-- 12f. Chat Message Attachments
CREATE TABLE IF NOT EXISTS public.chat_message_attachments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    message_id TEXT NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT,
    file_size BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12g. Chat Message Links (Issues, Test Cases, Sprints, Releases)
CREATE TABLE IF NOT EXISTS public.chat_message_links (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    message_id TEXT NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL CHECK (
        entity_type IN ('ISSUE', 'TEST_CASE', 'TEST_EXECUTION', 'SPRINT', 'RELEASE')
    ),
    entity_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_chat_conversations_project ON public.chat_conversations(project_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_type ON public.chat_conversations(type);
CREATE INDEX IF NOT EXISTS idx_chat_conv_members_conv ON public.chat_conversation_members(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_conv_members_user ON public.chat_conversation_members(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conv ON public.chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON public.chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON public.chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_reactions_msg ON public.chat_message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_chat_mentions_user ON public.chat_message_mentions(mentioned_user_id);
CREATE INDEX IF NOT EXISTS idx_chat_attachments_msg ON public.chat_message_attachments(message_id);
CREATE INDEX IF NOT EXISTS idx_chat_links_entity ON public.chat_message_links(entity_type, entity_id);

-- Storage Bucket for Chat Attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-chat-attachments', 'project-chat-attachments', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- RLS Enablement
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_message_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_message_links ENABLE ROW LEVEL SECURITY;

-- Helper function to verify project membership
CREATE OR REPLACE FUNCTION public.is_project_member(check_project_id TEXT, check_user_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.project_members
        WHERE project_id = check_project_id AND (user_id = check_user_id OR email = (SELECT email FROM public.profiles WHERE id::text = check_user_id))
    ) OR EXISTS (
        SELECT 1 FROM public.projects p
        JOIN public.workspace_members wm ON wm.workspace_id = p.workspace_id
        WHERE p.id = check_project_id AND (wm.user_id = check_user_id OR wm.email = (SELECT email FROM public.profiles WHERE id::text = check_user_id))
        AND wm.role IN ('OWNER', 'PROJECT_MANAGER', 'PM')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies on chat_conversations
DROP POLICY IF EXISTS "Chat Conversations Select" ON public.chat_conversations;
CREATE POLICY "Chat Conversations Select" ON public.chat_conversations
FOR SELECT USING (
    public.is_project_member(project_id, auth.uid()::text)
);

DROP POLICY IF EXISTS "Chat Conversations Insert" ON public.chat_conversations;
CREATE POLICY "Chat Conversations Insert" ON public.chat_conversations
FOR INSERT WITH CHECK (
    public.is_project_member(project_id, auth.uid()::text) AND created_by = auth.uid()::text
);

-- RLS Policies on chat_conversation_members
DROP POLICY IF EXISTS "Chat Members Select" ON public.chat_conversation_members;
CREATE POLICY "Chat Members Select" ON public.chat_conversation_members
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.chat_conversations c
        WHERE c.id = conversation_id AND public.is_project_member(c.project_id, auth.uid()::text)
    )
);

DROP POLICY IF EXISTS "Chat Members Update" ON public.chat_conversation_members;
CREATE POLICY "Chat Members Update" ON public.chat_conversation_members
FOR UPDATE USING (
    user_id = auth.uid()::text
);

-- RLS Policies on chat_messages
DROP POLICY IF EXISTS "Chat Messages Select" ON public.chat_messages;
CREATE POLICY "Chat Messages Select" ON public.chat_messages
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.chat_conversations c
        WHERE c.id = conversation_id AND public.is_project_member(c.project_id, auth.uid()::text)
    )
);

DROP POLICY IF EXISTS "Chat Messages Insert" ON public.chat_messages;
CREATE POLICY "Chat Messages Insert" ON public.chat_messages
FOR INSERT WITH CHECK (
    sender_id = auth.uid()::text AND
    EXISTS (
        SELECT 1 FROM public.chat_conversations c
        WHERE c.id = conversation_id AND public.is_project_member(c.project_id, auth.uid()::text)
    )
);

DROP POLICY IF EXISTS "Chat Messages Update" ON public.chat_messages;
CREATE POLICY "Chat Messages Update" ON public.chat_messages
FOR UPDATE USING (
    sender_id = auth.uid()::text OR
    EXISTS (
        SELECT 1 FROM public.chat_conversations c
        JOIN public.projects p ON p.id = c.project_id
        JOIN public.workspace_members wm ON wm.workspace_id = p.workspace_id
        WHERE c.id = conversation_id AND wm.user_id = auth.uid()::text AND wm.role IN ('OWNER', 'PROJECT_MANAGER', 'PM')
    )
);

-- RLS Policies on chat_message_reactions
DROP POLICY IF EXISTS "Chat Reactions Select" ON public.chat_message_reactions;
CREATE POLICY "Chat Reactions Select" ON public.chat_message_reactions
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.chat_messages m
        JOIN public.chat_conversations c ON c.id = m.conversation_id
        WHERE m.id = message_id AND public.is_project_member(c.project_id, auth.uid()::text)
    )
);

DROP POLICY IF EXISTS "Chat Reactions Insert" ON public.chat_message_reactions;
CREATE POLICY "Chat Reactions Insert" ON public.chat_message_reactions
FOR INSERT WITH CHECK (
    user_id = auth.uid()::text AND
    EXISTS (
        SELECT 1 FROM public.chat_messages m
        JOIN public.chat_conversations c ON c.id = m.conversation_id
        WHERE m.id = message_id AND public.is_project_member(c.project_id, auth.uid()::text)
    )
);

DROP POLICY IF EXISTS "Chat Reactions Delete" ON public.chat_message_reactions;
CREATE POLICY "Chat Reactions Delete" ON public.chat_message_reactions
FOR DELETE USING (
    user_id = auth.uid()::text
);

-- RLS Policies on chat_message_mentions
DROP POLICY IF EXISTS "Chat Mentions Select" ON public.chat_message_mentions;
CREATE POLICY "Chat Mentions Select" ON public.chat_message_mentions
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.chat_messages m
        JOIN public.chat_conversations c ON c.id = m.conversation_id
        WHERE m.id = message_id AND public.is_project_member(c.project_id, auth.uid()::text)
    )
);

DROP POLICY IF EXISTS "Chat Mentions Insert" ON public.chat_message_mentions;
CREATE POLICY "Chat Mentions Insert" ON public.chat_message_mentions
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.chat_messages m
        JOIN public.chat_conversations c ON c.id = m.conversation_id
        WHERE m.id = message_id AND m.sender_id = auth.uid()::text
    )
);

-- RLS Policies on chat_message_attachments
DROP POLICY IF EXISTS "Chat Attachments Select" ON public.chat_message_attachments;
CREATE POLICY "Chat Attachments Select" ON public.chat_message_attachments
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.chat_messages m
        JOIN public.chat_conversations c ON c.id = m.conversation_id
        WHERE m.id = message_id AND public.is_project_member(c.project_id, auth.uid()::text)
    )
);

DROP POLICY IF EXISTS "Chat Attachments Insert" ON public.chat_message_attachments;
CREATE POLICY "Chat Attachments Insert" ON public.chat_message_attachments
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.chat_messages m
        JOIN public.chat_conversations c ON c.id = m.conversation_id
        WHERE m.id = message_id AND m.sender_id = auth.uid()::text
    )
);

-- RLS Policies on chat_message_links
DROP POLICY IF EXISTS "Chat Links Select" ON public.chat_message_links;
CREATE POLICY "Chat Links Select" ON public.chat_message_links
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.chat_messages m
        JOIN public.chat_conversations c ON c.id = m.conversation_id
        WHERE m.id = message_id AND public.is_project_member(c.project_id, auth.uid()::text)
    )
);

DROP POLICY IF EXISTS "Chat Links Insert" ON public.chat_message_links;
CREATE POLICY "Chat Links Insert" ON public.chat_message_links
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.chat_messages m
        JOIN public.chat_conversations c ON c.id = m.conversation_id
        WHERE m.id = message_id AND m.sender_id = auth.uid()::text
    )
);

-- =========================================================================
-- PULSEWAVE — INTELLIGENT RELEASE RISK ENGINE & QUALITY GATE SCHEMA
-- =========================================================================

-- 1. Releases Table
CREATE TABLE IF NOT EXISTS public.releases (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    project_id TEXT NOT NULL,
    workspace_id TEXT NOT NULL,
    name TEXT NOT NULL,
    version TEXT,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'PLANNED', -- PLANNED, IN_PROGRESS, READY_FOR_REVIEW, RELEASED, CANCELLED
    release_date TIMESTAMPTZ,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Release Issue Links Table
CREATE TABLE IF NOT EXISTS public.release_issue_links (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    release_id TEXT NOT NULL REFERENCES public.releases(id) ON DELETE CASCADE,
    project_id TEXT NOT NULL,
    issue_id TEXT NOT NULL,
    issue_key TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Project Quality Settings Table
CREATE TABLE IF NOT EXISTS public.project_quality_settings (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    project_id TEXT UNIQUE NOT NULL,
    critical_bug_blocks_release BOOLEAN DEFAULT true,
    high_bug_threshold INTEGER DEFAULT 0,
    minimum_test_pass_rate NUMERIC DEFAULT 95.0,
    minimum_regression_pass_rate NUMERIC DEFAULT 90.0,
    minimum_coverage NUMERIC DEFAULT 80.0,
    maximum_blocked_tests INTEGER DEFAULT 0,
    maximum_open_critical_bugs INTEGER DEFAULT 0,
    allow_release_override BOOLEAN DEFAULT true,
    updated_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Release Quality Assessments Table (Immutable History Snapshots)
CREATE TABLE IF NOT EXISTS public.release_quality_assessments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    release_id TEXT NOT NULL REFERENCES public.releases(id) ON DELETE CASCADE,
    project_id TEXT NOT NULL,
    score NUMERIC, -- 0..100 or NULL if NO_DATA
    status TEXT NOT NULL DEFAULT 'NO_DATA', -- READY, AT_RISK, NOT_READY, NO_DATA
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    calculation_version TEXT DEFAULT 'v1.0',
    blocking_risk_count INTEGER DEFAULT 0,
    critical_risk_count INTEGER DEFAULT 0,
    high_risk_count INTEGER DEFAULT 0,
    medium_risk_count INTEGER DEFAULT 0,
    low_risk_count INTEGER DEFAULT 0,
    data_completeness NUMERIC DEFAULT 0, -- 0..100%
    summary_metrics JSONB DEFAULT '{}'::jsonb,
    recommendation TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Release Risk Factors Table
CREATE TABLE IF NOT EXISTS public.release_risk_factors (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    assessment_id TEXT NOT NULL REFERENCES public.release_quality_assessments(id) ON DELETE CASCADE,
    release_id TEXT NOT NULL REFERENCES public.releases(id) ON DELETE CASCADE,
    project_id TEXT NOT NULL,
    category TEXT NOT NULL, -- OPEN_DEFECTS, CRITICAL_DEFECTS, FAILED_TESTS, BLOCKED_TESTS, TEST_COVERAGE, REGRESSION_COVERAGE, UNVERIFIED_CHANGES, REOPENED_DEFECTS, OVERDUE_ISSUES, RELEASE_SCOPE, QUALITY_HISTORY, QA_VERIFICATION
    severity TEXT NOT NULL, -- BLOCKING, CRITICAL, HIGH, MEDIUM, LOW, INFO, PASSED
    title TEXT NOT NULL,
    description TEXT,
    evidence JSONB DEFAULT '{}'::jsonb,
    score_impact NUMERIC DEFAULT 0,
    is_blocking BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Release Decisions Table (Auditable Decisions & Overrides)
CREATE TABLE IF NOT EXISTS public.release_decisions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    release_id TEXT NOT NULL REFERENCES public.releases(id) ON DELETE CASCADE,
    project_id TEXT NOT NULL,
    decision TEXT NOT NULL, -- READY, AT_RISK, NOT_READY, OVERRIDDEN, RELEASED, CANCELLED
    reason TEXT,
    override_reason TEXT,
    previous_gate_status TEXT,
    decided_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_releases_project ON public.releases(project_id);
CREATE INDEX IF NOT EXISTS idx_releases_workspace ON public.releases(workspace_id);
CREATE INDEX IF NOT EXISTS idx_release_issue_links_rel ON public.release_issue_links(release_id);
CREATE INDEX IF NOT EXISTS idx_release_assessments_rel ON public.release_quality_assessments(release_id);
CREATE INDEX IF NOT EXISTS idx_release_assessments_calc ON public.release_quality_assessments(calculated_at);
CREATE INDEX IF NOT EXISTS idx_release_risk_factors_ass ON public.release_risk_factors(assessment_id);
CREATE INDEX IF NOT EXISTS idx_release_risk_factors_rel ON public.release_risk_factors(release_id);
CREATE INDEX IF NOT EXISTS idx_release_decisions_rel ON public.release_decisions(release_id);
CREATE INDEX IF NOT EXISTS idx_project_quality_settings_prj ON public.project_quality_settings(project_id);

-- Enable RLS
ALTER TABLE public.releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.release_issue_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_quality_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.release_quality_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.release_risk_factors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.release_decisions ENABLE ROW LEVEL SECURITY;

-- RLS Policies on releases
DROP POLICY IF EXISTS "Releases Select" ON public.releases;
CREATE POLICY "Releases Select" ON public.releases
FOR SELECT USING (
    public.is_project_member(project_id, auth.uid()::text)
);

DROP POLICY IF EXISTS "Releases Insert" ON public.releases;
CREATE POLICY "Releases Insert" ON public.releases
FOR INSERT WITH CHECK (
    public.is_project_member(project_id, auth.uid()::text)
);

DROP POLICY IF EXISTS "Releases Update" ON public.releases;
CREATE POLICY "Releases Update" ON public.releases
FOR UPDATE USING (
    public.is_project_member(project_id, auth.uid()::text)
);

DROP POLICY IF EXISTS "Releases Delete" ON public.releases;
CREATE POLICY "Releases Delete" ON public.releases
FOR DELETE USING (
    public.is_project_member(project_id, auth.uid()::text)
);

-- RLS Policies on release_issue_links
DROP POLICY IF EXISTS "Release Issue Links Select" ON public.release_issue_links;
CREATE POLICY "Release Issue Links Select" ON public.release_issue_links
FOR SELECT USING (
    public.is_project_member(project_id, auth.uid()::text)
);

DROP POLICY IF EXISTS "Release Issue Links Insert" ON public.release_issue_links;
CREATE POLICY "Release Issue Links Insert" ON public.release_issue_links
FOR INSERT WITH CHECK (
    public.is_project_member(project_id, auth.uid()::text)
);

DROP POLICY IF EXISTS "Release Issue Links Delete" ON public.release_issue_links;
CREATE POLICY "Release Issue Links Delete" ON public.release_issue_links
FOR DELETE USING (
    public.is_project_member(project_id, auth.uid()::text)
);

-- RLS Policies on project_quality_settings
DROP POLICY IF EXISTS "Quality Settings Select" ON public.project_quality_settings;
CREATE POLICY "Quality Settings Select" ON public.project_quality_settings
FOR SELECT USING (
    public.is_project_member(project_id, auth.uid()::text)
);

DROP POLICY IF EXISTS "Quality Settings Upsert" ON public.project_quality_settings;
CREATE POLICY "Quality Settings Upsert" ON public.project_quality_settings
FOR ALL USING (
    public.is_project_member(project_id, auth.uid()::text)
);

-- RLS Policies on release_quality_assessments
DROP POLICY IF EXISTS "Release Assessments Select" ON public.release_quality_assessments;
CREATE POLICY "Release Assessments Select" ON public.release_quality_assessments
FOR SELECT USING (
    public.is_project_member(project_id, auth.uid()::text)
);

DROP POLICY IF EXISTS "Release Assessments Insert" ON public.release_quality_assessments;
CREATE POLICY "Release Assessments Insert" ON public.release_quality_assessments
FOR INSERT WITH CHECK (
    public.is_project_member(project_id, auth.uid()::text)
);

-- RLS Policies on release_risk_factors
DROP POLICY IF EXISTS "Release Risk Factors Select" ON public.release_risk_factors;
CREATE POLICY "Release Risk Factors Select" ON public.release_risk_factors
FOR SELECT USING (
    public.is_project_member(project_id, auth.uid()::text)
);

DROP POLICY IF EXISTS "Release Risk Factors Insert" ON public.release_risk_factors;
CREATE POLICY "Release Risk Factors Insert" ON public.release_risk_factors
FOR INSERT WITH CHECK (
    public.is_project_member(project_id, auth.uid()::text)
);

-- RLS Policies on release_decisions
DROP POLICY IF EXISTS "Release Decisions Select" ON public.release_decisions;
CREATE POLICY "Release Decisions Select" ON public.release_decisions
FOR SELECT USING (
    public.is_project_member(project_id, auth.uid()::text)
);

DROP POLICY IF EXISTS "Release Decisions Insert" ON public.release_decisions;
CREATE POLICY "Release Decisions Insert" ON public.release_decisions
FOR INSERT WITH CHECK (
    public.is_project_member(project_id, auth.uid()::text)
);

-- ==============================================================================
-- 15. PULSEWAVE — AI QA ASSISTANT & EMAIL LOGS
-- ==============================================================================

-- 15a. AI QA Generations Table
CREATE TABLE IF NOT EXISTS public.ai_qa_generations (
    id TEXT PRIMARY KEY,
    workspace_id TEXT REFERENCES public.spaces(id) ON DELETE CASCADE,
    project_id TEXT REFERENCES public.projects(id) ON DELETE CASCADE,
    created_by TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    generation_type TEXT NOT NULL CHECK (generation_type IN ('qa_summary', 'developer_email', 'client_email', 'qa_document')),
    selected_issue_ids JSONB DEFAULT '[]'::jsonb,
    generated_content JSONB NOT NULL,
    pdf_storage_path TEXT,
    pdf_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 15b. AI QA Email Dispatch Logs
CREATE TABLE IF NOT EXISTS public.ai_qa_email_logs (
    id TEXT PRIMARY KEY,
    workspace_id TEXT REFERENCES public.spaces(id) ON DELETE CASCADE,
    project_id TEXT REFERENCES public.projects(id) ON DELETE CASCADE,
    generation_id TEXT REFERENCES public.ai_qa_generations(id) ON DELETE SET NULL,
    sent_by TEXT,
    recipient TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    attachment_path TEXT,
    status TEXT NOT NULL CHECK (status IN ('sent', 'failed')),
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for AI QA Assistant
CREATE INDEX IF NOT EXISTS idx_ai_qa_generations_project ON public.ai_qa_generations(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_qa_generations_workspace ON public.ai_qa_generations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ai_qa_generations_type ON public.ai_qa_generations(generation_type);
CREATE INDEX IF NOT EXISTS idx_ai_qa_generations_dates ON public.ai_qa_generations(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_ai_qa_email_logs_project ON public.ai_qa_email_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_qa_email_logs_workspace ON public.ai_qa_email_logs(workspace_id);

-- Enable RLS
ALTER TABLE public.ai_qa_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_qa_email_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies on ai_qa_generations
DROP POLICY IF EXISTS "AI QA Generations Select" ON public.ai_qa_generations;
CREATE POLICY "AI QA Generations Select" ON public.ai_qa_generations
FOR SELECT USING (
    public.is_project_member(project_id, auth.uid()::text)
);

DROP POLICY IF EXISTS "AI QA Generations Insert" ON public.ai_qa_generations;
CREATE POLICY "AI QA Generations Insert" ON public.ai_qa_generations
FOR INSERT WITH CHECK (
    public.is_project_member(project_id, auth.uid()::text)
);

DROP POLICY IF EXISTS "AI QA Generations Update" ON public.ai_qa_generations;
CREATE POLICY "AI QA Generations Update" ON public.ai_qa_generations
FOR UPDATE USING (
    public.is_project_member(project_id, auth.uid()::text)
);

DROP POLICY IF EXISTS "AI QA Generations Delete" ON public.ai_qa_generations;
CREATE POLICY "AI QA Generations Delete" ON public.ai_qa_generations
FOR DELETE USING (
    public.is_project_member(project_id, auth.uid()::text)
);

-- RLS Policies on ai_qa_email_logs
DROP POLICY IF EXISTS "AI QA Email Logs Select" ON public.ai_qa_email_logs;
CREATE POLICY "AI QA Email Logs Select" ON public.ai_qa_email_logs
FOR SELECT USING (
    public.is_project_member(project_id, auth.uid()::text)
);

DROP POLICY IF EXISTS "AI QA Email Logs Insert" ON public.ai_qa_email_logs;
CREATE POLICY "AI QA Email Logs Insert" ON public.ai_qa_email_logs
FOR INSERT WITH CHECK (
    public.is_project_member(project_id, auth.uid()::text)
);

-- ==============================================================================
-- 16. PULSEWAVE — COMPLETE ISSUE DETAIL, WORKFLOW, COMMENTS & QA EVIDENCE
-- ==============================================================================

-- 16a. Issue Comments (Threaded Discussions)
CREATE TABLE IF NOT EXISTS public.issue_comments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    issue_id TEXT NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    author_id TEXT NOT NULL,
    parent_comment_id TEXT REFERENCES public.issue_comments(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    edited_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 16b. Issue Comment Reactions
CREATE TABLE IF NOT EXISTS public.issue_comment_reactions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    comment_id TEXT NOT NULL REFERENCES public.issue_comments(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    reaction TEXT NOT NULL, -- 👍, ✅, 👀, 🚀, ⚠️, ❗
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(comment_id, user_id, reaction)
);

-- 16c. Issue Comment Mentions
CREATE TABLE IF NOT EXISTS public.issue_comment_mentions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    comment_id TEXT NOT NULL REFERENCES public.issue_comments(id) ON DELETE CASCADE,
    mentioned_user_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(comment_id, mentioned_user_id)
);

-- 16d. Issue Attachments (Images, Videos, PDFs, Logs, JSON, Docs)
CREATE TABLE IF NOT EXISTS public.issue_attachments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    issue_id TEXT NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    uploaded_by TEXT NOT NULL,
    file_name TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    mime_type TEXT,
    file_size BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 16e. QA Verifications (Immutable Historical Test Attempts)
CREATE TABLE IF NOT EXISTS public.qa_verifications (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    issue_id TEXT NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    qa_user_id TEXT NOT NULL,
    environment TEXT DEFAULT 'Staging',
    build_version TEXT DEFAULT 'v2.4.1',
    result TEXT NOT NULL, -- PASS, FAIL, BLOCKED, RETEST
    failure_reason TEXT,
    expected_result TEXT,
    actual_result TEXT,
    notes TEXT,
    attempt_number INTEGER DEFAULT 1,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 16f. QA Evidence (Linked to Verifications & Quality Gate)
CREATE TABLE IF NOT EXISTS public.qa_evidence (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    issue_id TEXT NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    verification_id TEXT REFERENCES public.qa_verifications(id) ON DELETE SET NULL,
    project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    uploaded_by TEXT NOT NULL,
    attachment_id TEXT NOT NULL REFERENCES public.issue_attachments(id) ON DELETE CASCADE,
    environment TEXT,
    build_version TEXT,
    evidence_type TEXT, -- Screenshot, Video, Log, Document
    result TEXT, -- PASS, FAIL, BLOCKED, RETEST
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 16g. Issue Checklists & Items
CREATE TABLE IF NOT EXISTS public.issue_checklists (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    issue_id TEXT NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    created_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.issue_checklist_items (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    checklist_id TEXT NOT NULL REFERENCES public.issue_checklists(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    completed_by TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 16h. Issue Relationships & Dependencies
CREATE TABLE IF NOT EXISTS public.issue_relationships (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    source_issue_id TEXT NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    target_issue_id TEXT NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    relationship_type TEXT NOT NULL,
    created_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT chk_not_self_referential CHECK (source_issue_id <> target_issue_id)
);

-- 16i. Issue Watchers
CREATE TABLE IF NOT EXISTS public.issue_watchers (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    issue_id TEXT NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(issue_id, user_id)
);

-- 16j. Issue Activity / Audit Log
CREATE TABLE IF NOT EXISTS public.issue_activity (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    issue_id TEXT NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    actor_id TEXT,
    activity_type TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for Section 16
CREATE INDEX IF NOT EXISTS idx_issue_comments_issue ON public.issue_comments(issue_id);
CREATE INDEX IF NOT EXISTS idx_issue_comments_project ON public.issue_comments(project_id);
CREATE INDEX IF NOT EXISTS idx_issue_comments_parent ON public.issue_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_issue_comments_created ON public.issue_comments(created_at);

CREATE INDEX IF NOT EXISTS idx_issue_reactions_comment ON public.issue_comment_reactions(comment_id);
CREATE INDEX IF NOT EXISTS idx_issue_mentions_comment ON public.issue_comment_mentions(comment_id);
CREATE INDEX IF NOT EXISTS idx_issue_mentions_user ON public.issue_comment_mentions(mentioned_user_id);

CREATE INDEX IF NOT EXISTS idx_issue_attachments_issue ON public.issue_attachments(issue_id);
CREATE INDEX IF NOT EXISTS idx_issue_attachments_project ON public.issue_attachments(project_id);

CREATE INDEX IF NOT EXISTS idx_qa_verifications_issue ON public.qa_verifications(issue_id);
CREATE INDEX IF NOT EXISTS idx_qa_verifications_project ON public.qa_verifications(project_id);
CREATE INDEX IF NOT EXISTS idx_qa_verifications_created ON public.qa_verifications(created_at);

CREATE INDEX IF NOT EXISTS idx_qa_evidence_issue ON public.qa_evidence(issue_id);
CREATE INDEX IF NOT EXISTS idx_qa_evidence_verification ON public.qa_evidence(verification_id);
CREATE INDEX IF NOT EXISTS idx_qa_evidence_attachment ON public.qa_evidence(attachment_id);

CREATE INDEX IF NOT EXISTS idx_issue_checklists_issue ON public.issue_checklists(issue_id);
CREATE INDEX IF NOT EXISTS idx_issue_checklist_items_list ON public.issue_checklist_items(checklist_id);

CREATE INDEX IF NOT EXISTS idx_issue_relationships_source ON public.issue_relationships(source_issue_id);
CREATE INDEX IF NOT EXISTS idx_issue_relationships_target ON public.issue_relationships(target_issue_id);
CREATE INDEX IF NOT EXISTS idx_issue_relationships_project ON public.issue_relationships(project_id);

CREATE INDEX IF NOT EXISTS idx_issue_watchers_issue ON public.issue_watchers(issue_id);
CREATE INDEX IF NOT EXISTS idx_issue_watchers_user ON public.issue_watchers(user_id);

CREATE INDEX IF NOT EXISTS idx_issue_activity_issue ON public.issue_activity(issue_id);
CREATE INDEX IF NOT EXISTS idx_issue_activity_project ON public.issue_activity(project_id);
CREATE INDEX IF NOT EXISTS idx_issue_activity_created ON public.issue_activity(created_at);

-- Storage Bucket for Project Attachments & QA Evidence
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-attachments', 'project-attachments', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- RLS Enablement on Section 16
ALTER TABLE public.issue_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_comment_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_comment_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qa_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qa_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_watchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_activity ENABLE ROW LEVEL SECURITY;

-- RLS Policies on Section 16
DROP POLICY IF EXISTS "Issue Comments Select" ON public.issue_comments;
CREATE POLICY "Issue Comments Select" ON public.issue_comments FOR SELECT USING (public.is_project_member(project_id, auth.uid()::text));

DROP POLICY IF EXISTS "Issue Comments Insert" ON public.issue_comments;
CREATE POLICY "Issue Comments Insert" ON public.issue_comments FOR INSERT WITH CHECK (public.is_project_member(project_id, auth.uid()::text) AND author_id = auth.uid()::text);

DROP POLICY IF EXISTS "Issue Comments Update" ON public.issue_comments;
CREATE POLICY "Issue Comments Update" ON public.issue_comments FOR UPDATE USING (author_id = auth.uid()::text OR EXISTS (SELECT 1 FROM public.projects p JOIN public.workspace_members wm ON wm.workspace_id = p.workspace_id WHERE p.id = project_id AND wm.user_id = auth.uid()::text AND wm.role IN ('OWNER', 'PROJECT_MANAGER', 'PM')));

DROP POLICY IF EXISTS "Issue Comments Delete" ON public.issue_comments;
CREATE POLICY "Issue Comments Delete" ON public.issue_comments FOR DELETE USING (author_id = auth.uid()::text OR EXISTS (SELECT 1 FROM public.projects p JOIN public.workspace_members wm ON wm.workspace_id = p.workspace_id WHERE p.id = project_id AND wm.user_id = auth.uid()::text AND wm.role IN ('OWNER', 'PROJECT_MANAGER', 'PM')));

DROP POLICY IF EXISTS "Issue Comment Reactions Select" ON public.issue_comment_reactions;
CREATE POLICY "Issue Comment Reactions Select" ON public.issue_comment_reactions FOR SELECT USING (EXISTS (SELECT 1 FROM public.issue_comments c WHERE c.id = comment_id AND public.is_project_member(c.project_id, auth.uid()::text)));

DROP POLICY IF EXISTS "Issue Comment Reactions Insert" ON public.issue_comment_reactions;
CREATE POLICY "Issue Comment Reactions Insert" ON public.issue_comment_reactions FOR INSERT WITH CHECK (user_id = auth.uid()::text AND EXISTS (SELECT 1 FROM public.issue_comments c WHERE c.id = comment_id AND public.is_project_member(c.project_id, auth.uid()::text)));

DROP POLICY IF EXISTS "Issue Comment Reactions Delete" ON public.issue_comment_reactions;
CREATE POLICY "Issue Comment Reactions Delete" ON public.issue_comment_reactions FOR DELETE USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Issue Comment Mentions Select" ON public.issue_comment_mentions;
CREATE POLICY "Issue Comment Mentions Select" ON public.issue_comment_mentions FOR SELECT USING (EXISTS (SELECT 1 FROM public.issue_comments c WHERE c.id = comment_id AND public.is_project_member(c.project_id, auth.uid()::text)));

DROP POLICY IF EXISTS "Issue Comment Mentions Insert" ON public.issue_comment_mentions;
CREATE POLICY "Issue Comment Mentions Insert" ON public.issue_comment_mentions FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.issue_comments c WHERE c.id = comment_id AND c.author_id = auth.uid()::text));

DROP POLICY IF EXISTS "Issue Attachments Select" ON public.issue_attachments;
CREATE POLICY "Issue Attachments Select" ON public.issue_attachments FOR SELECT USING (public.is_project_member(project_id, auth.uid()::text));

DROP POLICY IF EXISTS "Issue Attachments Insert" ON public.issue_attachments;
CREATE POLICY "Issue Attachments Insert" ON public.issue_attachments FOR INSERT WITH CHECK (public.is_project_member(project_id, auth.uid()::text) AND uploaded_by = auth.uid()::text);

DROP POLICY IF EXISTS "Issue Attachments Delete" ON public.issue_attachments;
CREATE POLICY "Issue Attachments Delete" ON public.issue_attachments FOR DELETE USING (uploaded_by = auth.uid()::text OR EXISTS (SELECT 1 FROM public.projects p JOIN public.workspace_members wm ON wm.workspace_id = p.workspace_id WHERE p.id = project_id AND wm.user_id = auth.uid()::text AND wm.role IN ('OWNER', 'PROJECT_MANAGER', 'PM')));

DROP POLICY IF EXISTS "QA Verifications Select" ON public.qa_verifications;
CREATE POLICY "QA Verifications Select" ON public.qa_verifications FOR SELECT USING (public.is_project_member(project_id, auth.uid()::text));

DROP POLICY IF EXISTS "QA Verifications Insert" ON public.qa_verifications;
CREATE POLICY "QA Verifications Insert" ON public.qa_verifications FOR INSERT WITH CHECK (public.is_project_member(project_id, auth.uid()::text));

DROP POLICY IF EXISTS "QA Evidence Select" ON public.qa_evidence;
CREATE POLICY "QA Evidence Select" ON public.qa_evidence FOR SELECT USING (public.is_project_member(project_id, auth.uid()::text));

DROP POLICY IF EXISTS "QA Evidence Insert" ON public.qa_evidence;
CREATE POLICY "QA Evidence Insert" ON public.qa_evidence FOR INSERT WITH CHECK (public.is_project_member(project_id, auth.uid()::text) AND uploaded_by = auth.uid()::text);

DROP POLICY IF EXISTS "QA Evidence Delete" ON public.qa_evidence;
CREATE POLICY "QA Evidence Delete" ON public.qa_evidence FOR DELETE USING (uploaded_by = auth.uid()::text OR EXISTS (SELECT 1 FROM public.projects p JOIN public.workspace_members wm ON wm.workspace_id = p.workspace_id WHERE p.id = project_id AND wm.user_id = auth.uid()::text AND wm.role IN ('OWNER', 'PROJECT_MANAGER', 'PM')));

DROP POLICY IF EXISTS "Issue Checklists Select" ON public.issue_checklists;
CREATE POLICY "Issue Checklists Select" ON public.issue_checklists FOR SELECT USING (public.is_project_member(project_id, auth.uid()::text));

DROP POLICY IF EXISTS "Issue Checklists Upsert" ON public.issue_checklists;
CREATE POLICY "Issue Checklists Upsert" ON public.issue_checklists FOR ALL USING (public.is_project_member(project_id, auth.uid()::text));

DROP POLICY IF EXISTS "Issue Checklist Items Select" ON public.issue_checklist_items;
CREATE POLICY "Issue Checklist Items Select" ON public.issue_checklist_items FOR SELECT USING (EXISTS (SELECT 1 FROM public.issue_checklists cl WHERE cl.id = checklist_id AND public.is_project_member(cl.project_id, auth.uid()::text)));

DROP POLICY IF EXISTS "Issue Checklist Items Upsert" ON public.issue_checklist_items;
CREATE POLICY "Issue Checklist Items Upsert" ON public.issue_checklist_items FOR ALL USING (EXISTS (SELECT 1 FROM public.issue_checklists cl WHERE cl.id = checklist_id AND public.is_project_member(cl.project_id, auth.uid()::text)));

DROP POLICY IF EXISTS "Issue Relationships Select" ON public.issue_relationships;
CREATE POLICY "Issue Relationships Select" ON public.issue_relationships FOR SELECT USING (public.is_project_member(project_id, auth.uid()::text));

DROP POLICY IF EXISTS "Issue Relationships Upsert" ON public.issue_relationships;
CREATE POLICY "Issue Relationships Upsert" ON public.issue_relationships FOR ALL USING (public.is_project_member(project_id, auth.uid()::text));

DROP POLICY IF EXISTS "Issue Watchers Select" ON public.issue_watchers;
CREATE POLICY "Issue Watchers Select" ON public.issue_watchers FOR SELECT USING (public.is_project_member(project_id, auth.uid()::text));

DROP POLICY IF EXISTS "Issue Watchers Upsert" ON public.issue_watchers;
CREATE POLICY "Issue Watchers Upsert" ON public.issue_watchers FOR ALL USING (public.is_project_member(project_id, auth.uid()::text));

DROP POLICY IF EXISTS "Issue Activity Select" ON public.issue_activity;
CREATE POLICY "Issue Activity Select" ON public.issue_activity FOR SELECT USING (public.is_project_member(project_id, auth.uid()::text));

DROP POLICY IF EXISTS "Issue Activity Insert" ON public.issue_activity;
CREATE POLICY "Issue Activity Insert" ON public.issue_activity FOR INSERT WITH CHECK (public.is_project_member(project_id, auth.uid()::text));





