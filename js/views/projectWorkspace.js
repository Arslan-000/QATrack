/**
 * All-in-One Software Project & QA Management Platform (V1)
 * High-End Executive Project Detail & Dedicated Workspace View
 */

const ProjectWorkspaceView = {
  activeTab: "overview", // 'overview', 'board', 'issues', 'sprints', 'qa', 'team', 'settings'
  
  // Animation frame tracker for clean teardown
  animationFrameIds: [],

  destroyAnimationLoops() {
    if (this.animationFrameIds && this.animationFrameIds.length > 0) {
      this.animationFrameIds.forEach(id => {
        try {
          cancelAnimationFrame(id);
        } catch (e) {}
      });
      this.animationFrameIds = [];
    }
  },
  
  // Board & Filter State
  taskViewDropdownOpen: false,
  boardSortField: "key",
  boardSortAsc: true,
  filterQuick: "all", // 'all', 'my_issues', 'bugs_only', 'critical_only', 'qa_ready'
  filterType: "all",
  filterPriority: "all",
  filterAssignee: "all",
  filterQAStatus: "all",
  filterSprint: "all",
  searchQuery: "",
  boardDensity: "standard", // 'standard' or 'compact'
  swimlaneBy: "none", // 'none', 'assignee', 'priority', 'type'
  filterMenuOpen: false,

  // Team & Invitations Sub-Tab State
  teamSubTab: "members", // 'members', 'invitations', 'workload'
  teamSearchQuery: "",
  teamRoleFilter: "all",
  invitationStatusFilter: "PENDING",

  // Table sorting & selection state
  tableSortField: "key",
  tableSortAsc: true,
  selectedIssueIds: new Set(),

  columns: [
    { id: "Backlog", title: "Backlog / Open", dot: "bg-slate-400", border: "border-t-slate-400", badge: "bg-slate-100 text-slate-700", wipLimit: 20 },
    { id: "To Do", title: "To Do", dot: "bg-slate-900", border: "border-t-slate-900", badge: "bg-slate-100 text-slate-800 border border-slate-200/80", wipLimit: 10 },
    { id: "In Progress", title: "In Development", dot: "bg-amber-500", border: "border-t-amber-500", badge: "bg-amber-50 text-amber-700 border border-amber-200/60", wipLimit: 8 },
    { id: "Ready for QA", title: "Ready for QA", dot: "bg-purple-500", border: "border-t-purple-500", badge: "bg-purple-50 text-purple-700 border border-purple-200/60", wipLimit: 8 },
    { id: "QA Testing", title: "QA Testing", dot: "bg-indigo-500", border: "border-t-indigo-500", badge: "bg-indigo-50 text-indigo-700 border border-indigo-200/60", wipLimit: 6 },
    { id: "Done", title: "Done / Closed", dot: "bg-emerald-500", border: "border-t-emerald-500", badge: "bg-emerald-50 text-emerald-700 border border-emerald-200/60", wipLimit: 99 }
  ],

  render(container) {
    this.destroyAnimationLoops();

    const project = store.getActiveProject();
    if (!project) {
      container.innerHTML = `<div class="p-8 text-center text-slate-500">Project not found.</div>`;
      return;
    }

    const activeUser = store.getActiveUser ? store.getActiveUser() : null;
    const userRole = (store.getUserProjectRole(project.id, activeUser?.id) || store.getUserSpaceRole(project.workspace_id || project.workspaceId, activeUser?.id) || 'DEVELOPER').toUpperCase();
    const isPM = userRole === 'PM' || userRole === 'OWNER' || userRole === 'PROJECT_MANAGER';
    const isQA = userRole === 'QA' || userRole === 'QA_MANAGER' || userRole === 'QA_ENGINEER';
    const isDev = userRole === 'DEVELOPER';
    const isViewer = userRole === 'VIEWER' || userRole === 'CLIENT_VIEWER';
    const canCreateIssue = store.canCreateIssue(project.id);
    const canCreateSprint = store.canCreateSprint(project.id);
    const canEditSettings = store.canEditProjectSettings(project.id);

    // Enforce tab bounds based on role
    if (isDev && !['overview', 'board', 'issues', 'releases'].includes(this.activeTab)) {
      this.activeTab = 'board';
    } else if (isViewer && !['overview', 'board', 'issues', 'docs', 'releases'].includes(this.activeTab)) {
      this.activeTab = 'overview';
    }

    const pm = store.getUserById(project.pmId || project.pm_id) || (project.pmId ? { name: project.pmId, initials: (project.pmId.substring(0, 2)).toUpperCase(), color: "bg-slate-950 text-[#bef264]" } : { name: "Unassigned Lead", initials: "PM", color: "bg-slate-950 text-[#bef264]" });
    const stats = store.getProjectStats(project.id);
    const allIssues = store.getIssues(project.id) || [];
    const bugs = allIssues.filter(i => (i.type === "Bug" || i.type === "Defect") && i.status !== "Done" && i.status !== "Closed");
    const rawTestCases = store.getTestCases ? (store.getTestCases(project.id) || []) : [];
    
    // Exact Real Dynamic Counts
    const testCasesCount = rawTestCases.length;
    const passedCount = rawTestCases.filter(t => t.status === 'Passed' || t.status === 'Pass' || t.lastExecutionStatus === 'Passed').length;
    const failedCount = rawTestCases.filter(t => t.status === 'Failed' || t.status === 'Fail' || t.lastExecutionStatus === 'Failed').length;
    const blockedCount = rawTestCases.filter(t => t.status === 'Blocked' || t.lastExecutionStatus === 'Blocked').length;
    const defectsCount = bugs.length;
    const passRatePct = testCasesCount > 0 ? Math.round((passedCount / testCasesCount) * 100) : 0;
    const totalIssuesCount = allIssues.length;
    const completedIssuesCount = allIssues.filter(i => i.status === "Done" || i.status === "Closed" || i.qaStatus === "Passed").length;
    const deliveryProgressPct = totalIssuesCount > 0 ? Math.round((completedIssuesCount / totalIssuesCount) * 100) : 0;

    container.innerHTML = `
      <div class="space-y-4 sm:space-y-5 animate-fade-in pb-12">
        
        <!-- =========================================================================
             1. EXECUTIVE BRANDED PROJECT HERO HEADER (SPLIT 2-CARD LAYOUT)
             ========================================================================= -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          <!-- Left Hero Card: Project Identity & Metadata -->
          <div class="lg:col-span-8 bg-white rounded-2xl border border-slate-300 shadow-2xs p-5 sm:p-6 flex flex-col justify-between space-y-4 relative overflow-hidden">
            <div class="flex items-start gap-4 min-w-0">
              <div class="w-12 h-12 rounded-2xl bg-[#f7fee7] text-[#4d7c0f] border border-[#d9f99d] flex items-center justify-center shrink-0 shadow-2xs">
                <i data-lucide="layers" class="w-6 h-6"></i>
              </div>

              <div class="space-y-1 min-w-0 flex-1">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <div class="flex items-center gap-2 min-w-0">
                    <h1 class="text-xl sm:text-2xl font-black text-slate-950 tracking-tight truncate">${project.name}</h1>
                    <button onclick="ProjectWorkspaceView.copyProjectKey('${project.key}')" class="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono font-bold text-xs border border-slate-200/80 transition flex items-center gap-1 cursor-pointer" title="Click to copy key">
                      <span>${project.key}</span>
                      <i data-lucide="copy" class="w-2.5 h-2.5 text-slate-400"></i>
                    </button>
                  </div>

                  <div class="flex items-center gap-2 shrink-0">
                    <!-- Status Switcher Pill -->
                    <div class="relative inline-block">
                      <select onchange="ProjectWorkspaceView.handleStatusChange('${project.id}', this.value)" class="appearance-none pl-2.5 pr-6 py-0.5 rounded-full text-xs font-bold cursor-pointer transition focus:outline-none ${
                        project.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100/70' :
                        project.status === 'Planning' ? 'bg-[#f7fee7] text-[#4d7c0f] border border-[#d9f99d] hover:bg-[#ecfccb]' :
                        'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100/70'
                      }">
                        <option value="Active" ${project.status === 'Active' ? 'selected' : ''}>● Active</option>
                        <option value="Planning" ${project.status === 'Planning' ? 'selected' : ''}>● Planning</option>
                        <option value="In Review" ${project.status === 'In Review' ? 'selected' : ''}>● In Review</option>
                        <option value="On Hold" ${project.status === 'On Hold' ? 'selected' : ''}>● On Hold</option>
                        <option value="Completed" ${project.status === 'Completed' ? 'selected' : ''}>● Completed</option>
                      </select>
                      <i data-lucide="chevron-down" class="w-3 h-3 absolute right-2 top-1.5 pointer-events-none text-slate-400"></i>
                    </div>

                    <!-- Meatball Actions -->
                    <div class="relative">
                      <button onclick="ProjectWorkspaceView.toggleQuickActionsMenu()" class="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition border border-slate-200 cursor-pointer" title="More Actions">
                        <i data-lucide="more-horizontal" class="w-4 h-4"></i>
                      </button>
                      <div id="prjQuickActionsMenu" class="hidden absolute right-0 top-9 w-52 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 z-30 text-xs animate-fade-in space-y-0.5">
                        ${canCreateSprint ? `
                          <button onclick="ProjectWorkspaceView.openCreateMilestoneModal(); ProjectWorkspaceView.toggleQuickActionsMenu()" class="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-700 flex items-center gap-2 font-medium">
                            <i data-lucide="flag" class="w-4 h-4 text-indigo-600"></i> New Sprint / Milestone
                          </button>
                        ` : ''}
                        <button onclick="ProjectWorkspaceView.exportProjectSummaryCSV(); ProjectWorkspaceView.toggleQuickActionsMenu()" class="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-700 flex items-center gap-2 font-medium">
                          <i data-lucide="download" class="w-4 h-4 text-emerald-600"></i> Export Summary (CSV)
                        </button>
                        <button onclick="ProjectWorkspaceView.copyShareLink(); ProjectWorkspaceView.toggleQuickActionsMenu()" class="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-700 flex items-center gap-2 font-medium">
                          <i data-lucide="share-2" class="w-4 h-4 text-slate-800"></i> Copy Project URL
                        </button>
                        ${canEditSettings ? `
                          <div class="border-t border-slate-100 my-1"></div>
                          <button onclick="ProjectWorkspaceView.switchTab('settings'); ProjectWorkspaceView.toggleQuickActionsMenu()" class="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-700 flex items-center gap-2 font-medium">
                            <i data-lucide="settings" class="w-4 h-4 text-slate-500"></i> Project Settings
                          </button>
                        ` : ''}
                      </div>
                    </div>
                  </div>
                </div>

                <p class="text-xs text-slate-500 max-w-2xl leading-relaxed">${project.description || '<span class="italic text-slate-400">No project description provided. Click Settings to add one.</span>'}</p>
              </div>
            </div>

            <!-- Metadata Strip (4 Items) -->
            <div class="pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <!-- Application / Customer -->
              <div class="flex items-center gap-2.5">
                <div class="w-7 h-7 rounded-lg bg-[#f7fee7] text-[#4d7c0f] flex items-center justify-center shrink-0 border border-[#d9f99d]">
                  <i data-lucide="box" class="w-3.5 h-3.5"></i>
                </div>
                <div class="min-w-0">
                  <div class="text-[10px] uppercase font-bold text-slate-400 leading-none">Customer / Client</div>
                  <div class="text-xs font-bold text-slate-800 truncate mt-0.5">${project.customer || project.application || 'Internal Organization'}</div>
                </div>
              </div>

              <!-- Lead PM -->
              <div class="flex items-center gap-2.5">
                <div class="w-7 h-7 rounded-lg bg-slate-950 text-[#bef264] text-[10px] font-black flex items-center justify-center shrink-0 shadow-2xs">
                  ${pm.initials || 'PM'}
                </div>
                <div class="min-w-0">
                  <div class="text-[10px] uppercase font-bold text-slate-400 leading-none">Lead PM</div>
                  <div class="text-xs font-bold text-slate-800 truncate mt-0.5">${pm.name || 'Project Lead'}</div>
                </div>
              </div>

              <!-- Team -->
              <div class="flex items-center gap-2.5">
                <div class="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                  <i data-lucide="users" class="w-3.5 h-3.5"></i>
                </div>
                <div class="min-w-0">
                  <div class="text-[10px] uppercase font-bold text-slate-400 leading-none">Team</div>
                  <div class="text-xs font-bold text-slate-800 truncate mt-0.5">Project Team (${(project.members || []).length || (project.pmId ? 1 : 0)})</div>
                </div>
              </div>

              <!-- Created / Due Date -->
              <div class="flex items-center gap-2.5">
                <div class="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
                  <i data-lucide="calendar" class="w-3.5 h-3.5"></i>
                </div>
                <div class="min-w-0">
                  <div class="text-[10px] uppercase font-bold text-slate-400 leading-none">Timeline</div>
                  <div class="text-xs font-bold text-slate-800 truncate mt-0.5">${project.dueDate ? `Due ${project.dueDate}` : (project.startDate ? `Started ${project.startDate}` : 'Timeline unassigned')}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Hero Card: Project Progress & Delivery Velocity -->
          <div class="lg:col-span-4 bg-white rounded-2xl border border-slate-300 shadow-2xs p-5 flex flex-col justify-between space-y-4">
            
            <!-- Project Progress Ring & Label -->
            <div class="flex items-center gap-4">
              <div class="w-14 h-14 rounded-full border-4 ${testCasesCount > 0 ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950' : 'border-slate-300 bg-slate-50 text-slate-600'} flex flex-col items-center justify-center shrink-0 shadow-2xs font-mono font-black text-xs">
                <span>${testCasesCount > 0 ? passRatePct : deliveryProgressPct}%</span>
              </div>
              <div class="space-y-1 flex-1 min-w-0">
                <h3 class="text-xs font-bold text-slate-900">Project Quality & Progress</h3>
                <p class="text-[11px] text-slate-500 truncate">${testCasesCount > 0 ? `${passedCount}/${testCasesCount} test cases passed` : (totalIssuesCount > 0 ? `${completedIssuesCount}/${totalIssuesCount} work items delivered` : 'No work items recorded yet')}</p>
                <div class="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div class="h-full ${testCasesCount > 0 ? 'bg-emerald-500' : 'bg-slate-900'} rounded-full" style="width: ${testCasesCount > 0 ? passRatePct : deliveryProgressPct}%"></div>
                </div>
              </div>
            </div>

            <!-- Delivery Velocity -->
            <div class="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <div class="flex items-center gap-2 font-bold text-slate-800">
                <div class="w-6 h-6 rounded-lg bg-[#f7fee7] text-[#4d7c0f] flex items-center justify-center border border-[#d9f99d]">
                  <i data-lucide="zap" class="w-3.5 h-3.5"></i>
                </div>
                <span>Delivery Velocity</span>
              </div>
              <span class="font-mono font-bold text-slate-950 text-xs">${totalIssuesCount > 0 ? `${deliveryProgressPct}% (${completedIssuesCount}/${totalIssuesCount} Delivered)` : '0% (0/0 Delivered)'}</span>
            </div>

          </div>

        </div>

        <!-- =========================================================================
             2. TOP 5 QA & PROJECT KPI CARDS ROW
             ========================================================================= -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          
          <!-- Card 1: Total Test Cases -->
          <div onclick="ProjectWorkspaceView.switchTab('qa')" class="dash-bento-card bg-white rounded-2xl border border-slate-300 shadow-2xs hover:border-slate-400 hover:shadow-md transition p-4 flex items-center justify-between cursor-pointer group">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center shrink-0 border border-slate-200 group-hover:scale-105 transition-transform">
                <i data-lucide="clipboard-list" class="w-5 h-5"></i>
              </div>
              <div class="min-w-0">
                <div class="text-[10px] uppercase font-bold text-slate-400 truncate">Total Test Cases</div>
                <div class="text-xl font-black text-slate-950 font-mono">${testCasesCount}</div>
                <div class="text-[10px] text-slate-400 truncate">All test cases in this project</div>
              </div>
            </div>
            <i data-lucide="chevron-right" class="w-4 h-4 text-slate-300 group-hover:text-slate-900 group-hover:translate-x-0.5 transition shrink-0 ml-1"></i>
          </div>

          <!-- Card 2: Passed -->
          <div onclick="ProjectWorkspaceView.switchTab('qa')" class="dash-bento-card bg-white rounded-2xl border border-slate-300 shadow-2xs hover:border-slate-400 hover:shadow-md transition p-4 flex items-center justify-between cursor-pointer group">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 group-hover:scale-105 transition-transform">
                <i data-lucide="check-circle-2" class="w-5 h-5"></i>
              </div>
              <div class="min-w-0">
                <div class="text-[10px] uppercase font-bold text-slate-400 truncate">Passed</div>
                <div class="text-xl font-black text-slate-950 font-mono">${passedCount}</div>
                <div class="text-[10px] text-emerald-600 font-semibold truncate">${passRatePct}% pass rate</div>
              </div>
            </div>
            <i data-lucide="chevron-right" class="w-4 h-4 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition shrink-0 ml-1"></i>
          </div>

          <!-- Card 3: Failed -->
          <div onclick="ProjectWorkspaceView.switchTab('qa')" class="dash-bento-card bg-white rounded-2xl border border-slate-300 shadow-2xs hover:border-slate-400 hover:shadow-md transition p-4 flex items-center justify-between cursor-pointer group">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100 group-hover:scale-105 transition-transform">
                <i data-lucide="x-circle" class="w-5 h-5"></i>
              </div>
              <div class="min-w-0">
                <div class="text-[10px] uppercase font-bold text-slate-400 truncate">Failed</div>
                <div class="text-xl font-black text-slate-950 font-mono">${failedCount}</div>
                <div class="text-[10px] ${failedCount > 0 ? 'text-rose-600 font-bold' : 'text-slate-400'} truncate">${failedCount === 0 ? 'No failures' : `${failedCount} failing tests`}</div>
              </div>
            </div>
            <i data-lucide="chevron-right" class="w-4 h-4 text-slate-300 group-hover:text-rose-600 group-hover:translate-x-0.5 transition shrink-0 ml-1"></i>
          </div>

          <!-- Card 4: Blocked -->
          <div onclick="ProjectWorkspaceView.switchTab('qa')" class="dash-bento-card bg-white rounded-2xl border border-slate-300 shadow-2xs hover:border-slate-400 hover:shadow-md transition p-4 flex items-center justify-between cursor-pointer group">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100 group-hover:scale-105 transition-transform">
                <i data-lucide="clock" class="w-5 h-5"></i>
              </div>
              <div class="min-w-0">
                <div class="text-[10px] uppercase font-bold text-slate-400 truncate">Blocked</div>
                <div class="text-xl font-black text-slate-950 font-mono">${blockedCount}</div>
                <div class="text-[10px] text-slate-400 truncate">${blockedCount === 0 ? 'No blocked tests' : `${blockedCount} blocked`}</div>
              </div>
            </div>
            <i data-lucide="chevron-right" class="w-4 h-4 text-slate-300 group-hover:text-amber-600 group-hover:translate-x-0.5 transition shrink-0 ml-1"></i>
          </div>

          <!-- Card 5: Defects -->
          <div onclick="ProjectWorkspaceView.switchTab('issues')" class="dash-bento-card bg-white rounded-2xl border border-slate-300 shadow-2xs hover:border-slate-400 hover:shadow-md transition p-4 flex items-center justify-between cursor-pointer group">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 border border-teal-100 group-hover:scale-105 transition-transform">
                <i data-lucide="bug" class="w-5 h-5"></i>
              </div>
              <div class="min-w-0">
                <div class="text-[10px] uppercase font-bold text-slate-400 truncate">Defects</div>
                <div class="text-xl font-black text-slate-950 font-mono">${defectsCount}</div>
                <div class="text-[10px] ${defectsCount > 0 ? 'text-rose-600 font-bold' : 'text-slate-400'} truncate">${defectsCount === 0 ? 'No open defects' : `${defectsCount} open defects`}</div>
              </div>
            </div>
            <i data-lucide="chevron-right" class="w-4 h-4 text-slate-300 group-hover:text-teal-600 group-hover:translate-x-0.5 transition shrink-0 ml-1"></i>
          </div>

        </div>

        <!-- =========================================================================
             3. SEGMENTED TAB NAVIGATION BAR (Role Filtered)
             ========================================================================= -->
        <div class="bg-white rounded-2xl p-1.5 border border-slate-300 shadow-2xs flex items-center gap-1 overflow-x-auto horizontal-scroll-touch text-xs">
          
          <button onclick="ProjectWorkspaceView.switchTab('overview')" class="project-tab-btn px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 transition shrink-0 ${this.activeTab === 'overview' ? 'active' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}">
            <i data-lucide="layout-grid" class="w-4 h-4 text-indigo-600"></i>
            <span>Overview</span>
          </button>

          <button onclick="ProjectWorkspaceView.switchTab('board')" class="project-tab-btn px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 transition shrink-0 ${this.activeTab === 'board' ? 'active' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}">
            <i data-lucide="kanban" class="w-4 h-4 text-slate-900"></i>
            <span>Kanban Board</span>
            <span class="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-[#f7fee7] text-[#4d7c0f] border border-[#d9f99d] font-bold">${allIssues.length}</span>
          </button>

          <button onclick="ProjectWorkspaceView.switchTab('issues')" class="project-tab-btn px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 transition shrink-0 ${this.activeTab === 'issues' ? 'active' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}">
            <i data-lucide="list-filter" class="w-4 h-4 text-amber-600"></i>
            <span>Issues & Defects</span>
            <span class="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-200 text-slate-700 font-bold">${allIssues.length}</span>
          </button>

          <button onclick="FloatingProjectChat.open('${project.id}')" class="project-tab-btn px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 transition shrink-0 text-slate-600 hover:text-slate-900 hover:bg-slate-100">
            <i data-lucide="message-square" class="w-4 h-4 text-emerald-600"></i>
            <span>Project Chat</span>
            ${store.getUnreadChatCount(project.id) > 0 ? `<span class="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-emerald-100 text-emerald-700 font-bold">${store.getUnreadChatCount(project.id)}</span>` : ''}
          </button>

          <button onclick="ProjectWorkspaceView.switchTab('releases')" class="project-tab-btn px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 transition shrink-0 ${this.activeTab === 'releases' ? 'active' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}">
            <i data-lucide="shield-alert" class="w-4 h-4 text-purple-600"></i>
            <span>Releases & Quality Gate</span>
            <span class="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-purple-100 text-purple-700 font-bold">${(store.getReleases ? store.getReleases(project.id) : []).length}</span>
          </button>

          ${!isDev && !isViewer ? `
            <button onclick="ProjectWorkspaceView.switchTab('sprints')" class="project-tab-btn px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 transition shrink-0 ${this.activeTab === 'sprints' ? 'active' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}">
              <i data-lucide="flag" class="w-4 h-4 text-purple-600"></i>
              <span>Sprints & Roadmap</span>
              ${stats.activeMilestone ? `<span class="px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-700">${stats.activeMilestone.title.split(":")[0]}</span>` : ''}
            </button>

            <button onclick="ProjectWorkspaceView.switchTab('qa')" class="project-tab-btn px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 transition shrink-0 ${this.activeTab === 'qa' ? 'active' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}">
              <i data-lucide="shield-check" class="w-4 h-4 text-emerald-600"></i>
              <span>QA & Quality Telemetry</span>
              <span class="px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 font-mono">${passRatePct}%</span>
            </button>

            <button onclick="ProjectWorkspaceView.switchTab('team')" class="project-tab-btn px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 transition shrink-0 ${this.activeTab === 'team' ? 'active' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}">
              <i data-lucide="users" class="w-4 h-4 text-cyan-600"></i>
              <span>Team & Workload</span>
              <span class="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-cyan-100 text-cyan-700 font-bold">${(project.members || []).length}</span>
            </button>
          ` : ''}

          ${isPM || isQA ? `
            <button onclick="ProjectWorkspaceView.switchTab('settings')" class="project-tab-btn px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 transition shrink-0 ${this.activeTab === 'settings' ? 'active' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}">
              <i data-lucide="settings" class="w-4 h-4 text-slate-500"></i>
              <span>Settings</span>
            </button>
          ` : ''}

        </div>

      </div>

      <!-- =========================================================================
           4. DYNAMIC TAB CONTENT AREA
           ========================================================================= -->
      <div id="projectTabContent">
        ${this.renderTabContent(project, stats)}
      </div>

      <!-- Modal Containers -->
      <div id="prjModalContainer"></div>
    </div>
  `;

    if (this.activeTab === "board") {
      this.initDragAndDrop();
    }
    
    setTimeout(() => {
      this.initOverview3DCanvases();
    }, 40);

    if (window.lucide) window.lucide.createIcons();
    if (typeof FloatingProjectChat !== 'undefined' && FloatingProjectChat.updateWidget) {
      FloatingProjectChat.updateWidget();
    }
  },

  // =========================================================================
  // TAB 1: EXECUTIVE ADVANCED 3-COLUMN PROJECT OVERVIEW (100% REAL DATA)
  // =========================================================================
  renderOverviewTab(project, stats) {
    const allIssues = store.getIssues(project.id) || [];
    const bugs = allIssues.filter(i => (i.type === "Bug" || i.type === "Defect") && i.status !== "Done" && i.status !== "Closed");
    const rawTestCases = store.getTestCases ? (store.getTestCases(project.id) || []) : [];
    const pm = store.getUserById(project.pmId || project.pm_id) || (project.pmId ? { name: project.pmId, initials: (project.pmId.substring(0, 2)).toUpperCase(), color: "bg-slate-950 text-[#bef264]" } : { name: "Unassigned Lead", initials: "PM", color: "bg-slate-950 text-[#bef264]" });

    // Dynamic Real Counts
    const testCasesCount = rawTestCases.length;
    const passedCount = rawTestCases.filter(t => t.status === 'Passed' || t.status === 'Pass' || t.lastExecutionStatus === 'Passed').length;
    const failedCount = rawTestCases.filter(t => t.status === 'Failed' || t.status === 'Fail' || t.lastExecutionStatus === 'Failed').length;
    const blockedCount = rawTestCases.filter(t => t.status === 'Blocked' || t.lastExecutionStatus === 'Blocked').length;
    const passRatePct = testCasesCount > 0 ? Math.round((passedCount / testCasesCount) * 100) : 0;

    // Real dynamic module aggregation
    const moduleMap = {};
    rawTestCases.forEach(tc => {
      const mod = tc.module || tc.category || tc.suiteName || tc.suite || 'Core Features';
      if (!moduleMap[mod]) moduleMap[mod] = { total: 0, passed: 0, failed: 0, blocked: 0 };
      moduleMap[mod].total++;
      if (tc.status === 'Passed' || tc.status === 'Pass' || tc.lastExecutionStatus === 'Passed') {
        moduleMap[mod].passed++;
      } else if (tc.status === 'Failed' || tc.status === 'Fail' || tc.lastExecutionStatus === 'Failed') {
        moduleMap[mod].failed++;
      } else if (tc.status === 'Blocked' || tc.lastExecutionStatus === 'Blocked') {
        moduleMap[mod].blocked++;
      }
    });
    const modules = Object.entries(moduleMap).map(([name, data]) => ({
      name,
      total: data.total,
      passed: data.passed,
      failed: data.failed,
      blocked: data.blocked,
      pct: data.total > 0 ? Math.round((data.passed / data.total) * 100) : 0
    }));

    // Real project team resolution
    const projectMembersList = store.getProjectMembers ? (store.getProjectMembers(project.id) || []) : [];
    const directMemberIds = project.members || [];
    const allMemberUserIds = Array.from(new Set([...projectMembersList.map(m => m.userId || m.user_id), ...directMemberIds])).filter(Boolean);
    const resolvedMembers = allMemberUserIds.map(uid => store.getUserById(uid)).filter(Boolean);
    if (resolvedMembers.length === 0 && pm && pm.name && pm.name !== 'Unassigned Lead') {
      resolvedMembers.push(pm);
    }

    return `
      <div class="space-y-5">
        
        <!-- 3-COLUMN MAIN OVERVIEW GRID -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          <!-- =========================================================================
               LEFT COLUMN (4 Cols): Project Overview & Module Coverage
               ========================================================================= -->
          <div class="lg:col-span-4 space-y-4">
            
            <!-- Project Overview Card -->
            <div class="bg-white rounded-2xl border border-slate-300 shadow-2xs p-5 space-y-3.5">
              <div class="flex items-center justify-between pb-3 border-b border-slate-100">
                <div class="flex items-center gap-2">
                  <div class="p-1.5 rounded-lg bg-[#f7fee7] text-[#4d7c0f] font-bold">
                    <i data-lucide="layout-grid" class="w-4 h-4"></i>
                  </div>
                  <h3 class="text-xs font-bold text-slate-900">Project Overview</h3>
                </div>
                <button onclick="ProjectWorkspaceView.switchTab('settings')" class="text-[11px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer">
                  <i data-lucide="edit-3" class="w-3 h-3"></i> Edit
                </button>
              </div>

              <p class="text-xs text-slate-600 leading-relaxed">
                ${project.overviewSummary || project.description || '<span class="italic text-slate-400">No detailed overview description has been added for this project yet. You can edit this in Project Settings.</span>'}
              </p>

              <!-- Attribute Key-Value List -->
              <div class="space-y-2.5 pt-2 border-t border-slate-100 text-xs">
                <div class="flex items-center justify-between gap-2">
                  <div class="flex items-center gap-2 text-slate-500 font-medium">
                    <i data-lucide="box" class="w-3.5 h-3.5 text-slate-400"></i>
                    <span>Customer / Client</span>
                  </div>
                  <span class="font-bold text-slate-800">${project.customer || project.application || 'Internal Organization'}</span>
                </div>

                <div class="flex items-center justify-between gap-2">
                  <div class="flex items-center gap-2 text-slate-500 font-medium">
                    <i data-lucide="layers" class="w-3.5 h-3.5 text-slate-400"></i>
                    <span>Category / Tech</span>
                  </div>
                  <span class="font-medium text-slate-700 text-[11px] text-right truncate max-w-[190px]">${Array.isArray(project.techStack) && project.techStack.length > 0 ? project.techStack.join(' • ') : (project.category || 'QA & Engineering')}</span>
                </div>

                <div class="flex items-center justify-between gap-2">
                  <div class="flex items-center gap-2 text-slate-500 font-medium">
                    <i data-lucide="server" class="w-3.5 h-3.5 text-slate-400"></i>
                    <span>Environment</span>
                  </div>
                  <span class="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 font-bold text-[10px] border border-slate-200">${project.environment || 'Staging'}</span>
                </div>

                <div class="flex items-center justify-between gap-2">
                  <div class="flex items-center gap-2 text-slate-500 font-medium">
                    <i data-lucide="flag" class="w-3.5 h-3.5 text-slate-400"></i>
                    <span>Priority</span>
                  </div>
                  <span class="font-bold font-mono ${project.priority === 'P0' ? 'text-red-700' : project.priority === 'P1' ? 'text-amber-700' : 'text-slate-800'}">${project.priority || 'P1'}</span>
                </div>
              </div>
            </div>

            <!-- Module Coverage Card -->
            <div class="bg-white rounded-2xl border border-slate-300 shadow-2xs p-5 space-y-3.5">
              <div class="flex items-center justify-between pb-3 border-b border-slate-100">
                <div class="flex items-center gap-2">
                  <div class="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 font-bold">
                    <i data-lucide="check-square" class="w-4 h-4"></i>
                  </div>
                  <h3 class="text-xs font-bold text-slate-900">Module Coverage</h3>
                </div>
                <span class="text-[10px] font-bold text-slate-400 font-mono">${modules.length > 0 ? `${modules.length} Modules` : '0 Modules'}</span>
              </div>

              ${modules.length > 0 ? `
                <div class="grid grid-cols-2 gap-2.5">
                  ${modules.slice(0, 6).map(m => `
                    <div class="p-2.5 rounded-xl ${m.pct >= 80 ? 'bg-emerald-50/60 border-emerald-200/80 hover:bg-emerald-50' : (m.pct >= 50 ? 'bg-amber-50/60 border-amber-200/80 hover:bg-amber-50' : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100')} border space-y-1 transition">
                      <div class="flex items-center gap-1.5 ${m.pct >= 80 ? 'text-emerald-700' : 'text-slate-700'}">
                        <i data-lucide="folder" class="w-3.5 h-3.5"></i>
                        <span class="text-[11px] font-bold truncate">${m.name}</span>
                      </div>
                      <div class="text-xs font-black ${m.pct >= 80 ? 'text-emerald-950' : 'text-slate-900'} font-mono">${m.pct}%</div>
                      <div class="text-[10px] text-slate-500 font-medium">${m.passed}/${m.total} test cases</div>
                    </div>
                  `).join('')}
                </div>
              ` : `
                <div class="p-5 text-center bg-slate-50/70 rounded-xl border border-dashed border-slate-200 text-xs space-y-2">
                  <div class="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <i data-lucide="layers" class="w-4 h-4"></i>
                  </div>
                  <p class="font-bold text-slate-700">No Module Test Suites Created</p>
                  <p class="text-[11px] text-slate-400 leading-relaxed max-w-xs mx-auto">
                    Create test cases in the QA Telemetry tab to track real-time automated coverage by module.
                  </p>
                  <button onclick="ProjectWorkspaceView.switchTab('qa')" class="px-3 py-1.5 bg-slate-950 text-[#bef264] rounded-lg text-xs font-bold hover:bg-slate-900 transition cursor-pointer">
                    + Add Test Cases
                  </button>
                </div>
              `}
            </div>

          </div>

          <!-- =========================================================================
               MIDDLE COLUMN (5 Cols): Test Execution Status & Execution Trend
               ========================================================================= -->
          <div class="lg:col-span-5 space-y-4">
            
            <!-- Test Execution Status Donut Card -->
            <div class="bg-white rounded-2xl border border-slate-300 shadow-2xs p-5 space-y-4">
              <div class="flex items-center justify-between pb-3 border-b border-slate-100">
                <div class="flex items-center gap-2">
                  <div class="p-1.5 rounded-lg bg-[#f7fee7] text-[#4d7c0f] font-bold">
                    <i data-lucide="activity" class="w-4 h-4"></i>
                  </div>
                  <h3 class="text-xs font-bold text-slate-900">Test Execution Status</h3>
                </div>
                <button onclick="ProjectWorkspaceView.switchTab('qa')" class="text-[11px] font-bold text-slate-900 hover:text-[#4d7c0f] hover:underline flex items-center gap-1 cursor-pointer">
                  View Report
                </button>
              </div>

              <!-- Donut + Counts Breakdown -->
              <div class="flex flex-col sm:flex-row items-center justify-around gap-4 py-2">
                <!-- Circular Donut Graphic -->
                <div class="relative w-28 h-28 flex items-center justify-center shrink-0">
                  <svg class="w-28 h-28 transform -rotate-90" viewBox="0 0 36 36">
                    <path class="text-slate-100" stroke-width="3.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    ${testCasesCount > 0 ? `
                      <path class="text-emerald-500" stroke-dasharray="${passRatePct}, 100" stroke-width="3.5" stroke-linecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    ` : ''}
                  </svg>
                  <div class="absolute flex flex-col items-center justify-center text-center">
                    <span class="text-lg font-black ${testCasesCount > 0 ? 'text-slate-900' : 'text-slate-400'} font-mono leading-none">${testCasesCount > 0 ? `${passRatePct}%` : '0%'}</span>
                    <span class="text-[9px] text-slate-400 font-semibold mt-0.5">${testCasesCount > 0 ? 'Pass Rate' : 'No Tests'}</span>
                  </div>
                </div>

                <!-- Legend Counts -->
                <div class="space-y-2 text-xs w-full sm:w-44">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2 text-slate-600 font-medium">
                      <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>Passed</span>
                    </div>
                    <span class="font-bold text-slate-900 font-mono">${passedCount}</span>
                  </div>

                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2 text-slate-600 font-medium">
                      <span class="w-2 h-2 rounded-full bg-rose-500"></span>
                      <span>Failed</span>
                    </div>
                    <span class="font-bold text-slate-900 font-mono">${failedCount}</span>
                  </div>

                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2 text-slate-600 font-medium">
                      <span class="w-2 h-2 rounded-full bg-amber-500"></span>
                      <span>Blocked</span>
                    </div>
                    <span class="font-bold text-slate-900 font-mono">${blockedCount}</span>
                  </div>

                  <div class="pt-1.5 border-t border-slate-100 flex items-center justify-between font-bold">
                    <div class="flex items-center gap-2 text-slate-500">
                      <span class="w-2 h-2 rounded-full bg-slate-400"></span>
                      <span>Total Test Cases</span>
                    </div>
                    <span class="text-slate-950 font-mono">${testCasesCount}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Test Execution Trend Bar Chart Card -->
            <div class="bg-white rounded-2xl border border-slate-300 shadow-2xs p-5 space-y-3.5">
              <div class="flex items-center justify-between pb-3 border-b border-slate-100">
                <div class="flex items-center gap-2">
                  <div class="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 font-bold">
                    <i data-lucide="bar-chart-2" class="w-4 h-4"></i>
                  </div>
                  <h3 class="text-xs font-bold text-slate-900">Test Execution Trend</h3>
                </div>

                <div class="flex items-center gap-3">
                  <!-- Status Dots Legend -->
                  <div class="hidden sm:flex items-center gap-2 text-[10px] font-semibold text-slate-500">
                    <span class="flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Passed</span>
                    <span class="flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Failed</span>
                    <span class="flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Blocked</span>
                  </div>

                  <span class="text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5">
                    Last 7 Days
                  </span>
                </div>
              </div>

              <!-- Bar Chart Canvas Container -->
              <div class="relative h-44 w-full">
                <canvas id="projectExecutionTrendCanvas" class="w-full h-full block"></canvas>
              </div>
            </div>

          </div>

          <!-- =========================================================================
               RIGHT COLUMN (3 Cols): Quick Actions & Project Team
               ========================================================================= -->
          <div class="lg:col-span-3 space-y-4">
            
            <!-- Quick Actions Card -->
            <div class="bg-white rounded-2xl border border-slate-300 shadow-2xs p-5 space-y-3.5">
              <div class="flex items-center gap-2 pb-3 border-b border-slate-100">
                <div class="p-1.5 rounded-lg bg-purple-50 text-purple-600 font-bold">
                  <i data-lucide="zap" class="w-4 h-4"></i>
                </div>
                <h3 class="text-xs font-bold text-slate-900">Quick Actions</h3>
              </div>

              <div class="space-y-2">
                <!-- Action 1: Create Test Case (Primary Lime Green CTA) -->
                <button onclick="window.app.openCreateIssueModal ? window.app.openCreateIssueModal('${project.id}') : null" class="w-full py-2.5 px-3.5 rounded-xl bg-[#bef264] hover:bg-[#a3e635] text-slate-950 font-bold text-xs shadow-xs shadow-[#bef264]/25 transition flex items-center justify-between cursor-pointer group">
                  <div class="flex items-center gap-2">
                    <i data-lucide="plus" class="w-4 h-4 font-bold"></i>
                    <span>Create Test Case</span>
                  </div>
                  <i data-lucide="chevron-right" class="w-3.5 h-3.5 text-slate-900 group-hover:translate-x-0.5 transition"></i>
                </button>

                <!-- Action 2: Run Test (Dark Obsidian) -->
                <button onclick="ProjectWorkspaceView.switchTab('qa')" class="w-full py-2.5 px-3.5 rounded-xl bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs shadow-2xs transition flex items-center justify-between cursor-pointer group">
                  <div class="flex items-center gap-2">
                    <i data-lucide="play" class="w-4 h-4 text-[#bef264]"></i>
                    <span>Run Test</span>
                  </div>
                  <i data-lucide="chevron-right" class="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition"></i>
                </button>

                <!-- Action 3: Log Defect (Light Emerald) -->
                <button onclick="window.app.openCreateIssueModal ? window.app.openCreateIssueModal('${project.id}', null, 'Bug') : null" class="w-full py-2.5 px-3.5 rounded-xl bg-[#f7fee7] hover:bg-[#ecfccb] text-[#4d7c0f] border border-[#d9f99d] font-bold text-xs transition flex items-center justify-between cursor-pointer group">
                  <div class="flex items-center gap-2">
                    <i data-lucide="bug" class="w-4 h-4 text-[#4d7c0f]"></i>
                    <span>Log Defect</span>
                  </div>
                  <i data-lucide="chevron-right" class="w-3.5 h-3.5 text-[#4d7c0f] group-hover:translate-x-0.5 transition"></i>
                </button>

                <!-- Action 4: View Reports (Light Neutral) -->
                <button onclick="ProjectWorkspaceView.switchTab('qa')" class="w-full py-2.5 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 font-bold text-xs transition flex items-center justify-between cursor-pointer group">
                  <div class="flex items-center gap-2">
                    <i data-lucide="trending-up" class="w-4 h-4 text-slate-700"></i>
                    <span>View Reports</span>
                  </div>
                  <i data-lucide="chevron-right" class="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition"></i>
                </button>
              </div>
            </div>

            <!-- Project Team Card -->
            <div class="bg-white rounded-2xl border border-slate-300 shadow-2xs p-5 space-y-3.5">
              <div class="flex items-center justify-between pb-3 border-b border-slate-100">
                <div class="flex items-center gap-2">
                  <div class="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 font-bold">
                    <i data-lucide="users" class="w-4 h-4"></i>
                  </div>
                  <h3 class="text-xs font-bold text-slate-900">Project Team</h3>
                </div>
                <button onclick="ProjectWorkspaceView.switchTab('team')" class="text-[11px] font-bold text-slate-900 hover:text-[#4d7c0f] hover:underline cursor-pointer">
                  Manage
                </button>
              </div>

              <!-- Team Member List -->
              <div class="space-y-2.5">
                ${resolvedMembers.length > 0 ? resolvedMembers.slice(0, 4).map((member, idx) => {
                  const isLead = idx === 0 && (member.id === (project.pmId || project.pm_id) || member.name === (project.pmId || project.pm_id));
                  return `
                    <div class="flex items-center justify-between gap-2">
                      <div class="flex items-center gap-2.5 min-w-0">
                        <div class="w-8 h-8 rounded-full ${member.color || 'bg-slate-950 text-[#bef264]'} text-xs font-black flex items-center justify-center shrink-0 shadow-2xs">
                          ${member.initials || (member.name ? member.name.substring(0, 2).toUpperCase() : 'PW')}
                        </div>
                        <div class="min-w-0">
                          <div class="text-xs font-bold text-slate-900 truncate">${member.name || 'Team Member'}</div>
                          <div class="text-[10px] text-slate-400 truncate">${member.email || member.role || 'Member'}</div>
                        </div>
                      </div>
                      <span class="px-2 py-0.5 rounded-md ${isLead ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-slate-100 text-slate-700 border border-slate-200'} text-[10px] font-bold shrink-0">
                        ${isLead ? 'Lead PM' : (member.role || 'Member')}
                      </span>
                    </div>
                  `;
                }).join('') : `
                  <div class="p-3 text-center text-slate-400 text-xs">
                    No team members assigned yet
                  </div>
                `}
              </div>

              <div class="pt-2 border-t border-slate-100">
                <button onclick="ProjectWorkspaceView.switchTab('team')" class="w-full text-center text-[11px] font-bold text-slate-500 hover:text-slate-800 py-1 transition cursor-pointer flex items-center justify-center gap-1">
                  <i data-lucide="user-plus" class="w-3.5 h-3.5"></i>
                  <span>${resolvedMembers.length > 4 ? `+ ${resolvedMembers.length - 4} more members` : 'Add Team Members'}</span>
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>
    `;
  },

  // =========================================================================
  // 3D OVERVIEW CANVAS INITIALIZERS
  // =========================================================================
  initOverview3DCanvases() {
    if (typeof requestAnimationFrame !== "function") return;

    // A. 3D Rotating Wireframe Node Lattice in Header
    const latticeCanvas = document.getElementById("projectNodeLatticeCanvas");
    if (latticeCanvas && typeof latticeCanvas.getContext === "function") {
      const ctx = latticeCanvas.getContext("2d");
      if (ctx && typeof ctx.clearRect === "function") {
        let angleX = 0;
        let angleY = 0;
        const phi = (1 + Math.sqrt(5)) / 2;
        const rawVertices = [
          [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
          [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
          [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1]
        ].map(v => {
          const mag = Math.sqrt(v[0]**2 + v[1]**2 + v[2]**2);
          return [v[0] / mag * 24, v[1] / mag * 24, v[2] / mag * 24];
        });

        const drawLattice = () => {
          ctx.clearRect(0, 0, latticeCanvas.width, latticeCanvas.height);
          const cx = latticeCanvas.width / 2;
          const cy = latticeCanvas.height / 2;

          angleX += 0.008;
          angleY += 0.012;

          const projected = rawVertices.map(v => {
            let x1 = v[0] * Math.cos(angleY) + v[2] * Math.sin(angleY);
            let z1 = -v[0] * Math.sin(angleY) + v[2] * Math.cos(angleY);
            let y2 = v[1] * Math.cos(angleX) - z1 * Math.sin(angleX);
            let z2 = v[1] * Math.sin(angleX) + z1 * Math.cos(angleX);
            const scale = 100 / (100 + z2);
            return { x: cx + x1 * scale, y: cy + y2 * scale, z: z2 };
          });

          ctx.lineWidth = 0.8;
          for (let i = 0; i < projected.length; i++) {
            for (let j = i + 1; j < projected.length; j++) {
              const dx = projected[i].x - projected[j].x;
              const dy = projected[i].y - projected[j].y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < 28) {
                const alpha = Math.max(0.1, 1 - dist / 28) * 0.4;
                ctx.strokeStyle = `rgba(59, 130, 246, ${alpha})`;
                ctx.beginPath();
                ctx.moveTo(projected[i].x, projected[i].y);
                ctx.lineTo(projected[j].x, projected[j].y);
                ctx.stroke();
              }
            }
          }

          projected.forEach(p => {
            const nodeAlpha = Math.max(0.3, (p.z + 24) / 48);
            ctx.fillStyle = `rgba(37, 99, 235, ${nodeAlpha})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 1.8, 0, Math.PI * 2);
            ctx.fill();
          });

          const animId = requestAnimationFrame(drawLattice);
          this.animationFrameIds.push(animId);
        };
        drawLattice();
      }
    }

    // B. 3D Holographic Verified Shield Orb in QA Clearance Card
    const orbCanvas = document.getElementById("projectQualityOrbCanvas");
    if (orbCanvas && typeof orbCanvas.getContext === "function") {
      const ctx = orbCanvas.getContext("2d");
      if (ctx && typeof ctx.clearRect === "function") {
        let pulse = 0;
        const drawOrb = () => {
          ctx.clearRect(0, 0, orbCanvas.width, orbCanvas.height);
          pulse += 0.03;

          const cx = orbCanvas.width / 2;
          const cy = orbCanvas.height / 2;
          const r = 24;

          // Holographic Ring
          const ringR = r + ((pulse * 12) % 18);
          const ringAlpha = Math.max(0, 1 - (ringR - r) / 18) * 0.4;
          ctx.strokeStyle = `rgba(16, 185, 129, ${ringAlpha})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
          ctx.stroke();

          // Green Orb Gradient
          const orbGrad = ctx.createRadialGradient(cx - 6, cy - 6, 2, cx, cy, r);
          orbGrad.addColorStop(0, '#ffffff');
          orbGrad.addColorStop(0.3, '#dcfce7');
          orbGrad.addColorStop(0.8, '#10b981');
          orbGrad.addColorStop(1, '#047857');

          ctx.fillStyle = orbGrad;
          ctx.shadowColor = 'rgba(16, 185, 129, 0.35)';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;

          // Checkmark
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2.8;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.beginPath();
          ctx.moveTo(cx - 8, cy);
          ctx.lineTo(cx - 2, cy + 6);
          ctx.lineTo(cx + 9, cy - 5);
          ctx.stroke();

          const animId = requestAnimationFrame(drawOrb);
          this.animationFrameIds.push(animId);
        };
        drawOrb();
      }
    }

    // C. Test Execution Trend Interactive Bar Chart Canvas (100% Real Dynamic Data)
    const trendCanvas = document.getElementById("projectExecutionTrendCanvas");
    if (trendCanvas && typeof trendCanvas.getContext === "function") {
      const ctx = trendCanvas.getContext("2d");
      if (ctx) {
        const parent = trendCanvas.parentElement;
        const dpr = window.devicePixelRatio || 1;
        const width = parent ? parent.clientWidth : 380;
        const height = parent ? parent.clientHeight : 170;
        
        trendCanvas.width = width * dpr;
        trendCanvas.height = height * dpr;
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, width, height);

        const padLeft = 32;
        const padRight = 16;
        const padTop = 16;
        const padBottom = 28;
        const chartW = width - padLeft - padRight;
        const chartH = height - padTop - padBottom;

        // 1. Dynamic 7-day timeline generation
        const days = [];
        const dayKeys = [];
        const now = new Date();
        for (let i = 6; i >= 0; i--) {
          const d = new Date(now.getTime() - i * 86400000);
          const monthStr = d.toLocaleDateString('en-US', { month: 'short' });
          const dayNum = String(d.getDate()).padStart(2, '0');
          days.push(`${monthStr} ${dayNum}`);
          dayKeys.push(d.toISOString().split('T')[0]);
        }

        // 2. Fetch real execution telemetry for active project
        const project = store.getActiveProject();
        const passedData = [0, 0, 0, 0, 0, 0, 0];
        const failedData = [0, 0, 0, 0, 0, 0, 0];
        const blockedData = [0, 0, 0, 0, 0, 0, 0];

        if (project) {
          const rawTestCases = store.getTestCases ? (store.getTestCases(project.id) || []) : [];
          const rawTestRuns = store.getTestRuns ? (store.getTestRuns(project.id) || []) : [];

          rawTestRuns.forEach(run => {
            const rDate = (run.createdAt || run.created_at || '').split('T')[0];
            const idx = dayKeys.indexOf(rDate);
            if (idx !== -1) {
              passedData[idx] += (run.passed || 0);
              failedData[idx] += (run.failed || 0);
              blockedData[idx] += (run.blocked || 0);
            }
          });

          rawTestCases.forEach(tc => {
            const tcDate = (tc.executedAt || tc.updatedAt || tc.created_at || '').split('T')[0];
            const idx = dayKeys.indexOf(tcDate);
            if (idx !== -1) {
              if (tc.status === 'Passed' || tc.status === 'Pass' || tc.lastExecutionStatus === 'Passed') passedData[idx]++;
              else if (tc.status === 'Failed' || tc.status === 'Fail' || tc.lastExecutionStatus === 'Failed') failedData[idx]++;
              else if (tc.status === 'Blocked' || tc.lastExecutionStatus === 'Blocked') blockedData[idx]++;
            }
          });
        }

        const maxVal = Math.max(...passedData, ...failedData, ...blockedData, 0);
        const yMax = maxVal === 0 ? 4 : (maxVal <= 4 ? 4 : (maxVal <= 10 ? 10 : Math.ceil(maxVal / 5) * 5));

        // 3. Draw Y-axis grid lines
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.font = "600 10px JetBrains Mono, monospace";
        ctx.fillStyle = "#94a3b8";

        for (let i = 0; i <= yMax; i += (yMax <= 4 ? 1 : Math.ceil(yMax / 4))) {
          const y = padTop + chartH - (i / yMax) * chartH;
          ctx.fillText(i.toString(), padLeft - 8, y);
          
          ctx.beginPath();
          ctx.strokeStyle = i === 0 ? "#cbd5e1" : "#f1f5f9";
          ctx.lineWidth = 1;
          ctx.moveTo(padLeft, y);
          ctx.lineTo(width - padRight, y);
          ctx.stroke();
        }

        // 4. Render Days & Bars
        const barW = Math.min(18, Math.max(10, (chartW / days.length) * 0.35));
        const slotW = chartW / days.length;
        let totalExecutionsInWindow = 0;

        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.font = "600 10px Inter, sans-serif";

        days.forEach((day, idx) => {
          const cx = padLeft + idx * slotW + slotW / 2;
          
          // X label
          ctx.fillStyle = "#94a3b8";
          ctx.fillText(day, cx, height - padBottom + 8);

          const pVal = passedData[idx] || 0;
          const fVal = failedData[idx] || 0;
          const bVal = blockedData[idx] || 0;
          const val = pVal + fVal + bVal;
          totalExecutionsInWindow += val;

          if (val > 0) {
            const barH = (val / yMax) * chartH;
            const barY = padTop + chartH - barH;
            const barX = cx - barW / 2;

            if (ctx.createLinearGradient) {
              const barGrad = ctx.createLinearGradient(barX, barY, barX, barY + barH);
              barGrad.addColorStop(0, fVal > 0 ? "#f43f5e" : "#10b981");
              barGrad.addColorStop(1, fVal > 0 ? "#e11d48" : "#059669");
              ctx.fillStyle = barGrad;
            } else {
              ctx.fillStyle = fVal > 0 ? "#f43f5e" : "#10b981";
            }

            ctx.beginPath();
            const r = 3;
            ctx.moveTo(barX + r, barY);
            ctx.lineTo(barX + barW - r, barY);
            ctx.quadraticCurveTo(barX + barW, barY, barX + barW, barY + r);
            ctx.lineTo(barX + barW, barY + barH);
            ctx.lineTo(barX, barY + barH);
            ctx.lineTo(barX, barY + r);
            ctx.quadraticCurveTo(barX, barY, barX + r, barY);
            ctx.closePath();
            ctx.fill();
          }
        });

        // 5. If no execution data in this 7-day window, render helpful subtle watermark
        if (totalExecutionsInWindow === 0) {
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = "#94a3b8";
          ctx.font = "500 11px Inter, sans-serif";
          ctx.fillText("No test executions recorded in the last 7 days", padLeft + chartW / 2, padTop + chartH / 2);
        }
      }
    }
  },

  switchTab(tabName) {
    const project = store.getActiveProject();
    if (project) {
      store.setActiveProject(project.id);
      const activeUser = store.getActiveUser ? store.getActiveUser() : null;
      const userRole = (store.getUserProjectRole(project.id, activeUser?.id) || store.getUserSpaceRole(project.workspace_id || project.workspaceId, activeUser?.id) || 'DEVELOPER').toUpperCase();
      const isDev = userRole === 'DEVELOPER';
      const isViewer = userRole === 'VIEWER' || userRole === 'CLIENT_VIEWER';

      if (isDev && !['overview', 'board', 'issues'].includes(tabName)) {
        tabName = 'board';
      } else if (isViewer && !['overview', 'board', 'issues', 'docs'].includes(tabName)) {
        tabName = 'overview';
      }
      window.location.hash = `project-workspace?projectId=${project.id}&tab=${tabName}`;
    }
    this.activeTab = tabName;
    this.render(document.getElementById("mainContent"));
    if (typeof FloatingProjectChat !== 'undefined' && FloatingProjectChat.updateWidget) {
      FloatingProjectChat.updateWidget();
    }
  },

  renderTabContent(project, stats) {
    switch (this.activeTab) {
      case "overview":
        return this.renderOverviewTab(project, stats);
      case "board":
        return this.renderBoardTab(project, stats);
      case "issues":
        return this.renderIssuesTab(project, stats);
      case "sprints":
        return this.renderSprintsTab(project, stats);
      case "qa":
        return this.renderQATab(project, stats);
      case "team":
        return this.renderTeamTab(project, stats);
      case "releases":
        setTimeout(() => {
          const tabEl = document.getElementById("projectTabContent");
          if (tabEl && typeof ReleasesView !== 'undefined') {
            ReleasesView.render(tabEl, project.id);
          }
        }, 10);
        return `<div class="p-8 text-center text-slate-400 text-xs"><i data-lucide="loader-2" class="w-6 h-6 animate-spin mx-auto text-purple-600 mb-2"></i> Loading Releases & Quality Gates...</div>`;
      case "docs":
        return this.renderDocumentationTab(project, stats);
      case "settings":
        return this.renderSettingsTab(project);
      default:
        return this.renderOverviewTab(project, stats);
    }
  },

  // =========================================================================
  // TAB 2: ENHANCED KANBAN BOARD WITH STREAMLINED MODERN TOOLBAR (IMAGE 1 & 2)
  // =========================================================================
  getTaskViewLabel(totalCount, bugCount, criticalCount, qaCount) {
    if (this.filterQuick === 'my_issues') return 'My Tasks';
    if (this.filterQuick === 'bugs_only') return `Bugs (${bugCount})`;
    if (this.filterQuick === 'critical_only') return `Critical (${criticalCount})`;
    if (this.filterQuick === 'qa_ready') return `QA Queue (${qaCount})`;
    return 'All Tasks';
  },

  toggleTaskViewDropdown() {
    this.taskViewDropdownOpen = !this.taskViewDropdownOpen;
    this.render(document.getElementById("mainContent"));
    if (this.taskViewDropdownOpen) {
      setTimeout(() => {
        const closeHandler = (e) => {
          if (!e.target.closest("#boardTasksDropdownBtn")) {
            ProjectWorkspaceView.taskViewDropdownOpen = false;
            const content = document.getElementById("mainContent");
            if (content && ProjectWorkspaceView.activeTab === 'board') {
              ProjectWorkspaceView.render(content);
            }
            document.removeEventListener("click", closeHandler);
          }
        };
        document.addEventListener("click", closeHandler);
      }, 10);
    }
  },

  setTaskView(view) {
    this.filterQuick = view;
    this.taskViewDropdownOpen = false;
    this.render(document.getElementById("mainContent"));
  },

  toggleSort() {
    this.boardSortAsc = !this.boardSortAsc;
    window.app.toast("Sort Changed", `Cards sorted ${this.boardSortAsc ? 'Ascending' : 'Descending'}.`, "info");
    this.render(document.getElementById("mainContent"));
  },

  renderBoardTab(project, stats) {
    const issues = store.getIssues(project.id) || [];
    let filtered = this.filterIssues(issues);
    const users = store.getUsers() || [];
    const sprints = store.getSprints(project.id) || [];

    const totalCount = issues.length;
    const bugCount = issues.filter(i => (i.type === "Bug" || i.type === "Defect") && i.status !== "Done" && i.status !== "Closed").length;
    const criticalCount = issues.filter(i => (i.priority || "").toLowerCase() === "critical" && i.status !== "Done" && i.status !== "Closed").length;
    const qaCount = issues.filter(i => (i.status === "Ready for QA" || i.status === "QA Testing" || (i.qaStatus || "").toLowerCase() === "testing" || (i.qaStatus || "").toLowerCase() === "ready for qa")).length;
    const hasActiveFilters = this.filterType !== 'all' || this.filterPriority !== 'all' || this.filterAssignee !== 'all' || this.filterQAStatus !== 'all' || this.filterSprint !== 'all' || this.searchQuery.trim() !== '';

    // Sort cards according to boardSortAsc
    filtered.sort((a, b) => {
      const keyA = a.key || "";
      const keyB = b.key || "";
      return this.boardSortAsc ? keyA.localeCompare(keyB, undefined, { numeric: true }) : keyB.localeCompare(keyA, undefined, { numeric: true });
    });

    return `
      <div class="space-y-4">
        
        <!-- Streamlined Kanban Control Bar (Matching Reference Image 1) -->
        <div class="bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
          
          <!-- Main Toolbar Row: Left Task Selector Dropdown, Right Search/Filter/Sort/Create -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            
            <!-- Left Area: All Tasks Dropdown -->
            <div class="relative inline-block text-left shrink-0">
              <button 
                id="boardTasksDropdownBtn"
                onclick="ProjectWorkspaceView.toggleTaskViewDropdown()" 
                class="flex items-center gap-2 px-3.5 py-2 bg-slate-50 hover:bg-slate-100/90 text-slate-800 border border-slate-200/90 rounded-xl font-bold text-xs transition shadow-2xs cursor-pointer select-none"
              >
                <i data-lucide="layout-grid" class="w-4 h-4 text-slate-600"></i>
                <span class="font-bold text-slate-900">${this.getTaskViewLabel(totalCount, bugCount, criticalCount, qaCount)}</span>
                <i data-lucide="chevron-down" class="w-3.5 h-3.5 text-slate-400"></i>
              </button>

              <!-- Dropdown Menu -->
              ${this.taskViewDropdownOpen ? `
                <div class="absolute left-0 top-full mt-1.5 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-40 animate-fade-in text-xs">
                  <button onclick="ProjectWorkspaceView.setTaskView('all')" class="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center justify-between font-medium ${this.filterQuick === 'all' ? 'text-[#4d7c0f] font-bold bg-[#f7fee7]' : 'text-slate-700'}">
                    <span class="flex items-center gap-2"><i data-lucide="layers" class="w-3.5 h-3.5"></i> All Tasks</span>
                    <span class="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-bold">${totalCount}</span>
                  </button>
                  <button onclick="ProjectWorkspaceView.setTaskView('my_issues')" class="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center justify-between font-medium ${this.filterQuick === 'my_issues' ? 'text-[#4d7c0f] font-bold bg-[#f7fee7]' : 'text-slate-700'}">
                    <span class="flex items-center gap-2"><i data-lucide="user" class="w-3.5 h-3.5"></i> My Tasks</span>
                  </button>
                  <button onclick="ProjectWorkspaceView.setTaskView('bugs_only')" class="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center justify-between font-medium ${this.filterQuick === 'bugs_only' ? 'text-rose-600 font-bold bg-rose-50/50' : 'text-slate-700'}">
                    <span class="flex items-center gap-2"><i data-lucide="bug" class="w-3.5 h-3.5 text-rose-500"></i> Bugs Only</span>
                    <span class="font-mono text-[10px] px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 font-bold">${bugCount}</span>
                  </button>
                  <button onclick="ProjectWorkspaceView.setTaskView('critical_only')" class="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center justify-between font-medium ${this.filterQuick === 'critical_only' ? 'text-amber-600 font-bold bg-amber-50/50' : 'text-slate-700'}">
                    <span class="flex items-center gap-2"><i data-lucide="flame" class="w-3.5 h-3.5 text-amber-500"></i> Critical Issues</span>
                    <span class="font-mono text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold">${criticalCount}</span>
                  </button>
                  <button onclick="ProjectWorkspaceView.setTaskView('qa_ready')" class="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center justify-between font-medium ${this.filterQuick === 'qa_ready' ? 'text-purple-600 font-bold bg-purple-50/50' : 'text-slate-700'}">
                    <span class="flex items-center gap-2"><i data-lucide="shield-check" class="w-3.5 h-3.5 text-purple-500"></i> QA Queue</span>
                    <span class="font-mono text-[10px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 font-bold">${qaCount}</span>
                  </button>
                </div>
              ` : ''}
            </div>

            <!-- Right Area: Search, Filter, Sort, Create Task Button -->
            <div class="flex flex-wrap items-center gap-2.5 flex-1 sm:flex-none justify-end">
              
              <!-- Instant Search Input -->
              <div class="relative min-w-[210px] max-w-xs flex-1 sm:flex-none">
                <i data-lucide="search" class="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400"></i>
                <input 
                  type="text" 
                  value="${this.searchQuery}" 
                  oninput="ProjectWorkspaceView.handleSearch(this.value)" 
                  placeholder="Search issues or cards..." 
                  class="w-full pl-8 pr-7 py-2 bg-slate-50/80 hover:bg-slate-100/80 focus:bg-white border border-slate-200/90 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none transition shadow-2xs" 
                />
                ${this.searchQuery ? `
                  <button onclick="ProjectWorkspaceView.handleSearch('')" class="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer">
                    <i data-lucide="x" class="w-3 h-3"></i>
                  </button>
                ` : ''}
              </div>

              <!-- Filter Popover Toggle -->
              <div class="relative">
                <button 
                  onclick="ProjectWorkspaceView.toggleFilterMenu()" 
                  class="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200/90 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 transition cursor-pointer shadow-2xs ${this.filterMenuOpen ? 'ring-2 ring-slate-900 bg-slate-100' : ''}"
                >
                  <i data-lucide="sliders-horizontal" class="w-3.5 h-3.5 text-slate-500"></i>
                  <span>Filter</span>
                  ${(this.filterType !== 'all' || this.filterPriority !== 'all' || this.filterAssignee !== 'all' || this.filterQAStatus !== 'all' || this.filterSprint !== 'all') ? `
                    <span class="w-2 h-2 rounded-full bg-[#84cc16]"></span>
                  ` : ''}
                </button>

                <!-- Filter Popover Panel -->
                ${this.filterMenuOpen ? `
                  <div class="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 space-y-3 z-30 animate-fade-in text-xs">
                    <div class="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span class="font-bold text-slate-900 uppercase text-[10px] tracking-wider">Advanced Filters</span>
                      <button onclick="ProjectWorkspaceView.clearFilters(); ProjectWorkspaceView.filterMenuOpen = false;" class="text-rose-600 hover:underline text-[11px] font-bold cursor-pointer">Reset</button>
                    </div>

                    <!-- Swimlane Group By -->
                    <div class="space-y-1">
                      <label class="text-[10px] font-bold text-slate-400 uppercase">Swimlane Grouping</label>
                      <select onchange="ProjectWorkspaceView.setSwimlane(this.value)" class="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800">
                        <option value="none" ${this.swimlaneBy === 'none' ? 'selected' : ''}>No Swimlanes</option>
                        <option value="assignee" ${this.swimlaneBy === 'assignee' ? 'selected' : ''}>Group by Assignee</option>
                        <option value="priority" ${this.swimlaneBy === 'priority' ? 'selected' : ''}>Group by Priority</option>
                        <option value="type" ${this.swimlaneBy === 'type' ? 'selected' : ''}>Group by Type</option>
                      </select>
                    </div>

                    <!-- Type Filter -->
                    <div class="space-y-1">
                      <label class="text-[10px] font-bold text-slate-400 uppercase">Issue Type</label>
                      <select onchange="ProjectWorkspaceView.setFilter('type', this.value)" class="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800">
                        <option value="all" ${this.filterType === 'all' ? 'selected' : ''}>All Types</option>
                        <option value="Bug" ${this.filterType === 'Bug' ? 'selected' : ''}>Bug (Defect)</option>
                        <option value="Story" ${this.filterType === 'Story' ? 'selected' : ''}>Story</option>
                        <option value="Task" ${this.filterType === 'Task' ? 'selected' : ''}>Task</option>
                      </select>
                    </div>

                    <!-- Priority Filter -->
                    <div class="space-y-1">
                      <label class="text-[10px] font-bold text-slate-400 uppercase">Priority</label>
                      <select onchange="ProjectWorkspaceView.setFilter('priority', this.value)" class="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800">
                        <option value="all" ${this.filterPriority === 'all' ? 'selected' : ''}>All Priorities</option>
                        <option value="Critical" ${this.filterPriority === 'Critical' ? 'selected' : ''}>Critical</option>
                        <option value="High" ${this.filterPriority === 'High' ? 'selected' : ''}>High</option>
                        <option value="Medium" ${this.filterPriority === 'Medium' ? 'selected' : ''}>Medium</option>
                        <option value="Low" ${this.filterPriority === 'Low' ? 'selected' : ''}>Low</option>
                      </select>
                    </div>

                    <!-- Assignee Filter -->
                    <div class="space-y-1">
                      <label class="text-[10px] font-bold text-slate-400 uppercase">Assignee</label>
                      <select onchange="ProjectWorkspaceView.setFilter('assignee', this.value)" class="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800">
                        <option value="all" ${this.filterAssignee === 'all' ? 'selected' : ''}>All Assignees</option>
                        ${users.map(u => `<option value="${u.id}" ${this.filterAssignee === u.id ? 'selected' : ''}>${u.name}</option>`).join("")}
                      </select>
                    </div>

                    <!-- QA Status Filter -->
                    <div class="space-y-1">
                      <label class="text-[10px] font-bold text-slate-400 uppercase">QA Status</label>
                      <select onchange="ProjectWorkspaceView.setFilter('qaStatus', this.value)" class="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800">
                        <option value="all" ${this.filterQAStatus === 'all' ? 'selected' : ''}>All QA Statuses</option>
                        <option value="Not Tested" ${this.filterQAStatus === 'Not Tested' ? 'selected' : ''}>Not Tested</option>
                        <option value="Ready for QA" ${this.filterQAStatus === 'Ready for QA' ? 'selected' : ''}>Ready for QA</option>
                        <option value="Testing" ${this.filterQAStatus === 'Testing' ? 'selected' : ''}>Testing</option>
                        <option value="Passed" ${this.filterQAStatus === 'Passed' ? 'selected' : ''}>QA Passed</option>
                        <option value="Failed" ${this.filterQAStatus === 'Failed' ? 'selected' : ''}>QA Failed</option>
                        <option value="Blocked" ${this.filterQAStatus === 'Blocked' ? 'selected' : ''}>QA Blocked</option>
                      </select>
                    </div>

                    <!-- Sprint Filter -->
                    ${sprints.length > 0 ? `
                      <div class="space-y-1">
                        <label class="text-[10px] font-bold text-slate-400 uppercase">Sprint</label>
                        <select onchange="ProjectWorkspaceView.setFilter('sprint', this.value)" class="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800">
                          <option value="all" ${this.filterSprint === 'all' ? 'selected' : ''}>All Sprints</option>
                          ${sprints.map(s => `<option value="${s.id}" ${this.filterSprint === s.id ? 'selected' : ''}>${s.name || s.title}</option>`).join("")}
                        </select>
                      </div>
                    ` : ''}

                    <div class="pt-2 border-t border-slate-100 flex justify-end">
                      <button onclick="ProjectWorkspaceView.toggleFilterMenu()" class="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition cursor-pointer">Done</button>
                    </div>
                  </div>
                ` : ''}
              </div>

              <!-- Sort Order Toggle Button -->
              <button 
                onclick="ProjectWorkspaceView.toggleSort()" 
                class="px-2.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200/90 rounded-xl text-slate-700 transition cursor-pointer shadow-2xs"
                title="Sort cards (${this.boardSortAsc ? 'Ascending' : 'Descending'})"
              >
                <i data-lucide="arrow-up-down" class="w-4 h-4 text-slate-600"></i>
              </button>

              <!-- Create Task Action Button (Matching Reference Image 1) -->
              <button 
                onclick="window.app.openCreateTaskModal('${project.id}')" 
                class="px-4 py-2 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 rounded-xl font-bold shadow-xs shadow-[#bef264]/25 transition flex items-center gap-1.5 cursor-pointer text-xs"
              >
                <i data-lucide="plus" class="w-4 h-4 text-slate-950 font-bold"></i>
                <span>Create Task</span>
              </button>

            </div>

          </div>

          <!-- Active Filter Strip (Conditional) -->
          ${hasActiveFilters ? `
            <div class="flex flex-wrap items-center gap-2 pt-2.5 border-t border-slate-100 text-xs">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active:</span>
              
              ${this.searchQuery ? `
                <span class="px-2.5 py-0.5 rounded-lg bg-[#f7fee7] text-[#4d7c0f] border border-[#d9f99d] font-medium flex items-center gap-1 text-[11px]">
                  <span>Search: "${this.searchQuery}"</span>
                  <button onclick="ProjectWorkspaceView.handleSearch('')" class="hover:text-slate-950 cursor-pointer"><i data-lucide="x" class="w-3 h-3"></i></button>
                </span>
              ` : ''}

              ${this.filterType !== 'all' ? `
                <span class="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 font-medium flex items-center gap-1 text-[11px]">
                  <span>Type: ${this.filterType}</span>
                  <button onclick="ProjectWorkspaceView.setFilter('type', 'all')" class="hover:text-slate-900 cursor-pointer"><i data-lucide="x" class="w-3 h-3"></i></button>
                </span>
              ` : ''}

              ${this.filterPriority !== 'all' ? `
                <span class="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 font-medium flex items-center gap-1 text-[11px]">
                  <span>Priority: ${this.filterPriority}</span>
                  <button onclick="ProjectWorkspaceView.setFilter('priority', 'all')" class="hover:text-slate-900 cursor-pointer"><i data-lucide="x" class="w-3 h-3"></i></button>
                </span>
              ` : ''}

              ${this.filterAssignee !== 'all' ? `
                <span class="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 font-medium flex items-center gap-1 text-[11px]">
                  <span>Assignee: ${store.getUserById(this.filterAssignee)?.name || this.filterAssignee}</span>
                  <button onclick="ProjectWorkspaceView.setFilter('assignee', 'all')" class="hover:text-slate-900 cursor-pointer"><i data-lucide="x" class="w-3 h-3"></i></button>
                </span>
              ` : ''}

              ${this.filterQAStatus !== 'all' ? `
                <span class="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 font-medium flex items-center gap-1 text-[11px]">
                  <span>QA: ${this.filterQAStatus}</span>
                  <button onclick="ProjectWorkspaceView.setFilter('qaStatus', 'all')" class="hover:text-slate-900 cursor-pointer"><i data-lucide="x" class="w-3 h-3"></i></button>
                </span>
              ` : ''}

              ${this.filterSprint !== 'all' ? `
                <span class="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 font-medium flex items-center gap-1 text-[11px]">
                  <span>Sprint: ${store.getSprintById(this.filterSprint)?.name || this.filterSprint}</span>
                  <button onclick="ProjectWorkspaceView.setFilter('sprint', 'all')" class="hover:text-slate-900 cursor-pointer"><i data-lucide="x" class="w-3 h-3"></i></button>
                </span>
              ` : ''}

              <button onclick="ProjectWorkspaceView.clearFilters()" class="text-rose-600 hover:text-rose-700 font-bold text-[11px] ml-auto cursor-pointer">
                Clear all (${filtered.length} of ${issues.length} cards)
              </button>
            </div>
          ` : ''}

        </div>

        <!-- 5-COLUMN KANBAN BOARD CONTAINER (Matching Reference Image 2) -->
        ${this.renderBoardColumns(filtered, project)}

      </div>
    `;
  },

  renderBoardColumns(filtered, project) {
    if (this.swimlaneBy === "none") {
      return `
        <div class="kanban-board-wrapper horizontal-scroll-touch">
          ${this.columns.map(col => this.renderSingleColumn(col, filtered, project)).join("")}
        </div>
      `;
    }

    // Render with Swimlanes
    const swimlaneGroups = this.getSwimlaneGroups(filtered, project);

    return `
      <div class="space-y-6">
        ${swimlaneGroups.map(group => `
          <div class="swimlane-row">
            <!-- Swimlane Header -->
            <div class="swimlane-header flex items-center justify-between">
              <div class="flex items-center gap-2">
                ${group.avatar ? `<div class="w-5 h-5 rounded-full ${group.avatarColor} text-white text-[8px] font-bold flex items-center justify-center">${group.avatar}</div>` : ''}
                <span class="font-bold text-slate-900">${group.title}</span>
                <span class="px-2 py-0.2 rounded-full bg-slate-200 text-slate-700 font-mono text-[10px]">${group.issues.length} items</span>
              </div>
            </div>

            <!-- Columns inside Swimlane -->
            <div class="kanban-board-wrapper horizontal-scroll-touch">
              ${this.columns.map(col => this.renderSingleColumn(col, group.issues, project)).join("")}
            </div>
          </div>
        `).join("")}
      </div>
    `;
  },

  getSwimlaneGroups(filtered, project) {
    if (this.swimlaneBy === "assignee") {
      const memberIds = project.members || [];
      const groups = memberIds.map(uid => {
        const u = store.getUserById(uid) || { name: "Team Member", role: "Developer", initials: "TM" };
        return {
          id: uid,
          title: `${u.name} (${u.role || 'Member'})`,
          avatar: u.initials || "TM",
          avatarColor: u.color || 'bg-slate-950 text-[#bef264]',
          issues: filtered.filter(i => (i.assigneeId === uid || i.assignee_id === uid || i.developerId === uid || i.developer_id === uid))
        };
      });
      const unassigned = filtered.filter(i => !i.assigneeId && !i.assignee_id && !i.developerId && !i.developer_id);
      if (unassigned.length > 0) {
        groups.push({
          id: "unassigned",
          title: "Unassigned Issues",
          avatar: "?",
          avatarColor: "bg-slate-400",
          issues: unassigned
        });
      }
      return groups;
    }

    if (this.swimlaneBy === "priority") {
      return ["Critical", "High", "Medium", "Low"].map(p => ({
        id: p,
        title: `Priority: ${p}`,
        avatar: null,
        issues: filtered.filter(i => (i.priority || "").toLowerCase() === p.toLowerCase())
      }));
    }

    if (this.swimlaneBy === "type") {
      return ["Bug", "Story", "Task"].map(t => ({
        id: t,
        title: `Type: ${t}`,
        avatar: null,
        issues: filtered.filter(i => (i.type || "").toLowerCase() === t.toLowerCase() || (t === "Bug" && (i.type || "").toLowerCase() === "defect"))
      }));
    }

    return [];
  },

  renderSingleColumn(col, filtered, project) {
    const colIssues = filtered.filter(i => {
      const s = (i.status || "").toLowerCase().trim();
      if (col.id === "Backlog") {
        return ["backlog", "open", "new", "reopened", "re-opened", "blocked"].includes(s) || 
               (!["to do", "todo", "to_do", "in progress", "in development", "in_progress", "development", "active", "ready for qa", "ready_for_qa", "qa ready", "fixed", "qa testing", "qa_testing", "qa", "testing", "in qa", "in_qa", "done", "closed", "resolved", "completed"].includes(s));
      }
      if (col.id === "To Do") {
        return ["to do", "todo", "to_do", "planning"].includes(s);
      }
      if (col.id === "In Progress") {
        return ["in progress", "in development", "in_progress", "development", "active"].includes(s);
      }
      if (col.id === "Ready for QA") {
        return ["ready for qa", "ready_for_qa", "qa ready", "fixed"].includes(s);
      }
      if (col.id === "QA Testing") {
        return ["qa testing", "qa_testing", "qa", "testing", "in qa", "in_qa"].includes(s);
      }
      if (col.id === "Done") {
        return ["done", "closed", "resolved", "completed"].includes(s);
      }
      return (i.status || "").toLowerCase() === col.id.toLowerCase();
    });

    const isOverWIP = colIssues.length > col.wipLimit;
    const colSP = colIssues.reduce((acc, curr) => acc + (curr.storyPoints || curr.story_points || (curr.priority === "Critical" ? 8 : curr.priority === "High" ? 5 : curr.priority === "Medium" ? 3 : 1)), 0);

    return `
      <div class="kanban-col-container bg-slate-50/70 rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden flex flex-col min-w-[280px] max-w-[320px] flex-1 ${col.border}" data-column-status="${col.id}">
        <!-- Column Header (Matching Reference Image 2) -->
        <div class="kanban-col-header p-3.5 bg-white border-b border-slate-200/70 flex items-center justify-between">
          <div class="flex items-center gap-2 min-w-0">
            <span class="w-2.5 h-2.5 rounded-full ${col.dot} shadow-2xs"></span>
            <h3 class="text-xs font-bold uppercase tracking-wider text-slate-900 truncate">${col.title}</h3>
          </div>
          
          <div class="flex items-center gap-1.5 shrink-0">
            <span class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[10px] font-bold">${colSP} SP</span>
            <span class="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold ${isOverWIP ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-slate-200/70 text-slate-700'}" title="WIP Limit: ${col.wipLimit}">
              ${colIssues.length}/${col.wipLimit}
            </span>
          </div>
        </div>

        <!-- Cards Droppable Body (Matching Reference Image 2) -->
        <div class="kanban-col-body kanban-drop-zone p-2.5 flex-1 min-h-[480px] flex flex-col gap-2.5" data-status="${col.id}">
          ${colIssues.length === 0 ? `
            <div class="h-32 border-2 border-dashed border-slate-200/90 rounded-xl flex flex-col items-center justify-center text-slate-400 text-center p-3 my-auto">
              <i data-lucide="inbox" class="w-5 h-5 text-slate-300 mb-1"></i>
              <span class="text-xs font-medium">Empty column</span>
            </div>
          ` : colIssues.map(issue => this.renderBoardCard(issue)).join("")}
        </div>

        <!-- Quick Add Trigger Button (Matching Reference Image 2) -->
        <div class="p-2.5 pt-0">
          <button onclick="window.app.openAddCardModal('${project.id}', '${col.id}')" class="w-full py-1.5 px-2.5 rounded-xl border border-transparent hover:border-slate-300 hover:bg-white text-slate-500 hover:text-slate-900 text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer">
            <i data-lucide="plus" class="w-3.5 h-3.5 text-slate-500"></i>
            <span>Add card</span>
          </button>
        </div>
      </div>
    `;
  },

  renderBoardCard(issue) {
    const devId = issue.developerId || issue.developer_id || issue.assigneeId || issue.assignee_id;
    const qaId = issue.qaId || issue.qa_id;
    const developer = (devId && store.getUserById(devId)) || { name: "Arslan", initials: "AP", color: "bg-slate-950" };
    const storyPoints = issue.storyPoints || issue.story_points || (issue.priority === "Critical" ? 8 : issue.priority === "High" ? 5 : issue.priority === "Medium" ? 3 : 1);
    const gate = store.getQualityGate ? store.getQualityGate(issue) : { isPassed: false };

    // Type Badge & Icon (💥 BUG, 📋 TASK, ✨ STORY)
    let typeBg = "bg-rose-50 text-rose-600 border border-rose-200/80";
    let typeIcon = "bug";
    let typeLabel = "BUG";
    if (issue.type === "Story") {
      typeBg = "bg-emerald-50 text-emerald-700 border border-emerald-200/80";
      typeIcon = "sparkles";
      typeLabel = "STORY";
    } else if (issue.type === "Task") {
      typeBg = "bg-[#f7fee7] text-[#4d7c0f] border border-[#d9f99d]";
      typeIcon = "check-square";
      typeLabel = "TASK";
    }

    // Priority Badge & Dot (Matching Reference Image 2)
    let priorityBadge = "bg-slate-50 text-slate-700 border border-slate-200/80";
    let priorityDot = "bg-slate-400";
    if (issue.priority === "Critical") {
      priorityBadge = "bg-rose-50 text-rose-700 border border-rose-200/80";
      priorityDot = "bg-rose-500";
    } else if (issue.priority === "High") {
      priorityBadge = "bg-orange-50 text-orange-700 border border-orange-200/80";
      priorityDot = "bg-orange-500";
    } else if (issue.priority === "Medium") {
      priorityBadge = "bg-amber-50 text-amber-700 border border-amber-200/80";
      priorityDot = "bg-amber-500";
    }

    // Status Tag (e.g. ⚠️ Reopened, ✅ QA Passed)
    let statusTag = "";
    const st = (issue.status || "").toLowerCase();
    const qst = (issue.qaStatus || issue.qa_status || "").toLowerCase();
    if (st === "reopened" || qst === "failed" || gate.status === "failed") {
      statusTag = `
        <div class="pt-0.5">
          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
            <i data-lucide="alert-circle" class="w-3 h-3 text-rose-500"></i>
            <span>Reopened</span>
          </span>
        </div>
      `;
    } else if (qst === "passed" || gate.isPassed) {
      statusTag = `
        <div class="pt-0.5">
          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <i data-lucide="shield-check" class="w-3 h-3 text-emerald-600"></i>
            <span>QA Passed</span>
          </span>
        </div>
      `;
    } else if (st === "ready for qa" || qst === "ready for qa") {
      statusTag = `
        <div class="pt-0.5">
          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <i data-lucide="inbox" class="w-3 h-3 text-purple-600"></i>
            <span>Ready QA</span>
          </span>
        </div>
      `;
    }

    // Metadata
    let metaHtml = "";
    if (issue.dueDate || (issue.comments && issue.comments.length > 0)) {
      metaHtml = `
        <div class="flex items-center gap-2.5 text-slate-400 text-[10px]">
          ${issue.dueDate ? `
            <span class="flex items-center gap-1 text-slate-500 font-medium" title="Due: ${issue.dueDate}">
              <i data-lucide="calendar" class="w-3 h-3 text-slate-400"></i>
              <span>${issue.dueDate.split("-").slice(1).join("/")}</span>
            </span>
          ` : ''}
          ${issue.comments && issue.comments.length > 0 ? `
            <span class="flex items-center gap-1 text-slate-500 font-semibold" title="${issue.comments.length} comments">
              <i data-lucide="message-square" class="w-3 h-3 text-slate-400"></i>
              <span>${issue.comments.length}</span>
            </span>
          ` : ''}
        </div>
      `;
    }

    return `
      <div class="kanban-board-card bg-white rounded-xl p-3.5 border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-slate-300 transition cursor-grab active:cursor-grabbing group space-y-2.5" draggable="true" data-issue-id="${issue.id}" onclick="window.app.openIssueDetails('${issue.id}')">
        
        <!-- Top Row: Type Tag + Key | Priority Pill + SP (Matching Reference Image 2) -->
        <div class="flex items-center justify-between gap-1.5">
          <div class="flex items-center gap-1.5 min-w-0">
            <span class="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md ${typeBg}">
              <i data-lucide="${typeIcon}" class="w-3 h-3"></i> ${typeLabel}
            </span>
            <span class="font-mono text-xs font-bold text-slate-800 group-hover:text-slate-950 transition truncate">${issue.key}</span>
          </div>

          <div class="flex items-center gap-1.5 shrink-0">
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${priorityBadge}">
              <span class="w-1.5 h-1.5 rounded-full ${priorityDot}"></span>
              <span>${issue.priority || 'Medium'}</span>
            </span>
            <span class="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono text-[10px] font-bold">${storyPoints} SP</span>
          </div>
        </div>

        <!-- Title -->
        <h4 class="text-xs font-semibold text-slate-900 group-hover:text-slate-950 transition leading-snug">
          ${issue.title}
        </h4>

        <!-- Status Tag if any (e.g. Reopened) -->
        ${statusTag}

        <!-- Card Footer: Assignee & Meta Info (Matching Reference Image 2) -->
        <div class="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
          <!-- Assignee Avatar & Name -->
          <div class="flex items-center gap-2" title="Assigned to: ${developer.name}">
            <div class="w-5 h-5 rounded-full ${developer.color || 'bg-slate-950'} text-white text-[8px] font-bold flex items-center justify-center ring-1 ring-white shadow-2xs">
              ${developer.initials || 'AP'}
            </div>
            <span class="text-[11px] font-medium text-slate-700 truncate max-w-[120px]">${developer.name ? developer.name.split(" ")[0] : 'Arslan'}</span>
          </div>

          <!-- Metadata -->
          ${metaHtml}
        </div>

      </div>
    `;
  },

  // =========================================================================
  // TAB 3: PRO DATA GRID (Issues & Defects Table)
  // =========================================================================
  renderIssuesTab(project, stats) {
    const issues = store.getIssues(project.id);
    let filtered = this.filterIssues(issues);

    // Sorting
    filtered.sort((a, b) => {
      let valA = a[this.tableSortField] || "";
      let valB = b[this.tableSortField] || "";
      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();
      if (valA < valB) return this.tableSortAsc ? -1 : 1;
      if (valA > valB) return this.tableSortAsc ? 1 : -1;
      return 0;
    });

    const hasSelection = this.selectedIssueIds.size > 0;

    return `
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs space-y-0">
        
        <!-- Table Toolbar & Batch Action Bar -->
        <div class="p-4 bg-slate-50/90 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          
          <div class="flex items-center gap-3">
            <span class="font-bold text-slate-900 text-sm flex items-center gap-2">
              <i data-lucide="layers" class="w-4 h-4 text-slate-900"></i> Issues & Defects Directory (${filtered.length})
            </span>

            ${hasSelection ? `
              <span class="px-2.5 py-1 bg-[#f7fee7] text-[#4d7c0f] border border-[#d9f99d] rounded-lg font-bold text-xs">
                ${this.selectedIssueIds.size} Selected
              </span>
            ` : ''}
          </div>

          <!-- Batch Action Buttons (When items selected) -->
          <div class="flex items-center gap-2">
            ${hasSelection ? `
              <div class="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-300 shadow-sm">
                <button onclick="ProjectWorkspaceView.handleBatchStatus('QA')" class="px-2.5 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg font-bold transition">
                  Move to QA
                </button>
                <button onclick="ProjectWorkspaceView.handleBatchStatus('Done')" class="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg font-bold transition">
                  Mark Done
                </button>
                <button onclick="ProjectWorkspaceView.clearSelection()" class="px-2 py-1 text-slate-500 hover:text-slate-800 rounded-lg font-semibold">
                  Clear
                </button>
              </div>
            ` : ''}

            <button onclick="ProjectWorkspaceView.exportProjectSummaryCSV()" class="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl font-bold transition flex items-center gap-1 shadow-2xs">
              <i data-lucide="download" class="w-3.5 h-3.5"></i> Export CSV
            </button>

            <button onclick="window.app.openCreateIssueModal('${project.id}')" class="px-3.5 py-1.5 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 rounded-xl font-bold transition shadow-xs shadow-[#bef264]/25 flex items-center gap-1.5 cursor-pointer">
              <i data-lucide="plus" class="w-3.5 h-3.5 text-slate-950"></i> New Issue
            </button>
          </div>

        </div>

        <!-- Pro Data Table -->
        <div class="overflow-x-auto">
          <table class="w-full text-left text-slate-700 min-w-[850px]">
            <thead class="bg-slate-50/80 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-400 select-none">
              <tr>
                <th class="py-3 px-4 w-10 text-center">
                  <input type="checkbox" onchange="ProjectWorkspaceView.toggleSelectAll(this.checked)" class="rounded" />
                </th>
                <th class="py-3 px-4 cursor-pointer hover:text-slate-700" onclick="ProjectWorkspaceView.setSort('key')">
                  ID ${this.tableSortField === 'key' ? (this.tableSortAsc ? '▲' : '▼') : ''}
                </th>
                <th class="py-3 px-4">Type</th>
                <th class="py-3 px-4 cursor-pointer hover:text-slate-700" onclick="ProjectWorkspaceView.setSort('title')">
                  Title ${this.tableSortField === 'title' ? (this.tableSortAsc ? '▲' : '▼') : ''}
                </th>
                <th class="py-3 px-4 cursor-pointer hover:text-slate-700" onclick="ProjectWorkspaceView.setSort('priority')">
                  Priority ${this.tableSortField === 'priority' ? (this.tableSortAsc ? '▲' : '▼') : ''}
                </th>
                <th class="py-3 px-4 cursor-pointer hover:text-slate-700" onclick="ProjectWorkspaceView.setSort('status')">
                  Status ${this.tableSortField === 'status' ? (this.tableSortAsc ? '▲' : '▼') : ''}
                </th>
                <th class="py-3 px-4">Assignee</th>
                <th class="py-3 px-4">QA Owner</th>
                <th class="py-3 px-4">Due Date</th>
                <th class="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${filtered.length === 0 ? `
                <tr>
                  <td colspan="10" class="text-center py-10 text-slate-400">No issues found matching active filters.</td>
                </tr>
              ` : filtered.map(i => {
                const devId = i.developerId || i.developer_id || i.assigneeId || i.assignee_id;
                const qaId = i.qaId || i.qa_id;
                const assignee = (devId && store.getUserById(devId)) || { name: "Unassigned", initials: "UA", color: "bg-slate-400" };
                const qaOwner = (qaId && store.getUserById(qaId)) || { name: "Unassigned", initials: "QA", color: "bg-purple-600" };
                const isSelected = this.selectedIssueIds.has(i.id);

                return `
                  <tr class="hover:bg-slate-50/80 transition cursor-pointer ${isSelected ? 'bg-[#f7fee7]/40' : ''}" onclick="window.app.openIssueDetails('${i.id}')">
                    <td class="py-3 px-4 text-center" onclick="event.stopPropagation()">
                      <input type="checkbox" ${isSelected ? 'checked' : ''} onchange="ProjectWorkspaceView.toggleSelectIssue('${i.id}')" class="rounded" />
                    </td>

                    <td class="py-3 px-4 font-mono font-bold text-slate-950">${i.key}</td>
                    
                    <td class="py-3 px-4">
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase ${i.type === 'Bug' ? 'type-bug' : i.type === 'Story' ? 'type-story' : 'type-task'}">
                        ${i.type}
                      </span>
                    </td>

                    <td class="py-3 px-4 font-semibold text-slate-900 max-w-xs truncate">${i.title}</td>

                    <td class="py-3 px-4" onclick="event.stopPropagation()">
                      <select onchange="ProjectWorkspaceView.handleQuickPriorityChange('${i.id}', this.value)" class="text-[10px] font-bold rounded px-2 py-0.5 border border-slate-200 bg-white cursor-pointer ${
                        i.priority === 'Critical' ? 'priority-critical' :
                        i.priority === 'High' ? 'priority-high' :
                        i.priority === 'Medium' ? 'priority-medium' : 'priority-low'
                      }">
                        <option value="Critical" ${i.priority === 'Critical' ? 'selected' : ''}>Critical</option>
                        <option value="High" ${i.priority === 'High' ? 'selected' : ''}>High</option>
                        <option value="Medium" ${i.priority === 'Medium' ? 'selected' : ''}>Medium</option>
                        <option value="Low" ${i.priority === 'Low' ? 'selected' : ''}>Low</option>
                      </select>
                    </td>

                    <td class="py-3 px-4" onclick="event.stopPropagation()">
                      <select onchange="ProjectWorkspaceView.handleQuickStatusChange('${i.id}', this.value)" class="text-[10px] font-bold rounded-full px-2.5 py-0.5 border cursor-pointer ${
                        i.status === 'QA' || i.status === 'Fixed' || i.status === 'QA Testing' ? 'badge-qa' :
                        i.status === 'In Progress' || i.status === 'In Development' ? 'badge-in-progress' :
                        i.status === 'Done' || i.status === 'Closed' ? 'badge-done' :
                        i.status === 'Reopened' ? 'bg-red-100 text-red-700 border-red-200' :
                        i.status === 'To Do' ? 'badge-todo' : 'badge-backlog'
                      }">
                        <option value="Backlog" ${i.status === 'Backlog' || i.status === 'Open' ? 'selected' : ''}>Backlog</option>
                        <option value="To Do" ${i.status === 'To Do' ? 'selected' : ''}>To Do</option>
                        <option value="In Progress" ${i.status === 'In Progress' || i.status === 'In Development' ? 'selected' : ''}>In Progress</option>
                        <option value="QA Testing" ${i.status === 'QA' || i.status === 'Fixed' || i.status === 'QA Testing' || i.status === 'Ready for QA' ? 'selected' : ''}>QA Testing</option>
                        <option value="Done" ${i.status === 'Done' || i.status === 'Closed' ? 'selected' : ''}>Done</option>
                        <option value="Reopened" ${i.status === 'Reopened' ? 'selected' : ''}>Reopened ✗</option>
                      </select>
                    </td>

                    <td class="py-3 px-4 font-medium">
                      <div class="flex items-center gap-1.5">
                        <div class="w-4 h-4 rounded-full ${assignee.color || 'bg-slate-400'} text-white text-[7px] font-bold flex items-center justify-center">
                          ${assignee.initials || 'UA'}
                        </div>
                        <span class="truncate max-w-[100px]">${assignee.name || 'Unassigned'}</span>
                      </div>
                    </td>

                    <td class="py-3 px-4 text-slate-500 font-medium">${(qaOwner.name || 'Unassigned').split(" ")[0]}</td>

                    <td class="py-3 px-4 text-slate-400 font-mono text-[11px]">${i.dueDate || '--'}</td>

                    <td class="py-3 px-4 text-right" onclick="event.stopPropagation()">
                      <button onclick="window.app.openIssueDetails('${i.id}')" class="text-slate-900 hover:text-black font-bold">Details →</button>
                    </td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        </div>

      </div>
    `;
  },

  // =========================================================================
  // TAB 4: SPRINTS & ROADMAP
  // =========================================================================
  renderSprintsTab(project, stats) {
    const sprints = store.getSprints(project.id) || [];
    const issues = store.getIssues(project.id) || [];

    return `
      <div class="space-y-6 text-xs">
        
        <!-- Sprints Header & Action -->
        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 class="text-base font-bold text-slate-900">Sprint Lifecycle & Milestone Roadmap</h2>
            <p class="text-slate-500 text-xs mt-0.5">Plan release cycles, set sprint burn-down targets, and track delivery progress.</p>
          </div>

          <button onclick="ProjectWorkspaceView.openCreateMilestoneModal()" class="px-4 py-2 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 rounded-xl font-bold shadow-xs shadow-[#bef264]/25 transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer">
            <i data-lucide="plus" class="w-4 h-4 text-slate-950"></i> Create New Sprint
          </button>
        </div>

        ${sprints.length === 0 ? `
          <div class="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 space-y-3">
            <i data-lucide="flag" class="w-12 h-12 text-slate-300 mx-auto"></i>
            <h3 class="text-sm font-bold text-slate-700">No sprints created yet</h3>
            <p class="text-xs text-slate-400 max-w-sm mx-auto">Organize tickets and track velocity by creating your first sprint for ${project.name}.</p>
            <button onclick="ProjectWorkspaceView.openCreateMilestoneModal()" class="px-4 py-2 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 rounded-xl font-bold text-xs transition inline-flex items-center gap-1.5 cursor-pointer shadow-xs shadow-[#bef264]/25">
              <i data-lucide="plus" class="w-4 h-4 text-slate-950"></i> Create Sprint
            </button>
          </div>
        ` : `
          <!-- Sprint Cards Grid -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
            ${sprints.map((s, idx) => {
              const sIssues = issues.filter(i => (i.sprintId === s.id || i.sprint_id === s.id));
              const sCompleted = sIssues.filter(i => i.status === 'Done' || i.status === 'Closed' || i.qaStatus === 'Passed').length;
              const sProgress = sIssues.length > 0 ? Math.round((sCompleted / sIssues.length) * 100) : 0;
              const isActive = s.status === 'Active' || s.status === 'active' || s.status === 'In Progress';

              return `
                <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between relative overflow-hidden ${isActive ? 'ring-2 ring-purple-500/30 border-purple-500' : ''}">
                  
                  ${isActive ? `
                    <div class="absolute top-0 right-0 px-3 py-1 bg-purple-600 text-white text-[10px] font-bold uppercase rounded-bl-xl">
                      Active Sprint
                    </div>
                  ` : ''}

                  <div class="space-y-3">
                    <div class="flex items-center gap-2">
                      <span class="w-6 h-6 rounded-lg ${s.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : isActive ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'} flex items-center justify-center font-bold font-mono text-xs">
                        ${idx + 1}
                      </span>
                      <h3 class="font-bold text-slate-900 text-sm truncate">${s.name || s.title}</h3>
                    </div>

                    <p class="text-slate-500 text-xs leading-relaxed line-clamp-2">${s.goal || 'Sprint deliverables and verification scope.'}</p>

                    <!-- Sprint Goal Details -->
                    <div class="p-3 bg-slate-50 rounded-xl space-y-1.5 border border-slate-100 text-[11px]">
                      <div class="flex items-center justify-between text-slate-500">
                        <span>Timeline:</span>
                        <strong class="font-mono text-slate-800">${s.startDate || s.start_date || '—'} → ${s.endDate || s.end_date || s.dueDate || '—'}</strong>
                      </div>
                      <div class="flex items-center justify-between text-slate-500">
                        <span>Work Scope:</span>
                        <span class="font-bold text-slate-900 font-mono">${sCompleted}/${sIssues.length} Completed</span>
                      </div>
                      <div class="flex items-center justify-between text-slate-500">
                        <span>Status:</span>
                        <span class="font-bold ${s.status === 'Completed' ? 'text-emerald-600' : 'text-purple-600'}">${s.status}</span>
                      </div>
                    </div>

                    <!-- Progress Bar -->
                    <div class="space-y-1">
                      <div class="flex items-center justify-between text-[11px] font-bold">
                        <span class="text-slate-400">Burn-down Progress</span>
                        <span class="font-mono text-slate-900">${sProgress}%</span>
                      </div>
                      <div class="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div class="h-full ${s.status === 'Completed' ? 'bg-emerald-500' : 'bg-gradient-to-r from-purple-600 to-indigo-600'} rounded-full transition-all" style="width: ${sProgress}%"></div>
                      </div>
                    </div>
                  </div>

                  <div class="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span class="text-[10px] text-slate-400 font-mono">${s.id}</span>
                    <button onclick="ProjectWorkspaceView.setFilter('sprint', '${s.id}'); ProjectWorkspaceView.switchTab('board')" class="text-purple-600 hover:underline font-bold text-xs cursor-pointer">
                      View Board Scope →
                    </button>
                  </div>

                </div>
              `;
            }).join("")}
          </div>
        `}

      </div>
    `;
  },

  // =========================================================================
  // TAB 5: QA & QUALITY VERIFICATION GATE
  // =========================================================================
  renderQATab(project, stats) {
    const issues = store.getIssues(project.id) || [];
    const testCases = store.getTestCases(project.id) || [];

    const readyForQa = issues.filter(i => i.status === "Ready for QA" || i.qaStatus === "Ready for QA");
    const testing = issues.filter(i => i.status === "QA Testing" || i.qaStatus === "Testing");
    const passed = issues.filter(i => i.qaStatus === "Passed" || ((i.status === "Done" || i.status === "Closed") && i.type !== "Bug"));
    const failed = issues.filter(i => i.qaStatus === "Failed" || i.status === "Reopened");
    const blocked = issues.filter(i => i.qaStatus === "Blocked");

    return `
      <div class="space-y-5 text-xs">
        
        <!-- QA Overview Stats Row -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-center space-y-1">
            <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Quality Pass Rate</span>
            <div class="text-2xl font-black text-emerald-600 font-mono">${stats.qaMetrics.hasPassRateData ? stats.qaMetrics.passRate + '%' : '—'}</div>
            <div class="text-[11px] ${stats.qaMetrics.hasPassRateData ? 'text-emerald-700 font-semibold' : 'text-slate-400'}">
              ${stats.qaMetrics.hasPassRateData ? `${passed.length} Passed Tickets` : 'No QA verification records yet'}
            </div>
          </div>

          <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-center space-y-1">
            <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Awaiting Verification</span>
            <div class="text-2xl font-black text-purple-700 font-mono">${readyForQa.length + testing.length}</div>
            <div class="text-[11px] text-purple-700/80 font-semibold">${readyForQa.length} Queue / ${testing.length} In Testing</div>
          </div>

          <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-center space-y-1">
            <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Open Critical Defects</span>
            <div class="text-2xl font-black ${stats.criticalBugs > 0 ? 'text-red-600' : 'text-slate-900'} font-mono">${stats.criticalBugs}</div>
            <div class="text-[11px] ${stats.criticalBugs > 0 ? 'text-red-600 font-bold' : 'text-slate-500'}">
              ${stats.criticalBugs > 0 ? 'Release Blocker Detected' : 'Zero Critical Blockers'}
            </div>
          </div>

          <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-center space-y-1">
            <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Test Cases in Supabase</span>
            <div class="text-2xl font-black text-slate-900 font-mono">${testCases.length}</div>
            <div class="text-[11px] text-slate-500">${testCases.filter(t => t.automated).length} Automated Suites</div>
          </div>
        </div>

        <!-- QA Verification Pipeline Stream -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div class="flex items-center gap-2">
              <i data-lucide="shield-check" class="w-4 h-4 text-emerald-600"></i>
              <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wide">Live QA Verification Gate</h3>
            </div>
            <span class="text-[11px] text-slate-400">1-Click Quality Sign-Off (persists to Supabase)</span>
          </div>

          <!-- 3-Column QA Verification Board -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <!-- Column 1: Awaiting QA -->
            <div class="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-3">
              <div class="flex items-center justify-between text-xs font-bold">
                <span class="text-purple-700 flex items-center gap-1.5">
                  <i data-lucide="clock" class="w-3.5 h-3.5"></i> Awaiting QA (${readyForQa.length})
                </span>
              </div>

              <div class="space-y-2">
                ${readyForQa.length === 0 ? `
                  <p class="text-slate-400 text-center py-6 text-xs">No items awaiting QA verification.</p>
                ` : readyForQa.map(item => `
                  <div class="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-2.5">
                    <div class="flex items-center justify-between">
                      <span class="font-mono font-bold text-purple-700">${item.key}</span>
                      <span class="px-1.5 py-0.2 rounded text-[10px] font-bold ${item.priority === 'Critical' ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-700'}">${item.priority}</span>
                    </div>
                    <h4 class="font-semibold text-slate-900 text-xs leading-snug">${item.title}</h4>
                    <div class="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
                      <button onclick="ProjectWorkspaceView.handleQuickQAVerify('${item.id}', 'Passed')" class="flex-1 py-1 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg font-bold text-[11px] transition cursor-pointer">
                        Pass ✓
                      </button>
                      <button onclick="ProjectWorkspaceView.handleQuickQAVerify('${item.id}', 'Failed')" class="flex-1 py-1 px-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg font-bold text-[11px] transition cursor-pointer">
                        Fail ✗
                      </button>
                      <button onclick="ProjectWorkspaceView.handleQuickQAVerify('${item.id}', 'Blocked')" class="py-1 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[11px] transition cursor-pointer" title="Block">
                        ⛔
                      </button>
                    </div>
                  </div>
                `).join("")}
              </div>
            </div>

            <!-- Column 2: QA Passed (Quality Cleared) -->
            <div class="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-3">
              <div class="flex items-center justify-between text-xs font-bold">
                <span class="text-emerald-700 flex items-center gap-1.5">
                  <i data-lucide="check-circle-2" class="w-3.5 h-3.5"></i> QA Verified (${passed.length})
                </span>
              </div>

              <div class="space-y-2">
                ${passed.length === 0 ? `
                  <p class="text-slate-400 text-center py-6 text-xs">No passed tickets yet.</p>
                ` : passed.slice(0, 6).map(item => `
                  <div class="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs space-y-1.5 cursor-pointer hover:border-emerald-300 transition" onclick="window.app.openIssueDetails('${item.id}')">
                    <div class="flex items-center justify-between">
                      <span class="font-mono font-bold text-emerald-700">${item.key}</span>
                      <span class="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">✓ VERIFIED</span>
                    </div>
                    <h4 class="font-semibold text-slate-900 text-xs truncate">${item.title}</h4>
                  </div>
                `).join("")}
              </div>
            </div>

            <!-- Column 3: QA Failed / Blocked / Reopened -->
            <div class="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-3">
              <div class="flex items-center justify-between text-xs font-bold">
                <span class="text-red-700 flex items-center gap-1.5">
                  <i data-lucide="alert-triangle" class="w-3.5 h-3.5"></i> Failed & Blocked (${failed.length + blocked.length})
                </span>
              </div>

              <div class="space-y-2">
                ${failed.length === 0 && blocked.length === 0 ? `
                  <p class="text-slate-400 text-center py-6 text-xs">Zero defect failures or blockers.</p>
                ` : [...failed, ...blocked].map(item => `
                  <div class="bg-white p-3 rounded-xl border border-red-200 shadow-2xs space-y-2">
                    <div class="flex items-center justify-between">
                      <span class="font-mono font-bold text-red-600">${item.key}</span>
                      <span class="px-1.5 py-0.2 rounded text-[10px] font-bold ${item.qaStatus === 'Blocked' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-red-50 text-red-700 border border-red-200'}">
                        ${item.qaStatus === 'Blocked' ? 'BLOCKED ⛔' : `FAILED ${item.reopenCount ? `(${item.reopenCount}x)` : ''}`}
                      </span>
                    </div>
                    <h4 class="font-semibold text-slate-900 text-xs leading-snug">${item.title}</h4>
                    <div class="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button onclick="ProjectWorkspaceView.handleQuickQAVerify('${item.id}', 'Testing')" class="flex-1 py-1 px-2 bg-[#f7fee7] hover:bg-[#ecfccb] text-[#4d7c0f] border border-[#d9f99d] rounded-lg font-bold text-[11px] transition cursor-pointer">
                        Retest 🔍
                      </button>
                      <button onclick="window.app.openIssueDetails('${item.id}')" class="py-1 px-2 text-slate-500 hover:text-slate-800 font-semibold text-[11px]">
                        Details →
                      </button>
                    </div>
                  </div>
                `).join("")}
              </div>
            </div>

          </div>
        </div>

      </div>
    `;
  },

  // =========================================================================
  // TAB 6: TEAM & WORKLOAD & INVITATIONS
  // =========================================================================
  renderTeamTab(project, stats) {
    const allMembers = store.getProjectMembers(project.id);
    const allInvitations = store.getProjectInvitations(project.id);
    const workloads = store.getTeamWorkloadForProject(project.id);
    const isPM = store.canManageProjectTeam(project.id);
    const currentUser = store.getActiveUser();
    const currentRole = store.getUserProjectRole(project.id);

    // Filter members
    const filteredMembers = allMembers.filter(m => {
      if (this.teamRoleFilter !== "all" && m.role !== this.teamRoleFilter) return false;
      if (this.teamSearchQuery) {
        const q = this.teamSearchQuery.toLowerCase();
        const matchName = (m.name || '').toLowerCase().includes(q);
        const matchEmail = (m.email || '').toLowerCase().includes(q);
        if (!matchName && !matchEmail) return false;
      }
      return true;
    });

    // Filter invitations
    const filteredInvs = allInvitations.filter(inv => {
      if (this.invitationStatusFilter !== "all" && inv.status !== this.invitationStatusFilter) return false;
      if (this.teamSearchQuery) {
        const q = this.teamSearchQuery.toLowerCase();
        const matchEmail = (inv.invitedEmail || inv.invited_email || '').toLowerCase().includes(q);
        if (!matchEmail) return false;
      }
      return true;
    });

    const pendingCount = allInvitations.filter(i => i.status === 'PENDING').length;

    // Helper for role badge styling
    const formatRoleBadge = (role) => {
      switch (role) {
        case 'OWNER':
        case 'PROJECT_MANAGER':
          return `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                    <i data-lucide="crown" class="w-3.5 h-3.5 text-purple-600"></i> Project Manager
                  </span>`;
        case 'QA_MANAGER':
          return `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <i data-lucide="shield-check" class="w-3.5 h-3.5 text-emerald-600"></i> QA Manager
                  </span>`;
        case 'DEVELOPER':
          return `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#f7fee7] text-[#4d7c0f] border border-[#d9f99d]">
                    <i data-lucide="code" class="w-3.5 h-3.5 text-[#4d7c0f]"></i> Developer
                  </span>`;
        case 'VIEWER':
          return `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    <i data-lucide="eye" class="w-3.5 h-3.5 text-slate-500"></i> Viewer
                  </span>`;
        case 'CLIENT_VIEWER':
          return `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    <i data-lucide="user-check" class="w-3.5 h-3.5 text-amber-600"></i> Client Viewer
                  </span>`;
        default:
          return `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600">${role || 'Member'}</span>`;
      }
    };

    // Helper for invitation status badge
    const formatInvitationStatusBadge = (status) => {
      switch (status) {
        case 'PENDING':
          return `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1 w-fit"><span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> PENDING</span>`;
        case 'ACCEPTED':
          return `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 w-fit"><i data-lucide="check" class="w-3 h-3 text-emerald-600"></i> ACCEPTED</span>`;
        case 'EXPIRED':
          return `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200 flex items-center gap-1 w-fit"><i data-lucide="clock" class="w-3 h-3 text-red-500"></i> EXPIRED</span>`;
        case 'CANCELLED':
          return `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1 w-fit"><i data-lucide="x" class="w-3 h-3 text-slate-400"></i> CANCELLED</span>`;
        default:
          return `<span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">${status}</span>`;
      }
    };

    return `
      <div class="space-y-6 text-xs animate-fade-in">
        
        <!-- Header & Action Hub -->
        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-base font-bold text-slate-900">Project Team & Permissions</h2>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${isPM ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}">
                Your Role: ${currentRole || 'Member'}
              </span>
            </div>
            <p class="text-slate-500 text-xs mt-0.5">Manage active project members, role permissions, invitations, and delivery capacity.</p>
          </div>

          <div class="flex items-center gap-3">
            ${isPM ? `
              <button onclick="ProjectWorkspaceView.openAddMemberModal()" class="px-4 py-2 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 rounded-xl font-bold text-xs shadow-xs shadow-[#bef264]/30 transition transform hover:-translate-y-0.5 flex items-center gap-1.5 cursor-pointer">
                <i data-lucide="user-plus" class="w-4 h-4 text-slate-950"></i>
                <span>Add Team Member</span>
              </button>
            ` : `
              <span class="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-500 text-xs font-semibold flex items-center gap-1.5 border border-slate-200">
                <i data-lucide="lock" class="w-3.5 h-3.5 text-slate-400"></i> Read Only
              </span>
            `}
          </div>
        </div>

        <!-- Sub-Navigation Switcher & Search Bar -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
          <!-- Sub-Tab Switcher -->
          <div class="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl w-fit">
            <button onclick="ProjectWorkspaceView.setTeamSubTab('members')" class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${this.teamSubTab === 'members' ? 'bg-white text-slate-950 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}">
              <i data-lucide="users" class="w-3.5 h-3.5 ${this.teamSubTab === 'members' ? 'text-[#4d7c0f]' : 'text-slate-400'}"></i>
              <span>Members (${allMembers.length})</span>
            </button>

            <button onclick="ProjectWorkspaceView.setTeamSubTab('invitations')" class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${this.teamSubTab === 'invitations' ? 'bg-white text-slate-950 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}">
              <i data-lucide="mail" class="w-3.5 h-3.5 ${this.teamSubTab === 'invitations' ? 'text-violet-600' : 'text-slate-400'}"></i>
              <span>Invitations</span>
              <span class="px-1.5 py-0.2 rounded-full text-[9px] ${pendingCount > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-600'} font-bold">${pendingCount}</span>
            </button>

            <button onclick="ProjectWorkspaceView.setTeamSubTab('workload')" class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${this.teamSubTab === 'workload' ? 'bg-white text-slate-950 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}">
              <i data-lucide="bar-chart-2" class="w-3.5 h-3.5 ${this.teamSubTab === 'workload' ? 'text-emerald-600' : 'text-slate-400'}"></i>
              <span>Workload & Capacity</span>
            </button>
          </div>

          <!-- Search & Filter Controls -->
          <div class="flex items-center gap-2">
            <div class="relative">
              <i data-lucide="search" class="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 pointer-events-none"></i>
              <input type="text" placeholder="${this.teamSubTab === 'invitations' ? 'Search invited email...' : 'Search members...'}" value="${this.teamSearchQuery}" oninput="ProjectWorkspaceView.handleTeamSearch(this.value)" class="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:bg-white focus:outline-none w-48 sm:w-60" />
              ${this.teamSearchQuery ? `
                <button onclick="ProjectWorkspaceView.handleTeamSearch('')" class="absolute right-2.5 top-2 text-slate-400 hover:text-slate-700">
                  <i data-lucide="x" class="w-3.5 h-3.5"></i>
                </button>
              ` : ''}
            </div>

            ${this.teamSubTab === 'members' ? `
              <select onchange="ProjectWorkspaceView.handleTeamRoleFilter(this.value)" class="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16]">
                <option value="all" ${this.teamRoleFilter === 'all' ? 'selected' : ''}>All Roles</option>
                <option value="OWNER" ${this.teamRoleFilter === 'OWNER' ? 'selected' : ''}>Project Manager</option>
                <option value="QA_MANAGER" ${this.teamRoleFilter === 'QA_MANAGER' ? 'selected' : ''}>QA Manager</option>
                <option value="DEVELOPER" ${this.teamRoleFilter === 'DEVELOPER' ? 'selected' : ''}>Developer</option>
                <option value="VIEWER" ${this.teamRoleFilter === 'VIEWER' ? 'selected' : ''}>Viewer</option>
                <option value="CLIENT_VIEWER" ${this.teamRoleFilter === 'CLIENT_VIEWER' ? 'selected' : ''}>Client Viewer</option>
              </select>
            ` : this.teamSubTab === 'invitations' ? `
              <select onchange="ProjectWorkspaceView.handleInvitationStatusFilter(this.value)" class="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16]">
                <option value="PENDING" ${this.invitationStatusFilter === 'PENDING' ? 'selected' : ''}>Pending (Unaccepted)</option>
                <option value="all" ${this.invitationStatusFilter === 'all' ? 'selected' : ''}>All Invitations</option>
                <option value="ACCEPTED" ${this.invitationStatusFilter === 'ACCEPTED' ? 'selected' : ''}>Accepted</option>
                <option value="EXPIRED" ${this.invitationStatusFilter === 'EXPIRED' ? 'selected' : ''}>Expired</option>
                <option value="CANCELLED" ${this.invitationStatusFilter === 'CANCELLED' ? 'selected' : ''}>Cancelled</option>
              </select>
            ` : ''}
          </div>
        </div>

        <!-- =========================================================================
             SUB-TAB 1: MEMBERS DIRECTORY TABLE
             ========================================================================= -->
        ${this.teamSubTab === 'members' ? `
          <div class="space-y-4">
            ${pendingCount > 0 && isPM ? `
              <!-- Unaccepted Invitations Notice Banner -->
              <div class="p-3.5 bg-amber-50/90 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs animate-fade-in">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <i data-lucide="mail-question" class="w-4 h-4"></i>
                  </div>
                  <div>
                    <span class="font-bold text-amber-950 text-xs">${pendingCount} Pending Unaccepted Invitation${pendingCount > 1 ? 's' : ''}</span>
                    <p class="text-amber-700 text-[11px] mt-0.5">Invited users who have not yet accepted their invitation or set up their password.</p>
                  </div>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  <button onclick="ProjectWorkspaceView.setTeamSubTab('invitations')" class="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs shadow-2xs transition flex items-center gap-1.5 cursor-pointer">
                    <i data-lucide="mail" class="w-3.5 h-3.5"></i>
                    <span>Manage / Delete Unaccepted (${pendingCount})</span>
                  </button>
                </div>
              </div>
            ` : ''}

            <div class="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr class="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                      <th class="py-3 px-5">Team Member</th>
                      <th class="py-3 px-4">Project Role</th>
                      <th class="py-3 px-4">Status</th>
                      <th class="py-3 px-4">Joined Date</th>
                      <th class="py-3 px-4">Assigned Issues</th>
                      <th class="py-3 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    ${filteredMembers.length === 0 ? `
                      <tr>
                        <td colspan="6" class="py-12 text-center text-slate-400">
                          <i data-lucide="users" class="w-8 h-8 mx-auto text-slate-300 mb-2"></i>
                          <p class="font-bold text-slate-600 text-sm">No Team Members Found</p>
                          <p class="text-xs text-slate-400 mt-0.5">No members match your current filter query.</p>
                        </td>
                      </tr>
                    ` : filteredMembers.map(m => `
                      <tr class="hover:bg-slate-50/80 transition group cursor-pointer" onclick="ProjectWorkspaceView.openMemberDetailsModal('${m.id}')">
                        <!-- Member Identity -->
                        <td class="py-3.5 px-5">
                          <div class="flex items-center gap-3">
                            <div class="w-9 h-9 rounded-xl ${m.color || 'bg-slate-700'} text-white font-bold text-xs flex items-center justify-center shadow-2xs shrink-0">
                              ${m.initials}
                            </div>
                            <div class="min-w-0">
                              <div class="font-bold text-slate-900 text-xs truncate flex items-center gap-1.5 group-hover:text-slate-950 transition">
                                <span>${m.name}</span>
                                ${currentUser && (currentUser.id === m.userId || currentUser.email === m.email) ? `
                                  <span class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#f7fee7] text-[#4d7c0f] border border-[#d9f99d]">You</span>
                                ` : ''}
                              </div>
                              <div class="text-[11px] text-slate-400 truncate">${m.email}</div>
                            </div>
                          </div>
                        </td>

                        <!-- Role Badge -->
                        <td class="py-3.5 px-4 whitespace-nowrap">
                          ${formatRoleBadge(m.role)}
                        </td>

                        <!-- Status -->
                        <td class="py-3.5 px-4 whitespace-nowrap">
                          <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${m.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}">
                            <span class="w-1.5 h-1.5 rounded-full ${m.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}"></span>
                            ${m.status || 'Active'}
                          </span>
                        </td>

                        <!-- Joined Date -->
                        <td class="py-3.5 px-4 whitespace-nowrap text-slate-500 font-medium">
                          ${m.joinedAt ? new Date(m.joinedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'}
                        </td>

                        <!-- Assigned Issues Pill -->
                        <td class="py-3.5 px-4 whitespace-nowrap">
                          <div class="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/80 font-mono text-[11px]">
                            <span class="font-bold ${m.activeIssuesCount > 0 ? 'text-slate-950' : 'text-slate-600'}">${m.activeIssuesCount} Active</span>
                            <span class="text-slate-300">/</span>
                            <span class="text-slate-500">${m.assignedIssuesCount} Total</span>
                            ${m.openBugsCount > 0 ? `
                              <span class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-red-100 text-red-700">${m.openBugsCount} bugs</span>
                            ` : ''}
                          </div>
                        </td>

                        <!-- Actions Dropdown / Menu -->
                        <td class="py-3.5 px-5 text-right whitespace-nowrap" onclick="event.stopPropagation()">
                          <div class="flex items-center justify-end gap-1.5">
                            <button onclick="ProjectWorkspaceView.openMemberDetailsModal('${m.id}')" class="px-2.5 py-1 text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-xs font-semibold transition cursor-pointer" title="View Full Details">
                              Details
                            </button>

                            ${isPM ? `
                              ${currentUser && (currentUser.id === m.userId || currentUser.id === m.id || (currentUser.email && m.email && currentUser.email.toLowerCase() === m.email.toLowerCase())) ? `
                                <span class="px-2.5 py-1 text-slate-600 bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-semibold flex items-center gap-1 cursor-default shadow-2xs" title="You are the logged in Project Manager">
                                  <i data-lucide="shield-check" class="w-3.5 h-3.5 text-[#4d7c0f]"></i>
                                  <span>You (Current PM)</span>
                                </span>
                              ` : (m.role === 'OWNER' || m.role === 'PROJECT_MANAGER' || m.role === 'PM' || (m.id && m.id.startsWith('pm_'))) ? `
                                <span class="px-2.5 py-1 text-purple-700 bg-purple-50 border border-purple-200 rounded-lg text-[10px] font-semibold flex items-center gap-1 cursor-default shadow-2xs" title="Project Managers and Space Owners are protected from deletion">
                                  <i data-lucide="crown" class="w-3.5 h-3.5 text-purple-600"></i>
                                  <span>Project Lead</span>
                                </span>
                              ` : `
                                <button onclick="ProjectWorkspaceView.openChangeRoleModal('${m.id}', '${m.role}', '${(m.name || '').replace(/'/g, "\\'")}')" class="px-2 py-1 text-slate-600 hover:text-[#4d7c0f] hover:bg-[#f7fee7] border border-slate-200 hover:border-[#d9f99d] rounded-lg text-xs font-semibold transition cursor-pointer" title="Change Role">
                                  Role
                                </button>

                                <button onclick="ProjectWorkspaceView.handleToggleMemberStatus('${m.id}', '${m.status === 'Active' ? 'Inactive' : 'Active'}')" class="px-2 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer ${m.status === 'Active' ? 'text-amber-700 hover:bg-amber-50 border-amber-200' : 'text-emerald-700 hover:bg-emerald-50 border-emerald-200'}" title="${m.status === 'Active' ? 'Deactivate Member' : 'Activate Member'}">
                                  ${m.status === 'Active' ? 'Deactivate' : 'Activate'}
                                </button>
                                
                                <button onclick="ProjectWorkspaceView.openRemoveMemberModal('${m.id}', '${(m.name || '').replace(/'/g, "\\'")}', '${m.role}')" class="px-2 py-1 text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 hover:border-rose-600 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer shadow-2xs" title="Delete Team Member">
                                  <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                                </button>
                              `}
                            ` : ''}
                          </div>
                        </td>
                      </tr>
                    `).join("")}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ` : ''}

        <!-- =========================================================================
             SUB-TAB 2: INVITATIONS TABLE (Includes Unaccepted Invitation Management)
             ========================================================================= -->
        ${this.teamSubTab === 'invitations' ? `
          <div class="space-y-3">
            ${pendingCount > 1 && isPM ? `
              <div class="flex items-center justify-between bg-rose-50/70 border border-rose-200 p-3 rounded-xl">
                <div class="flex items-center gap-2 text-rose-900 font-medium">
                  <i data-lucide="alert-circle" class="w-4 h-4 text-rose-600"></i>
                  <span>You have <strong>${pendingCount} unaccepted invitations</strong>.</span>
                </div>
                <button onclick="ProjectWorkspaceView.openDeleteAllPendingModal()" class="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs shadow-2xs transition flex items-center gap-1.5 cursor-pointer">
                  <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                  <span>Delete All Unaccepted</span>
                </button>
              </div>
            ` : ''}

            <div class="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr class="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                      <th class="py-3 px-5">Invited Email</th>
                      <th class="py-3 px-4">Invited Role</th>
                      <th class="py-3 px-4">Invited By</th>
                      <th class="py-3 px-4">Sent Date</th>
                      <th class="py-3 px-4">Expiration</th>
                      <th class="py-3 px-4">Status</th>
                      <th class="py-3 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    ${filteredInvs.length === 0 ? `
                      <tr>
                        <td colspan="7" class="py-12 text-center text-slate-400">
                          <i data-lucide="mail" class="w-8 h-8 mx-auto text-slate-300 mb-2"></i>
                          <p class="font-bold text-slate-600 text-sm">No Invitations Found</p>
                          <p class="text-xs text-slate-400 mt-0.5">There are no pending or past project invitations matching your query.</p>
                        </td>
                      </tr>
                    ` : filteredInvs.map(inv => `
                      <tr class="hover:bg-slate-50/80 transition">
                        <!-- Email -->
                        <td class="py-3.5 px-5">
                          <div class="flex items-center gap-2.5">
                            <div class="w-8 h-8 rounded-lg ${inv.status === 'PENDING' ? 'bg-amber-50 border border-amber-200 text-amber-600' : 'bg-violet-50 border border-violet-200 text-violet-600'} flex items-center justify-center shrink-0">
                              <i data-lucide="${inv.status === 'PENDING' ? 'mail-question' : 'mail'}" class="w-4 h-4"></i>
                            </div>
                            <div>
                              <span class="font-bold text-slate-900 font-mono text-xs">${inv.invitedEmail || inv.invited_email}</span>
                              ${inv.scope === 'SPACE' ? `
                                <span class="block text-[10px] text-indigo-600 font-bold">Space-wide Invitation</span>
                              ` : `
                                <span class="block text-[10px] text-slate-400">Project-only</span>
                              `}
                            </div>
                          </div>
                        </td>

                        <!-- Role -->
                        <td class="py-3.5 px-4 whitespace-nowrap">
                          ${formatRoleBadge(inv.role)}
                        </td>

                        <!-- Invited By -->
                        <td class="py-3.5 px-4 whitespace-nowrap text-slate-600 font-medium">
                          ${inv.invitedBy || inv.invited_by || 'Project Lead'}
                        </td>

                        <!-- Sent Date -->
                        <td class="py-3.5 px-4 whitespace-nowrap text-slate-500">
                          ${inv.createdAt || inv.created_at ? new Date(inv.createdAt || inv.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Recently'}
                        </td>

                        <!-- Expires -->
                        <td class="py-3.5 px-4 whitespace-nowrap text-slate-500">
                          ${inv.expiresAt || inv.expires_at ? new Date(inv.expiresAt || inv.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '7 days'}
                        </td>

                        <!-- Status -->
                        <td class="py-3.5 px-4 whitespace-nowrap">
                          ${formatInvitationStatusBadge(inv.status)}
                        </td>

                        <!-- Actions -->
                        <td class="py-3.5 px-5 text-right whitespace-nowrap">
                          ${isPM ? `
                            <div class="flex items-center justify-end gap-1.5">
                              ${inv.status === 'PENDING' ? `
                                <button onclick="ProjectWorkspaceView.copyInviteLink('${inv.token}')" class="px-2.5 py-1 bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 rounded-lg font-bold text-[11px] transition cursor-pointer flex items-center gap-1" title="Copy Direct Invite Link">
                                  <i data-lucide="copy" class="w-3 h-3"></i> Copy Link
                                </button>
                                <button onclick="ProjectWorkspaceView.handleResendInvitation('${inv.id}')" class="px-2.5 py-1 bg-slate-100 hover:bg-[#f7fee7] text-slate-700 hover:text-[#4d7c0f] rounded-lg font-bold text-[11px] transition cursor-pointer">
                                  Resend
                                </button>
                                <button onclick="ProjectWorkspaceView.openDeleteInvitationModal('${inv.id}', '${(inv.invitedEmail || inv.invited_email || '').replace(/'/g, "\\'")}')" class="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-bold text-[11px] transition cursor-pointer flex items-center gap-1" title="Delete Unaccepted Invitation">
                                  <i data-lucide="trash-2" class="w-3 h-3"></i> Delete
                                </button>
                              ` : inv.status === 'ACCEPTED' ? `
                                <button onclick="ProjectWorkspaceView.setTeamSubTab('members')" class="px-2.5 py-1 text-emerald-700 bg-emerald-50 rounded-lg font-bold text-[11px] hover:bg-emerald-100 transition cursor-pointer">
                                  View Member &rarr;
                                </button>
                                <button onclick="ProjectWorkspaceView.openDeleteInvitationModal('${inv.id}', '${(inv.invitedEmail || inv.invited_email || '').replace(/'/g, "\\'")}')" class="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition" title="Delete Accepted Record">
                                  <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                                </button>
                              ` : `
                                <button onclick="ProjectWorkspaceView.copyInviteLink('${inv.token}')" class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[11px] transition cursor-pointer">
                                  Copy Link
                                </button>
                                <button onclick="ProjectWorkspaceView.openDeleteInvitationModal('${inv.id}', '${(inv.invitedEmail || inv.invited_email || '').replace(/'/g, "\\'")}')" class="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-bold text-[11px] transition cursor-pointer flex items-center gap-1">
                                  <i data-lucide="trash-2" class="w-3 h-3"></i> Delete
                                </button>
                              `}
                            </div>
                          ` : `
                            <span class="text-slate-400 font-semibold text-[11px]">--</span>
                          `}
                        </td>
                      </tr>
                    `).join("")}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ` : ''}

        <!-- =========================================================================
             SUB-TAB 3: WORKLOAD & CAPACITY CARDS
             ========================================================================= -->
        ${this.teamSubTab === 'workload' ? `
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            ${workloads.map(w => `
              <div class="bento-card p-5 space-y-4">
                <div class="flex items-center gap-3">
                  <div class="w-11 h-11 rounded-2xl ${w.user.color || 'bg-slate-950 text-[#bef264]'} text-sm font-bold flex items-center justify-center shadow-sm">
                    ${w.user.initials}
                  </div>
                  <div class="min-w-0">
                    <h3 class="font-semibold text-slate-900 text-sm truncate">${w.user.name}</h3>
                    <span class="text-slate-400 text-xs">${w.user.role}</span>
                  </div>
                </div>

                <!-- Stats Pill Grid -->
                <div class="grid grid-cols-3 gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-center text-xs">
                  <div>
                    <div class="font-bold text-slate-900">${w.totalAssigned}</div>
                    <div class="text-[9px] uppercase font-bold text-slate-400">Total</div>
                  </div>
                  <div>
                    <div class="font-bold text-slate-950">${w.activeCount}</div>
                    <div class="text-[9px] uppercase font-bold text-slate-400">Active</div>
                  </div>
                  <div>
                    <div class="font-bold text-red-600">${w.openBugsCount}</div>
                    <div class="text-[9px] uppercase font-bold text-slate-400">Bugs</div>
                  </div>
                </div>

                <!-- Capacity Utilization -->
                <div class="space-y-1.5">
                  <div class="flex items-center justify-between text-xs font-semibold">
                    <span class="text-slate-500">Workload Capacity</span>
                    <span class="font-mono ${w.capacityPct > 80 ? 'text-amber-600 font-bold' : 'text-slate-700'}">${w.capacityPct}%</span>
                  </div>
                  <div class="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div class="h-full ${w.capacityPct > 80 ? 'bg-amber-500' : 'bg-slate-950'} rounded-full transition-all duration-500" style="width: ${w.capacityPct}%"></div>
                  </div>
                </div>
              </div>
            `).join("")}
          </div>
        ` : ''}

      </div>
    `;
  },

  // =========================================================================
  // TAB 7: PROJECT SETTINGS & CONFIG
  // =========================================================================
  renderSettingsTab(project) {
    const users = store.getUsers() || [];
    const sla = project.slaConfig || { Critical: 4, High: 8, Medium: 24, Low: 72 };

    return `
      <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm max-w-3xl text-xs space-y-5">
        <div class="pb-3 border-b border-slate-100">
          <h3 class="text-base font-bold text-slate-900">Project Configuration & SLA Policies</h3>
          <p class="text-xs text-slate-500 mt-0.5">Manage project metadata, release timeline, SLA target hours, and Supabase cloud settings.</p>
        </div>

        <form id="projectSettingsForm" onsubmit="ProjectWorkspaceView.handleSaveSettings(event, '${project.id}')" class="space-y-4">
          <div class="grid grid-cols-3 gap-4">
            <div class="col-span-2">
              <label class="block font-bold text-slate-700 mb-1">Project Name *</label>
              <input type="text" id="settingPrjName" required value="${project.name}" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none" />
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Project Key (Read Only)</label>
              <input type="text" value="${project.key}" readonly class="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-500 cursor-not-allowed" />
            </div>
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-1">Description</label>
            <textarea id="settingPrjDesc" rows="2" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none">${project.description || ''}</textarea>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Customer / Client</label>
              <input type="text" id="settingPrjCustomer" value="${project.customer || ''}" placeholder="e.g. Enterprise Client" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none" />
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Category</label>
              <input type="text" id="settingPrjCategory" value="${project.category || 'QA & Engineering'}" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none" />
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Project Priority</label>
              <select id="settingPrjPriority" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none">
                <option value="P1" ${project.priority === 'P1' ? 'selected' : ''}>P1 - Critical</option>
                <option value="P2" ${project.priority === 'P2' ? 'selected' : ''}>P2 - High</option>
                <option value="P3" ${project.priority === 'P3' ? 'selected' : ''}>P3 - Medium</option>
                <option value="P4" ${project.priority === 'P4' ? 'selected' : ''}>P4 - Low</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Status</label>
              <select id="settingPrjStatus" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none">
                <option value="Active" ${project.status === 'Active' ? 'selected' : ''}>Active</option>
                <option value="Planning" ${project.status === 'Planning' ? 'selected' : ''}>Planning</option>
                <option value="In Review" ${project.status === 'In Review' ? 'selected' : ''}>In Review</option>
                <option value="On Hold" ${project.status === 'On Hold' ? 'selected' : ''}>On Hold</option>
                <option value="Completed" ${project.status === 'Completed' ? 'selected' : ''}>Completed</option>
              </select>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Start Date</label>
              <input type="date" id="settingPrjStartDate" value="${project.startDate || ''}" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none" />
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Target Release Date</label>
              <input type="date" id="settingPrjDueDate" value="${project.dueDate || project.endDate || ''}" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none" />
            </div>
          </div>

          <!-- Quality SLA Policy Configuration -->
          <div class="pt-3 border-t border-slate-100 space-y-3">
            <h4 class="font-bold text-slate-900 text-xs flex items-center gap-1.5">
              <i data-lucide="clock" class="w-3.5 h-3.5 text-slate-900"></i>
              <span>Quality SLA Targets (Resolution Max Hours)</span>
            </h4>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label class="block text-[11px] font-bold text-red-600 mb-1">Critical SLA (Hrs)</label>
                <input type="number" id="settingSlaCritical" min="1" max="720" value="${sla.Critical || 4}" class="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold" />
              </div>
              <div>
                <label class="block text-[11px] font-bold text-orange-600 mb-1">High SLA (Hrs)</label>
                <input type="number" id="settingSlaHigh" min="1" max="720" value="${sla.High || 8}" class="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold" />
              </div>
              <div>
                <label class="block text-[11px] font-bold text-amber-600 mb-1">Medium SLA (Hrs)</label>
                <input type="number" id="settingSlaMedium" min="1" max="720" value="${sla.Medium || 24}" class="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold" />
              </div>
              <div>
                <label class="block text-[11px] font-bold text-slate-600 mb-1">Low SLA (Hrs)</label>
                <input type="number" id="settingSlaLow" min="1" max="720" value="${sla.Low || 72}" class="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold" />
              </div>
            </div>
          </div>

          <div class="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button type="submit" class="px-5 py-2.5 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 rounded-xl font-bold shadow-xs shadow-[#bef264]/25 transition cursor-pointer">
              Save Project Changes
            </button>
          </div>
        </form>

        <!-- Danger Zone -->
        <div class="mt-8 pt-5 border-t border-red-100 space-y-3">
          <h4 class="text-xs font-bold text-red-600 uppercase tracking-wider">Danger Zone</h4>
          <div class="p-4 bg-red-50/50 rounded-xl border border-red-200 flex items-center justify-between">
            <div>
              <strong class="font-bold text-red-900 block">Archive Project Workspace</strong>
              <span class="text-slate-500 text-[11px]">Make this workspace read-only and hide from active dashboard lists.</span>
            </div>
            <button onclick="window.app.toast('Archived', 'Project workspace moved to archive.', 'info')" class="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs transition cursor-pointer">
              Archive Project
            </button>
          </div>
        </div>

      </div>
    `;
  },

  // =========================================================================
  // ACTIONS & MODALS HANDLERS
  // =========================================================================
  copyProjectKey(key) {
    navigator.clipboard.writeText(key);
    window.app.toast("Key Copied", `Project key ${key} copied to clipboard.`, "info");
  },

  copyShareLink() {
    navigator.clipboard.writeText(window.location.href);
    window.app.toast("Link Copied", "Project workspace URL copied to clipboard.", "info");
  },

  toggleQuickActionsMenu() {
    const menu = document.getElementById("prjQuickActionsMenu");
    if (menu) menu.classList.toggle("hidden");
  },

  async handleStatusChange(projectId, newStatus) {
    await store.updateProject(projectId, { status: newStatus });
    window.app.toast("Status Updated", `Project status set to ${newStatus}.`, "success");
    this.render(document.getElementById("mainContent"));
  },

  async handleSaveSettings(e, projectId) {
    e.preventDefault();
    const name = document.getElementById("settingPrjName").value.trim();
    const description = document.getElementById("settingPrjDesc").value.trim();
    const customer = document.getElementById("settingPrjCustomer").value.trim();
    const category = document.getElementById("settingPrjCategory").value.trim();
    const priority = document.getElementById("settingPrjPriority").value;
    const status = document.getElementById("settingPrjStatus").value;
    const startDate = document.getElementById("settingPrjStartDate").value;
    const dueDate = document.getElementById("settingPrjDueDate").value;

    const slaConfig = {
      Critical: Number(document.getElementById("settingSlaCritical")?.value || 4),
      High: Number(document.getElementById("settingSlaHigh")?.value || 8),
      Medium: Number(document.getElementById("settingSlaMedium")?.value || 24),
      Low: Number(document.getElementById("settingSlaLow")?.value || 72)
    };

    await store.updateProject(projectId, {
      name,
      description,
      customer,
      category,
      priority,
      status,
      startDate,
      dueDate,
      endDate: dueDate,
      slaConfig
    });

    window.app.toast("Settings Saved", "Project configuration successfully updated in Supabase.", "success");
    this.render(document.getElementById("mainContent"));
  },

  async handleQuickQAVerify(issueId, qaStatus) {
    await store.verifyIssueQA(issueId, { qaStatus });
    window.app.toast("QA Verified", `Issue QA status updated to ${qaStatus}.`, "success");
    this.render(document.getElementById("mainContent"));
  },

  // Milestone Modal
  openCreateMilestoneModal() {
    let container = document.getElementById("prjModalContainer");
    if (!container) return;

    container.innerHTML = `
      <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-fade-in text-xs space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 class="text-sm font-bold text-slate-900 flex items-center gap-2">
              <i data-lucide="flag" class="w-4 h-4 text-purple-600"></i> New Sprint / Milestone
            </h3>
            <button onclick="document.getElementById('prjModalContainer').innerHTML=''" class="text-slate-400 hover:text-slate-600">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>

          <form onsubmit="ProjectWorkspaceView.handleCreateMilestone(event)" class="space-y-3">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Sprint / Milestone Title *</label>
              <input type="text" id="msTitle" required placeholder="e.g. Sprint 17: Payment Gateway Polish" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none" />
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Sprint Goal</label>
              <textarea id="msGoal" rows="2" placeholder="Key objectives and test scope..." class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none"></textarea>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Target Due Date *</label>
                <input type="date" id="msDueDate" required value="${new Date().toISOString().split('T')[0]}" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none" />
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">Status</label>
                <select id="msStatus" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none">
                  <option value="Active" selected>Active</option>
                  <option value="Upcoming">Upcoming</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>

            <div class="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button type="button" onclick="document.getElementById('prjModalContainer').innerHTML=''" class="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button type="submit" class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow-xs">Add Sprint</button>
            </div>
          </form>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  async handleCreateMilestone(e) {
    e.preventDefault();
    const project = store.getActiveProject();
    const title = document.getElementById("msTitle").value.trim();
    const goal = document.getElementById("msGoal").value.trim();
    const dueDate = document.getElementById("msDueDate").value;
    const status = document.getElementById("msStatus").value;

    await store.createSprint({
      projectId: project.id,
      name: title,
      title: title,
      goal,
      endDate: dueDate,
      dueDate,
      status
    });

    document.getElementById("prjModalContainer").innerHTML = "";
    window.app.toast("Sprint Created", `Created sprint "${title}" in Supabase.`, "success");
    this.render(document.getElementById("mainContent"));
  },

  // Export CSV
  exportProjectSummaryCSV() {
    const project = store.getActiveProject();
    const issues = store.getIssues(project.id);
    
    let csv = "ID,Type,Title,Priority,Status,Assignee,Reporter,Due Date\n";
    issues.forEach(i => {
      const assignee = store.getUserById(i.assigneeId).name;
      const reporter = store.getUserById(i.reporterId).name;
      csv += `"${i.key}","${i.type}","${i.title.replace(/"/g, '""')}","${i.priority}","${i.status}","${assignee}","${reporter}","${i.dueDate || ''}"\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${project.key}_issues_summary.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.app.toast("Export Complete", `Exported ${issues.length} issues to CSV.`, "success");
  },

  // Filters & Table Helpers
  filterIssues(issues) {
    const activeUser = store.getActiveUser();

    return issues.filter(i => {
      const devId = i.developerId || i.developer_id || i.assigneeId || i.assignee_id;
      const qaId = i.qaId || i.qa_id;
      const priority = i.priority || "Medium";
      const status = i.status || "To Do";
      const qaStatus = i.qaStatus || i.qa_status || "Not Tested";
      const sprintId = i.sprintId || i.sprint_id;
      const type = i.type || "Task";

      // Quick filter
      if (this.filterQuick === "my_issues" && devId !== activeUser?.id && qaId !== activeUser?.id) return false;
      if (this.filterQuick === "bugs_only" && type !== "Bug" && type !== "Defect") return false;
      if (this.filterQuick === "critical_only" && priority.toLowerCase() !== "critical") return false;
      if (this.filterQuick === "qa_ready") {
        const s = status.toLowerCase();
        const qs = qaStatus.toLowerCase();
        if (!["ready for qa", "qa testing", "qa", "testing", "in qa", "reopened", "failed"].includes(s) && !["ready for qa", "testing", "failed"].includes(qs)) return false;
      }

      // Dropdown filters
      if (this.filterType !== "all" && type.toLowerCase() !== this.filterType.toLowerCase()) return false;
      if (this.filterPriority !== "all" && priority.toLowerCase() !== this.filterPriority.toLowerCase()) return false;
      if (this.filterAssignee !== "all" && devId !== this.filterAssignee) return false;
      if (this.filterQAStatus !== "all" && qaStatus.toLowerCase() !== this.filterQAStatus.toLowerCase()) return false;
      if (this.filterSprint !== "all" && sprintId !== this.filterSprint) return false;
      
      // Search
      if (this.searchQuery && this.searchQuery.trim()) {
        const q = this.searchQuery.toLowerCase().trim();
        const matchTitle = (i.title || "").toLowerCase().includes(q);
        const matchKey = (i.key || "").toLowerCase().includes(q);
        const matchDesc = (i.description || "").toLowerCase().includes(q);
        const matchEnv = (i.environment || "").toLowerCase().includes(q);
        const matchLabels = (i.labels || []).some(l => (l || "").toLowerCase().includes(q));
        const assignee = store.getUserById(devId);
        const matchAssignee = assignee ? (assignee.name || "").toLowerCase().includes(q) : false;

        if (!matchTitle && !matchKey && !matchDesc && !matchEnv && !matchLabels && !matchAssignee) return false;
      }
      return true;
    });
  },

  setQuickFilter(pill) {
    this.filterQuick = pill;
    this.render(document.getElementById("mainContent"));
  },

  setDensity(density) {
    this.boardDensity = density;
    this.render(document.getElementById("mainContent"));
  },

  setSwimlane(val) {
    this.swimlaneBy = val;
    this.render(document.getElementById("mainContent"));
  },

  setFilter(field, value) {
    if (field === "type") this.filterType = value;
    if (field === "priority") this.filterPriority = value;
    if (field === "assignee") this.filterAssignee = value;
    if (field === "qaStatus") this.filterQAStatus = value;
    if (field === "sprint") this.filterSprint = value;
    this.render(document.getElementById("mainContent"));
  },

  toggleFilterMenu() {
    this.filterMenuOpen = !this.filterMenuOpen;
    this.render(document.getElementById("mainContent"));
  },

  clearFilters() {
    this.filterQuick = "all";
    this.filterType = "all";
    this.filterPriority = "all";
    this.filterAssignee = "all";
    this.filterQAStatus = "all";
    this.filterSprint = "all";
    this.searchQuery = "";
    this.render(document.getElementById("mainContent"));
  },

  handleSearch(val) {
    this.searchQuery = val;
    this.render(document.getElementById("mainContent"));
  },

  setSort(field) {
    if (this.tableSortField === field) {
      this.tableSortAsc = !this.tableSortAsc;
    } else {
      this.tableSortField = field;
      this.tableSortAsc = true;
    }
    this.render(document.getElementById("mainContent"));
  },

  toggleSelectIssue(issueId) {
    if (this.selectedIssueIds.has(issueId)) {
      this.selectedIssueIds.delete(issueId);
    } else {
      this.selectedIssueIds.add(issueId);
    }
    this.render(document.getElementById("mainContent"));
  },

  toggleSelectAll(checked) {
    const project = store.getActiveProject();
    const issues = store.getIssues(project.id);
    if (checked) {
      issues.forEach(i => this.selectedIssueIds.add(i.id));
    } else {
      this.selectedIssueIds.clear();
    }
    this.render(document.getElementById("mainContent"));
  },

  clearSelection() {
    this.selectedIssueIds.clear();
    this.render(document.getElementById("mainContent"));
  },

  handleBatchStatus(newStatus) {
    const ids = Array.from(this.selectedIssueIds);
    store.batchUpdateIssueStatus(ids, newStatus);
    this.selectedIssueIds.clear();
    window.app.toast("Batch Updated", `Moved ${ids.length} issues to ${newStatus}.`, "success");
    this.render(document.getElementById("mainContent"));
  },

  handleQuickStatusChange(issueId, newStatus) {
    store.updateIssueStatus(issueId, newStatus);
    window.app.toast("Status Changed", `Issue updated to ${newStatus}.`, "success");
    this.render(document.getElementById("mainContent"));
  },

  handleQuickPriorityChange(issueId, newPriority) {
    store.updateIssue(issueId, { priority: newPriority });
    window.app.toast("Priority Changed", `Priority set to ${newPriority}.`, "success");
    this.render(document.getElementById("mainContent"));
  },

  async handleQuickQAVerify(issueId, newQaStatus) {
    const project = store.getActiveProject();
    if (!project) return;
    if (!store.canVerifyQA(project.id)) {
      window.app.toast("Permission Denied", "QA Verification requires QA Manager or Project Manager role.", "error");
      return;
    }

    try {
      await store.verifyIssueQA(issueId, newQaStatus, `QA Verification marked as ${newQaStatus}.`);
      window.app.toast("QA Gate Updated", `Ticket updated to ${newQaStatus}.`, "success");
      const content = document.getElementById("mainContent");
      if (content) this.render(content);
    } catch (err) {
      window.app.toast("Error", err.message, "error");
    }
  },

  async handleSaveSettings(e, projectId) {
    e.preventDefault();
    if (!store.canEditProjectSettings(projectId)) {
      window.app.toast("Permission Denied", "Only Project Managers can modify project settings.", "error");
      return;
    }

    const name = document.getElementById("settingPrjName")?.value.trim();
    const description = document.getElementById("settingPrjDesc")?.value.trim();
    const customer = document.getElementById("settingPrjCustomer")?.value.trim();
    const category = document.getElementById("settingPrjCategory")?.value.trim();
    const priority = document.getElementById("settingPrjPriority")?.value;
    const status = document.getElementById("settingPrjStatus")?.value;
    const startDate = document.getElementById("settingPrjStartDate")?.value;
    const dueDate = document.getElementById("settingPrjDueDate")?.value;

    const criticalSla = Number(document.getElementById("settingSlaCritical")?.value || 4);
    const highSla = Number(document.getElementById("settingSlaHigh")?.value || 8);
    const mediumSla = Number(document.getElementById("settingSlaMedium")?.value || 24);
    const lowSla = Number(document.getElementById("settingSlaLow")?.value || 72);

    try {
      await store.updateProject(projectId, {
        name,
        description,
        customer,
        category,
        priority,
        status,
        startDate,
        dueDate,
        slaConfig: {
          Critical: criticalSla,
          High: highSla,
          Medium: mediumSla,
          Low: lowSla
        }
      });

      window.app.toast("Settings Saved", "Project settings & SLA policies persisted to Supabase.", "success");
      const content = document.getElementById("mainContent");
      if (content) this.render(content);
    } catch (err) {
      window.app.toast("Error", err.message, "error");
    }
  },

  // =========================================================================
  // TAB 7: PROJECT QA & RELEASE DOCUMENTATION (PulseWave V2 - Sections 29, 30)
  // =========================================================================
  renderDocumentationTab(project, stats) {
    const docs = store.getDocuments(project.id);
    const plans = store.getTestPlans(project.id);
    const suites = store.getTestSuites(project.id);
    const tmStats = store.getTestManagementStats(project.id);
    const latestReport = docs.find(d => d.type === "QA Report" || d.type === "Customer Report") || docs[0];

    return `
      <div class="space-y-6">
        <!-- Section 30: Project QA Documentation Overview Card -->
        <div class="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div class="space-y-1.5">
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 rounded bg-[#bef264]/20 text-[#bef264] font-mono text-[11px] font-bold border border-[#bef264]/30">
                RELEASE v2.4.1 QA OVERVIEW
              </span>
              <h3 class="text-lg font-bold tracking-tight">${project.name} QA Documentation</h3>
            </div>
            <p class="text-xs text-slate-300">Central project repository for QA verification reports, test plans, and customer sign-off deliverables.</p>
          </div>

          <div class="grid grid-cols-3 gap-4 text-center text-xs shrink-0">
            <div class="bg-white/10 p-3 rounded-xl backdrop-blur-xs">
              <span class="text-[10px] uppercase text-slate-400 font-semibold block">QA Pass Rate</span>
              <span class="text-xl font-bold text-emerald-400 font-mono mt-0.5 block">${tmStats.passRate}%</span>
            </div>
            <div class="bg-white/10 p-3 rounded-xl backdrop-blur-xs">
              <span class="text-[10px] uppercase text-slate-400 font-semibold block">Quality Gate</span>
              <span class="text-xs font-bold text-[#bef264] mt-1 block">${tmStats.passRate >= 95 ? 'READY FOR RELEASE' : 'READY WITH ISSUES'}</span>
            </div>
            <div class="bg-white/10 p-3 rounded-xl backdrop-blur-xs">
              <span class="text-[10px] uppercase text-slate-400 font-semibold block">Latest Report</span>
              <span class="text-xs font-bold text-slate-200 mt-1 block truncate">${latestReport ? latestReport.version : 'v1.2'}</span>
            </div>
          </div>
        </div>

        <!-- Document Categories Grid (Section 29) -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span class="text-[10px] uppercase text-slate-400 font-bold block">QA Reports</span>
            <span class="text-2xl font-bold text-slate-900 mt-1 block">${docs.filter(d => d.type === 'QA Report').length} Reports</span>
          </div>
          <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span class="text-[10px] uppercase text-slate-400 font-bold block">Test Plans</span>
            <span class="text-2xl font-bold text-indigo-600 mt-1 block">${plans.length} Plans</span>
          </div>
          <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span class="text-[10px] uppercase text-slate-400 font-bold block">Test Suites</span>
            <span class="text-2xl font-bold text-purple-600 mt-1 block">${suites.length} Suites</span>
          </div>
          <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span class="text-[10px] uppercase text-slate-400 font-bold block">Customer Reports</span>
            <span class="text-2xl font-bold text-emerald-600 mt-1 block">${docs.filter(d => d.type === 'Customer Report').length} Ready</span>
          </div>
        </div>

        <!-- Project Documents List (Section 29) -->
        <div class="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-900">Project Deliverables & QA Documents</h4>
            <button onclick="window.app.navigate('documentation')" class="text-xs font-bold text-slate-900 hover:text-black hover:underline">Open Documentation Center &rarr;</button>
          </div>

          <div class="divide-y divide-slate-100 text-xs">
            ${docs.length === 0 ? `
              <p class="py-6 text-center text-slate-400">No documents yet for this project.</p>
            ` : docs.map(d => `
              <div class="py-3 flex items-center justify-between gap-4">
                <div class="flex items-start gap-3">
                  <i data-lucide="${d.visibility === 'CUSTOMER READY' ? 'award' : 'file-text'}" class="w-4 h-4 text-slate-900 mt-0.5 shrink-0"></i>
                  <div>
                    <span class="font-bold text-slate-900">${d.name}</span>
                    <div class="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                      <span>${d.type}</span>
                      <span>&bull;</span>
                      <span class="font-mono font-semibold text-slate-600">${d.version}</span>
                      <span>&bull;</span>
                      <span>Updated ${d.lastUpdated.split(' ')[0]}</span>
                    </div>
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold ${d.visibility === 'CUSTOMER READY' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}">
                    ${d.visibility}
                  </span>
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase ${d.status === 'Approved' ? 'bg-[#f7fee7] text-[#4d7c0f] border border-[#d9f99d]' : (d.status === 'Final' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600')}">
                    ${d.status}
                  </span>
                  <button onclick="DocumentationView.openPreviewFor('${d.id}'); window.app.navigate('documentation');" class="px-2.5 py-1 bg-slate-100 hover:bg-slate-950 hover:text-white rounded text-xs font-semibold transition cursor-pointer">
                    View
                  </button>
                </div>
              </div>
            `).join("")}
          </div>
        </div>

      </div>
    `;
  },

  // =========================================================================
  // TEAM & INVITATION ACTIONS AND MODALS
  // =========================================================================
  setTeamSubTab(subTab) {
    this.teamSubTab = subTab;
    const content = document.getElementById("mainContent");
    if (content) this.render(content);
  },

  handleTeamSearch(query) {
    this.teamSearchQuery = query;
    const content = document.getElementById("mainContent");
    if (content) this.render(content);
  },

  handleTeamRoleFilter(role) {
    this.teamRoleFilter = role;
    const content = document.getElementById("mainContent");
    if (content) this.render(content);
  },

  handleInvitationStatusFilter(status) {
    this.invitationStatusFilter = status;
    const content = document.getElementById("mainContent");
    if (content) this.render(content);
  },

  openAddMemberModal() {
    const project = store.getActiveProject();
    if (!project) return;
    if (!store.canManageProjectTeam(project.id)) {
      window.app.toast("Permission Denied", "You don't have permission to manage project members.", "error");
      return;
    }

    const modalId = "addTeamMemberModal";
    let modal = document.getElementById(modalId);
    if (!modal) {
      modal = document.createElement("div");
      modal.id = modalId;
      modal.className = "fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto";
      document.body.appendChild(modal);
    }

    const currentSpace = store.getActiveWorkspace() || { name: "Workspace" };

    modal.innerHTML = `
      <div class="bg-white rounded-2xl max-w-md w-full max-h-[88vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-scale-up text-xs my-auto">
        <!-- Sticky Header -->
        <div class="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-xl bg-[#f7fee7] text-[#4d7c0f] border border-[#d9f99d] flex items-center justify-center shrink-0">
              <i data-lucide="user-plus" class="w-4 h-4 text-[#65a30d]"></i>
            </div>
            <div>
              <h3 class="font-bold text-slate-900 text-sm leading-tight">Add Team Member</h3>
              <p class="text-slate-500 text-[11px]">Invite user by email & set initial credentials</p>
            </div>
          </div>
          <button onclick="ProjectWorkspaceView.closeTeamModal('${modalId}')" class="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <!-- Scrollable Form Body -->
        <form onsubmit="ProjectWorkspaceView.handleAddMemberSubmit(event)" class="flex flex-col flex-1 min-h-0 overflow-hidden">
          
          <div class="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1 custom-scrollbar">
            <!-- Email Input -->
            <div>
              <label class="block font-bold text-slate-700 mb-1 text-[11px]">Email Address *</label>
              <input type="email" id="inviteMemberEmail" required placeholder="user@company.com" class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:bg-white focus:outline-none" />
            </div>

            <!-- Create Password Field (Created by PM) -->
            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="block font-bold text-slate-700 text-[11px]">Create Initial Password *</label>
                <button type="button" onclick="ProjectWorkspaceView.generateMemberPassword()" class="text-[10px] text-[#4d7c0f] hover:underline font-bold flex items-center gap-1 cursor-pointer">
                  <i data-lucide="sparkles" class="w-3 h-3 text-[#65a30d]"></i>
                  <span>Generate Password</span>
                </button>
              </div>
              <div class="relative">
                <input type="text" id="inviteMemberPassword" required placeholder="Initial password for member" value="Pass@${Math.floor(1000 + Math.random() * 9000)}" class="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:bg-white focus:outline-none" />
                <button type="button" onclick="ProjectWorkspaceView.toggleInvitePasswordVisibility()" class="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700 cursor-pointer">
                  <i data-lucide="eye" id="invitePassEyeIcon" class="w-4 h-4"></i>
                </button>
              </div>
              <p class="text-[10px] text-slate-400 mt-0.5">The member will use this initial password to sign in.</p>
            </div>

            <!-- Access Scope Selector (Section 1) -->
            <div>
              <label class="block font-bold text-slate-700 mb-1 text-[11px]">Access Scope *</label>
              <div class="grid grid-cols-2 gap-2">
                <label class="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-start gap-2 cursor-pointer transition">
                  <input type="radio" name="inviteScope" value="PROJECT" checked onchange="ProjectWorkspaceView.handleInviteScopeChange('PROJECT')" class="mt-0.5 text-slate-900 focus:ring-[#bef264]" />
                  <div class="min-w-0">
                    <span class="block font-bold text-slate-900 text-[11px] leading-tight">Specific Project</span>
                    <span class="text-[10px] text-slate-500 leading-tight block mt-0.5 truncate" title="${project.name}"><strong>${project.name}</strong></span>
                  </div>
                </label>

                <label class="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-start gap-2 cursor-pointer transition">
                  <input type="radio" name="inviteScope" value="SPACE" onchange="ProjectWorkspaceView.handleInviteScopeChange('SPACE')" class="mt-0.5 text-slate-900 focus:ring-[#bef264]" />
                  <div class="min-w-0">
                    <span class="block font-bold text-slate-900 text-[11px] leading-tight">Entire Space</span>
                    <span class="text-[10px] text-slate-500 leading-tight block mt-0.5 truncate" title="${currentSpace.name}"><strong>${currentSpace.name}</strong></span>
                  </div>
                </label>
              </div>
            </div>

            <!-- Role Selector (Dynamic based on Scope) -->
            <div>
              <label class="block font-bold text-slate-700 mb-1 text-[11px]">Assigned Role *</label>
              <select id="inviteMemberRole" required class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:bg-white focus:outline-none">
                <option value="DEVELOPER" selected>Developer (Assigned issues, dev tasks, card workflow)</option>
                <option value="QA">QA (Quality testing, verify Pass/Fail, QA reports, sprints)</option>
                <option value="VIEWER">Viewer (Read-only access)</option>
              </select>
              <p id="scopeRoleHint" class="text-[10px] text-slate-400 mt-0.5">
                Developers have project-isolated access and only see this project.
              </p>
            </div>

            <!-- Prominent Instructions Callout Box in Invitation Dialog -->
            <div class="p-3 bg-amber-50/90 border border-amber-200/90 rounded-xl text-[10px] text-amber-950 space-y-1">
              <div class="flex items-center gap-1.5 font-bold text-amber-900">
                <i data-lucide="info" class="w-3.5 h-3.5 text-amber-600 shrink-0"></i>
                <span>Initial Password & Direct Invite Link Notice</span>
              </div>
              <p class="leading-relaxed text-amber-900/90 text-[10px]">
                You can create the initial password for this team member above. If the invitation email is not received, you can copy the <strong>Direct Invitation Link</strong> along with the created email and password from the next screen and share them with the team member. The member can then sign in immediately with the credentials created by the PM.
              </p>
            </div>
          </div>

          <!-- Sticky Footer -->
          <div class="px-5 py-3 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50/70 shrink-0">
            <button type="button" onclick="ProjectWorkspaceView.closeTeamModal('${modalId}')" class="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-bold text-xs transition cursor-pointer">
              Cancel
            </button>
            <button type="submit" id="submitInviteBtn" class="px-5 py-2 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 font-black text-xs rounded-xl shadow-xs shadow-[#bef264]/30 transition transform hover:-translate-y-0.5 flex items-center gap-1.5 cursor-pointer">
              <i data-lucide="send" class="w-3.5 h-3.5 text-slate-950"></i>
              <span>Send Invitation</span>
            </button>
          </div>
        </form>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  generateMemberPassword() {
    const input = document.getElementById("inviteMemberPassword");
    if (input) {
      const generated = `PW@${Math.floor(1000 + Math.random() * 9000)}!${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`;
      input.value = generated;
      input.type = "text";
      window.app.toast("Password Generated", `Temporary password set to: ${generated}`, "info");
    }
  },

  toggleInvitePasswordVisibility() {
    const input = document.getElementById("inviteMemberPassword");
    const icon = document.getElementById("invitePassEyeIcon");
    if (!input) return;
    if (input.type === "password") {
      input.type = "text";
      if (icon) icon.setAttribute("data-lucide", "eye-off");
    } else {
      input.type = "password";
      if (icon) icon.setAttribute("data-lucide", "eye");
    }
    if (window.lucide) window.lucide.createIcons();
  },

  handleInviteScopeChange(scope) {
    const roleSelect = document.getElementById("inviteMemberRole");
    const hint = document.getElementById("scopeRoleHint");
    const project = store.getActiveProject();
    const currentSpace = store.getActiveWorkspace() || { name: "Workspace" };

    if (!roleSelect) return;

    if (scope === "SPACE") {
      roleSelect.innerHTML = `
        <option value="QA" selected>QA (Trusted space-level role: all projects, QA testing, reports)</option>
        <option value="VIEWER">Viewer (Read-only access across entire space)</option>
      `;
      if (hint) hint.innerText = `QA role provides access to the entire Space (${currentSpace.name}) and all projects.`;
    } else {
      roleSelect.innerHTML = `
        <option value="DEVELOPER" selected>Developer (Assigned issues, dev tasks, card workflow)</option>
        <option value="QA">QA (Quality testing, verify Pass/Fail, QA reports)</option>
        <option value="VIEWER">Viewer (Read-only access to this project)</option>
      `;
      if (hint) hint.innerText = `Developers have project-isolated access and only see ${project ? project.name : 'this project'}.`;
    }
  },

  async handleAddMemberSubmit(e) {
    e.preventDefault();
    const project = store.getActiveProject();
    if (!project) return;

    const emailInput = document.getElementById("inviteMemberEmail");
    const passwordInput = document.getElementById("inviteMemberPassword");
    const roleSelect = document.getElementById("inviteMemberRole");
    const scopeRadio = document.querySelector('input[name="inviteScope"]:checked');
    const submitBtn = document.getElementById("submitInviteBtn");

    const email = emailInput ? emailInput.value.trim() : "";
    const password = passwordInput ? passwordInput.value.trim() : "";
    const role = roleSelect ? roleSelect.value : "DEVELOPER";
    const scope = scopeRadio ? scopeRadio.value : "PROJECT";

    if (!email) return;

    if (!password) {
      window.app.toast("Password Required", "Please enter an initial password for the member.", "error");
      return;
    }

    // Combination Guard (Section 1)
    if (scope === 'SPACE' && role === 'DEVELOPER') {
      window.app.toast("Invalid Combination", "Developer role cannot be assigned to an entire Space. Assign to a specific project instead.", "error");
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="animate-spin inline-block mr-1">⏳</span> Sending...`;
    }

    try {
      const inv = await store.inviteMember({
        workspaceId: project.workspace_id || project.workspaceId,
        projectId: scope === 'PROJECT' ? project.id : null,
        email,
        password,
        role,
        scope
      });

      this.closeTeamModal("addTeamMemberModal");
      this.teamSubTab = "invitations";
      const content = document.getElementById("mainContent");
      if (content) this.render(content);

      // Open Direct Invite Link and Credentials Success Modal
      this.showInviteSuccessModal({
        email,
        password: inv.tempPassword || password,
        role,
        scope,
        token: inv.token,
        projectName: scope === 'PROJECT' ? project.name : (store.getActiveWorkspace()?.name || "Space")
      });
    } catch (err) {
      window.app.toast("Invitation Notice", err.message, "error");
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i data-lucide="send" class="w-3.5 h-3.5"></i> <span>Send Invitation</span>`;
        if (window.lucide) window.lucide.createIcons();
      }
    }
  },

  showInviteSuccessModal({ email, password, role, scope = 'PROJECT', token, projectName }) {
    const modalId = "inviteSuccessModal";
    let modal = document.getElementById(modalId);
    if (!modal) {
      modal = document.createElement("div");
      modal.id = modalId;
      modal.className = "fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto";
      document.body.appendChild(modal);
    }

    const origin = (typeof window !== 'undefined' && window.location && window.location.origin) ? window.location.origin : 'http://localhost';
    const inviteUrl = `${origin}/#accept-invite?token=${token}&email=${encodeURIComponent(email)}`;

    modal.innerHTML = `
      <div class="bg-white rounded-2xl max-w-lg w-full max-h-[88vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-scale-up text-xs my-auto">
        <!-- Sticky Header -->
        <div class="px-5 py-3.5 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-xl bg-[#bef264]/20 text-[#bef264] border border-[#bef264]/40 flex items-center justify-center shrink-0">
              <i data-lucide="check-circle" class="w-4 h-4"></i>
            </div>
            <div>
              <h3 class="font-bold text-sm leading-tight">Invitation Created & Credentials Ready</h3>
              <p class="text-slate-400 text-[11px]">${scope === 'SPACE' ? 'Space-wide invitation' : 'Project-specific invitation'}</p>
            </div>
          </div>
          <button onclick="ProjectWorkspaceView.closeTeamModal('${modalId}')" class="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <!-- Scrollable Content -->
        <div class="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1 custom-scrollbar">
          
          <!-- Notice / Summary -->
          <div class="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 space-y-1">
            <div class="font-bold flex items-center gap-1.5 text-emerald-900">
              <i data-lucide="sparkles" class="w-4 h-4 text-emerald-600 shrink-0"></i>
              <span>Team Member Account Provisioned</span>
            </div>
            <p class="text-[11px] leading-relaxed text-emerald-800">
              Invitation created for <strong>${email}</strong> with role <strong>${role}</strong> in <strong>${projectName}</strong> (${scope === 'SPACE' ? 'Entire Space' : 'Project Only'}).
            </p>
          </div>

          <!-- Created Credentials Box -->
          <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div class="flex items-center justify-between text-[11px] font-bold text-slate-700">
              <span>Member Sign-In Credentials (Created by PM)</span>
              <span class="text-[10px] text-slate-400 font-normal">Active now</span>
            </div>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div class="p-2 bg-white border border-slate-200 rounded-lg">
                <span class="text-[10px] text-slate-400 block font-semibold uppercase">Email</span>
                <span class="font-mono font-bold text-slate-900 truncate block select-all text-[11px]">${email}</span>
              </div>
              <div class="p-2 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
                <div class="min-w-0">
                  <span class="text-[10px] text-slate-400 block font-semibold uppercase">Password</span>
                  <span class="font-mono font-bold text-slate-900 select-all text-[11px]" id="createdPassText">${password}</span>
                </div>
                <button type="button" onclick="navigator.clipboard.writeText('${password}'); window.app.toast('Copied', 'Password copied to clipboard', 'info');" class="p-1 text-slate-400 hover:text-slate-800 cursor-pointer" title="Copy Password">
                  <i data-lucide="copy" class="w-3.5 h-3.5"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- Direct Invite URL Box -->
          <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <div class="flex items-center justify-between text-[11px] font-bold text-slate-700">
              <span>Direct Invitation Link</span>
              <span class="text-emerald-700 font-semibold text-[10px]">Valid for 7 days</span>
            </div>
            <div class="flex items-center gap-2">
              <input type="text" readonly value="${inviteUrl}" id="directInviteUrlInput" class="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-[11px] text-slate-700 select-all focus:outline-none" />
              <button onclick="ProjectWorkspaceView.copyDirectInviteLinkFromInput()" id="copyDirectLinkBtn" class="px-3 py-1.5 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 rounded-lg font-bold transition flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs text-[11px]">
                <i data-lucide="copy" class="w-3 h-3 text-slate-950"></i>
                <span id="copyDirectLinkText">Copy</span>
              </button>
            </div>
            <p class="text-[10px] text-slate-500 leading-relaxed">
              If the email was not received, share this invite link along with the email and password above.
            </p>
          </div>

        </div>

        <!-- Sticky Footer -->
        <div class="px-5 py-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 bg-slate-50/70 shrink-0">
          <button onclick="ProjectWorkspaceView.copyAllCredentialsAndLink('${email}', '${password}', '${role}', '${projectName}', '${inviteUrl}')" class="w-full sm:w-auto px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer">
            <i data-lucide="clipboard-copy" class="w-3.5 h-3.5 text-slate-600"></i>
            <span>Copy All (Credentials + Link)</span>
          </button>

          <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
            <a href="${inviteUrl}" target="_blank" class="px-3 py-1.5 text-slate-600 hover:text-slate-900 font-bold flex items-center gap-1 text-[11px]">
              <span>Test Link</span>
              <i data-lucide="external-link" class="w-3 h-3"></i>
            </a>

            <button onclick="ProjectWorkspaceView.closeTeamModal('${modalId}')" class="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition cursor-pointer">
              Done
            </button>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  copyAllCredentialsAndLink(email, password, role, projectName, inviteUrl) {
    const text = `PulseWave QA Workspace Invitation\nProject / Space: ${projectName}\nRole: ${role}\nSign-in Email: ${email}\nInitial Password: ${password}\nDirect Invitation Link: ${inviteUrl}\n\nPlease click the invitation link or go to the sign-in page to log in using the email and password above.`;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        window.app.toast("Copied All Details", "Email, password, role, and invite link copied to clipboard.", "success");
      }).catch(() => {
        prompt("Copy credentials and link:", text);
      });
    } else {
      prompt("Copy credentials and link:", text);
    }
  },



  copyInviteLink(token) {
    const origin = (typeof window !== 'undefined' && window.location && window.location.origin) ? window.location.origin : 'http://localhost';
    const inviteUrl = `${origin}/#accept-invite?token=${token}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(inviteUrl).then(() => {
        window.app.toast("Link Copied!", "Direct invitation link copied to clipboard.", "success");
      }).catch(() => {
        prompt("Copy this invitation link:", inviteUrl);
      });
    } else {
      prompt("Copy this invitation link:", inviteUrl);
    }
  },

  copyDirectInviteLinkFromInput() {
    const input = document.getElementById("directInviteUrlInput");
    const btnText = document.getElementById("copyDirectLinkText");
    if (input) {
      input.select();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(input.value);
      } else {
        document.execCommand("copy");
      }
      if (btnText) btnText.innerText = "Copied!";
      window.app.toast("Link Copied!", "Direct invitation URL copied to clipboard.", "success");
      setTimeout(() => {
        if (btnText) btnText.innerText = "Copy";
      }, 2000);
    }
  },

  openMemberDetailsModal(memberId) {
    const project = store.getActiveProject();
    if (!project) return;
    const currentSpace = store.getActiveWorkspace() || { name: "Workspace" };
    const members = store.getProjectMembers(project.id);
    const m = members.find(item => item.id === memberId || item.userId === memberId) || {
      id: memberId,
      name: "Team Member",
      email: "member@project.io",
      role: "DEVELOPER",
      status: "Active",
      initials: "TM",
      color: "bg-slate-700",
      assignedIssuesCount: 0,
      activeIssuesCount: 0,
      openBugsCount: 0,
      joinedAt: new Date().toISOString()
    };

    const currentUser = store.getActiveUser();
    const isPM = store.canManageProjectTeam(project.id);
    const isSelf = currentUser && (currentUser.id === m.userId || currentUser.id === m.id || (currentUser.email && m.email && currentUser.email.toLowerCase() === m.email.toLowerCase()));
    const isPMProtected = isSelf || m.role === 'OWNER' || m.role === 'PROJECT_MANAGER' || m.role === 'PM' || (m.id && String(m.id).startsWith('pm_'));

    const modalId = "memberDetailsModal";
    let modal = document.getElementById(modalId);
    if (!modal) {
      modal = document.createElement("div");
      modal.id = modalId;
      modal.className = "fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto";
      document.body.appendChild(modal);
    }

    const formatRoleName = (role) => {
      switch ((role || '').toUpperCase()) {
        case 'OWNER':
        case 'PROJECT_MANAGER':
        case 'PM':
          return 'Project Manager';
        case 'QA_MANAGER':
        case 'QA_ENGINEER':
        case 'QA':
          return 'QA Manager / Engineer';
        case 'DEVELOPER':
          return 'Developer';
        case 'CLIENT_VIEWER':
          return 'Client Viewer';
        case 'VIEWER':
          return 'Viewer (Read-Only)';
        default:
          return role || 'Team Member';
      }
    };

    modal.innerHTML = `
      <div class="bg-white rounded-2xl max-w-md w-full max-h-[88vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-scale-up text-xs my-auto">
        
        <!-- Sticky Header -->
        <div class="px-5 py-4 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl ${m.color || 'bg-slate-700'} text-white font-bold text-sm flex items-center justify-center border border-white/20 shadow-xs shrink-0">
              ${m.initials}
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="font-bold text-sm leading-tight text-white">${m.name}</h3>
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${m.status === 'Active' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-700 text-slate-300 border border-slate-600'}">
                  <span class="w-1.5 h-1.5 rounded-full ${m.status === 'Active' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}"></span>
                  ${m.status || 'Active'}
                </span>
              </div>
              <p class="text-slate-400 text-[11px] font-mono mt-0.5">${m.email}</p>
            </div>
          </div>
          <button onclick="ProjectWorkspaceView.closeTeamModal('${modalId}')" class="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <!-- Scrollable Modal Body -->
        <div class="p-5 space-y-4 overflow-y-auto flex-1 custom-scrollbar text-slate-700">
          
          <!-- 1. Membership & Access Profile -->
          <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2.5">
            <div class="text-[11px] font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <i data-lucide="shield" class="w-3.5 h-3.5 text-slate-900"></i>
              <span>Access & Role Information</span>
            </div>

            <div class="grid grid-cols-2 gap-2 text-xs">
              <div class="p-2.5 bg-white border border-slate-200 rounded-lg">
                <span class="text-[10px] text-slate-400 font-semibold block uppercase">Project Role</span>
                <span class="font-bold text-slate-900 mt-0.5 block">${formatRoleName(m.role)}</span>
              </div>

              <div class="p-2.5 bg-white border border-slate-200 rounded-lg">
                <span class="text-[10px] text-slate-400 font-semibold block uppercase">Account Status</span>
                <span class="font-bold ${m.status === 'Active' ? 'text-emerald-700' : 'text-slate-600'} mt-0.5 block">${m.status || 'Active'}</span>
              </div>

              <div class="p-2.5 bg-white border border-slate-200 rounded-lg">
                <span class="text-[10px] text-slate-400 font-semibold block uppercase">Assigned Project</span>
                <span class="font-bold text-slate-900 mt-0.5 block truncate" title="${project.name}">${project.name}</span>
              </div>

              <div class="p-2.5 bg-white border border-slate-200 rounded-lg">
                <span class="text-[10px] text-slate-400 font-semibold block uppercase">Member Since</span>
                <span class="font-bold text-slate-900 mt-0.5 block">${m.joinedAt ? new Date(m.joinedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'}</span>
              </div>
            </div>
          </div>

          <!-- 2. Workload & Defect Telemetry -->
          <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2.5">
            <div class="text-[11px] font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <i data-lucide="bar-chart-3" class="w-3.5 h-3.5 text-emerald-600"></i>
              <span>Assigned Workload & Quality Metrics</span>
            </div>

            <div class="grid grid-cols-3 gap-2 text-center">
              <div class="p-2.5 bg-white border border-slate-200 rounded-lg">
                <span class="text-[10px] text-slate-400 font-semibold block">Total Issues</span>
                <span class="text-base font-black text-slate-900 mt-0.5 block">${m.assignedIssuesCount || 0}</span>
              </div>

              <div class="p-2.5 bg-white border border-slate-200 rounded-lg">
                <span class="text-[10px] text-slate-400 font-semibold block">Active Tasks</span>
                <span class="text-base font-black text-slate-950 mt-0.5 block">${m.activeIssuesCount || 0}</span>
              </div>

              <div class="p-2.5 bg-white border border-slate-200 rounded-lg">
                <span class="text-[10px] text-slate-400 font-semibold block">Open Bugs</span>
                <span class="text-base font-black text-rose-600 mt-0.5 block">${m.openBugsCount || 0}</span>
              </div>
            </div>
          </div>

          <!-- 3. PM Management Controls Deck -->
          ${isPM ? `
            <div class="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3">
              <div class="flex items-center justify-between">
                <div class="text-[11px] font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                  <i data-lucide="sliders" class="w-3.5 h-3.5 text-amber-700"></i>
                  <span>Project Manager Controls</span>
                </div>
                ${isSelf ? `
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-[#f7fee7] text-[#4d7c0f] border border-[#d9f99d]">Your PM Account</span>
                ` : isPMProtected ? `
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">Project Manager</span>
                ` : ''}
              </div>

              ${isPMProtected ? `
                <p class="text-[11px] text-slate-600 leading-relaxed bg-white/80 p-2.5 rounded-lg border border-slate-200">
                  🛡️ ${isSelf ? 'You are currently managing this project. You cannot deactivate or delete your own Project Manager account.' : 'This account is a Project Manager / Space Owner and is protected from deactivation or deletion.'}
                </p>
              ` : `
                <div class="space-y-2">
                  <div class="grid grid-cols-2 gap-2">
                    <!-- Toggle Active / Inactive Status -->
                    <button
                      type="button"
                      onclick="ProjectWorkspaceView.handleToggleMemberStatus('${m.id}', '${m.status === 'Active' ? 'Inactive' : 'Active'}')"
                      class="px-3 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition cursor-pointer ${m.status === 'Active' ? 'bg-amber-100/80 hover:bg-amber-200 text-amber-900 border-amber-300' : 'bg-emerald-100/80 hover:bg-emerald-200 text-emerald-900 border-emerald-300'}"
                    >
                      <i data-lucide="${m.status === 'Active' ? 'user-x' : 'user-check'}" class="w-3.5 h-3.5"></i>
                      <span>${m.status === 'Active' ? 'Deactivate User' : 'Activate User'}</span>
                    </button>

                    <!-- Change Role Button -->
                    <button
                      type="button"
                      onclick="ProjectWorkspaceView.closeTeamModal('${modalId}'); ProjectWorkspaceView.openChangeRoleModal('${m.id}', '${m.role}', '${m.name.replace(/'/g, "\\'")}')"
                      class="px-3 py-2.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <i data-lucide="shield" class="w-3.5 h-3.5 text-slate-600"></i>
                      <span>Change Role</span>
                    </button>
                  </div>

                  <!-- Delete User from Database Button -->
                  <button
                    type="button"
                    onclick="ProjectWorkspaceView.closeTeamModal('${modalId}'); ProjectWorkspaceView.openRemoveMemberModal('${m.id}', '${m.name.replace(/'/g, "\\'")}', '${m.role}')"
                    class="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
                  >
                    <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                    <span>Delete User from Database</span>
                  </button>
                </div>
              `}
            </div>
          ` : ''}

        </div>

        <!-- Sticky Footer -->
        <div class="px-5 py-3 border-t border-slate-100 flex items-center justify-end bg-slate-50/70 shrink-0">
          <button
            type="button"
            onclick="ProjectWorkspaceView.closeTeamModal('${modalId}')"
            class="px-5 py-2 bg-slate-950 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  async handleToggleMemberStatus(memberId, newStatus) {
    const project = store.getActiveProject();
    if (!project) return;

    try {
      await store.updateProjectMemberStatus(project.id, memberId, newStatus);
      this.closeTeamModal("memberDetailsModal");
      window.app.toast("Status Updated", `Team member status set to ${newStatus}.`, "success");
      const content = document.getElementById("mainContent");
      if (content) this.render(content);
    } catch (err) {
      window.app.toast("Status Error", err.message, "error");
    }
  },

  openChangeRoleModal(memberId, currentRole, memberName) {
    const project = store.getActiveProject();
    if (!project) return;
    if (!store.canManageProjectTeam(project.id)) {
      window.app.toast("Permission Denied", "You don't have permission to change member roles.", "error");
      return;
    }

    const modalId = "changeRoleModal";
    let modal = document.getElementById(modalId);
    if (!modal) {
      modal = document.createElement("div");
      modal.id = modalId;
      modal.className = "fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4";
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden animate-scale-up text-xs">
        <div class="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h3 class="font-bold text-slate-900 text-sm">Change Member Role</h3>
            <p class="text-slate-500 text-xs">For ${memberName}</p>
          </div>
          <button onclick="ProjectWorkspaceView.closeTeamModal('${modalId}')" class="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <form onsubmit="ProjectWorkspaceView.handleChangeRoleSubmit(event, '${memberId}')" class="p-5 space-y-4">
          <div>
            <label class="block font-bold text-slate-700 mb-1.5">Select New Role</label>
            <select id="newRoleSelect" required class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:bg-white focus:outline-none">
              <option value="PROJECT_MANAGER" ${currentRole === 'PROJECT_MANAGER' || currentRole === 'OWNER' ? 'selected' : ''}>Project Manager (Full management)</option>
              <option value="QA_MANAGER" ${currentRole === 'QA_MANAGER' ? 'selected' : ''}>QA Manager (Quality gate, Pass/Fail, QA reports)</option>
              <option value="DEVELOPER" ${currentRole === 'DEVELOPER' ? 'selected' : ''}>Developer (Assigned tasks, comments)</option>
              <option value="VIEWER" ${currentRole === 'VIEWER' ? 'selected' : ''}>Viewer (Read-only)</option>
              <option value="CLIENT_VIEWER" ${currentRole === 'CLIENT_VIEWER' ? 'selected' : ''}>Client Viewer (Customer read-only)</option>
            </select>
          </div>

          <div class="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button type="button" onclick="ProjectWorkspaceView.closeTeamModal('${modalId}')" class="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-bold transition">
              Cancel
            </button>
            <button type="submit" class="px-5 py-2.5 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 font-bold rounded-xl transition cursor-pointer shadow-xs shadow-[#bef264]/25">
              Save Role
            </button>
          </div>
        </form>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  async handleChangeRoleSubmit(e, memberId) {
    e.preventDefault();
    const project = store.getActiveProject();
    if (!project) return;

    const select = document.getElementById("newRoleSelect");
    const newRole = select ? select.value : "DEVELOPER";

    try {
      await store.changeProjectMemberRole(project.id, memberId, newRole);
      this.closeTeamModal("changeRoleModal");
      window.app.toast("Role Updated", `Project member role updated to ${newRole}.`, "success");
      const content = document.getElementById("mainContent");
      if (content) this.render(content);
    } catch (err) {
      window.app.toast("Error", err.message, "error");
    }
  },

  openRemoveMemberModal(memberId, memberName, role) {
    const project = store.getActiveProject();
    if (!project) return;
    if (!store.canManageProjectTeam(project.id)) {
      window.app.toast("Permission Denied", "You don't have permission to remove project members.", "error");
      return;
    }

    const currentUser = store.getActiveUser();
    const members = store.getProjectMembers(project.id);
    const targetMember = members.find(m => m.id === memberId || m.userId === memberId);
    if (targetMember && currentUser && (targetMember.userId === currentUser.id || targetMember.id === currentUser.id || (targetMember.email && currentUser.email && targetMember.email.toLowerCase() === currentUser.email.toLowerCase()))) {
      window.app.toast("Self-Deletion Blocked", "You cannot delete your own account from the project team.", "error");
      return;
    }

    const modalId = "removeMemberModal";
    let modal = document.getElementById(modalId);
    if (!modal) {
      modal = document.createElement("div");
      modal.id = modalId;
      modal.className = "fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4";
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-rose-100 overflow-hidden animate-scale-up text-xs">
        <div class="p-5 border-b border-rose-100 bg-rose-50/60 flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <i data-lucide="trash-2" class="w-5 h-5"></i>
          </div>
          <div>
            <h3 class="font-bold text-slate-900 text-sm">Delete Team Member</h3>
            <p class="text-slate-500 text-xs">Remove from ${project.name}</p>
          </div>
        </div>

        <div class="p-5 space-y-3">
          <p class="text-slate-700 leading-relaxed font-medium">
            Are you sure you want to delete <strong>${memberName}</strong> from the team?
          </p>
          <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 space-y-1">
            <div class="flex items-center justify-between">
              <span class="text-slate-400">Assigned Role:</span>
              <span class="font-bold text-slate-800">${role || 'Member'}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-400">Project Scope:</span>
              <span class="font-bold text-slate-800">${project.name}</span>
            </div>
          </div>
          <p class="text-slate-400 text-[11px] leading-relaxed">
            They will immediately lose access to this project workspace, board, defect tickets, and sprint telemetry.
          </p>
        </div>

        <div class="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button type="button" onclick="ProjectWorkspaceView.closeTeamModal('${modalId}')" class="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition cursor-pointer">
            Cancel
          </button>
          <button type="button" onclick="ProjectWorkspaceView.handleRemoveMember('${memberId}')" class="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition cursor-pointer shadow-xs flex items-center gap-1.5">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            <span>Delete Member</span>
          </button>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  async handleRemoveMember(memberId) {
    const project = store.getActiveProject();
    if (!project) return;

    try {
      await store.removeProjectMember(project.id, memberId);
      this.closeTeamModal("removeMemberModal");
      window.app.toast("Member Deleted", "The user has been removed from this project and access revoked.", "success");
      const content = document.getElementById("mainContent");
      if (content) this.render(content);
    } catch (err) {
      window.app.toast("Removal Blocked", err.message, "error");
    }
  },

  openDeleteInvitationModal(invitationId, email) {
    const modalId = "deleteInvitationModal";
    let modal = document.getElementById(modalId);
    if (!modal) {
      modal = document.createElement("div");
      modal.id = modalId;
      modal.className = "fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4";
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-rose-100 overflow-hidden animate-scale-up text-xs">
        <div class="p-5 border-b border-rose-100 bg-rose-50/60 flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <i data-lucide="trash-2" class="w-5 h-5"></i>
          </div>
          <div>
            <h3 class="font-bold text-slate-900 text-sm">Delete Unaccepted Invitation</h3>
            <p class="text-slate-500 text-xs">Permanently revoke invite</p>
          </div>
        </div>

        <div class="p-5 space-y-3">
          <p class="text-slate-700 leading-relaxed font-medium">
            Are you sure you want to delete the pending invitation for <strong>${email}</strong>?
          </p>
          <p class="text-slate-400 text-[11px] leading-relaxed">
            The secure invitation token will be permanently revoked from the database. The recipient will not be able to accept or access this workspace.
          </p>
        </div>

        <div class="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button type="button" onclick="ProjectWorkspaceView.closeTeamModal('${modalId}')" class="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition cursor-pointer">
            Cancel
          </button>
          <button type="button" onclick="ProjectWorkspaceView.handleDeleteInvitation('${invitationId}')" class="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition cursor-pointer shadow-xs flex items-center gap-1.5">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            <span>Delete Invite</span>
          </button>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  async handleDeleteInvitation(invitationId) {
    try {
      await store.deleteInvitation(invitationId);
      this.closeTeamModal("deleteInvitationModal");
      window.app.toast("Invitation Deleted", "The unaccepted invitation has been permanently deleted from Supabase.", "success");
      const content = document.getElementById("mainContent");
      if (content) this.render(content);
    } catch (err) {
      window.app.toast("Error", err.message, "error");
    }
  },

  openDeleteAllPendingModal() {
    const project = store.getActiveProject();
    if (!project) return;

    const modalId = "deleteAllPendingModal";
    let modal = document.getElementById(modalId);
    if (!modal) {
      modal = document.createElement("div");
      modal.id = modalId;
      modal.className = "fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4";
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-rose-100 overflow-hidden animate-scale-up text-xs">
        <div class="p-5 border-b border-rose-100 bg-rose-50/60 flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <i data-lucide="trash-2" class="w-5 h-5"></i>
          </div>
          <div>
            <h3 class="font-bold text-slate-900 text-sm">Delete All Unaccepted Invites</h3>
            <p class="text-slate-500 text-xs">Batch clean-up</p>
          </div>
        </div>

        <div class="p-5 space-y-3">
          <p class="text-slate-700 leading-relaxed font-medium">
            Are you sure you want to delete all pending/unaccepted invitations for this project?
          </p>
          <p class="text-slate-400 text-[11px] leading-relaxed">
            All unaccepted invitation tokens will be permanently purged.
          </p>
        </div>

        <div class="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button type="button" onclick="ProjectWorkspaceView.closeTeamModal('${modalId}')" class="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition cursor-pointer">
            Cancel
          </button>
          <button type="button" onclick="ProjectWorkspaceView.handleDeleteAllPending()" class="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition cursor-pointer shadow-xs flex items-center gap-1.5">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            <span>Delete All</span>
          </button>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  async handleDeleteAllPending() {
    const project = store.getActiveProject();
    if (!project) return;

    try {
      const count = await store.deleteAllPendingInvitations(project.id);
      this.closeTeamModal("deleteAllPendingModal");
      window.app.toast("Cleaned Up", `Deleted ${count} unaccepted invitations.`, "success");
      const content = document.getElementById("mainContent");
      if (content) this.render(content);
    } catch (err) {
      window.app.toast("Error", err.message, "error");
    }
  },

  async handleResendInvitation(invitationId) {
    try {
      await store.resendProjectInvitation(invitationId);
      window.app.toast("Invitation Resent", "A new invitation token has been generated and dispatched.", "success");
      const content = document.getElementById("mainContent");
      if (content) this.render(content);
    } catch (err) {
      window.app.toast("Error", err.message, "error");
    }
  },

  async handleCancelInvitation(invitationId) {
    return this.handleDeleteInvitation(invitationId);
  },

  closeTeamModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.remove();
  },

  // Drag and Drop (RBAC Protected)
  initDragAndDrop() {
    const project = store.getActiveProject();
    if (!project) return;

    // Check RBAC permission for Kanban card movement
    const canMove = store.canMoveKanbanCard(project.id);

    setTimeout(() => {
      const cards = document.querySelectorAll(".kanban-board-card");
      const dropZones = document.querySelectorAll(".kanban-drop-zone");

      if (!canMove) {
        cards.forEach(card => {
          card.setAttribute("draggable", "false");
          card.style.cursor = "default";
        });
        return;
      }

      cards.forEach(card => {
        card.setAttribute("draggable", "true");
        card.addEventListener("dragstart", e => {
          card.classList.add("dragging");
          e.dataTransfer.setData("text/plain", card.dataset.issueId);
        });
        card.addEventListener("dragend", () => {
          card.classList.remove("dragging");
        });
      });

      dropZones.forEach(zone => {
        zone.addEventListener("dragover", e => {
          e.preventDefault();
          zone.closest(".kanban-col-container").classList.add("drag-over");
        });
        zone.addEventListener("dragleave", () => {
          zone.closest(".kanban-col-container").classList.remove("drag-over");
        });
        zone.addEventListener("drop", e => {
          e.preventDefault();
          zone.closest(".kanban-col-container").classList.remove("drag-over");
          const issueId = e.dataTransfer.getData("text/plain");
          const newStatus = zone.dataset.status;
          if (issueId && newStatus) {
            store.updateIssueStatus(issueId, newStatus);
            ProjectWorkspaceView.render(document.getElementById("mainContent"));
          }
        });
      });
    }, 60);
  },

  initCharts(project, stats) {
    // Canvas charts hook
  }
};

if (typeof window !== "undefined") window.ProjectWorkspaceView = ProjectWorkspaceView;
if (typeof global !== "undefined") global.ProjectWorkspaceView = ProjectWorkspaceView;
if (typeof module !== "undefined" && module.exports) module.exports = ProjectWorkspaceView;
