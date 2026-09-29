/**
 * PulseWave QA Platform — All Issues & Quality Repository Master View (V4 Professional Edition)
 * Modern Agile & QA Issue Tracking Workspace (Linear & Jira SaaS Aesthetic):
 * - Streamlined, high-utility filter bar (Sprint, Type, Status, Priority, Assignee)
 * - Header Project Scope Selector with instant project-wise KPI metrics & telemetry
 * - Interactive Saved View Presets with live count badges & zero filter collisions
 * - Interactive Story Point Estimation, Floating Bulk Operations & CSV Export
 * - QA Quality Gate verification & reopen lifecycle tracking
 */

const AllIssuesView = {
  searchQuery: "",
  filterProject: "all",
  filterType: "all",
  filterPriority: "all",
  filterStatus: "all",
  filterAssignee: "all",
  filterDeveloper: "all",
  filterQA: "all",
  filterSprint: "all",
  filterEnvironment: "all",
  filterQualityGate: "all",
  sortBy: "updated", // 'updated', 'key', 'priority', 'story_points', 'reopen', 'title'
  activeSavedView: "all", // 'all', 'my_issues', 'open_bugs', 'ready_for_qa', 'reopened', 'active_sprint', 'unestimated'
  selectedIssueIds: new Set(),

  render(container) {
    if (!container) return;

    const activeUser = store.getActiveUser ? store.getActiveUser() : null;
    const allAuthorizedProjects = store.getAuthorizedProjects ? store.getAuthorizedProjects() : (store.getProjects ? store.getProjects() : []);
    
    // Fetch all issues accessible to the workspace
    const allIssues = (store.getIssues ? store.getIssues() : []).filter(i => {
      if (allAuthorizedProjects.length === 0) return true;
      const pId = i.projectId || i.project_id;
      return allAuthorizedProjects.some(p => p.id === pId);
    });

    // Project-scoped pool for KPI counts and stats
    const scopedPool = this.filterProject === "all" 
      ? allIssues 
      : allIssues.filter(i => (i.projectId || i.project_id) === this.filterProject);

    const filteredIssues = this.filterAndSortIssues(allIssues, activeUser);

    // KPI Metrics calculation (computed dynamically project-wise based on selected project)
    const totalCount = scopedPool.length;
    const openBugsCount = scopedPool.filter(i => (i.type === "Bug" || i.type === "Defect") && i.status !== "Done" && i.status !== "Closed").length;
    const readyForQaCount = scopedPool.filter(i => i.status === "Ready for QA" || i.status === "Fixed" || i.qaStatus === "Ready for QA").length;
    const qaFailedCount = scopedPool.filter(i => i.qaStatus === "Failed" || i.status === "Reopened" || i.status === "QA Failed" || (i.reopenCount && i.reopenCount > 0)).length;
    const inDevCount = scopedPool.filter(i => i.status === "In Progress" || i.status === "In Development").length;
    const verifiedDoneCount = scopedPool.filter(i => i.status === "Done" || i.status === "Closed" || i.qaStatus === "Passed").length;
    const unestimatedCount = scopedPool.filter(i => !i.storyPoints && !i.story_points).length;
    const totalStoryPoints = scopedPool.reduce((sum, i) => sum + Number(i.storyPoints || i.story_points || 0), 0);

    const projects = allAuthorizedProjects;
    const users = store.getUsers ? store.getUsers() : [];
    
    // Sprints scoped to selected project (or all sprints if All Projects)
    const projectSprints = this.filterProject === "all"
      ? (store.getSprints ? store.getSprints() : [])
      : (store.getSprints ? store.getSprints(this.filterProject) : []);

    // Active filters count for reset badge
    let activeFilterCount = 0;
    if (this.searchQuery) activeFilterCount++;
    if (this.filterProject !== "all") activeFilterCount++;
    if (this.filterType !== "all") activeFilterCount++;
    if (this.filterPriority !== "all") activeFilterCount++;
    if (this.filterStatus !== "all") activeFilterCount++;
    if (this.filterAssignee !== "all") activeFilterCount++;
    if (this.filterDeveloper !== "all") activeFilterCount++;
    if (this.filterQA !== "all") activeFilterCount++;
    if (this.filterSprint !== "all") activeFilterCount++;
    if (this.filterEnvironment !== "all") activeFilterCount++;
    if (this.filterQualityGate !== "all") activeFilterCount++;
    if (this.activeSavedView !== "all") activeFilterCount++;

    const isAllSelected = filteredIssues.length > 0 && filteredIssues.every(i => this.selectedIssueIds.has(i.id));

    // Get current project name label
    const selectedProjectObj = projects.find(p => p.id === this.filterProject);
    const scopeLabel = selectedProjectObj ? `${selectedProjectObj.name} [${selectedProjectObj.key}]` : "All Projects";

    container.innerHTML = `
      <div class="space-y-4 max-w-7xl mx-auto pb-16 text-xs text-slate-800 animate-fade-in font-sans">
        
        <!-- =========================================================================
             1. REFINED HEADER: Project Scope Selector & Primary Action Controls
             ========================================================================= -->
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 bg-white px-5 py-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div class="flex items-center gap-3.5 min-w-0">
            <div class="w-10 h-10 rounded-xl bg-slate-950 text-[#bef264] flex items-center justify-center font-bold text-sm shrink-0 shadow-xs ring-4 ring-slate-100">
              <i data-lucide="layers" class="w-5 h-5"></i>
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <h1 class="text-lg font-black text-slate-900 tracking-tight">Issues & Defects</h1>
                <span class="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono font-bold text-[11px] border border-slate-200">
                  ${totalCount} Issues • ${totalStoryPoints} SP
                </span>
                <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Live Sync
                </span>
              </div>
              <p class="text-[11px] text-slate-500 truncate mt-0.5">
                Centralized quality backlog and defect repository for <strong class="text-slate-800">${scopeLabel}</strong>.
              </p>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2.5 shrink-0 self-start lg:self-center">
            <!-- Project Scope Selector Dropdown (Defaults to 'All Projects') -->
            <div class="relative min-w-[200px]">
              <div class="absolute left-3 top-2.5 text-slate-400 pointer-events-none">
                <i data-lucide="folder-git-2" class="w-4 h-4 text-slate-500"></i>
              </div>
              <select 
                onchange="AllIssuesView.setFilter('project', this.value)" 
                class="appearance-none w-full pl-9 pr-8 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 cursor-pointer transition shadow-2xs"
                title="Select Project Scope"
              >
                <option value="all" ${this.filterProject === 'all' ? 'selected' : ''}>All Projects Scope</option>
                ${projects.map(p => `
                  <option value="${p.id}" ${this.filterProject === p.id ? 'selected' : ''}>
                    ${p.name} (${p.key})
                  </option>
                `).join('')}
              </select>
              <i data-lucide="chevron-down" class="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none"></i>
            </div>

            <!-- Export CSV -->
            <button onclick="AllIssuesView.exportCSV()" class="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs hover:border-slate-300" title="Export Filtered Issues to CSV">
              <i data-lucide="download" class="w-3.5 h-3.5 text-slate-500"></i>
              <span class="hidden sm:inline">Export CSV</span>
            </button>

            <!-- Create Issue -->
            <button onclick="window.app.openCreateIssueModal('${this.filterProject !== 'all' ? this.filterProject : ''}')" class="px-4 py-2 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 rounded-xl font-black shadow-xs transition-all duration-150 hover:shadow flex items-center gap-1.5 cursor-pointer">
              <i data-lucide="plus" class="w-4 h-4 text-slate-950 stroke-[3]"></i>
              <span>New Issue</span>
            </button>
          </div>
        </div>

        <!-- =========================================================================
             2. INTERACTIVE KPI METRICS ROW (Project-Wise Dynamic Counts)
             ========================================================================= -->
        <div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <!-- Total Work Items -->
          <div onclick="AllIssuesView.applySavedView('all')" class="bg-white p-3.5 rounded-2xl border transition-all duration-150 cursor-pointer flex items-center justify-between group ${this.activeSavedView === 'all' && this.filterStatus === 'all' ? 'border-slate-900 ring-2 ring-slate-900/10 shadow-xs' : 'border-slate-200/80 hover:border-slate-300 hover:shadow-2xs'}">
            <div>
              <span class="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">Total Items</span>
              <span class="text-lg font-black text-slate-900 font-mono">${totalCount}</span>
            </div>
            <div class="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold group-hover:bg-slate-900 group-hover:text-white transition">
              <i data-lucide="layers" class="w-4 h-4"></i>
            </div>
          </div>

          <!-- Open Defects -->
          <div onclick="AllIssuesView.applySavedView('open_bugs')" class="bg-white p-3.5 rounded-2xl border transition-all duration-150 cursor-pointer flex items-center justify-between group ${this.activeSavedView === 'open_bugs' ? 'border-rose-500 ring-2 ring-rose-500/15 bg-rose-50/20' : 'border-slate-200/80 hover:border-rose-300 hover:shadow-2xs'}">
            <div>
              <span class="text-[10px] uppercase tracking-wider font-bold text-rose-600 block">Open Defects</span>
              <span class="text-lg font-black text-rose-700 font-mono">${openBugsCount}</span>
            </div>
            <div class="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold group-hover:bg-rose-600 group-hover:text-white transition">
              <i data-lucide="bug" class="w-4 h-4"></i>
            </div>
          </div>

          <!-- Ready for QA -->
          <div onclick="AllIssuesView.applySavedView('ready_for_qa')" class="bg-white p-3.5 rounded-2xl border transition-all duration-150 cursor-pointer flex items-center justify-between group ${this.activeSavedView === 'ready_for_qa' ? 'border-purple-500 ring-2 ring-purple-500/15 bg-purple-50/20' : 'border-slate-200/80 hover:border-purple-300 hover:shadow-2xs'}">
            <div>
              <span class="text-[10px] uppercase tracking-wider font-bold text-purple-600 block">Ready for QA</span>
              <span class="text-lg font-black text-purple-700 font-mono">${readyForQaCount}</span>
            </div>
            <div class="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold group-hover:bg-purple-600 group-hover:text-white transition">
              <i data-lucide="shield-check" class="w-4 h-4"></i>
            </div>
          </div>

          <!-- Reopened / QA Failed -->
          <div onclick="AllIssuesView.applySavedView('reopened')" class="bg-white p-3.5 rounded-2xl border transition-all duration-150 cursor-pointer flex items-center justify-between group ${this.activeSavedView === 'reopened' ? 'border-amber-500 ring-2 ring-amber-500/15 bg-amber-50/20' : 'border-slate-200/80 hover:border-amber-300 hover:shadow-2xs'}">
            <div>
              <span class="text-[10px] uppercase tracking-wider font-bold text-amber-600 block">QA Reopened</span>
              <span class="text-lg font-black text-amber-700 font-mono">${qaFailedCount}</span>
            </div>
            <div class="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold group-hover:bg-amber-600 group-hover:text-white transition">
              <i data-lucide="alert-triangle" class="w-4 h-4"></i>
            </div>
          </div>

          <!-- Verified & Done -->
          <div class="bg-white p-3.5 rounded-2xl border border-slate-200/80 flex items-center justify-between col-span-2 sm:col-span-1 shadow-xs">
            <div>
              <span class="text-[10px] uppercase tracking-wider font-bold text-emerald-600 block">Verified & Done</span>
              <span class="text-lg font-black text-emerald-700 font-mono">${verifiedDoneCount} <span class="text-xs font-semibold text-slate-400">(${totalCount > 0 ? Math.round((verifiedDoneCount / totalCount) * 100) : 0}%)</span></span>
            </div>
            <div class="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <i data-lucide="check-circle-2" class="w-4 h-4"></i>
            </div>
          </div>
        </div>

        <!-- =========================================================================
             3. STREAMLINED SEARCH & PROFESSIONAL FILTER BAR (Linear & Jira SaaS Style)
             ========================================================================= -->
        <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3.5">
          
          <!-- Top Row: Modern Search & Sort & Reset Controls -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <!-- Search Input -->
            <div class="relative flex-1 max-w-lg">
              <i data-lucide="search" class="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none"></i>
              <input 
                type="text" 
                id="allIssuesSearchField"
                value="${this.searchQuery}" 
                oninput="AllIssuesView.handleSearch(this.value)" 
                placeholder="Filter by key, title, assignee, label, build, environment..." 
                class="w-full pl-9 pr-8 py-2 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition" 
              />
              ${this.searchQuery ? `
                <button onclick="AllIssuesView.handleSearch('')" class="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5 rounded-full hover:bg-slate-200 transition">
                  <i data-lucide="x" class="w-3.5 h-3.5"></i>
                </button>
              ` : ''}
            </div>

            <!-- Sort By & Quick Clear Controls -->
            <div class="flex items-center gap-2 shrink-0">
              <span class="text-slate-400 font-bold text-[11px] whitespace-nowrap">Sort:</span>
              <div class="relative">
                <select onchange="AllIssuesView.setSort(this.value)" class="appearance-none pl-3 pr-7 py-1.5 border border-slate-200 rounded-xl text-slate-800 font-bold bg-slate-50 hover:bg-slate-100 cursor-pointer text-xs focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition shadow-2xs">
                  <option value="updated" ${this.sortBy === 'updated' ? 'selected' : ''}>Recently Updated</option>
                  <option value="key" ${this.sortBy === 'key' ? 'selected' : ''}>Issue Key (ID)</option>
                  <option value="priority" ${this.sortBy === 'priority' ? 'selected' : ''}>Priority (P0 → P3)</option>
                  <option value="story_points" ${this.sortBy === 'story_points' ? 'selected' : ''}>Story Points (High → Low)</option>
                  <option value="reopen" ${this.sortBy === 'reopen' ? 'selected' : ''}>Reopen Frequency</option>
                  <option value="title" ${this.sortBy === 'title' ? 'selected' : ''}>Summary (A–Z)</option>
                </select>
                <i data-lucide="chevron-down" class="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5 pointer-events-none"></i>
              </div>

              ${activeFilterCount > 0 ? `
                <button onclick="AllIssuesView.resetFilters()" class="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-2xs">
                  <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>
                  <span>Reset Filters (${activeFilterCount})</span>
                </button>
              ` : ''}
            </div>
          </div>

          <!-- Middle Row: Segmented Preset Quick Filter Pills -->
          <div class="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
            <button onclick="AllIssuesView.applySavedView('all')" class="px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer shrink-0 ${this.activeSavedView === 'all' && this.filterStatus === 'all' && this.filterType === 'all' ? 'bg-slate-950 text-white shadow-xs' : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200/80'}">
              All Issues (${totalCount})
            </button>
            <button onclick="AllIssuesView.applySavedView('my_issues')" class="px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer shrink-0 ${this.activeSavedView === 'my_issues' ? 'bg-slate-950 text-white shadow-xs' : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200/80'}">
              <span class="inline-flex items-center gap-1.5"><i data-lucide="user-check" class="w-3 h-3"></i> Assigned to Me</span>
            </button>
            <button onclick="AllIssuesView.applySavedView('open_bugs')" class="px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer shrink-0 ${this.activeSavedView === 'open_bugs' ? 'bg-rose-50 text-rose-700 border border-rose-300 ring-2 ring-rose-500/10 font-black' : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200/80'}">
              <span class="inline-flex items-center gap-1.5"><i data-lucide="bug" class="w-3 h-3 text-rose-600"></i> Bugs Only (${openBugsCount})</span>
            </button>
            <button onclick="AllIssuesView.applySavedView('ready_for_qa')" class="px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer shrink-0 ${this.activeSavedView === 'ready_for_qa' ? 'bg-purple-50 text-purple-700 border border-purple-300 ring-2 ring-purple-500/10 font-black' : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200/80'}">
              <span class="inline-flex items-center gap-1.5"><i data-lucide="shield-check" class="w-3 h-3 text-purple-600"></i> Ready for QA (${readyForQaCount})</span>
            </button>
            <button onclick="AllIssuesView.applySavedView('reopened')" class="px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer shrink-0 ${this.activeSavedView === 'reopened' ? 'bg-amber-50 text-amber-800 border border-amber-300 ring-2 ring-amber-500/10 font-black' : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200/80'}">
              <span class="inline-flex items-center gap-1.5"><i data-lucide="alert-triangle" class="w-3 h-3 text-amber-600"></i> Reopened (${qaFailedCount})</span>
            </button>
            <button onclick="AllIssuesView.applySavedView('active_sprint')" class="px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer shrink-0 ${this.activeSavedView === 'active_sprint' ? 'bg-blue-50 text-blue-700 border border-blue-300 ring-2 ring-blue-500/10 font-black' : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200/80'}">
              <span class="inline-flex items-center gap-1.5"><i data-lucide="code" class="w-3 h-3 text-blue-600"></i> In Development (${inDevCount})</span>
            </button>
            <button onclick="AllIssuesView.applySavedView('unestimated')" class="px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer shrink-0 ${this.activeSavedView === 'unestimated' ? 'bg-slate-800 text-white font-black' : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200/80'}">
              <span class="inline-flex items-center gap-1.5"><i data-lucide="help-circle" class="w-3 h-3"></i> Unestimated (${unestimatedCount})</span>
            </button>
          </div>

          <!-- Bottom Row: 5 Essential Professional Filter Dropdown Pills -->
          <div class="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
            <div class="flex flex-wrap items-center gap-2">
              
              <!-- 1. Sprint Filter Pill -->
              <div class="relative min-w-[135px]">
                <div class="absolute left-2.5 top-2 text-slate-400 pointer-events-none">
                  <i data-lucide="flag" class="w-3.5 h-3.5 ${this.filterSprint !== 'all' ? 'text-indigo-600 font-bold' : 'text-slate-400'}"></i>
                </div>
                <select 
                  onchange="AllIssuesView.setFilter('sprint', this.value)" 
                  class="appearance-none w-full pl-8 pr-7 py-1.5 bg-slate-50 hover:bg-slate-100 border ${this.filterSprint !== 'all' ? 'border-indigo-400 bg-indigo-50/30 text-indigo-900 font-black' : 'border-slate-200 text-slate-700 font-bold'} rounded-xl text-[11px] focus:outline-none focus:ring-2 focus:ring-slate-900/10 cursor-pointer transition shadow-2xs"
                >
                  <option value="all" ${this.filterSprint === 'all' ? 'selected' : ''}>Sprint: All</option>
                  <option value="backlog" ${this.filterSprint === 'backlog' ? 'selected' : ''}>Product Backlog</option>
                  ${projectSprints.map(s => `
                    <option value="${s.id}" ${this.filterSprint === s.id ? 'selected' : ''}>
                      ${s.name} ${s.status === 'Active' || s.status === 'active' ? '● Active' : ''}
                    </option>
                  `).join("")}
                </select>
                <i data-lucide="chevron-down" class="w-3 h-3 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none"></i>
              </div>

              <!-- 2. Type Filter Pill -->
              <div class="relative min-w-[115px]">
                <div class="absolute left-2.5 top-2 text-slate-400 pointer-events-none">
                  <i data-lucide="tag" class="w-3.5 h-3.5 ${this.filterType !== 'all' ? 'text-indigo-600' : 'text-slate-400'}"></i>
                </div>
                <select 
                  onchange="AllIssuesView.setFilter('type', this.value)" 
                  class="appearance-none w-full pl-8 pr-7 py-1.5 bg-slate-50 hover:bg-slate-100 border ${this.filterType !== 'all' ? 'border-indigo-400 bg-indigo-50/30 text-indigo-900 font-black' : 'border-slate-200 text-slate-700 font-bold'} rounded-xl text-[11px] focus:outline-none focus:ring-2 focus:ring-slate-900/10 cursor-pointer transition shadow-2xs"
                >
                  <option value="all" ${this.filterType === 'all' ? 'selected' : ''}>Type: All</option>
                  <option value="Bug" ${this.filterType === 'Bug' ? 'selected' : ''}>🐞 Bug / Defect</option>
                  <option value="Story" ${this.filterType === 'Story' ? 'selected' : ''}>📗 User Story</option>
                  <option value="Task" ${this.filterType === 'Task' ? 'selected' : ''}>📋 Task</option>
                </select>
                <i data-lucide="chevron-down" class="w-3 h-3 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none"></i>
              </div>

              <!-- 3. Status Filter Pill -->
              <div class="relative min-w-[130px]">
                <div class="absolute left-2.5 top-2 text-slate-400 pointer-events-none">
                  <i data-lucide="check-circle" class="w-3.5 h-3.5 ${this.filterStatus !== 'all' ? 'text-indigo-600' : 'text-slate-400'}"></i>
                </div>
                <select 
                  onchange="AllIssuesView.setFilter('status', this.value)" 
                  class="appearance-none w-full pl-8 pr-7 py-1.5 bg-slate-50 hover:bg-slate-100 border ${this.filterStatus !== 'all' ? 'border-indigo-400 bg-indigo-50/30 text-indigo-900 font-black' : 'border-slate-200 text-slate-700 font-bold'} rounded-xl text-[11px] focus:outline-none focus:ring-2 focus:ring-slate-900/10 cursor-pointer transition shadow-2xs"
                >
                  <option value="all" ${this.filterStatus === 'all' ? 'selected' : ''}>Status: All</option>
                  <option value="Backlog" ${this.filterStatus === 'Backlog' ? 'selected' : ''}>Backlog</option>
                  <option value="To Do" ${this.filterStatus === 'To Do' ? 'selected' : ''}>To Do</option>
                  <option value="In Progress" ${this.filterStatus === 'In Progress' ? 'selected' : ''}>In Progress</option>
                  <option value="Ready for QA" ${this.filterStatus === 'Ready for QA' ? 'selected' : ''}>Ready for QA</option>
                  <option value="QA Testing" ${this.filterStatus === 'QA Testing' ? 'selected' : ''}>QA Testing</option>
                  <option value="Done" ${this.filterStatus === 'Done' ? 'selected' : ''}>Done / Closed</option>
                  <option value="Reopened" ${this.filterStatus === 'Reopened' ? 'selected' : ''}>Reopened</option>
                </select>
                <i data-lucide="chevron-down" class="w-3 h-3 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none"></i>
              </div>

              <!-- 4. Priority Filter Pill -->
              <div class="relative min-w-[120px]">
                <div class="absolute left-2.5 top-2 text-slate-400 pointer-events-none">
                  <i data-lucide="alert-circle" class="w-3.5 h-3.5 ${this.filterPriority !== 'all' ? 'text-indigo-600' : 'text-slate-400'}"></i>
                </div>
                <select 
                  onchange="AllIssuesView.setFilter('priority', this.value)" 
                  class="appearance-none w-full pl-8 pr-7 py-1.5 bg-slate-50 hover:bg-slate-100 border ${this.filterPriority !== 'all' ? 'border-indigo-400 bg-indigo-50/30 text-indigo-900 font-black' : 'border-slate-200 text-slate-700 font-bold'} rounded-xl text-[11px] focus:outline-none focus:ring-2 focus:ring-slate-900/10 cursor-pointer transition shadow-2xs"
                >
                  <option value="all" ${this.filterPriority === 'all' ? 'selected' : ''}>Priority: All</option>
                  <option value="Critical" ${this.filterPriority === 'Critical' ? 'selected' : ''}>● Critical (P0)</option>
                  <option value="High" ${this.filterPriority === 'High' ? 'selected' : ''}>● High (P1)</option>
                  <option value="Medium" ${this.filterPriority === 'Medium' ? 'selected' : ''}>● Medium (P2)</option>
                  <option value="Low" ${this.filterPriority === 'Low' ? 'selected' : ''}>● Low (P3)</option>
                </select>
                <i data-lucide="chevron-down" class="w-3 h-3 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none"></i>
              </div>

              <!-- 5. Unified Assignee / Member Filter Pill -->
              <div class="relative min-w-[130px]">
                <div class="absolute left-2.5 top-2 text-slate-400 pointer-events-none">
                  <i data-lucide="user" class="w-3.5 h-3.5 ${this.filterAssignee !== 'all' ? 'text-indigo-600' : 'text-slate-400'}"></i>
                </div>
                <select 
                  onchange="AllIssuesView.setFilter('assignee', this.value)" 
                  class="appearance-none w-full pl-8 pr-7 py-1.5 bg-slate-50 hover:bg-slate-100 border ${this.filterAssignee !== 'all' ? 'border-indigo-400 bg-indigo-50/30 text-indigo-900 font-black' : 'border-slate-200 text-slate-700 font-bold'} rounded-xl text-[11px] focus:outline-none focus:ring-2 focus:ring-slate-900/10 cursor-pointer transition shadow-2xs"
                >
                  <option value="all" ${this.filterAssignee === 'all' ? 'selected' : ''}>Assignee: All</option>
                  <option value="unassigned" ${this.filterAssignee === 'unassigned' ? 'selected' : ''}>Unassigned</option>
                  ${users.map(u => `
                    <option value="${u.id}" ${this.filterAssignee === u.id ? 'selected' : ''}>
                      ${u.name} (${u.role || 'Member'})
                    </option>
                  `).join("")}
                </select>
                <i data-lucide="chevron-down" class="w-3 h-3 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none"></i>
              </div>

            </div>

            <!-- Scope Telemetry Status -->
            <div class="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
              <span>Matching <strong class="text-slate-900 font-bold">${filteredIssues.length}</strong> of ${scopedPool.length} issues</span>
            </div>

          </div>

        </div>

        <!-- =========================================================================
             4. FLOATING BULK ACTIONS TOOLBAR (Appears when items are selected)
             ========================================================================= -->
        ${this.selectedIssueIds.size > 0 ? `
          <div class="bg-slate-950 text-white p-3.5 rounded-2xl shadow-lg border border-slate-800 flex flex-wrap items-center justify-between gap-3 animate-fade-in text-xs">
            <div class="flex items-center gap-2.5">
              <span class="px-2.5 py-1 rounded-lg bg-[#bef264] text-slate-950 font-black text-xs font-mono shadow-xs">
                ${this.selectedIssueIds.size} Selected
              </span>
              <span class="font-bold text-slate-200">Bulk Operations:</span>
            </div>

            <div class="flex flex-wrap items-center gap-2">
              <!-- Bulk Move Status -->
              <select onchange="AllIssuesView.handleBulkStatusChange(this.value); this.value=''" class="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none cursor-pointer transition">
                <option value="">Update Status...</option>
                <option value="To Do">Move to To Do</option>
                <option value="In Progress">Move to In Progress</option>
                <option value="Ready for QA">Move to Ready for QA</option>
                <option value="Done">Move to Done</option>
              </select>

              <!-- Bulk Move Sprint -->
              <select onchange="AllIssuesView.handleBulkMoveSprint(this.value); this.value=''" class="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none cursor-pointer transition">
                <option value="">Move to Sprint...</option>
                <option value="backlog">Product Backlog</option>
                ${projectSprints.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
              </select>

              <button onclick="AllIssuesView.clearSelection()" class="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold rounded-xl cursor-pointer transition">
                Cancel
              </button>
            </div>
          </div>
        ` : ''}

        <!-- =========================================================================
             5. MASTER ISSUES TABLE (Clean Linear / Jira Data Table)
             ========================================================================= -->
        <div class="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden text-xs">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-slate-700 min-w-[1200px]">
              <thead class="bg-slate-50/90 border-b border-slate-200/80 text-[10px] font-bold uppercase tracking-wider text-slate-400 select-none">
                <tr>
                  <th class="py-3 px-3.5 text-center w-10">
                    <input 
                      type="checkbox" 
                      ${isAllSelected ? 'checked' : ''} 
                      onchange="AllIssuesView.toggleSelectAll(this.checked, ${JSON.stringify(filteredIssues.map(i => i.id)).replace(/"/g, '&quot;')})"
                      class="w-3.5 h-3.5 rounded text-slate-900 border-slate-300 focus:ring-slate-900 cursor-pointer" 
                    />
                  </th>
                  <th class="py-3 px-3 cursor-pointer hover:text-slate-900 transition" onclick="AllIssuesView.setSort('key')">
                    <div class="flex items-center gap-1">
                      <span>Key</span>
                      <i data-lucide="chevrons-up-down" class="w-3 h-3 text-slate-400"></i>
                    </div>
                  </th>
                  <th class="py-3 px-3">Type</th>
                  <th class="py-3 px-4 cursor-pointer hover:text-slate-900 transition min-w-[260px]" onclick="AllIssuesView.setSort('title')">
                    <div class="flex items-center gap-1">
                      <span>Summary & Scope</span>
                      <i data-lucide="chevrons-up-down" class="w-3 h-3 text-slate-400"></i>
                    </div>
                  </th>
                  <th class="py-3 px-3">Project</th>
                  <th class="py-3 px-3">Sprint</th>
                  <th class="py-3 px-3 cursor-pointer hover:text-slate-900 transition" onclick="AllIssuesView.setSort('story_points')">
                    <div class="flex items-center gap-1">
                      <span>SP</span>
                      <i data-lucide="chevrons-up-down" class="w-3 h-3 text-slate-400"></i>
                    </div>
                  </th>
                  <th class="py-3 px-3">Status</th>
                  <th class="py-3 px-3 cursor-pointer hover:text-slate-900 transition" onclick="AllIssuesView.setSort('priority')">
                    <div class="flex items-center gap-1">
                      <span>Priority</span>
                      <i data-lucide="chevrons-up-down" class="w-3 h-3 text-slate-400"></i>
                    </div>
                  </th>
                  <th class="py-3 px-3">QA Quality Gate</th>
                  <th class="py-3 px-3">Assignee</th>
                  <th class="py-3 px-3">QA Lead</th>
                  <th class="py-3 px-3">Env</th>
                  <th class="py-3 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${filteredIssues.length === 0 ? `
                  <tr>
                    <td colspan="14" class="text-center py-16 text-slate-400 space-y-3">
                      <div class="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                        <i data-lucide="search-x" class="w-6 h-6"></i>
                      </div>
                      <div class="space-y-1">
                        <h4 class="font-bold text-slate-800 text-sm">No issues match the selected criteria</h4>
                        <p class="text-xs text-slate-400 max-w-sm mx-auto">Try clearing search filters or switching project scope to view all work items.</p>
                      </div>
                      <button onclick="AllIssuesView.resetFilters()" class="px-4 py-2 bg-slate-950 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition inline-flex items-center gap-2 cursor-pointer shadow-xs">
                        <i data-lucide="rotate-ccw" class="w-3.5 h-3.5 text-[#bef264]"></i> Reset All Filters
                      </button>
                    </td>
                  </tr>
                ` : filteredIssues.map(i => {
                  const proj = store.getProjectById ? store.getProjectById(i.projectId || i.project_id) : null;
                  const devId = i.developerId || i.developer_id || i.assigneeId || i.assignee_id;
                  const dev = (devId && store.getUserById(devId)) || { name: "Unassigned", initials: "UA" };
                  
                  const qaId = i.qaId || i.qa_id;
                  const qa = (qaId && store.getUserById(qaId)) || { name: "Unassigned QA", initials: "QA" };

                  const sprint = (i.sprintId || i.sprint_id) ? store.getSprintById(i.sprintId || i.sprint_id) : null;
                  const storyPoints = Number(i.storyPoints || i.story_points || 0);
                  const isSelected = this.selectedIssueIds.has(i.id);
                  const qaStatus = i.qaStatus || i.qa_status || "Not Tested";

                  return `
                    <tr class="hover:bg-slate-50/90 transition cursor-pointer group ${isSelected ? 'bg-indigo-50/30' : ''}" onclick="window.app.openIssueDetails('${i.id}')">
                      
                      <!-- Checkbox -->
                      <td class="py-3 px-3.5 text-center" onclick="event.stopPropagation()">
                        <input 
                          type="checkbox" 
                          ${isSelected ? 'checked' : ''} 
                          onchange="AllIssuesView.toggleSelectIssue('${i.id}', this.checked)"
                          class="w-3.5 h-3.5 rounded text-slate-900 border-slate-300 focus:ring-slate-900 cursor-pointer" 
                        />
                      </td>

                      <!-- Issue Key -->
                      <td class="py-3 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                        <span class="group-hover:text-indigo-600 transition">${i.key}</span>
                      </td>

                      <!-- Type Badge -->
                      <td class="py-3 px-3 whitespace-nowrap">
                        <span class="px-2 py-0.5 rounded-md font-mono font-bold text-[10px] inline-flex items-center gap-1 ${
                          i.type === 'Bug' || i.type === 'Defect' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 
                          i.type === 'Story' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }">
                          <i data-lucide="${i.type === 'Bug' || i.type === 'Defect' ? 'bug' : i.type === 'Story' ? 'bookmark' : 'check-square'}" class="w-3 h-3"></i>
                          ${i.type}
                        </span>
                      </td>

                      <!-- Summary & Scope -->
                      <td class="py-3 px-4 min-w-[240px] max-w-md">
                        <div class="font-bold text-slate-900 group-hover:text-indigo-600 transition truncate text-xs" title="${i.title}">
                          ${i.title}
                        </div>
                        <div class="flex items-center gap-1.5 mt-1 flex-wrap">
                          ${i.reopenCount > 0 ? `
                            <span class="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-black text-[9px] inline-flex items-center gap-0.5">
                              <i data-lucide="rotate-cw" class="w-2.5 h-2.5"></i> Reopened ${i.reopenCount}x
                            </span>
                          ` : ''}
                          ${(i.labels && Array.isArray(i.labels) ? i.labels : []).map(l => `
                            <span class="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium text-[9px]">${l}</span>
                          `).join('')}
                        </div>
                      </td>

                      <!-- Project -->
                      <td class="py-3 px-3 whitespace-nowrap">
                        <span class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[10px] font-bold border border-slate-200" title="${proj ? proj.name : 'Project'}">
                          ${proj ? proj.key : 'PRJ'}
                        </span>
                      </td>

                      <!-- Sprint -->
                      <td class="py-3 px-3 whitespace-nowrap">
                        ${sprint ? `
                          <span class="px-2 py-0.5 rounded-lg text-[10px] font-bold ${sprint.status === 'active' || sprint.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-700 border border-slate-200'} inline-flex items-center gap-1">
                            <i data-lucide="flag" class="w-3 h-3"></i>
                            <span class="max-w-[90px] truncate">${sprint.name}</span>
                          </span>
                        ` : `
                          <span class="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-400 font-medium text-[10px]">Backlog</span>
                        `}
                      </td>

                      <!-- Story Points -->
                      <td class="py-3 px-3 whitespace-nowrap" onclick="event.stopPropagation()">
                        <select 
                          onchange="AllIssuesView.handleQuickSP('${i.id}', this.value)"
                          class="appearance-none px-2 py-0.5 rounded-md font-mono font-bold text-[10px] cursor-pointer transition focus:outline-none ${storyPoints > 0 ? 'bg-[#bef264] text-slate-950 font-black' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}"
                          title="Story Points"
                        >
                          <option value="0" ${storyPoints === 0 ? 'selected' : ''}>0 SP</option>
                          <option value="1" ${storyPoints === 1 ? 'selected' : ''}>1 SP</option>
                          <option value="2" ${storyPoints === 2 ? 'selected' : ''}>2 SP</option>
                          <option value="3" ${storyPoints === 3 ? 'selected' : ''}>3 SP</option>
                          <option value="5" ${storyPoints === 5 ? 'selected' : ''}>5 SP</option>
                          <option value="8" ${storyPoints === 8 ? 'selected' : ''}>8 SP</option>
                          <option value="13" ${storyPoints === 13 ? 'selected' : ''}>13 SP</option>
                        </select>
                      </td>

                      <!-- Workflow Status -->
                      <td class="py-3 px-3 whitespace-nowrap">
                        <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1.5 ${
                          i.status === 'Done' || i.status === 'Closed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          i.status === 'In Progress' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                          i.status === 'Ready for QA' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                          i.status === 'QA Testing' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                          'bg-slate-100 text-slate-600 border border-slate-200'
                        }">
                          <span class="w-1.5 h-1.5 rounded-full ${
                            i.status === 'Done' || i.status === 'Closed' ? 'bg-emerald-500' :
                            i.status === 'In Progress' ? 'bg-amber-500' :
                            i.status === 'Ready for QA' ? 'bg-purple-500' :
                            i.status === 'QA Testing' ? 'bg-indigo-500' : 'bg-slate-400'
                          }"></span>
                          ${i.status}
                        </span>
                      </td>

                      <!-- Priority -->
                      <td class="py-3 px-3 whitespace-nowrap">
                        <span class="px-2 py-0.5 rounded-md text-[10px] font-bold inline-flex items-center gap-1 ${
                          i.priority === 'Critical' ? 'bg-rose-100 text-rose-800' :
                          i.priority === 'High' ? 'bg-amber-100 text-amber-800' :
                          'bg-slate-100 text-slate-600'
                        }">
                          <span class="w-1.5 h-1.5 rounded-full ${
                            i.priority === 'Critical' ? 'bg-rose-600' :
                            i.priority === 'High' ? 'bg-amber-600' : 'bg-slate-400'
                          }"></span>
                          ${i.priority}
                        </span>
                      </td>

                      <!-- QA Quality Gate -->
                      <td class="py-3 px-3 whitespace-nowrap">
                        <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                          qaStatus === 'Passed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          qaStatus === 'Failed' || i.status === 'Reopened' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                          qaStatus === 'Ready for QA' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                          qaStatus === 'Testing' || qaStatus === 'QA Testing' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                          'bg-slate-100 text-slate-600'
                        }">
                          ${qaStatus === 'Passed' ? '✓ Passed' : (qaStatus === 'Failed' || i.status === 'Reopened') ? '✕ QA Failed' : qaStatus}
                        </span>
                      </td>

                      <!-- Assignee (Dev) -->
                      <td class="py-3 px-3 whitespace-nowrap">
                        <div class="flex items-center gap-1.5">
                          <span class="w-5 h-5 rounded-full bg-slate-900 text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                            ${dev.initials || 'D'}
                          </span>
                          <span class="font-medium text-slate-700 text-xs">${(dev.name || 'Unassigned').split(" ")[0]}</span>
                        </div>
                      </td>

                      <!-- QA Lead -->
                      <td class="py-3 px-3 whitespace-nowrap">
                        <div class="flex items-center gap-1.5">
                          <span class="w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-[9px] font-bold flex items-center justify-center shrink-0 border border-purple-200">
                            ${qa.initials || 'QA'}
                          </span>
                          <span class="font-semibold text-purple-700 text-xs">${(qa.name || 'QA').split(" ")[0]}</span>
                        </div>
                      </td>

                      <!-- Environment -->
                      <td class="py-3 px-3 whitespace-nowrap text-[11px] text-slate-500 font-mono">
                        <span>${i.environment || 'Staging'}</span>
                      </td>

                      <!-- Actions -->
                      <td class="py-3 px-3.5 text-right whitespace-nowrap" onclick="event.stopPropagation()">
                        <button onclick="window.app.openIssueDetails('${i.id}')" class="px-2.5 py-1 bg-slate-100 hover:bg-slate-950 hover:text-[#bef264] text-slate-700 rounded-lg font-bold text-[10px] transition cursor-pointer">
                          Inspect →
                        </button>
                      </td>

                    </tr>
                  `;
                }).join("")}
              </tbody>
            </table>
          </div>

          <!-- Table Footer Pagination / Count Info -->
          <div class="p-3.5 bg-slate-50/90 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
            <div>
              Showing <strong class="text-slate-900 font-bold">${filteredIssues.length}</strong> of <strong class="text-slate-900 font-bold">${scopedPool.length}</strong> total work items in <strong class="text-slate-900">${scopeLabel}</strong>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-[11px] text-slate-400">PulseWave Enterprise QA Repository</span>
            </div>
          </div>

        </div>

      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  filterAndSortIssues(issues, activeUser) {
    return issues.filter(i => {
      // 1. Search Query Filter
      if (this.searchQuery && this.searchQuery.trim() !== '') {
        const q = this.searchQuery.toLowerCase().trim();
        const titleMatch = (i.title || "").toLowerCase().includes(q);
        const keyMatch = (i.key || "").toLowerCase().includes(q);
        const descMatch = (i.description || "").toLowerCase().includes(q);
        const envMatch = (i.environment || "").toLowerCase().includes(q);
        const buildMatch = (i.buildVersion || "").toLowerCase().includes(q);
        
        const dev = store.getUserById ? store.getUserById(i.developerId || i.developer_id || i.assigneeId || i.assignee_id) : null;
        const devMatch = dev && dev.name && dev.name.toLowerCase().includes(q);

        const qa = store.getUserById ? store.getUserById(i.qaId || i.qa_id) : null;
        const qaMatch = qa && qa.name && qa.name.toLowerCase().includes(q);

        const labelsMatch = Array.isArray(i.labels) && i.labels.some(l => l.toLowerCase().includes(q));

        if (!titleMatch && !keyMatch && !descMatch && !envMatch && !buildMatch && !devMatch && !qaMatch && !labelsMatch) {
          return false;
        }
      }

      // 2. Project Filter (Selected Project Scope)
      if (this.filterProject !== "all") {
        const pId = i.projectId || i.project_id;
        if (pId !== this.filterProject) return false;
      }

      // 3. Saved View Specific Filters (Smart Presets)
      if (this.activeSavedView === "my_issues" && activeUser) {
        const devId = i.developerId || i.developer_id || i.assigneeId || i.assignee_id;
        const qaId = i.qaId || i.qa_id;
        if (devId !== activeUser.id && qaId !== activeUser.id) return false;
      } else if (this.activeSavedView === "open_bugs") {
        const isBug = i.type === "Bug" || i.type === "Defect";
        const isOpen = i.status !== "Done" && i.status !== "Closed";
        if (!isBug || !isOpen) return false;
      } else if (this.activeSavedView === "ready_for_qa") {
        const isReady = i.status === "Ready for QA" || i.status === "Fixed" || i.qaStatus === "Ready for QA";
        if (!isReady) return false;
      } else if (this.activeSavedView === "reopened") {
        const isReopenedOrFailed = i.status === "Reopened" || i.status === "QA Failed" || i.qaStatus === "Failed" || (i.reopenCount && i.reopenCount > 0);
        if (!isReopenedOrFailed) return false;
      } else if (this.activeSavedView === "active_sprint") {
        const inDev = i.status === "In Progress" || i.status === "In Development";
        if (!inDev) return false;
      } else if (this.activeSavedView === "unestimated") {
        const sp = Number(i.storyPoints || i.story_points || 0);
        if (sp > 0) return false;
      }

      // 4. Sprint Filter
      if (this.filterSprint !== "all") {
        const sId = i.sprintId || i.sprint_id;
        if (this.filterSprint === "backlog" && sId) return false;
        if (this.filterSprint !== "backlog" && sId !== this.filterSprint) return false;
      }

      // 5. Type Filter
      if (this.filterType !== "all") {
        if (this.filterType === "Bug" && i.type !== "Bug" && i.type !== "Defect") return false;
        if (this.filterType === "Story" && i.type !== "Story" && i.type !== "User Story") return false;
        if (this.filterType === "Task" && i.type !== "Task") return false;
      }

      // 6. Priority Filter
      if (this.filterPriority !== "all" && i.priority !== this.filterPriority) return false;

      // 7. Status Filter (Forgiving matching for enterprise synonyms)
      if (this.filterStatus !== "all") {
        if (this.filterStatus === "Backlog" && (i.status !== "Backlog" && i.status !== "Open")) return false;
        if (this.filterStatus === "To Do" && (i.status !== "To Do" && i.status !== "Open")) return false;
        if (this.filterStatus === "In Progress" && (i.status !== "In Progress" && i.status !== "In Development")) return false;
        if (this.filterStatus === "Ready for QA" && (i.status !== "Ready for QA" && i.status !== "Fixed" && i.qaStatus !== "Ready for QA")) return false;
        if (this.filterStatus === "QA Testing" && (i.status !== "QA Testing" && i.status !== "QA" && i.qaStatus !== "Testing")) return false;
        if (this.filterStatus === "Done" && (i.status !== "Done" && i.status !== "Closed" && i.qaStatus !== "Passed")) return false;
        if (this.filterStatus === "Reopened" && (i.status !== "Reopened" && i.status !== "QA Failed" && i.qaStatus !== "Failed" && (!i.reopenCount || i.reopenCount === 0))) return false;
      }

      // 8. Unified Assignee Filter (Dev or QA)
      if (this.filterAssignee !== "all") {
        const devId = i.developerId || i.developer_id || i.assigneeId || i.assignee_id;
        const qaId = i.qaId || i.qa_id;
        if (this.filterAssignee === "unassigned") {
          if (devId || qaId) return false;
        } else {
          if (devId !== this.filterAssignee && qaId !== this.filterAssignee) return false;
        }
      }

      // 9. Developer Filter (Backwards compatibility)
      if (this.filterDeveloper !== "all") {
        const devId = i.developerId || i.developer_id || i.assigneeId || i.assignee_id;
        if (devId !== this.filterDeveloper) return false;
      }

      // 10. QA Filter (Backwards compatibility)
      if (this.filterQA !== "all") {
        const qaId = i.qaId || i.qa_id;
        if (qaId !== this.filterQA) return false;
      }

      // 11. Environment Filter
      if (this.filterEnvironment !== "all" && i.environment !== this.filterEnvironment) return false;

      // 12. Quality Gate Filter (Backwards compatibility)
      if (this.filterQualityGate !== "all") {
        const isPassed = i.qaStatus === 'Passed' || ((i.status === 'Done' || i.status === 'Closed') && i.type !== 'Bug');
        const isFailed = i.qaStatus === 'Failed' || i.status === 'Reopened' || i.status === 'QA Failed' || (i.reopenCount && i.reopenCount > 0);
        if (this.filterQualityGate === "passed" && !isPassed) return false;
        if (this.filterQualityGate === "failed" && !isFailed) return false;
        if (this.filterQualityGate === "pending" && (isPassed || isFailed)) return false;
      }

      return true;
    }).sort((a, b) => {
      if (this.sortBy === "key") return a.key.localeCompare(b.key);
      if (this.sortBy === "priority") {
        const score = { "Critical": 4, "High": 3, "Medium": 2, "Low": 1 };
        return (score[b.priority] || 0) - (score[a.priority] || 0);
      }
      if (this.sortBy === "story_points") {
        const spA = Number(a.storyPoints || a.story_points || 0);
        const spB = Number(b.storyPoints || b.story_points || 0);
        return spB - spA;
      }
      if (this.sortBy === "reopen") return (b.reopenCount || 0) - (a.reopenCount || 0);
      if (this.sortBy === "title") return (a.title || "").localeCompare(b.title || "");
      
      // Default: updated or created timestamp
      return new Date(b.updatedAt || b.updated_at || b.createdAt || b.created_at || 0) - new Date(a.updatedAt || a.updated_at || a.createdAt || a.created_at || 0);
    });
  },

  applySavedView(view) {
    this.activeSavedView = view;
    // Clear individual conflicting filter dropdowns when switching saved views
    this.filterStatus = "all";
    this.filterType = "all";
    this.filterQualityGate = "all";
    this.selectedIssueIds.clear();

    const container = document.getElementById("mainContent") || document.querySelector("main");
    if (container) this.render(container);
  },

  setFilter(type, value) {
    if (type === "project") {
      this.filterProject = value;
      // Reset sprint filter when project changes
      this.filterSprint = "all";
    }
    if (type === "sprint") this.filterSprint = value;
    if (type === "type") this.filterType = value;
    if (type === "priority") this.filterPriority = value;
    if (type === "status") this.filterStatus = value;
    if (type === "assignee") this.filterAssignee = value;
    if (type === "developer") this.filterDeveloper = value;
    if (type === "qa") this.filterQA = value;
    if (type === "environment") this.filterEnvironment = value;
    if (type === "qualityGate") this.filterQualityGate = value;

    // Custom filtering disengages preset saved view
    if (type !== "project" && value !== "all") {
      this.activeSavedView = "all";
    }

    const container = document.getElementById("mainContent") || document.querySelector("main");
    if (container) this.render(container);
  },

  setSort(value) {
    this.sortBy = value;
    const container = document.getElementById("mainContent") || document.querySelector("main");
    if (container) this.render(container);
  },

  handleSearch(value) {
    this.searchQuery = value;
    const container = document.getElementById("mainContent") || document.querySelector("main");
    if (container) this.render(container);
  },

  toggleSelectIssue(issueId, isChecked) {
    if (isChecked) {
      this.selectedIssueIds.add(issueId);
    } else {
      this.selectedIssueIds.delete(issueId);
    }
    const container = document.getElementById("mainContent") || document.querySelector("main");
    if (container) this.render(container);
  },

  toggleSelectAll(isChecked, issueIds) {
    if (isChecked) {
      issueIds.forEach(id => this.selectedIssueIds.add(id));
    } else {
      this.selectedIssueIds.clear();
    }
    const container = document.getElementById("mainContent") || document.querySelector("main");
    if (container) this.render(container);
  },

  clearSelection() {
    this.selectedIssueIds.clear();
    const container = document.getElementById("mainContent") || document.querySelector("main");
    if (container) this.render(container);
  },

  async handleQuickSP(issueId, points) {
    if (store.quickUpdateStoryPoints) {
      await store.quickUpdateStoryPoints(issueId, points);
    } else if (store.updateIssue) {
      await store.updateIssue(issueId, { storyPoints: Number(points), story_points: Number(points) });
    }
    if (window.app && window.app.toast) {
      window.app.toast("Points Updated", `Set Story Points to ${points} SP`, "info");
    }
    const container = document.getElementById("mainContent") || document.querySelector("main");
    if (container) this.render(container);
  },

  async handleBulkStatusChange(status) {
    if (!status) return;
    const ids = Array.from(this.selectedIssueIds);
    if (ids.length === 0) return;

    for (const id of ids) {
      await store.updateIssue(id, { status });
    }

    if (window.app && window.app.toast) {
      window.app.toast("Bulk Status Updated", `Updated ${ids.length} issues to "${status}"`, "success");
    }

    this.selectedIssueIds.clear();
    const container = document.getElementById("mainContent") || document.querySelector("main");
    if (container) this.render(container);
  },

  async handleBulkMoveSprint(sprintId) {
    if (!sprintId) return;
    const ids = Array.from(this.selectedIssueIds);
    if (ids.length === 0) return;

    const targetSprintId = sprintId === "backlog" ? null : sprintId;
    if (store.bulkMoveIssuesToSprint) {
      await store.bulkMoveIssuesToSprint(ids, targetSprintId);
    } else {
      for (const id of ids) {
        await store.moveIssueToSprint(id, targetSprintId);
      }
    }

    const sprintName = targetSprintId ? (store.getSprintById(targetSprintId)?.name || "Sprint") : "Product Backlog";
    if (window.app && window.app.toast) {
      window.app.toast("Bulk Sprint Updated", `Moved ${ids.length} tickets to ${sprintName}`, "success");
    }

    this.selectedIssueIds.clear();
    const container = document.getElementById("mainContent") || document.querySelector("main");
    if (container) this.render(container);
  },

  exportCSV() {
    const issues = store.getIssues ? store.getIssues() : [];
    const filtered = this.filterAndSortIssues(issues, store.getActiveUser ? store.getActiveUser() : null);

    let csv = "Key,Type,Title,Project,Sprint,Story Points,Status,Priority,QA Status,Developer,QA Lead,Environment,Build,Created At\n";
    filtered.forEach(i => {
      const proj = store.getProjectById ? store.getProjectById(i.projectId || i.project_id) : null;
      const sprint = (i.sprintId || i.sprint_id) ? (store.getSprintById ? store.getSprintById(i.sprintId || i.sprint_id) : null) : null;
      const dev = store.getUserById ? store.getUserById(i.developerId || i.assigneeId) : null;
      const qa = store.getUserById ? store.getUserById(i.qaId) : null;

      const row = [
        `"${i.key || ''}"`,
        `"${i.type || 'Task'}"`,
        `"${(i.title || '').replace(/"/g, '""')}"`,
        `"${proj ? proj.name : ''}"`,
        `"${sprint ? sprint.name : 'Backlog'}"`,
        `"${i.storyPoints || i.story_points || 0}"`,
        `"${i.status || ''}"`,
        `"${i.priority || ''}"`,
        `"${i.qaStatus || ''}"`,
        `"${dev ? dev.name : 'Unassigned'}"`,
        `"${qa ? qa.name : 'Unassigned QA'}"`,
        `"${i.environment || 'Staging'}"`,
        `"${i.buildVersion || ''}"`,
        `"${i.createdAt || i.created_at || ''}"`
      ];
      csv += row.join(",") + "\n";
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `pulsewave_all_issues_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (window.app && window.app.toast) {
      window.app.toast("CSV Exported", `Exported ${filtered.length} issues to CSV`, "success");
    }
  },

  resetFilters(shouldRender = true) {
    this.searchQuery = "";
    this.filterProject = "all";
    this.filterType = "all";
    this.filterPriority = "all";
    this.filterStatus = "all";
    this.filterAssignee = "all";
    this.filterDeveloper = "all";
    this.filterQA = "all";
    this.filterSprint = "all";
    this.filterEnvironment = "all";
    this.filterQualityGate = "all";
    this.activeSavedView = "all";
    this.sortBy = "updated";
    this.selectedIssueIds.clear();

    if (shouldRender) {
      const container = document.getElementById("mainContent") || document.querySelector("main");
      if (container) this.render(container);
    }
  }
};

if (typeof window !== "undefined") window.AllIssuesView = AllIssuesView;
if (typeof global !== "undefined") global.AllIssuesView = AllIssuesView;
if (typeof module !== "undefined" && module.exports) module.exports = AllIssuesView;
