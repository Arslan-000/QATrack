-- ==============================================================================
-- PulseWave QA Platform — Issue Detail, Workflow, Comments & QA Evidence Upgrade
-- Additive Migration Script with Row Level Security (RLS) and Storage
-- ==============================================================================

-- 1. ISSUE COMMENTS (Threaded Discussions)
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

-- 2. ISSUE COMMENT REACTIONS
CREATE TABLE IF NOT EXISTS public.issue_comment_reactions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    comment_id TEXT NOT NULL REFERENCES public.issue_comments(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    reaction TEXT NOT NULL, -- 👍, ✅, 👀, 🚀, ⚠️, ❗
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(comment_id, user_id, reaction)
);

-- 3. ISSUE COMMENT MENTIONS
CREATE TABLE IF NOT EXISTS public.issue_comment_mentions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    comment_id TEXT NOT NULL REFERENCES public.issue_comments(id) ON DELETE CASCADE,
    mentioned_user_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(comment_id, mentioned_user_id)
);

-- 4. ISSUE ATTACHMENTS (Images, Videos, PDFs, Logs, JSON, Docs)
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

-- 5. QA VERIFICATIONS (Immutable Historical Test Attempts)
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

-- 6. QA EVIDENCE (Linked to Verifications & Quality Gate)
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

-- 7. ISSUE CHECKLISTS & ITEMS
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

-- 8. ISSUE RELATIONSHIPS & DEPENDENCIES
CREATE TABLE IF NOT EXISTS public.issue_relationships (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    source_issue_id TEXT NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    target_issue_id TEXT NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    relationship_type TEXT NOT NULL, -- Parent, Child, Blocks, Blocked By, Relates To, Duplicate, Duplicated By, Tests, Tested By, Implements, Fixed By
    created_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT chk_not_self_referential CHECK (source_issue_id <> target_issue_id)
);

-- 9. ISSUE WATCHERS
CREATE TABLE IF NOT EXISTS public.issue_watchers (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    issue_id TEXT NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(issue_id, user_id)
);

-- 10. ISSUE ACTIVITY / AUDIT LOG
CREATE TABLE IF NOT EXISTS public.issue_activity (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    issue_id TEXT NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    actor_id TEXT,
    activity_type TEXT NOT NULL, -- status_change, priority_change, qa_verdict, comment_added, evidence_uploaded, checklist_updated, relationship_added, etc.
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
-- ==============================================================================
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

-- ==============================================================================
-- STORAGE BUCKET: project-attachments
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-attachments', 'project-attachments', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
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

-- 1. RLS on issue_comments
DROP POLICY IF EXISTS "Issue Comments Select" ON public.issue_comments;
CREATE POLICY "Issue Comments Select" ON public.issue_comments
FOR SELECT USING (
    public.is_project_member(project_id, auth.uid()::text)
);

DROP POLICY IF EXISTS "Issue Comments Insert" ON public.issue_comments;
CREATE POLICY "Issue Comments Insert" ON public.issue_comments
FOR INSERT WITH CHECK (
    public.is_project_member(project_id, auth.uid()::text) AND author_id = auth.uid()::text
);

DROP POLICY IF EXISTS "Issue Comments Update" ON public.issue_comments;
CREATE POLICY "Issue Comments Update" ON public.issue_comments
FOR UPDATE USING (
    author_id = auth.uid()::text OR
    EXISTS (
        SELECT 1 FROM public.projects p
        JOIN public.workspace_members wm ON wm.workspace_id = p.workspace_id
        WHERE p.id = project_id AND wm.user_id = auth.uid()::text AND wm.role IN ('OWNER', 'PROJECT_MANAGER', 'PM')
    )
);

DROP POLICY IF EXISTS "Issue Comments Delete" ON public.issue_comments;
CREATE POLICY "Issue Comments Delete" ON public.issue_comments
FOR DELETE USING (
    author_id = auth.uid()::text OR
    EXISTS (
        SELECT 1 FROM public.projects p
        JOIN public.workspace_members wm ON wm.workspace_id = p.workspace_id
        WHERE p.id = project_id AND wm.user_id = auth.uid()::text AND wm.role IN ('OWNER', 'PROJECT_MANAGER', 'PM')
    )
);

-- 2. RLS on issue_comment_reactions
DROP POLICY IF EXISTS "Issue Comment Reactions Select" ON public.issue_comment_reactions;
CREATE POLICY "Issue Comment Reactions Select" ON public.issue_comment_reactions
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.issue_comments c
        WHERE c.id = comment_id AND public.is_project_member(c.project_id, auth.uid()::text)
    )
);

