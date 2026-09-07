/**
 * All-in-One Software Project & QA Management Platform (V1)
 * Central Reactive State Store with LocalStorage Persistence
 * Enhanced with Sprints, QA Verification, Quality Gates & Release Management
 */

class AppStore {
  constructor() {
    this.storageKey = "pulsewave_qa_v2_store";
    this.subscribers = [];
    this.data = this.loadState();
  }

  loadState() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        
        // Purge dummy workspaces
        if (parsed.workspaces) {
          parsed.workspaces = parsed.workspaces.filter(w => w.id !== "ws_default" && !w.name.includes("Acme Tech"));
        } else {
          parsed.workspaces = [];
        }

        // Purge legacy test mock projects
        if (parsed.projects) {
          parsed.projects = parsed.projects.filter(p => 
            !["prj-ecom", "prj-health", "prj-omni", "prj_ecom"].includes(p.id)
          );
        } else {
          parsed.projects = [];
        }

        if (!parsed.workspaces || parsed.workspaces.length === 0) {
          parsed.activeWorkspaceId = null;
        }
        if (!parsed.projects || parsed.projects.length === 0) {
          parsed.activeProjectId = null;
        }

        // Ensure collections exist
        if (!parsed.issues) parsed.issues = [];
        if (!parsed.sprints) parsed.sprints = [];
        if (!parsed.testPlans) parsed.testPlans = [];
        if (!parsed.testSuites) parsed.testSuites = [];
        if (!parsed.testCases) parsed.testCases = [];
        if (!parsed.testExecutions) parsed.testExecutions = [];
        if (!parsed.testReports) parsed.testReports = [];
        if (!parsed.qaReports) parsed.qaReports = [];
        if (!parsed.qaTestCases) parsed.qaTestCases = [];
        if (!parsed.qaTestData) parsed.qaTestData = [];
        if (!parsed.notifications) parsed.notifications = [];
        if (!parsed.chatConversations) parsed.chatConversations = [];
        if (!parsed.chatConversationMembers) parsed.chatConversationMembers = [];
        if (!parsed.chatMessages) parsed.chatMessages = [];
        if (!parsed.chatMessageReactions) parsed.chatMessageReactions = [];
        if (!parsed.chatMessageMentions) parsed.chatMessageMentions = [];
        if (!parsed.chatMessageAttachments) parsed.chatMessageAttachments = [];
        if (!parsed.chatMessageLinks) parsed.chatMessageLinks = [];
        if (!parsed.releases) parsed.releases = [];
        if (!parsed.releaseQualityAssessments) parsed.releaseQualityAssessments = [];
        if (!parsed.releaseRiskFactors) parsed.releaseRiskFactors = [];
        if (!parsed.projectQualitySettings) parsed.projectQualitySettings = [];
        if (!parsed.releaseDecisions) parsed.releaseDecisions = [];
        if (!parsed.releaseIssueLinks) parsed.releaseIssueLinks = [];
        if (!parsed.aiGenerations) parsed.aiGenerations = [];
        if (!parsed.aiEmailLogs) parsed.aiEmailLogs = [];
        if (!parsed.aiChatHistories) parsed.aiChatHistories = {};
        if (!parsed.documentTemplates || parsed.documentTemplates.length === 0) {
          parsed.documentTemplates = JSON.parse(JSON.stringify(INITIAL_DATA.documentTemplates || []));
        }
        
        // Purge dummy/mock documents from old localStorage seeds
        const validProjectIds = (parsed.projects || []).map(p => p.id);
        if (parsed.documents && Array.isArray(parsed.documents)) {
          parsed.documents = parsed.documents.filter(d => {
            if (!d || !d.id) return false;
            // Purge mock authors
            const author = (d.authorName || d.ownerId || "").toLowerCase();
            if (author.includes("u-pm-1")) return false;
            // Purge mock titles
            const name = (d.name || "").toLowerCase();
            if (
              name.includes("ecom") ||
              name.includes("core infrastructure") ||
              name.includes("ms excel test case") ||
              name.includes("qa specification report") ||
              name.includes("qa test execution report") ||
              name.includes("test plan template") ||
              name.includes("(v2.4.1)") ||
              name.includes("doc-rpos")
            ) return false;
            // Exclude documents that do not belong to an active existing project
            if (d.projectId && !validProjectIds.includes(d.projectId)) return false;
            return true;
          });
        } else {
          parsed.documents = [];
        }
        if (!parsed.projectDocs) parsed.projectDocs = {};
        if (!parsed.users) parsed.users = [];

        return parsed;
      }
    } catch (e) {
      console.warn("Could not load from localStorage, initializing clean default state.", e);
    }
    return JSON.parse(JSON.stringify(INITIAL_DATA));
  }

  saveState() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    } catch (e) {
      console.error("Failed to save state to localStorage", e);
    }
    this.notify();
  }

  resetToDefault() {
    this.data = JSON.parse(JSON.stringify(INITIAL_DATA));
    this.saveState();
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  notify(eventData = {}) {
    this.subscribers.forEach(cb => {
      try {
        cb(this.data, eventData);
      } catch (err) {
        console.error("Error in store subscriber:", err);
      }
    });
  }

  // ==========================================
  // Supabase & Cloud State Synchronization
  // ==========================================
  async syncSupabaseCloudState() {
    if (typeof window !== 'undefined' && window.supabaseClient && window.supabaseClient.auth) {
      try {
        const { data } = await window.supabaseClient.auth.getUser();
        if (data && data.user) {
          await window.supabaseClient.auth.updateUser({
            data: {
              spaces: this.data.workspaces,
              projects: this.data.projects,
              active_space_id: this.data.activeWorkspaceId,
              active_project_id: this.data.activeProjectId,
              onboarding_completed: this.data.workspaces.length > 0
            }
          });
        }
      } catch (e) {
        console.warn("Supabase cloud sync notification:", e);
      }
    }
  }

  setSupabaseUser(supabaseUser) {
    if (!supabaseUser) return null;
    const email = (supabaseUser.email || "").toLowerCase().trim();
    const metadata = supabaseUser.user_metadata || {};
    const name = metadata.name || metadata.full_name || email.split("@")[0] || "User";
    const role = metadata.role || "Project Manager";
    const nameParts = name.split(/\s+/);
    const initials = nameParts.map(w => w[0]).join('').substring(0, 2).toUpperCase() || 'PW';
    const id = supabaseUser.id || `usr_${Date.now()}`;

    // Clean old mock users
    this.clearLegacyMockUsers();

    // Look for existing user by Supabase ID or email
    let user = this.data.users.find(u => u.supabase_id === id || u.id === id || (u.email && u.email.toLowerCase() === email));
    if (user) {
      user.id = id;
      user.supabase_id = id;
      user.email = email;
      user.name = name;
      user.role = role;
      user.initials = initials;
      if (metadata.avatar_url) user.avatar = metadata.avatar_url;
    } else {
      user = {
        id,
        supabase_id: id,
        name,
        email,
        role,
        avatar: metadata.avatar_url || null,
        initials,
        color: "bg-slate-900",
        onboarding_completed: metadata.onboarding_completed || false,
        onboarding_step: metadata.onboarding_step || "WELCOME"
      };
      this.data.users.unshift(user);
    }

    // Sync cloud spaces and projects from Supabase if available
    if (metadata.spaces && Array.isArray(metadata.spaces) && metadata.spaces.length > 0) {
      this.data.workspaces = metadata.spaces;
      this.data.activeWorkspaceId = metadata.active_space_id || metadata.spaces[0].id;
    }
    if (metadata.projects && Array.isArray(metadata.projects) && metadata.projects.length > 0) {
      this.data.projects = metadata.projects;
      this.data.activeProjectId = metadata.active_project_id || metadata.projects[0].id;
    }

    this.data.activeUserId = id;
    this.saveState();
    this.notify();
    return user;
  }

  clearSupabaseUser() {
    this.data.activeUserId = null;
    this.saveState();
    this.notify();
  }

  clearLegacyMockUsers() {
    if (this.data && this.data.users) {
      this.data.users = this.data.users.filter(u => u.supabase_id || u.isGuest);
    }
  }

  registerUser({ name, email, password, role, isGuest = false }) {
    const cleanEmail = (email || "").toLowerCase().trim();
    const cleanName = (name || "").trim();
    const existing = this.data.users.find(u => (u.email || "").toLowerCase() === cleanEmail);
    if (existing) {
      this.data.activeUserId = existing.id;
      this.saveState();
      return existing;
    }

    const nameParts = cleanName.split(/\s+/);
    const initials = nameParts.map(w => w[0]).join('').substring(0, 2).toUpperCase() || 'PW';
    const id = `usr_${Date.now()}`;
    const colors = ['bg-slate-900', 'bg-rose-600', 'bg-emerald-600', 'bg-purple-600', 'bg-indigo-600', 'bg-amber-600'];
    const color = colors[this.data.users.length % colors.length];

    const newUser = {
      id,
      name: cleanName || "Team Member",
      email: cleanEmail,
      role: role || "QA Engineer",
      avatar: null,
      initials,
      color,
      password,
      isGuest,
      onboarding_completed: true,
      onboarding_step: "COMPLETE"
    };

    this.data.users.unshift(newUser);
    this.data.activeUserId = id;
    this.saveState();
    this.notify();
    return newUser;
  }

  authenticateUser(email, password) {
    const cleanEmail = (email || "").toLowerCase().trim();
    if (!cleanEmail) return null;
    if (!this.data.users) this.data.users = [];

    // 1. Check existing users in store
    let user = this.data.users.find(u => (u.email || "").toLowerCase() === cleanEmail);

    // 2. Check pending project invitations if matching email
    if (!this.data.projectInvitations) this.data.projectInvitations = [];
    const invite = this.data.projectInvitations.find(i => 
      (i.invitedEmail || i.invited_email || "").toLowerCase() === cleanEmail
    );

    if (user) {
      // If user has a password set, verify it matches
      if (user.password && password && user.password !== password && (!invite || invite.tempPassword !== password)) {
        return null; // Invalid password
      }
      if (password && !user.password) {
        user.password = password;
      }
      this.data.activeUserId = user.id;
      this.saveState();
      this.notify();
      return user;
    }

    // 3. If matching invitation exists and password matches
    if (invite) {
      if (invite.tempPassword && password && invite.tempPassword !== password) {
        return null; // Invalid password for invitation
      }
      const role = invite.role === 'DEVELOPER' ? 'Developer' : (invite.role === 'QA' ? 'QA Engineer' : 'Viewer');
      user = this.registerUser({
        name: cleanEmail.split("@")[0],
        email: cleanEmail,
        password: password || invite.tempPassword,
        role: role
      });
      this.data.activeUserId = user.id;
      this.saveState();
      this.notify();
      return user;
    }

    return null;
  }

  // ==========================================
  // Supabase PostgreSQL Relational Synchronization
  // ==========================================
  async loadUserSpacesAndProjects(userId) {
    const sb = (typeof window !== 'undefined' && window.supabaseClient) || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
    if (sb && sb.from) {
      try {
        // 1. Fetch spaces from public.spaces table
        const { data: spaces, error: spaceErr } = await sb.from('spaces').select('*');
        if (!spaceErr && Array.isArray(spaces)) {
          this.data.workspaces = spaces;
          if (!this.data.activeWorkspaceId && spaces.length > 0) {
            this.data.activeWorkspaceId = spaces[0].id;
          }
        }

        // 2. Fetch projects from public.projects table
        const { data: projects, error: prjErr } = await sb.from('projects').select('*');
        if (!prjErr && Array.isArray(projects)) {
          this.data.projects = projects.map(p => ({
            id: p.id,
            workspace_id: p.workspace_id,
            key: p.key,
            name: p.name,
            description: p.description || "",
            category: p.category || "Core QA & Engineering",
            customer: p.customer || "Enterprise Client",
            priority: p.priority || "P1",
            status: p.status || "Active",
            health: p.health || 100,
            pmId: p.pm_id || p.pmId || "Project Manager",
            startDate: p.start_date || p.startDate || "",
            dueDate: p.due_date || p.dueDate || "",
            endDate: p.due_date || p.endDate || ""
          }));
          const spaceProjects = this.data.projects.filter(p => p.workspace_id === this.data.activeWorkspaceId);
          const isCurrentActiveValid = this.data.activeProjectId && this.data.projects.some(p => p.id === this.data.activeProjectId || p.key === this.data.activeProjectId);
          if (!isCurrentActiveValid) {
            if (spaceProjects.length > 0) {
              this.data.activeProjectId = spaceProjects[0].id;
            } else if (this.data.projects.length > 0) {
              this.data.activeProjectId = this.data.projects[0].id;
            }
          }
        }

        // 3. Fetch members from public.workspace_members table
        const { data: members, error: memErr } = await sb.from('workspace_members').select('*');
        if (!memErr && Array.isArray(members)) {
          members.forEach(m => {
            if (m.workspace_id) {
              const ws = this.data.workspaces.find(w => w.id === m.workspace_id);
              if (ws) {
                if (!ws.members) ws.members = [];
                if (!ws.members.find(item => item.email === m.email)) {
                  ws.members.push(m);
                }
              }
            }
          });
        }

        // 4. Fetch invitations from public.workspace_invitations table
        const { data: invitations, error: invErr } = await sb.from('workspace_invitations').select('*');
        if (!invErr && Array.isArray(invitations)) {
          this.data.invitations = invitations;
        }

        // 5. Fetch issues from public.issues table
        const { data: remoteIssues, error: issErr } = await sb.from('issues').select('*');
        if (!issErr && Array.isArray(remoteIssues)) {
          this.data.issues = remoteIssues.map(i => ({
            ...i,
            id: i.id,
            key: i.key,
            projectId: i.project_id || i.projectId,
            project_id: i.project_id || i.projectId,
            title: i.title,
            description: i.description || "",
            type: i.type || "Task",
            status: i.status || "To Do",
            priority: i.priority || "Medium",
            qaStatus: i.qa_status || i.qaStatus || "Not Tested",
            qa_status: i.qa_status || i.qaStatus || "Not Tested",
            assigneeId: i.assignee_id || i.assigneeId || null,
            reporterId: i.reporter_id || i.reporterId || null,
            developerId: i.developer_id || i.developerId || null,
            storyPoints: Number(i.story_points || i.storyPoints || 0),
            sprintId: i.sprint_id || i.sprintId || null,
            environment: i.environment || "Staging",
            releaseVersion: i.release_version || i.releaseVersion || "",
            buildVersion: i.build_version || i.buildVersion || "",
            reopenCount: Number(i.reopen_count || i.reopenCount || 0),
            createdAt: i.created_at || i.createdAt || new Date().toISOString(),
            updatedAt: i.updated_at || i.updatedAt || new Date().toISOString()
          }));
        }

        // 6. Fetch sprints from public.sprints table
        const { data: remoteSprints, error: spErr } = await sb.from('sprints').select('*');
        if (!spErr && Array.isArray(remoteSprints)) {
          this.data.sprints = remoteSprints.map(s => ({
            ...s,
            id: s.id,
            projectId: s.project_id || s.projectId,
            project_id: s.project_id || s.projectId,
            name: s.name,
            title: s.name,
            goal: s.goal || "",
            status: s.status || "Active",
            startDate: s.start_date || s.startDate || "",
            endDate: s.end_date || s.endDate || "",
            dueDate: s.end_date || s.endDate || "",
            createdAt: s.created_at || s.createdAt || new Date().toISOString()
          }));
        }

        // 7. Fetch test cases from public.test_cases table
        const { data: remoteTests, error: tcErr } = await sb.from('test_cases').select('*');
        if (!tcErr && Array.isArray(remoteTests)) {
          this.data.testCases = remoteTests.map(t => ({
            ...t,
            id: t.id,
            projectId: t.project_id || t.projectId,
            suiteId: t.suite_id || t.suiteId,
            key: t.key,
            title: t.title,
            type: t.type || "Functional",
            priority: t.priority || "Medium",
            status: t.status || "Ready",
            expectedResult: t.expected_result || t.expectedResult || "",
            automated: t.automated || false,
            createdAt: t.created_at || t.createdAt || new Date().toISOString()
          }));
        }

        // 8. Fetch project members from public.project_members table
        const { data: remoteProjMembers, error: pmErr } = await sb.from('project_members').select('*');
        if (!pmErr && Array.isArray(remoteProjMembers)) {
          this.data.projectMembers = remoteProjMembers.map(pm => ({
            id: pm.id,
            projectId: pm.project_id || pm.projectId,
            project_id: pm.project_id || pm.projectId,
            userId: pm.user_id || pm.userId,
            user_id: pm.user_id || pm.userId,
            email: pm.email,
            role: pm.role || "DEVELOPER",
            status: pm.status || "Active",
            joinedAt: pm.joined_at || pm.joinedAt || pm.created_at || new Date().toISOString()
          }));
        }

        // 9. Fetch project invitations from public.project_invitations table
        const { data: remoteProjInvs, error: pinvErr } = await sb.from('project_invitations').select('*');
        if (!pinvErr && Array.isArray(remoteProjInvs)) {
          this.data.projectInvitations = remoteProjInvs.map(pi => ({
            id: pi.id,
            projectId: pi.project_id || pi.projectId,
            project_id: pi.project_id || pi.projectId,
            workspaceId: pi.workspace_id || pi.workspaceId,
            workspace_id: pi.workspace_id || pi.workspaceId,
            invitedEmail: pi.invited_email || pi.invitedEmail,
            invited_email: pi.invited_email || pi.invitedEmail,
            invitedBy: pi.invited_by || pi.invitedBy,
            invited_by: pi.invited_by || pi.invitedBy,
            role: pi.role || "DEVELOPER",
            token: pi.token,
            status: pi.status || "PENDING",
            createdAt: pi.created_at || pi.createdAt || new Date().toISOString(),
            expiresAt: pi.expires_at || pi.expiresAt,
            acceptedAt: pi.accepted_at || pi.acceptedAt || null,
            cancelledAt: pi.cancelled_at || pi.cancelledAt || null
          }));
        }

        // 10. Fetch AI QA Generations from public.ai_qa_generations table
        const { data: remoteGenerations, error: genErr } = await sb.from('ai_qa_generations').select('*');
        if (!genErr && Array.isArray(remoteGenerations)) {
          this.data.aiGenerations = remoteGenerations;
        }

        // 11. Fetch AI Email Logs from public.ai_qa_email_logs table
        const { data: remoteEmailLogs, error: emlErr } = await sb.from('ai_qa_email_logs').select('*');
        if (!emlErr && Array.isArray(remoteEmailLogs)) {
          this.data.aiEmailLogs = remoteEmailLogs;
        }

        this.saveState();
        this.notify();
      } catch (err) {
        console.warn("Supabase relational tables check:", err.message);
      }
    }
  }

  async loadSupabaseCloudTables() {
    return this.loadUserSpacesAndProjects();
  }

  // Workspace & Space Management
  getWorkspaces() {
    return this.data.workspaces || [];
  }

  getWorkspaceById(workspaceId) {
    if (!workspaceId) return null;
    return (this.data.workspaces || []).find(w => w.id === workspaceId || w.slug === workspaceId) || null;
  }

  getWorkspaceMembers(workspaceId) {
    const ws = this.getWorkspaceById(workspaceId);
    if (ws && ws.members && ws.members.length > 0) return ws.members;
    if (this.data.workspaceMembers) {
      return this.data.workspaceMembers.filter(m => m.workspace_id === workspaceId || m.workspaceId === workspaceId);
    }
    return [];
  }

  async addWorkspaceMember(workspaceId, member) {
    return this.addSpaceMember(workspaceId, member);
  }

  getActiveWorkspace() {
    const workspaces = this.getWorkspaces();
    const activeWsId = this.data.activeWorkspaceId;
    const found = workspaces.find(w => w.id === activeWsId);
    if (found) return found;
    if (workspaces.length > 0) {
      this.data.activeWorkspaceId = workspaces[0].id;
      return workspaces[0];
    }
    return null;
  }

  setActiveWorkspace(workspaceId) {
    this.data.activeWorkspaceId = workspaceId;
    // Auto-select first project of the selected space
    const spaceProjects = (this.data.projects || []).filter(p => p.workspace_id === workspaceId);
    if (spaceProjects.length > 0) {
      this.data.activeProjectId = spaceProjects[0].id;
    } else {
      this.data.activeProjectId = null;
    }
    this.saveState();
    this.syncSupabaseCloudState();
    this.notify();
  }

  updateWorkspace(workspaceId, updates = {}) {
    if (!workspaceId) return null;
    const ws = this.getWorkspaceById(workspaceId);
    if (!ws) return null;

    Object.assign(ws, updates);
    this.saveState();
    this.syncSupabaseCloudState();

    // Directly sync to Supabase PostgreSQL spaces table
    const sb = (typeof window !== 'undefined' && window.supabaseClient) || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
    if (sb && sb.from) {
      (async () => {
        try {
          const { error } = await sb.from('spaces').update({
            name: ws.name,
            company_name: ws.company_name || ws.name,
            workspace_type: ws.workspace_type || 'Software Company',
            logo_color: ws.logo_color || 'bg-slate-900',
            logo_url: ws.logo_url || null,
            description: ws.description || null,
            updated_at: new Date().toISOString()
          }).eq('id', ws.id);
          if (error) console.warn("Supabase spaces update notice:", error.message);
        } catch (e) {
          console.warn("Supabase space update error:", e);
        }
      })();
    }

    this.notify();
    return ws;
  }

  addWorkspace(ws) {
    if (!ws) return;
    if (!this.data.workspaces) this.data.workspaces = [];
    const exists = this.data.workspaces.find(w => w.id === ws.id || w.slug === ws.slug);
    
    const activeUser = this.getActiveUser();
    if (!ws.members) {
      ws.members = activeUser ? [{ id: activeUser.id, name: activeUser.name, email: activeUser.email, role: "OWNER" }] : [];
    }

    if (exists) {
      Object.assign(exists, ws);
    } else {
      this.data.workspaces.push(ws);
    }
    this.data.activeWorkspaceId = ws.id;
    this.saveState();
    this.syncSupabaseCloudState();

    // Directly upsert into Supabase PostgreSQL public.spaces table
    const sb = (typeof window !== 'undefined' && window.supabaseClient) || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
    if (sb && sb.from) {
      (async () => {
        try {
          const { error } = await sb.from('spaces').upsert({
            id: ws.id,
            name: ws.name,
            slug: ws.slug,
            company_name: ws.company_name || ws.name,
            workspace_type: ws.workspace_type || 'Software Company',
            logo_color: ws.logo_color || 'bg-slate-900',
            logo_url: ws.logo_url || null,
            description: ws.description || null,
            owner_id: activeUser ? activeUser.id : null,
            created_by: activeUser ? activeUser.email : null
          });
          if (error) console.warn("Supabase spaces table notice:", error.message);

          // Also register creator as OWNER in public.workspace_members
          if (activeUser) {
            const { error: memErr } = await sb.from('workspace_members').upsert({
              id: `wm_${ws.id}_${activeUser.id}`,
              workspace_id: ws.id,
              user_id: activeUser.id,
              name: activeUser.name || 'Owner',
              email: activeUser.email || '',
              role: 'OWNER'
            });
            if (memErr) console.warn("Supabase workspace_members notice:", memErr.message);
          }
        } catch (e) {
          console.warn("Supabase space sync error:", e);
        }
      })();
    }

    this.notify();
    return exists || ws;
  }

  async deleteWorkspace(workspaceId) {
    if (!workspaceId) return false;
    
    // Find all projects belonging to this workspace
    const wsProjects = (this.data.projects || []).filter(p => p.workspace_id === workspaceId || p.workspaceId === workspaceId);
    const prjIds = wsProjects.map(p => p.id);

    // Remove from local memory with full cascade
    this.data.workspaces = (this.data.workspaces || []).filter(w => w.id !== workspaceId);
    this.data.projects = (this.data.projects || []).filter(p => p.workspace_id !== workspaceId && p.workspaceId !== workspaceId);
    
    if (this.data.issues) {
      this.data.issues = this.data.issues.filter(i => !prjIds.includes(i.project_id || i.projectId));
    }
    if (this.data.sprints) {
      this.data.sprints = this.data.sprints.filter(s => !prjIds.includes(s.project_id || s.projectId));
    }
    if (this.data.testCases) {
      this.data.testCases = this.data.testCases.filter(tc => tc.workspace_id !== workspaceId && tc.workspaceId !== workspaceId && !prjIds.includes(tc.project_id || tc.projectId));
    }
    if (this.data.testExecutions) {
      this.data.testExecutions = this.data.testExecutions.filter(te => te.workspace_id !== workspaceId && te.workspaceId !== workspaceId && !prjIds.includes(te.project_id || te.projectId));
    }
    if (this.data.qaReports) {
      this.data.qaReports = this.data.qaReports.filter(r => r.workspace_id !== workspaceId && r.workspaceId !== workspaceId && !prjIds.includes(r.project_id || r.projectId));
    }
    if (this.data.invitations) {
      this.data.invitations = this.data.invitations.filter(i => i.workspace_id !== workspaceId && i.workspaceId !== workspaceId);
    }
    if (this.data.projectInvitations) {
      this.data.projectInvitations = this.data.projectInvitations.filter(pi => (pi.workspace_id !== workspaceId && pi.workspaceId !== workspaceId) && !prjIds.includes(pi.project_id || pi.projectId));
    }
    if (this.data.workspaceMembers) {
      this.data.workspaceMembers = this.data.workspaceMembers.filter(wm => wm.workspace_id !== workspaceId && wm.workspaceId !== workspaceId);
    }
    if (this.data.projectMembers) {
      this.data.projectMembers = this.data.projectMembers.filter(pm => !prjIds.includes(pm.project_id || pm.projectId));
    }

    if (this.data.activeWorkspaceId === workspaceId) {
      this.data.activeWorkspaceId = this.data.workspaces.length > 0 ? this.data.workspaces[0].id : null;
      const remainingProjects = (this.data.projects || []).filter(p => p.workspace_id === this.data.activeWorkspaceId);
      this.data.activeProjectId = remainingProjects.length > 0 ? remainingProjects[0].id : null;
    }

    this.saveState();
    this.syncSupabaseCloudState();

    // Cascading delete in Supabase
    if (typeof window !== 'undefined' && window.supabaseClient && window.supabaseClient.from) {
      try {
        await window.supabaseClient.from('spaces').delete().eq('id', workspaceId);
      } catch (err) {
        console.warn("Error deleting space from Supabase:", err);
      }
    }

    this.notify();
    return true;
  }

  deleteSpace(spaceId) {
    return this.deleteWorkspace(spaceId);
  }

  async updateWorkspaceMemberRole(workspaceId, memberIdOrEmail, newRole) {
    const wsId = workspaceId || this.data.activeWorkspaceId;
    if (!wsId || !memberIdOrEmail || !newRole) return false;

    const normalizedRole = newRole.toUpperCase();
    const ws = this.getWorkspaceById(wsId);
    let targetEmail = null;
    let targetUserId = null;

    // 1. Update in workspace.members
    if (ws && Array.isArray(ws.members)) {
      const mem = ws.members.find(m => m.id === memberIdOrEmail || m.email?.toLowerCase() === String(memberIdOrEmail).toLowerCase());
      if (mem) {
        mem.role = normalizedRole;
        targetEmail = mem.email;
        targetUserId = mem.id || mem.user_id;
      }
    }

    // 2. Update in this.data.workspaceMembers
    if (!this.data.workspaceMembers) this.data.workspaceMembers = [];
    const wm = this.data.workspaceMembers.find(m => 
      (m.workspace_id === wsId || m.workspaceId === wsId) &&
      (m.id === memberIdOrEmail || m.user_id === memberIdOrEmail || m.email?.toLowerCase() === String(memberIdOrEmail).toLowerCase())
    );
    if (wm) {
      wm.role = normalizedRole;
      if (!targetEmail) targetEmail = wm.email;
      if (!targetUserId) targetUserId = wm.user_id || wm.id;
    }

    // 3. Update in this.data.users if present
    if (this.data.users) {
      const u = this.data.users.find(u => (targetUserId && u.id === targetUserId) || (targetEmail && u.email?.toLowerCase() === targetEmail.toLowerCase()));
      if (u) {
        u.role = normalizedRole;
      }
    }

    // 4. Update in active user if self
    const activeUser = this.getActiveUser();
    if (activeUser && ((targetUserId && activeUser.id === targetUserId) || (targetEmail && activeUser.email?.toLowerCase() === targetEmail.toLowerCase()))) {
      activeUser.role = normalizedRole;
    }

    // 5. Dispatch real-time role update notification
    this.addNotification({
      title: `Role Updated: ${normalizedRole}`,
      message: `Role for ${targetEmail || targetUserId || 'member'} was updated to ${normalizedRole} in ${ws ? ws.name : 'the space'}.`,
      type: 'role',
      recipientId: targetUserId,
      recipientEmail: targetEmail
    });

    this.saveState();
    this.syncSupabaseCloudState();

    // 5. Supabase sync
    const sb = (typeof window !== 'undefined' && window.supabaseClient) || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
    if (sb && sb.from) {
      try {
        if (targetUserId) {
          await sb.from('workspace_members').update({ role: normalizedRole }).eq('workspace_id', wsId).eq('user_id', targetUserId);
          await sb.from('profiles').update({ role: normalizedRole }).eq('id', targetUserId);
        } else if (targetEmail) {
          await sb.from('workspace_members').update({ role: normalizedRole }).eq('workspace_id', wsId).ilike('email', targetEmail);
        }
      } catch (err) {
        console.warn("Supabase member role update notice:", err);
      }
    }

    this.notify();
    return true;
  }

  addSpaceMember(spaceId, member) {
    if (!spaceId || !member) return;
    const ws = this.data.workspaces.find(w => w.id === spaceId || w.slug === spaceId);
    if (ws) {
      if (!ws.members) ws.members = [];
      const memberEmail = (member.email || "").toLowerCase().trim();
      const exists = ws.members.find(m => m.id === member.id || (m.email && m.email.toLowerCase() === memberEmail));
      if (exists) {
        Object.assign(exists, member);
      } else {
        ws.members.push(member);
      }
      this.saveState();
      this.syncSupabaseCloudState();

      // Directly upsert into Supabase PostgreSQL public.workspace_members table
      if (typeof window !== 'undefined' && window.supabaseClient && window.supabaseClient.from) {
        (async () => {
          try {
            const { error } = await window.supabaseClient.from('workspace_members').upsert({
              id: member.id || `wm_${Date.now()}`,
              workspace_id: ws.id,
              name: member.name || memberEmail.split('@')[0],
              email: memberEmail,
              role: member.role || 'QA_ENGINEER'
            });
            if (error) console.warn("Supabase workspace_members notice:", error.message);
          } catch (e) {
            console.warn(e);
          }
        })();
      }

      this.notify();
    }
  }

  // ==========================================
  // Workspace Invitations Management
  // ==========================================
  getInvitations(workspaceId = null) {
    const wsId = workspaceId || this.data.activeWorkspaceId;
    if (!this.data.invitations) this.data.invitations = [];
    const invs = wsId ? this.data.invitations.filter(i => i.workspace_id === wsId || i.workspaceId === wsId) : this.data.invitations;
    
    // Also include any workspace invitations from projectInvitations
    if (this.data.projectInvitations) {
      this.data.projectInvitations.forEach(pi => {
        if ((!wsId || pi.workspace_id === wsId || pi.workspaceId === wsId) && !invs.some(i => i.id === pi.id)) {
          invs.push({
            id: pi.id,
            workspace_id: pi.workspace_id || pi.workspaceId || wsId,
            invited_email: pi.invitedEmail || pi.invited_email,
            invited_by: pi.invitedBy || pi.invited_by || 'Admin',
            role: pi.role || 'QA_ENGINEER',
            token: pi.token || pi.id,
            status: pi.status || 'Pending',
            created_at: pi.createdAt || pi.created_at || new Date().toISOString()
          });
        }
      });
    }
    return invs;
  }

  async createInvitation(workspaceId, { email, role = 'QA_ENGINEER', invited_by = null }) {
    if (!workspaceId || !email) return null;
    const cleanEmail = email.trim().toLowerCase();
    const id = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const token = `tok_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString(36)}`;
    const activeUser = this.getActiveUser();

    const newInv = {
      id,
      workspace_id: workspaceId,
      invited_email: cleanEmail,
      invited_by: invited_by || (activeUser ? activeUser.email : 'Admin'),
      role: role || 'QA_ENGINEER',
      token: token,
      status: 'Pending',
      created_at: new Date().toISOString()
    };

    if (!this.data.invitations) this.data.invitations = [];
    this.data.invitations.unshift(newInv);

    // Also register in projectInvitations so token-based accept URL is valid
    if (!this.data.projectInvitations) this.data.projectInvitations = [];
    this.data.projectInvitations.unshift({
      id: newInv.id,
      workspace_id: workspaceId,
      workspaceId: workspaceId,
      projectId: null,
      scope: 'SPACE',
      invitedEmail: cleanEmail,
      invited_email: cleanEmail,
      invitedBy: newInv.invited_by,
      role: newInv.role,
      token: token,
      status: 'PENDING',
      createdAt: newInv.created_at,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    });

    this.saveState();

    if (typeof window !== 'undefined' && window.supabaseClient && window.supabaseClient.from) {
      try {
        await window.supabaseClient.from('workspace_invitations').upsert(newInv);
      } catch (err) {
        console.warn("Supabase invitation notice:", err);
      }
      try {
        await window.supabaseClient.from('project_invitations').upsert({
          id: newInv.id,
          workspace_id: workspaceId,
          scope: 'SPACE',
          invited_email: cleanEmail,
          invited_by: newInv.invited_by,
          role: newInv.role,
          token: token,
          status: 'PENDING',
          created_at: newInv.created_at,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        });
      } catch (err) {
        console.warn("Supabase project invitation sync notice:", err);
      }
    }

    this.notify();
    return newInv;
  }

  async cancelInvitation(invitationId) {
    if (!invitationId) return;
    if (!this.data.invitations) this.data.invitations = [];
    const inv = this.data.invitations.find(i => i.id === invitationId);
    if (inv) {
      inv.status = 'Cancelled';
    }

    if (this.data.projectInvitations) {
      const pinv = this.data.projectInvitations.find(i => i.id === invitationId);
      if (pinv) pinv.status = 'CANCELLED';
    }

    this.saveState();

    if (typeof window !== 'undefined' && window.supabaseClient && window.supabaseClient.from) {
      try {
        await window.supabaseClient.from('workspace_invitations').update({ status: 'Cancelled' }).eq('id', invitationId);
      } catch (e) {
        console.warn(e);
      }
      try {
        await window.supabaseClient.from('project_invitations').update({ status: 'CANCELLED' }).eq('id', invitationId);
      } catch (e) {
        console.warn(e);
      }
    }

    this.notify();
  }

  async deleteWorkspaceInvitation(invitationId) {
    if (!invitationId) return;
    if (this.data.invitations) {
      this.data.invitations = this.data.invitations.filter(i => i.id !== invitationId);
    }
    if (this.data.projectInvitations) {
      this.data.projectInvitations = this.data.projectInvitations.filter(i => i.id !== invitationId);
    }
    this.saveState();

    if (typeof window !== 'undefined' && window.supabaseClient && window.supabaseClient.from) {
      try {
        await window.supabaseClient.from('workspace_invitations').delete().eq('id', invitationId);
        await window.supabaseClient.from('project_invitations').delete().eq('id', invitationId);
      } catch (e) {
        console.warn(e);
      }
    }

    this.notify();
  }

  async resendInvitation(invitationId) {
    if (!invitationId) return;
    if (!this.data.invitations) this.data.invitations = [];
    const inv = this.data.invitations.find(i => i.id === invitationId);
    if (inv) {
      inv.status = 'Pending';
      inv.created_at = new Date().toISOString();
    }

    if (this.data.projectInvitations) {
      const pinv = this.data.projectInvitations.find(i => i.id === invitationId);
      if (pinv) {
        pinv.status = 'PENDING';
        pinv.createdAt = new Date().toISOString();
      }
    }

    this.saveState();

    if (typeof window !== 'undefined' && window.supabaseClient && window.supabaseClient.from) {
      try {
        await window.supabaseClient.from('workspace_invitations').update({
          status: 'Pending',
          created_at: new Date().toISOString()
        }).eq('id', invitationId);
      } catch (e) {
        console.warn(e);
      }
      try {
        await window.supabaseClient.from('project_invitations').update({
          status: 'PENDING',
          created_at: new Date().toISOString()
        }).eq('id', invitationId);
      } catch (e) {
        console.warn(e);
      }
    }

    this.notify();
  }

  // ==========================================
  // Personal Profile Management
  // ==========================================
  async updateUserProfile(userId, { name, role, initials, color, bio, phone, avatar_url }) {
    const activeUser = this.getActiveUser();
    const targetId = userId || (activeUser ? activeUser.id : null);
    if (!targetId) return null;

    if (activeUser && activeUser.id === targetId) {
      if (name !== undefined) activeUser.name = name;
      if (role !== undefined) activeUser.role = role;
      if (initials !== undefined) activeUser.initials = initials;
      if (color !== undefined) activeUser.color = color;
      if (bio !== undefined) activeUser.bio = bio;
      if (phone !== undefined) activeUser.phone = phone;
      if (avatar_url !== undefined) activeUser.avatar_url = avatar_url;
    }

    if (this.data.users) {
      const u = this.data.users.find(u => u.id === targetId);
      if (u) {
        if (name !== undefined) u.name = name;
        if (role !== undefined) u.role = role;
        if (initials !== undefined) u.initials = initials;
        if (color !== undefined) u.color = color;
        if (bio !== undefined) u.bio = bio;
        if (phone !== undefined) u.phone = phone;
        if (avatar_url !== undefined) u.avatar_url = avatar_url;
      }
    }

    // Keep workspace members updated with the new name and role
    if (this.data.workspaceMembers) {
      this.data.workspaceMembers.forEach(wm => {
        if (wm.user_id === targetId || wm.id === targetId || (activeUser?.email && wm.email?.toLowerCase() === activeUser.email.toLowerCase())) {
          if (name) wm.name = name;
          if (role) wm.role = role;
        }
      });
    }

    if (this.data.workspaces) {
      this.data.workspaces.forEach(ws => {
        if (Array.isArray(ws.members)) {
          ws.members.forEach(m => {
            if (m.id === targetId || m.user_id === targetId || (activeUser?.email && m.email?.toLowerCase() === activeUser.email.toLowerCase())) {
              if (name) m.name = name;
              if (role) m.role = role;
            }
          });
        }
      });
    }

    this.saveState();
    this.syncSupabaseCloudState();

    // Supabase profiles & Auth metadata sync
    const sb = (typeof window !== 'undefined' && window.supabaseClient) || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
    if (sb && sb.from) {
      try {
        await sb.from('profiles').upsert({
          id: targetId,
          full_name: name || (activeUser ? activeUser.name : ''),
          email: activeUser ? (activeUser.email || '') : '',
          role: role || (activeUser ? activeUser.role : 'QA Engineer'),
          avatar_url: avatar_url || (activeUser ? activeUser.avatar_url : null),
          updated_at: new Date().toISOString()
        });
        if (sb.auth && sb.auth.updateUser) {
          await sb.auth.updateUser({
            data: { name, role, initials, color }
          });
        }
      } catch (err) {
        console.warn("Supabase profile update notice:", err);
      }
    }

    this.notify();
    return activeUser;
  }

  // ==========================================
  // Delete User Account
  // ==========================================
  async deleteUserAccount(userId = null) {
    const activeUser = this.getActiveUser();
    const targetId = userId || (activeUser ? activeUser.id : null);
    if (!targetId) return;

    if (typeof window !== 'undefined' && window.supabaseClient && window.supabaseClient.from) {
      try {
        await window.supabaseClient.from('profiles').delete().eq('id', targetId);
        await window.supabaseClient.from('workspace_members').delete().eq('user_id', targetId);
        await window.supabaseClient.from('project_members').delete().eq('user_id', targetId);
      } catch (e) {
        console.warn("Profile cleanup notice:", e);
      }

      if (window.supabaseClient.auth && window.supabaseClient.auth.signOut) {
        try {
          await window.supabaseClient.auth.signOut();
        } catch (e) {
          console.warn(e);
        }
      }
    }

    this.clearSupabaseUser();
    this.resetToDefault();
    localStorage.clear();
  }

  async createProject(project) {
    return await this.addRealProject(project);
  }

  async addRealProject(project) {
    const id = project.id || `prj-${Date.now()}`;
    const sb = (typeof window !== 'undefined' && window.supabaseClient) || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);

    let activeWs = this.getActiveWorkspace ? this.getActiveWorkspace() : null;
    let targetWsId = project.workspace_id || this.data.activeWorkspaceId || (activeWs ? activeWs.id : null);

    // If still missing, check workspaces in memory or query Supabase spaces table
    if (!targetWsId && this.data.workspaces && this.data.workspaces.length > 0) {
      targetWsId = this.data.workspaces[0].id;
      this.data.activeWorkspaceId = targetWsId;
    } else if (!targetWsId && sb && sb.from) {
      try {
        const { data: remoteSpaces } = await sb.from('spaces').select('*');
        if (remoteSpaces && remoteSpaces.length > 0) {
          targetWsId = remoteSpaces[0].id;
          this.data.workspaces = remoteSpaces;
          this.data.activeWorkspaceId = targetWsId;
        }
      } catch (e) {
        console.warn("Space lookup notice:", e);
      }
    }

    if (!this.data.activeWorkspaceId && targetWsId) {
      this.data.activeWorkspaceId = targetWsId;
    }

    const activeUser = this.getActiveUser();
    const activeUserId = activeUser ? activeUser.id : "usr_owner";

    const newProject = {
      id,
      workspace_id: targetWsId,
      key: (project.key || (project.name ? project.name.substring(0, 3) : "PRJ")).toUpperCase(),
      name: project.name || "New Project",
      description: project.description || "",
      category: project.category || "Core QA & Engineering",
      customer: project.customer || "Enterprise Client",
      priority: project.priority || "P1",
      status: project.status || "Active",
      health: Number(project.health || 100),
      pmId: project.pmId || project.pm_id || project.project_manager_id || (activeUser ? activeUser.name : "Project Manager"),
      members: project.members || (activeUser ? [activeUser.id] : []),
      techStack: project.techStack || ["React", "Node.js", "Supabase"],
      release_version: project.release_version || project.releaseVersion || project.currentRelease || "v1.0.0",
      releaseVersion: project.release_version || project.releaseVersion || project.currentRelease || "v1.0.0",
      environment: project.environment || "Staging",
      build_version: project.build_version || project.buildVersion || "b101",
      buildVersion: project.build_version || project.buildVersion || "b101",
      startDate: project.startDate || project.start_date || new Date().toISOString().split("T")[0],
      endDate: project.dueDate || project.endDate || project.target_release_date || "",
      dueDate: project.dueDate || project.endDate || project.target_release_date || new Date(Date.now() + 90 * 86400000).toISOString().split("T")[0]
    };

    if (!this.data.projects) this.data.projects = [];
    const exists = this.data.projects.find(p => p.id === newProject.id || (p.key === newProject.key && p.workspace_id === newProject.workspace_id));
    if (exists) {
      Object.assign(exists, newProject);
    } else {
      this.data.projects.unshift(newProject);
    }
    this.data.activeProjectId = id;

    // Ensure project membership for creator so it is never filtered out
    if (!this.data.projectMembers) this.data.projectMembers = [];
    if (activeUser) {
      const pmExists = this.data.projectMembers.some(pm => (pm.projectId === newProject.id || pm.project_id === newProject.id) && (pm.userId === activeUser.id || pm.user_id === activeUser.id || (activeUser.email && pm.email === activeUser.email)));
      if (!pmExists) {
        this.data.projectMembers.push({
          id: `pm_${newProject.id}_${activeUser.id || Date.now()}`,
          projectId: newProject.id,
          project_id: newProject.id,
          userId: activeUser.id,
          user_id: activeUser.id,
          email: activeUser.email || '',
          name: activeUser.name || 'Project Manager',
          role: 'PROJECT_MANAGER'
        });
      }
    }

    // Create default Sprint 01
    this.createSprint({
      projectId: id,
      name: "Sprint 01",
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
      goal: `Initial Sprint for ${newProject.name}`,
      description: "Baseline setup, smoke tests, and core verification."
    });

    this.saveState();

    // Directly upsert into Supabase PostgreSQL public.projects table
    if (sb && sb.from) {
      try {
        const sbPayload = {
          id: newProject.id,
          workspace_id: newProject.workspace_id || null,
          key: newProject.key,
          name: newProject.name,
          description: newProject.description || "",
          category: newProject.category || "Core QA & Engineering",
          customer: newProject.customer || "Enterprise Client",
          priority: newProject.priority || "P1",
          status: newProject.status || "Active",
          health: newProject.health || 100,
          pm_id: newProject.pmId || (activeUser ? activeUser.name : "Project Manager"),
          start_date: newProject.startDate || null,
          due_date: newProject.dueDate || null
        };

        const { error } = await sb.from('projects').upsert(sbPayload);
        if (error) {
          console.warn("Supabase projects table notice:", error.message);
        } else {
          console.log(`Project "${newProject.name}" (${newProject.key}) successfully saved in Supabase.`);
        }

        if (activeUser && activeUser.id) {
          try {
            await sb.from('project_members').upsert({
              id: `pm_${newProject.id}_${activeUser.id}`,
              project_id: newProject.id,
              user_id: activeUser.id,
              email: activeUser.email || '',
              role: 'PROJECT_MANAGER'
            });
          } catch (e) {}
        }
      } catch (e) {
        console.warn("Project sync notice:", e);
      }
    }

    if (typeof this.syncSupabaseCloudState === 'function') {
      try { await this.syncSupabaseCloudState(); } catch (e) {}
    }
    this.notify();
    return newProject;
  }

  completeOnboarding() {
    const user = this.getActiveUser();
    if (user) {
      user.onboarding_completed = true;
    }
    this.saveState();
    this.syncSupabaseCloudState();
  }

  getUsers() {
    return this.data.users || [];
  }

  formatNameFromEmail(email) {
    if (!email || !email.includes('@')) return email || 'Team Member';
    const localPart = email.split('@')[0];
    return localPart
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/(developer|qa|sqa|pm|admin|tester|engineer|lead|manager|owner)/gi, ' $1 ')
      .replace(/[0-9]+/g, ' ')
      .split(/[._\-\s]+/)
      .filter(Boolean)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ') || localPart;
  }

  getInitials(name) {
    if (!name || name === 'Unassigned' || name === '—' || name === '--') return 'TM';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  formatDisplayName(name, email) {
    if (name && name !== 'Unassigned' && name !== 'Team Member' && !name.includes('@') && !name.startsWith('usr_')) {
      return name.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
    if (email && email.includes('@')) {
      return this.formatNameFromEmail(email);
    }
    if (name && name.includes('@')) {
      return this.formatNameFromEmail(name);
    }
    return name || 'Team Member';
  }

  getUserById(id) {
    if (!id || id === 'unassigned' || id === 'Unassigned') {
      return { id: 'unassigned', name: 'Unassigned', initials: '—', role: 'Team Member', color: 'bg-slate-400' };
    }
    
    // 1. Check this.data.users
    const user = (this.data.users || []).find(u => 
      u.id === id || 
      u.supabase_id === id || 
      (u.email && u.email.toLowerCase() === String(id).toLowerCase())
    );
    if (user && user.name && user.name !== 'Unassigned') {
      const displayName = this.formatDisplayName(user.name, user.email);
      return {
        ...user,
        name: displayName,
        initials: user.initials && user.initials !== '--' ? user.initials : this.getInitials(displayName)
      };
    }

    // 2. Check workspaceMembers
    const wm = (this.data.workspaceMembers || []).find(m => 
      m.id === id || 
      m.user_id === id || 
      (m.email && m.email.toLowerCase() === String(id).toLowerCase())
    );
    if (wm) {
      const wmName = this.formatDisplayName(wm.name, wm.email);
      return {
        id: wm.user_id || wm.id || id,
        name: wmName,
        email: wm.email,
        role: wm.role || 'QA',
        initials: this.getInitials(wmName),
        color: wm.color || 'bg-emerald-600'
      };
    }

    // 3. Check projectMembers
    const pm = (this.data.projectMembers || []).find(m => 
      m.id === id || 
      m.userId === id || 
      m.user_id === id || 
      (m.email && m.email.toLowerCase() === String(id).toLowerCase())
    );
    if (pm) {
      const pmName = this.formatDisplayName(pm.name, pm.email);
      return {
        id: pm.userId || pm.user_id || pm.id || id,
        name: pmName,
        email: pm.email,
        role: pm.role || 'DEVELOPER',
        initials: this.getInitials(pmName),
        color: pm.color || 'bg-slate-900'
      };
    }

    // 4. Check projectInvitations
    const inv = (this.data.projectInvitations || []).find(i => 
      (i.invitedEmail && i.invitedEmail.toLowerCase() === String(id).toLowerCase()) ||
      (i.invited_email && i.invited_email.toLowerCase() === String(id).toLowerCase())
    );
    if (inv) {
      const invEmail = inv.invitedEmail || inv.invited_email;
      const invName = this.formatDisplayName('', invEmail);
      return {
        id,
        name: invName,
        email: invEmail,
        role: inv.role || 'Team Member',
        initials: this.getInitials(invName),
        color: 'bg-indigo-600'
      };
    }

    // 5. Fallback formatting if id is an email or username string
    let derivedName = String(id);
    if (derivedName.includes('@')) {
      derivedName = this.formatNameFromEmail(derivedName);
    } else if (derivedName.startsWith('usr_') || derivedName.startsWith('pm_') || derivedName.startsWith('wm_')) {
      derivedName = 'Team Member';
    } else {
      derivedName = this.formatDisplayName(derivedName, '');
    }

    return {
      id,
      name: derivedName,
      initials: this.getInitials(derivedName),
      role: 'Team Member',
      color: 'bg-slate-700'
    };
  }

  getActiveUser() {
    return this.data.users.find(u => u.id === this.data.activeUserId) || this.data.users[0] || {
      id: "usr_guest",
      name: "Guest User",
      email: "guest@pulsewave.io",
      role: "QA Engineer",
      initials: "GU",
      color: "bg-slate-600"
    };
  }

  setActiveUser(userId) {
    if (this.data.users.some(u => u.id === userId)) {
      this.data.activeUserId = userId;
      this.saveState();
      this.notify();
    }
  }

  getProjects(workspaceId = null) {
    return this.getAuthorizedProjects(workspaceId);
  }

  getAllProjects(workspaceId = null) {
    const wsId = workspaceId || this.data.activeWorkspaceId;
    if (!this.data.projects) this.data.projects = [];
    if (!wsId) return this.data.projects;
    return this.data.projects.filter(p => !p.workspace_id || p.workspace_id === wsId);
  }

  getAuthorizedProjects(workspaceId = null, userId = null) {
    const wsId = workspaceId || this.data.activeWorkspaceId;
    let all = (this.data.projects || []).filter(p => !wsId || p.workspace_id === wsId || p.workspaceId === wsId);
    
    if (all.length === 0 && (this.data.projects || []).length > 0) {
      all = this.data.projects || [];
    }

    const activeUser = this.getActiveUser();
    const uId = userId || (activeUser ? activeUser.id : null);
    const uEmail = (activeUser ? activeUser.email : '')?.toLowerCase().trim();

    if (!uId && !uEmail) return all;

    const spaceRole = this.getUserSpaceRole(wsId, uId);
    // PM, QA, OWNER, or unassigned default have full visibility over all projects in the Space
    if (!spaceRole || spaceRole === "PM" || spaceRole === "QA" || spaceRole === "OWNER") {
      return all;
    }

    // Developer and Viewer see projects where they are assigned, created, or listed as PM
    const userPrjIds = new Set(
      (this.data.projectMembers || [])
        .filter(pm => pm.userId === uId || pm.user_id === uId || (pm.email && pm.email.toLowerCase() === uEmail))
        .map(pm => pm.projectId || pm.project_id)
    );

    return all.filter(p => userPrjIds.has(p.id) || p.pmId === activeUser.name || p.pm_id === activeUser.name || p.pmId === uId || (p.members && p.members.includes(uId)));
  }

  getActiveProject() {
    const projects = this.getAuthorizedProjects();
    const activePrjId = this.data.activeProjectId;
    const found = projects.find(p => p.id === activePrjId || p.key === activePrjId);
    if (found) return found;
    return projects.length > 0 ? projects[0] : ((this.data.projects && this.data.projects.length > 0) ? this.data.projects[0] : null);
  }

  setActiveProject(projectId) {
    if (!projectId) return;
    const proj = (this.data.projects || []).find(p => p.id === projectId || p.key === projectId);
    if (proj) {
      this.data.activeProjectId = proj.id;
      if (proj.workspace_id && proj.workspace_id !== this.data.activeWorkspaceId) {
        this.data.activeWorkspaceId = proj.workspace_id;
      }
      this.saveState();
      this.syncSupabaseCloudState();
      this.notify();
    }
  }

  getUsers() {
    return this.data.users || [];
  }

  getProjectById(projectId) {
    return (this.data.projects || []).find(p => p.id === projectId || p.key === projectId) || null;
  }

  async updateProject(projectId, updateData) {
    const idx = (this.data.projects || []).findIndex(p => p.id === projectId || p.key === projectId);
    if (idx !== -1) {
      const realId = this.data.projects[idx].id;
      this.data.projects[idx] = { ...this.data.projects[idx], ...updateData };
      this.saveState();

      const sb = (typeof window !== 'undefined' && window.supabaseClient) || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
      if (sb && sb.from) {
        try {
          const mappedUpdate = {};
          if (updateData.name !== undefined) mappedUpdate.name = updateData.name;
          if (updateData.key !== undefined) mappedUpdate.key = updateData.key;
          if (updateData.description !== undefined) mappedUpdate.description = updateData.description;
          if (updateData.category !== undefined) mappedUpdate.category = updateData.category;
          if (updateData.customer !== undefined) mappedUpdate.customer = updateData.customer;
          if (updateData.priority !== undefined) mappedUpdate.priority = updateData.priority;
          if (updateData.status !== undefined) mappedUpdate.status = updateData.status;
          if (updateData.health !== undefined) mappedUpdate.health = updateData.health;
          if (updateData.pmId !== undefined || updateData.pm_id !== undefined) mappedUpdate.pm_id = updateData.pmId || updateData.pm_id;
          if (updateData.startDate !== undefined || updateData.start_date !== undefined) mappedUpdate.start_date = updateData.startDate || updateData.start_date;
          if (updateData.dueDate !== undefined || updateData.due_date !== undefined) mappedUpdate.due_date = updateData.dueDate || updateData.due_date;
          if (updateData.workspace_id !== undefined) mappedUpdate.workspace_id = updateData.workspace_id;

          if (Object.keys(mappedUpdate).length > 0) {
            await sb.from('projects').update(mappedUpdate).eq('id', realId);
          }
        } catch (e) {
          console.warn("Project update notice:", e);
        }
      }

      this.notify();
      return this.data.projects[idx];
    }
    return null;
  }

  async toggleProjectStatus(projectId) {
    const proj = this.getProjectById(projectId);
    if (!proj) return null;
    const isCurrentlyActive = (proj.status || 'Active') === 'Active';
    const newStatus = isCurrentlyActive ? 'Inactive' : 'Active';
    return await this.updateProject(proj.id, { status: newStatus });
  }

  async deleteProject(projectId) {
    if (!projectId) return false;
    
    const proj = this.getProjectById(projectId);
    if (!proj) return false;

    const targetId = proj.id;
    const targetKey = proj.key;

    // 1. Delete associated data from Supabase if connected
    const sb = (typeof window !== 'undefined' && window.supabaseClient) || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
    if (sb && sb.from) {
      try {
        try { await sb.from('issues').delete().eq('project_id', targetId); } catch (e) {}
        try { await sb.from('project_members').delete().eq('project_id', targetId); } catch (e) {}
        try { await sb.from('project_invitations').delete().eq('project_id', targetId); } catch (e) {}
        try { await sb.from('releases').delete().eq('project_id', targetId); } catch (e) {}
        try { await sb.from('release_issue_links').delete().eq('project_id', targetId); } catch (e) {}
        try { await sb.from('qa_test_cases').delete().eq('project_id', targetId); } catch (e) {}
        try { await sb.from('qa_reports').delete().eq('project_id', targetId); } catch (e) {}
        try { await sb.from('chat_messages').delete().eq('project_id', targetId); } catch (e) {}
        try { await sb.from('ai_generations').delete().eq('project_id', targetId); } catch (e) {}
        
        // Delete project itself
        await sb.from('projects').delete().eq('id', targetId);
      } catch (err) {
        console.warn("Supabase project deletion notice:", err);
      }
    }

    // 2. Remove from local store data collections
    if (this.data.projects) {
      this.data.projects = this.data.projects.filter(p => p.id !== targetId && p.key !== targetKey);
    }
    if (this.data.issues) {
      this.data.issues = this.data.issues.filter(i => i.projectId !== targetId && i.project_id !== targetId && i.projectId !== targetKey);
    }
    if (this.data.projectMembers) {
      this.data.projectMembers = this.data.projectMembers.filter(pm => pm.projectId !== targetId && pm.project_id !== targetId);
    }
    if (this.data.projectInvitations) {
      this.data.projectInvitations = this.data.projectInvitations.filter(pi => pi.projectId !== targetId && pi.project_id !== targetId);
    }
    if (this.data.releases) {
      this.data.releases = this.data.releases.filter(r => r.projectId !== targetId && r.project_id !== targetId);
    }
    if (this.data.testCases) {
      this.data.testCases = this.data.testCases.filter(t => t.projectId !== targetId && t.project_id !== targetId);
    }
    if (this.data.qaReports) {
      this.data.qaReports = this.data.qaReports.filter(q => q.projectId !== targetId && q.project_id !== targetId);
    }
    if (this.data.chatMessages) {
      this.data.chatMessages = this.data.chatMessages.filter(m => m.projectId !== targetId && m.project_id !== targetId);
    }
    if (this.data.aiGenerations) {
      this.data.aiGenerations = this.data.aiGenerations.filter(g => g.projectId !== targetId && g.project_id !== targetId);
    }

    // 3. Fallback active project if the active one was deleted
    if (this.data.activeProjectId === targetId || this.data.activeProjectId === targetKey) {
      const remaining = (this.getProjects && this.getProjects().length > 0) ? this.getProjects() : (this.data.projects || []);
      this.data.activeProjectId = remaining.length > 0 ? remaining[0].id : null;
    }

    this.saveState();
    if (typeof this.syncSupabaseCloudState === 'function') {
      try { this.syncSupabaseCloudState(); } catch (e) {}
    }
    this.notify();
    return true;
  }


  // =========================================================================
  // WORKSPACE MEMBERS & USER REGISTRATION (Sections 1-4)
  // =========================================================================
  registerUser(userData) {
    if (!this.data.users) this.data.users = [];
    const email = (userData.email || '').toLowerCase().trim();
    let user = this.data.users.find(u => (userData.id && u.id === userData.id) || (email && u.email && u.email.toLowerCase() === email));
    if (user) {
      Object.assign(user, userData);
    } else {
      user = {
        id: userData.id || `usr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        name: userData.name || (email ? email.split('@')[0] : 'Team Member'),
        email: email,
        role: userData.role || 'QA Engineer',
        initials: (userData.name || email || 'TM').split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase(),
        color: userData.color || 'bg-slate-900',
        ...userData
      };
      this.data.users.push(user);
    }
    this.saveState();
    return user;
  }

  getWorkspaceMembers(workspaceId = null) {
    const wsId = workspaceId || this.data.activeWorkspaceId;
    if (!wsId) return [];
    const ws = this.getWorkspaceById(wsId);
    if (!this.data.workspaceMembers) this.data.workspaceMembers = [];
    const members = [...this.data.workspaceMembers.filter(m => m.workspace_id === wsId || m.workspaceId === wsId)];
    
    // Also include members embedded in workspace.members array if any
    if (ws && Array.isArray(ws.members)) {
      ws.members.forEach(m => {
        const mEmail = (m.email || '').toLowerCase().trim();
        if (!members.some(em => (m.id && (em.user_id === m.id || em.id === m.id)) || (mEmail && em.email?.toLowerCase() === mEmail))) {
          members.push({
            id: m.id || `wm_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            workspace_id: wsId,
            user_id: m.id || m.user_id || null,
            name: m.name || (mEmail ? mEmail.split('@')[0] : 'Member'),
            email: mEmail,
            role: m.role || 'DEVELOPER',
            joined_at: new Date().toISOString()
          });
        }
      });
    }
    return members;
  }

  async addWorkspaceMember(workspaceId, { user_id = null, name = '', email = '', role = 'DEVELOPER' }) {
    if (!workspaceId) throw new Error("Workspace ID is required.");
    if (!this.data.workspaceMembers) this.data.workspaceMembers = [];
    const normalizedEmail = (email || '').toLowerCase().trim();
    
    let existing = this.data.workspaceMembers.find(m => 
      (m.workspace_id === workspaceId || m.workspaceId === workspaceId) &&
      ((user_id && (m.user_id === user_id || m.userId === user_id)) || (normalizedEmail && m.email && m.email.toLowerCase() === normalizedEmail))
    );

    if (existing) {
      existing.role = role;
      if (name) existing.name = name;
      if (user_id) existing.user_id = user_id;
    } else {
      existing = {
        id: `wm_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        workspace_id: workspaceId,
        workspaceId: workspaceId,
        user_id: user_id || null,
        userId: user_id || null,
        name: name || (normalizedEmail ? normalizedEmail.split('@')[0] : 'Member'),
        email: normalizedEmail,
        role: role,
        joined_at: new Date().toISOString()
      };
      this.data.workspaceMembers.push(existing);
    }

    // Also update workspace object's members array
    const ws = this.getWorkspaceById(workspaceId);
    if (ws) {
      if (!Array.isArray(ws.members)) ws.members = [];
      const mIdx = ws.members.findIndex(m => (user_id && m.id === user_id) || (normalizedEmail && m.email && m.email.toLowerCase() === normalizedEmail));
      if (mIdx !== -1) {
        ws.members[mIdx] = { ...ws.members[mIdx], role, name: name || ws.members[mIdx].name };
      } else {
        ws.members.push({ id: user_id || existing.id, name: existing.name, email: normalizedEmail, role });
      }
    }

    this.saveState();

    const sb = (typeof window !== 'undefined' && window.supabaseClient) || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
    if (sb && sb.from) {
      try {
        await sb.from('workspace_members').upsert({
          id: existing.id,
          workspace_id: workspaceId,
          user_id: existing.user_id,
          name: existing.name,
          email: existing.email,
          role: existing.role,
          joined_at: existing.joined_at
        });
      } catch (err) {
        console.warn("Supabase workspace_members upsert notice:", err.message);
      }
    }

    this.notify();
    return existing;
  }

  // =========================================================================
  // TWO-TIER ROLE ENGINE & RBAC PERMISSION MATRIX (Sections 4-11)
  // =========================================================================

  // 1. Space-Level Role (PM / OWNER, QA, DEVELOPER, VIEWER)
  getUserSpaceRole(workspaceId = null, userId = null) {
    const wsId = workspaceId || this.data.activeWorkspaceId;
    const activeWs = wsId ? this.getWorkspaceById(wsId) : this.getActiveWorkspace();
    if (!activeWs) return "PM"; // Default baseline if no workspace selected yet

    const activeUser = this.getActiveUser();
    const uId = userId || (activeUser ? activeUser.id : null);
    const userObj = uId ? this.getUserById(uId) : activeUser;
    const uEmail = (userObj?.email || (activeUser?.id === uId ? activeUser?.email : ''))?.toLowerCase().trim();

    // Check if user is inactive
    if (userObj && (userObj.status === 'Inactive' || userObj.status === 'INACTIVE')) {
      return null;
    }

    // Check if user is space owner/creator
    if (activeWs.owner_id === uId || activeWs.created_by === uId || (activeWs.members && activeWs.members.some(m => (m.id === uId || m.user_id === uId || m.email?.toLowerCase() === uEmail) && (m.role === 'OWNER' || m.role === 'PROJECT_MANAGER' || m.role === 'PM')))) {
      return "PM";
    }

    const wsMembers = this.getWorkspaceMembers(activeWs.id);
    const member = wsMembers.find(m => (uId && (m.user_id === uId || m.id === uId || m.userId === uId)) || (uEmail && m.email && m.email.toLowerCase() === uEmail));
    if (member) {
      if (member.status === 'Inactive' || member.status === 'INACTIVE') return null;
      const r = (member.role || "").toUpperCase();
      if (r === 'OWNER' || r === 'PROJECT_MANAGER' || r === 'PM') return "PM";
      if (r === 'QA' || r === 'QA_MANAGER' || r === 'QA_ENGINEER') return "QA";
      if (r === 'DEVELOPER') return "DEVELOPER";
      if (r === 'VIEWER' || r === 'CLIENT_VIEWER') return "VIEWER";
      return r;
    }

    if (!uId || (activeUser && (activeUser.id === uId || activeUser.email === uEmail))) {
      const userRole = (userObj?.role || activeUser?.role || "PM").toUpperCase();
      if (userRole.includes('PM') || userRole.includes('MANAGER') || userRole.includes('OWNER') || userRole.includes('ADMIN')) return "PM";
      if (userRole.includes('QA') || userRole.includes('TESTER')) return "QA";
      if (userRole.includes('DEV') || userRole.includes('ENGINEER')) return "DEVELOPER";
      return userRole || "PM";
    }
    return null;
  }

  // 2. Project-Level Role (PM, QA, DEVELOPER, VIEWER)
  getUserProjectRole(projectId, userId = null) {
    const project = (this.data.projects || []).find(p => p.id === projectId);
    if (!project) return null;

    const activeUser = this.getActiveUser();
    const uId = userId || (activeUser ? activeUser.id : null);
    const userObj = uId ? this.getUserById(uId) : activeUser;
    const uEmail = (userObj?.email || (activeUser?.id === uId ? activeUser?.email : ''))?.toLowerCase().trim();

    // Check if user is inactive
    if (userObj && (userObj.status === 'Inactive' || userObj.status === 'INACTIVE')) {
      return null;
    }

    // Check if user is space PM / Owner
    const spaceRole = this.getUserSpaceRole(project.workspace_id || project.workspaceId, uId);
    if (spaceRole === "PM") {
      return "PM";
    }

    // Check project_members table
    const members = (this.data.projectMembers || []).filter(pm => pm.projectId === projectId || pm.project_id === projectId);
    const member = members.find(m => (uId && (m.userId === uId || m.user_id === uId)) || (uEmail && m.email && m.email.toLowerCase() === uEmail));
    if (member) {
      if (member.status === 'Inactive' || member.status === 'INACTIVE') return null;
      const r = (member.role || "").toUpperCase();
      if (r === 'OWNER' || r === 'PROJECT_MANAGER' || r === 'PM') return "PM";
      if (r === 'QA' || r === 'QA_MANAGER' || r === 'QA_ENGINEER') return "QA";
      if (r === 'DEVELOPER') return "DEVELOPER";
      if (r === 'VIEWER' || r === 'CLIENT_VIEWER') return "VIEWER";
      return r;
    }

    // Check if user is space QA (QA has trusted access to all projects in space)
    if (spaceRole === "QA") {
      return "QA";
    }

    return null; // Not a member of this project
  }

  // RBAC Permission Matrix Checks
  canCreateProject(workspaceId = null, userId = null) {
    const role = this.getUserSpaceRole(workspaceId, userId);
    return role === "PM" || role === "QA";
  }

  canDeleteProject(projectId = null, userId = null) {
    const role = this.getUserProjectRole(projectId, userId);
    return role === "PM";
  }

  canCreateIssue(projectId, userId = null) {
    const role = this.getUserProjectRole(projectId, userId);
    return role === "PM" || role === "QA";
  }

  canEditIssue(projectId, issue = null, userId = null) {
    const role = this.getUserProjectRole(projectId, userId);
    return role === "PM" || role === "QA" || role === "DEVELOPER";
  }

  canMoveKanbanCard(projectId, issue = null, targetStatus = null, userId = null) {
    const role = this.getUserProjectRole(projectId, userId);
    if (role === "PM" || role === "QA") return true;
    if (role === "DEVELOPER") {
      const devWorkflowStatuses = ["Backlog", "Todo", "In Progress", "Code Review", "QA", "In QA", "Ready for QA"];
      if (targetStatus && !devWorkflowStatuses.includes(targetStatus)) return false;
      return true;
    }
    return false; // Viewer cannot move cards
  }

  canCreateSprint(projectId = null, userId = null) {
    const role = this.getUserProjectRole(projectId, userId);
    return role === "PM" || role === "QA";
  }

  canManageSprint(projectId = null, userId = null) {
    const role = this.getUserProjectRole(projectId, userId);
    return role === "PM" || role === "QA";
  }

  canVerifyQA(projectId, userId = null) {
    const role = this.getUserProjectRole(projectId, userId);
    return role === "PM" || role === "QA";
  }

  canCreateReport(projectId = null, userId = null) {
    const role = this.getUserProjectRole(projectId, userId);
    return role === "PM" || role === "QA";
  }

  canManageProjectTeam(projectId = null, userId = null) {
    const role = this.getUserProjectRole(projectId, userId);
    return role === "PM";
  }

  canEditProjectSettings(projectId, userId = null) {
    const role = this.getUserProjectRole(projectId, userId);
    return role === "PM" || role === "QA";
  }

  canManageReleases(projectId, userId = null) {
    const role = this.getUserProjectRole(projectId, userId);
    return role === "PM" || role === "QA";
  }

  canConfigureQualitySettings(projectId, userId = null) {
    const role = this.getUserProjectRole(projectId, userId);
    return role === "PM";
  }

  canOverrideRelease(projectId, userId = null) {
    const role = this.getUserProjectRole(projectId, userId);
    if (role !== "PM") return false;
    const settings = this.getProjectQualitySettings(projectId);
    return Boolean(settings.allow_release_override);
  }

  canViewReleases(projectId, userId = null) {
    const role = this.getUserProjectRole(projectId, userId);
    return role !== null;
  }

  canEditSpaceSettings(workspaceId = null, userId = null) {
    const role = this.getUserSpaceRole(workspaceId, userId);
    return role === "PM";
  }

  canDeleteSpace(workspaceId = null, userId = null) {
    const role = this.getUserSpaceRole(workspaceId, userId);
    return role === "PM";
  }

  getProjectMembers(projectId) {
    const project = this.getProjectById(projectId);
    if (!project) return [];

    if (!this.data.projectMembers) this.data.projectMembers = [];
    const rawMembers = this.data.projectMembers.filter(pm => pm.projectId === projectId || pm.project_id === projectId);
    const users = this.getUsers();
    const issues = this.getIssues(projectId) || [];
    const activeUser = this.getActiveUser();

    const memberList = [];
    const seenEmails = new Set();
    const seenUserIds = new Set();

    // 1. Ensure project PM is always included as OWNER / Project Manager
    if (project.pmId) {
      const pmUser = this.getUserById(project.pmId);
      const pmEmail = (pmUser.email || (project.pmId && project.pmId.includes('@') ? project.pmId : '') || (activeUser && activeUser.email) || '').toLowerCase();
      const pmName = this.formatDisplayName(pmUser.name && pmUser.name !== 'Unassigned' ? pmUser.name : (pmUser.email || project.pmId), pmEmail);
      const initials = this.getInitials(pmName);

      if (pmEmail) seenEmails.add(pmEmail);
      if (pmUser.id && pmUser.id !== 'unassigned') seenUserIds.add(pmUser.id);
      if (project.pmId) seenUserIds.add(project.pmId);

      const pmIssues = issues.filter(i => (i.assigneeId === pmUser.id || i.assignee_id === pmUser.id || i.developerId === pmUser.id));
      memberList.push({
        id: `pm_${project.id}`,
        projectId: project.id,
        userId: pmUser.id,
        name: pmName,
        email: pmEmail || 'pm@pulsewave.io',
        role: "OWNER",
        status: "Active",
        joinedAt: project.createdAt || project.created_at || new Date().toISOString(),
        initials: initials,
        color: pmUser.color || "bg-slate-900",
        assignedIssuesCount: pmIssues.length,
        activeIssuesCount: pmIssues.filter(i => i.status !== "Done" && i.status !== "Closed").length,
        openBugsCount: pmIssues.filter(i => i.type === "Bug" && i.status !== "Done" && i.status !== "Closed").length
      });
    }

    // 2. Add members from project_members table
    rawMembers.forEach(rm => {
      const user = rm.userId ? this.getUserById(rm.userId) : null;
      const email = (rm.email || (user ? user.email : '') || '').toLowerCase();
      const uId = rm.userId || (user ? user.id : null);

      if (email && seenEmails.has(email)) return;
      if (uId && seenUserIds.has(uId)) return;
      if (email) seenEmails.add(email);
      if (uId) seenUserIds.add(uId);

      const mIssues = issues.filter(i => (i.assigneeId === uId || i.assignee_id === uId || i.developerId === uId));
      const userName = this.formatDisplayName(user && user.name && user.name !== 'Unassigned' ? user.name : rm.name, email);
      const initials = this.getInitials(userName);

      memberList.push({
        id: rm.id,
        projectId: project.id,
        userId: uId,
        name: userName,
        email: email || (user ? user.email : 'member@project.io'),
        role: rm.role || 'DEVELOPER',
        status: rm.status || 'Active',
        joinedAt: rm.joinedAt || rm.joined_at || rm.createdAt || new Date().toISOString(),
        initials: initials,
        color: user && user.color ? user.color : 'bg-slate-700',
        assignedIssuesCount: mIssues.length,
        activeIssuesCount: mIssues.filter(i => i.status !== "Done" && i.status !== "Closed").length,
        openBugsCount: mIssues.filter(i => i.type === "Bug" && i.status !== "Done" && i.status !== "Closed").length
      });
    });

    // 3. Add Space-level members (e.g. Space QA, Space Viewers, Space Admins) from workspaceMembers
    const wsId = project.workspace_id || project.workspaceId;
    if (wsId) {
      const wsMembers = this.getWorkspaceMembers(wsId);
      wsMembers.forEach(wm => {
        const user = wm.user_id ? this.getUserById(wm.user_id) : (wm.email ? this.getUsers().find(u => u.email?.toLowerCase() === wm.email.toLowerCase()) : null);
        const email = (wm.email || (user ? user.email : '') || '').toLowerCase();
        const uId = wm.user_id || (user ? user.id : null);

        if (email && seenEmails.has(email)) return;
        if (uId && seenUserIds.has(uId)) return;
        if (email) seenEmails.add(email);
        if (uId) seenUserIds.add(uId);

        const mIssues = issues.filter(i => (i.assigneeId === uId || i.assignee_id === uId || i.developerId === uId));
        const userName = this.formatDisplayName(user && user.name && user.name !== 'Unassigned' ? user.name : wm.name, email);
        const initials = this.getInitials(userName);

        memberList.push({
          id: wm.id || `wm_${uId || email}`,
          projectId: project.id,
          userId: uId,
          name: userName,
          email: email || (user ? user.email : 'member@project.io'),
          role: wm.role === 'QA' ? 'QA_MANAGER' : (wm.role === 'PM' ? 'OWNER' : (wm.role || 'QA_MANAGER')),
          status: wm.status || 'Active',
          joinedAt: wm.joined_at || wm.joinedAt || wm.createdAt || new Date().toISOString(),
          initials: initials,
          color: user && user.color ? user.color : 'bg-emerald-700',
          assignedIssuesCount: mIssues.length,
          activeIssuesCount: mIssues.filter(i => i.status !== "Done" && i.status !== "Closed").length,
          openBugsCount: mIssues.filter(i => i.type === "Bug" && i.status !== "Done" && i.status !== "Closed").length
        });
      });
    }

    // 4. Add any accepted invitations for this space or project
    if (this.data.projectInvitations) {
      const acceptedInvs = this.data.projectInvitations.filter(i => 
        i.status === 'ACCEPTED' && 
        (i.workspace_id === wsId || i.workspaceId === wsId) && 
        (i.scope === 'SPACE' || i.project_id === projectId || i.projectId === projectId)
      );

      acceptedInvs.forEach(inv => {
        const email = (inv.invitedEmail || inv.invited_email || '').toLowerCase();
        const user = email ? this.getUsers().find(u => u.email?.toLowerCase() === email) : null;
        const uId = user ? user.id : null;

        if (email && seenEmails.has(email)) return;
        if (uId && seenUserIds.has(uId)) return;
        if (email) seenEmails.add(email);
        if (uId) seenUserIds.add(uId);

        const mIssues = issues.filter(i => (i.assigneeId === uId || i.assignee_id === uId || i.developerId === uId));
        const userName = this.formatDisplayName(user && user.name && user.name !== 'Unassigned' ? user.name : '', email);
        const initials = this.getInitials(userName);

        memberList.push({
          id: `inv_acc_${inv.id}`,
          projectId: project.id,
          userId: uId,
          name: userName,
          email: email,
          role: inv.role === 'QA' ? 'QA_MANAGER' : (inv.role === 'DEVELOPER' ? 'DEVELOPER' : (inv.role === 'PM' ? 'OWNER' : 'VIEWER')),
          status: 'Active',
          joinedAt: inv.acceptedAt || inv.accepted_at || inv.createdAt || new Date().toISOString(),
          initials: initials,
          color: user && user.color ? user.color : 'bg-slate-900',
          assignedIssuesCount: mIssues.length,
          activeIssuesCount: mIssues.filter(i => i.status !== "Done" && i.status !== "Closed").length,
          openBugsCount: mIssues.filter(i => i.type === "Bug" && i.status !== "Done" && i.status !== "Closed").length
        });
      });
    }

    return memberList;
  }

  async addProjectMember(arg1, arg2) {
    if (!arg1) return null;
    let projectId, userId, email, role, status, name;
    if (typeof arg1 === 'string') {
      projectId = arg1;
      const member = arg2 || {};
      userId = member.id || member.userId || member.user_id || null;
      email = (member.email || '').toLowerCase().trim();
      role = member.role || 'DEVELOPER';
      status = member.status || 'Active';
      name = member.name || email;
    } else {
      projectId = arg1.projectId || arg1.project_id;
      userId = arg1.userId || arg1.user_id || (arg1.id && !arg1.id.startsWith('pm_') ? arg1.id : null);
      email = (arg1.email || '').toLowerCase().trim();
      role = arg1.role || 'DEVELOPER';
      status = arg1.status || 'Active';
      name = arg1.name || email;
    }

    if (!this.data.projectMembers) this.data.projectMembers = [];
    const id = `pm_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const newMember = {
      id,
      projectId,
      project_id: projectId,
      userId: userId || null,
      user_id: userId || null,
      name: name || email,
      email,
      role,
      status,
      joinedAt: new Date().toISOString(),
      joined_at: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.data.projectMembers.push(newMember);

    // Update project.members if present
    const proj = this.getProjectById(projectId);
    if (proj) {
      if (!proj.members) proj.members = [];
      const memberRef = userId || email;
      if (memberRef && !proj.members.includes(memberRef)) {
        proj.members.push(memberRef);
      }
    }

    this.saveState();

    const sb = (typeof window !== 'undefined' && window.supabaseClient) || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
    if (sb && sb.from && projectId) {
      try {
        await sb.from('project_members').upsert({
          id: newMember.id,
          project_id: projectId,
          user_id: userId || null,
          email: newMember.email,
          role: newMember.role,
          status: newMember.status,
          joined_at: newMember.joined_at,
          created_at: newMember.created_at,
          updated_at: newMember.updated_at
        });
      } catch (err) {
        console.warn("Supabase project_members upsert notice:", err.message);
      }
    }

    this.notify();
    return newMember;
  }

  canChangeUserRole(projectId = null, targetUserId = null, actingUserId = null) {
    const activeUser = this.getActiveUser();
    const currentUserId = actingUserId || (activeUser ? activeUser.id : null);
    const currentUserEmail = (activeUser?.email || '')?.toLowerCase().trim();

    // 1. Only PM can change roles
    const role = projectId ? this.getUserProjectRole(projectId, currentUserId) : this.getUserSpaceRole(null, currentUserId);
    if (role !== "PM") return false;

    // 2. Users cannot change their own role
    if (targetUserId && (targetUserId === currentUserId || (currentUserEmail && String(targetUserId).toLowerCase() === currentUserEmail))) {
      return false;
    }

    return true;
  }

  async changeProjectMemberRole(projectId, memberId, newRole) {
    const activeUser = this.getActiveUser();
    if (!this.canManageProjectTeam(projectId, activeUser?.id)) {
      throw new Error("Permission Denied: Only a Project Manager can modify member roles.");
    }

    if (!this.data.projectMembers) this.data.projectMembers = [];
    const idx = this.data.projectMembers.findIndex(pm => pm.id === memberId || (pm.projectId === projectId && pm.userId === memberId));
    if (idx !== -1) {
      const targetMember = this.data.projectMembers[idx];
      if (activeUser && (targetMember.userId === activeUser.id || (targetMember.email && targetMember.email.toLowerCase() === activeUser.email.toLowerCase()))) {
        throw new Error("Self-Role Modification Blocked: You cannot change your own role. Another PM must adjust your permissions.");
      }

      this.data.projectMembers[idx].role = newRole;
      this.data.projectMembers[idx].updatedAt = new Date().toISOString();

      const proj = this.getProjectById(projectId);
      this.addNotification({
        title: `Role Updated: ${newRole}`,
        message: `Your project role was updated to ${newRole} in ${proj ? proj.name : 'the project'}.`,
        type: 'role',
        projectId: projectId,
        recipientId: targetMember.userId || targetMember.id,
        recipientEmail: targetMember.email
      });

      this.saveState();

      const sb = (typeof window !== 'undefined' && window.supabaseClient) || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
      if (sb && sb.from) {
        try {
          await sb.from('project_members').update({ role: newRole, updated_at: new Date().toISOString() }).eq('id', this.data.projectMembers[idx].id);
        } catch (err) {
          console.warn("Supabase role update notice:", err.message);
        }
      }

      this.notify();
      return this.data.projectMembers[idx];
    }
    return null;
  }

  async updateProjectMemberStatus(projectId, memberId, newStatus) {
    if (!this.data.projectMembers) this.data.projectMembers = [];
    const members = this.getProjectMembers(projectId);
    const targetMember = members.find(m => m.id === memberId || m.userId === memberId);
    if (!targetMember) throw new Error("Member not found in project.");

    const activeUser = this.getActiveUser();
    const currentUserId = activeUser ? activeUser.id : null;
    const currentUserEmail = (activeUser?.email || '').toLowerCase().trim();
    const targetUserId = targetMember.userId || targetMember.id;
    const targetUserEmail = (targetMember.email || '').toLowerCase().trim();

    // Guard: Current PM cannot deactivate their own account
    if (newStatus === 'Inactive' && ((currentUserId && targetUserId === currentUserId) || (currentUserEmail && targetUserEmail === currentUserEmail))) {
      throw new Error("You cannot deactivate your own active Project Manager account.");
    }

    // 1. Update projectMembers in local store
    const pIdx = this.data.projectMembers.findIndex(pm => pm.id === memberId || (pm.projectId === projectId && (pm.userId === targetUserId || (targetUserEmail && pm.email?.toLowerCase() === targetUserEmail))));
    if (pIdx !== -1) {
      this.data.projectMembers[pIdx].status = newStatus;
      this.data.projectMembers[pIdx].updatedAt = new Date().toISOString();
    } else {
      this.data.projectMembers.push({
        id: `pm_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        projectId,
        userId: targetUserId,
        email: targetUserEmail,
        role: targetMember.role || 'DEVELOPER',
        status: newStatus,
        joinedAt: targetMember.joinedAt || new Date().toISOString()
      });
    }

    // 2. Update users array
    const uIdx = this.data.users.findIndex(u => u.id === targetUserId || (targetUserEmail && u.email?.toLowerCase() === targetUserEmail));
    if (uIdx !== -1) {
      this.data.users[uIdx].status = newStatus;
    }

    // 3. Update workspaceMembers array
    if (this.data.workspaceMembers) {
      const wmIdx = this.data.workspaceMembers.findIndex(wm => (targetUserId && (wm.user_id === targetUserId || wm.id === targetUserId)) || (targetUserEmail && wm.email?.toLowerCase() === targetUserEmail));
      if (wmIdx !== -1) {
        this.data.workspaceMembers[wmIdx].status = newStatus;
      }
    }

    this.saveState();

    // 4. Sync status with Supabase PostgreSQL
    const sb = (typeof window !== 'undefined' && window.supabaseClient) || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
    if (sb && sb.from) {
      try {
        if (targetUserId) {
          await sb.from('project_members').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('project_id', projectId).eq('user_id', targetUserId);
          await sb.from('workspace_members').update({ status: newStatus }).eq('user_id', targetUserId);
        } else if (targetUserEmail) {
          await sb.from('project_members').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('project_id', projectId).eq('email', targetUserEmail);
          await sb.from('workspace_members').update({ status: newStatus }).eq('email', targetUserEmail);
        }
      } catch (err) {
        console.warn("Supabase member status update notice:", err.message);
      }
    }

    this.notify();
    return true;
  }

  async removeProjectMember(projectId, memberId, actingUserId = null) {
    if (!this.data.projectMembers) this.data.projectMembers = [];
    const members = this.getProjectMembers(projectId);
    const memberToRemove = members.find(m => m.id === memberId || m.userId === memberId);
    if (!memberToRemove) throw new Error("Member not found in project.");

    const activeUser = this.getActiveUser();
    const currentUserId = actingUserId || (activeUser ? activeUser.id : null);
    const currentUserEmail = (activeUser?.email || '')?.toLowerCase().trim();

    // 1. Self-Deletion Guard: PM cannot delete themself
    const targetUserId = memberToRemove.userId || memberToRemove.id;
    const targetUserEmail = (memberToRemove.email || '')?.toLowerCase().trim();
    if ((currentUserId && targetUserId === currentUserId) || (currentUserEmail && targetUserEmail === currentUserEmail)) {
      throw new Error("You cannot delete your own account from the project team. To leave this project or transfer ownership, another Project Manager must remove you.");
    }
    
    // 2. Sole PM / Owner Protection
    const normRole = (memberToRemove.role || '').toUpperCase();
    if (normRole === 'OWNER' || normRole === 'PROJECT_MANAGER' || normRole === 'PM') {
      const pmCount = members.filter(m => {
        const r = (m.role || '').toUpperCase();
        return r === 'OWNER' || r === 'PROJECT_MANAGER' || r === 'PM';
      }).length;
      if (pmCount <= 1) {
        throw new Error("You cannot delete the only Project Manager. Assign another Project Manager before deleting this member.");
      }
    }

    // Remove from in-memory project members
    this.data.projectMembers = this.data.projectMembers.filter(pm => pm.id !== memberId && !(pm.projectId === projectId && (pm.userId === targetUserId || (targetUserEmail && pm.email?.toLowerCase() === targetUserEmail))));

    // Also remove from workspaceMembers if they are in this workspace
    const project = this.getProjectById(projectId);
    const wsId = project ? (project.workspace_id || project.workspaceId) : this.data.activeWorkspaceId;
    if (wsId && targetUserEmail) {
      if (this.data.workspaceMembers) {
        this.data.workspaceMembers = this.data.workspaceMembers.filter(wm => 
          !(wm.workspace_id === wsId && (wm.user_id === targetUserId || wm.email?.toLowerCase() === targetUserEmail))
        );
      }
      const ws = this.getWorkspaceById(wsId);
      if (ws && Array.isArray(ws.members)) {
        ws.members = ws.members.filter(m => m.id !== targetUserId && m.email?.toLowerCase() !== targetUserEmail);
      }
    }

    this.saveState();

    // Permanently delete across Supabase tables
    const sb = (typeof window !== 'undefined' && window.supabaseClient) || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
    if (sb && sb.from) {
      try {
        await sb.from('project_members').delete().eq('id', memberId);
        if (targetUserEmail) {
          await sb.from('project_members').delete().ilike('email', targetUserEmail);
          await sb.from('workspace_members').delete().ilike('email', targetUserEmail);
          await sb.from('project_invitations').delete().ilike('invited_email', targetUserEmail);
        }
        if (wsId) {
          const ws = this.getWorkspaceById(wsId);
          if (ws && Array.isArray(ws.members)) {
            await sb.from('workspaces').update({ members: ws.members }).eq('id', wsId);
          }
        }
      } catch (err) {
        console.warn("Supabase remove member notice:", err.message);
      }
    }

    this.notify();
    return true;
  }

  async removeWorkspaceMember(workspaceId, memberIdOrEmail, actingUserId = null) {
    const wsId = workspaceId || this.data.activeWorkspaceId;
    if (!wsId) return false;

    const activeUser = this.getActiveUser();
    const currentUserId = actingUserId || (activeUser ? activeUser.id : null);
    const currentUserEmail = (activeUser?.email || '')?.toLowerCase().trim();

    if (!this.data.workspaceMembers) this.data.workspaceMembers = [];
    const member = this.data.workspaceMembers.find(m => m.id === memberIdOrEmail || m.user_id === memberIdOrEmail || m.email?.toLowerCase() === String(memberIdOrEmail).toLowerCase());
    
    const targetUserId = member?.user_id || memberIdOrEmail;
    const targetEmail = (member?.email || memberIdOrEmail)?.toLowerCase().trim();

    // Self-deletion guard
    if ((currentUserId && targetUserId === currentUserId) || (currentUserEmail && targetEmail === currentUserEmail)) {
      throw new Error("You cannot delete your own account from the Space. Another Project Manager must remove you.");
    }

    // Clean in-memory workspace members
    this.data.workspaceMembers = this.data.workspaceMembers.filter(m => m.id !== memberIdOrEmail && m.user_id !== memberIdOrEmail && m.email?.toLowerCase() !== targetEmail);
    
    // Clean workspace.members array
    const ws = this.getWorkspaceById(wsId);
    if (ws && Array.isArray(ws.members)) {
      ws.members = ws.members.filter(m => m.id !== targetUserId && m.email?.toLowerCase() !== targetEmail);
    }

    // Clean project members in that workspace
    const wsProjects = (this.data.projects || []).filter(p => p.workspace_id === wsId || p.workspaceId === wsId);
    const prjIds = wsProjects.map(p => p.id);
    if (this.data.projectMembers) {
      this.data.projectMembers = this.data.projectMembers.filter(pm => 
        !(prjIds.includes(pm.projectId || pm.project_id) && (pm.userId === targetUserId || pm.email?.toLowerCase() === targetEmail))
      );
    }

    // Clean invitations
    if (this.data.projectInvitations) {
      this.data.projectInvitations = this.data.projectInvitations.filter(pi => 
        !((pi.workspace_id === wsId || pi.workspaceId === wsId) && (pi.invitedEmail?.toLowerCase() === targetEmail || pi.invited_email?.toLowerCase() === targetEmail))
      );
    }

    this.saveState();

    // Permanently delete in Supabase tables
    const sb = (typeof window !== 'undefined' && window.supabaseClient) || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
    if (sb && sb.from) {
      try {
        if (targetEmail) {
          await sb.from('workspace_members').delete().ilike('email', targetEmail);
          await sb.from('project_members').delete().ilike('email', targetEmail);
          await sb.from('project_invitations').delete().ilike('invited_email', targetEmail);
        }
        if (ws && Array.isArray(ws.members)) {
          await sb.from('workspaces').update({ members: ws.members }).eq('id', wsId);
        }
      } catch (err) {
        console.warn("Supabase remove workspace member notice:", err.message);
      }
    }

    this.notify();
    return true;
  }

  // ==========================================
  // Project & Space Invitations Management (Sections 14-16)
  // ==========================================
  getProjectInvitations(projectId = null) {
    if (!this.data.projectInvitations) this.data.projectInvitations = [];
    if (!projectId) return this.data.projectInvitations;
    return this.data.projectInvitations.filter(pi => pi.projectId === projectId || pi.project_id === projectId || (!pi.project_id && !pi.projectId));
  }

  getWorkspaceInvitations(workspaceId = null) {
    const wsId = workspaceId || this.data.activeWorkspaceId;
    if (!this.data.projectInvitations) this.data.projectInvitations = [];
    if (!wsId) return this.data.projectInvitations;
    return this.data.projectInvitations.filter(pi => pi.workspace_id === wsId || pi.workspaceId === wsId);
  }

  async inviteMember({ workspaceId = null, projectId = null, email, password = null, role = 'DEVELOPER', scope = 'PROJECT' }) {
    if (!email || !email.includes('@')) throw new Error("Please enter a valid email address.");
    const normalizedEmail = email.toLowerCase().trim();
    const wsId = workspaceId || this.data.activeWorkspaceId;
    if (!wsId) throw new Error("No active space selected.");

    const activeWs = this.getWorkspaceById(wsId);
    const spaceName = activeWs ? activeWs.name : "Workspace";

    // Standardize role names: 'PM', 'QA', 'DEVELOPER', 'VIEWER'
    let normRole = role.toUpperCase();
    if (normRole === 'QA_MANAGER' || normRole === 'QA_ENGINEER') normRole = 'QA';
    if (normRole === 'PROJECT_MANAGER' || normRole === 'OWNER') normRole = 'PM';

    // Scope validation rules (Section 21)
    if (scope === 'SPACE') {
      if (normRole === 'DEVELOPER') {
        throw new Error("Developer access cannot be assigned to an entire Space. Developer access must be assigned to a specific project.");
      }
      if (normRole !== 'QA' && normRole !== 'VIEWER') {
        throw new Error("Only QA or Viewer roles can be invited to an entire Space.");
      }
    } else {
      // Scope is PROJECT
      if (!projectId) throw new Error("A specific project must be selected for project-scoped invitations.");
      const project = (this.data.projects || []).find(p => p.id === projectId);
      if (!project) throw new Error("Project not found.");
    }

    // 1. Check duplicate membership
    if (scope === 'SPACE') {
      const wsMembers = this.getWorkspaceMembers(wsId);
      if (wsMembers.some(m => m.email && m.email.toLowerCase() === normalizedEmail)) {
        throw new Error("This user is already a member of this Space. If you wish to re-invite them, delete their existing membership first.");
      }
    } else {
      const prjMembers = this.getProjectMembers(projectId);
      if (prjMembers.some(m => m.email && m.email.toLowerCase() === normalizedEmail)) {
        throw new Error("This user is already a member of this project. If you wish to re-invite them, delete their existing membership first.");
      }
    }

    // 2. Check duplicate pending invitation
    if (!this.data.projectInvitations) this.data.projectInvitations = [];
    const pending = this.data.projectInvitations.find(i => 
      (i.invitedEmail || i.invited_email)?.toLowerCase() === normalizedEmail &&
      (i.workspace_id === wsId || i.workspaceId === wsId) &&
      (scope === 'SPACE' ? i.scope === 'SPACE' : (i.project_id === projectId || i.projectId === projectId)) &&
      i.status === 'PENDING'
    );
    if (pending) {
      throw new Error("An invitation is already pending for this email. Use 'Resend' or delete the pending invitation to send a new one.");
    }

    // 3. Generate secure crypto random token (32 hex chars)
    const token = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID().replace(/-/g, '') : `tkn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date(Date.now() + 7 * 86400000).toISOString();
    const activeUser = this.getActiveUser();
    const initialPassword = password || `TempPass@${Math.floor(1000 + Math.random() * 9000)}`;

    const newInv = {
      id: `pinv_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      workspaceId: wsId,
      workspace_id: wsId,
      projectId: scope === 'PROJECT' ? projectId : null,
      project_id: scope === 'PROJECT' ? projectId : null,
      scope, // 'SPACE' or 'PROJECT'
      invitedEmail: normalizedEmail,
      invited_email: normalizedEmail,
      invitedBy: activeUser ? activeUser.name || activeUser.email : 'Project Manager',
      invited_by: activeUser ? activeUser.id : null,
      role: normRole,
      token,
      tempPassword: initialPassword,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      created_at: new Date().toISOString(),
      expiresAt,
      expires_at: expiresAt,
      acceptedAt: null,
      accepted_at: null,
      cancelledAt: null,
      cancelled_at: null
    };

    this.data.projectInvitations.unshift(newInv);

    // Register/Upsert user account with credentials so the invited user can sign in immediately
    const derivedName = normalizedEmail.split('@')[0];
    const existingUser = (this.data.users || []).find(u => u.email && u.email.toLowerCase() === normalizedEmail);
    if (!existingUser) {
      if (!this.data.users) this.data.users = [];
      this.data.users.push({
        id: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        name: derivedName,
        email: normalizedEmail,
        password: initialPassword,
        role: normRole,
        workspaceId: wsId,
        avatar: "",
        initials: derivedName.substring(0, 2).toUpperCase()
      });
    } else {
      existingUser.password = initialPassword;
      existingUser.role = normRole;
    }

    this.saveState();

    // Persist to Supabase
    const sb = (typeof window !== 'undefined' && window.supabaseClient) || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
    if (sb) {
      // 1. Provision user credentials directly in Supabase Auth if password is provided
      if (sb.auth && initialPassword) {
        try {
          await sb.auth.signUp({
            email: normalizedEmail,
            password: initialPassword,
            options: {
              data: {
                full_name: derivedName,
                name: derivedName,
                role: normRole,
                workspace_id: wsId,
                project_id: projectId
              }
            }
          });
        } catch (authErr) {
          console.warn("Supabase Auth user signup notice:", authErr.message);
        }
      }

      if (sb.from) {
        try {
          await sb.from('project_invitations').upsert({
            id: newInv.id,
            workspace_id: wsId,
            project_id: newInv.project_id,
            scope: newInv.scope,
            invited_email: normalizedEmail,
            invited_by: newInv.invited_by,
            role: normRole,
            token,
            status: 'PENDING',
            created_at: newInv.created_at,
            expires_at: expiresAt
          });
        } catch (err) {
          console.warn("Supabase project invitation insert notice:", err.message);
        }
      }

      // Trigger Supabase email delivery service
      if (sb.auth && sb.auth.signInWithOtp) {
        try {
          const origin = (typeof window !== 'undefined' && window.location && window.location.origin) ? window.location.origin : 'http://localhost';
          const redirectUrl = `${origin}/#accept-invite?token=${token}&email=${encodeURIComponent(normalizedEmail)}`;
          await sb.auth.signInWithOtp({
            email: normalizedEmail,
            options: {
              emailRedirectTo: redirectUrl,
              data: {
                workspace_name: spaceName,
                project_id: projectId,
                role: normRole,
                scope: scope,
                invitation_token: token
              }
            }
          });
        } catch (mailErr) {
          console.warn("Supabase email dispatch notice:", mailErr);
        }
      }
    }

    this.notify();
    return newInv;
  }

  async inviteProjectMember(args) {
    return this.inviteMember({
      ...args,
      scope: args.scope || (args.projectId ? 'PROJECT' : 'SPACE')
    });
  }

  async resendProjectInvitation(invitationId) {
    if (!this.data.projectInvitations) this.data.projectInvitations = [];
    const inv = this.data.projectInvitations.find(i => i.id === invitationId);
    if (!inv) throw new Error("Invitation not found.");

    inv.token = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID().replace(/-/g, '') : `tkn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    inv.expiresAt = new Date(Date.now() + 7 * 86400000).toISOString();
    inv.expires_at = inv.expiresAt;
    inv.status = 'PENDING';
    this.saveState();

    const sb = (typeof window !== 'undefined' && window.supabaseClient) || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
    if (sb) {
      if (sb.from) {
        try {
          await sb.from('project_invitations').update({
            token: inv.token,
            expires_at: inv.expiresAt,
            status: 'PENDING'
          }).eq('id', invitationId);
        } catch (err) {
          console.warn("Supabase resend invitation notice:", err.message);
        }
      }

      // Trigger Supabase email delivery service
      if (sb.auth && sb.auth.signInWithOtp) {
        try {
          const origin = (typeof window !== 'undefined' && window.location && window.location.origin) ? window.location.origin : 'http://localhost';
          const redirectUrl = `${origin}/#accept-invite?token=${inv.token}`;
          await sb.auth.signInWithOtp({
            email: inv.invitedEmail || inv.invited_email,
            options: {
              emailRedirectTo: redirectUrl,
              data: {
                invitation_token: inv.token,
                role: inv.role,
                scope: inv.scope
              }
            }
          });
        } catch (mailErr) {
          console.warn("Supabase resend email dispatch notice:", mailErr);
        }
      }
    }

    this.notify();
    return inv;
  }

  async cancelProjectInvitation(invitationId) {
    return this.deleteInvitation(invitationId);
  }

  async deleteProjectInvitation(invitationId) {
    return this.deleteInvitation(invitationId);
  }

  async deleteInvitation(invitationId) {
    if (!this.data.projectInvitations) this.data.projectInvitations = [];
    const inv = this.data.projectInvitations.find(i => i.id === invitationId);
    
    // Remove from in-memory store
    this.data.projectInvitations = this.data.projectInvitations.filter(i => i.id !== invitationId);
    this.saveState();

    // Remove from localStorage cache
    if (typeof localStorage !== 'undefined') {
      try {
        const storedInvs = JSON.parse(localStorage.getItem('pulsewave_project_invitations') || '[]');
        const updated = storedInvs.filter(i => i.id !== invitationId);
        localStorage.setItem('pulsewave_project_invitations', JSON.stringify(updated));
      } catch (e) {}
    }

    // Permanently delete from Supabase PostgreSQL public.project_invitations table
    const sb = (typeof window !== 'undefined' && window.supabaseClient) || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
    if (sb && sb.from) {
      try {
        await sb.from('project_invitations').delete().eq('id', invitationId);
      } catch (err) {
        console.warn("Supabase delete invitation notice:", err.message);
      }
    }

    this.notify();
    return true;
  }

  async deleteAllPendingInvitations(projectId = null) {
    if (!this.data.projectInvitations) this.data.projectInvitations = [];
    
    // Filter out unaccepted invitations
    const toDelete = this.data.projectInvitations.filter(i => 
      (i.status === 'PENDING' || i.status === 'EXPIRED') &&
      (!projectId || i.projectId === projectId || i.project_id === projectId)
    );

    const deleteIds = toDelete.map(i => i.id);
    this.data.projectInvitations = this.data.projectInvitations.filter(i => !deleteIds.includes(i.id));
    this.saveState();

    // Delete from Supabase
    const sb = (typeof window !== 'undefined' && window.supabaseClient) || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
    if (sb && sb.from && deleteIds.length > 0) {
      try {
        await sb.from('project_invitations').delete().in('id', deleteIds);
      } catch (err) {
        console.warn("Supabase batch delete invitations notice:", err.message);
      }
    }

    this.notify();
    return deleteIds.length;
  }

  async validateProjectInvitationToken(rawToken) {
    if (!rawToken) return { valid: false, error: "Missing invitation token in link." };

    // Clean and normalize token
    let token = String(rawToken).trim();
    if (token.includes("token=")) {
      token = token.split("token=")[1].split("&")[0].split("#")[0];
    }
    token = decodeURIComponent(token).replace(/[#?&/]/g, "").trim();

    if (!this.data.projectInvitations) this.data.projectInvitations = [];
    let inv = this.data.projectInvitations.find(i => i.token === token || i.id === token);

    // Check localStorage fallback for cross-tab or cross-session persistence
    if (!inv && typeof localStorage !== 'undefined') {
      try {
        const storedInvs = JSON.parse(localStorage.getItem('pulsewave_project_invitations') || '[]');
        inv = storedInvs.find(i => i.token === token || i.id === token);
        if (inv && !this.data.projectInvitations.some(i => i.id === inv.id)) {
          this.data.projectInvitations.push(inv);
        }
      } catch (e) {}
    }

    // If not in local cache, query Supabase cloud tables
    const sb = (typeof window !== 'undefined' && window.supabaseClient) || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
    if (!inv && sb && sb.from) {
      try {
        const { data, error } = await sb.from('project_invitations').select('*').eq('token', token).maybeSingle();
        if (!error && data) {
          inv = {
            id: data.id,
            projectId: data.project_id,
            project_id: data.project_id,
            workspaceId: data.workspace_id,
            workspace_id: data.workspace_id,
            scope: data.scope || (data.project_id ? 'PROJECT' : 'SPACE'),
            invitedEmail: data.invited_email,
            invited_email: data.invited_email,
            role: data.role,
            token: data.token,
            status: data.status,
            expiresAt: data.expires_at,
            expires_at: data.expires_at
          };
          this.data.projectInvitations.push(inv);
        }
      } catch (e) {
        console.warn("Supabase project_invitations token lookup notice:", e);
      }
    }

    // Fallback: check workspace_invitations table
    if (!inv && sb && sb.from) {
      try {
        const { data, error } = await sb.from('workspace_invitations').select('*').eq('token', token).maybeSingle();
        if (!error && data) {
          inv = {
            id: data.id,
            workspaceId: data.workspace_id,
            workspace_id: data.workspace_id,
            scope: 'SPACE',
            invitedEmail: data.email || data.invited_email,
            invited_email: data.email || data.invited_email,
            role: data.role || "QA",
            token: data.token,
            status: data.status || "PENDING",
            expiresAt: data.expires_at,
            expires_at: data.expires_at
          };
        }
      } catch (e) {}
    }

    // Fallback: If logged in or email is known, check pending invitations for that email
    const currentUser = this.getActiveUser();
    if (!inv && currentUser && currentUser.email) {
      const userEmail = currentUser.email.toLowerCase().trim();
      inv = this.data.projectInvitations.find(i => (i.invitedEmail || i.invited_email || "").toLowerCase().trim() === userEmail && i.status === 'PENDING');
    }

    if (!inv) return { valid: false, error: "Invitation not found or invalid link." };
    if (inv.status !== 'PENDING') return { valid: false, error: `This invitation has already been ${inv.status.toLowerCase()}.` };
    if (inv.expiresAt && new Date(inv.expiresAt || inv.expires_at) < new Date()) {
      inv.status = 'EXPIRED';
      return { valid: false, error: "This invitation has expired. Please ask the project manager to resend." };
    }

    let project = (inv.projectId || inv.project_id) ? this.getProjectById(inv.projectId || inv.project_id) : null;
    let workspace = this.getWorkspaceById(inv.workspaceId || inv.workspace_id);

    // If project or workspace not loaded locally, fetch from Supabase
    if (!project && (inv.projectId || inv.project_id) && sb && sb.from) {
      try {
        const { data: prjData } = await sb.from('projects').select('*').eq('id', inv.projectId || inv.project_id).maybeSingle();
        if (prjData) {
          project = {
            id: prjData.id,
            name: prjData.name,
            key: prjData.key,
            workspace_id: prjData.workspace_id
          };
          if (!this.data.projects) this.data.projects = [];
          this.data.projects.push(project);
        }
      } catch (e) {}
    }

    if (!workspace && (inv.workspaceId || inv.workspace_id) && sb && sb.from) {
      try {
        const { data: wsData } = await sb.from('spaces').select('*').eq('id', inv.workspaceId || inv.workspace_id).maybeSingle();
        if (wsData) {
          workspace = {
            id: wsData.id,
            name: wsData.name,
            slug: wsData.slug
          };
          if (!this.data.workspaces) this.data.workspaces = [];
          this.data.workspaces.push(workspace);
        }
      } catch (e) {}
    }

    project = project || ((inv.projectId || inv.project_id) ? { id: inv.projectId || inv.project_id, name: "Project Workspace", key: "PRJ" } : null);
    workspace = workspace || { id: inv.workspaceId || inv.workspace_id || 'ws_active', name: "Workspace" };

    return { valid: true, invitation: inv, project, workspace };
  }

  async acceptProjectInvitation(token, currentUser = null) {
    const check = await this.validateProjectInvitationToken(token);
    if (!check.valid) throw new Error(check.error);

    const inv = check.invitation;
    const user = currentUser || this.getActiveUser();
    if (!user || !user.email) throw new Error("Please sign in or create an account to accept this invitation.");

    // Validate email matches
    if (user.email.toLowerCase() !== (inv.invitedEmail || inv.invited_email).toLowerCase()) {
      throw new Error(`This invitation was sent to ${inv.invitedEmail || inv.invited_email}. Please sign in with that email.`);
    }

    const wsId = inv.workspaceId || inv.workspace_id;
    const scope = inv.scope || (inv.projectId || inv.project_id ? 'PROJECT' : 'SPACE');
    const role = (inv.role || (scope === 'SPACE' ? 'QA' : 'DEVELOPER')).toUpperCase();

    // 1. If SPACE SCOPE: add user to workspace_members with invited role ('QA' or 'VIEWER')
    if (scope === 'SPACE') {
      if (wsId) {
        await this.addWorkspaceMember(wsId, {
          user_id: user.id,
          name: user.name || (user.email ? user.email.split('@')[0] : 'Member'),
          email: user.email,
          role: role === 'QA' ? 'QA' : (role === 'PM' ? 'PM' : 'VIEWER')
        });
      }
    } else {
      // 2. If PROJECT SCOPE: add user to workspace_members as DEVELOPER / guest, AND add to project_members for the specific project
      const prjId = inv.projectId || inv.project_id;
      if (prjId) {
        await this.addProjectMember({
          projectId: prjId,
          userId: user.id,
          email: user.email,
          role: role === 'DEVELOPER' ? 'DEVELOPER' : (role === 'QA' ? 'QA' : (role === 'PM' ? 'PM' : 'VIEWER')),
          status: 'Active'
        });
      }

      if (wsId) {
        const wsMembers = this.getWorkspaceMembers(wsId);
        if (!wsMembers.some(m => m.user_id === user.id || m.userId === user.id || m.email?.toLowerCase() === user.email.toLowerCase())) {
          await this.addWorkspaceMember(wsId, {
            user_id: user.id,
            name: user.name || (user.email ? user.email.split('@')[0] : 'Developer'),
            email: user.email,
            role: 'DEVELOPER'
          });
        }
      }
    }

    // 3. Set invitation status to ACCEPTED
    inv.status = 'ACCEPTED';
    inv.acceptedAt = new Date().toISOString();
    inv.accepted_at = inv.acceptedAt;
    this.saveState();

    const sb = (typeof window !== 'undefined' && window.supabaseClient) || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
    if (sb && sb.from) {
      try {
        await sb.from('project_invitations').update({
          status: 'ACCEPTED',
          accepted_at: inv.acceptedAt
        }).eq('id', inv.id);
      } catch (err) {
        console.warn("Supabase accept invitation notice:", err.message);
      }
    }

    // 4. Update user active role in store
    user.role = (scope === 'SPACE' ? (role === 'QA' ? 'QA Engineer' : 'Viewer') : (role === 'DEVELOPER' ? 'Developer' : role));
    this.saveState();

    // 5. Automatically switch active context
    if (wsId) this.setActiveWorkspace(wsId);
    if (inv.projectId || inv.project_id) {
      this.setActiveProject(inv.projectId || inv.project_id);
    }

    this.notify();
    return {
      success: true,
      project: check.project,
      workspace: check.workspace,
      role: inv.role,
      scope: inv.scope
    };
  }

  getTeamWorkloadForProject(projectId) {
    const project = this.getProjectById(projectId);
    const users = this.getUsers();
    const issues = this.getIssues(projectId) || [];

    // Filter members for this project
    let memberIds = project && project.members && Array.isArray(project.members) ? project.members : [];
    if (memberIds.length === 0) {
      const set = new Set();
      if (project && project.pmId) set.add(project.pmId);
      issues.forEach(i => {
        if (i.assigneeId || i.assignee_id) set.add(i.assigneeId || i.assignee_id);
        if (i.developerId || i.developer_id) set.add(i.developerId || i.developer_id);
      });
      memberIds = Array.from(set);
    }
    if (memberIds.length === 0 && users.length > 0) {
      memberIds = users.slice(0, 4).map(u => u.id);
    }

    return memberIds.map(uid => {
      const user = this.getUserById(uid);
      const userIssues = issues.filter(i => (i.assigneeId === uid || i.assignee_id === uid || i.developerId === uid || i.developer_id === uid));
      const activeCount = userIssues.filter(i => i.status !== "Done" && i.status !== "Closed").length;
      const completedCount = userIssues.filter(i => i.status === "Done" || i.status === "Closed" || i.qaStatus === "Passed").length;
      const openBugsCount = userIssues.filter(i => i.type === "Bug" && i.status !== "Done" && i.status !== "Closed").length;
      const capacityPct = Math.min(100, Math.round((activeCount / 8) * 100));

      return {
        user,
        totalAssigned: userIssues.length,
        activeCount,
        completedCount,
        openBugsCount,
        capacityPct
      };
    });
  }

  getTestCases(projectId = null) {
    let list = this.data.testCases || [];
    if (projectId) {
      list = list.filter(t => (t.projectId === projectId || t.project_id === projectId));
    }
    return list;
  }

  // ==========================================
  // Sprints Management (Section 2 & 3)
  // ==========================================
  getSprints(projectId = null) {
    let sprints = this.data.sprints || [];
    if (projectId) {
      sprints = sprints.filter(s => (s.projectId === projectId || s.project_id === projectId));
    }
    return sprints;
  }

  getSprintById(sprintId) {
    return (this.data.sprints || []).find(s => s.id === sprintId) || null;
  }

  getActiveSprint(projectId = null) {
    const pId = projectId || this.data.activeProjectId;
    const projectSprints = this.getSprints(pId);
    return projectSprints.find(s => s.status === "active" || s.status === "Active") || projectSprints[0] || null;
  }

  async createSprint(sprintInput) {
    const activeUser = this.getActiveUser();
    const project = sprintInput.projectId ? this.getProjectById(sprintInput.projectId) : this.getActiveProject();
    const id = sprintInput.id || `spr-${Date.now()}`;

    const newSprint = {
      id,
      projectId: project ? project.id : null,
      project_id: project ? project.id : null,
      name: sprintInput.name || sprintInput.title || "New Sprint",
      title: sprintInput.name || sprintInput.title || "New Sprint",
      startDate: sprintInput.startDate || sprintInput.start_date || new Date().toISOString().split("T")[0],
      start_date: sprintInput.startDate || sprintInput.start_date || new Date().toISOString().split("T")[0],
      endDate: sprintInput.endDate || sprintInput.end_date || new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
      end_date: sprintInput.endDate || sprintInput.end_date || new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
      dueDate: sprintInput.endDate || sprintInput.end_date || new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
      goal: sprintInput.goal || "",
      description: sprintInput.description || "",
      status: sprintInput.status || "Active", // 'Active', 'future', 'Completed'
      createdAt: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    if (!this.data.sprints) this.data.sprints = [];
    this.data.sprints.push(newSprint);

    this.saveState();
    this.notify();

    const sb = (typeof window !== 'undefined' && window.supabaseClient) || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
    if (sb && sb.from && newSprint.projectId) {
      try {
        await sb.from('sprints').upsert({
          id: newSprint.id,
          project_id: newSprint.projectId,
          name: newSprint.name,
          goal: newSprint.goal,
          status: newSprint.status,
          start_date: newSprint.startDate,
          end_date: newSprint.endDate
        });
      } catch (err) {
        console.warn("Supabase sprint sync notice:", err.message);
      }
    }

    return newSprint;
  }

  async updateSprint(sprintId, updateData) {
    if (!this.data.sprints) return null;
    const idx = this.data.sprints.findIndex(s => s.id === sprintId);
    if (idx !== -1) {
      this.data.sprints[idx] = { ...this.data.sprints[idx], ...updateData };
      this.saveState();
      this.notify();

      const sb = (typeof window !== 'undefined' && window.supabaseClient) || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
      if (sb && sb.from) {
        try {
          const payload = {};
          if (updateData.name) payload.name = updateData.name;
          if (updateData.goal !== undefined) payload.goal = updateData.goal;
          if (updateData.status) payload.status = updateData.status;
          if (updateData.startDate || updateData.start_date) payload.start_date = updateData.startDate || updateData.start_date;
          if (updateData.endDate || updateData.end_date) payload.end_date = updateData.endDate || updateData.end_date;

          await sb.from('sprints').update(payload).eq('id', sprintId);
        } catch (err) {
          console.warn("Supabase sprint update notice:", err.message);
        }
      }

      return this.data.sprints[idx];
    }
    return null;
  }

  async startSprint(sprintId) {
    const sprint = this.getSprintById(sprintId);
    if (!sprint) return null;

    // Set other active sprints in this project to completed
    if (this.data.sprints) {
      for (const s of this.data.sprints) {
        if ((s.projectId === sprint.projectId || s.project_id === sprint.project_id) && s.status === "Active" && s.id !== sprintId) {
          s.status = "Completed";
        }
      }
    }

    const res = await this.updateSprint(sprintId, { status: "Active" });

    this.addNotification({
      title: `Sprint Started: ${sprint.name}`,
      message: `Sprint "${sprint.name}" is now active with ${sprint.totalPoints || 0} story points.`,
      type: 'sprint',
      projectId: sprint.projectId || sprint.project_id
    });

    return res;
  }

  async completeSprint(sprintId) {
    const sprint = this.getSprintById(sprintId);
    const res = await this.updateSprint(sprintId, { status: "Completed" });
    if (sprint) {
      this.addNotification({
        title: `Sprint Completed: ${sprint.name}`,
        message: `Sprint "${sprint.name}" has been completed.`,
        type: 'sprint',
        projectId: sprint.projectId || sprint.project_id
      });
    }
    return res;
  }

  moveIssueToSprint(issueId, sprintId) {
    const issue = this.getIssueById(issueId);
    if (!issue) return;

    const oldSprintId = issue.sprintId;
    issue.sprintId = sprintId; // null means Product Backlog
    issue.updatedAt = new Date().toLocaleString();

    const targetName = sprintId ? (this.getSprintById(sprintId)?.name || "Sprint") : "Product Backlog";
    const activeUser = this.getActiveUser();

    this.addActivity({
      issueKey: issue.key,
      user: activeUser.name,
      action: `Moved ${issue.key} to ${targetName}`
    });

    this.saveState();
    return issue;
  }

  // ==========================================
  // Issues & Bugs Management (Section 4, 5, 6, 7)
  // ==========================================
  getIssues(projectId = null, sprintId = undefined) {
    let list = this.data.issues || [];
    if (projectId) {
      list = list.filter(i => (i.projectId === projectId || i.project_id === projectId));
    }
    if (sprintId !== undefined && sprintId !== "all" && sprintId !== null) {
      list = list.filter(i => (i.sprintId === sprintId || i.sprint_id === sprintId));
    }
    return list;
  }

  getIssueById(issueId) {
    return (this.data.issues || []).find(i => i.id === issueId || i.key === issueId) || null;
  }

  getIssueByKey(key) {
    return (this.data.issues || []).find(i => i.key === key || i.id === key) || null;
  }

  async createIssue(issueInput) {
    const activeUser = this.getActiveUser();
    const project = issueInput.projectId ? this.getProjectById(issueInput.projectId) : this.getActiveProject();
    
    const existingCount = (this.data.issues || []).length + 101;
    const prefix = issueInput.type === "Bug" ? "BUG" : issueInput.type === "Story" ? "STY" : "TSK";
    const key = `${prefix}-${existingCount}`;
    const id = issueInput.id || `iss-${Date.now()}`;

    const newIssue = {
      id,
      key,
      projectId: project ? project.id : null,
      project_id: project ? project.id : null,
      sprintId: issueInput.sprintId !== undefined ? issueInput.sprintId : (this.getActiveSprint(project?.id)?.id || null),
      sprint_id: issueInput.sprintId !== undefined ? issueInput.sprintId : (this.getActiveSprint(project?.id)?.id || null),
      type: issueInput.type || "Bug", // Bug, Task, Story
      title: issueInput.title,
      description: issueInput.description || "",
      priority: issueInput.priority || "Medium", // Critical, High, Medium, Low
      status: issueInput.status || (issueInput.type === "Bug" ? "Open" : "To Do"),
      assigneeId: issueInput.assigneeId || issueInput.developerId || null,
      assignee_id: issueInput.assigneeId || issueInput.developerId || null,
      developerId: issueInput.developerId || issueInput.assigneeId || null,
      developer_id: issueInput.developerId || issueInput.assigneeId || null,
      reporterId: issueInput.reporterId || (activeUser ? activeUser.id : null),
      reporter_id: issueInput.reporterId || (activeUser ? activeUser.id : null),
      qaId: issueInput.qaId || null,
      storyPoints: Number(issueInput.storyPoints || issueInput.story_points || 0),
      story_points: Number(issueInput.storyPoints || issueInput.story_points || 0),
      labels: Array.isArray(issueInput.labels) ? issueInput.labels : (issueInput.labels ? issueInput.labels.split(",").map(l => l.trim()) : []),
      environment: issueInput.environment || "Staging",
      buildVersion: issueInput.buildVersion || "v2.4.1",
      releaseVersion: issueInput.releaseVersion || "v2.4.1",
      browser: issueInput.browser || "Chrome 151",
      device: issueInput.device || "Windows Desktop",
      dueDate: issueInput.dueDate || "",
      // QA Verification & Quality Gate fields
      qaStatus: issueInput.qaStatus || "Not Tested",
      qa_status: issueInput.qaStatus || "Not Tested",
      qaNotes: issueInput.qaNotes || "",
      qaEvidence: issueInput.qaEvidence || "",
      reopenCount: 0,
      reopen_count: 0,
      reopenHistory: [],
      // Bug-specific fields
      stepsToReproduce: issueInput.stepsToReproduce || "",
      expectedResult: issueInput.expectedResult || "",
      actualResult: issueInput.actualResult || "",
      acceptanceCriteria: issueInput.acceptanceCriteria || [
        { text: "Unit and component tests pass", done: false },
        { text: "QA Verification executed on Staging", done: false }
      ],
      linkedIssues: issueInput.linkedIssues || [],
      activityTimeline: [
        { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), user: activeUser ? activeUser.name : "User", action: `Created ${issueInput.type || 'Issue'} ${key}` }
      ],
      comments: [],
      createdAt: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (!this.data.issues) this.data.issues = [];
    this.data.issues.unshift(newIssue);

    this.addActivity({
      issueKey: newIssue.key,
      issueId: newIssue.id,
      projectId: newIssue.projectId,
      user: activeUser ? activeUser.name : "Team Member",
      action: `Created ${newIssue.type} ${newIssue.key}: "${newIssue.title}"`,
      type: "issue_created",
      timestamp: new Date().toISOString()
    });

    // Real-time notification if assigned to a developer or team member
    const assignedDevId = newIssue.developerId || newIssue.assigneeId;
    if (assignedDevId) {
      const devUser = this.getUserById(assignedDevId);
      this.addNotification({
        title: `Task Assigned: ${newIssue.key}`,
        message: `${activeUser ? activeUser.name : 'Team Lead'} assigned ${newIssue.type || 'task'} "${newIssue.title}" to ${devUser ? devUser.name : 'you'}.`,
        type: 'assignment',
        issueKey: newIssue.key,
        issueId: newIssue.id,
        projectId: newIssue.projectId,
        recipientId: assignedDevId,
        recipientEmail: devUser ? devUser.email : null
      });
    }

    this.saveState();
    this.notify();

    // Persist to Supabase public.issues
    const sb = (typeof window !== 'undefined' && window.supabaseClient) || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
    if (sb && sb.from && newIssue.projectId) {
      try {
        await sb.from('issues').upsert({
          id: newIssue.id,
          project_id: newIssue.projectId,
          key: newIssue.key,
          title: newIssue.title,
          description: newIssue.description,
          type: newIssue.type,
          status: newIssue.status,
          priority: newIssue.priority,
          qa_status: newIssue.qaStatus,
          assignee_id: newIssue.assigneeId,
          reporter_id: newIssue.reporterId,
          developer_id: newIssue.developerId,
          story_points: newIssue.storyPoints,
          sprint_id: newIssue.sprintId,
          environment: newIssue.environment,
          release_version: newIssue.releaseVersion,
          build_version: newIssue.buildVersion,
          reopen_count: newIssue.reopenCount
        });
      } catch (err) {
        console.warn("Supabase issue insert notice:", err.message);
      }
    }

    return newIssue;
  }

  async updateIssue(issueId, updateData) {
    const issue = this.getIssueById(issueId);
    if (!issue) return null;

    const activeUser = this.getActiveUser();
    const oldDevId = issue.developerId || issue.assigneeId;
    const newDevId = updateData.developerId || updateData.assigneeId;
    const oldQaId = issue.qaId;
    const newQaId = updateData.qaId;

    Object.assign(issue, updateData, {
      updatedAt: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    this.saveState();
    this.notify();

    // 1. Real-time notification: Task Assignment to Developer
    if (newDevId && newDevId !== oldDevId) {
      const devUser = this.getUserById(newDevId);
      this.addNotification({
        title: `Task Assigned: ${issue.key}`,
        message: `${activeUser ? activeUser.name : 'Team Lead'} assigned ${issue.type || 'task'} "${issue.title}" to ${devUser ? devUser.name : 'you'}.`,
        type: 'assignment',
        issueKey: issue.key,
        issueId: issue.id,
        projectId: issue.projectId || issue.project_id,
        recipientId: newDevId,
        recipientEmail: devUser ? devUser.email : null
      });
    }

    // 2. Real-time notification: QA Assignment
    if (newQaId && newQaId !== oldQaId) {
      const qaUser = this.getUserById(newQaId);
      this.addNotification({
        title: `QA Assigned: ${issue.key}`,
        message: `${activeUser ? activeUser.name : 'Team Lead'} assigned ${issue.type || 'ticket'} "${issue.title}" to QA ${qaUser ? qaUser.name : 'you'}.`,
        type: 'qa',
        issueKey: issue.key,
        issueId: issue.id,
        projectId: issue.projectId || issue.project_id,
        recipientId: newQaId,
        recipientEmail: qaUser ? qaUser.email : null
      });
    }

    const sb = (typeof window !== 'undefined' && window.supabaseClient) || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
    if (sb && sb.from) {
      try {
        const payload = { updated_at: new Date().toISOString() };
        if (updateData.title !== undefined) payload.title = updateData.title;
        if (updateData.description !== undefined) payload.description = updateData.description;
        if (updateData.type !== undefined) payload.type = updateData.type;
        if (updateData.priority !== undefined) payload.priority = updateData.priority;
        if (updateData.status !== undefined) payload.status = updateData.status;
        if (updateData.qaStatus !== undefined || updateData.qa_status !== undefined) payload.qa_status = updateData.qaStatus || updateData.qa_status;
        if (updateData.assigneeId !== undefined || updateData.assignee_id !== undefined) payload.assignee_id = updateData.assigneeId || updateData.assignee_id;
        if (updateData.sprintId !== undefined || updateData.sprint_id !== undefined) payload.sprint_id = updateData.sprintId || updateData.sprint_id;
        if (updateData.storyPoints !== undefined || updateData.story_points !== undefined) payload.story_points = Number(updateData.storyPoints || updateData.story_points || 0);

        await sb.from('issues').update(payload).eq('id', issue.id);
      } catch (err) {
        console.warn("Supabase issue update notice:", err.message);
      }
    }

    return issue;
  }

  async updateIssueStatus(issueId, newStatus) {
    const issue = this.getIssueById(issueId);
    if (!issue) return null;

    const oldStatus = issue.status;
    if (oldStatus === newStatus) return issue;

    const activeUser = this.getActiveUser();
    issue.status = newStatus;
    issue.updatedAt = new Date().toISOString();
    issue.updated_at = new Date().toISOString();

    if (newStatus === "Ready for QA" || newStatus === "QA" || newStatus === "QA Testing") {
      issue.qaStatus = "Ready for QA";
      issue.qa_status = "Ready for QA";

      // Real-time notification: Ready for QA alert
      this.addNotification({
        title: `Ready for QA: ${issue.key}`,
        message: `[${issue.key}] "${issue.title}" was completed by ${activeUser ? activeUser.name : 'developer'} and submitted for QA verification.`,
        type: 'qa',
        issueKey: issue.key,
        issueId: issue.id,
        projectId: issue.projectId || issue.project_id,
        recipientId: issue.qaId
      });
    } else if (newStatus === "Done" || newStatus === "Closed") {
      issue.qaStatus = "Passed";
      issue.qa_status = "Passed";

      // Real-time notification: Quality Gate Cleared
      this.addNotification({
        title: `Quality Gate Cleared: ${issue.key} ✓`,
        message: `[${issue.key}] "${issue.title}" was verified and marked Done.`,
        type: 'qa',
        issueKey: issue.key,
        issueId: issue.id,
        projectId: issue.projectId || issue.project_id,
        recipientId: issue.developerId || issue.assigneeId
      });
    } else if (newStatus === "Reopened") {
      issue.qaStatus = "Failed";
      issue.qa_status = "Failed";
      issue.reopenCount = (issue.reopenCount || 0) + 1;
      issue.reopen_count = issue.reopenCount;

      // Real-time notification: Defect Reopened
      this.addNotification({
        title: `Defect Reopened: ${issue.key} ✗`,
        message: `[${issue.key}] "${issue.title}" failed QA verification and was reopened for bug fix.`,
        type: 'bug',
        issueKey: issue.key,
        issueId: issue.id,
        projectId: issue.projectId || issue.project_id,
        recipientId: issue.developerId || issue.assigneeId
      });
    }

    this.addActivity({
      issueKey: issue.key,
      issueId: issue.id,
      projectId: issue.projectId,
      user: activeUser ? activeUser.name : "Team Member",
      action: `Moved ${issue.key} status from "${oldStatus}" to "${newStatus}"`,
      type: "status_change",
      timestamp: new Date().toISOString()
    });

    this.saveState();
    this.notify();

    const sb = (typeof window !== 'undefined' && window.supabaseClient) || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
    if (sb && sb.from) {
      try {
        const { error } = await sb.from('issues').update({
          status: newStatus,
          qa_status: issue.qaStatus,
          reopen_count: issue.reopenCount || 0,
          updated_at: new Date().toISOString()
        }).eq('id', issue.id);
        if (error) {
          console.warn("Supabase issue status sync notice:", error.message);
          // Revert if error
          issue.status = oldStatus;
          this.saveState();
          this.notify();
          if (window.app && window.app.toast) {
            window.app.toast("Update Failed", "Unable to update issue status in database.", "error");
          }
        }
      } catch (err) {
        console.warn("Supabase status error:", err.message);
      }
    }

    return issue;
  }

  async verifyIssueQA(issueId, { qaStatus, qaNotes = "", qaEvidence = "" }) {
    const issue = this.getIssueById(issueId);
    if (!issue) return null;

    const activeUser = this.getActiveUser();
    issue.qaStatus = qaStatus;
    issue.qa_status = qaStatus;
    if (qaNotes) issue.qaNotes = qaNotes;
    if (qaEvidence) issue.qaEvidence = qaEvidence;
    issue.updatedAt = new Date().toISOString();
    issue.updated_at = new Date().toISOString();

    if (qaStatus === "Passed") {
      issue.status = issue.type === "Bug" ? "Closed" : "Done";
      this.addNotification({
        title: `Quality Gate Cleared: ${issue.key} ✓`,
        message: `[${issue.key}] "${issue.title}" QA verification PASSED by ${activeUser ? activeUser.name : 'QA Engineer'}.`,
        type: 'qa',
        issueKey: issue.key,
        issueId: issue.id,
        projectId: issue.projectId || issue.project_id,
        recipientId: issue.developerId || issue.assigneeId
      });
    } else if (qaStatus === "Failed") {
      issue.reopenCount = (issue.reopenCount || 0) + 1;
      issue.reopen_count = issue.reopenCount;
      issue.status = "Reopened";
      this.addNotification({
        title: `Defect Reopened: ${issue.key} ✗`,
        message: `[${issue.key}] "${issue.title}" failed QA verification${qaNotes ? ': ' + qaNotes : ''} and was reopened for bug fix.`,
        type: 'bug',
        issueKey: issue.key,
        issueId: issue.id,
        projectId: issue.projectId || issue.project_id,
        recipientId: issue.developerId || issue.assigneeId
      });
    }

    this.saveState();
    this.notify();

    const sb = (typeof window !== 'undefined' && window.supabaseClient) || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
    if (sb && sb.from) {
      try {
        await sb.from('issues').update({
          qa_status: qaStatus,
          status: issue.status,
          reopen_count: issue.reopenCount || 0,
          updated_at: new Date().toISOString()
        }).eq('id', issue.id);
      } catch (err) {
        console.warn("Supabase QA update notice:", err.message);
      }
    }

    return issue;
  }

  reopenBug(issueId, reason = "") {
    return this.verifyIssueQA(issueId, { qaStatus: "Failed", qaNotes: reason });
  }

  getQualityGate(issue) {
    if (!issue) return { isPassed: false, isRequired: true, label: "Verification Required", status: "pending" };
    
    if (issue.qaStatus === "Passed" || issue.status === "Done" || issue.status === "Closed") {
      return {
        isPassed: true,
        isRequired: false,
        label: "QA Verified ✓",
        status: "verified",
        developerStatus: "Fixed",
        qaStatus: "Passed",
        finalStatus: "QA VERIFIED ✓"
      };
    }

    if (issue.qaStatus === "Failed" || issue.status === "Reopened") {
      return {
        isPassed: false,
        isRequired: true,
        label: "QA Failed ✕",
        status: "failed",
        developerStatus: "Fix Required",
        qaStatus: "Failed",
        finalStatus: "REOPENED"
      };
    }

    if (issue.status === "Ready for QA" || issue.status === "QA Testing" || issue.qaStatus === "Ready for QA" || issue.qaStatus === "Testing") {
      return {
        isPassed: false,
        isRequired: true,
        label: "QA Verification Required ⚠",
        status: "testing",
        developerStatus: "Fixed",
        qaStatus: issue.qaStatus || "Testing",
        finalStatus: "AWAITING QA VERIFICATION"
      };
    }

    return {
      isPassed: false,
      isRequired: true,
      label: "In Development ⏳",
      status: "in-dev",
      developerStatus: issue.status,
      qaStatus: "Not Tested",
      finalStatus: "DEVELOPMENT IN PROGRESS"
    };
  }

  // ==========================================
  // QA Queue Stats (Section 15 & 16)
  // ==========================================
  getQAQueueStats(projectId = null) {
    const issues = this.getIssues(projectId);
    return {
      readyForQa: issues.filter(i => i.status === "Ready for QA" || i.qaStatus === "Ready for QA").length,
      testing: issues.filter(i => i.status === "QA Testing" || i.qaStatus === "Testing").length,
      failed: issues.filter(i => i.qaStatus === "Failed" || i.status === "Reopened").length,
      blocked: issues.filter(i => i.qaStatus === "Blocked").length,
      retesting: issues.filter(i => i.qaStatus === "Retesting" || (i.reopenCount > 0 && (i.status === "Ready for QA" || i.status === "QA Testing"))).length,
      passed: issues.filter(i => i.qaStatus === "Passed" || i.status === "Done" || i.status === "Closed").length
    };
  }

  // ==========================================
  // Team Workload (Section 17)
  // ==========================================
  getUserName(userId) {
    const user = this.getUserById(userId);
    return user ? user.name : "Unassigned";
  }

  getTeamWorkload(projectId = null) {
    const issues = this.getIssues(projectId);
    const users = this.getUsers();

    const devs = users.filter(u => u.role.includes("Dev") || u.role.includes("Developer") || u.role.includes("Engineer") || u.id.startsWith("u-dev")).map(dev => {
      const devIssues = issues.filter(i => (i.assigneeId === dev.id || i.developerId === dev.id));
      const activeIssues = devIssues.filter(i => i.status !== "Done" && i.status !== "Closed");
      const inDev = devIssues.filter(i => i.status === "In Progress" || i.status === "In Development").length;
      const totalSP = devIssues.reduce((sum, i) => sum + (i.storyPoints || (i.priority === 'Critical' ? 8 : i.priority === 'High' ? 5 : 3)), 0);
      const capacityPct = Math.min(100, Math.round((activeIssues.length / 5) * 100)) || 25;
      return { user: dev, inDev: activeIssues.length, totalSP, capacityPct };
    });

    const qas = users.filter(u => u.role.includes("QA") || u.role.includes("SDET") || u.id.startsWith("u-qa")).map(qa => {
      const pendingQA = issues.filter(i => (i.status === "Ready for QA" || i.status === "QA Testing" || i.qaStatus === "Ready for QA" || i.qaStatus === "Testing") && (i.qaId === qa.id || !i.qaId)).length;
      const verified = issues.filter(i => (i.qaStatus === "Passed" || i.status === "Done" || i.status === "Closed") && (i.qaId === qa.id || !i.qaId)).length;
      const queuePct = Math.min(100, Math.round((pendingQA / Math.max(1, pendingQA + verified)) * 100)) || 35;
      return { user: qa, pendingQA, verified, queuePct };
    });

    const all = users.map(user => {
      const assignedIssues = issues.filter(i => i.assigneeId === user.id || i.developerId === user.id);
      const activeIssues = assignedIssues.filter(i => i.status !== "Done" && i.status !== "Closed");
      const qaItems = issues.filter(i => i.qaId === user.id && (i.status === "Ready for QA" || i.status === "QA Testing" || i.qaStatus === "Testing"));
      const openBugs = activeIssues.filter(i => i.type === "Bug");

      return {
        user,
        activeCount: activeIssues.length,
        qaCount: qaItems.length,
        openBugsCount: openBugs.length,
        totalAssigned: assignedIssues.length,
        capacityPct: Math.min(100, Math.round(((activeIssues.length + qaItems.length) / 8) * 100)) || 20
      };
    }).filter(w => w.activeCount > 0 || w.qaCount > 0);

    return { devs, qas, all };
  }

  getTeamWorkloadForProject(projectId = null) {
    const project = projectId ? this.getProjectById(projectId) : this.getActiveProject();
    const members = project && project.members ? project.members.map(mId => this.getUserById(mId)) : this.getUsers();
    const issues = this.getIssues(projectId);

    return members.map(user => {
      const assignedIssues = issues.filter(i => i.assigneeId === user.id || i.developerId === user.id || i.qaId === user.id);
      const activeIssues = assignedIssues.filter(i => i.status !== "Done" && i.status !== "Closed");
      const qaItems = issues.filter(i => i.qaId === user.id && (i.status === "Ready for QA" || i.status === "QA Testing" || i.qaStatus === "Testing"));
      const openBugs = activeIssues.filter(i => i.type === "Bug" && i.status !== "Done" && i.status !== "Closed");

      return {
        user,
        activeCount: activeIssues.length,
        qaCount: qaItems.length,
        openBugsCount: openBugs.length,
        totalAssigned: assignedIssues.length,
        capacityPct: Math.min(100, Math.round(((activeIssues.length + qaItems.length) / 6) * 100)) || 25
      };
    });
  }

  // =========================================================================
  // PULSEWAVE V2 — RELEASES & INTELLIGENT RELEASE RISK ENGINE (Section 18)
  // =========================================================================

  getReleases(projectId = null) {
    const pId = projectId || this.data.activeProjectId;
    if (!this.data.releases) this.data.releases = [];
    
    let list = this.data.releases;
    if (pId) {
      list = list.filter(r => r.projectId === pId || r.project_id === pId);
    }

    // Enrich releases with latest assessment snapshot & decision
    return list.map(r => {
      const latestAssessment = this.getLatestReleaseAssessment(r.id);
      const decisions = this.getReleaseDecisions(r.id);
      const latestDecision = decisions.length > 0 ? decisions[0] : null;
      return {
        ...r,
        latestAssessment: latestAssessment || null,
        score: latestAssessment ? latestAssessment.score : (r.score !== undefined ? r.score : null),
        qualityStatus: latestAssessment ? latestAssessment.status : (r.qualityStatus || "NO_DATA"),
        latestDecision
      };
    });
  }

  getReleaseById(releaseId) {
    if (!releaseId) return null;
    if (!this.data.releases) this.data.releases = [];
    const r = this.data.releases.find(rel => rel.id === releaseId);
    if (!r) return null;

    const latestAssessment = this.getLatestReleaseAssessment(r.id);
    const assessments = this.getReleaseQualityAssessments(r.id);
    const riskFactors = latestAssessment ? this.getReleaseRiskFactors(latestAssessment.id) : [];
    const decisions = this.getReleaseDecisions(r.id);
    const linkedIssues = this.getReleaseLinkedIssues(r.id);

    return {
      ...r,
      latestAssessment: latestAssessment || null,
      assessments,
      riskFactors,
      decisions,
      linkedIssues,
      score: latestAssessment ? latestAssessment.score : (r.score !== undefined ? r.score : null),
      qualityStatus: latestAssessment ? latestAssessment.status : (r.qualityStatus || "NO_DATA")
    };
  }

  async createRelease(releaseInput) {
    const activeUser = this.getActiveUser();
    const projectId = releaseInput.projectId || releaseInput.project_id || this.data.activeProjectId;
    if (!projectId) throw new Error("Project ID is required to create a release.");

    const project = this.getProjectById(projectId);
    if (!project) throw new Error("Project not found.");

    const workspaceId = project.workspace_id || project.workspaceId || this.data.activeWorkspaceId;
    if (!workspaceId) throw new Error("Workspace ID is required to create a release.");

    if (!this.canManageReleases(projectId, activeUser ? activeUser.id : null)) {
      throw new Error("Permission Denied: Only PMs and QA Engineers can create releases.");
    }

    const releaseName = (releaseInput.name || "").trim();
    if (!releaseName) throw new Error("Release name is required.");

    const releaseId = releaseInput.id || `rel-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date().toISOString();

    const newRelease = {
      id: releaseId,
      project_id: projectId,
      projectId: projectId,
      workspace_id: workspaceId,
      workspaceId: workspaceId,
      name: releaseName,
      version: releaseInput.version ? releaseInput.version.trim() : `v1.0.0`,
      description: releaseInput.description || "",
      status: releaseInput.status || "PLANNED",
      release_date: releaseInput.release_date || releaseInput.releaseDate || null,
      releaseDate: releaseInput.release_date || releaseInput.releaseDate || null,
      created_by: activeUser ? activeUser.id : null,
      created_at: now,
      updated_at: now
    };

    if (!this.data.releases) this.data.releases = [];
    this.data.releases.unshift(newRelease);

    // Link initial issue scope if provided
    if (Array.isArray(releaseInput.linkedIssueIds) && releaseInput.linkedIssueIds.length > 0) {
      await this.linkIssuesToRelease(releaseId, releaseInput.linkedIssueIds);
    }

    // Run initial deterministic quality assessment
    await this.runReleaseQualityAssessment(releaseId);

    this.addActivity({
      projectId,
      user: activeUser ? activeUser.name : "Team Member",
      action: `Created Release "${newRelease.name}" (${newRelease.version})`,
      type: "release_created"
    });

    this.addNotification({
      title: `Release Created: ${newRelease.name}`,
      message: `Release ${newRelease.name} (${newRelease.version}) was created in ${project.name}.`,
      type: "release",
      projectId: projectId
    });

    this.saveState();
    this.notify();

    // Sync with Supabase
    const sb = (typeof window !== 'undefined' && window.supabaseClient) || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
    if (sb && sb.from) {
      (async () => {
        try {
          await sb.from('releases').upsert({
            id: newRelease.id,
            project_id: newRelease.project_id,
            workspace_id: newRelease.workspace_id,
            name: newRelease.name,
            version: newRelease.version,
            description: newRelease.description,
            status: newRelease.status,
            release_date: newRelease.release_date,
            created_by: newRelease.created_by,
            created_at: newRelease.created_at,
            updated_at: newRelease.updated_at
          });
        } catch (err) {
          console.warn("Supabase release create notice:", err.message);
        }
      })();
    }

    return newRelease;
  }

  async updateRelease(releaseId, updateData) {
    if (!releaseId) throw new Error("Release ID is required.");
    const release = this.data.releases ? this.data.releases.find(r => r.id === releaseId) : null;
    if (!release) throw new Error("Release not found.");

    const activeUser = this.getActiveUser();
    const projectId = release.projectId || release.project_id;

    if (!this.canManageReleases(projectId, activeUser ? activeUser.id : null)) {
      throw new Error("Permission Denied: You are not authorized to update this release.");
    }

    const now = new Date().toISOString();
    if (updateData.name !== undefined) release.name = String(updateData.name).trim();
    if (updateData.version !== undefined) release.version = String(updateData.version).trim();
    if (updateData.description !== undefined) release.description = updateData.description;
    if (updateData.status !== undefined) release.status = updateData.status;
    if (updateData.release_date !== undefined || updateData.releaseDate !== undefined) {
      release.release_date = updateData.release_date || updateData.releaseDate;
      release.releaseDate = release.release_date;
    }
    release.updated_at = now;

    if (Array.isArray(updateData.linkedIssueIds)) {
      await this.linkIssuesToRelease(releaseId, updateData.linkedIssueIds);
    }

    this.saveState();
    this.notify();

    // Sync to Supabase
    const sb = (typeof window !== 'undefined' && window.supabaseClient) || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
    if (sb && sb.from) {
      (async () => {
        try {
          await sb.from('releases').update({
            name: release.name,
            version: release.version,
            description: release.description,
            status: release.status,
            release_date: release.release_date,
            updated_at: release.updated_at
          }).eq('id', releaseId);
        } catch (err) {
          console.warn("Supabase release update notice:", err.message);
        }
      })();
    }

    return release;
  }

  async deleteRelease(releaseId) {
    if (!releaseId) return false;
    const release = this.data.releases ? this.data.releases.find(r => r.id === releaseId) : null;
    if (!release) return false;

    const activeUser = this.getActiveUser();
    const projectId = release.projectId || release.project_id;
    if (!this.canManageProjectTeam(projectId, activeUser ? activeUser.id : null)) {
      throw new Error("Permission Denied: Only a Project Manager can delete releases.");
    }

    // Purge local records
    this.data.releases = this.data.releases.filter(r => r.id !== releaseId);
    if (this.data.releaseQualityAssessments) {
      this.data.releaseQualityAssessments = this.data.releaseQualityAssessments.filter(a => a.release_id !== releaseId && a.releaseId !== releaseId);
    }
    if (this.data.releaseRiskFactors) {
      this.data.releaseRiskFactors = this.data.releaseRiskFactors.filter(rf => rf.release_id !== releaseId && rf.releaseId !== releaseId);
    }
    if (this.data.releaseDecisions) {
      this.data.releaseDecisions = this.data.releaseDecisions.filter(d => d.release_id !== releaseId && d.releaseId !== releaseId);
    }
    if (this.data.releaseIssueLinks) {
      this.data.releaseIssueLinks = this.data.releaseIssueLinks.filter(l => l.release_id !== releaseId && l.releaseId !== releaseId);
    }

    this.saveState();
    this.notify();

    // Sync to Supabase
    const sb = (typeof window !== 'undefined' && window.supabaseClient) || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
    if (sb && sb.from) {
      (async () => {
        try {
          await sb.from('releases').delete().eq('id', releaseId);
        } catch (err) {
          console.warn("Supabase release delete notice:", err.message);
        }
      })();
    }

    return true;
  }

  getProjectQualitySettings(projectId) {
    if (!projectId) return ReleaseQualityService.getDefaultSettings("default");
    if (!this.data.projectQualitySettings) this.data.projectQualitySettings = [];
    const settings = this.data.projectQualitySettings.find(s => s.project_id === projectId || s.projectId === projectId);
    return settings || ReleaseQualityService.getDefaultSettings(projectId);
  }

  async updateProjectQualitySettings(projectId, settingsInput) {
    if (!projectId) throw new Error("Project ID is required.");
    const activeUser = this.getActiveUser();

    if (!this.canConfigureQualitySettings(projectId, activeUser ? activeUser.id : null)) {
      throw new Error("Permission Denied: Only a Project Manager can modify Quality Gate policies.");
    }

    if (!this.data.projectQualitySettings) this.data.projectQualitySettings = [];
    let existing = this.data.projectQualitySettings.find(s => s.project_id === projectId || s.projectId === projectId);

    const now = new Date().toISOString();
    const updated = {
      id: existing ? existing.id : `pqs-${projectId}`,
      project_id: projectId,
      projectId: projectId,
      critical_bug_blocks_release: settingsInput.critical_bug_blocks_release !== undefined ? Boolean(settingsInput.critical_bug_blocks_release) : true,
      high_bug_threshold: Number(settingsInput.high_bug_threshold !== undefined ? settingsInput.high_bug_threshold : 0),
      minimum_test_pass_rate: Number(settingsInput.minimum_test_pass_rate !== undefined ? settingsInput.minimum_test_pass_rate : 95.0),
      minimum_regression_pass_rate: Number(settingsInput.minimum_regression_pass_rate !== undefined ? settingsInput.minimum_regression_pass_rate : 90.0),
      minimum_coverage: Number(settingsInput.minimum_coverage !== undefined ? settingsInput.minimum_coverage : 80.0),
      maximum_blocked_tests: Number(settingsInput.maximum_blocked_tests !== undefined ? settingsInput.maximum_blocked_tests : 0),
      maximum_open_critical_bugs: Number(settingsInput.maximum_open_critical_bugs !== undefined ? settingsInput.maximum_open_critical_bugs : 0),
      allow_release_override: settingsInput.allow_release_override !== undefined ? Boolean(settingsInput.allow_release_override) : true,
      updated_by: activeUser ? activeUser.id : null,
      updated_at: now
    };

    if (existing) {
      Object.assign(existing, updated);
    } else {
      this.data.projectQualitySettings.push(updated);
    }

    this.saveState();
    this.notify();

    // Sync to Supabase
    const sb = (typeof window !== 'undefined' && window.supabaseClient) || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
    if (sb && sb.from) {
      (async () => {
        try {
          await sb.from('project_quality_settings').upsert(updated);
        } catch (err) {
          console.warn("Supabase quality settings sync notice:", err.message);
        }
      })();
    }

    return updated;
  }

  async runReleaseQualityAssessment(releaseId) {
    if (!releaseId) throw new Error("Release ID is required.");
    const release = this.data.releases ? this.data.releases.find(r => r.id === releaseId) : null;
    if (!release) throw new Error("Release not found.");

    const activeUser = this.getActiveUser();
    const projectId = release.projectId || release.project_id;
    const project = this.getProjectById(projectId);

    const issues = this.getIssues(projectId);
    const testCases = (this.data.testCases || []).filter(tc => (tc.projectId === projectId || tc.project_id === projectId));
    const testExecutions = (this.data.testExecutions || []).filter(te => (te.projectId === projectId || te.project_id === projectId));
    const settings = this.getProjectQualitySettings(projectId);

    // Get previous assessment for trend comparison
    const previousAssessments = this.getReleaseQualityAssessments(releaseId);
    const previousAssessment = previousAssessments.length > 0 ? previousAssessments[previousAssessments.length - 1] : null;

    // Execute deterministic rule-based assessment
    const service = (typeof window !== 'undefined' && window.ReleaseQualityService) || (typeof ReleaseQualityService !== 'undefined' ? ReleaseQualityService : require('./services/releaseQualityService'));
    const { assessment, riskFactors } = service.evaluateReleaseQuality({
      release,
      project,
      issues,
      testCases,
      testExecutions,
      settings,
      previousAssessment,
      userId: activeUser ? activeUser.id : null
    });

    if (!this.data.releaseQualityAssessments) this.data.releaseQualityAssessments = [];
    if (!this.data.releaseRiskFactors) this.data.releaseRiskFactors = [];

    this.data.releaseQualityAssessments.push(assessment);
    riskFactors.forEach(rf => {
      rf.assessment_id = assessment.id;
      rf.assessmentId = assessment.id;
      this.data.releaseRiskFactors.push(rf);
    });

    // Update release cache
    release.score = assessment.score;
    release.qualityStatus = assessment.status;
    release.updated_at = new Date().toISOString();

    // Trigger toast notification if status changed to NOT_READY or READY
    if (assessment.status === "NOT_READY" && assessment.blocking_risk_count > 0) {
      this.addNotification({
        title: `Release Blocked: ${release.name} ⛔`,
        message: `${release.name} (${release.version}) has ${assessment.blocking_risk_count} release-blocking defect(s).`,
        type: "bug",
        projectId
      });
    }

    this.saveState();
    this.notify();

    // Sync assessment snapshot to Supabase
    const sb = (typeof window !== 'undefined' && window.supabaseClient) || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
    if (sb && sb.from) {
      (async () => {
        try {
          await sb.from('release_quality_assessments').insert({
            id: assessment.id,
            release_id: assessment.release_id,
            project_id: assessment.project_id,
            score: assessment.score,
            status: assessment.status,
            calculated_at: assessment.calculated_at,
            calculation_version: assessment.calculation_version,
            blocking_risk_count: assessment.blocking_risk_count,
            critical_risk_count: assessment.critical_risk_count,
            high_risk_count: assessment.high_risk_count,
            medium_risk_count: assessment.medium_risk_count,
            low_risk_count: assessment.low_risk_count,
            data_completeness: assessment.data_completeness,
            summary_metrics: assessment.summary_metrics,
            recommendation: assessment.recommendation
          });

          if (riskFactors.length > 0) {
            await sb.from('release_risk_factors').insert(
              riskFactors.map(rf => ({
                id: rf.id,
                assessment_id: rf.assessment_id,
                release_id: rf.release_id,
                project_id: rf.project_id,
                category: rf.category,
                severity: rf.severity,
                title: rf.title,
                description: rf.description,
                evidence: rf.evidence,
                score_impact: rf.score_impact,
                is_blocking: rf.is_blocking
              }))
            );
          }
        } catch (err) {
          console.warn("Supabase assessment insert notice:", err.message);
        }
      })();
    }

    return { assessment, riskFactors };
  }

  getReleaseQualityAssessments(releaseId) {
    if (!releaseId) return [];
    if (!this.data.releaseQualityAssessments) this.data.releaseQualityAssessments = [];
    return this.data.releaseQualityAssessments
      .filter(a => (a.release_id === releaseId || a.releaseId === releaseId))
      .sort((a, b) => new Date(a.calculated_at || a.calculatedAt) - new Date(b.calculated_at || b.calculatedAt));
  }

  getLatestReleaseAssessment(releaseId) {
    const list = this.getReleaseQualityAssessments(releaseId);
    return list.length > 0 ? list[list.length - 1] : null;
  }

  getReleaseRiskFactors(assessmentId) {
    if (!assessmentId) return [];
    if (!this.data.releaseRiskFactors) this.data.releaseRiskFactors = [];
    return this.data.releaseRiskFactors.filter(rf => rf.assessment_id === assessmentId || rf.assessmentId === assessmentId);
  }

  async recordReleaseDecision(releaseId, decision, reason = "", overrideReason = "") {
    if (!releaseId) throw new Error("Release ID is required.");
    const release = this.data.releases ? this.data.releases.find(r => r.id === releaseId) : null;
    if (!release) throw new Error("Release not found.");

    const activeUser = this.getActiveUser();
    const projectId = release.projectId || release.project_id;

    if (decision === "OVERRIDDEN") {
      if (!this.canOverrideRelease(projectId, activeUser ? activeUser.id : null)) {
        throw new Error("Permission Denied: Release override is not permitted by project policy or user role.");
      }
      if (!overrideReason || !overrideReason.trim()) {
        throw new Error("Override Reason Required: You must specify a clear audit justification for releasing anyway.");
      }
    } else {
      if (!this.canManageReleases(projectId, activeUser ? activeUser.id : null)) {
        throw new Error("Permission Denied: Only PMs and QA Leads can sign off release decisions.");
      }
    }

    const latestAssessment = this.getLatestReleaseAssessment(releaseId);
    const prevGateStatus = latestAssessment ? latestAssessment.status : "NO_DATA";

    const decisionRecord = {
      id: `dec-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      release_id: releaseId,
      releaseId: releaseId,
      project_id: projectId,
      projectId: projectId,
      decision,
      reason: reason || "",
      override_reason: overrideReason || "",
      overrideReason: overrideReason || "",
      previous_gate_status: prevGateStatus,
      previousGateStatus: prevGateStatus,
      decided_by: activeUser ? activeUser.id : "user",
      decidedByName: activeUser ? activeUser.name : "PM",
      created_at: new Date().toISOString()
    };

    if (!this.data.releaseDecisions) this.data.releaseDecisions = [];
    this.data.releaseDecisions.unshift(decisionRecord);

    if (decision === "RELEASED") {
      release.status = "RELEASED";
    } else if (decision === "OVERRIDDEN") {
      release.status = "READY_FOR_REVIEW";
      release.overridden = true;
      release.overrideReason = overrideReason;
    }

    this.addActivity({
      projectId,
      user: activeUser ? activeUser.name : "Team Lead",
      action: `Recorded Release Decision: ${decision}${overrideReason ? ` (Reason: "${overrideReason}")` : ''}`,
      type: "release_decision"
    });

    this.addNotification({
      title: decision === "OVERRIDDEN" ? `Release Overridden: ${release.name} ⚠` : `Release Decision: ${release.name}`,
      message: `${activeUser ? activeUser.name : 'PM'} marked ${release.name} as ${decision}.${overrideReason ? ' Reason: ' + overrideReason : ''}`,
      type: "release",
      projectId
    });

    this.saveState();
    this.notify();

    // Sync to Supabase
    const sb = (typeof window !== 'undefined' && window.supabaseClient) || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
    if (sb && sb.from) {
      (async () => {
        try {
          await sb.from('release_decisions').insert({
            id: decisionRecord.id,
            release_id: decisionRecord.release_id,
            project_id: decisionRecord.project_id,
            decision: decisionRecord.decision,
            reason: decisionRecord.reason,
            override_reason: decisionRecord.override_reason,
            previous_gate_status: decisionRecord.previous_gate_status,
            decided_by: decisionRecord.decided_by
          });
          await sb.from('releases').update({ status: release.status }).eq('id', releaseId);
        } catch (err) {
          console.warn("Supabase release decision insert notice:", err.message);
        }
      })();
    }

    return decisionRecord;
  }

  getReleaseDecisions(releaseId) {
    if (!releaseId) return [];
    if (!this.data.releaseDecisions) this.data.releaseDecisions = [];
    return this.data.releaseDecisions
      .filter(d => d.release_id === releaseId || d.releaseId === releaseId)
      .sort((a, b) => new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt));
  }

  async linkIssuesToRelease(releaseId, issueIds = []) {
    if (!releaseId || !Array.isArray(issueIds)) return [];
    const release = this.data.releases ? this.data.releases.find(r => r.id === releaseId) : null;
    if (!release) return [];

    const projectId = release.projectId || release.project_id;
    if (!this.data.releaseIssueLinks) this.data.releaseIssueLinks = [];

    // Remove existing links for this release
    this.data.releaseIssueLinks = this.data.releaseIssueLinks.filter(l => l.release_id !== releaseId && l.releaseId !== releaseId);

    const newLinks = issueIds.map(issueId => {
      const issue = this.getIssueById(issueId);
      return {
        id: `ril-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        release_id: releaseId,
        releaseId: releaseId,
        project_id: projectId,
        projectId: projectId,
        issue_id: issueId,
        issueId: issueId,
        issue_key: issue ? issue.key : null,
        issueKey: issue ? issue.key : null,
        created_at: new Date().toISOString()
      };
    });

    this.data.releaseIssueLinks.push(...newLinks);
    this.saveState();
    return newLinks;
  }

  getReleaseLinkedIssues(releaseId) {
    if (!releaseId) return [];
    if (!this.data.releaseIssueLinks) this.data.releaseIssueLinks = [];
    const links = this.data.releaseIssueLinks.filter(l => l.release_id === releaseId || l.releaseId === releaseId);
    return links.map(l => this.getIssueById(l.issue_id || l.issueId)).filter(Boolean);
  }

  // ==========================================
  // Comments
  // ==========================================
  addComment(issueId, commentText) {
    const issue = this.getIssueById(issueId);
    if (!issue || !commentText.trim()) return;

    const activeUser = this.getActiveUser();
    if (!issue.comments) issue.comments = [];

    const newComment = {
      id: `comm-${Date.now()}`,
      authorId: activeUser.id,
      text: commentText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    issue.comments.push(newComment);
    issue.updatedAt = new Date().toLocaleString();

    this.addActivity({
      issueKey: issue.key,
      user: activeUser.name,
      action: `Added comment on ${issue.key}: "${commentText.slice(0, 40)}${commentText.length > 40 ? '...' : ''}"`
    });

    // Real-time notification: Comment on Issue
    const targetRecipient = issue.developerId || issue.assigneeId || issue.qaId;
    if (targetRecipient && targetRecipient !== activeUser.id) {
      const recUser = this.getUserById(targetRecipient);
      this.addNotification({
        title: `Comment on ${issue.key}`,
        message: `${activeUser ? activeUser.name : 'Teammate'} commented: "${commentText.slice(0, 45)}${commentText.length > 45 ? '...' : ''}"`,
        type: 'comment',
        issueKey: issue.key,
        issueId: issue.id,
        projectId: issue.projectId || issue.project_id,
        recipientId: targetRecipient,
        recipientEmail: recUser ? recUser.email : null
      });
    }

    this.saveState();
    return newComment;
  }

  // ==========================================
  // Activities & Notifications
  // ==========================================
  formatRelativeTime(isoOrTimestamp) {
    if (!isoOrTimestamp) return "Just now";
    try {
      const date = new Date(isoOrTimestamp);
      if (isNaN(date.getTime())) return String(isoOrTimestamp);
      const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
      if (diffSec < 45) return "Just now";
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
      if (diffSec < 172800) return "Yesterday";
      return `${Math.floor(diffSec / 86400)}d ago`;
    } catch (e) {
      return "Just now";
    }
  }

  getActivities(limit = 20, projectId = null) {
    let list = this.data.activities || [];

    // Synthesize real activities from actual state if list is sparse
    if (list.length < 5) {
      const synthesized = [];
      const projects = this.data.projects || [];
      const issues = this.data.issues || [];
      const sprints = this.data.sprints || [];

      // Sprints
      sprints.forEach(s => {
        const prj = this.getProjectById(s.projectId || s.project_id);
        synthesized.push({
          id: `act_spr_${s.id}`,
          issueKey: prj ? prj.key : "SPR",
          projectId: s.projectId || s.project_id,
          user: this.getActiveUser()?.name || "Project Lead",
          action: `Created new sprint "${s.name}" in ${prj ? prj.name : 'project'}`,
          type: "sprint_created",
          timestamp: s.createdAt || s.created_at || new Date().toISOString()
        });
      });

      // Issues
      issues.forEach(i => {
        const creator = this.getUserById(i.reporterId || i.reporter_id || i.assigneeId);
        synthesized.push({
          id: `act_iss_${i.id}`,
          issueKey: i.key,
          issueId: i.id,
          projectId: i.projectId || i.project_id,
          user: creator?.name || "Team Member",
          action: `Created ${i.type} ${i.key}: "${i.title}"`,
          type: "issue_created",
          timestamp: i.createdAt || i.created_at || new Date().toISOString()
        });
      });

      // Projects
      projects.forEach(p => {
        const pm = this.getUserById(p.pmId);
        synthesized.push({
          id: `act_prj_${p.id}`,
          issueKey: p.key,
          projectId: p.id,
          user: pm?.name || "Project Manager",
          action: `Created project workspace "${p.name}" (${p.key})`,
          type: "project_created",
          timestamp: p.startDate || new Date().toISOString()
        });
      });

      // Merge avoiding duplicates
      const existingIds = new Set(list.map(a => a.id));
      synthesized.forEach(syn => {
        if (!existingIds.has(syn.id)) {
          list.push(syn);
          existingIds.add(syn.id);
        }
      });

      list.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
      this.data.activities = list;
    }

    if (projectId) {
      list = list.filter(a => a.projectId === projectId || (a.issueKey && a.issueKey.startsWith(this.getProjectById(projectId)?.key || "___")));
    }

    return list.slice(0, limit).map(a => ({
      ...a,
      time: a.timestamp ? this.formatRelativeTime(a.timestamp) : (a.time || "Just now")
    }));
  }

  addActivity(act) {
    const activeUser = this.getActiveUser ? this.getActiveUser() : null;
    const newAct = {
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      issueKey: act.issueKey || "",
      issueId: act.issueId || "",
      projectId: act.projectId || "",
      user: act.user || (activeUser ? activeUser.name : "Team Member"),
      userId: act.userId || (activeUser ? activeUser.id : null),
      action: act.action || "",
      type: act.type || "general",
      timestamp: act.timestamp || new Date().toISOString()
    };

    if (!this.data.activities) this.data.activities = [];
    this.data.activities.unshift(newAct);
    if (this.data.activities.length > 100) this.data.activities.pop();
    this.saveState();
  }

  getNotifications(userId = null) {
    if (!this.data.notifications) this.data.notifications = [];
    const activeUser = this.getActiveUser();
    const uid = userId || (activeUser ? activeUser.id : null);
    const uEmail = activeUser && activeUser.email ? activeUser.email.toLowerCase().trim() : null;

    const normRole = (activeUser?.role || '').toUpperCase();
    const isLeadOrAdmin = !userId && (normRole.includes("OWNER") || normRole.includes("PROJECT_MANAGER") || normRole.includes("PM") || normRole.includes("ADMIN") || normRole.includes("LEAD"));

    // If PM/Owner and not asking for a specific userId filter, show complete notifications stream
    if (isLeadOrAdmin || (!uid && !uEmail)) {
      return this.data.notifications;
    }

    return this.data.notifications.filter(n => {
      if (!n.recipientId && !n.recipientEmail) return true; // broadcast
      if (n.recipientId && (n.recipientId === uid || n.recipientId === activeUser?.id)) return true;
      if (n.recipientEmail && uEmail && n.recipientEmail.toLowerCase().trim() === uEmail) return true;
      return false;
    });
  }

  getUnreadNotificationsCount(userId = null) {
    const list = this.getNotifications(userId);
    return list.filter(n => !n.read).length;
  }

  markAllNotificationsRead(userId = null) {
    const list = this.getNotifications(userId);
    list.forEach(n => (n.read = true));
    this.saveState();
    this.notify();
  }

  markNotificationRead(notifId) {
    if (this.data.notifications) {
      const notif = this.data.notifications.find(n => n.id === notifId);
      if (notif) {
        notif.read = true;
        this.saveState();
        this.notify();
      }
    }
  }

  deleteNotification(notifId) {
    if (this.data.notifications) {
      this.data.notifications = this.data.notifications.filter(n => n.id !== notifId);
      this.saveState();
      this.notify();
    }
  }

  clearAllNotifications(userId = null) {
    if (!this.data.notifications) this.data.notifications = [];
    const activeUser = this.getActiveUser();
    const uid = userId || (activeUser ? activeUser.id : null);
    const uEmail = activeUser && activeUser.email ? activeUser.email.toLowerCase().trim() : null;

    const normRole = (activeUser?.role || '').toUpperCase();
    const isLeadOrAdmin = !userId && (normRole.includes("OWNER") || normRole.includes("PROJECT_MANAGER") || normRole.includes("PM") || normRole.includes("ADMIN") || normRole.includes("LEAD"));

    if (isLeadOrAdmin || (!uid && !uEmail)) {
      this.data.notifications = [];
    } else {
      this.data.notifications = this.data.notifications.filter(n => {
        if (!n.recipientId && !n.recipientEmail) return false;
        if (n.recipientId && (n.recipientId === uid || n.recipientId === activeUser?.id)) return false;
        if (n.recipientEmail && uEmail && n.recipientEmail.toLowerCase().trim() === uEmail) return false;
        return true;
      });
    }
    this.saveState();
    this.notify();
  }

  searchAll(query) {
    if (!query || !query.trim()) return { issues: [], projects: [] };
    const q = query.toLowerCase().trim();
    const issues = (this.data.issues || []).filter(i =>
      (i.key && i.key.toLowerCase().includes(q)) ||
      (i.title && i.title.toLowerCase().includes(q)) ||
      (i.description && i.description.toLowerCase().includes(q)) ||
      (i.type && i.type.toLowerCase().includes(q)) ||
      (i.priority && i.priority.toLowerCase().includes(q))
    );
    const projects = (this.data.projects || []).filter(p =>
      (p.key && p.key.toLowerCase().includes(q)) ||
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.description && p.description.toLowerCase().includes(q))
    );
    return { issues, projects };
  }

  addProjectMilestone(projectId, milestone) {
    const project = this.getProjectById(projectId);
    if (!project) return null;
    if (!project.milestones) project.milestones = [];
    const newMilestone = {
      id: `ms-${Date.now()}`,
      title: milestone.title || "New Milestone",
      dueDate: milestone.dueDate || new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
      progress: milestone.progress || 0,
      status: milestone.status || "In Progress",
      goal: milestone.goal || ""
    };
    project.milestones.push(newMilestone);
    this.saveState();
    return newMilestone;
  }

  batchUpdateIssueStatus(issueIds, status) {
    if (!Array.isArray(issueIds)) return;
    issueIds.forEach(id => this.updateIssueStatus(id, status));
    this.saveState();
  }

  // ==========================================
  // Compatibility API Wrappers (For QA & Dev Extensions)
  // ==========================================
  getTickets(projectId = null) {
    return this.getIssues(projectId);
  }

  getTicketById(ticketId) {
    return this.getIssueById(ticketId);
  }

  createTicket(ticketInput) {
    return this.createIssue(ticketInput);
  }

  updateTicketStatus(ticketId, status) {
    return this.updateIssueStatus(ticketId, status);
  }

  addTicketComment(ticketId, text) {
    return this.addComment(ticketId, text);
  }

  toggleTicketAcceptanceCriteria(ticketId, acIndex) {
    const issue = this.getIssueById(ticketId);
    if (issue && issue.acceptanceCriteria && issue.acceptanceCriteria[acIndex] !== undefined) {
      issue.acceptanceCriteria[acIndex].done = !issue.acceptanceCriteria[acIndex].done;
      this.saveState();
    }
  }

  markTicketReadyForQA(ticketId, details = {}) {
    const issue = this.getIssueById(ticketId);
    if (issue) {
      if (details.notes) issue.qaNotes = details.notes;
      return this.updateIssueStatus(ticketId, "Ready for QA");
    }
  }

  getBugs(projectId = null) {
    return this.getIssues(projectId).filter(i => i.type === "Bug");
  }

  getBugById(bugId) {
    return this.getIssueById(bugId);
  }

  createBug(bugInput) {
    return this.createIssue({ ...bugInput, type: "Bug" });
  }

  updateBugStatus(bugId, status) {
    return this.updateIssueStatus(bugId, status);
  }

  addBugComment(bugId, text) {
    return this.addComment(bugId, text);
  }

  getTestSuites(projectId = null) {
    return [
      { id: "ts-1", projectId: projectId || this.data.activeProjectId, name: "Core Authentication & Security", count: 24, passRate: 98 },
      { id: "ts-2", projectId: projectId || this.data.activeProjectId, name: "Checkout & Payment Gateway", count: 42, passRate: 92 },
      { id: "ts-3", projectId: projectId || this.data.activeProjectId, name: "Inventory & Stock Reconciliation", count: 18, passRate: 100 },
      { id: "ts-4", projectId: projectId || this.data.activeProjectId, name: "REST & GraphQL API Regression", count: 35, passRate: 96 }
    ];
  }

  getTestCaseById(id) {
    const cases = this.data.testCases || [];
    return cases.find(c => c.id === id || c.key === id) || null;
  }

  createTestCase(tcInput) {
    return { id: `tc-${Date.now()}`, key: `TC-${Date.now().toString().slice(-3)}`, ...tcInput };
  }

  duplicateTestCase(caseId) {
    const tc = this.getTestCaseById(caseId);
    return { ...tc, id: `tc-${Date.now()}`, key: `TC-DUP` };
  }

  createTestSuite(tsInput) {
    return { id: `ts-${Date.now()}`, ...tsInput };
  }

  getTestRuns(projectId = null) {
    return [
      {
        id: "tr-1",
        name: "Sprint 04 Regression Test Run",
        environment: "Staging",
        status: "Completed",
        totalCases: 64,
        passed: 60,
        failed: 3,
        blocked: 1,
        executedBy: "Arslan Tariq",
        date: "Today, 10:30 AM"
      },
      {
        id: "tr-2",
        name: "Payment Gateway Smoke Test Suite",
        environment: "QA-Sandbox",
        status: "In Progress",
        totalCases: 28,
        passed: 20,
        failed: 1,
        blocked: 0,
        executedBy: "Emma Watson",
        date: "Today, 02:15 PM"
      }
    ];
  }

  getTestRunById(runId) {
    const runs = this.getTestRuns();
    return runs.find(r => r.id === runId) || runs[0];
  }

  createTestRun(input) {
    return { id: `tr-${Date.now()}`, ...input };
  }

  recordTestCaseExecution(runId, caseId, data) {
    const issue = this.data.issues.find(i => `tc-${i.id}` === caseId);
    if (issue) {
      this.verifyIssueQA(issue.id, { qaStatus: data.status, qaNotes: data.notes });
    }
  }

  logBugFromFailedTest(runId, caseId, data) {
    return this.createIssue({
      type: "Bug",
      title: `[Test Run Failure] ${data.title || 'Automated Defect Report'}`,
      description: data.description || `Failed test case execution in ${runId}`,
      priority: data.priority || "High",
      environment: data.environment || "Staging",
      stepsToReproduce: data.steps || ""
    });
  }

  addNotification(notif) {
    if (!notif || !notif.title) return null;

    const newNotif = {
      id: notif.id || `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: notif.title,
      message: notif.message || "",
      type: notif.type || "info", // assignment | qa | bug | release | chat | comment | sprint | role | info
      issueKey: notif.issueKey || notif.key || "",
      issueId: notif.issueId || "",
      projectId: notif.projectId || "",
      chatMessageId: notif.chatMessageId || null,
      testCaseId: notif.testCaseId || null,
      link: notif.link || "",
      recipientId: notif.recipientId || null,
      recipientEmail: notif.recipientEmail ? notif.recipientEmail.toLowerCase().trim() : null,
      timestamp: "Just now",
      createdAt: new Date().toISOString(),
      read: false
    };

    if (!this.data.notifications) this.data.notifications = [];
    this.data.notifications.unshift(newNotif);
    
    // Keep notifications bounded to 100 most recent
    if (this.data.notifications.length > 100) {
      this.data.notifications = this.data.notifications.slice(0, 100);
    }

    this.saveState();
    this.notify();

    // Trigger instant UI toast alert if app is running
    if (typeof window !== 'undefined' && window.app) {
      if (window.app.updateNotificationBadge) {
        window.app.updateNotificationBadge();
      }
      if (window.app.showNotificationToast) {
        window.app.showNotificationToast(newNotif);
      } else if (window.app.toast) {
        const toastType = newNotif.type === 'bug' ? 'error' : (newNotif.type === 'qa' || newNotif.type === 'release' ? 'success' : 'info');
        window.app.toast(newNotif.title, newNotif.message, toastType);
      }
    }

    return newNotif;
  }

  // ==========================================
  // Aggregate Stats (Global & Project)
  // ==========================================
  getGlobalStats() {
    const projects = (this.getProjects && this.getProjects().length > 0) ? this.getProjects() : (this.data.projects || []);
    const issues = (this.getIssues && this.getIssues().length > 0) ? this.getIssues() : (this.data.issues || []);

    const totalIssues = issues.length;
    const openBugs = issues.filter(i => i.type === "Bug" && i.status !== "Done" && i.status !== "Closed").length;
    const criticalBugs = issues.filter(i => i.type === "Bug" && i.priority === "Critical" && i.status !== "Done" && i.status !== "Closed").length;
    const inProgress = issues.filter(i => i.status === "In Progress" || i.status === "In Development").length;
    const readyForQa = issues.filter(i => i.status === "Ready for QA" || i.status === "QA" || i.status === "Fixed" || i.status === "QA Testing").length;
    const completed = issues.filter(i => i.status === "Done" || i.status === "Closed" || i.qaStatus === "Passed").length;
    const reopenedBugs = issues.filter(i => i.status === "Reopened" || (i.reopenCount && i.reopenCount > 0)).length;

    const flow = {
      backlog: issues.filter(i => i.status === "Backlog" || i.status === "Open").length,
      todo: issues.filter(i => i.status === "To Do").length,
      inProgress: inProgress,
      qa: readyForQa,
      done: completed
    };

    const projectHealthList = projects.map(p => {
      const pIssues = issues.filter(i => i.projectId === p.id);
      const pDone = pIssues.filter(i => i.status === "Done" || i.status === "Closed" || i.qaStatus === "Passed").length;
      return {
        id: p.id,
        key: p.key,
        name: p.name,
        health: p.health || 90,
        status: p.status || "Active",
        completedIssues: pDone,
        totalIssues: pIssues.length
      };
    });

    const qaQueueStats = this.getQAQueueStats();

    return {
      activeProjectsCount: projects.filter(p => (p.status || 'Active') === "Active").length,
      totalIssues,
      openBugs,
      criticalBugs,
      inProgress,
      readyForQa,
      completed,
      reopenedBugs,
      flow,
      projectHealthList,
      qaQueueStats
    };
  }

  getProjectStats(projectId) {
    const project = this.getProjectById(projectId) || {};
    const issues = this.getIssues(projectId) || [];
    const total = issues.length;
    const open = issues.filter(i => i.status !== "Done" && i.status !== "Closed").length;
    const inProgress = issues.filter(i => i.status === "In Progress" || i.status === "In Development").length;
    const qa = issues.filter(i => i.status === "Ready for QA" || i.status === "QA Testing" || i.qaStatus === "Testing").length;
    const completed = issues.filter(i => i.status === "Done" || i.status === "Closed" || i.qaStatus === "Passed").length;
    const bugs = issues.filter(i => i.type === "Bug");
    const activeBugs = bugs.filter(i => i.status !== "Done" && i.status !== "Closed");
    const criticalBugs = activeBugs.filter(i => i.priority === "Critical").length;
    const highBugs = activeBugs.filter(i => i.priority === "High").length;
    const reopenedBugs = bugs.filter(i => i.status === "Reopened" || Number(i.reopenCount || 0) > 0).length;

    const progressPct = total > 0 ? Math.round((completed / total) * 100) : 0;

    // 1. Real Story Points & Delivery Scope
    let totalSP = 0;
    let completedSP = 0;
    let hasStoryPoints = false;
    issues.forEach(i => {
      const sp = Number(i.storyPoints || i.story_points || 0);
      if (sp > 0) {
        hasStoryPoints = true;
        totalSP += sp;
        if (i.status === "Done" || i.status === "Closed" || i.qaStatus === "Passed") {
          completedSP += sp;
        }
      }
    });

    const spProgressPct = totalSP > 0 ? Math.round((completedSP / totalSP) * 100) : progressPct;

    // 2. Real Target Release Date & Accurate Countdown Calculation
    let targetRelease = {
      rawDate: project.dueDate || project.endDate || project.target_release_date || "",
      formattedDate: "No target date set",
      label: "No target date set",
      status: "none", // 'future' | 'today' | 'overdue' | 'none'
      days: null
    };

    if (targetRelease.rawDate) {
      const targetDate = new Date(targetRelease.rawDate);
      if (!isNaN(targetDate.getTime())) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const target = new Date(targetDate);
        target.setHours(0, 0, 0, 0);
        const diffTime = target.getTime() - today.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        targetRelease.formattedDate = targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        targetRelease.days = diffDays;

        if (diffDays > 1) {
          targetRelease.label = `${diffDays} days remaining`;
          targetRelease.status = "future";
        } else if (diffDays === 1) {
          targetRelease.label = "1 day remaining";
          targetRelease.status = "future";
        } else if (diffDays === 0) {
          targetRelease.label = "Release today";
          targetRelease.status = "today";
        } else if (diffDays === -1) {
          targetRelease.label = "1 day overdue";
          targetRelease.status = "overdue";
        } else {
          targetRelease.label = `${Math.abs(diffDays)} days overdue`;
          targetRelease.status = "overdue";
        }
      }
    }

    // 3. Real Delivery Velocity Calculation (from completed sprints / active sprint)
    const projectSprints = (this.data.sprints || []).filter(s => s.projectId === projectId || s.project_id === projectId);
    const completedSprints = projectSprints.filter(s => s.status === 'Completed' || s.status === 'closed');
    const activeSprint = projectSprints.find(s => s.status === 'Active' || s.status === 'active' || s.status === 'In Progress') || (projectSprints.length > 0 ? projectSprints[0] : null);

    let currentSprintVelocity = 0;
    let totalSprintVelocity = 0;

    if (activeSprint) {
      const activeIssues = issues.filter(i => (i.sprintId === activeSprint.id || i.sprint_id === activeSprint.id));
      activeIssues.forEach(i => {
        if (i.status === "Done" || i.status === "Closed" || i.qaStatus === "Passed") {
          currentSprintVelocity += Number(i.storyPoints || i.story_points || 1);
        }
      });
    }

    if (completedSprints.length > 0) {
      completedSprints.forEach(s => {
        const sIssues = issues.filter(i => (i.sprintId === s.id || i.sprint_id === s.id));
        sIssues.forEach(i => {
          if (i.status === "Done" || i.status === "Closed" || i.qaStatus === "Passed") {
            totalSprintVelocity += Number(i.storyPoints || i.story_points || 1);
          }
        });
      });
    }

    const avgVelocity = completedSprints.length > 0
      ? Math.round(totalSprintVelocity / completedSprints.length)
      : (activeSprint ? currentSprintVelocity : 0);

    const velocity = {
      current: currentSprintVelocity,
      average: avgVelocity,
      unit: hasStoryPoints ? "pts" : "issues",
      completedSprintsCount: completedSprints.length,
      hasData: total > 0 && (completedSprints.length > 0 || (activeSprint && currentSprintVelocity > 0))
    };

    // 4. Real Quality SLA Compliance Calculation
    const slaConfig = project.slaConfig || { Critical: 4, High: 8, Medium: 24, Low: 72 };
    let slaApplicableCount = 0;
    let withinSlaCount = 0;
    let slaBreaches = 0;

    issues.forEach(i => {
      const createdStr = i.createdAt || i.created_at;
      if (!createdStr) return;
      const createdTime = new Date(createdStr).getTime();
      if (isNaN(createdTime)) return;

      slaApplicableCount++;
      const maxHours = slaConfig[i.priority] || 24;
      const maxDurationMs = maxHours * 60 * 60 * 1000;

      const updatedStr = i.updatedAt || i.updated_at;
      const endTime = (i.status === 'Done' || i.status === 'Closed') && updatedStr
        ? new Date(updatedStr).getTime()
        : Date.now();

      const duration = endTime - createdTime;
      if (duration <= maxDurationMs) {
        withinSlaCount++;
      } else {
        slaBreaches++;
      }
    });

    const slaCompliancePct = slaApplicableCount > 0 ? Math.round((withinSlaCount / slaApplicableCount) * 100) : null;
    const sla = {
      compliancePct: slaCompliancePct,
      breaches: slaBreaches,
      withinSla: withinSlaCount,
      total: slaApplicableCount,
      hasData: slaApplicableCount > 0
    };

    // 5. Real QA Verification Metrics (Derived from issues & test cases)
    const passedCount = issues.filter(i => i.qaStatus === 'Passed' || i.qa_status === 'Passed' || (i.status === 'Done' && i.type !== 'Bug')).length;
    const testedCount = issues.filter(i => i.qaStatus === 'Passed' || i.qaStatus === 'Failed' || i.qa_status === 'Passed' || i.qa_status === 'Failed' || i.status === 'Done' || i.status === 'Closed').length;
    const passRate = testedCount > 0 ? Math.round((passedCount / testedCount) * 100) : (completed > 0 ? 100 : null);

    const projectTests = (this.data.testCases || []).filter(t => t.projectId === projectId || t.project_id === projectId);
    const qaMetrics = {
      passRate: passRate !== null ? passRate : 0,
      hasPassRateData: passRate !== null,
      totalTestCases: projectTests.length,
      openDefects: activeBugs.length,
      testedIssuesCount: testedCount
    };

    // 6. Real Project Health Score (Derived from defects, pass rate & SLA)
    let health = 100;
    if (total > 0) {
      health -= (criticalBugs * 20);
      health -= (highBugs * 8);
      health -= (reopenedBugs * 5);
      if (slaCompliancePct !== null && slaCompliancePct < 90) {
        health -= Math.round((90 - slaCompliancePct) / 2);
      }
      health = Math.max(0, Math.min(100, health));
    }

    return {
      total,
      open,
      inProgress,
      qa,
      completed,
      activeBugs: activeBugs.length,
      criticalBugs,
      highBugs,
      reopenedBugs,
      progressPct,
      spProgressPct,
      daysRemaining: targetRelease.label,
      targetRelease,
      velocity,
      sla,
      totalSP,
      completedSP,
      hasStoryPoints,
      activeSprint,
      health,
      qaMetrics
    };
  }

  // =========================================================================
  // PULSEWAVE V2 — TEST PLANS (Section 2)
  // =========================================================================
  getTestPlans(projectId = null) {
    if (!this.data.testPlans) this.data.testPlans = [];
    if (!projectId || projectId === "all") return this.data.testPlans;
    return this.data.testPlans.filter(tp => tp.projectId === projectId);
  }

  getTestPlanById(id) {
    return (this.data.testPlans || []).find(tp => tp.id === id) || null;
  }

  createTestPlan(planData) {
    const activeProject = this.getActiveProject() || {};
    const id = `tp-${Date.now().toString(36)}`;
    const newPlan = {
      id,
      projectId: planData.projectId || activeProject.id || null,
      project_id: planData.projectId || activeProject.id || null,
      name: planData.name || `${activeProject.name || 'Release'} Quality Gate Plan`,
      customer: planData.customer || activeProject.customer || activeProject.name || "Client",
      release: planData.release || activeProject.release_version || activeProject.currentRelease || "v1.0.0",
      environment: planData.environment || activeProject.environment || "Staging",
      testingType: planData.testingType || "Regression",
      qaLeadId: planData.qaLeadId || (this.getActiveUser() ? this.getActiveUser().id : null),
      startDate: planData.startDate || new Date().toISOString().split("T")[0],
      endDate: planData.endDate || new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
      status: planData.status || "Draft",
      objective: planData.objective || "Comprehensive quality gate sign-off, functional verification, and regression coverage.",
      scope: planData.scope || "Core features, API endpoints, and critical user journeys.",
      outOfScope: planData.outOfScope || "Third-party vendor unreleased external APIs.",
      risks: planData.risks || "Sandbox environment latency and test data dependencies.",
      entryCriteria: planData.entryCriteria || "Build deployed to target environment with passing unit tests.",
      exitCriteria: planData.exitCriteria || "Zero P0/P1 open defects, >=95% pass rate on critical paths.",
      totalCases: 0,
      passed: 0,
      failed: 0,
      blocked: 0,
      passRate: 100
    };
    if (!this.data.testPlans) this.data.testPlans = [];
    this.data.testPlans.unshift(newPlan);
    this.saveState();
    return newPlan;
  }

  updateTestPlan(id, updates) {
    const plan = this.getTestPlanById(id);
    if (!plan) return null;
    Object.assign(plan, updates);
    this.saveState();
    return plan;
  }

  deleteTestPlan(id) {
    if (!this.data.testPlans) return false;
    const idx = this.data.testPlans.findIndex(p => p.id === id);
    if (idx !== -1) {
      this.data.testPlans.splice(idx, 1);
      this.saveState();
      return true;
    }
    return false;
  }

  // =========================================================================
  // PULSEWAVE V2 — TEST SUITES (Section 3, 4)
  // =========================================================================
  getTestSuites(projectId = null, testPlanId = null) {
    if (!this.data.testSuites) this.data.testSuites = [];
    let list = this.data.testSuites;
    if (projectId && projectId !== "all") {
      list = list.filter(ts => (ts.projectId === projectId || ts.project_id === projectId));
    }
    if (testPlanId && testPlanId !== "all") {
      list = list.filter(ts => (ts.testPlanId === testPlanId || ts.test_plan_id === testPlanId));
    }
    return list;
  }

  getTestSuiteById(id) {
    return (this.data.testSuites || []).find(ts => ts.id === id) || null;
  }

  createTestSuite(suiteData) {
    const activeProject = this.getActiveProject() || {};
    const id = `ts-${Date.now().toString(36)}`;
    const newSuite = {
      id,
      projectId: suiteData.projectId || activeProject.id || null,
      project_id: suiteData.projectId || activeProject.id || null,
      testPlanId: suiteData.testPlanId || null,
      name: suiteData.name || "Functional Test Suite",
      description: suiteData.description || "Collection of feature verification test cases.",
      testType: suiteData.testType || "Functional",
      ownerId: suiteData.ownerId || (this.getActiveUser() ? this.getActiveUser().id : null),
      priority: suiteData.priority || "P1",
      tags: suiteData.tags || ["Regression", "P1"],
      totalCases: 0,
      passed: 0,
      failed: 0,
      blocked: 0,
      notRun: 0,
      passRate: 100
    };
    if (!this.data.testSuites) this.data.testSuites = [];
    this.data.testSuites.unshift(newSuite);
    this.saveState();
    return newSuite;
  }

  updateTestSuite(id, updates) {
    const suite = this.getTestSuiteById(id);
    if (!suite) return null;
    Object.assign(suite, updates);
    this.saveState();
    return suite;
  }

  deleteTestSuite(id) {
    if (!this.data.testSuites) return false;
    const idx = this.data.testSuites.findIndex(s => s.id === id);
    if (idx !== -1) {
      this.data.testSuites.splice(idx, 1);
      this.saveState();
      return true;
    }
    return false;
  }

  // =========================================================================
  // PULSEWAVE V2 — TEST CASES & TEST LIBRARY (Clean Real-World QA Model)
  // =========================================================================
  getTestCases(projectId = null, filters = null) {
    if (!this.data.testCases) this.data.testCases = [];
    const activeProject = this.getActiveProject() || {};
    const prjId = projectId || activeProject.id || null;

    let list = this.data.testCases;
    if (prjId && prjId !== "all") {
      list = list.filter(tc => (tc.projectId === prjId || tc.project_id === prjId));
    }

    if (filters && typeof filters === "object") {
      if (filters.module && filters.module !== "all") {
        list = list.filter(tc => (tc.module || "").toLowerCase() === filters.module.toLowerCase());
      }
      if (filters.testType && filters.testType !== "all") {
        list = list.filter(tc => (tc.testType || tc.type || "").toLowerCase() === filters.testType.toLowerCase());
      }
      if (filters.priority && filters.priority !== "all") {
        list = list.filter(tc => (tc.priority || "").toLowerCase() === filters.priority.toLowerCase());
      }
      if (filters.status && filters.status !== "all") {
        list = list.filter(tc => (tc.status || "Active").toLowerCase() === filters.status.toLowerCase());
      }
      if (filters.result && filters.result !== "all") {
        list = list.filter(tc => (tc.lastResult || "Not Run").toLowerCase() === filters.result.toLowerCase());
      }
      if (filters.assignedQA && filters.assignedQA !== "all") {
        list = list.filter(tc => (tc.assignedQA || tc.assigned_to || "").toLowerCase() === filters.assignedQA.toLowerCase());
      }
      if (filters.search && filters.search.trim()) {
        const q = filters.search.toLowerCase().trim();
        list = list.filter(tc => 
          (tc.id || "").toLowerCase().includes(q) ||
          (tc.key || "").toLowerCase().includes(q) ||
          (tc.title || "").toLowerCase().includes(q) ||
          (tc.description || "").toLowerCase().includes(q) ||
          (tc.module || "").toLowerCase().includes(q) ||
          (Array.isArray(tc.tags) && tc.tags.some(t => t.toLowerCase().includes(q)))
        );
      }
    }

    return list;
  }

  getTestCaseById(id) {
    if (!id) return null;
    return (this.data.testCases || []).find(tc => tc.id === id || tc.key === id) || null;
  }

  async syncTestCasesFromSupabase(projectId = null) {
    const sb = (typeof window !== 'undefined' && window.supabaseClient) || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
    if (!sb || !sb.from) return this.getTestCases(projectId);
    try {
      let query = sb.from('test_cases').select('*');
      if (projectId && projectId !== 'all') {
        query = query.eq('project_id', projectId);
      }
      const { data: remoteTests, error } = await query;
      if (!error && Array.isArray(remoteTests)) {
        const remoteMapped = remoteTests.map(t => ({
          id: t.id,
          key: t.key || t.id,
          projectId: t.project_id || t.projectId,
          project_id: t.project_id || t.projectId,
          workspaceId: t.workspace_id || t.workspaceId,
          workspace_id: t.workspace_id || t.workspaceId,
          title: t.title,
          description: t.description || '',
          module: t.module || 'General',
          feature: t.feature || t.title,
          testType: t.type || 'Functional',
          type: t.type || 'Functional',
          priority: t.priority || 'Medium',
          status: t.status || 'Active',
          lastResult: t.status === 'Passed' ? 'Passed' : (t.status === 'Failed' ? 'Failed' : (t.status === 'Blocked' ? 'Blocked' : (t.status === 'Skipped' ? 'Skipped' : 'Not Run'))),
          preconditions: t.preconditions || '',
          testData: t.test_data || t.testData || '',
          steps: Array.isArray(t.steps) ? t.steps : (typeof t.steps === 'string' ? JSON.parse(t.steps || '[]') : []),
          expectedResult: t.expected_result || t.expectedResult || '',
          environment: t.environment || 'Staging',
          browser: t.browser || 'Chrome / Desktop',
          tags: Array.isArray(t.tags) ? t.tags : (typeof t.tags === 'string' ? JSON.parse(t.tags || '["Regression"]') : ["Regression"]),
          assignedQA: t.assigned_to || t.assignedQA || 'QA Lead',
          assigned_to: t.assigned_to || t.assignedQA || 'QA Lead',
          createdBy: t.created_by || 'QA Engineer',
          relatedIssueKey: t.relatedIssueKey || '',
          updatedDate: t.updated_at ? t.updated_at.split('T')[0] : (t.created_at ? t.created_at.split('T')[0] : new Date().toISOString().split('T')[0]),
          createdAt: t.created_at || new Date().toISOString()
        }));

        if (!this.data.testCases) this.data.testCases = [];
        if (projectId && projectId !== 'all') {
          this.data.testCases = this.data.testCases.filter(tc => (tc.projectId !== projectId && tc.project_id !== projectId));
          this.data.testCases.push(...remoteMapped);
        } else {
          this.data.testCases = remoteMapped;
        }
        this.saveState();
        return this.getTestCases(projectId);
      }
    } catch (err) {
      console.warn("Could not sync test cases from Supabase:", err);
    }
    return this.getTestCases(projectId);
  }

  createTestCase(caseData) {
    const activeProject = this.getActiveProject() || {};
    const projectId = caseData.projectId || caseData.project_id || activeProject.id || null;
    const activeWorkspace = this.getActiveWorkspace ? this.getActiveWorkspace() : null;
    const workspaceId = caseData.workspaceId || caseData.workspace_id || (activeWorkspace ? activeWorkspace.id : null);
    const activeUser = this.getActiveUser() || { name: "QA Engineer" };

    const projectCases = (this.data.testCases || []).filter(tc => (tc.projectId === projectId || tc.project_id === projectId));
    const nextNumber = projectCases.length + 1;
    const modPrefix = caseData.module ? caseData.module.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase() : 'TC';
    const id = caseData.id || `TC-${String(nextNumber).padStart(3, "0")}`;

    const defaultSteps = [
      { stepNumber: 1, action: "Navigate to target feature and initialize precondition state", expectedResult: "Feature responds normally and displays requested view." }
    ];

    const newCase = {
      id,
      key: id,
      projectId,
      project_id: projectId,
      workspaceId,
      workspace_id: workspaceId,
      title: caseData.title || "New Test Case",
      description: caseData.description || "",
      module: caseData.module || "General",
      feature: caseData.feature || caseData.module || "General Verification",
      testType: caseData.testType || caseData.type || "Functional",
      type: caseData.testType || caseData.type || "Functional",
      priority: caseData.priority || "Medium",
      status: caseData.status || "Active",
      lastResult: caseData.lastResult || "Not Run",
      preconditions: caseData.preconditions || "",
      testData: caseData.testData || caseData.test_data || "",
      environment: caseData.environment || activeProject.environment || "Staging",
      browser: caseData.browser || "Chrome / Desktop",
      steps: Array.isArray(caseData.steps) && caseData.steps.length > 0 ? caseData.steps : defaultSteps,
      expectedResult: caseData.expectedResult || caseData.expected_result || (caseData.steps && caseData.steps[0] ? caseData.steps[0].expectedResult : "Operation completes successfully without error."),
      tags: Array.isArray(caseData.tags) ? caseData.tags : (caseData.tags ? [caseData.tags] : ["Regression"]),
      assignedQA: caseData.assignedQA || caseData.assigned_to || activeUser.name,
      assigned_to: caseData.assignedQA || caseData.assigned_to || activeUser.name,
      createdBy: caseData.createdBy || activeUser.name,
      relatedIssueKey: caseData.relatedIssueKey || null,
      createdAt: new Date().toISOString(),
      updatedDate: new Date().toISOString().split("T")[0]
    };

    if (!this.data.testCases) this.data.testCases = [];
    this.data.testCases.unshift(newCase);
    this.saveState();

    // Async Supabase Sync
    const sb = (typeof window !== 'undefined' && window.supabaseClient) || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
    if (sb && sb.from && projectId) {
      (async () => {
        try {
          await sb.from('test_cases').upsert({
            id: newCase.id,
            project_id: projectId,
            workspace_id: workspaceId,
            key: newCase.key,
            title: newCase.title,
            description: newCase.description,
            module: newCase.module,
            feature: newCase.feature,
            type: newCase.type,
            priority: newCase.priority,
            status: newCase.status,
            preconditions: newCase.preconditions,
            steps: newCase.steps,
            expected_result: newCase.expectedResult,
            test_data: newCase.testData,
            environment: newCase.environment,
            browser: newCase.browser,
            tags: newCase.tags,
            assigned_to: newCase.assignedQA,
            created_by: newCase.createdBy,
            updated_at: new Date().toISOString()
          });
        } catch (e) {
          console.warn("Supabase test case sync notice:", e);
        }
      })();
    }

    return newCase;
  }

  updateTestCase(id, updates) {
    const tc = this.getTestCaseById(id);
    if (!tc) return null;
    Object.assign(tc, updates);
    tc.updatedDate = new Date().toISOString().split("T")[0];
    this.saveState();

    // Async Supabase Sync
    const sb = (typeof window !== 'undefined' && window.supabaseClient) || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
    if (sb && sb.from && (tc.projectId || tc.project_id)) {
      (async () => {
        try {
          await sb.from('test_cases').upsert({
            id: tc.id,
            project_id: tc.projectId || tc.project_id,
            workspace_id: tc.workspaceId || tc.workspace_id,
            key: tc.key || tc.id,
            title: tc.title,
            description: tc.description,
            module: tc.module,
            feature: tc.feature,
            type: tc.type || tc.testType || 'Functional',
            priority: tc.priority || 'Medium',
            status: tc.status || 'Active',
            preconditions: tc.preconditions,
            steps: tc.steps,
            expected_result: tc.expectedResult,
            test_data: tc.testData,
            environment: tc.environment,
            browser: tc.browser,
            tags: tc.tags,
            assigned_to: tc.assignedQA || tc.assigned_to,
            updated_at: new Date().toISOString()
          });
        } catch (e) {
          console.warn("Supabase test case update notice:", e);
        }
      })();
    }

    return tc;
  }

  duplicateTestCase(id) {
    const original = this.getTestCaseById(id);
    if (!original) return null;
    const cloned = JSON.parse(JSON.stringify(original));
    const projectCases = (this.data.testCases || []).filter(tc => (tc.projectId === original.projectId || tc.project_id === original.projectId));
    const nextNumber = projectCases.length + 1;
    cloned.id = `TC-${String(nextNumber).padStart(3, "0")}`;
    cloned.key = cloned.id;
    cloned.title = `${original.title} (Copy)`;
    cloned.lastResult = "Not Run";
    cloned.relatedIssueKey = null;
    cloned.createdAt = new Date().toISOString();
    cloned.updatedDate = new Date().toISOString().split("T")[0];
    this.data.testCases.unshift(cloned);
    this.saveState();

    // Async Supabase Sync
    const sb = (typeof window !== 'undefined' && window.supabaseClient) || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
    if (sb && sb.from && (cloned.projectId || cloned.project_id)) {
      (async () => {
        try {
          await sb.from('test_cases').upsert({
            id: cloned.id,
            project_id: cloned.projectId || cloned.project_id,
            workspace_id: cloned.workspaceId || cloned.workspace_id,
            key: cloned.key,
            title: cloned.title,
            description: cloned.description,
            module: cloned.module,
            feature: cloned.feature,
            type: cloned.type || cloned.testType || 'Functional',
            priority: cloned.priority || 'Medium',
            status: cloned.status || 'Active',
            preconditions: cloned.preconditions,
            steps: cloned.steps,
            expected_result: cloned.expectedResult,
            test_data: cloned.testData,
            environment: cloned.environment,
            browser: cloned.browser,
            tags: cloned.tags,
            assigned_to: cloned.assignedQA,
            created_by: cloned.createdBy,
            updated_at: new Date().toISOString()
          });
        } catch (e) {
          console.warn("Supabase test case clone notice:", e);
        }
      })();
    }

    return cloned;
  }

  deleteTestCase(id) {
    const idx = (this.data.testCases || []).findIndex(tc => tc.id === id);
    if (idx !== -1) {
      this.data.testCases.splice(idx, 1);
      this.saveState();

      // Async Supabase Sync
      const sb = (typeof window !== 'undefined' && window.supabaseClient) || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
      if (sb && sb.from) {
        (async () => {
          try {
            await sb.from('test_cases').delete().eq('id', id);
          } catch (e) {
            console.warn("Supabase test case delete notice:", e);
          }
        })();
      }

      return true;
    }
    return false;
  }

  // =========================================================================
  // PULSEWAVE V2 — TEST EXECUTION (Immutable Execution Runs & Retest Log)
  // =========================================================================
  executeTestCase(testCaseId, result, actualResult = "", qaNotes = "", stepResults = [], cycleInfo = {}, evidence = [], testerId = null) {
    const tc = this.getTestCaseById(testCaseId);
    if (!tc) return null;

    let normalizedResult = "Passed";
    if (result === "FAIL" || result === "Fail" || result === "Failed") normalizedResult = "Failed";
    else if (result === "BLOCKED" || result === "Blocked") normalizedResult = "Blocked";
    else if (result === "SKIPPED" || result === "Skipped" || result === "Skip") normalizedResult = "Skipped";
    else if (result === "NOT RUN" || result === "Not Run" || result === "Untested") normalizedResult = "Not Run";
    else if (result === "PASS" || result === "Pass" || result === "Passed") normalizedResult = "Passed";

    tc.lastResult = normalizedResult;
    if (tc.status === "Draft") tc.status = "Active";
    tc.updatedDate = new Date().toISOString().split("T")[0];

    const activeProject = this.getProjectById(tc.projectId || tc.project_id) || this.getActiveProject() || {};
    const activeUser = this.getActiveUser() || { name: "QA Lead", id: "qa-lead" };

    const runNumber = (this.getTestCaseExecutionHistory(tc.id) || []).length + 1;
    const isRetest = runNumber > 1;

    const execRecord = {
      id: `exec-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`,
      testCaseId: tc.id,
      projectId: tc.projectId || tc.project_id || activeProject.id,
      workspaceId: tc.workspaceId || activeProject.workspace_id,
      cycleName: cycleInfo.cycleName || cycleInfo.name || `${activeProject.name || 'QA'} Testing Cycle`,
      releaseVersion: cycleInfo.release || activeProject.release_version || "v1.0.0",
      environment: cycleInfo.environment || tc.environment || activeProject.environment || "Staging",
      testType: cycleInfo.testType || tc.testType || "Regression",
      runType: isRetest ? `Retest ${runNumber - 1}` : 'Initial Run',
      runNumber,
      status: normalizedResult,
      result: normalizedResult,
      actualResult: actualResult || (normalizedResult === "Passed" ? "All verification steps completed with expected output." : "Step deviation or defect encountered."),
      qaNotes: qaNotes || "",
      comments: qaNotes || "",
      stepResults: Array.isArray(stepResults) ? stepResults : [],
      evidence: evidence || [],
      linkedDefectKey: tc.relatedIssueKey || null,
      testerId: testerId || activeUser.id,
      executedBy: activeUser.name,
      executedAt: new Date().toISOString(),
      executionDate: new Date().toISOString().replace("T", " ").substring(0, 16)
    };

    if (!this.data.testExecutions) this.data.testExecutions = [];
    this.data.testExecutions.unshift(execRecord);

    if (normalizedResult === "Failed") {
      this.addNotification({
        title: `Test Case Failed: ${tc.id}`,
        message: `[${tc.id}] "${tc.title}" failed execution in ${execRecord.cycleName || 'Test Cycle'}.`,
        type: 'bug',
        projectId: execRecord.projectId,
        testCaseId: tc.id
      });
    }

    this.saveState();

    // Async Supabase Sync (Append execution history)
    const sb = (typeof window !== 'undefined' && window.supabaseClient) || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
    if (sb && sb.from && tc.id) {
      (async () => {
        try {
          await sb.from('test_executions').insert({
            id: execRecord.id,
            project_id: execRecord.projectId,
            workspace_id: execRecord.workspaceId,
            test_case_id: execRecord.testCaseId,
            cycle_name: execRecord.cycleName,
            release_version: execRecord.releaseVersion,
            environment: execRecord.environment,
            test_type: execRecord.testType,
            status: execRecord.status,
            actual_result: execRecord.actualResult,
            comments: execRecord.comments,
            step_results: execRecord.stepResults,
            evidence: execRecord.evidence,
            linked_defect_key: execRecord.linkedDefectKey,
            executed_by: execRecord.executedBy,
            executed_at: execRecord.executedAt
          });
        } catch (e) {
          console.warn("Supabase test execution record notice:", e);
        }
      })();
    }

    return execRecord;
  }

  retestTestCase(testCaseId, result, actualResult = "", qaNotes = "", stepResults = [], cycleInfo = {}) {
    const res = this.executeTestCase(testCaseId, result, actualResult, qaNotes, stepResults, cycleInfo);
    const tc = this.getTestCaseById(testCaseId);
    if (tc && tc.relatedIssueKey) {
      const issue = this.getIssueByKey(tc.relatedIssueKey);
      if (issue) {
        if (result === "Passed" || result === "Pass" || result === "PASS") {
          issue.qaStatus = "Passed";
          issue.qa_status = "Passed";
          issue.status = "Done";
        } else if (result === "Failed" || result === "Fail" || result === "FAIL") {
          issue.qaStatus = "Failed";
          issue.qa_status = "Failed";
          issue.status = "Reopened";
          issue.reopenCount = (issue.reopenCount || 0) + 1;
        }
        issue.updatedAt = new Date().toISOString().replace("T", " ").substring(0, 16);
        this.saveState();
      }
    }
    return res;
  }

  getTestExecutions(projectId = null, testCaseId = null) {
    if (!this.data.testExecutions) this.data.testExecutions = [];
    let list = this.data.testExecutions;
    if (projectId && projectId !== "all") {
      list = list.filter(te => (te.projectId === projectId || te.project_id === projectId));
    }
    if (testCaseId) {
      list = list.filter(te => te.testCaseId === testCaseId);
    }
    return list;
  }

  getTestCaseExecutionHistory(testCaseId) {
    if (!testCaseId || !this.data.testExecutions) return [];
    return this.data.testExecutions.filter(te => te.testCaseId === testCaseId);
  }

  // =========================================================================
  // PULSEWAVE V2 — TESTING CYCLES (Active QA Cycle State)
  // =========================================================================
  getTestCycles(projectId = null) {
    if (!this.data.testCycles) this.data.testCycles = [];
    const activeProject = this.getActiveProject() || {};
    const prjId = projectId || activeProject.id;
    if (!prjId || prjId === "all") return this.data.testCycles;
    return this.data.testCycles.filter(c => c.projectId === prjId || c.project_id === prjId);
  }

  getActiveTestCycle(projectId = null) {
    const cycles = this.getTestCycles(projectId);
    return cycles.find(c => c.status === "Active") || cycles[0] || null;
  }

  saveTestCycle(cycleData) {
    if (!this.data.testCycles) this.data.testCycles = [];
    const activeProject = this.getActiveProject() || {};
    const projectId = cycleData.projectId || activeProject.id;
    const id = cycleData.id || `cycle-${Date.now().toString(36)}`;

    const existingIdx = this.data.testCycles.findIndex(c => c.id === id);
    const cycle = {
      id,
      projectId,
      name: cycleData.name || `${cycleData.testType || 'Regression'} Testing — Release ${cycleData.release || activeProject.release_version || 'v1.0.0'}`,
      release: cycleData.release || activeProject.release_version || "v1.0.0",
      environment: cycleData.environment || activeProject.environment || "Staging",
      testType: cycleData.testType || "Regression",
      assignedQA: cycleData.assignedQA || (this.getActiveUser() ? this.getActiveUser().name : "QA Lead"),
      status: cycleData.status || "Active",
      selectedCaseIds: Array.isArray(cycleData.selectedCaseIds) ? cycleData.selectedCaseIds : [],
      startedAt: cycleData.startedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (existingIdx !== -1) {
      this.data.testCycles[existingIdx] = cycle;
    } else {
      // Set others to Inactive if this is active
      if (cycle.status === "Active") {
        this.data.testCycles.forEach(c => {
          if (c.projectId === projectId) c.status = "Completed";
        });
      }
      this.data.testCycles.unshift(cycle);
    }

    this.saveState();
    return cycle;
  }

  // =========================================================================
  // PULSEWAVE V2 — FAILED TEST → CREATE BUG INTEGRATION
  // =========================================================================
  createBugFromFailedTest(testCaseId, bugData = {}) {
    const tc = this.getTestCaseById(testCaseId);
    const activeProject = this.getActiveProject() || {};
    const projectId = (tc ? tc.projectId || tc.project_id : null) || activeProject.id;
    const project = this.getProjectById(projectId) || activeProject;

    const issues = this.getIssues(projectId);
    const bugCount = issues.filter(i => i.type === "Bug").length + 1;
    const projectPrefix = project.key ? (project.key.length <= 4 ? project.key : project.key.substring(0, 4)) : 'DEF';
    const key = `BUG-${projectPrefix}-${bugCount}`;

    const stepsText = tc && tc.steps && tc.steps.length > 0 
      ? tc.steps.map(s => `${s.stepNumber || 1}. ${s.action} -> Expected: ${s.expectedResult}`).join("\n") 
      : "1. Follow test case procedure.";

    const projectMembers = this.getProjectMembers(projectId);
    const defaultDevId = bugData.developerId || (projectMembers.length > 0 ? projectMembers[0].userId : (this.getActiveUser() ? this.getActiveUser().id : null));

    const newBug = {
      id: `issue-${Date.now().toString(36)}`,
      key,
      projectId,
      project_id: projectId,
      title: bugData.title || `[${tc ? tc.id : 'Test Fail'}] ${tc ? tc.title : 'Defect found during execution'}`,
      description: bugData.description || `Test case ${tc ? tc.id : ''} failed during test execution.\n\nPreconditions:\n${tc ? tc.preconditions : 'None'}\n\nExpected Result:\n${tc ? tc.expectedResult : 'Success'}\n\nActual Result:\n${bugData.actualResult || 'Operation failed.'}`,
      type: "Bug",
      priority: bugData.priority || (tc ? tc.priority : "High"),
      severity: bugData.severity || "Critical",
      status: "To Do",
      qaStatus: "Failed",
      qa_status: "Failed",
      reopenCount: 0,
      assigneeId: defaultDevId,
      assignee_id: defaultDevId,
      reporterId: this.getActiveUser() ? this.getActiveUser().id : null,
      reporter_id: this.getActiveUser() ? this.getActiveUser().id : null,
      qaId: this.getActiveUser() ? this.getActiveUser().id : null,
      developerId: defaultDevId,
      developer_id: defaultDevId,
      environment: bugData.environment || (tc ? tc.environment : (project.environment || "Staging")),
      buildVersion: bugData.build || project.build_version || project.release_version || "v1.0.0",
      releaseVersion: bugData.release || project.release_version || "v1.0.0",
      release_version: bugData.release || project.release_version || "v1.0.0",
      linkedTestCaseId: tc ? tc.id : null,
      foundDuring: "Regression Test Execution",
      stepsToReproduce: stepsText,
      expectedResult: tc && tc.steps && tc.steps[tc.steps.length - 1] ? tc.steps[tc.steps.length - 1].expectedResult : (tc ? tc.expectedResult : "Operation should succeed cleanly."),
      actualResult: bugData.actualResult || "Validation exception or failure observed.",
      labels: ["QA-Found", "Regression", tc ? tc.module : "Core"],
      attachments: bugData.attachments || [],
      storyPoints: 5,
      story_points: 5,
      createdAt: new Date().toISOString().replace("T", " ").substring(0, 16),
      updatedAt: new Date().toISOString().replace("T", " ").substring(0, 16),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (!this.data.issues) this.data.issues = [];
    this.data.issues.unshift(newBug);

    if (tc) {
      tc.relatedIssueKey = key;
      tc.lastResult = "Failed";
      tc.status = "Failed";
    }

    if (!this.data.activities) this.data.activities = [];
    this.data.activities.unshift({
      id: `act-${Date.now().toString(36)}`,
      issueKey: key,
      user: this.getActiveUser() ? this.getActiveUser().name : "QA Engineer",
      action: `Created Defect ${key} from failed test case ${tc ? tc.id : ''}`,
      time: "Just now"
    });

    this.addNotification({
      title: `Defect Logged: ${key} 🐞`,
      message: `${this.getActiveUser() ? this.getActiveUser().name : 'QA'} logged defect ${key} from failed test ${tc ? tc.id : ''}.`,
      type: "bug",
      issueKey: key,
      issueId: newBug.id,
      projectId: projectId,
      recipientId: newBug.assignee_id || newBug.developer_id
    });

    this.saveState();

    // Async Supabase Sync for created Issue & Test Case Link
    const sb = (typeof window !== 'undefined' && window.supabaseClient) || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
    if (sb && sb.from && projectId) {
      (async () => {
        try {
          await sb.from('issues').upsert({
            id: newBug.id,
            project_id: projectId,
            key: newBug.key,
            title: newBug.title,
            description: newBug.description,
            type: newBug.type,
            status: 'Todo',
            priority: newBug.priority,
            qa_status: 'Failed',
            assignee_id: newBug.assignee_id,
            reporter_id: newBug.reporter_id,
            developer_id: newBug.developer_id,
            story_points: 5,
            environment: newBug.environment,
            release_version: newBug.release_version,
            build_version: newBug.buildVersion,
            reopen_count: 0
          });

          await sb.from('test_issue_links').insert({
            id: `link-${Date.now().toString(36)}`,
            project_id: projectId,
            test_case_id: tc ? tc.id : null,
            issue_id: newBug.id,
            issue_key: newBug.key,
            created_at: new Date().toISOString()
          });
        } catch (e) {
          console.warn("Supabase bug & link sync notice:", e);
        }
      })();
    }

    return newBug;
  }

  createDefectFromFailedTest(testCaseId, bugData = {}) {
    return this.createBugFromFailedTest(testCaseId, bugData);
  }

  // =========================================================================
  // PULSEWAVE V2 — BUG → RETEST WORKFLOW
  // =========================================================================
  retestFromBug(issueKey, newResult, actualResult = "", qaNotes = "", stepResults = []) {
    const issue = this.getIssueByKey(issueKey);
    if (!issue) return null;

    const isPass = newResult === "Pass" || newResult === "Passed" || newResult === "PASS";
    const isFail = newResult === "Fail" || newResult === "Failed" || newResult === "FAIL";

    const tc = issue.linkedTestCaseId ? this.getTestCaseById(issue.linkedTestCaseId) : null;

    if (tc) {
      this.executeTestCase(
        tc.id,
        isPass ? "Passed" : (isFail ? "Failed" : newResult),
        actualResult || (isPass ? "Retest verified: Defect resolution confirmed." : "Retest failed: Defect still reproduces."),
        qaNotes || `Retest conducted against ${issueKey}.`,
        stepResults
      );
    }

    if (isPass) {
      issue.status = "Done";
      issue.qaStatus = "Passed";
      issue.qa_status = "Passed";
      issue.updatedAt = new Date().toISOString().replace("T", " ").substring(0, 16);
    } else if (isFail) {
      issue.status = "Reopened";
      issue.qaStatus = "Failed";
      issue.qa_status = "Failed";
      issue.reopenCount = (issue.reopenCount || 0) + 1;
      issue.updatedAt = new Date().toISOString().replace("T", " ").substring(0, 16);
    }

    if (!this.data.activities) this.data.activities = [];
    this.data.activities.unshift({
      id: `act-${Date.now().toString(36)}`,
      issueKey: issue.key,
      user: this.getActiveUser() ? this.getActiveUser().name : "QA Engineer",
      action: `Retested ${issue.key}: Verdict ${isPass ? 'PASSED ✓' : 'FAILED ✗'}`,
      time: "Just now"
    });

    this.saveState();
    return issue;
  }

  // =========================================================================
  // PULSEWAVE V2 — DOCUMENTATION & REPORT BUILDER (Sections 15-28, 36-37)
  // =========================================================================
  getDocumentTemplates() {
    return this.data.documentTemplates || [];
  }

  getDocumentTemplateById(id) {
    return (this.data.documentTemplates || []).find(t => t.id === id) || null;
  }

  getDocuments(projectId = null, filterType = null) {
    if (!this.data.documents) this.data.documents = [];
    const validProjectIds = (this.data.projects || []).map(p => p.id);
    let list = this.data.documents.filter(d => {
      if (!d || !d.id) return false;
      const author = (d.authorName || d.ownerId || "").toLowerCase();
      if (author.includes("u-pm-1")) return false;
      const name = (d.name || "").toLowerCase();
      if (
        name.includes("ecom") ||
        name.includes("core infrastructure") ||
        name.includes("ms excel test case") ||
        name.includes("qa specification report") ||
        name.includes("qa test execution report") ||
        name.includes("test plan template") ||
        name.includes("(v2.4.1)") ||
        name.includes("doc-rpos")
      ) return false;
      if (d.projectId && !validProjectIds.includes(d.projectId)) return false;
      return true;
    });
    if (projectId && projectId !== "all") {
      list = list.filter(d => d.projectId === projectId);
    }
    if (filterType && filterType !== "all") {
      list = list.filter(d => d.type === filterType);
    }
    return list;
  }

  getDocumentById(id) {
    return (this.data.documents || []).find(d => d.id === id) || null;
  }

  createDocument(docData) {
    const activeProject = this.getActiveProject() || {};
    const activeUser = this.getActiveUser() || { id: "u-1", name: "QA Lead" };
    const id = `doc-${Date.now().toString(36)}`;
    const newDoc = {
      id,
      projectId: docData.projectId || activeProject.id || null,
      name: docData.name || "Untitled QA Document",
      type: docData.type || "Test Strategy",
      version: docData.version || "v1.0",
      ownerId: docData.ownerId || activeUser.id,
      customer: docData.customer || activeProject.customer || activeProject.name || "",
      release: docData.release || activeProject.currentRelease || "v1.0.0",
      status: docData.status || "Draft",
      visibility: docData.visibility || "INTERNAL",
      lastUpdated: new Date().toISOString().replace("T", " ").substring(0, 16),
      authorName: docData.authorName || activeUser.name,
      leadTester: docData.leadTester || activeUser.name,
      reviewerName: docData.reviewerName || "",
      description: docData.description || "",
      prerequisites: docData.prerequisites || "",
      environment: docData.environment || "Staging QA Lab",
      testMatrix: docData.testMatrix || [],
      qualityGateVerdict: docData.qualityGateVerdict || "READY FOR RELEASE",
      approvals: [],
      sections: docData.sections && docData.sections.length > 0 ? docData.sections : [
        { id: "sec-1", title: "Executive Summary", content: "Document summary and testing objectives." }
      ],
      activityHistory: [
        { action: "Document created", user: activeUser.name, time: "Just now" }
      ],
      versionHistory: [
        { version: docData.version || "v1.0", date: new Date().toISOString().split("T")[0], author: activeUser.name, changes: "Initial creation.", status: docData.status || "Draft" }
      ]
    };

    if (!this.data.documents) this.data.documents = [];
    this.data.documents.unshift(newDoc);
    this.saveState();
    return newDoc;
  }

  updateDocument(id, updates) {
    const doc = this.getDocumentById(id);
    if (!doc) return null;
    Object.assign(doc, updates);
    doc.lastUpdated = new Date().toISOString().replace("T", " ").substring(0, 16);
    this.saveState();
    return doc;
  }

  deleteDocument(id) {
    const idx = (this.data.documents || []).findIndex(d => d.id === id);
    if (idx !== -1) {
      this.data.documents.splice(idx, 1);
      this.saveState();
      return true;
    }
    return false;
  }

  submitDocumentForReview(id, reviewerId = null) {
    const doc = this.getDocumentById(id);
    if (!doc) return null;
    const reviewer = reviewerId ? this.getUserById(reviewerId) : null;
    doc.status = "In Review";
    doc.reviewRequestedAt = new Date().toISOString();
    doc.reviewerId = reviewer ? reviewer.id : null;
    if (!doc.activityHistory) doc.activityHistory = [];
    doc.activityHistory.unshift({
      action: `Submitted for review${reviewer ? ` to ${reviewer.name}` : ''}`,
      user: this.getActiveUser().name,
      time: "Just now"
    });
    this.saveState();
    return doc;
  }

  approveDocument(id, reviewerId = null, comment = "Approved for delivery.") {
    const doc = this.getDocumentById(id);
    if (!doc) return null;
    const reviewer = reviewerId ? this.getUserById(reviewerId) : this.getActiveUser();
    doc.status = "Approved";
    doc.approvedAt = new Date().toISOString();
    doc.approvedBy = reviewer.name;
    if (!doc.approvals) doc.approvals = [];
    doc.approvals.push({
      reviewerId: reviewer.id,
      reviewerName: reviewer.name,
      decision: "APPROVED",
      comment,
      timestamp: new Date().toISOString()
    });
    if (!doc.activityHistory) doc.activityHistory = [];
    doc.activityHistory.unshift({
      action: `Approved by ${reviewer.name}: "${comment}"`,
      user: reviewer.name,
      time: "Just now"
    });
    this.saveState();
    return doc;
  }

  requestDocumentChanges(id, reviewerId = null, comment = "Revisions required.") {
    const doc = this.getDocumentById(id);
    if (!doc) return null;
    const reviewer = reviewerId ? this.getUserById(reviewerId) : this.getActiveUser();
    doc.status = "Draft";
    if (!doc.activityHistory) doc.activityHistory = [];
    doc.activityHistory.unshift({
      action: `Changes requested by ${reviewer.name}: "${comment}"`,
      user: reviewer.name,
      time: "Just now"
    });
    this.saveState();
    return doc;
  }

  // ONE SOURCE OF TRUTH: Interpolates Live Project & QA Metrics into Document Text
  interpolateDocumentTokens(content, projectId = null) {
    if (!content) return "";
    const activeProject = (projectId ? this.getProjectById(projectId) : null) || this.getActiveProject() || (this.getProjects() || [])[0] || { id: "prj-main", name: "Active Project", key: "PRJ" };
    const stats = this.getProjectStats(activeProject.id);
    const tmStats = this.getTestManagementStats(activeProject.id);

    const tokens = {
      "{{PROJECT_NAME}}": activeProject.name,
      "{{PROJECT_KEY}}": activeProject.key || "PRJ",
      "{{CUSTOMER_NAME}}": activeProject.customer || activeProject.name,
      "{{RELEASE_VERSION}}": activeProject.currentRelease || "v1.0.0",
      "{{TOTAL_TESTS}}": String(tmStats.totalCases),
      "{{PASSED_TESTS}}": String(tmStats.passed),
      "{{FAILED_TESTS}}": String(tmStats.failed),
      "{{BLOCKED_TESTS}}": String(tmStats.blocked),
      "{{PASS_RATE}}": `${tmStats.passRate}%`,
      "{{CRITICAL_BUGS}}": String(stats.criticalBugs),
      "{{OPEN_BUGS}}": String(stats.activeBugs),
      "{{REOPENED_BUGS}}": String(stats.reopenedBugs),
      "{{QA_STATUS}}": tmStats.passRate >= 95 ? "READY FOR RELEASE" : (tmStats.passRate >= 88 ? "READY WITH KNOWN ISSUES" : "NOT READY FOR RELEASE")
    };

    let result = content;
    Object.keys(tokens).forEach(tok => {
      result = result.split(tok).join(tokens[tok]);
    });
    return result;
  }

  // =========================================================================
  // PULSEWAVE V2 — STATS & UNIFIED QA SEARCH
  // =========================================================================
  getTestManagementStats(projectId = null) {
    const testCases = this.getTestCases(projectId);
    const totalCases = testCases.length;
    const passed = testCases.filter(tc => tc.lastResult === "Passed" || tc.lastResult === "Pass").length;
    const failed = testCases.filter(tc => tc.lastResult === "Failed" || tc.lastResult === "Fail").length;
    const blocked = testCases.filter(tc => tc.lastResult === "Blocked").length;
    const skipped = testCases.filter(tc => tc.lastResult === "Skipped").length;
    const notRun = testCases.filter(tc => tc.lastResult === "Not Run" || !tc.lastResult).length;
    const executed = passed + failed + blocked + skipped;
    const passRate = executed > 0 ? Math.round((passed / executed) * 100) : 0;

    return {
      totalCases,
      executed,
      passed,
      failed,
      blocked,
      skipped,
      notRun,
      passRate
    };
  }

  getMyQaWorkspaceStats(userId = null) {
    const user = userId ? this.getUserById(userId) : this.getActiveUser();
    const myCases = (this.data.testCases || []).filter(tc => tc.assigneeId === user.id || tc.ownerId === user.id || !tc.assigneeId);
    const assigned = myCases.length;
    const pendingExecution = myCases.filter(tc => tc.lastResult === "Not Run" || !tc.lastResult).length;
    const failed = myCases.filter(tc => tc.lastResult === "Failed" || tc.lastResult === "Fail").length;
    const retestRequired = (this.data.issues || []).filter(i => (i.status === "QA" || i.status === "Fixed") && (i.qaId === user.id || !i.qaId)).length;
    const reportsPending = (this.data.documents || []).filter(d => d.status === "In Review").length;

    return {
      assigned,
      pendingExecution,
      failed,
      retestRequired,
      reportsPending
    };
  }

  searchQaAndDocs(query, projectId = null) {
    if (!query || query.trim().length === 0) return { testCases: [], suites: [], plans: [], docs: [], defects: [] };
    const q = query.toLowerCase().trim();

    const testCases = (this.data.testCases || []).filter(tc => {
      const matchProj = !projectId || projectId === "all" || tc.projectId === projectId;
      const matchText = tc.id.toLowerCase().includes(q) || tc.title.toLowerCase().includes(q) || tc.module.toLowerCase().includes(q) || (tc.tags && tc.tags.some(t => t.toLowerCase().includes(q)));
      return matchProj && matchText;
    });

    const suites = (this.data.testSuites || []).filter(ts => {
      const matchProj = !projectId || projectId === "all" || ts.projectId === projectId;
      const matchText = ts.name.toLowerCase().includes(q) || ts.description.toLowerCase().includes(q);
      return matchProj && matchText;
    });

    const plans = (this.data.testPlans || []).filter(tp => {
      const matchProj = !projectId || projectId === "all" || tp.projectId === projectId;
      const matchText = tp.name.toLowerCase().includes(q) || tp.customer.toLowerCase().includes(q) || tp.release.toLowerCase().includes(q);
      return matchProj && matchText;
    });

    const docs = (this.data.documents || []).filter(d => {
      const matchProj = !projectId || projectId === "all" || d.projectId === projectId;
      const matchText = d.name.toLowerCase().includes(q) || d.type.toLowerCase().includes(q) || d.customer.toLowerCase().includes(q);
      return matchProj && matchText;
    });

    const defects = (this.data.issues || []).filter(i => {
      const matchProj = !projectId || projectId === "all" || i.projectId === projectId;
      const matchText = i.key.toLowerCase().includes(q) || i.title.toLowerCase().includes(q);
      return matchProj && i.type === "Bug" && matchText;
    });

    return { testCases, suites, plans, docs, defects };
  }
  // =========================================================================
  // PULSEWAVE V2 — TEST REPORTS & DEDICATED REPORT CREATOR METHODS
  // =========================================================================
  getTestReports(projectId = null) {
    if (!this.data.testReports) this.data.testReports = [];
    if (!projectId || projectId === "all") return this.data.testReports;
    return this.data.testReports.filter(r => r.projectId === projectId);
  }

  getTestReportById(id) {
    if (!this.data.testReports) this.data.testReports = [];
    return this.data.testReports.find(r => r.id === id) || null;
  }

  createTestReport(reportData) {
    if (!this.data.testReports) this.data.testReports = [];
    const activeProject = reportData.projectId ? this.getProjectById(reportData.projectId) : this.getActiveProject();
    const activeUser = this.getActiveUser();
    const count = this.data.testReports.length + 1;
    const reportId = `TR-00${count}`;

    const newReport = {
      id: reportId,
      reportTitle: reportData.reportTitle || `${activeProject.name} QA Test Report`,
      projectId: activeProject.id,
      projectName: activeProject.name,
      customer: reportData.customer || activeProject.customer || "Acme Retail",
      release: reportData.release || "v2.4.1",
      reportType: reportData.reportType || "Full QA Test Report",
      environment: reportData.environment || "Staging",
      startDate: reportData.startDate || new Date().toISOString().split("T")[0],
      endDate: reportData.endDate || new Date().toISOString().split("T")[0],
      preparedBy: reportData.preparedBy || activeUser.name,
      reviewer: reportData.reviewer || "Arslan Ali",
      department: reportData.department || "Quality Assurance",
      description: reportData.description || `Comprehensive QA verification deliverable for ${activeProject.name}.`,
      status: reportData.status || "Draft",
      passRate: reportData.passRate || 100,
      lastUpdated: new Date().toISOString().replace("T", " ").substring(0, 16),
      finalizedBy: null,
      finalizedDate: null,
      version: reportData.version || "v1.0",
      versionHistory: [
        { version: reportData.version || "v1.0", status: reportData.status || "Draft", date: new Date().toISOString().split("T")[0], author: activeUser.name, changes: "Initial report draft created." }
      ],
      executiveSummary: reportData.executiveSummary || `Testing was conducted for ${activeProject.name} release ${reportData.release || 'v2.4.1'}. All core functional and regression test scenarios were verified.`,
      testingScope: reportData.testingScope || `${activeProject.name} core services, API integrations, and user interfaces.`,
      testingEnvironment: reportData.testingEnvironment || "Staging Lab environment mirroring production configurations.",
      qaObservations: reportData.qaObservations || "- Core functionality verified successfully.\n- Integration latency within acceptable SLA.\n- Zero critical production blockers identified.",
      risks: reportData.risks || "Low risk for release candidate deployment.",
      recommendations: reportData.recommendations || "Proceed with scheduled production deployment.",
      finalQAStatus: reportData.finalQAStatus || "READY FOR RELEASE",
      knownIssues: reportData.knownIssues || [],
      defectSummary: reportData.defectSummary || { critical: 0, high: 0, medium: 1, low: 1, total: 2, open: 1, closed: 1, reopened: 0 },
      testCases: reportData.testCases && reportData.testCases.length > 0 ? reportData.testCases : [
        {
          id: "TC-001",
          title: "Simple Item Order Posting with Shipping",
          description: "Verify that a simple item sale order with shipping is successfully created and synchronized across all required systems.",
          prerequisites: "- Valid login credentials are available.\n- Product is active in catalog.\n- Required customer information is available.\n- Payment method is available.",
          locationArea: "Magento → Omni → Retail Pro",
          dependencies: "- Order synchronization service\n- Payment service\n- Product mapping\n- Network connectivity",
          requiredConfig: "- SKU mapping\n- Payment configuration\n- Shipping configuration\n- Integration configuration",
          softwareApp: activeProject.name,
          testerName: activeUser.name,
          testReviewer: "Arslan Ali",
          testDate: new Date().toISOString().split("T")[0],
          status: "Passed",
          testDataColumns: ["SKU", "Order Number", "Item Type", "Qty", "Price"],
          testDataRows: [
            ["029417", "PRE10000830", "Simple Item", "1", "£5,200"]
          ],
          resultRows: [
            {
              id: "res-1",
              userInput: "1. Navigate to store portal.\n2. Search SKU 029417.\n3. Add quantity 1 to cart.\n4. Complete checkout.",
              expectedResult: "1. Product available.\n2. Order created successfully with invoice.",
              actualResult: "1. Product available.\n2. Order created successfully (#PRE10000830).",
              status: "Pass"
            }
          ],
          resultsSummary: "The simple item sale order was successfully created and synchronized across all systems.",
          evidence: [],
          linkedDefects: []
        }
      ]
    };

    this.data.testReports.unshift(newReport);
    this.saveState();
    return newReport;
  }

  updateTestReport(id, updates) {
    const report = this.getTestReportById(id);
    if (!report) return null;
    Object.assign(report, updates);
    report.lastUpdated = new Date().toISOString().replace("T", " ").substring(0, 16);
    this.saveState();
    return report;
  }

  deleteTestReport(id) {
    if (!this.data.testReports) return false;
    const idx = this.data.testReports.findIndex(r => r.id === id);
    if (idx !== -1) {
      this.data.testReports.splice(idx, 1);
      this.saveState();
      return true;
    }
    return false;
  }

  duplicateTestReport(id) {
    const orig = this.getTestReportById(id);
    if (!orig) return null;
    const clone = JSON.parse(JSON.stringify(orig));
    const count = this.data.testReports.length + 1;
    clone.id = `TR-00${count}`;
    clone.reportTitle = `${orig.reportTitle} (Copy)`;
    clone.status = "Draft";
    clone.version = "v1.0";
    clone.lastUpdated = new Date().toISOString().replace("T", " ").substring(0, 16);
    clone.versionHistory = [
      { version: "v1.0", status: "Draft", date: new Date().toISOString().split("T")[0], author: this.getActiveUser().name, changes: `Duplicated from ${orig.id}.` }
    ];
    this.data.testReports.unshift(clone);
    this.saveState();
    return clone;
  }

  duplicateReportTestCase(reportId, testCaseId) {
    const report = this.getTestReportById(reportId);
    if (!report || !report.testCases) return null;
    const tc = report.testCases.find(t => t.id === testCaseId);
    if (!tc) return null;
    const clone = JSON.parse(JSON.stringify(tc));
    const nextNum = report.testCases.length + 1;
    clone.id = `TC-00${nextNum}`;
    clone.title = `${tc.title} (Copy)`;
    report.testCases.push(clone);
    report.lastUpdated = new Date().toISOString().replace("T", " ").substring(0, 16);
    this.saveState();
    return clone;
  }

  deleteReportTestCase(reportId, testCaseId) {
    const report = this.getTestReportById(reportId);
    if (!report || !report.testCases) return false;
    const idx = report.testCases.findIndex(t => t.id === testCaseId);
    if (idx !== -1) {
      report.testCases.splice(idx, 1);
      report.lastUpdated = new Date().toISOString().replace("T", " ").substring(0, 16);
      this.saveState();
      return true;
    }
    return false;
  }

  reorderReportTestCases(reportId, fromIndex, toIndex) {
    const report = this.getTestReportById(reportId);
    if (!report || !report.testCases) return false;
    const [moved] = report.testCases.splice(fromIndex, 1);
    report.testCases.splice(toIndex, 0, moved);
    report.lastUpdated = new Date().toISOString().replace("T", " ").substring(0, 16);
    this.saveState();
    return true;
  }

  submitReportForReview(id, reviewerName = "Arslan Ali") {
    const report = this.getTestReportById(id);
    if (!report) return null;
    report.status = "In Review";
    report.reviewer = reviewerName;
    report.lastUpdated = new Date().toISOString().replace("T", " ").substring(0, 16);
    if (!report.versionHistory) report.versionHistory = [];
    report.versionHistory.unshift({
      version: report.version,
      status: "In Review",
      date: new Date().toISOString().split("T")[0],
      author: this.getActiveUser().name,
      changes: `Submitted for formal review to ${reviewerName}.`
    });
    this.saveState();
    return report;
  }

  approveReport(id, reviewerName = null, comment = "Approved for release delivery.") {
    const report = this.getTestReportById(id);
    if (!report) return null;
    report.status = "Approved";
    report.lastUpdated = new Date().toISOString().replace("T", " ").substring(0, 16);
    if (!report.versionHistory) report.versionHistory = [];
    report.versionHistory.unshift({
      version: report.version,
      status: "Approved",
      date: new Date().toISOString().split("T")[0],
      author: reviewerName || this.getActiveUser().name,
      changes: `Approved by reviewer: "${comment}"`
    });
    this.saveState();
    return report;
  }

  requestReportChanges(id, reviewerName = null, comment = "Revisions required.") {
    const report = this.getTestReportById(id);
    if (!report) return null;
    report.status = "Changes Required";
    report.lastUpdated = new Date().toISOString().replace("T", " ").substring(0, 16);
    if (!report.versionHistory) report.versionHistory = [];
    report.versionHistory.unshift({
      version: report.version,
      status: "Changes Required",
      date: new Date().toISOString().split("T")[0],
      author: reviewerName || this.getActiveUser().name,
      changes: `Revisions requested by reviewer: "${comment}"`
    });
    this.saveState();
    return report;
  }

  finalizeReport(id) {
    const report = this.getTestReportById(id);
    if (!report) return null;
    report.status = "Final";
    report.finalizedBy = this.getActiveUser().name;
    report.finalizedDate = new Date().toISOString().split("T")[0];
    report.lastUpdated = new Date().toISOString().replace("T", " ").substring(0, 16);
    if (!report.versionHistory) report.versionHistory = [];
    report.versionHistory.unshift({
      version: report.version,
      status: "Final",
      date: new Date().toISOString().split("T")[0],
      author: this.getActiveUser().name,
      changes: "Report certified and finalized for delivery."
    });
    this.saveState();
    return report;
  }

  createNewReportVersion(id) {
    const report = this.getTestReportById(id);
    if (!report) return null;
    const curVerNum = parseFloat(report.version.replace("v", "")) || 1.0;
    const nextVer = `v${(curVerNum + 0.1).toFixed(1)}`;
    report.version = nextVer;
    report.status = "Draft";
    report.lastUpdated = new Date().toISOString().replace("T", " ").substring(0, 16);
    if (!report.versionHistory) report.versionHistory = [];
    report.versionHistory.unshift({
      version: nextVer,
      status: "Draft",
      date: new Date().toISOString().split("T")[0],
      author: this.getActiveUser().name,
      changes: `Created new revision ${nextVer} based on previous final.`
    });
    this.saveState();
    return report;
  }

  calculateReportStats(report) {
    if (!report) return { total: 0, passed: 0, failed: 0, blocked: 0, notExecuted: 0, passRate: 0 };
    const cases = report.testCases || [];
    const total = cases.length;
    const passed = cases.filter(c => c.status === "Passed" || c.status === "Pass").length;
    const failed = cases.filter(c => c.status === "Failed" || c.status === "Fail").length;
    const blocked = cases.filter(c => c.status === "Blocked").length;
    const notExecuted = cases.filter(c => c.status === "Not Executed" || !c.status).length;
    const passRate = total > 0 ? Math.round((passed / total) * 100) : (report.passRate || 100);
    return { total, passed, failed, blocked, notExecuted, passRate };
  }

  // =========================================================================
  // QA REPORT GENERATOR & SUPABASE PERSISTENCE ENGINE (Section 1 to 24)
  // =========================================================================

  calculateQAReportStats(testCases = []) {
    const total = testCases.length;
    let passed = 0;
    let failed = 0;
    let blocked = 0;
    let notExecuted = 0;

    testCases.forEach(tc => {
      // Determine overall status from test case or first execution
      const status = (tc.status || (tc.executions && tc.executions[0] ? tc.executions[0].status : "NOT EXECUTED")).toUpperCase();
      if (status === "PASS" || status === "PASSED") passed++;
      else if (status === "FAIL" || status === "FAILED") failed++;
      else if (status === "BLOCKED") blocked++;
      else notExecuted++;
    });

    const passRate = total > 0 ? Math.round((passed / total) * 100) : 100;
    return { total, passed, failed, blocked, notExecuted, passRate };
  }

  getQAReports(projectId = null) {
    if (!this.data.qaReports) this.data.qaReports = [];
    
    // Role & Project Authorization
    const activeSpace = this.getActiveWorkspace();
    const authorizedProjects = this.getAuthorizedProjects ? this.getAuthorizedProjects() : this.getProjects();
    const authorizedProjectIds = authorizedProjects.map(p => p.id);

    let reports = this.data.qaReports.filter(r => {
      if (activeSpace && r.workspace_id && r.workspace_id !== activeSpace.id) return false;
      if (authorizedProjectIds.length > 0 && r.project_id && !authorizedProjectIds.includes(r.project_id)) return false;
      if (projectId && projectId !== "all" && r.project_id !== projectId) return false;
      return true;
    });

    // Populate project name if missing
    reports.forEach(r => {
      if (!r.projectName && r.project_id) {
        const proj = this.getProjectById(r.project_id);
        if (proj) r.projectName = proj.name;
      }
    });

    return reports.sort((a, b) => new Date(b.created_at || b.updated_at || 0) - new Date(a.created_at || a.updated_at || 0));
  }

  getQAReportById(reportId) {
    if (!reportId || !this.data.qaReports) return null;
    const report = this.data.qaReports.find(r => r.id === reportId);
    if (!report) return null;

    // Attach full nested test cases with clean mapping (no in-place mutation)
    const testCases = (this.data.qaTestCases || [])
      .filter(tc => tc.report_id === reportId)
      .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
      .map(tc => {
        const testData = (this.data.qaTestData || [])
          .filter(td => td.test_case_id === tc.id)
          .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
          .map(td => ({ ...td }));

        const executions = (this.data.qaTestExecutions || [])
          .filter(te => te.test_case_id === tc.id)
          .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
          .map(te => ({ ...te }));

        return { ...tc, testData, executions };
      });

    const populated = { ...report, testCases };
    const stats = this.calculateQAReportStats(testCases);
    populated.total_test_cases = stats.total;
    populated.passed_count = stats.passed;
    populated.failed_count = stats.failed;
    populated.blocked_count = stats.blocked;
    populated.not_executed_count = stats.notExecuted;
    populated.passRate = stats.passRate;

    return populated;
  }

  async syncQAReportsFromSupabase(projectId = null) {
    if (typeof window === 'undefined' || !window.supabaseClient) return this.getQAReports(projectId);
    
    try {
      let query = window.supabaseClient.from('qa_reports').select('*').order('created_at', { ascending: false });
      if (projectId && projectId !== 'all') {
        query = query.eq('project_id', projectId);
      }
      const { data: cloudReports, error } = await query;
      if (!error && cloudReports && Array.isArray(cloudReports)) {
        // Merge cloud reports into local store
        if (!this.data.qaReports) this.data.qaReports = [];
        cloudReports.forEach(cr => {
          const idx = this.data.qaReports.findIndex(r => r.id === cr.id);
          if (idx >= 0) {
            this.data.qaReports[idx] = { ...this.data.qaReports[idx], ...cr };
          } else {
            this.data.qaReports.unshift(cr);
          }
        });
        this.saveState();
      }
    } catch (err) {
      console.warn("Supabase QA Reports sync warning:", err);
    }

    return this.getQAReports(projectId);
  }

  async fetchFullQAReportFromSupabase(reportId) {
    if (!reportId) return null;
    if (typeof window === 'undefined' || !window.supabaseClient) return this.getQAReportById(reportId);

    try {
      const { data: repData, error: repErr } = await window.supabaseClient
        .from('qa_reports')
        .select('*')
        .eq('id', reportId)
        .single();

      if (!repErr && repData) {
        // Merge into local
        if (!this.data.qaReports) this.data.qaReports = [];
        const rIdx = this.data.qaReports.findIndex(r => r.id === repData.id);
        if (rIdx >= 0) this.data.qaReports[rIdx] = repData;
        else this.data.qaReports.push(repData);

        // Fetch Test Cases
        const { data: tcData } = await window.supabaseClient
          .from('qa_test_cases')
          .select('*')
          .eq('report_id', reportId)
          .order('order_index', { ascending: true });

        if (tcData && Array.isArray(tcData)) {
          if (!this.data.qaTestCases) this.data.qaTestCases = [];
          this.data.qaTestCases = this.data.qaTestCases.filter(tc => tc.report_id !== reportId).concat(tcData);

          const tcIds = tcData.map(tc => tc.id);
          if (tcIds.length > 0) {
            // Fetch Test Data
            const { data: tdData } = await window.supabaseClient
              .from('qa_test_data')
              .select('*')
              .in('test_case_id', tcIds)
              .order('order_index', { ascending: true });

            if (tdData) {
              if (!this.data.qaTestData) this.data.qaTestData = [];
              this.data.qaTestData = this.data.qaTestData.filter(td => !tcIds.includes(td.test_case_id)).concat(tdData);
            }

            // Fetch Test Executions
            const { data: teData } = await window.supabaseClient
              .from('qa_test_executions')
              .select('*')
              .in('test_case_id', tcIds)
              .order('order_index', { ascending: true });

            if (teData) {
              if (!this.data.qaTestExecutions) this.data.qaTestExecutions = [];
              this.data.qaTestExecutions = this.data.qaTestExecutions.filter(te => !tcIds.includes(te.test_case_id)).concat(teData);
            }
          }
        }
        this.saveState();
      }
    } catch (err) {
      console.warn("Supabase fetch full report warning:", err);
    }

    return this.getQAReportById(reportId);
  }

  async createQAReport({
    workspaceId = null,
    projectId,
    reportName,
    reportType = "test-execution",
    templateName = "Annoushka Corporate Standard",
    totalInitialCases = 10,
    releaseVersion = "v1.0.0",
    leadTester = null,
    testReviewer = null,
    testingPeriod = null,
    executiveSummary = "",
    verdict = "READY FOR RELEASE",
    clientName = "",
    milestone = "",
    defectsList = null,
    rootCauseAnalysis = "",
    triageNotes = "",
    qualityChecklist = null,
    knownRisks = null,
    stakeholderSignoffs = null,
    moduleCoverage = null,
    highlights = null,
    recommendations = ""
  }) {
    const activeUser = this.getActiveUser();
    const activeSpace = this.getActiveWorkspace();
    const project = this.getProjectById(projectId);

    const now = new Date().toISOString();
    const reportId = `qar_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const wsId = workspaceId || (activeSpace ? activeSpace.id : null);
    const creatorName = activeUser ? activeUser.name : "QA Engineer";
    const creatorId = activeUser ? activeUser.id : "usr_qa";

    // Auto-generate template-specific defaults if not provided
    const projectIssues = this.getIssues ? this.getIssues(projectId) : [];
    const projectBugs = projectIssues.filter(i => (i.type || "").toLowerCase() === "bug");
    const tmStats = this.getTestManagementStats ? this.getTestManagementStats(projectId) : { totalCases: 0, passed: 0, failed: 0, blocked: 0, passRate: 100 };

    const initialDefects = defectsList || projectBugs.map(b => ({
      id: b.id,
      key: b.key || 'BUG',
      title: b.title,
      priority: b.priority || 'Medium',
      severity: b.priority === 'Critical' ? 'Critical (Blocker)' : (b.priority === 'High' ? 'Major' : 'Normal'),
      status: b.status || 'Open',
      assigneeName: (this.getUserById(b.assigneeId || b.developerId) || {}).name || 'Assigned Dev',
      qaName: (this.getUserById(b.qaId) || {}).name || creatorName,
      reopenCount: b.reopenCount || 0,
      rootCause: b.rootCause || 'Logic / Code validation'
    }));

    const initialChecklist = qualityChecklist || [
      { id: 'qc_1', title: 'Critical Defects Policy (P0)', description: 'Zero open blocker defects', status: projectBugs.filter(b => b.priority === 'Critical' && b.status !== 'Done' && b.status !== 'Closed').length === 0 ? 'PASSED' : 'BLOCKED', required: true },
      { id: 'qc_2', title: 'Test Execution Coverage', description: 'Overall test case pass rate ≥ 90%', status: tmStats.passRate >= 90 ? 'PASSED' : 'IN_PROGRESS', required: true },
      { id: 'qc_3', title: 'Sprint QA Verification', description: 'All in-scope sprint items QA verified', status: 'PASSED', required: true },
      { id: 'qc_4', title: 'Regression Cycle Health', description: 'Core functional regression passed with zero blocker defects', status: 'PASSED', required: true },
      { id: 'qc_5', title: 'Performance & Security Smoke Check', description: 'API latency and authentication checks verified', status: 'PASSED', required: false }
    ];

    const initialRisks = knownRisks || [
      { id: 'rk_1', risk: 'Minor cosmetic alignment on legacy mobile browsers', severity: 'Low', mitigation: 'Documented in release notes; patch scheduled for next sprint', owner: creatorName },
      { id: 'rk_2', risk: 'Third-party payment gateway sandbox rate limiting', severity: 'Medium', mitigation: 'Fallback retry mechanism validated in staging environment', owner: 'Dev Team' }
    ];

    const initialSignoffs = stakeholderSignoffs || [
      { role: 'QA Lead', name: leadTester || creatorName, status: 'APPROVED', date: now.split('T')[0], comments: 'All mandatory quality gates satisfied.' },
      { role: 'Engineering Lead', name: testReviewer || 'Tech Lead', status: 'APPROVED', date: now.split('T')[0], comments: 'Release branch tagged and verified.' },
      { role: 'Product Manager', name: 'Product Owner', status: 'APPROVED', date: now.split('T')[0], comments: 'Scope accepted for production rollout.' }
    ];

    const initialModuleCoverage = moduleCoverage || [
      { module: 'Authentication & Access Control', totalCases: 14, passed: 14, failed: 0, passRate: 100, status: 'VERIFIED' },
      { module: 'Product Catalog & Search Filters', totalCases: 22, passed: 22, failed: 0, passRate: 100, status: 'VERIFIED' },
      { module: 'Shopping Cart & Checkout Pipeline', totalCases: 35, passed: 34, failed: 1, passRate: 97, status: 'READY_WITH_NOTES' },
      { module: 'Order Processing & Notifications', totalCases: 18, passed: 18, failed: 0, passRate: 100, status: 'VERIFIED' }
    ];

    const initialHighlights = highlights || [
      'Successfully validated 100% of core business workflows across all supported platforms.',
      'Achieved high first-time verification pass rate with zero remaining critical blocker bugs.',
      'Regression test suite executed cleanly with robust system stability.',
      'Production deployment recommendation approved by QA and Engineering leads.'
    ];

    const reportRecord = {
      id: reportId,
      workspace_id: wsId,
      project_id: projectId,
      report_name: reportName || (project ? `${project.name} Test Report` : 'QA Test Report'),
      report_type: reportType,
      template_name: templateName,
      status: "DRAFT",
      created_by: creatorId,
      created_by_name: creatorName,
      created_at: now,
      updated_at: now,
      generated_at: null,
      pdf_storage_path: null,
      pdf_file_name: null,
      total_test_cases: totalInitialCases,
      passed_count: 0,
      failed_count: 0,
      blocked_count: 0,
      release_version: releaseVersion || "",
      lead_tester: leadTester || creatorName || "",
      test_reviewer: testReviewer || "",
      testing_period: testingPeriod || "",
      executiveSummary: executiveSummary || "",
      verdict: verdict || "READY FOR RELEASE",
      projectName: project ? project.name : "",
      client_name: clientName || (project ? project.name : "Client Organization"),
      milestone: milestone || `Release ${releaseVersion || 'v1.0'} Validation`,
      defects_list: initialDefects,
      root_cause_analysis: rootCauseAnalysis || "Primary defect drivers were isolated edge cases in cart state transitions and third-party response parsing. All critical paths resolved.",
      triage_notes: triageNotes || "Triage completed with zero open P0 blockers. Minor residual UI quirks deferred to subsequent maintenance release.",
      quality_checklist: initialChecklist,
      known_risks: initialRisks,
      stakeholder_signoffs: initialSignoffs,
      module_coverage: initialModuleCoverage,
      highlights: initialHighlights,
      recommendations: recommendations || "QA recommends Proceeding to Production Release based on comprehensive validation and meeting all quality sign-off thresholds."
    };

    if (!this.data.qaReports) this.data.qaReports = [];
    if (!this.data.qaTestCases) this.data.qaTestCases = [];
    if (!this.data.qaTestData) this.data.qaTestData = [];
    if (!this.data.qaTestExecutions) this.data.qaTestExecutions = [];

    this.data.qaReports.unshift(reportRecord);

    // Prepare initial N test cases with clean fields (ZERO dummy strings)
    const count = parseInt(totalInitialCases) || 10;
    const initialCases = [];
    const initialTestData = [];
    const initialExecutions = [];

    for (let i = 1; i <= count; i++) {
      const tcId = `tc_${reportId}_${i}`;
      
      const tcRecord = {
        id: tcId,
        report_id: reportId,
        workspace_id: wsId,
        project_id: projectId,
        title: `Test Case ${i}`,
        software_application: project ? project.name : "",
        tester_id: creatorId,
        tester_name: leadTester || creatorName || "",
        test_reviewer: testReviewer || "",
        test_date: now.split("T")[0],
        description: "",
        pre_requisites: "",
        location_area: "",
        dependencies: "",
        required_configuration: "",
        results_summary: "",
        comments: "",
        related_issue_id: null,
        order_index: i,
        created_by: creatorId,
        created_at: now,
        updated_at: now
      };

      initialCases.push(tcRecord);

      // Default clean Test Execution row (Initial state is NOT EXECUTED until entered by QA)
      const teId = `te_${tcId}_1`;
      const teRecord = {
        id: teId,
        test_case_id: tcId,
        executed_by: leadTester || creatorName || "",
        execution_date: now.split("T")[0],
        user_input: "",
        expected_result: "",
        actual_result: "",
        status: "",
        comments: "",
        order_index: 1,
        created_at: now,
        updated_at: now
      };
      initialExecutions.push(teRecord);
    }

    this.data.qaTestCases.push(...initialCases);
    this.data.qaTestExecutions.push(...initialExecutions);

    this.saveState();

    // Supabase Cloud Insertion
    if (typeof window !== 'undefined' && window.supabaseClient) {
      try {
        await window.supabaseClient.from('qa_reports').insert([reportRecord]);
        if (initialCases.length > 0) {
          await window.supabaseClient.from('qa_test_cases').insert(initialCases);
        }
        if (initialTestData.length > 0) {
          await window.supabaseClient.from('qa_test_data').insert(initialTestData);
        }
        if (initialExecutions.length > 0) {
          await window.supabaseClient.from('qa_test_executions').insert(initialExecutions);
        }
      } catch (err) {
        console.warn("Supabase QA Report creation error (cached locally):", err);
      }
    }

    return this.getQAReportById(reportId);
  }

  async saveQAReportDraft(reportData) {
    if (!reportData || !reportData.id) return null;
    const reportId = reportData.id;
    const now = new Date().toISOString();

    if (!this.data.qaReports) this.data.qaReports = [];
    if (!this.data.qaTestCases) this.data.qaTestCases = [];
    if (!this.data.qaTestData) this.data.qaTestData = [];
    if (!this.data.qaTestExecutions) this.data.qaTestExecutions = [];

    let rIdx = this.data.qaReports.findIndex(r => r.id === reportId);
    
    const updatedMeta = {
      ...reportData,
      updated_at: now,
      status: reportData.status || "DRAFT"
    };
    delete updatedMeta.testCases;

    if (rIdx >= 0) {
      this.data.qaReports[rIdx] = { ...this.data.qaReports[rIdx], ...updatedMeta };
    } else {
      this.data.qaReports.unshift(updatedMeta);
    }

    const allCleanCases = [];
    const allCleanTestData = [];
    const allCleanExecutions = [];

    // Save nested test cases if provided
    if (reportData.testCases && Array.isArray(reportData.testCases)) {
      reportData.testCases.forEach((tc, idx) => {
        tc.order_index = idx + 1;
        tc.updated_at = now;

        let tcIdx = this.data.qaTestCases.findIndex(t => t.id === tc.id);
        const cleanTc = { ...tc };
        delete cleanTc.testData;
        delete cleanTc.executions;

        if (tcIdx >= 0) {
          this.data.qaTestCases[tcIdx] = { ...this.data.qaTestCases[tcIdx], ...cleanTc };
        } else {
          this.data.qaTestCases.push(cleanTc);
        }
        allCleanCases.push(cleanTc);

        // Test Data rows
        if (tc.testData && Array.isArray(tc.testData)) {
          this.data.qaTestData = this.data.qaTestData.filter(td => td.test_case_id !== tc.id);
          tc.testData.forEach((td, tdIdx) => {
            const tdRow = {
              id: td.id || `td_${tc.id}_${Date.now()}_${tdIdx}`,
              test_case_id: tc.id,
              data_key: td.data_key || "Data",
              data_value: td.data_value || "",
              order_index: tdIdx + 1,
              created_at: td.created_at || now
            };
            this.data.qaTestData.push(tdRow);
            allCleanTestData.push(tdRow);
          });
        }

        // Executions
        if (tc.executions && Array.isArray(tc.executions)) {
          this.data.qaTestExecutions = this.data.qaTestExecutions.filter(te => te.test_case_id !== tc.id);
          tc.executions.forEach((te, teIdx) => {
            const teRow = {
              id: te.id || `te_${tc.id}_${Date.now()}_${teIdx}`,
              test_case_id: tc.id,
              executed_by: te.executed_by || "",
              execution_date: te.execution_date || now.split("T")[0],
              user_input: te.user_input || "",
              expected_result: te.expected_result || "",
              actual_result: te.actual_result || "",
              status: te.status || "PASS",
              comments: te.comments || "",
              order_index: teIdx + 1,
              created_at: te.created_at || now,
              updated_at: now
            };
            this.data.qaTestExecutions.push(teRow);
            allCleanExecutions.push(teRow);
          });
        }
      });
    }

    // Recalculate stats
    const fullRep = this.getQAReportById(reportId);
    if (fullRep) {
      const stats = this.calculateQAReportStats(fullRep.testCases);
      const repIdx = this.data.qaReports.findIndex(r => r.id === reportId);
      if (repIdx >= 0) {
        this.data.qaReports[repIdx].total_test_cases = stats.total;
        this.data.qaReports[repIdx].passed_count = stats.passed;
        this.data.qaReports[repIdx].failed_count = stats.failed;
        this.data.qaReports[repIdx].blocked_count = stats.blocked;
      }
    }

    this.saveState();

    // Sync to Supabase
    if (typeof window !== 'undefined' && window.supabaseClient) {
      try {
        await window.supabaseClient.from('qa_reports').upsert(updatedMeta);
        
        if (allCleanCases.length > 0) {
          await window.supabaseClient.from('qa_test_cases').upsert(allCleanCases);
        }
        if (allCleanTestData.length > 0) {
          await window.supabaseClient.from('qa_test_data').upsert(allCleanTestData);
        }
        if (allCleanExecutions.length > 0) {
          await window.supabaseClient.from('qa_test_executions').upsert(allCleanExecutions);
        }
      } catch (err) {
        console.warn("Supabase save draft error (persisted locally):", err);
      }
    }

    return this.getQAReportById(reportId);
  }

  async saveQATestCase(reportId, testCaseData) {
    if (!reportId || !testCaseData) return null;
    const now = new Date().toISOString();
    const tcId = testCaseData.id || `tc_${reportId}_${Date.now()}`;
    const report = this.getQAReportById(reportId);

    if (!this.data.qaTestCases) this.data.qaTestCases = [];
    if (!this.data.qaTestData) this.data.qaTestData = [];
    if (!this.data.qaTestExecutions) this.data.qaTestExecutions = [];

    const tcRecord = {
      ...testCaseData,
      id: tcId,
      report_id: reportId,
      workspace_id: report ? report.workspace_id : null,
      project_id: report ? report.project_id : null,
      updated_at: now
    };

    if (!tcRecord.created_at) tcRecord.created_at = now;

    // Clean nested
    const cleanTc = { ...tcRecord };
    delete cleanTc.testData;
    delete cleanTc.executions;

    let tcIdx = this.data.qaTestCases.findIndex(t => t.id === tcId);
    if (tcIdx >= 0) {
      this.data.qaTestCases[tcIdx] = cleanTc;
    } else {
      cleanTc.order_index = (this.data.qaTestCases.filter(t => t.report_id === reportId).length) + 1;
      this.data.qaTestCases.push(cleanTc);
    }

    const cleanTestData = [];
    // Save test data rows
    if (testCaseData.testData && Array.isArray(testCaseData.testData)) {
      this.data.qaTestData = this.data.qaTestData.filter(td => td.test_case_id !== tcId);
      testCaseData.testData.forEach((td, idx) => {
        const tdRow = {
          id: td.id || `td_${tcId}_${Date.now()}_${idx}`,
          test_case_id: tcId,
          data_key: td.data_key || "Data",
          data_value: td.data_value || "",
          order_index: idx + 1,
          created_at: td.created_at || now
        };
        this.data.qaTestData.push(tdRow);
        cleanTestData.push(tdRow);
      });
    }

    const cleanExecutions = [];
    // Save executions
    if (testCaseData.executions && Array.isArray(testCaseData.executions)) {
      this.data.qaTestExecutions = this.data.qaTestExecutions.filter(te => te.test_case_id !== tcId);
      testCaseData.executions.forEach((te, idx) => {
        const teRow = {
          id: te.id || `te_${tcId}_${Date.now()}_${idx}`,
          test_case_id: tcId,
          executed_by: te.executed_by || "",
          execution_date: te.execution_date || now.split("T")[0],
          user_input: te.user_input || "",
          expected_result: te.expected_result || "",
          actual_result: te.actual_result || "",
          status: te.status || "PASS",
          comments: te.comments || "",
          order_index: idx + 1,
          created_at: te.created_at || now,
          updated_at: now
        };
        this.data.qaTestExecutions.push(teRow);
        cleanExecutions.push(teRow);
      });
    }

    this.saveState();

    // Sync to Supabase
    if (typeof window !== 'undefined' && window.supabaseClient) {
      try {
        await window.supabaseClient.from('qa_test_cases').upsert(cleanTc);
        if (cleanTestData.length > 0) {
          await window.supabaseClient.from('qa_test_data').upsert(cleanTestData);
        }
        if (cleanExecutions.length > 0) {
          await window.supabaseClient.from('qa_test_executions').upsert(cleanExecutions);
        }
      } catch (err) {
        console.warn("Supabase save test case error:", err);
      }
    }

    return tcRecord;
  }

  async deleteQATestCase(reportId, testCaseId) {
    if (!testCaseId) return false;

    this.data.qaTestCases = (this.data.qaTestCases || []).filter(tc => tc.id !== testCaseId);
    this.data.qaTestData = (this.data.qaTestData || []).filter(td => td.test_case_id !== testCaseId);
    this.data.qaTestExecutions = (this.data.qaTestExecutions || []).filter(te => te.test_case_id !== testCaseId);

    // Re-index remaining cases
    const remaining = this.data.qaTestCases.filter(tc => tc.report_id === reportId);
    remaining.forEach((tc, idx) => {
      tc.order_index = idx + 1;
    });

    this.saveState();

    if (typeof window !== 'undefined' && window.supabaseClient) {
      try {
        await window.supabaseClient.from('qa_test_data').delete().eq('test_case_id', testCaseId);
        await window.supabaseClient.from('qa_test_executions').delete().eq('test_case_id', testCaseId);
        await window.supabaseClient.from('qa_test_cases').delete().eq('id', testCaseId);
      } catch (err) {
        console.warn("Supabase delete test case error:", err);
      }
    }

    return true;
  }

  async duplicateQATestCase(reportId, testCaseId) {
    const report = this.getQAReportById(reportId);
    if (!report) return null;

    const original = report.testCases.find(tc => tc.id === testCaseId);
    if (!original) return null;

    const now = new Date().toISOString();
    const newTcId = `tc_${reportId}_${Date.now()}`;
    const newCount = report.testCases.length + 1;

    const newTc = {
      ...original,
      id: newTcId,
      title: `${original.title} (Copy)`,
      order_index: newCount,
      created_at: now,
      updated_at: now
    };

    const newTestData = (original.testData || []).map((td, idx) => ({
      ...td,
      id: `td_${newTcId}_${idx + 1}`,
      test_case_id: newTcId,
      created_at: now
    }));

    const newExecutions = (original.executions || []).map((te, idx) => ({
      ...te,
      id: `te_${newTcId}_${idx + 1}`,
      test_case_id: newTcId,
      created_at: now,
      updated_at: now
    }));

    newTc.testData = newTestData;
    newTc.executions = newExecutions;

    await this.saveQATestCase(reportId, newTc);
    return newTc;
  }

  async reorderQATestCases(reportId, orderedTcIds) {
    if (!reportId || !Array.isArray(orderedTcIds)) return;
    
    orderedTcIds.forEach((id, idx) => {
      const tc = (this.data.qaTestCases || []).find(t => t.id === id);
      if (tc) tc.order_index = idx + 1;
    });

    this.saveState();

    if (typeof window !== 'undefined' && window.supabaseClient) {
      try {
        for (let i = 0; i < orderedTcIds.length; i++) {
          await window.supabaseClient
            .from('qa_test_cases')
            .update({ order_index: i + 1 })
            .eq('id', orderedTcIds[i]);
        }
      } catch (err) {
        console.warn("Supabase reorder error:", err);
      }
    }
  }

  async uploadQAReportPDF(reportId, pdfBlob, customFileName = null) {
    if (!reportId || !pdfBlob) throw new Error("Invalid report ID or PDF blob.");
    const report = this.getQAReportById(reportId);
    if (!report) throw new Error("Report record not found.");

    const timestamp = Date.now();
    const sanitizedTitle = (report.report_name || "QA_Report").replace(/[^a-zA-Z0-9_-]/g, "_");
    const fileName = customFileName || `${sanitizedTitle}_${reportId}_${timestamp}.pdf`;
    const storagePath = `reports/${report.project_id || 'general'}/${fileName}`;
    const generatedAt = new Date().toISOString();

    let uploadedPath = storagePath;
    let uploadSuccess = false;

    // Supabase Storage Bucket Upload
    if (typeof window !== 'undefined' && window.supabaseClient && window.supabaseClient.storage) {
      try {
        let { data, error } = await window.supabaseClient.storage
          .from('qa-reports')
          .upload(storagePath, pdfBlob, {
            contentType: 'application/pdf',
            upsert: true
          });

        if (error && (error.message?.includes('not found') || error.error === 'Bucket not found' || error.statusCode === '404')) {
          console.log("Bucket 'qa-reports' not found, attempting auto-creation...");
          try {
            await window.supabaseClient.storage.createBucket('qa-reports', { public: true });
            const retry = await window.supabaseClient.storage
              .from('qa-reports')
              .upload(storagePath, pdfBlob, {
                contentType: 'application/pdf',
                upsert: true
              });
            data = retry.data;
            error = retry.error;
          } catch (createBucketErr) {
            console.warn("Auto-create bucket exception:", createBucketErr);
          }
        }

        if (!error && data) {
          uploadedPath = data.path || storagePath;
          uploadSuccess = true;
        } else {
          console.warn("Supabase Storage bucket upload not available; using client-side deliverable:", error);
          uploadedPath = storagePath;
          uploadSuccess = false;
        }
      } catch (storageErr) {
        console.warn("Supabase Storage upload exception:", storageErr);
        uploadSuccess = false;
      }
    }

    // Convert PDF blob to Data URL for instant local view/download guarantee
    let dataUrl = null;
    try {
      dataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(pdfBlob);
      });
    } catch (readerErr) {
      console.warn("FileReader dataUrl conversion error:", readerErr);
    }

    // Update Report in local store & Supabase
    const repIdx = this.data.qaReports.findIndex(r => r.id === reportId);
    const updatedMeta = {
      status: "GENERATED",
      generated_at: generatedAt,
      pdf_storage_path: uploadedPath,
      pdf_file_name: fileName,
      pdf_data_url: dataUrl,
      upload_success: uploadSuccess,
      updated_at: generatedAt
    };

    if (repIdx >= 0) {
      this.data.qaReports[repIdx] = { ...this.data.qaReports[repIdx], ...updatedMeta };
    }
    this.saveState();

    if (typeof window !== 'undefined' && window.supabaseClient) {
      try {
        await window.supabaseClient
          .from('qa_reports')
          .update({
            status: "GENERATED",
            generated_at: generatedAt,
            pdf_storage_path: uploadedPath,
            pdf_file_name: fileName,
            updated_at: generatedAt
          })
          .eq('id', reportId);
      } catch (dbErr) {
        console.warn("Supabase metadata update error:", dbErr);
      }
    }

    return {
      reportId,
      storagePath: uploadedPath,
      fileName,
      generatedAt,
      uploadSuccess,
      dataUrl
    };
  }

  async getQAReportPDFUrl(reportOrStoragePath) {
    if (!reportOrStoragePath) return null;

    let storagePath = reportOrStoragePath;
    let localDataUrl = null;
    let isUploadSuccess = false;

    if (typeof reportOrStoragePath === 'object') {
      storagePath = reportOrStoragePath.pdf_storage_path;
      localDataUrl = reportOrStoragePath.pdf_data_url;
      isUploadSuccess = reportOrStoragePath.upload_success === true;
    } else {
      const rep = (this.data.qaReports || []).find(r => r.pdf_storage_path === storagePath || r.id === storagePath);
      if (rep) {
        localDataUrl = rep.pdf_data_url;
        storagePath = rep.pdf_storage_path;
        isUploadSuccess = rep.upload_success === true;
      }
    }

    // Only attempt Supabase public/signed URL if upload was successful
    if (isUploadSuccess && typeof window !== 'undefined' && window.supabaseClient && window.supabaseClient.storage && storagePath) {
      try {
        const { data: publicData } = window.supabaseClient.storage
          .from('qa-reports')
          .getPublicUrl(storagePath);

        if (publicData && publicData.publicUrl) {
          return publicData.publicUrl;
        }

        const { data: signedData, error } = await window.supabaseClient.storage
          .from('qa-reports')
          .createSignedUrl(storagePath, 3600);

        if (!error && signedData && signedData.signedUrl) {
          return signedData.signedUrl;
        }
      } catch (err) {
        console.warn("Supabase PDF URL retrieval error:", err);
      }
    }

    return localDataUrl || null;
  }

  async deleteQAReport(reportId) {
    if (!reportId) return false;

    // Delete test cases and children
    const cases = (this.data.qaTestCases || []).filter(tc => tc.report_id === reportId);
    const tcIds = cases.map(c => c.id);

    this.data.qaReports = (this.data.qaReports || []).filter(r => r.id !== reportId);
    this.data.qaTestCases = (this.data.qaTestCases || []).filter(tc => tc.report_id !== reportId);
    this.data.qaTestData = (this.data.qaTestData || []).filter(td => !tcIds.includes(td.test_case_id));
    this.data.qaTestExecutions = (this.data.qaTestExecutions || []).filter(te => !tcIds.includes(te.test_case_id));

    this.saveState();

    if (typeof window !== 'undefined' && window.supabaseClient) {
      try {
        if (tcIds.length > 0) {
          await window.supabaseClient.from('qa_test_data').delete().in('test_case_id', tcIds);
          await window.supabaseClient.from('qa_test_executions').delete().in('test_case_id', tcIds);
          await window.supabaseClient.from('qa_test_cases').delete().eq('report_id', reportId);
        }
        await window.supabaseClient.from('qa_reports').delete().eq('id', reportId);
      } catch (err) {
        console.warn("Supabase delete report error:", err);
      }
    }

    return true;
  }

  // =========================================================================
  // 13. PULSEWAVE PRODUCTION PROJECT CHAT SYSTEM
  // =========================================================================

  /**
   * Verify if a user is an authorized member of a project
   */
  isUserAuthorizedForProject(projectId, userId = null) {
    if (!projectId) return false;
    const activeUser = this.getActiveUser();
    const uid = userId || (activeUser ? activeUser.id : null);
    const targetUser = uid ? this.getUserById(uid) : activeUser;
    const uEmail = (targetUser?.email || (activeUser?.id === uid ? activeUser?.email : "") || "").toLowerCase().trim();

    if (!uid && !uEmail) return false;

    // Check project entity
    const project = (this.data.projects || []).find(p => p.id === projectId || p.key === projectId);
    const wsId = project ? (project.workspace_id || project.workspaceId) : this.data.activeWorkspaceId;

    // Space Lead / PM / Owner / QA has authorized project access across workspace
    if (wsId) {
      const spaceRole = this.getUserSpaceRole(wsId, uid);
      if (spaceRole === "PM" || spaceRole === "OWNER" || spaceRole === "QA") {
        return true;
      }
    }

    // Explicit project membership check in project_members
    const isMember = (this.data.projectMembers || []).some(pm => 
      (pm.projectId === projectId || pm.project_id === projectId) &&
      (pm.userId === uid || pm.user_id === uid || (uEmail && pm.email && pm.email.toLowerCase() === uEmail))
    );
    if (isMember) return true;

    // Project array / PM ID check
    if (project) {
      if (project.pmId === uid || (Array.isArray(project.members) && project.members.includes(uid))) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get all authorized members for a specific project
   */
  getProjectMembers(projectId) {
    if (!projectId) return [];
    const project = (this.data.projects || []).find(p => p.id === projectId || p.key === projectId);
    const wsId = project ? (project.workspace_id || project.workspaceId) : this.data.activeWorkspaceId;
    const membersMap = new Map();

    // 1. Explicit project_members
    (this.data.projectMembers || []).forEach(pm => {
      if (pm.projectId === projectId || pm.project_id === projectId) {
        const u = this.getUserById(pm.userId || pm.user_id || pm.email);
        if (u && !membersMap.has(u.id)) {
          membersMap.set(u.id, { ...u, projectRole: pm.role || u.role || "DEVELOPER" });
        }
      }
    });

    // 2. Project Lead PM and listed member IDs
    if (project) {
      if (project.pmId) {
        const pmUser = this.getUserById(project.pmId);
        if (pmUser && !membersMap.has(pmUser.id)) {
          membersMap.set(pmUser.id, { ...pmUser, projectRole: "PM" });
        }
      }
      if (Array.isArray(project.members)) {
        project.members.forEach(uid => {
          const u = this.getUserById(uid);
          if (u && !membersMap.has(u.id)) {
            membersMap.set(u.id, { ...u, projectRole: u.role || "DEVELOPER" });
          }
        });
      }
    }

    // 3. Space PM / Owner / QA Engineers
    if (wsId) {
      (this.data.workspaceMembers || []).forEach(wm => {
        if (wm.workspace_id === wsId && (wm.role === "OWNER" || wm.role === "PROJECT_MANAGER" || wm.role === "PM" || wm.role === "QA_ENGINEER" || wm.role === "QA")) {
          const u = this.getUserById(wm.user_id || wm.id || wm.email);
          if (u && !membersMap.has(u.id)) {
            membersMap.set(u.id, { ...u, projectRole: wm.role });
          }
        }
      });
      const ws = this.getWorkspaceById(wsId);
      if (ws && ws.owner_id) {
        const owner = this.getUserById(ws.owner_id);
        if (owner && !membersMap.has(owner.id)) {
          membersMap.set(owner.id, { ...owner, projectRole: "OWNER" });
        }
      }
    }

    // 4. Fallback if empty: return all workspace users who belong to active workspace
    if (membersMap.size === 0 && this.data.users) {
      this.data.users.forEach(u => {
        if (!membersMap.has(u.id)) {
          membersMap.set(u.id, { ...u, projectRole: u.role || "DEVELOPER" });
        }
      });
    }

    return Array.from(membersMap.values());
  }

  /**
   * Get or automatically initialize the single 'Project Chat' conversation for a project
   */
  getProjectChatConversation(projectId) {
    if (!projectId) return null;
    if (!this.data.chatConversations) this.data.chatConversations = [];
    if (!this.data.chatConversationMembers) this.data.chatConversationMembers = [];

    // Verify user authorization for this project
    const activeUser = this.getActiveUser();
    if (!this.isUserAuthorizedForProject(projectId, activeUser?.id)) {
      return null;
    }

    let chatConv = this.data.chatConversations.find(c => 
      (c.projectId === projectId || c.project_id === projectId) && 
      c.type === "PROJECT"
    );

    if (!chatConv) {
      const convId = `conv_chat_${projectId}`;
      chatConv = {
        id: convId,
        project_id: projectId,
        projectId: projectId,
        type: "PROJECT",
        name: "Project Chat",
        created_by: activeUser ? activeUser.id : "system",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      this.data.chatConversations.unshift(chatConv);

      // Auto-register project members in Project Chat conversation
      const members = this.getProjectMembers(projectId);
      members.forEach(m => {
        const exists = this.data.chatConversationMembers.some(cm => 
          (cm.conversation_id === convId || cm.conversationId === convId) && 
          (cm.user_id === m.id || cm.userId === m.id)
        );
        if (!exists) {
          this.data.chatConversationMembers.push({
            id: `cm_${convId}_${m.id}`,
            conversation_id: convId,
            conversationId: convId,
            user_id: m.id,
            userId: m.id,
            joined_at: new Date().toISOString(),
            last_read_at: new Date().toISOString()
          });
        }
      });

      this.saveState();

      // Sync to Supabase if available
      const sb = (typeof window !== 'undefined' && window.supabaseClient) || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
      if (sb && sb.from) {
        (async () => {
          try {
            await sb.from('chat_conversations').upsert({
              id: chatConv.id,
              project_id: projectId,
              type: 'PROJECT',
              name: 'Project Chat',
              created_by: chatConv.created_by,
              created_at: chatConv.created_at,
              updated_at: chatConv.updated_at
            });
          } catch (err) {
            console.warn("Supabase project chat sync warning:", err);
          }
        })();
      }
    }

    return chatConv;
  }

  /**
   * Alias for backwards compatibility
   */
  getProjectGeneralConversation(projectId) {
    return this.getProjectChatConversation(projectId);
  }

  /**
   * Get all conversations (General + DMs) accessible to user in a project
   */
  getProjectConversations(projectId, userId = null) {
    if (!projectId) return [];
    const activeUser = this.getActiveUser();
    const uid = userId || (activeUser ? activeUser.id : null);

    if (!this.isUserAuthorizedForProject(projectId, uid)) {
      return [];
    }

    // Ensure general channel exists
    this.getProjectGeneralConversation(projectId);

    if (!this.data.chatConversations) this.data.chatConversations = [];
    if (!this.data.chatConversationMembers) this.data.chatConversationMembers = [];

    const convs = this.data.chatConversations.filter(c => {
      const cProjId = c.project_id || c.projectId;
      if (cProjId !== projectId) return false;

      if (c.type === "PROJECT") return true;

      if (c.type === "DIRECT") {
        return this.data.chatConversationMembers.some(cm => 
          (cm.conversation_id === c.id || cm.conversationId === c.id) && 
          (cm.user_id === uid || cm.userId === uid)
        );
      }
      return false;
    });

    // Enrich with last message, unread count, and peer user info
    return convs.map(c => {
      const messages = (this.data.chatMessages || [])
        .filter(m => (m.conversation_id === c.id || m.conversationId === c.id) && !m.deleted_at)
        .sort((a, b) => new Date(a.created_at || a.createdAt).getTime() - new Date(b.created_at || b.createdAt).getTime());

      const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;
      const unreadCount = this.getUnreadChatCount(projectId, c.id, uid);

      let peerUser = null;
      if (c.type === "DIRECT") {
        const memberEntries = this.data.chatConversationMembers.filter(cm => 
          (cm.conversation_id === c.id || cm.conversationId === c.id) && 
          (cm.user_id !== uid && cm.userId !== uid)
        );
        const peerId = memberEntries.length > 0 ? (memberEntries[0].user_id || memberEntries[0].userId) : null;
        peerUser = peerId ? this.getUserById(peerId) : null;
      }

      return {
        ...c,
        lastMessage: lastMsg,
        unreadCount,
        peerUser
      };
    });
  }

  /**
   * Get or start a Direct Message conversation with a peer member of the SAME project
   */
  getDirectMessageConversation(projectId, targetUserId) {
    if (!projectId || !targetUserId) return null;
    const activeUser = this.getActiveUser();
    const activeUserId = activeUser ? activeUser.id : null;

    if (!activeUserId) {
      throw new Error("Authentication required to access project chat.");
    }

    // MANDATORY SECURITY RULE: Verify BOTH users are members of the SAME project
    const isSenderMember = this.isUserAuthorizedForProject(projectId, activeUserId);
    const isTargetMember = this.isUserAuthorizedForProject(projectId, targetUserId);

    if (!isSenderMember || !isTargetMember) {
      throw new Error("Direct messages are strictly restricted to members of the same project.");
    }

    if (!this.data.chatConversations) this.data.chatConversations = [];
    if (!this.data.chatConversationMembers) this.data.chatConversationMembers = [];

    // Find existing direct conversation between these two specific users in this project
    const directConvs = this.data.chatConversations.filter(c => 
      (c.project_id === projectId || c.projectId === projectId) && 
      c.type === "DIRECT"
    );

    for (const c of directConvs) {
      const cMembers = this.data.chatConversationMembers
        .filter(cm => cm.conversation_id === c.id || cm.conversationId === c.id)
        .map(cm => cm.user_id || cm.userId);

      if (cMembers.includes(activeUserId) && cMembers.includes(targetUserId)) {
        return c;
      }
    }

    // Create new Direct Conversation
    const convId = `conv_dm_${projectId}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const targetUser = this.getUserById(targetUserId);
    const newConv = {
      id: convId,
      project_id: projectId,
      projectId: projectId,
      type: "DIRECT",
      name: targetUser ? targetUser.name : "Direct Message",
      created_by: activeUserId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.data.chatConversations.push(newConv);

    // Register both users in chat_conversation_members
    this.data.chatConversationMembers.push({
      id: `cm_${convId}_${activeUserId}`,
      conversation_id: convId,
      conversationId: convId,
      user_id: activeUserId,
      userId: activeUserId,
      joined_at: new Date().toISOString(),
      last_read_at: new Date().toISOString()
    });

    this.data.chatConversationMembers.push({
      id: `cm_${convId}_${targetUserId}`,
      conversation_id: convId,
      conversationId: convId,
      user_id: targetUserId,
      userId: targetUserId,
      joined_at: new Date().toISOString(),
      last_read_at: null
    });

    this.saveState();

    // Sync to Supabase
    const sb = (typeof window !== 'undefined' && window.supabaseClient) || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
    if (sb && sb.from) {
      (async () => {
        try {
          await sb.from('chat_conversations').upsert({
            id: newConv.id,
            project_id: projectId,
            type: 'DIRECT',
            name: newConv.name,
            created_by: activeUserId,
            created_at: newConv.created_at,
            updated_at: newConv.updated_at
          });
          await sb.from('chat_conversation_members').upsert([
            { id: `cm_${convId}_${activeUserId}`, conversation_id: convId, user_id: activeUserId, joined_at: new Date().toISOString() },
            { id: `cm_${convId}_${targetUserId}`, conversation_id: convId, user_id: targetUserId, joined_at: new Date().toISOString() }
          ]);
        } catch (err) {
          console.warn("Supabase direct chat creation error:", err);
        }
      })();
    }

    return newConv;
  }

  getOrCreateDirectConversation(projectId, targetUserId) {
    return this.getDirectMessageConversation(projectId, targetUserId);
  }

  /**
   * Load messages for a conversation with enriched replies, reactions, attachments, and links
   */
  getConversationMessages(conversationId, options = {}) {
    if (!conversationId) return [];
    if (!this.data.chatConversations) this.data.chatConversations = [];
    if (!this.data.chatMessages) this.data.chatMessages = [];

    const conv = this.data.chatConversations.find(c => c.id === conversationId);
    if (!conv) return [];

    const activeUser = this.getActiveUser();
    const cProjId = conv.project_id || conv.projectId;
    if (!this.isUserAuthorizedForProject(cProjId, activeUser?.id)) {
      return [];
    }

    let msgs = this.data.chatMessages.filter(m => (m.conversation_id === conversationId || m.conversationId === conversationId));

    // Sort ascending by created_at
    msgs.sort((a, b) => new Date(a.created_at || a.createdAt).getTime() - new Date(b.created_at || b.createdAt).getTime());

    // Optional pagination: limit / offset
    if (options.limit && options.limit > 0) {
      if (options.beforeTimestamp) {
        msgs = msgs.filter(m => new Date(m.created_at || m.createdAt).getTime() < new Date(options.beforeTimestamp).getTime());
      }
      msgs = msgs.slice(-options.limit);
    }

    // Enrich message objects
    return msgs.map(m => {
      const sender = this.getUserById(m.sender_id || m.senderId);
      
      // Reactions
      const reactions = (this.data.chatMessageReactions || [])
        .filter(r => (r.message_id === m.id || r.messageId === m.id));

      // Group reactions by emoji
      const reactionSummary = {};
      reactions.forEach(r => {
        if (!reactionSummary[r.reaction]) {
          reactionSummary[r.reaction] = { reaction: r.reaction, count: 0, users: [], hasReacted: false };
        }
        reactionSummary[r.reaction].count++;
        const u = this.getUserById(r.user_id || r.userId);
        if (u) reactionSummary[r.reaction].users.push(u.name);
        if ((r.user_id === activeUser?.id) || (r.userId === activeUser?.id)) {
          reactionSummary[r.reaction].hasReacted = true;
        }
      });

      // Mentions
      const mentions = (this.data.chatMessageMentions || [])
        .filter(men => (men.message_id === m.id || men.messageId === m.id))
        .map(men => this.getUserById(men.mentioned_user_id || men.mentionedUserId));

      // Attachments
      const attachments = (this.data.chatMessageAttachments || [])
        .filter(att => (att.message_id === m.id || att.messageId === m.id));

      // Links (Issues, Test Cases, Sprints, Releases)
      const links = (this.data.chatMessageLinks || [])
        .filter(lnk => (lnk.message_id === m.id || lnk.messageId === m.id))
        .map(lnk => this.enrichEntityLink(lnk, cProjId));

      // Parent Reply Reference
      let replyParent = null;
      const parentId = m.reply_to_message_id || m.replyToMessageId;
      if (parentId) {
        const parentMsg = this.data.chatMessages.find(p => p.id === parentId);
        if (parentMsg) {
          const parentSender = this.getUserById(parentMsg.sender_id || parentMsg.senderId);
          replyParent = {
            id: parentMsg.id,
            senderName: parentSender ? parentSender.name : "Team Member",
            message: parentMsg.deleted_at ? "This message was deleted" : parentMsg.message,
            deleted: !!parentMsg.deleted_at
          };
        }
      }

      return {
        ...m,
        sender,
        reactionSummary: Object.values(reactionSummary),
        mentions,
        attachments,
        links,
        replyParent
      };
    });
  }

  /**
   * Enrich linked project records (Issues, Test Cases, Executions, Sprints, Releases)
   */
  enrichEntityLink(link, projectId) {
    const type = link.entity_type || link.entityType;
    const id = link.entity_id || link.entityId;

    let res = {
      id: link.id,
      entity_type: type,
      entity_id: id,
      title: "Project Record",
      key: id,
      status: "Active",
      badgeClass: "bg-slate-100 text-slate-700"
    };

    if (type === "ISSUE") {
      const issue = (this.data.issues || []).find(i => i.id === id || i.key === id);
      if (issue) {
        res.key = issue.key;
        res.title = issue.title;
        res.type = issue.type;
        res.status = issue.status;
        res.priority = issue.priority;
        res.badgeClass = issue.type === "Bug" ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-slate-100 text-slate-800 border-slate-200";
      }
    } else if (type === "TEST_CASE") {
      const tc = (this.data.testCases || []).find(t => t.id === id || t.key === id);
      if (tc) {
        res.key = tc.key;
        res.title = tc.title;
        res.status = tc.lastResult || tc.status || "Active";
        res.priority = tc.priority;
        res.badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
      }
    } else if (type === "TEST_EXECUTION") {
      const exec = (this.data.testExecutions || []).find(e => e.id === id);
      if (exec) {
        res.key = `RUN-${id.substr(0, 6)}`;
        res.title = exec.cycle_name || exec.cycleName || "QA Execution Run";
        res.status = exec.status;
        res.badgeClass = exec.status === "Passed" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700";
      }
    } else if (type === "SPRINT") {
      const sprint = (this.data.sprints || []).find(s => s.id === id);
      if (sprint) {
        res.key = sprint.name;
        res.title = sprint.goal || "Sprint Goal";
        res.status = sprint.status;
        res.badgeClass = "bg-purple-50 text-purple-700 border-purple-200";
      }
    } else if (type === "RELEASE") {
      const rep = (this.data.qaReports || []).find(r => r.id === id);
      if (rep) {
        res.key = rep.release_version || "Release";
        res.title = rep.report_name;
        res.status = rep.final_verdict || "READY FOR RELEASE";
        res.badgeClass = "bg-indigo-50 text-indigo-700 border-indigo-200";
      }
    }

    return res;
  }

  /**
   * Send a new message to a conversation
   */
  async sendMessage(arg1, arg2, arg3, arg4, arg5, arg6) {
    let conversationId, message, replyToMessageId, attachments, links, mentions;
    if (typeof arg1 === 'object' && arg1 !== null && !Array.isArray(arg1)) {
      conversationId = arg1.conversationId || arg1.conversation_id;
      message = arg1.message;
      replyToMessageId = arg1.replyToMessageId || arg1.reply_to_message_id || null;
      attachments = arg1.attachments || [];
      links = arg1.links || [];
      mentions = arg1.mentions || [];
    } else {
      conversationId = arg1;
      message = arg2;
      replyToMessageId = arg3 || null;
      attachments = arg4 || [];
      links = arg5 || [];
      mentions = arg6 || [];
    }

    if (!conversationId) throw new Error("Conversation ID is required.");
    
    const activeUser = this.getActiveUser();
    if (!activeUser || !activeUser.id) {
      throw new Error("Authentication required to send messages.");
    }

    if (!this.data.chatConversations) this.data.chatConversations = [];
    if (!this.data.chatMessages) this.data.chatMessages = [];
    if (!this.data.chatMessageAttachments) this.data.chatMessageAttachments = [];
    if (!this.data.chatMessageLinks) this.data.chatMessageLinks = [];
    if (!this.data.chatMessageMentions) this.data.chatMessageMentions = [];

    const conv = this.data.chatConversations.find(c => c.id === conversationId);
    if (!conv) throw new Error("Conversation not found.");

    const cProjId = conv.project_id || conv.projectId;
    if (!this.isUserAuthorizedForProject(cProjId, activeUser.id)) {
      throw new Error("You are not authorized to send messages in this project.");
    }

    const cleanMsg = (message || "").trim();
    if (!cleanMsg && (!attachments || attachments.length === 0) && (!links || links.length === 0)) {
      throw new Error("Cannot send empty message.");
    }

    const msgId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date().toISOString();

    const newMsg = {
      id: msgId,
      conversation_id: conversationId,
      conversationId: conversationId,
      sender_id: activeUser.id,
      senderId: activeUser.id,
      message: cleanMsg,
      reply_to_message_id: replyToMessageId || null,
      replyToMessageId: replyToMessageId || null,
      edited_at: null,
      deleted_at: null,
      created_at: now
    };

    this.data.chatMessages.push(newMsg);
    conv.updated_at = now;

    // Attachments
    if (attachments && attachments.length > 0) {
      attachments.forEach(att => {
        this.data.chatMessageAttachments.push({
          id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          message_id: msgId,
          messageId: msgId,
          file_name: att.file_name || att.name || "attachment",
          file_path: att.file_path || att.path || "",
          file_type: att.file_type || att.type || "application/octet-stream",
          file_size: att.file_size || att.size || 0,
          created_at: now
        });
      });
    }

    // Links
    if (links && links.length > 0) {
      links.forEach(lnk => {
        this.data.chatMessageLinks.push({
          id: `lnk-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          message_id: msgId,
          messageId: msgId,
          entity_type: lnk.entity_type || lnk.entityType,
          entity_id: lnk.entity_id || lnk.entityId,
          created_at: now
        });
      });
    }

    const notifiedUserIds = new Set();
    const proj = (this.data.projects || []).find(p => p.id === cProjId);

    // 1. Mentions
    if (mentions && mentions.length > 0) {
      mentions.forEach(mUserId => {
        if (mUserId === activeUser.id) return;
        notifiedUserIds.add(mUserId);
        this.data.chatMessageMentions.push({
          id: `men-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          message_id: msgId,
          messageId: msgId,
          mentioned_user_id: mUserId,
          mentionedUserId: mUserId,
          created_at: now
        });

        // Trigger notification for mentioned user
        const channelName = conv.type === 'PROJECT' ? `#${conv.name}` : 'Project Chat';
        this.addNotification({
          title: `Mentioned in ${channelName}`,
          message: `${activeUser.name} mentioned you in ${proj ? proj.name : 'Project'}: "${cleanMsg.substring(0, 60)}"`,
          type: "chat",
          recipientId: mUserId,
          projectId: cProjId,
          chatMessageId: msgId,
          link: `project-workspace?projectId=${cProjId}`
        });
      });
    }

    // 2. Trigger Notification for Direct Message Recipient
    if (conv.type === "DIRECT") {
      const peerEntries = (this.data.chatConversationMembers || []).filter(cm => 
        (cm.conversation_id === conversationId || cm.conversationId === conversationId) && 
        (cm.user_id !== activeUser.id && cm.userId !== activeUser.id)
      );
      if (peerEntries.length > 0) {
        const peerId = peerEntries[0].user_id || peerEntries[0].userId;
        if (!notifiedUserIds.has(peerId)) {
          notifiedUserIds.add(peerId);
          this.addNotification({
            title: `Direct Message from ${activeUser.name}`,
            message: `[${proj ? proj.key : 'Chat'}] ${cleanMsg.substring(0, 70)}`,
            type: "chat",
            recipientId: peerId,
            projectId: cProjId,
            chatMessageId: msgId,
            link: `project-workspace?projectId=${cProjId}`
          });
        }
      }
    }

    // 3. Trigger Notification for Reply
    if (replyToMessageId) {
      const parentMsg = this.data.chatMessages.find(p => p.id === replyToMessageId);
      const parentSenderId = parentMsg ? (parentMsg.sender_id || parentMsg.senderId) : null;
      if (parentSenderId && parentSenderId !== activeUser.id && !notifiedUserIds.has(parentSenderId)) {
        notifiedUserIds.add(parentSenderId);
        this.addNotification({
          title: `${activeUser.name} replied to your message`,
          message: `"${cleanMsg.substring(0, 60)}"`,
          type: "chat",
          recipientId: parentSenderId,
          projectId: cProjId,
          chatMessageId: msgId,
          link: `project-workspace?projectId=${cProjId}`
        });
      }
    }

    // 4. Broadcast Project Chat Notification to other active project members
    if (conv.type === "PROJECT" || !conv.type) {
      const pMembers = this.getProjectMembers ? this.getProjectMembers(cProjId) : [];
      pMembers.forEach(mem => {
        const mId = mem.userId || mem.id;
        if (mId && mId !== activeUser.id && !notifiedUserIds.has(mId)) {
          notifiedUserIds.add(mId);
          this.addNotification({
            title: `💬 New Message in ${proj ? proj.name : 'Project Chat'}`,
            message: `${activeUser.name}: "${cleanMsg.substring(0, 70)}"`,
            type: "chat",
            recipientId: mId,
            recipientEmail: mem.email,
            projectId: cProjId,
            chatMessageId: msgId,
            link: `project-workspace?projectId=${cProjId}`
          });
        }
      });
    }

    // Update sender's read timestamp
    this.markConversationRead(conversationId, activeUser.id);
    this.saveState();

    // Supabase Cloud Sync
    const sb = (typeof window !== 'undefined' && window.supabaseClient) || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
    if (sb && sb.from) {
      try {
        await sb.from('chat_messages').upsert({
          id: newMsg.id,
          conversation_id: conversationId,
          sender_id: activeUser.id,
          message: newMsg.message,
          reply_to_message_id: newMsg.reply_to_message_id,
          created_at: newMsg.created_at
        });

        if (attachments.length > 0) {
          await sb.from('chat_message_attachments').upsert(
            attachments.map(att => ({
              message_id: newMsg.id,
              file_name: att.file_name || att.name,
              file_path: att.file_path || att.path,
              file_type: att.file_type || att.type,
              file_size: att.file_size || att.size
            }))
          );
        }

        if (links.length > 0) {
          await sb.from('chat_message_links').upsert(
            links.map(lnk => ({
              message_id: newMsg.id,
              entity_type: lnk.entity_type || lnk.entityType,
              entity_id: lnk.entity_id || lnk.entityId
            }))
          );
        }

        if (mentions.length > 0) {
          await sb.from('chat_message_mentions').upsert(
            mentions.map(mUserId => ({
              message_id: newMsg.id,
              mentioned_user_id: mUserId
            }))
          );
        }
      } catch (err) {
        console.warn("Supabase send message sync warning:", err);
      }
    }

    return newMsg;
  }

  /**
   * Edit own message content
   */
  async editMessage(messageId, newContent) {
    if (!messageId) throw new Error("Message ID required.");
    const activeUser = this.getActiveUser();
    
    if (!this.data.chatMessages) this.data.chatMessages = [];
    const msg = this.data.chatMessages.find(m => m.id === messageId);
    if (!msg) throw new Error("Message not found.");

    if ((msg.sender_id !== activeUser.id) && (msg.senderId !== activeUser.id)) {
      throw new Error("You can only edit your own messages.");
    }

    msg.message = (newContent || "").trim();
    msg.edited_at = new Date().toISOString();
    this.saveState();

    const sb = (typeof window !== 'undefined' && window.supabaseClient) || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
    if (sb && sb.from) {
      try {
        await sb.from('chat_messages').update({
          message: msg.message,
          edited_at: msg.edited_at
        }).eq('id', messageId);
      } catch (err) {
        console.warn("Supabase edit message error:", err);
      }
    }

    return msg;
  }

  /**
   * Soft-delete message (sets deleted_at, does not permanently wipe)
   */
  async deleteMessage(messageId) {
    if (!messageId) throw new Error("Message ID required.");
    const activeUser = this.getActiveUser();
    
    if (!this.data.chatMessages) this.data.chatMessages = [];
    const msg = this.data.chatMessages.find(m => m.id === messageId);
    if (!msg) throw new Error("Message not found.");

    const conv = (this.data.chatConversations || []).find(c => c.id === (msg.conversation_id || msg.conversationId));
    const isOwner = (msg.sender_id === activeUser.id) || (msg.senderId === activeUser.id);
    const spaceRole = conv ? this.getUserSpaceRole(conv.project_id || conv.projectId, activeUser.id) : null;
    const isModerator = spaceRole === "PM" || spaceRole === "OWNER";

    if (!isOwner && !isModerator) {
      throw new Error("You do not have permission to delete this message.");
    }

    msg.deleted_at = new Date().toISOString();
    this.saveState();

    const sb = (typeof window !== 'undefined' && window.supabaseClient) || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
    if (sb && sb.from) {
      try {
        await sb.from('chat_messages').update({
          deleted_at: msg.deleted_at
        }).eq('id', messageId);
      } catch (err) {
        console.warn("Supabase soft-delete message error:", err);
      }
    }

    return true;
  }

  /**
   * Toggle emoji reaction on a message
   */
  async toggleReaction(messageId, reactionText) {
    if (!messageId || !reactionText) return false;
    const activeUser = this.getActiveUser();
    if (!activeUser) return false;

    if (!this.data.chatMessageReactions) this.data.chatMessageReactions = [];

    const existingIdx = this.data.chatMessageReactions.findIndex(r => 
      (r.message_id === messageId || r.messageId === messageId) && 
      (r.user_id === activeUser.id || r.userId === activeUser.id) && 
      r.reaction === reactionText
    );

    const sb = (typeof window !== 'undefined' && window.supabaseClient) || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);

    if (existingIdx >= 0) {
      // Remove reaction
      const rx = this.data.chatMessageReactions[existingIdx];
      this.data.chatMessageReactions.splice(existingIdx, 1);
      this.saveState();

      if (sb && sb.from) {
        try {
          await sb.from('chat_message_reactions').delete()
            .eq('message_id', messageId)
            .eq('user_id', activeUser.id)
            .eq('reaction', reactionText);
        } catch (err) {
          console.warn("Supabase reaction removal error:", err);
        }
      }
      return false;
    } else {
      // Add reaction
      const newRx = {
        id: `rx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        message_id: messageId,
        messageId: messageId,
        user_id: activeUser.id,
        userId: activeUser.id,
        reaction: reactionText,
        created_at: new Date().toISOString()
      };
      this.data.chatMessageReactions.push(newRx);
      this.saveState();

      if (sb && sb.from) {
        try {
          await sb.from('chat_message_reactions').upsert({
            id: newRx.id,
            message_id: messageId,
            user_id: activeUser.id,
            reaction: reactionText,
            created_at: newRx.created_at
          });
        } catch (err) {
          console.warn("Supabase reaction add error:", err);
        }
      }
      return true;
    }
  }

  /**
   * Mark conversation as read up to current timestamp
   */
  markConversationRead(conversationId, userId = null) {
    if (!conversationId) return;
    const activeUser = this.getActiveUser();
    const uid = userId || (activeUser ? activeUser.id : null);
    if (!uid) return;

    if (!this.data.chatConversationMembers) this.data.chatConversationMembers = [];
    let cm = this.data.chatConversationMembers.find(m => 
      (m.conversation_id === conversationId || m.conversationId === conversationId) && 
      (m.user_id === uid || m.userId === uid)
    );

    const now = new Date().toISOString();
    if (cm) {
      cm.last_read_at = now;
      cm.lastReadAt = now;
    } else {
      cm = {
        id: `cm_${conversationId}_${uid}`,
        conversation_id: conversationId,
        conversationId: conversationId,
        user_id: uid,
        userId: uid,
        joined_at: now,
        last_read_at: now,
        lastReadAt: now
      };
      this.data.chatConversationMembers.push(cm);
    }

    this.saveState();

    const sb = (typeof window !== 'undefined' && window.supabaseClient) || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
    if (sb && sb.from) {
      (async () => {
        try {
          await sb.from('chat_conversation_members').upsert({
            id: cm.id,
            conversation_id: conversationId,
            user_id: uid,
            last_read_at: now
          });
        } catch (err) {
          console.warn("Supabase read state sync notice:", err);
        }
      })();
    }
  }

  /**
   * Calculate unread message count for a specific conversation or entire project
   */
  getUnreadChatCount(projectId, conversationId = null, userId = null) {
    if (!projectId) return 0;
    const activeUser = this.getActiveUser();
    const uid = userId || (activeUser ? activeUser.id : null);
    if (!uid) return 0;

    if (!this.data.chatMessages) return 0;
    if (!this.data.chatConversationMembers) return 0;

    if (conversationId) {
      const cm = this.data.chatConversationMembers.find(m => 
        (m.conversation_id === conversationId || m.conversationId === conversationId) && 
        (m.user_id === uid || m.userId === uid)
      );
      const lastRead = (cm && (cm.last_read_at || cm.lastReadAt)) ? new Date(cm.last_read_at || cm.lastReadAt).getTime() : 0;

      return this.data.chatMessages.filter(m => 
        (m.conversation_id === conversationId || m.conversationId === conversationId) && 
        (m.sender_id !== uid && m.senderId !== uid) && 
        !m.deleted_at && 
        new Date(m.created_at || m.createdAt).getTime() > lastRead
      ).length;
    }

    // Whole project unread count
    const convs = this.getProjectConversations(projectId, uid);
    let total = 0;
    convs.forEach(c => {
      total += this.getUnreadChatCount(projectId, c.id, uid);
    });
    return total;
  }

  /**
   * Search messages within a specific project with strict project-level authorization
   */
  searchProjectMessages(projectId, query) {
    if (!projectId || !query) return [];
    const activeUser = this.getActiveUser();
    if (!this.isUserAuthorizedForProject(projectId, activeUser?.id)) {
      return [];
    }

    const q = query.toLowerCase().trim();
    const convs = this.getProjectConversations(projectId, activeUser?.id);
    const convIds = new Set(convs.map(c => c.id));

    const matches = (this.data.chatMessages || []).filter(m => {
      if (!convIds.has(m.conversation_id || m.conversationId)) return false;
      if (m.deleted_at) return false;

      const text = (m.message || "").toLowerCase();
      const sender = this.getUserById(m.sender_id || m.senderId);
      const senderName = (sender?.name || "").toLowerCase();

      if (text.includes(q) || senderName.includes(q)) return true;

      // Check linked entities
      const links = (this.data.chatMessageLinks || []).filter(l => (l.message_id === m.id || l.messageId === m.id));
      for (const l of links) {
        const enriched = this.enrichEntityLink(l, projectId);
        if ((enriched.key && enriched.key.toLowerCase().includes(q)) || 
            (enriched.title && enriched.title.toLowerCase().includes(q))) {
          return true;
        }
      }

      return false;
    });

    return matches.map(m => {
      const conv = convs.find(c => c.id === (m.conversation_id || m.conversationId));
      return {
        ...m,
        sender: this.getUserById(m.sender_id || m.senderId),
        conversationName: conv ? (conv.type === 'PROJECT' ? `#${conv.name}` : (conv.peerUser?.name || 'Direct Message')) : 'Chat'
      };
    });
  }

  /**
   * Upload file to Supabase Storage bucket 'project-chat-attachments'
   */
  async uploadChatAttachment(file, projectId) {
    if (!file) throw new Error("No file provided.");
    const cleanFileName = file.name || "attachment";
    const fileSize = file.size || 0;
    const fileType = file.type || "application/octet-stream";

    const sb = (typeof window !== 'undefined' && window.supabaseClient) || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);

    if (sb && sb.storage) {
      try {
        const ext = cleanFileName.includes('.') ? cleanFileName.split('.').pop() : 'bin';
        const storagePath = `${projectId || 'general'}/${Date.now()}_${Math.random().toString(36).substr(2, 5)}.${ext}`;

        const { data, error } = await sb.storage.from('project-chat-attachments').upload(storagePath, file, {
          cacheControl: '3600',
          upsert: true
        });

        if (!error && data) {
          const { data: urlData } = sb.storage.from('project-chat-attachments').getPublicUrl(storagePath);
          return {
            file_name: cleanFileName,
            file_path: (urlData && urlData.publicUrl) ? urlData.publicUrl : storagePath,
            file_type: fileType,
            file_size: fileSize
          };
        }
      } catch (err) {
        console.warn("Storage upload error fallback:", err);
      }
    }

    // Fallback: create base64 data URL for instant demonstration
    return new Promise((resolve) => {
      if (typeof FileReader !== 'undefined' && file instanceof Blob) {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({
            file_name: cleanFileName,
            file_path: e.target.result,
            file_type: fileType,
            file_size: fileSize
          });
        };
        reader.onerror = () => {
          resolve({
            file_name: cleanFileName,
            file_path: "#",
            file_type: fileType,
            file_size: fileSize
          });
        };
        reader.readAsDataURL(file);
      } else {
        resolve({
          file_name: cleanFileName,
          file_path: typeof file === 'string' ? file : "#",
          file_type: fileType,
          file_size: fileSize
        });
      }
    });
  }

  /**
   * Subscribe to live Supabase Realtime channel for project chat
   */
  subscribeToProjectChat(projectId, onMessageCallback, onPresenceCallback) {
    const sb = (typeof window !== 'undefined' && window.supabaseClient) || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
    if (!sb || !sb.channel) return null;

    try {
      const activeUser = this.getActiveUser();
      const channel = sb.channel(`project-chat-${projectId}`, {
        config: {
          presence: {
            key: activeUser ? activeUser.id : "anonymous"
          }
        }
      });

      channel
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'chat_messages'
        }, (payload) => {
          if (onMessageCallback) onMessageCallback(payload);
          this.notify();
        })
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          if (onPresenceCallback) onPresenceCallback(state);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED' && activeUser) {
            await channel.track({
              user_id: activeUser.id,
              name: activeUser.name,
              online_at: new Date().toISOString()
            });
          }
        });

      return channel;
    } catch (e) {
      console.warn("Realtime subscription notice:", e);
      return null;
    }
  }

  // =========================================================================
  // INTELLIGENT RELEASE RISK ENGINE & QUALITY GATE METHODS
  // =========================================================================

  /**
   * RBAC helper: Can user create/manage releases
   */
  canManageReleases(projectId, userId = null) {
    const user = userId ? this.getUserById(userId) : this.getActiveUser();
    if (!user) return false;
    const project = this.getProjectById(projectId);
    const wsId = project ? (project.workspace_id || project.workspaceId) : null;
    const roleStr = (this.getUserProjectRole(projectId, user.id) || this.getUserSpaceRole(wsId, user.id) || user.role || 'DEVELOPER').toUpperCase();
    const isPM = roleStr.includes('PM') || roleStr.includes('OWNER') || roleStr.includes('PROJECT MANAGER') || roleStr.includes('PROJECT_MANAGER') || roleStr.includes('ADMIN');
    const isQA = roleStr.includes('QA') || roleStr.includes('TESTER') || roleStr.includes('QUALITY');
    return isPM || isQA;
  }

  /**
   * RBAC helper: Can user configure project quality gate policy
   */
  canConfigureQualitySettings(projectId, userId = null) {
    const user = userId ? this.getUserById(userId) : this.getActiveUser();
    if (!user) return false;
    const project = this.getProjectById(projectId);
    const wsId = project ? (project.workspace_id || project.workspaceId) : null;
    const roleStr = (this.getUserProjectRole(projectId, user.id) || this.getUserSpaceRole(wsId, user.id) || user.role || 'DEVELOPER').toUpperCase();
    return roleStr.includes('PM') || roleStr.includes('OWNER') || roleStr.includes('PROJECT MANAGER') || roleStr.includes('PROJECT_MANAGER') || roleStr.includes('ADMIN');
  }

  /**
   * RBAC helper: Can user manually override a failed release gate
   */
  canOverrideRelease(projectId, userId = null) {
    const user = userId ? this.getUserById(userId) : this.getActiveUser();
    if (!user) return false;
    const project = this.getProjectById(projectId);
    const wsId = project ? (project.workspace_id || project.workspaceId) : null;
    const roleStr = (this.getUserProjectRole(projectId, user.id) || this.getUserSpaceRole(wsId, user.id) || user.role || 'DEVELOPER').toUpperCase();
    return roleStr.includes('PM') || roleStr.includes('OWNER') || roleStr.includes('PROJECT MANAGER') || roleStr.includes('PROJECT_MANAGER') || roleStr.includes('ADMIN');
  }

  /**
   * RBAC helper: Can user view release readiness
   */
  canViewReleases(projectId, userId = null) {
    const user = userId ? this.getUserById(userId) : this.getActiveUser();
    if (!user) return false;
    return true; // All authenticated members with project access can view
  }

  /**
   * Get releases for project
   */
  getReleases(projectId = null) {
    if (!this.data.releases) this.data.releases = [];
    if (!projectId) {
      const activeProject = this.getActiveProject();
      if (!activeProject) return this.data.releases;
      projectId = activeProject.id;
    }
    return this.data.releases
      .filter(r => r.projectId === projectId || r.project_id === projectId)
      .sort((a, b) => new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0));
  }

  /**
   * Get single release by ID
   */
  getReleaseById(releaseId) {
    if (!this.data.releases) this.data.releases = [];
    return this.data.releases.find(r => r.id === releaseId) || null;
  }

  /**
   * Create new release entity
   */
  async createRelease(releaseData) {
    if (!releaseData || !releaseData.name) {
      throw new Error("Release name is required.");
    }
    const activeUser = this.getActiveUser();
    const projectId = releaseData.project_id || releaseData.projectId || (this.getActiveProject() ? this.getActiveProject().id : null);
    if (!projectId) throw new Error("Project ID is required.");

    const project = this.getProjectById(projectId);
    const workspaceId = project ? (project.workspace_id || project.workspaceId) : (this.getActiveWorkspace() ? this.getActiveWorkspace().id : null);

    const newRelease = {
      id: `rel-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      project_id: projectId,
      projectId: projectId,
      workspace_id: workspaceId,
      workspaceId: workspaceId,
      name: releaseData.name.trim(),
      version: (releaseData.version || "").trim(),
      description: (releaseData.description || "").trim(),
      status: releaseData.status || "PLANNED",
      release_date: releaseData.release_date || releaseData.releaseDate || null,
      created_by: activeUser ? activeUser.id : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (!this.data.releases) this.data.releases = [];
    this.data.releases.unshift(newRelease);
    this.saveState();

    // Supabase sync
    const sb = (typeof window !== 'undefined' && window.supabaseClient) || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
    if (sb && sb.from) {
      try {
        await sb.from('releases').upsert({
          id: newRelease.id,
          project_id: newRelease.project_id,
          workspace_id: newRelease.workspace_id,
          name: newRelease.name,
          version: newRelease.version,
          description: newRelease.description,
          status: newRelease.status,
          release_date: newRelease.release_date,
          created_by: newRelease.created_by,
          created_at: newRelease.created_at,
          updated_at: newRelease.updated_at
        });
      } catch (err) {
        console.warn("Supabase release create sync warning:", err);
      }
    }

    this.notify();
    return newRelease;
  }

  /**
   * Update existing release
   */
  async updateRelease(releaseId, updates) {
    if (!releaseId) throw new Error("Release ID is required.");
    if (!this.data.releases) this.data.releases = [];
    const rel = this.data.releases.find(r => r.id === releaseId);
    if (!rel) throw new Error("Release not found.");

    Object.assign(rel, updates, {
      updated_at: new Date().toISOString()
    });
    this.saveState();

    const sb = (typeof window !== 'undefined' && window.supabaseClient) || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
    if (sb && sb.from) {
      try {
        await sb.from('releases').update({
          name: rel.name,
          version: rel.version,
          description: rel.description,
          status: rel.status,
          release_date: rel.release_date || rel.releaseDate,
          updated_at: rel.updated_at
        }).eq('id', releaseId);
      } catch (err) {
        console.warn("Supabase release update sync warning:", err);
      }
    }

    this.notify();
    return rel;
  }

  /**
   * Delete release
   */
  async deleteRelease(releaseId) {
    if (!releaseId) return false;
    if (!this.data.releases) this.data.releases = [];
    this.data.releases = this.data.releases.filter(r => r.id !== releaseId);

    // Clean linked assessments and risk factors
    if (this.data.releaseQualityAssessments) {
      const assessmentIds = this.data.releaseQualityAssessments
        .filter(a => a.release_id === releaseId || a.releaseId === releaseId)
        .map(a => a.id);
      
      this.data.releaseQualityAssessments = this.data.releaseQualityAssessments.filter(a => a.release_id !== releaseId && a.releaseId !== releaseId);
      if (this.data.releaseRiskFactors) {
        this.data.releaseRiskFactors = this.data.releaseRiskFactors.filter(rf => !assessmentIds.includes(rf.assessment_id || rf.assessmentId));
      }
    }

    if (this.data.releaseDecisions) {
      this.data.releaseDecisions = this.data.releaseDecisions.filter(d => d.release_id !== releaseId && d.releaseId !== releaseId);
    }
    if (this.data.releaseIssueLinks) {
      this.data.releaseIssueLinks = this.data.releaseIssueLinks.filter(l => l.release_id !== releaseId && l.releaseId !== releaseId);
    }

    this.saveState();

    const sb = (typeof window !== 'undefined' && window.supabaseClient) || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
    if (sb && sb.from) {
      try {
        await sb.from('releases').delete().eq('id', releaseId);
      } catch (err) {
        console.warn("Supabase release delete sync warning:", err);
      }
    }

    this.notify();
    return true;
  }

  /**
   * Link issues to release scope
   */
  async linkIssuesToRelease(releaseId, issueIds) {
    if (!releaseId || !Array.isArray(issueIds)) return;
    if (!this.data.releaseIssueLinks) this.data.releaseIssueLinks = [];

    // Remove existing links for this release
    this.data.releaseIssueLinks = this.data.releaseIssueLinks.filter(l => l.release_id !== releaseId && l.releaseId !== releaseId);

    // Add new links
    const newLinks = issueIds.map(issueId => ({
      id: `ril-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      release_id: releaseId,
      releaseId: releaseId,
      issue_id: issueId,
      issueId: issueId,
      created_at: new Date().toISOString()
    }));

    this.data.releaseIssueLinks.push(...newLinks);

    // Update issue records with releaseId
    if (this.data.issues) {
      this.data.issues.forEach(iss => {
        if (issueIds.includes(iss.id)) {
          iss.releaseId = releaseId;
          iss.release_id = releaseId;
        }
      });
    }

    this.saveState();

    const sb = (typeof window !== 'undefined' && window.supabaseClient) || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
    if (sb && sb.from) {
      try {
        await sb.from('release_issue_links').delete().eq('release_id', releaseId);
        if (newLinks.length > 0) {
          await sb.from('release_issue_links').insert(newLinks.map(l => ({
            release_id: l.release_id,
            issue_id: l.issue_id,
            created_at: l.created_at
          })));
        }
      } catch (err) {
        console.warn("Supabase link issues sync error:", err);
      }
    }

    this.notify();
  }

  /**
   * Get issues linked to release scope
   */
  getReleaseLinkedIssues(releaseId) {
    if (!this.data.releaseIssueLinks) this.data.releaseIssueLinks = [];
    const linkedIds = this.data.releaseIssueLinks
      .filter(l => l.release_id === releaseId || l.releaseId === releaseId)
      .map(l => l.issue_id || l.issueId);
    
    if (linkedIds.length === 0) return [];
    return (this.data.issues || []).filter(i => linkedIds.includes(i.id));
  }

  /**
   * Get project quality policy configuration
   */
  getProjectQualitySettings(projectId) {
    if (!this.data.projectQualitySettings) this.data.projectQualitySettings = [];
    const found = this.data.projectQualitySettings.find(s => s.projectId === projectId || s.project_id === projectId);
    if (found) return found;

    if (typeof ReleaseQualityService !== 'undefined' && ReleaseQualityService.getDefaultSettings) {
      return ReleaseQualityService.getDefaultSettings(projectId);
    }

    return {
      id: `pqs-${projectId}`,
      projectId: projectId,
      project_id: projectId,
      critical_bug_blocks_release: true,
      high_bug_threshold: 0,
      minimum_test_pass_rate: 95.0,
      minimum_regression_pass_rate: 90.0,
      minimum_coverage: 80.0,
      maximum_blocked_tests: 0,
      maximum_open_critical_bugs: 0,
      allow_release_override: true
    };
  }

  /**
   * Update project quality policy configuration
   */
  async updateProjectQualitySettings(projectId, settingsData) {
    if (!projectId) throw new Error("Project ID required.");
    const activeUser = this.getActiveUser();

    if (!this.data.projectQualitySettings) this.data.projectQualitySettings = [];
    let existing = this.data.projectQualitySettings.find(s => s.projectId === projectId || s.project_id === projectId);

    const payload = {
      ...this.getProjectQualitySettings(projectId),
      ...settingsData,
      projectId: projectId,
      project_id: projectId,
      updated_by: activeUser ? activeUser.id : null,
      updated_at: new Date().toISOString()
    };

    if (existing) {
      Object.assign(existing, payload);
    } else {
      this.data.projectQualitySettings.push(payload);
    }

    this.saveState();

    const sb = (typeof window !== 'undefined' && window.supabaseClient) || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
    if (sb && sb.from) {
      try {
        await sb.from('project_quality_settings').upsert({
          project_id: projectId,
          critical_bug_blocks_release: payload.critical_bug_blocks_release,
          high_bug_threshold: payload.high_bug_threshold,
          minimum_test_pass_rate: payload.minimum_test_pass_rate,
          minimum_regression_pass_rate: payload.minimum_regression_pass_rate,
          minimum_coverage: payload.minimum_coverage,
          maximum_blocked_tests: payload.maximum_blocked_tests,
          maximum_open_critical_bugs: payload.maximum_open_critical_bugs,
          allow_release_override: payload.allow_release_override,
          updated_by: payload.updated_by,
          updated_at: payload.updated_at
        });
      } catch (err) {
        console.warn("Supabase project quality settings sync warning:", err);
      }
    }

    this.notify();
    return payload;
  }

  /**
   * Run Deterministic Release Assessment & Save Snapshot
   */
  async runReleaseQualityAssessment(releaseId) {
    const release = this.getReleaseById(releaseId);
    if (!release) throw new Error("Release not found.");

    const project = this.getProjectById(release.project_id || release.projectId);
    const settings = this.getProjectQualitySettings(project ? project.id : release.project_id);
    const previousAssessment = this.getLatestReleaseAssessment(releaseId);
    const activeUser = this.getActiveUser();

    // Collect scoped real data
    const linkedIssues = this.getReleaseLinkedIssues(releaseId);
    const allProjectIssues = this.getIssues(project ? project.id : release.project_id) || [];
    const issues = linkedIssues.length > 0 ? linkedIssues : allProjectIssues;

    const testCases = this.getTestCases ? this.getTestCases(project ? project.id : null) : (this.data.testCases || []);
    
    // Map test executions from test runs / executions
    let testExecutions = [];
    if (this.data.testExecutions && this.data.testExecutions.length > 0) {
      testExecutions = this.data.testExecutions.filter(e => e.projectId === release.project_id || e.project_id === release.project_id);
    } else if (this.getTestRuns) {
      const runs = this.getTestRuns(project ? project.id : null) || [];
      runs.forEach(run => {
        const isReg = (run.type && run.type.toLowerCase().includes('regression')) || (run.title && run.title.toLowerCase().includes('regression'));
        (run.results || []).forEach((res, idx) => {
          testExecutions.push({
            id: `exec-${run.id}-${idx}`,
            projectId: release.project_id || release.projectId,
            project_id: release.project_id || release.projectId,
            testCaseId: res.testCaseId || res.caseId,
            status: res.status === 'PASSED' ? 'Passed' : (res.status === 'FAILED' ? 'Failed' : (res.status === 'BLOCKED' ? 'Blocked' : 'Skipped')),
            testType: isReg ? 'Regression' : (run.type || 'Manual'),
            cycleName: run.title,
            executedAt: run.executedAt || run.created_at
          });
        });
      });
    }

    if (typeof ReleaseQualityService === 'undefined') {
      throw new Error("ReleaseQualityService is not loaded.");
    }

    const { assessment, riskFactors } = ReleaseQualityService.evaluateReleaseQuality({
      release,
      project,
      issues,
      testCases,
      testExecutions,
      settings,
      previousAssessment,
      userId: activeUser ? activeUser.id : null
    });

    if (!this.data.releaseQualityAssessments) this.data.releaseQualityAssessments = [];
    if (!this.data.releaseRiskFactors) this.data.releaseRiskFactors = [];

    // Append immutable assessment snapshot
    this.data.releaseQualityAssessments.unshift(assessment);
    
    // Append risk factors linked to this assessment snapshot
    const factorsWithAssessmentId = riskFactors.map(rf => ({
      ...rf,
      assessment_id: assessment.id,
      assessmentId: assessment.id
    }));
    this.data.releaseRiskFactors.unshift(...factorsWithAssessmentId);

    this.saveState();

    // Supabase sync
    const sb = (typeof window !== 'undefined' && window.supabaseClient) || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
    if (sb && sb.from) {
      try {
        await sb.from('release_quality_assessments').insert({
          id: assessment.id,
          release_id: assessment.release_id,
          project_id: assessment.project_id,
          score: assessment.score,
          status: assessment.status,
          calculated_at: assessment.calculated_at,
          calculation_version: assessment.calculation_version,
          blocking_risk_count: assessment.blocking_risk_count,
          critical_risk_count: assessment.critical_risk_count,
          high_risk_count: assessment.high_risk_count,
          medium_risk_count: assessment.medium_risk_count,
          low_risk_count: assessment.low_risk_count,
          data_completeness: assessment.data_completeness,
          created_at: assessment.created_at
        });

        if (factorsWithAssessmentId.length > 0) {
          await sb.from('release_risk_factors').insert(
            factorsWithAssessmentId.map(rf => ({
              id: rf.id,
              assessment_id: rf.assessment_id,
              release_id: rf.release_id,
              project_id: rf.project_id,
              category: rf.category,
              severity: rf.severity,
              title: rf.title,
              description: rf.description,
              evidence: rf.evidence,
              score_impact: rf.score_impact,
              is_blocking: rf.is_blocking,
              created_at: new Date().toISOString()
            }))
          );
        }
      } catch (err) {
        console.warn("Supabase assessment insert sync warning:", err);
      }
    }

    this.notify();
    return assessment;
  }

  /**
   * Get all historical assessment snapshots for a release
   */
  getReleaseQualityAssessments(releaseId) {
    if (!this.data.releaseQualityAssessments) this.data.releaseQualityAssessments = [];
    return this.data.releaseQualityAssessments
      .filter(a => a.release_id === releaseId || a.releaseId === releaseId)
      .sort((a, b) => new Date(b.calculated_at || b.calculatedAt || b.created_at || 0) - new Date(a.calculated_at || a.calculatedAt || a.created_at || 0));
  }

  /**
   * Get latest assessment snapshot for a release
   */
  getLatestReleaseAssessment(releaseId) {
    const history = this.getReleaseQualityAssessments(releaseId);
    return history.length > 0 ? history[0] : null;
  }

  /**
   * Get risk factors for a specific assessment snapshot
   */
  getReleaseRiskFactors(assessmentId) {
    if (!this.data.releaseRiskFactors) this.data.releaseRiskFactors = [];
    return this.data.releaseRiskFactors.filter(rf => rf.assessment_id === assessmentId || rf.assessmentId === assessmentId);
  }

  /**
   * Record a release decision (READY, AT_RISK, NOT_READY, OVERRIDDEN, RELEASED)
   */
  async recordReleaseDecision(releaseId, decision, reason = '', overrideReason = '') {
    if (!releaseId || !decision) throw new Error("Release ID and decision required.");
    const activeUser = this.getActiveUser();

    const newDecision = {
      id: `dec-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      release_id: releaseId,
      releaseId: releaseId,
      decision,
      reason,
      override_reason: overrideReason,
      overrideReason: overrideReason,
      decided_by: activeUser ? activeUser.id : null,
      decidedBy: activeUser ? activeUser.name : "System",
      created_at: new Date().toISOString()
    };

    if (!this.data.releaseDecisions) this.data.releaseDecisions = [];
    this.data.releaseDecisions.unshift(newDecision);
    this.saveState();

    const sb = (typeof window !== 'undefined' && window.supabaseClient) || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
    if (sb && sb.from) {
      try {
        await sb.from('release_decisions').insert({
          id: newDecision.id,
          release_id: newDecision.release_id,
          decision: newDecision.decision,
          reason: newDecision.reason,
          override_reason: newDecision.override_reason,
          decided_by: newDecision.decided_by,
          created_at: newDecision.created_at
        });
      } catch (err) {
        console.warn("Supabase release decision sync warning:", err);
      }
    }

    this.notify();
    return newDecision;
  }

  /**
   * Get all decision entries for a release
   */
  getReleaseDecisions(releaseId) {
    if (!this.data.releaseDecisions) this.data.releaseDecisions = [];
    return this.data.releaseDecisions
      .filter(d => d.release_id === releaseId || d.releaseId === releaseId)
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }

  // =========================================================================
  // AI QA ASSISTANT & GENERATION PERSISTENCE
  // =========================================================================

  /**
   * Filter project issues strictly within a specific date or date range
   */
  getIssuesByDateRange(projectId, startDate, endDate) {
    if (!projectId) return [];
    const issues = this.getIssues(projectId) || [];
    if (!startDate) return issues;

    const startStr = typeof startDate === 'string' ? startDate.split('T')[0] : '';
    const endStr = typeof (endDate || startDate) === 'string' ? (endDate || startDate).split('T')[0] : startStr;

    const startTs = new Date(`${startStr}T00:00:00.000`).getTime();
    const endTs = new Date(`${endStr}T23:59:59.999`).getTime();

    return issues.filter(issue => {
      const createdRaw = issue.createdAt || issue.created_at || issue.updatedAt || issue.updated_at;
      if (!createdRaw) return false;
      const issueDate = new Date(createdRaw);
      const issueTs = issueDate.getTime();
      if (isNaN(issueTs)) return false;
      return issueTs >= startTs && issueTs <= endTs;
    });
  }

  /**
   * Save AI QA Generated Content to local state & Supabase public.ai_qa_generations
   */
  async saveAIGeneration(genData) {
    if (!genData) throw new Error("Generation data is required.");
    const activeUser = this.getActiveUser();
    const project = this.getProjectById(genData.projectId || genData.project_id);
    const workspaceId = genData.workspaceId || genData.workspace_id || (project ? (project.workspace_id || project.workspaceId) : this.data.activeWorkspaceId);

    const newGen = {
      id: genData.id || `gen-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      workspace_id: workspaceId,
      workspaceId: workspaceId,
      project_id: genData.projectId || genData.project_id,
      projectId: genData.projectId || genData.project_id,
      created_by: genData.createdBy || genData.created_by || (activeUser ? activeUser.id : null),
      createdBy: genData.createdBy || genData.created_by || (activeUser ? activeUser.name : "QA Engineer"),
      start_date: genData.startDate || genData.start_date,
      startDate: genData.startDate || genData.start_date,
      end_date: genData.endDate || genData.end_date,
      endDate: genData.endDate || genData.end_date,
      generation_type: genData.generationType || genData.generation_type,
      generationType: genData.generationType || genData.generation_type,
      selected_issue_ids: genData.selectedIssueIds || genData.selected_issue_ids || [],
      selectedIssueIds: genData.selectedIssueIds || genData.selected_issue_ids || [],
      generated_content: genData.generatedContent || genData.generated_content || {},
      generatedContent: genData.generatedContent || genData.generated_content || {},
      created_at: genData.createdAt || genData.created_at || new Date().toISOString()
    };

    if (!this.data.aiGenerations) this.data.aiGenerations = [];
    this.data.aiGenerations.unshift(newGen);
    this.saveState();

    const sb = (typeof window !== 'undefined' && window.supabaseClient) || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
    if (sb && sb.from && newGen.workspace_id && newGen.project_id) {
      try {
        await sb.from('ai_qa_generations').insert({
          id: newGen.id,
          workspace_id: newGen.workspace_id,
          project_id: newGen.project_id,
          created_by: newGen.created_by,
          start_date: newGen.start_date,
          end_date: newGen.end_date,
          generation_type: newGen.generation_type,
          selected_issue_ids: newGen.selected_issue_ids,
          generated_content: newGen.generated_content,
          created_at: newGen.created_at
        });
      } catch (err) {
        console.warn("Supabase ai_qa_generations insert warning:", err.message);
      }
    }

    this.notify();
    return newGen;
  }

  /**
   * Get historical AI generations for a project
   */
  getAIGenerations(projectId = null) {
    if (!this.data.aiGenerations) this.data.aiGenerations = [];
    let list = this.data.aiGenerations;
    if (projectId) {
      list = list.filter(g => g.project_id === projectId || g.projectId === projectId);
    }
    return list.sort((a, b) => new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0));
  }

  /**
   * Log AI email activity to local state & Supabase public.ai_qa_email_logs
   */
  async logAIEmail(emailData) {
    if (!emailData) throw new Error("Email log data is required.");
    const activeUser = this.getActiveUser();
    const project = this.getProjectById(emailData.projectId || emailData.project_id);
    const workspaceId = emailData.workspaceId || emailData.workspace_id || (project ? (project.workspace_id || project.workspaceId) : this.data.activeWorkspaceId);

    const newLog = {
      id: emailData.id || `eml-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      workspace_id: workspaceId,
      workspaceId: workspaceId,
      project_id: emailData.projectId || emailData.project_id,
      projectId: emailData.projectId || emailData.project_id,
      generation_id: emailData.generationId || emailData.generation_id || null,
      generationId: emailData.generationId || emailData.generation_id || null,
      sent_by: emailData.sentBy || emailData.sent_by || (activeUser ? activeUser.id : null),
      sentBy: emailData.sentBy || emailData.sent_by || (activeUser ? activeUser.name : "QA Engineer"),
      recipient: emailData.recipient || "",
      subject: emailData.subject || "",
      body: emailData.body || "",
      attachment_path: emailData.attachmentPath || emailData.attachment_path || null,
      attachmentPath: emailData.attachmentPath || emailData.attachment_path || null,
      status: emailData.status || "sent",
      error_message: emailData.errorMessage || emailData.error_message || null,
      sent_at: emailData.status === "sent" ? (emailData.sentAt || emailData.sent_at || new Date().toISOString()) : null,
      created_at: emailData.createdAt || emailData.created_at || new Date().toISOString()
    };

    if (!this.data.aiEmailLogs) this.data.aiEmailLogs = [];
    this.data.aiEmailLogs.unshift(newLog);
    this.saveState();

    const sb = (typeof window !== 'undefined' && window.supabaseClient) || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
    if (sb && sb.from && newLog.workspace_id && newLog.project_id) {
      try {
        await sb.from('ai_qa_email_logs').insert({
          id: newLog.id,
          workspace_id: newLog.workspace_id,
          project_id: newLog.project_id,
          generation_id: newLog.generation_id,
          sent_by: newLog.sent_by,
          recipient: newLog.recipient,
          subject: newLog.subject,
          body: newLog.body,
          attachment_path: newLog.attachment_path,
          status: newLog.status,
          error_message: newLog.error_message,
          sent_at: newLog.sent_at,
          created_at: newLog.created_at
        });
      } catch (err) {
        console.warn("Supabase ai_qa_email_logs insert warning:", err.message);
      }
    }

    this.notify();
    return newLog;
  }

  /**
   * Get all email logs for a project
   */
  getAIEmailLogs(projectId = null) {
    if (!this.data.aiEmailLogs) this.data.aiEmailLogs = [];
    let list = this.data.aiEmailLogs;
    if (projectId) {
      list = list.filter(l => l.project_id === projectId || l.projectId === projectId);
    }
    return list.sort((a, b) => new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0));
  }

  /**
   * Dispatch AI QA email securely and record audit log
   */
  async sendAIEmail({ projectId, workspaceId, generationId, recipient, subject, body, attachmentPath = null }) {
    if (!recipient || !recipient.includes('@')) {
      throw new Error("Please enter a valid recipient email address.");
    }
    if (!subject || !body) {
      throw new Error("Subject and email body cannot be empty.");
    }

    const activeUser = this.getActiveUser();
    const pId = projectId || this.data.activeProjectId;
    const project = this.getProjectById(pId);
    const wsId = workspaceId || (project ? (project.workspace_id || project.workspaceId) : this.data.activeWorkspaceId);

    try {
      const sb = (typeof window !== 'undefined' && window.supabaseClient) || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
      if (sb && sb.functions && sb.functions.invoke) {
        try {
          const { data, error } = await sb.functions.invoke('send-ai-qa-email', {
            body: {
              projectId: pId,
              workspaceId: wsId,
              generationId,
              recipient,
              subject,
              body,
              attachmentPath
            }
          });
          if (error) console.warn("Supabase Edge Function notice:", error.message);
        } catch (e) {
          console.warn("Edge function invocation notice:", e);
        }
      }

      const log = await this.logAIEmail({
        projectId: pId,
        workspaceId: wsId,
        generationId,
        sentBy: activeUser ? activeUser.id : null,
        recipient,
        subject,
        body,
        attachmentPath,
        status: "sent",
        sentAt: new Date().toISOString()
      });

      return { success: true, log };
    } catch (err) {
      await this.logAIEmail({
        projectId: pId,
        workspaceId: wsId,
        generationId,
        sentBy: activeUser ? activeUser.id : null,
        recipient,
        subject,
        body,
        attachmentPath,
        status: "failed",
        errorMessage: err.message
      });
      throw err;
    }
  }

  /**
   * Upload generated PDF blob to Supabase Storage bucket
   */
  async uploadAIPDF(pdfBlob, filename, projectId, workspaceId) {
    if (!pdfBlob || !filename) return null;
    const pId = projectId || this.data.activeProjectId;
    const wsId = workspaceId || this.data.activeWorkspaceId;
    const storagePath = `${wsId}/${pId}/ai-qa-reports/${filename}`;

    const sb = (typeof window !== 'undefined' && window.supabaseClient) || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
    if (sb && sb.storage) {
      try {
        const { data, error } = await sb.storage.from('qa-reports').upload(storagePath, pdfBlob, {
          contentType: 'application/pdf',
          upsert: true
        });
        if (!error && data) {
          return storagePath;
        }
      } catch (err) {
        console.warn("Supabase Storage upload warning:", err.message);
      }
    }
    return storagePath;
  }

  /**
   * Get AI QA Chat messages for a project
   */
  getAIChatHistory(projectId) {
    if (!projectId) return [];
    if (!this.data.aiChatHistories) this.data.aiChatHistories = {};
    return this.data.aiChatHistories[projectId] || [];
  }

  /**
   * Append a chat message to the project's AI QA Chat History
   */
  addAIChatMessage(projectId, message) {
    if (!projectId || !message) return null;
    if (!this.data.aiChatHistories) this.data.aiChatHistories = {};
    if (!this.data.aiChatHistories[projectId]) {
      this.data.aiChatHistories[projectId] = [];
    }
    
    const formattedMsg = {
      id: message.id || ("aimsg_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6)),
      role: message.role || "user", // "user" | "assistant" | "system"
      text: message.text || "",
      quickQuestionId: message.quickQuestionId || null,
      actions: message.actions || [],
      metrics: message.metrics || null,
      timestamp: message.timestamp || new Date().toISOString()
    };

    this.data.aiChatHistories[projectId].push(formattedMsg);
    this.saveState();
    return formattedMsg;
  }

  /**
   * Clear AI QA Chat History for a project
   */
  clearAIChatHistory(projectId) {
    if (!projectId) return;
    if (!this.data.aiChatHistories) this.data.aiChatHistories = {};
    this.data.aiChatHistories[projectId] = [];
    this.saveState();
  }
}

// Instantiate and expose globally
const store = new AppStore();
if (typeof window !== 'undefined') window.store = store;
if (typeof global !== 'undefined') global.store = store;
if (typeof module !== 'undefined' && module.exports) module.exports = store;
