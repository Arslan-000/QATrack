const ProjectsView = {
  searchQuery: "",
  statusFilter: "all",
  priorityFilter: "all",
  selectedProjectFilter: "all",
  pmFilter: "all",
  sortBy: "key",
  sortAsc: true,
  viewMode: "table", // 'table' or 'grid'

  // Animation frame tracker
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

  render(container) {
    this.destroyAnimationLoops();

    const allProjects = store.getProjects() || [];
    const activeProject = store.getActiveProject();
    const canCreateProject = store.canCreateProject();

    // Filter projects based on active criteria
    let filtered = allProjects.filter(p => {
      // Direct project selector filter
      if (this.selectedProjectFilter !== "all" && p.id !== this.selectedProjectFilter) {
        return false;
      }

      // Status filter
      if (this.statusFilter !== "all" && p.status !== this.statusFilter) {
        return false;
      }

      // Priority filter
      const pPriority = p.priority || "P1";
      if (this.priorityFilter !== "all" && pPriority !== this.priorityFilter) {
        return false;
      }

      // PM filter
      if (this.pmFilter !== "all" && p.pmId !== this.pmFilter) {
        return false;
      }

      // Search query (handles name, key, description, customer, pm, category)
      if (this.searchQuery.trim()) {
        const q = this.searchQuery.toLowerCase().trim();
        const name = (p.name || "").toLowerCase();
        const key = (p.key || "").toLowerCase();
        const desc = (p.description || "").toLowerCase();
        const customer = (p.customer || "").toLowerCase();
        const category = (p.category || "").toLowerCase();
        const pmUser = store.getUserById ? store.getUserById(p.pmId) : null;
        const pm = (pmUser ? pmUser.name : (p.pmId || "")).toLowerCase();
        return name.includes(q) || key.includes(q) || desc.includes(q) || customer.includes(q) || category.includes(q) || pm.includes(q);
      }

      return true;
    });

    // Sort projects
    filtered.sort((a, b) => {
      let valA, valB;
      if (this.sortBy === "key") {
        valA = a.key || "";
        valB = b.key || "";
      } else if (this.sortBy === "name") {
        valA = a.name || "";
        valB = b.name || "";
      } else if (this.sortBy === "status") {
        valA = a.status || "";
        valB = b.status || "";
      } else if (this.sortBy === "priority") {
        valA = a.priority || "P1";
        valB = b.priority || "P1";
      } else if (this.sortBy === "due") {
        valA = a.dueDate || a.endDate || "";
        valB = b.dueDate || b.endDate || "";
      } else if (this.sortBy === "progress") {
        valA = store.getProjectStats(a.id)?.progressPct || 0;
        valB = store.getProjectStats(b.id)?.progressPct || 0;
      } else {
        valA = a.key || "";
        valB = b.key || "";
      }

      if (valA < valB) return this.sortAsc ? -1 : 1;
      if (valA > valB) return this.sortAsc ? 1 : -1;
      return 0;
    });

    // Real-Time Dynamic Metrics strictly derived from the filtered view
    const totalFiltered = filtered.length;
    const totalAll = allProjects.length;
    const hasActiveFilters = this.searchQuery.trim() !== "" || this.statusFilter !== "all" || this.priorityFilter !== "all" || this.selectedProjectFilter !== "all" || this.pmFilter !== "all";

    const activeCount = filtered.filter(p => p.status === "Active").length;
    const planningCount = filtered.filter(p => p.status === "Planning").length;
    const completedCount = filtered.filter(p => p.status === "Completed").length;

    const avgProgress = totalFiltered > 0
      ? Math.round(filtered.reduce((sum, p) => sum + (store.getProjectStats(p.id)?.progressPct || 0), 0) / totalFiltered)
      : 0;

    // Real aggregate issues & unique member count across filtered projects
    let totalFilteredIssues = 0;
    let completedFilteredIssues = 0;
    let totalBugs = 0;
    let criticalDefects = 0;
    const uniqueMemberIds = new Set();

    filtered.forEach(p => {
      const pStats = store.getProjectStats(p.id);
      totalFilteredIssues += pStats.total || 0;
      completedFilteredIssues += pStats.completed || 0;

      if (p.pmId) uniqueMemberIds.add(p.pmId);
      (p.members || []).forEach(m => uniqueMemberIds.add(m));

      const pIssues = store.getIssues(p.id) || [];
      pIssues.forEach(i => {
        if (i.assigneeId || i.assignee_id) uniqueMemberIds.add(i.assigneeId || i.assignee_id);
        if (i.type === "Bug" && i.status !== "Done" && i.status !== "Closed") {
          totalBugs++;
          if (i.priority === "Critical" || i.priority === "P0" || i.priority === "P1") {
            criticalDefects++;
          }
        }
      });
    });

    const totalMembers = uniqueMemberIds.size > 0 ? uniqueMemberIds.size : (totalFiltered > 0 ? 1 : 0);

    container.innerHTML = `
      <div class="space-y-6 animate-fade-in pb-12">
        
        <!-- =========================================================================
             1. SLEEK MODERN HERO HEADER WITH STREAMLINED SEARCH & FILTER TOOLBAR
             ========================================================================= -->
        <div class="relative bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden p-5 sm:p-6 space-y-4">
          
          <!-- Hidden canvas hook to preserve background initializer compatibility -->
          <canvas id="projectRegisterLatticeCanvas" class="hidden" width="10" height="10"></canvas>

          <!-- Top Row: Title, Subtitle, and Create Project Button -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div class="flex items-center gap-2.5">
                <h1 class="text-2xl font-black text-slate-950 tracking-tight">Project Register</h1>
                <span class="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-[#f7fee7] text-[#4d7c0f] border border-[#d9f99d]">
                  ${totalAll} Workspaces
                </span>
              </div>
              <p class="text-xs text-slate-500 mt-1 font-medium">Central register of enterprise workspaces, customer assignments, progress, and release delivery.</p>
            </div>

            ${canCreateProject ? `
              <button onclick="ProjectsView.openCreateProjectModal()" class="px-4 py-2 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 rounded-xl text-xs font-black shadow-xs shadow-[#bef264]/25 hover:shadow transition flex items-center gap-1.5 self-start sm:self-auto shrink-0 cursor-pointer">
                <i data-lucide="plus" class="w-4 h-4 text-slate-950"></i>
                <span>Create Project</span>
              </button>
            ` : ''}
          </div>

          <!-- Streamlined Filter & Search Bar -->
          <div class="pt-3 border-t border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            
            <!-- Left: Search Box -->
            <div class="relative flex-1 min-w-[240px] max-w-md">
              <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none"></i>
              <input
                type="text"
                value="${this.searchQuery}"
                oninput="ProjectsView.handleSearch(this.value)"
                placeholder="Search projects by key, name, customer, lead..."
                class="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200/90 rounded-xl text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none transition font-medium shadow-2xs"
              />
              ${this.searchQuery ? `
                <button onclick="ProjectsView.handleSearch('')" class="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer">
                  <i data-lucide="x" class="w-3.5 h-3.5"></i>
                </button>
              ` : ''}
            </div>

            <!-- Right: Dropdown Filters & View Switcher -->
            <div class="flex flex-wrap items-center gap-2 text-xs">
              
              <!-- Select Project Dropdown -->
              <div class="flex items-center gap-1.5 bg-slate-50 border border-slate-200/90 rounded-xl px-2.5 py-1.5 shadow-2xs">
                <span class="text-[10px] font-bold text-slate-400 uppercase hidden lg:inline">SELECT PROJECT:</span>
                <select
                  onchange="ProjectsView.handleProjectSelect(this.value)"
                  class="bg-transparent font-bold text-slate-700 text-xs focus:outline-none cursor-pointer max-w-[150px] truncate"
                >
                  <option value="all" ${this.selectedProjectFilter === 'all' ? 'selected' : ''}>All Projects (${allProjects.length})</option>
                  ${allProjects.map(p => `
                    <option value="${p.id}" ${this.selectedProjectFilter === p.id ? 'selected' : ''}>
                      ${p.key} - ${p.name}
                    </option>
                  `).join("")}
                </select>
              </div>

              <!-- Status Filter -->
              <select
                onchange="ProjectsView.handleStatusFilter(this.value)"
                class="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200/90 rounded-xl font-bold text-slate-700 text-xs focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none cursor-pointer shadow-2xs transition ${this.statusFilter !== 'all' ? 'ring-2 ring-slate-950 bg-slate-950 text-[#bef264]' : ''}"
              >
                <option value="all" ${this.statusFilter === 'all' ? 'selected' : ''}>All Statuses</option>
                <option value="Active" ${this.statusFilter === 'Active' ? 'selected' : ''}>Active (${allProjects.filter(p => p.status === 'Active').length})</option>
                <option value="Planning" ${this.statusFilter === 'Planning' ? 'selected' : ''}>Planning (${allProjects.filter(p => p.status === 'Planning').length})</option>
                <option value="In Review" ${this.statusFilter === 'In Review' ? 'selected' : ''}>In Review (${allProjects.filter(p => p.status === 'In Review').length})</option>
                <option value="On Hold" ${this.statusFilter === 'On Hold' ? 'selected' : ''}>On Hold (${allProjects.filter(p => p.status === 'On Hold').length})</option>
                <option value="Completed" ${this.statusFilter === 'Completed' ? 'selected' : ''}>Completed (${allProjects.filter(p => p.status === 'Completed').length})</option>
              </select>

              <!-- Priority Filter -->
              <select
                onchange="ProjectsView.handlePriorityFilter(this.value)"
                class="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200/90 rounded-xl font-bold text-slate-700 text-xs focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none cursor-pointer shadow-2xs transition ${this.priorityFilter !== 'all' ? 'ring-2 ring-slate-950 bg-slate-950 text-[#bef264]' : ''}"
              >
                <option value="all" ${this.priorityFilter === 'all' ? 'selected' : ''}>All Priorities</option>
                <option value="P0" ${this.priorityFilter === 'P0' ? 'selected' : ''}>P0 (Critical / Blocker)</option>
                <option value="P1" ${this.priorityFilter === 'P1' ? 'selected' : ''}>P1 (High Priority)</option>
                <option value="P2" ${this.priorityFilter === 'P2' ? 'selected' : ''}>P2 (Medium)</option>
                <option value="P3" ${this.priorityFilter === 'P3' ? 'selected' : ''}>P3 (Low)</option>
              </select>

              <!-- View Mode Toggle (Table / Bento Grid) -->
              <div class="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 shadow-2xs">
                <button
                  onclick="ProjectsView.toggleViewMode('table')"
                  class="p-1.5 rounded-lg transition cursor-pointer ${this.viewMode === 'table' ? 'bg-white text-slate-950 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'}"
                  title="Table View"
                >
                  <i data-lucide="list" class="w-3.5 h-3.5"></i>
                </button>
                <button
                  onclick="ProjectsView.toggleViewMode('grid')"
                  class="p-1.5 rounded-lg transition cursor-pointer ${this.viewMode === 'grid' ? 'bg-white text-slate-950 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'}"
                  title="3D Bento Grid View"
                >
                  <i data-lucide="layout-grid" class="w-3.5 h-3.5"></i>
                </button>
              </div>

              <!-- Reset Filters button -->
              ${hasActiveFilters ? `
                <button
                  onclick="ProjectsView.resetFilters()"
                  class="p-2 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/80 border border-rose-200 rounded-xl transition cursor-pointer shadow-2xs"
                  title="Reset all active filters"
                >
                  <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>
                </button>
              ` : ''}

            </div>

          </div>

        </div>

        <!-- =========================================================================
             2. REDESIGNED 4 HIGH-AESTHETIC METRIC KPI CARDS
             ========================================================================= -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          
          <!-- Bento 1: TOTAL PROJECTS -->
          <div
            onclick="ProjectsView.resetFilters()"
            class="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 cursor-pointer group flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            title="Click to view all projects"
          >
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-black uppercase tracking-wider text-slate-400 group-hover:text-slate-950 transition">TOTAL PROJECTS</span>
              <div class="w-8 h-8 rounded-xl bg-slate-950 text-[#bef264] flex items-center justify-center shrink-0 shadow-2xs">
                <i data-lucide="folder-kanban" class="w-4 h-4"></i>
              </div>
            </div>
            <div class="mt-3 space-y-1">
              <div class="text-3xl font-black text-slate-950 font-mono tracking-tight">${totalFiltered}</div>
              <div class="text-[11px] text-slate-500 font-medium">
                ${hasActiveFilters ? `
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#f7fee7] text-[#4d7c0f] font-bold text-[10px] border border-[#d9f99d]">
                    Filtered (${totalAll} Total)
                  </span>
                ` : `
                  <span class="inline-flex items-center gap-1.5 text-slate-500">
                    <span class="w-1.5 h-1.5 rounded-full bg-[#84cc16]"></span>
                    <span>${totalAll} registered in space</span>
                  </span>
                `}
              </div>
            </div>
          </div>

          <!-- Bento 2: ACTIVE -->
          <div
            onclick="ProjectsView.handleStatusFilter('${this.statusFilter === 'Active' ? 'all' : 'Active'}')"
            class="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 cursor-pointer group flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            title="Click to filter by Active status"
          >
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-black uppercase tracking-wider text-slate-400 group-hover:text-emerald-600 transition">ACTIVE</span>
              <div class="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                <i data-lucide="activity" class="w-4 h-4"></i>
              </div>
            </div>
            <div class="mt-3 space-y-1">
              <div class="text-3xl font-black text-slate-950 font-mono tracking-tight">${activeCount}</div>
              <div class="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full ${activeCount > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}"></span>
                <span>${planningCount} Planning · ${completedCount} Done</span>
              </div>
            </div>
          </div>

          <!-- Bento 3: AVG. PROGRESS -->
          <div
            onclick="ProjectsView.toggleSort('progress')"
            class="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 cursor-pointer group flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            title="Click to sort by delivery progress"
          >
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-black uppercase tracking-wider text-slate-400 group-hover:text-purple-600 transition">AVG. PROGRESS</span>
              <div class="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0">
                <i data-lucide="trending-up" class="w-4 h-4"></i>
              </div>
            </div>
            <div class="mt-3 space-y-2">
              <div class="text-3xl font-black text-slate-950 font-mono tracking-tight">${avgProgress}%</div>
              <div class="space-y-1.5">
                <div class="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div class="h-full bg-gradient-to-r from-slate-900 to-[#84cc16] rounded-full transition-all duration-500" style="width: ${avgProgress}%"></div>
                </div>
                <div class="text-[10px] text-slate-500 font-medium flex items-center justify-between">
                  <span>${completedFilteredIssues}/${totalFilteredIssues} Tickets</span>
                  <span class="font-semibold text-purple-600">${totalFiltered > 0 ? 'Avg Complete' : 'No Data'}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Bento 4: TEAM ALLOCATION -->
          <div
            onclick="ProjectsView.handlePriorityFilter('${this.priorityFilter === 'P1' ? 'all' : 'P1'}')"
            class="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 cursor-pointer group flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            title="Click to filter by high priority projects"
          >
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-black uppercase tracking-wider text-slate-400 group-hover:text-cyan-600 transition">TEAM ALLOCATION</span>
              <div class="w-8 h-8 rounded-xl ${criticalDefects > 0 ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-cyan-50 text-cyan-600 border border-cyan-100'} flex items-center justify-center shrink-0">
                <i data-lucide="users" class="w-4 h-4"></i>
              </div>
            </div>
            <div class="mt-3 space-y-1">
              <div class="text-3xl font-black text-slate-950 font-mono tracking-tight">${totalMembers}</div>
              <div class="text-[11px] font-medium">
                ${criticalDefects > 0 ? `
                  <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200/80 font-bold text-[10px]">
                    <span class="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                    <span>${criticalDefects} Critical Defect${criticalDefects > 1 ? 's' : ''}</span>
                  </span>
                ` : (totalBugs > 0 ? `
                  <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/80 font-bold text-[10px]">
                    <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    <span>${totalBugs} Open Defect${totalBugs > 1 ? 's' : ''}</span>
                  </span>
                ` : `
                  <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-bold text-[10px]">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>Zero Open Defects</span>
                  </span>
                `)}
              </div>
            </div>
          </div>

        </div>

        <!-- =========================================================================
             3. ALL PROJECTS REGISTER VIEW (Table or 3D Bento Grid)
             ========================================================================= -->
        <div class="space-y-3.5">
          
          <div class="flex items-center justify-between pt-1">
            <div class="flex items-center gap-2">
              <h2 class="text-xs font-bold uppercase tracking-wider text-slate-900">ALL PROJECTS</h2>
              <span class="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-mono font-bold border border-slate-200/60">
                ${filtered.length} of ${allProjects.length}
              </span>
            </div>

            ${this.selectedProjectFilter !== 'all' ? `
              <button onclick="window.app.openProjectWorkspace('${this.selectedProjectFilter}')" class="text-xs font-bold text-slate-950 hover:text-[#4d7c0f] hover:underline flex items-center gap-1 cursor-pointer">
                <span>Open Selected Workspace</span>
                <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
              </button>
            ` : ''}
          </div>

          ${this.viewMode === 'grid' ? this.renderGridView(filtered, activeProject) : this.renderTableView(filtered, activeProject, hasActiveFilters)}

        </div>

        <!-- Modal Container -->
        <div id="projectModalContainer"></div>
      </div>
    `;

    setTimeout(() => {
      this.initRegister3DCanvas();
    }, 40);

    if (window.lucide) window.lucide.createIcons();
  },

  // =========================================================================
  // VIEW MODE A: CRISP TABLE VIEW (Matching Screenshot)
  // =========================================================================
  renderTableView(filtered, activeProject, hasActiveFilters) {
    return `
      <div class="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th class="py-3.5 px-4 cursor-pointer hover:text-slate-800 transition" onclick="ProjectsView.toggleSort('key')">
                  <div class="flex items-center gap-1">
                    <span>KEY</span>
                    ${this.sortBy === 'key' ? `<i data-lucide="${this.sortAsc ? 'chevron-up' : 'chevron-down'}" class="w-3 h-3 text-slate-950"></i>` : ''}
                  </div>
                </th>
                <th class="py-3.5 px-4 cursor-pointer hover:text-slate-800 transition min-w-[240px]" onclick="ProjectsView.toggleSort('name')">
                  <div class="flex items-center gap-1">
                    <span>PROJECT</span>
                    ${this.sortBy === 'name' ? `<i data-lucide="${this.sortAsc ? 'chevron-up' : 'chevron-down'}" class="w-3 h-3 text-slate-950"></i>` : ''}
                  </div>
                </th>
                <th class="py-3.5 px-4 min-w-[130px]">CUSTOMER</th>
                <th class="py-3.5 px-4 min-w-[120px]">PM</th>
                <th class="py-3.5 px-4 cursor-pointer hover:text-slate-800 transition" onclick="ProjectsView.toggleSort('priority')">
                  <div class="flex items-center gap-1">
                    <span>PRIORITY</span>
                    ${this.sortBy === 'priority' ? `<i data-lucide="${this.sortAsc ? 'chevron-up' : 'chevron-down'}" class="w-3 h-3 text-slate-950"></i>` : ''}
                  </div>
                </th>
                <th class="py-3.5 px-4 cursor-pointer hover:text-slate-800 transition" onclick="ProjectsView.toggleSort('status')">
                  <div class="flex items-center gap-1">
                    <span>STATUS</span>
                    ${this.sortBy === 'status' ? `<i data-lucide="${this.sortAsc ? 'chevron-up' : 'chevron-down'}" class="w-3 h-3 text-slate-950"></i>` : ''}
                  </div>
                </th>
                <th class="py-3.5 px-4 cursor-pointer hover:text-slate-800 transition min-w-[150px]" onclick="ProjectsView.toggleSort('progress')">
                  <div class="flex items-center gap-1">
                    <span>PROGRESS</span>
                    ${this.sortBy === 'progress' ? `<i data-lucide="${this.sortAsc ? 'chevron-up' : 'chevron-down'}" class="w-3 h-3 text-slate-950"></i>` : ''}
                  </div>
                </th>
                <th class="py-3.5 px-4 cursor-pointer hover:text-slate-800 transition text-right min-w-[110px]" onclick="ProjectsView.toggleSort('due')">
                  <div class="flex items-center justify-end gap-1">
                    <span>DUE</span>
                    ${this.sortBy === 'due' ? `<i data-lucide="${this.sortAsc ? 'chevron-up' : 'chevron-down'}" class="w-3 h-3 text-slate-950"></i>` : ''}
                  </div>
                </th>
                <th class="py-3.5 px-4 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-xs">
              ${filtered.length === 0 ? `
                <tr>
                  <td colspan="9" class="p-12 text-center text-slate-400">
                    <div class="max-w-xs mx-auto space-y-2">
                      <i data-lucide="folder-search" class="w-10 h-10 text-slate-300 mx-auto"></i>
                      <p class="font-bold text-slate-800 text-sm">No Matching Projects Found</p>
                      <p class="text-xs text-slate-400">Try adjusting your search criteria or resetting filters.</p>
                      ${hasActiveFilters ? `
                        <button onclick="ProjectsView.resetFilters()" class="mt-2 px-3.5 py-1.5 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 font-black rounded-xl text-xs transition cursor-pointer">
                          Reset All Filters
                        </button>
                      ` : ''}
                    </div>
                  </td>
                </tr>
              ` : filtered.map(p => {
                const pm = store.getUserById ? store.getUserById(p.pmId) : null;
                const stats = store.getProjectStats(p.id);
                const priority = p.priority || "P1";
                const status = p.status || "Active";
                const dueDate = p.dueDate || p.endDate || "—";
                const customer = p.customer || (p.category ? p.category.split("&")[0].trim() : "—");
                const isCurrentActive = activeProject && p.id === activeProject.id;

                // Priority badge
                let priorityBadgeClass = "bg-amber-50 text-amber-800 border border-amber-200/80";
                if (priority === "P0" || priority === "Critical") priorityBadgeClass = "bg-red-50 text-red-700 border border-red-200/80";
                else if (priority === "P1") priorityBadgeClass = "bg-amber-50 text-amber-800 border border-amber-200/80";
                else if (priority === "P2") priorityBadgeClass = "bg-slate-100 text-slate-700 border border-slate-200/80";
                else priorityBadgeClass = "bg-slate-50 text-slate-600 border border-slate-200/80";

                // Status pill
                let statusBadgeClass = "bg-[#f7fee7] text-[#4d7c0f] border border-[#d9f99d]";
                if (status === "Active") statusBadgeClass = "bg-[#f7fee7] text-[#4d7c0f] border border-[#d9f99d] font-bold";
                else if (status === "Planning") statusBadgeClass = "bg-slate-50 text-slate-700 border border-slate-200";
                else if (status === "In Review" || status === "On Hold") statusBadgeClass = "bg-amber-50 text-amber-700 border border-amber-200";
                else if (status === "Completed") statusBadgeClass = "bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold";

                // PM with dark circle initials
                let pmDisplay = `<span class="text-slate-400 font-medium italic">Unassigned</span>`;
                if (pm && pm.name) {
                  pmDisplay = `
                    <div class="flex items-center gap-1.5 font-bold text-slate-900">
                      <div class="w-5 h-5 rounded-full bg-slate-950 text-[#bef264] text-[8px] font-black flex items-center justify-center shrink-0 uppercase shadow-2xs">
                        ${pm.initials || pm.name.charAt(0)}
                      </div>
                      <span class="truncate max-w-[90px]">${pm.name.split(" ")[0]}</span>
                    </div>
                  `;
                } else if (p.pmId && p.pmId !== "Unassigned") {
                  pmDisplay = `
                    <div class="flex items-center gap-1.5 font-bold text-slate-900">
                      <div class="w-5 h-5 rounded-full bg-slate-950 text-[#bef264] text-[8px] font-black flex items-center justify-center shrink-0 uppercase shadow-2xs">
                        ${p.pmId.slice(0, 2).toUpperCase()}
                      </div>
                      <span class="truncate max-w-[90px]">${p.pmId}</span>
                    </div>
                  `;
                }

                return `
                  <tr
                    onclick="window.app.openProjectWorkspace('${p.id}')"
                    class="hover:bg-slate-50/80 transition-colors cursor-pointer group ${isCurrentActive ? 'bg-[#f7fee7]/40 border-l-2 border-l-[#84cc16]' : ''}"
                  >
                    <!-- Key -->
                    <td class="py-4 px-4 font-mono font-bold text-xs text-slate-700 group-hover:text-slate-950 transition uppercase">
                      ${p.key}
                    </td>

                    <!-- Project Name & Description -->
                    <td class="py-4 px-4 min-w-[240px]">
                      <div class="flex items-start gap-2.5">
                        <div class="min-w-0">
                          <div class="flex items-center gap-2">
                            <span class="font-bold text-slate-900 text-sm group-hover:text-slate-950 transition truncate">
                              ${p.name}
                            </span>
                            ${isCurrentActive ? `
                              <span class="px-1.5 py-0.2 rounded bg-slate-950 text-[#bef264] font-bold text-[9px] uppercase tracking-wider">
                                CURRENT
                              </span>
                            ` : ''}
                          </div>
                          <p class="text-xs text-slate-400 line-clamp-1 mt-0.5 leading-relaxed font-normal">
                            ${p.description || 'Core retail POS integration and QA verification suite.'}
                          </p>
                        </div>
                      </div>
                    </td>

                    <!-- Customer -->
                    <td class="py-4 px-4 text-xs font-semibold text-slate-700 whitespace-nowrap">
                      ${customer}
                    </td>

                    <!-- PM -->
                    <td class="py-4 px-4 text-xs whitespace-nowrap">
                      ${pmDisplay}
                    </td>

                    <!-- Priority -->
                    <td class="py-4 px-4 whitespace-nowrap">
                      <span class="px-2 py-0.5 rounded text-[11px] font-bold ${priorityBadgeClass}">
                        ${priority}
                      </span>
                    </td>

                    <!-- Status -->
                    <td class="py-4 px-4 whitespace-nowrap">
                      <span class="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${statusBadgeClass}">
                        ${status}
                      </span>
                    </td>

                    <!-- Progress Bar & Percentage -->
                    <td class="py-4 px-4 min-w-[150px]">
                      <div class="flex items-center gap-3">
                        <div class="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden min-w-[70px]">
                          <div
                            class="h-full ${stats.progressPct === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-slate-900 to-[#84cc16]'} rounded-full transition-all duration-500"
                            style="width: ${stats.progressPct}%"
                          ></div>
                        </div>
                        <span class="text-xs font-mono font-bold text-slate-700 shrink-0 w-8 text-right">
                          ${stats.progressPct}%
                        </span>
                      </div>
                    </td>

                    <!-- Due Date -->
                    <td class="py-4 px-4 text-xs font-mono text-slate-600 text-right whitespace-nowrap">
                      ${dueDate}
                    </td>

                    <!-- Action Buttons -->
                    <td class="py-4 px-4 text-right whitespace-nowrap" onclick="event.stopPropagation()">
                      <div class="flex items-center justify-end gap-1.5">
                        
                        <!-- Open Button -->
                        <button
                          onclick="window.app.openProjectWorkspace('${p.id}')"
                          class="px-2.5 py-1 bg-slate-100 hover:bg-slate-950 hover:text-[#bef264] text-slate-800 text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer shadow-2xs"
                          title="Open dedicated project workspace"
                        >
                          <span>Open</span>
                          <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
                        </button>

                        <!-- Activate / Deactivate Project Status Toggle -->
                        <button
                          onclick="ProjectsView.handleToggleStatus('${p.id}')"
                          class="px-2 py-1 ${status === 'Active' ? 'bg-amber-50 hover:bg-amber-100/90 text-amber-800 border border-amber-200/80' : 'bg-emerald-50 hover:bg-emerald-100/90 text-emerald-800 border border-emerald-200/80'} text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer shadow-2xs"
                          title="${status === 'Active' ? 'Deactivate project' : 'Activate project'}"
                        >
                          <i data-lucide="${status === 'Active' ? 'power' : 'play'}" class="w-3 h-3"></i>
                          <span>${status === 'Active' ? 'Deactivate' : 'Activate'}</span>
                        </button>

                        <!-- Delete Project Button -->
                        <button
                          onclick="ProjectsView.confirmDeleteProject('${p.id}')"
                          class="p-1.5 bg-rose-50 hover:bg-rose-100/90 text-rose-600 hover:text-rose-700 border border-rose-200/80 rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer shadow-2xs"
                          title="Delete project from Space & Supabase"
                        >
                          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                        </button>

                      </div>
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
  // VIEW MODE B: 3D BENTO GRID VIEW (Cool Alternative)
  // =========================================================================
  renderGridView(filtered, activeProject) {
    if (filtered.length === 0) {
      return `
        <div class="bg-white rounded-2xl p-12 text-center text-slate-400 border border-slate-200">
          <p class="font-bold text-slate-800 text-sm">No Matching Projects Found</p>
        </div>
      `;
    }

    return `
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        ${filtered.map(p => {
          const pm = store.getUserById ? store.getUserById(p.pmId) : null;
          const stats = store.getProjectStats(p.id);
          const isCurrentActive = activeProject && p.id === activeProject.id;
          const dueDate = p.dueDate || p.endDate || "2026-12-01";
          const status = p.status || "Active";

          return `
            <div
              onclick="window.app.openProjectWorkspace('${p.id}')"
              class="dash-bento-card p-5 cursor-pointer group flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${isCurrentActive ? 'ring-2 ring-slate-950 bg-[#f7fee7]/20' : ''}"
            >
              <!-- Top accent glow -->
              <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-900 via-slate-800 to-[#bef264]"></div>

              <div class="space-y-3.5">
                <!-- Top Header Row: Icon, Key, Status, Priority -->
                <div class="flex items-center justify-between gap-2">
                  <div class="flex items-center gap-2">
                    <div class="w-9 h-9 rounded-xl bg-slate-950 text-[#bef264] flex items-center justify-center shrink-0 shadow-2xs font-bold text-xs">
                      <i data-lucide="layers" class="w-4 h-4"></i>
                    </div>
                    <span class="px-2 py-0.5 rounded-md bg-slate-100 font-mono font-bold text-xs text-slate-800 border border-slate-200/80">
                      ${p.key}
                    </span>
                  </div>

                  <div class="flex items-center gap-1.5">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold ${status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-700'}">
                      ● ${status}
                    </span>
                    <span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      ${p.priority || 'P1'}
                    </span>
                  </div>
                </div>

                <!-- Title & Description -->
                <div>
                  <h3 class="text-base font-bold text-slate-950 group-hover:text-slate-950 transition truncate">${p.name}</h3>
                  <p class="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">${p.description || 'Enterprise project workspace and QA verification suite.'}</p>
                </div>

                <!-- Delivery Progress Bar -->
                <div class="space-y-1 pt-1">
                  <div class="flex items-center justify-between text-[11px] font-bold">
                    <span class="text-slate-400 uppercase text-[10px]">DELIVERY VELOCITY</span>
                    <span class="text-slate-950 font-mono">${stats.progressPct}% (${stats.completed}/${stats.total} Issues)</span>
                  </div>
                  <div class="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                    <div class="h-full bg-gradient-to-r from-slate-900 to-[#84cc16] rounded-full transition-all duration-500" style="width: ${stats.progressPct}%"></div>
                  </div>
                </div>
              </div>

              <!-- Bottom Meta Row: PM, Team, Due Date & Buttons -->
              <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs" onclick="event.stopPropagation()">
                <div class="flex items-center gap-2 min-w-0">
                  <div class="w-6 h-6 rounded-full bg-slate-950 text-[#bef264] text-[9px] font-black flex items-center justify-center shrink-0 uppercase shadow-2xs">
                    ${pm ? (pm.initials || pm.name.charAt(0)) : 'PM'}
                  </div>
                  <span class="font-bold text-slate-800 text-xs truncate">${pm ? pm.name : (p.pmId || 'Project Lead')}</span>
                </div>

                <div class="flex items-center gap-1.5">
                  <button
                    onclick="ProjectsView.handleToggleStatus('${p.id}')"
                    class="px-2 py-1 ${status === 'Active' ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80'} text-[11px] font-bold rounded-lg transition flex items-center gap-1 cursor-pointer shadow-2xs"
                    title="${status === 'Active' ? 'Deactivate project' : 'Activate project'}"
                  >
                    <i data-lucide="${status === 'Active' ? 'power' : 'play'}" class="w-3 h-3"></i>
                    <span>${status === 'Active' ? 'Deactivate' : 'Activate'}</span>
                  </button>

                  <button
                    onclick="ProjectsView.confirmDeleteProject('${p.id}')"
                    class="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/80 rounded-lg transition flex items-center justify-center cursor-pointer shadow-2xs"
                    title="Delete project from Space & Supabase"
                  >
                    <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                  </button>

                  <button
                    onclick="window.app.openProjectWorkspace('${p.id}')"
                    class="px-2.5 py-1 bg-slate-950 hover:bg-slate-900 text-[#bef264] text-[11px] font-bold rounded-lg transition flex items-center gap-1 cursor-pointer shadow-2xs"
                    title="Open workspace"
                  >
                    <span>Open</span>
                    <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
                  </button>
                </div>
              </div>

            </div>
          `;
        }).join("")}
      </div>
    `;
  },

  // =========================================================================
  // 3D LATTICE CANVAS INITIALIZER
  // =========================================================================
  initRegister3DCanvas() {
    if (typeof requestAnimationFrame !== "function") return;

    const canvas = document.getElementById("projectRegisterLatticeCanvas");
    if (canvas && typeof canvas.getContext === "function") {
      const ctx = canvas.getContext("2d");
      if (ctx && typeof ctx.clearRect === "function") {
        let angleX = 0;
        let angleY = 0;
        const phi = (1 + Math.sqrt(5)) / 2;
        const rawVertices = [
          [-2, phi * 1.5, 0], [2, phi * 1.5, 0], [-2, -phi * 1.5, 0], [2, -phi * 1.5, 0],
          [0, -2, phi * 1.5], [0, 2, phi * 1.5], [0, -2, -phi * 1.5], [0, 2, -phi * 1.5],
          [phi * 1.5, 0, -2], [phi * 1.5, 0, 2], [-phi * 1.5, 0, -2], [-phi * 1.5, 0, 2]
        ].map(v => {
          const mag = Math.sqrt(v[0]**2 + v[1]**2 + v[2]**2);
          return [v[0] / mag * 45, v[1] / mag * 45, v[2] / mag * 45];
        });

        const drawLattice = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const cx = canvas.width / 2;
          const cy = canvas.height / 2;

          angleX += 0.005;
          angleY += 0.007;

          const projected = rawVertices.map(v => {
            let x1 = v[0] * Math.cos(angleY) + v[2] * Math.sin(angleY);
            let z1 = -v[0] * Math.sin(angleY) + v[2] * Math.cos(angleY);
            let y2 = v[1] * Math.cos(angleX) - z1 * Math.sin(angleX);
            let z2 = v[1] * Math.sin(angleX) + z1 * Math.cos(angleX);
            const scale = 200 / (200 + z2);
            return { x: cx + x1 * scale * 2.2, y: cy + y2 * scale * 1.4, z: z2 };
          });

          ctx.lineWidth = 0.9;
          for (let i = 0; i < projected.length; i++) {
            for (let j = i + 1; j < projected.length; j++) {
              const dx = projected[i].x - projected[j].x;
              const dy = projected[i].y - projected[j].y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < 80) {
                const alpha = Math.max(0.08, 1 - dist / 80) * 0.45;
                ctx.strokeStyle = `rgba(190, 242, 100, ${alpha})`;
                ctx.beginPath();
                ctx.moveTo(projected[i].x, projected[i].y);
                ctx.lineTo(projected[j].x, projected[j].y);
                ctx.stroke();
              }
            }
          }

          projected.forEach(p => {
            const nodeAlpha = Math.max(0.25, (p.z + 45) / 90);
            ctx.fillStyle = `rgba(132, 204, 22, ${nodeAlpha})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2);
            ctx.fill();
          });

          const animId = requestAnimationFrame(drawLattice);
          this.animationFrameIds.push(animId);
        };
        drawLattice();
      }
    }
  },

  toggleViewMode(mode) {
    this.viewMode = mode;
    const contentArea = document.getElementById("mainContent");
    if (contentArea) this.render(contentArea);
  },

  // --- FILTER & SORT HANDLERS ---
  handleSearch(query) {
    this.searchQuery = query;
    const contentArea = document.getElementById("mainContent");
    if (contentArea) this.render(contentArea);
  },

  handleStatusFilter(status) {
    this.statusFilter = status;
    const contentArea = document.getElementById("mainContent");
    if (contentArea) this.render(contentArea);
  },

  handlePriorityFilter(priority) {
    this.priorityFilter = priority;
    const contentArea = document.getElementById("mainContent");
    if (contentArea) this.render(contentArea);
  },

  handleProjectSelect(projectId) {
    this.selectedProjectFilter = projectId;
    if (projectId !== "all") {
      store.setActiveProject(projectId);
      window.app.updateHeaderProjectSelector();
    }
    const contentArea = document.getElementById("mainContent");
    if (contentArea) this.render(contentArea);
  },

  resetFilters() {
    this.searchQuery = "";
    this.statusFilter = "all";
    this.priorityFilter = "all";
    this.selectedProjectFilter = "all";
    this.pmFilter = "all";
    const contentArea = document.getElementById("mainContent");
    if (contentArea) this.render(contentArea);
  },

  toggleSort(field) {
    if (this.sortBy === field) {
      this.sortAsc = !this.sortAsc;
    } else {
      this.sortBy = field;
      this.sortAsc = true;
    }
    const contentArea = document.getElementById("mainContent");
    if (contentArea) this.render(contentArea);
  },

  // --- CREATE PROJECT MODAL ---
  openCreateProjectModal() {
    const users = store.getUsers ? store.getUsers() : [];
    const activeUser = store.getActiveUser ? store.getActiveUser() : null;
    const allUsers = [...users];
    if (activeUser && !allUsers.some(u => u.id === activeUser.id || u.email === activeUser.email)) {
      allUsers.unshift(activeUser);
    }

    const spaces = store.getWorkspaces ? store.getWorkspaces() : [];
    const activeWs = store.getActiveWorkspace ? store.getActiveWorkspace() : null;

    let container = document.getElementById("projectModalContainer");
    if (!container) {
      container = document.createElement("div");
      container.id = "projectModalContainer";
      document.body.appendChild(container);
    }

    container.innerHTML = `
      <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-fade-in">
          <!-- Modal Header -->
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
              <i data-lucide="folder-plus" class="w-5 h-5 text-slate-950"></i> Create Project
            </h3>
            <button onclick="document.getElementById('projectModalContainer').innerHTML=''" class="text-slate-400 hover:text-slate-600">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <!-- Form -->
          <form id="createProjectForm" onsubmit="ProjectsView.handleCreateProject(event)" class="mt-4 space-y-3.5 text-xs">
            
            ${spaces.length > 0 ? `
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Target Space / Workspace *</label>
                <select id="prjSpace" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none bg-slate-50">
                  ${spaces.map(s => `<option value="${s.id}" ${activeWs && s.id === activeWs.id ? 'selected' : ''}>${s.name} (${s.workspace_type || 'Space'})</option>`).join("")}
                </select>
              </div>
            ` : ''}

            <div class="grid grid-cols-3 gap-3">
              <div class="col-span-2">
                <label class="block font-semibold text-slate-700 mb-1">Project Name *</label>
                <input type="text" id="prjName" required placeholder="e.g. Core Infrastructure & API" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none" />
              </div>
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Key *</label>
                <input type="text" id="prjKey" required placeholder="e.g. CORE" maxlength="6" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs uppercase font-mono font-bold focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Customer / Client</label>
                <input type="text" id="prjCustomer" placeholder="e.g. Northwind Ltd." class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none" />
              </div>
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Priority</label>
                <select id="prjPriority" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none font-bold">
                  <option value="P0">P0 (Critical / Blocker)</option>
                  <option value="P1" selected>P1 (High Priority)</option>
                  <option value="P2">P2 (Medium Priority)</option>
                  <option value="P3">P3 (Low Priority)</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block font-semibold text-slate-700 mb-1">Description</label>
              <textarea id="prjDesc" rows="2" placeholder="Platform services, authentication and data pipeline hardening..." class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none"></textarea>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Project Manager *</label>
                <select id="prjPm" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none">
                  ${allUsers.map(u => `<option value="${u.name || u.email}">${u.name || u.email} (${u.role || 'PM'})</option>`).join("")}
                </select>
              </div>
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Status</label>
                <select id="prjStatus" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none">
                  <option value="Active" selected>Active</option>
                  <option value="Planning">Planning</option>
                  <option value="In Review">In Review</option>
                  <option value="On Hold">On Hold</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Start Date</label>
                <input type="date" id="prjStart" value="${new Date().toISOString().split('T')[0]}" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none" />
              </div>
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Due Date</label>
                <input type="date" id="prjDue" value="${new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]}" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none" />
              </div>
            </div>

            <!-- Modal Actions -->
            <div class="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button type="button" onclick="document.getElementById('projectModalContainer').innerHTML=''" class="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer">
                Cancel
              </button>
              <button type="submit" class="px-4 py-2 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 font-bold rounded-xl shadow-xs shadow-[#bef264]/30 transition cursor-pointer flex items-center gap-1.5">
                <i data-lucide="plus" class="w-4 h-4 text-slate-950"></i>
                <span>Create Project</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  async handleCreateProject(e) {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span>Saving to Supabase...</span>`;
    }

    const spaceId = document.getElementById("prjSpace")?.value || (store.getActiveWorkspace ? store.getActiveWorkspace()?.id : store.data.activeWorkspaceId);
    const name = document.getElementById("prjName").value.trim();
    const key = document.getElementById("prjKey").value.trim().toUpperCase();
    const description = document.getElementById("prjDesc").value.trim();
    const customer = document.getElementById("prjCustomer").value.trim() || "Enterprise Client";
    const priority = document.getElementById("prjPriority").value;
    const pmId = document.getElementById("prjPm").value;
    const status = document.getElementById("prjStatus").value;
    const startDate = document.getElementById("prjStart").value;
    const dueDate = document.getElementById("prjDue").value;

    try {
      const newProject = await store.createProject({
        workspace_id: spaceId,
        name,
        key,
        description,
        customer,
        priority,
        pmId,
        status,
        startDate,
        endDate: dueDate,
        dueDate
      });

      document.getElementById("projectModalContainer").innerHTML = "";
      if (window.app && window.app.toast) {
        window.app.toast("Project Created", `Project "${newProject.name}" (${newProject.key}) saved to Supabase.`, "success");
      }
      if (window.app && window.app.updateHeaderProjectSelector) {
        window.app.updateHeaderProjectSelector();
      }
      if (window.app && window.app.updateSidebarSpacesExplorer) {
        window.app.updateSidebarSpacesExplorer();
      }
      if (window.app && window.app.openProjectWorkspace) {
        window.app.openProjectWorkspace(newProject.id);
      }
    } catch (err) {
      if (window.app && window.app.toast) {
        window.app.toast("Project Error", err.message || "Failed to create project", "error");
      }
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span>Create Project</span>`;
      }
    }
  },

  // --- ACTIVATE / DEACTIVATE PROJECT STATUS ---
  async handleToggleStatus(projectId) {
    try {
      const proj = store.getProjectById(projectId);
      if (!proj) return;
      const updated = await store.toggleProjectStatus(projectId);
      const isNowActive = updated && updated.status === 'Active';
      if (window.app && window.app.toast) {
        window.app.toast(
          isNowActive ? "Project Activated" : "Project Deactivated",
          `Project "${proj.name}" is now marked as ${isNowActive ? 'Active' : 'Inactive'}.`,
          isNowActive ? "success" : "info"
        );
      }
      const contentArea = document.getElementById("mainContent");
      if (contentArea) this.render(contentArea);
      if (window.app && window.app.updateHeaderProjectSelector) {
        window.app.updateHeaderProjectSelector();
      }
      if (window.app && window.app.updateSidebarSpacesExplorer) {
        window.app.updateSidebarSpacesExplorer();
      }
    } catch (err) {
      if (window.app && window.app.toast) {
        window.app.toast("Error", err.message || "Failed to update project status", "error");
      }
    }
  },

  // --- DELETE PROJECT CONFIRMATION MODAL & ACTION ---
  confirmDeleteProject(projectId) {
    const proj = store.getProjectById(projectId);
    if (!proj) return;

    const stats = store.getProjectStats ? store.getProjectStats(projectId) : { total: 0 };
    const issueCount = stats ? (stats.total || 0) : 0;

    let container = document.getElementById("projectModalContainer");
    if (!container) {
      container = document.createElement("div");
      container.id = "projectModalContainer";
      document.body.appendChild(container);
    }

    container.innerHTML = `
      <div class="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-fade-in space-y-4">
          
          <!-- Header -->
          <div class="flex items-center gap-3 text-rose-600">
            <div class="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
              <i data-lucide="alert-triangle" class="w-5 h-5 text-rose-600"></i>
            </div>
            <div>
              <h3 class="text-base font-bold text-slate-950">Delete Project</h3>
              <p class="text-xs text-slate-500 font-medium">Permanent Space & Supabase Removal</p>
            </div>
          </div>

          <!-- Body -->
          <div class="space-y-3 text-xs text-slate-600">
            <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <div class="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span class="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-xs border border-slate-200/80">${proj.key}</span>
                <span class="truncate">${proj.name}</span>
              </div>
              <p class="text-slate-500 text-[11px]">${proj.customer || 'Enterprise Client'} · ${issueCount} Issues registered</p>
            </div>

            <div class="p-3 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-800 space-y-1">
              <p class="font-bold text-xs">⚠️ Warning: Irreversible Action</p>
              <p class="text-[11px] leading-relaxed">
                This will permanently delete this project and all associated tickets, members, releases, QA reports, and chat history from this Space and Supabase.
              </p>
            </div>
          </div>

          <!-- Actions -->
          <div class="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onclick="document.getElementById('projectModalContainer').innerHTML=''"
              class="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl text-xs transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              id="confirmDeletePrjBtn"
              onclick="ProjectsView.handleDeleteProject('${proj.id}')"
              class="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-xs shadow-rose-600/30 transition cursor-pointer flex items-center gap-1.5"
            >
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              <span>Delete Project Permanently</span>
            </button>
          </div>

        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  async handleDeleteProject(projectId) {
    const btn = document.getElementById("confirmDeletePrjBtn");
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span class="animate-pulse">Deleting from Supabase...</span>`;
    }

    try {
      const proj = store.getProjectById(projectId);
      const projName = proj ? proj.name : "Project";
      const projKey = proj ? proj.key : "";

      await store.deleteProject(projectId);

      const modalContainer = document.getElementById("projectModalContainer");
      if (modalContainer) modalContainer.innerHTML = "";

      if (window.app && window.app.toast) {
        window.app.toast(
          "Project Deleted",
          `Project "${projName}" (${projKey}) was permanently deleted from Space & Supabase.`,
          "info"
        );
      }

      if (window.app && window.app.updateHeaderProjectSelector) {
        window.app.updateHeaderProjectSelector();
      }
      if (window.app && window.app.updateSidebarSpacesExplorer) {
        window.app.updateSidebarSpacesExplorer();
      }

      const contentArea = document.getElementById("mainContent");
      if (contentArea) this.render(contentArea);
    } catch (err) {
      if (window.app && window.app.toast) {
        window.app.toast("Deletion Failed", err.message || "Could not delete project", "error");
      }
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<span>Retry Delete</span>`;
      }
    }
  }
};

if (typeof window !== "undefined") window.ProjectsView = ProjectsView;
if (typeof global !== "undefined") global.ProjectsView = ProjectsView;
if (typeof module !== "undefined" && module.exports) module.exports = ProjectsView;