DROP POLICY IF EXISTS "Issue Comment Reactions Insert" ON public.issue_comment_reactions;
CREATE POLICY "Issue Comment Reactions Insert" ON public.issue_comment_reactions
FOR INSERT WITH CHECK (
    user_id = auth.uid()::text AND
    EXISTS (
        SELECT 1 FROM public.issue_comments c
        WHERE c.id = comment_id AND public.is_project_member(c.project_id, auth.uid()::text)
    )
);

DROP POLICY IF EXISTS "Issue Comment Reactions Delete" ON public.issue_comment_reactions;
CREATE POLICY "Issue Comment Reactions Delete" ON public.issue_comment_reactions
FOR DELETE USING (
    user_id = auth.uid()::text
);

-- 3. RLS on issue_comment_mentions
DROP POLICY IF EXISTS "Issue Comment Mentions Select" ON public.issue_comment_mentions;
CREATE POLICY "Issue Comment Mentions Select" ON public.issue_comment_mentions
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.issue_comments c
        WHERE c.id = comment_id AND public.is_project_member(c.project_id, auth.uid()::text)
    )
);

DROP POLICY IF EXISTS "Issue Comment Mentions Insert" ON public.issue_comment_mentions;
CREATE POLICY "Issue Comment Mentions Insert" ON public.issue_comment_mentions
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.issue_comments c
        WHERE c.id = comment_id AND c.author_id = auth.uid()::text
    )
);

-- 4. RLS on issue_attachments
DROP POLICY IF EXISTS "Issue Attachments Select" ON public.issue_attachments;
CREATE POLICY "Issue Attachments Select" ON public.issue_attachments
FOR SELECT USING (
    public.is_project_member(project_id, auth.uid()::text)
);

DROP POLICY IF EXISTS "Issue Attachments Insert" ON public.issue_attachments;
CREATE POLICY "Issue Attachments Insert" ON public.issue_attachments
FOR INSERT WITH CHECK (
    public.is_project_member(project_id, auth.uid()::text) AND uploaded_by = auth.uid()::text
);

DROP POLICY IF EXISTS "Issue Attachments Delete" ON public.issue_attachments;
CREATE POLICY "Issue Attachments Delete" ON public.issue_attachments
FOR DELETE USING (
    uploaded_by = auth.uid()::text OR
    EXISTS (
        SELECT 1 FROM public.projects p
        JOIN public.workspace_members wm ON wm.workspace_id = p.workspace_id
        WHERE p.id = project_id AND wm.user_id = auth.uid()::text AND wm.role IN ('OWNER', 'PROJECT_MANAGER', 'PM')
    )
);

-- 5. RLS on qa_verifications
DROP POLICY IF EXISTS "QA Verifications Select" ON public.qa_verifications;
CREATE POLICY "QA Verifications Select" ON public.qa_verifications
FOR SELECT USING (
    public.is_project_member(project_id, auth.uid()::text)
);

DROP POLICY IF EXISTS "QA Verifications Insert" ON public.qa_verifications;
CREATE POLICY "QA Verifications Insert" ON public.qa_verifications
FOR INSERT WITH CHECK (
    public.is_project_member(project_id, auth.uid()::text)
);

-- 6. RLS on qa_evidence
DROP POLICY IF EXISTS "QA Evidence Select" ON public.qa_evidence;
CREATE POLICY "QA Evidence Select" ON public.qa_evidence
FOR SELECT USING (
    public.is_project_member(project_id, auth.uid()::text)
);

DROP POLICY IF EXISTS "QA Evidence Insert" ON public.qa_evidence;
CREATE POLICY "QA Evidence Insert" ON public.qa_evidence
FOR INSERT WITH CHECK (
    public.is_project_member(project_id, auth.uid()::text) AND uploaded_by = auth.uid()::text
);

DROP POLICY IF EXISTS "QA Evidence Delete" ON public.qa_evidence;
CREATE POLICY "QA Evidence Delete" ON public.qa_evidence
FOR DELETE USING (
    uploaded_by = auth.uid()::text OR
    EXISTS (
        SELECT 1 FROM public.projects p
        JOIN public.workspace_members wm ON wm.workspace_id = p.workspace_id
        WHERE p.id = project_id AND wm.user_id = auth.uid()::text AND wm.role IN ('OWNER', 'PROJECT_MANAGER', 'PM')
    )
);

-- 7. RLS on issue_checklists & items
DROP POLICY IF EXISTS "Issue Checklists Select" ON public.issue_checklists;
CREATE POLICY "Issue Checklists Select" ON public.issue_checklists
FOR SELECT USING (
    public.is_project_member(project_id, auth.uid()::text)
);

DROP POLICY IF EXISTS "Issue Checklists Upsert" ON public.issue_checklists;
CREATE POLICY "Issue Checklists Upsert" ON public.issue_checklists
FOR ALL USING (
    public.is_project_member(project_id, auth.uid()::text)
);

DROP POLICY IF EXISTS "Issue Checklist Items Select" ON public.issue_checklist_items;
CREATE POLICY "Issue Checklist Items Select" ON public.issue_checklist_items
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.issue_checklists cl
        WHERE cl.id = checklist_id AND public.is_project_member(cl.project_id, auth.uid()::text)
    )
);

DROP POLICY IF EXISTS "Issue Checklist Items Upsert" ON public.issue_checklist_items;
CREATE POLICY "Issue Checklist Items Upsert" ON public.issue_checklist_items
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.issue_checklists cl
        WHERE cl.id = checklist_id AND public.is_project_member(cl.project_id, auth.uid()::text)
    )
);

-- 8. RLS on issue_relationships
DROP POLICY IF EXISTS "Issue Relationships Select" ON public.issue_relationships;
CREATE POLICY "Issue Relationships Select" ON public.issue_relationships
FOR SELECT USING (
    public.is_project_member(project_id, auth.uid()::text)
);

DROP POLICY IF EXISTS "Issue Relationships Upsert" ON public.issue_relationships;
CREATE POLICY "Issue Relationships Upsert" ON public.issue_relationships
FOR ALL USING (
    public.is_project_member(project_id, auth.uid()::text)
);

-- 9. RLS on issue_watchers
DROP POLICY IF EXISTS "Issue Watchers Select" ON public.issue_watchers;
CREATE POLICY "Issue Watchers Select" ON public.issue_watchers
FOR SELECT USING (
    public.is_project_member(project_id, auth.uid()::text)
);

DROP POLICY IF EXISTS "Issue Watchers Upsert" ON public.issue_watchers;
CREATE POLICY "Issue Watchers Upsert" ON public.issue_watchers
FOR ALL USING (
    public.is_project_member(project_id, auth.uid()::text)
);

-- 10. RLS on issue_activity
DROP POLICY IF EXISTS "Issue Activity Select" ON public.issue_activity;
CREATE POLICY "Issue Activity Select" ON public.issue_activity
FOR SELECT USING (
    public.is_project_member(project_id, auth.uid()::text)
);

DROP POLICY IF EXISTS "Issue Activity Insert" ON public.issue_activity;
CREATE POLICY "Issue Activity Insert" ON public.issue_activity
FOR INSERT WITH CHECK (
    public.is_project_member(project_id, auth.uid()::text)
);
