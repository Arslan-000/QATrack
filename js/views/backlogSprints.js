/**
 * PulseWave QA Platform — Modern Backlog & Sprints Planning Module (V4 Clean & Simple Edition)
 * Ultra-Intuitive Agile & QA Workspace:
 * - Simple, easy-to-understand 3-step planning flow
 * - Streamlined ticket cards with aligned metadata & story points estimator
 * - Non-intrusive Active / Planned Sprint hierarchy
 * - Instant drag-and-drop & 1-click sprint ticket reassignment
 * - Real-time sprint telemetry & QA Quality Gate tracking
 */

const BacklogSprintsView = {
  activeSprintTab: "all",
  searchQuery: "",
  quickFilter: "all", // 'all', 'my_issues', 'bugs_only', 'critical', 'unestimated'
  selectedIssueIds: new Set(),
  collapsedSprints: new Set(),

  render(container) {
    const project = store.getActiveProject();
    if (!project) {
      container.innerHTML = `
        <div class="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200/90 shadow-xs max-w-md mx-auto mt-12 animate-fade-in font-sans">
          <div class="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <i data-lucide="layers" class="w-6 h-6"></i>
          </div>
          <h3 class="text-sm font-bold text-slate-900">No Project Selected</h3>
          <p class="text-xs text-slate-500 mt-1">Please select a project from the sidebar to view its backlog and sprints.</p>
          <button onclick="window.app.openCreateProjectModal()" class="mt-4 px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition inline-flex items-center gap-1.5 cursor-pointer shadow-xs">
            <i data-lucide="plus" class="w-4 h-4 text-[#bef264]"></i> Create Project
          </button>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    const activeUser = store.getActiveUser ? store.getActiveUser() : null;
    const allProjects = store.getProjects ? store.getProjects() : [];
    const sprints = (store.getSprints(project.id) || []).sort(
      (a, b) => new Date(b.createdAt || b.startDate || 0) - new Date(a.createdAt || a.startDate || 0)
    );

    const activeSprint = sprints.find(s => s.status === "active" || s.status === "Active" || s.status === "In Progress") || null;
    const futureSprints = sprints.filter(s => (s.status === "future" || s.status === "Planned" || s.status === "Draft") && s.id !== activeSprint?.id);
    const completedSprints = sprints.filter(s => s.status === "completed" || s.status === "Completed" || s.status === "Closed");

    const allIssues = store.getIssues(project.id) || [];
    const filteredIssues = this.filterIssues(allIssues, activeUser);

    const backlogIssues = filteredIssues.filter(i => !i.sprintId && !i.sprint_id);
    const activeSprintIssues = activeSprint ? filteredIssues.filter(i => (i.sprintId === activeSprint.id || i.sprint_id === activeSprint.id)) : [];

    // Active sprint breakdown
    const activeDone = activeSprintIssues.filter(i => i.status === "Done" || i.status === "Closed" || i.qaStatus === "Passed").length;
    const totalSprintPoints = activeSprintIssues.reduce((sum, i) => sum + Number(i.storyPoints || i.story_points || 0), 0);
    const progressPct = activeSprintIssues.length > 0 ? Math.round((activeDone / activeSprintIssues.length) * 100) : 0;
    const totalBacklogPoints = backlogIssues.reduce((sum, i) => sum + Number(i.storyPoints || i.story_points || 0), 0);

    const isPM = store.canCreateSprint ? store.canCreateSprint(project.id) : true;

    container.innerHTML = `
      <div class="space-y-4 max-w-7xl mx-auto pb-16 text-xs text-slate-800 font-sans animate-fade-in">
        
        <!-- =========================================================================
             1. HEADER: Project Switcher & Main Actions
             ========================================================================= -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white px-5 py-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div class="flex items-center gap-3.5 min-w-0">
            <div class="w-10 h-10 rounded-xl bg-slate-950 text-[#bef264] flex items-center justify-center font-mono font-black text-sm shrink-0 shadow-xs ring-4 ring-slate-100">
              ${project.key}
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <h1 class="text-base font-black text-slate-900 tracking-tight">${project.name}</h1>
                <span class="text-slate-300">•</span>
                <span class="text-xs font-bold text-slate-600">Backlog & Sprints</span>
                <span class="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono font-bold text-[10px] border border-slate-200">
                  ${allIssues.length} Total Tickets
                </span>
              </div>
              <p class="text-[11px] text-slate-500 truncate mt-0.5">Plan sprints, estimate story points, and drag tickets into sprint cycles.</p>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2.5 shrink-0 self-start sm:self-center">
            ${allProjects.length > 1 ? `
              <div class="relative inline-block min-w-[150px]">
                <select onchange="window.app.selectSidebarProject(this.value)" class="appearance-none w-full pl-3 pr-8 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-800 font-bold text-xs cursor-pointer focus:outline-none transition shadow-2xs">
                  ${allProjects.map(p => `
                    <option value="${p.id}" ${p.id === project.id ? 'selected' : ''}>${p.key} - ${p.name}</option>
                  `).join('')}
                </select>
                <i data-lucide="chevron-down" class="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none"></i>
              </div>
            ` : ''}

            ${isPM ? `
              <button onclick="BacklogSprintsView.openCreateSprintModal('${project.id}')" class="px-3.5 py-2 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs" title="Create a new planned sprint">
                <i data-lucide="plus" class="w-4 h-4 text-slate-950 stroke-[3]"></i>
                <span>Create Sprint</span>
              </button>
            ` : ''}

            <button onclick="window.app.openCreateIssueModal('${project.id}')" class="px-3.5 py-2 bg-slate-950 hover:bg-slate-800 text-white rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs">
              <i data-lucide="plus-circle" class="w-4 h-4 text-[#bef264]"></i>
              <span>New Ticket</span>
            </button>

            <button onclick="window.app.openProjectWorkspace('${project.id}', 'board')" class="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs hover:border-slate-300" title="Go to Interactive Kanban Board">
              <i data-lucide="kanban" class="w-4 h-4 text-slate-500"></i>
              <span>Board</span>
            </button>
          </div>
        </div>

        <!-- =========================================================================
             2. SIMPLE 3-STEP AGILE EXPLANATION BANNER (Easy to understand for everyone)
             ========================================================================= -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3 bg-gradient-to-r from-slate-900 to-slate-950 text-white p-3.5 rounded-2xl shadow-xs border border-slate-800">
          <div class="flex items-center gap-3 px-2">
            <div class="w-7 h-7 rounded-lg bg-slate-800 text-[#bef264] flex items-center justify-center font-bold text-xs shrink-0 border border-slate-700">
              1
            </div>
            <div>
              <div class="font-bold text-xs text-slate-100">Product Backlog</div>
              <div class="text-[10px] text-slate-400">Add & collect all raw ideas, stories & bugs.</div>
            </div>
          </div>

          <div class="flex items-center gap-3 px-2 border-t md:border-t-0 md:border-l border-slate-800 pt-2 md:pt-0">
            <div class="w-7 h-7 rounded-lg bg-slate-800 text-[#bef264] flex items-center justify-center font-bold text-xs shrink-0 border border-slate-700">
              2
            </div>
            <div>
              <div class="font-bold text-xs text-slate-100">Plan Sprint</div>
              <div class="text-[10px] text-slate-400">Drag or assign backlog tickets into a Sprint.</div>
            </div>
          </div>

          <div class="flex items-center gap-3 px-2 border-t md:border-t-0 md:border-l border-slate-800 pt-2 md:pt-0">
            <div class="w-7 h-7 rounded-lg bg-[#bef264] text-slate-950 flex items-center justify-center font-black text-xs shrink-0">
              3
            </div>
            <div>
              <div class="font-bold text-xs text-slate-100">Start & Execute</div>
              <div class="text-[10px] text-slate-400">Click <strong>Start Sprint</strong> to work on the Board.</div>
            </div>
          </div>
        </div>

        <!-- =========================================================================
             3. ACTIVE SPRINT SECTION
             ========================================================================= -->
        ${activeSprint ? `
          <div class="bg-white rounded-2xl border-2 border-emerald-500/30 shadow-xs overflow-hidden" id="sprint-${activeSprint.id}">
            
            <!-- Active Sprint Header -->
            <div class="p-4 bg-emerald-50/40 border-b border-emerald-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div class="space-y-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="px-2.5 py-0.5 rounded-full bg-emerald-500 text-white font-bold text-[10px] tracking-wide flex items-center gap-1 shadow-2xs">
                    <span class="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span> Active Sprint
                  </span>
                  <h2 class="text-sm font-black text-slate-950">${activeSprint.name}</h2>
                  <span class="text-slate-300">•</span>
                  <span class="text-slate-500 font-medium text-xs">
                    ${activeSprint.startDate || activeSprint.start_date || 'Ongoing'} – ${activeSprint.endDate || activeSprint.end_date || 'Target'}
                  </span>
                  <span class="px-2 py-0.5 rounded-md bg-white text-slate-700 font-mono font-bold text-[10px] border border-slate-200">
                    ${activeSprintIssues.length} Tickets • ${totalSprintPoints} SP
                  </span>
                </div>

                ${activeSprint.goal ? `
                  <p class="text-xs text-slate-600 flex items-center gap-1.5 truncate">
                    <i data-lucide="target" class="w-3.5 h-3.5 text-emerald-600 shrink-0"></i>
                    <span><strong>Goal:</strong> ${activeSprint.goal}</span>
                  </p>
                ` : ''}
              </div>

              <!-- Progress & Actions -->
              <div class="flex items-center gap-2.5 shrink-0">
                <!-- Progress Indicator -->
                <div class="flex items-center gap-2 px-3 py-1 bg-white rounded-xl border border-slate-200 text-xs shadow-2xs">
                  <div class="w-20 bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div class="bg-emerald-500 h-full rounded-full transition-all" style="width: ${progressPct}%"></div>
                  </div>
                  <span class="font-bold font-mono text-slate-700">${activeDone}/${activeSprintIssues.length}</span>
                  <span class="text-slate-400 text-[11px]">(${progressPct}%)</span>
                </div>

                <button onclick="window.app.openProjectWorkspace('${project.id}', 'board')" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold transition flex items-center gap-1 cursor-pointer">
                  <i data-lucide="layout-grid" class="w-3.5 h-3.5"></i> Board
                </button>

                ${isPM ? `
                  <button onclick="BacklogSprintsView.openEditSprintModal('${activeSprint.id}')" class="p-1.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl font-semibold transition cursor-pointer" title="Edit Sprint">
                    <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
                  </button>
                  <button onclick="BacklogSprintsView.openCompleteSprintModal('${activeSprint.id}')" class="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs">
                    <i data-lucide="check" class="w-3.5 h-3.5"></i> Complete Sprint
                  </button>
                ` : ''}

                <button onclick="BacklogSprintsView.toggleSprintCollapse('${activeSprint.id}')" class="p-1.5 hover:bg-slate-200/80 rounded-xl text-slate-400 hover:text-slate-700 transition cursor-pointer">
                  <i data-lucide="${this.collapsedSprints.has(activeSprint.id) ? 'chevron-down' : 'chevron-up'}" class="w-4 h-4"></i>
                </button>
              </div>
            </div>

            <!-- Issues List -->
            ${!this.collapsedSprints.has(activeSprint.id) ? `
              <div class="p-3 space-y-1.5 max-h-[480px] overflow-y-auto bg-slate-50/30" ondragover="event.preventDefault()" ondrop="BacklogSprintsView.handleDropToSprint(event, '${activeSprint.id}')">
                ${activeSprintIssues.length === 0 ? `
                  <div class="p-8 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-white">
                    <p class="font-bold text-slate-700 text-xs">This active sprint has no tickets yet</p>
                    <p class="text-[11px] text-slate-400 mt-0.5">Drag tickets from the Product Backlog below, or type in the box below.</p>
                  </div>
                ` : activeSprintIssues.map(issue => this.renderIssueRow(issue, activeSprint.id)).join("")}
              </div>

              <!-- Inline Quick Ticket Creator -->
              <div class="px-3 pb-3 bg-slate-50/30">
                <div class="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl shadow-2xs hover:border-slate-300 transition">
                  <i data-lucide="plus" class="w-3.5 h-3.5 text-slate-400 shrink-0"></i>
                  <input 
                    type="text" 
                    id="quickAddActiveSprint" 
                    placeholder="Add a new ticket to ${activeSprint.name} (Press Enter)..." 
                    onkeydown="if(event.key==='Enter') { BacklogSprintsView.handleQuickCreateTicket('${activeSprint.id}', this.value, '${project.id}'); this.value=''; }" 
                    class="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
                  />
                  <button 
                    onclick="const el = document.getElementById('quickAddActiveSprint'); if(el && el.value.trim()) { BacklogSprintsView.handleQuickCreateTicket('${activeSprint.id}', el.value, '${project.id}'); el.value=''; }" 
                    class="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-bold shrink-0 transition cursor-pointer"
                  >
                    Add Ticket
                  </button>
                </div>
              </div>
            ` : ''}

          </div>
        ` : (futureSprints.length === 0 ? `
          <!-- Initial Sprint Setup Prompt (Only shown when 0 sprints exist) -->
          <div class="bg-white rounded-2xl border border-dashed border-slate-300 p-6 text-center space-y-2">
            <div class="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
              <i data-lucide="flag" class="w-5 h-5"></i>
            </div>
            <h3 class="text-sm font-bold text-slate-900">No Sprints Created Yet</h3>
            <p class="text-xs text-slate-500 max-w-sm mx-auto">Create your first sprint to organize tickets into a focused 1–2 week delivery cycle.</p>
            ${isPM ? `
              <button onclick="BacklogSprintsView.openCreateSprintModal('${project.id}')" class="mt-2 px-4 py-2 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 font-bold rounded-xl text-xs transition inline-flex items-center gap-1.5 cursor-pointer shadow-xs">
                <i data-lucide="plus" class="w-4 h-4"></i> Create First Sprint
              </button>
            ` : ''}
          </div>
        ` : '')}

        <!-- =========================================================================
             4. PLANNED SPRINTS SECTION
             ========================================================================= -->
        ${futureSprints.length > 0 ? `
          <div class="space-y-3">
            <div class="flex items-center justify-between px-1">
              <h3 class="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <i data-lucide="calendar" class="w-3.5 h-3.5 text-slate-400"></i>
                <span>Planned Sprints (${futureSprints.length})</span>
              </h3>
            </div>

            ${futureSprints.map(s => {
              const sprintIssues = filteredIssues.filter(i => (i.sprintId === s.id || i.sprint_id === s.id));
              const sPoints = sprintIssues.reduce((sum, i) => sum + Number(i.storyPoints || i.story_points || 0), 0);
              const isCollapsed = this.collapsedSprints.has(s.id);

              return `
                <div class="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden" id="sprint-${s.id}">
                  <div class="p-3.5 bg-slate-50/80 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div class="flex items-center gap-2 flex-wrap min-w-0">
                      <span class="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px]">Planned</span>
                      <h4 class="font-black text-slate-900 text-xs">${s.name}</h4>
                      <span class="text-slate-300">•</span>
                      <span class="text-slate-500 text-xs">${s.startDate || s.start_date || 'TBD'} – ${s.endDate || s.end_date || 'TBD'}</span>
                      <span class="px-2 py-0.5 bg-white text-slate-700 font-mono font-bold text-[10px] rounded border border-slate-200">
                        ${sprintIssues.length} Tickets • ${sPoints} SP
                      </span>
                    </div>

                    <div class="flex items-center gap-2 shrink-0">
                      ${isPM ? `
                        <button onclick="BacklogSprintsView.openStartSprintModal('${s.id}')" class="px-3.5 py-1.5 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 rounded-xl font-black text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs">
                          <i data-lucide="play" class="w-3.5 h-3.5 stroke-[3]"></i> Start Sprint
                        </button>
                        <button onclick="BacklogSprintsView.openEditSprintModal('${s.id}')" class="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 transition cursor-pointer" title="Edit">
                          <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
                        </button>
                        <button onclick="BacklogSprintsView.handleDeleteSprint('${s.id}')" class="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer" title="Delete">
                          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                        </button>
                      ` : ''}
                      <button onclick="BacklogSprintsView.toggleSprintCollapse('${s.id}')" class="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition cursor-pointer">
                        <i data-lucide="${isCollapsed ? 'chevron-down' : 'chevron-up'}" class="w-3.5 h-3.5"></i>
                      </button>
                    </div>
                  </div>

                  ${!isCollapsed ? `
                    <div class="p-3 space-y-1.5 max-h-60 overflow-y-auto bg-slate-50/20" ondragover="event.preventDefault()" ondrop="BacklogSprintsView.handleDropToSprint(event, '${s.id}')">
                      ${sprintIssues.length === 0 ? `
                        <div class="py-5 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl bg-white">
                          <p class="text-xs text-slate-600 font-medium">No tickets assigned to this sprint yet</p>
                          <p class="text-[11px] text-slate-400 mt-0.5">Drag tickets from the Backlog below or type in the box below.</p>
                        </div>
                      ` : sprintIssues.map(issue => this.renderIssueRow(issue, s.id)).join("")}
                    </div>

                    <div class="px-3 pb-3 bg-slate-50/20">
                      <div class="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl shadow-2xs hover:border-slate-300 transition">
                        <i data-lucide="plus" class="w-3.5 h-3.5 text-slate-400 shrink-0"></i>
                        <input 
                          type="text" 
                          id="quickAddPlanned-${s.id}" 
                          placeholder="Add ticket to ${s.name} (Press Enter)..." 
                          onkeydown="if(event.key==='Enter') { BacklogSprintsView.handleQuickCreateTicket('${s.id}', this.value, '${project.id}'); this.value=''; }" 
                          class="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
                        />
                        <button 
                          onclick="const el = document.getElementById('quickAddPlanned-${s.id}'); if(el && el.value.trim()) { BacklogSprintsView.handleQuickCreateTicket('${s.id}', el.value, '${project.id}'); el.value=''; }" 
                          class="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-bold shrink-0 transition cursor-pointer"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  ` : ''}
                </div>
              `;
            }).join("")}
          </div>
        ` : ''}

        <!-- =========================================================================
             5. PRODUCT BACKLOG CONTAINER (Master Pool of All Work)
             ========================================================================= -->
        <div class="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          
          <!-- Backlog Header with Search & Filter -->
          <div class="p-4 bg-slate-50/80 border-b border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div class="flex items-center gap-2 flex-wrap">
              <div class="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                <i data-lucide="inbox" class="w-3.5 h-3.5"></i>
              </div>
              <h3 class="font-black text-slate-900 text-xs">Product Backlog</h3>
              <span class="px-2.5 py-0.5 rounded-full font-mono font-bold text-[10px] bg-slate-200 text-slate-800">
                ${backlogIssues.length} Tickets • ${totalBacklogPoints} SP
              </span>
            </div>

            <!-- Search & Filters -->
            <div class="flex flex-col sm:flex-row sm:items-center gap-2.5">
              <!-- Search -->
              <div class="relative min-w-[200px]">
                <i data-lucide="search" class="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400"></i>
                <input 
                  type="text" 
                  value="${this.searchQuery}"
                  oninput="BacklogSprintsView.handleSearch(this.value)"
                  placeholder="Filter backlog..."
                  class="w-full pl-8 pr-7 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition"
                />
                ${this.searchQuery ? `
                  <button onclick="BacklogSprintsView.handleSearch('')" class="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600">
                    <i data-lucide="x" class="w-3 h-3"></i>
                  </button>
                ` : ''}
              </div>

              <!-- Quick Filter Pills -->
              <div class="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar">
                <button onclick="BacklogSprintsView.setQuickFilter('all')" class="px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer shrink-0 ${this.quickFilter === 'all' ? 'bg-slate-950 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'}">
                  All
                </button>
                <button onclick="BacklogSprintsView.setQuickFilter('my_issues')" class="px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer shrink-0 ${this.quickFilter === 'my_issues' ? 'bg-slate-950 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'}">
                  My Issues
                </button>
                <button onclick="BacklogSprintsView.setQuickFilter('bugs_only')" class="px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer shrink-0 ${this.quickFilter === 'bugs_only' ? 'bg-rose-50 border border-rose-200 text-rose-700 font-black' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'}">
                  Bugs
                </button>
                <button onclick="BacklogSprintsView.setQuickFilter('critical')" class="px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer shrink-0 ${this.quickFilter === 'critical' ? 'bg-amber-50 border border-amber-200 text-amber-800 font-black' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'}">
                  Critical
                </button>
                <button onclick="BacklogSprintsView.setQuickFilter('unestimated')" class="px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer shrink-0 ${this.quickFilter === 'unestimated' ? 'bg-purple-50 border border-purple-200 text-purple-700 font-black' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'}">
                  Unestimated
                </button>
              </div>
            </div>
          </div>

          <!-- Bulk Selection Floating Toolbar -->
          ${this.selectedIssueIds.size > 0 ? `
            <div class="p-2.5 bg-slate-950 text-white border-b border-slate-800 flex items-center justify-between gap-3 animate-fade-in text-xs">
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 rounded bg-[#bef264] text-slate-950 font-black text-xs font-mono">
                  ${this.selectedIssueIds.size} Selected
                </span>
                <span class="font-bold text-slate-200">Move tickets to:</span>
              </div>
              
              <div class="flex items-center gap-2">
                ${activeSprint ? `
                  <button onclick="BacklogSprintsView.handleBulkMove('${activeSprint.id}')" class="px-2.5 py-1 bg-[#bef264] text-slate-950 hover:bg-[#a3e635] rounded-lg font-bold text-[11px] transition cursor-pointer">
                    + Move to ${activeSprint.name}
                  </button>
                ` : ''}

                ${futureSprints.map(fs => `
                  <button onclick="BacklogSprintsView.handleBulkMove('${fs.id}')" class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold text-[11px] transition cursor-pointer">
                    ${fs.name}
                  </button>
                `).join('')}

                <button onclick="BacklogSprintsView.clearSelection()" class="text-slate-400 hover:text-white text-xs px-2 cursor-pointer">
                  Cancel
                </button>
              </div>
            </div>
          ` : ''}

          <!-- Backlog Issues List -->
          <div class="p-3 space-y-1.5 max-h-[500px] overflow-y-auto" ondragover="event.preventDefault()" ondrop="BacklogSprintsView.handleDropToSprint(event, null)">
            ${backlogIssues.length === 0 ? `
              <div class="p-10 text-center text-slate-400 space-y-1.5">
                <i data-lucide="check-circle-2" class="w-8 h-8 mx-auto text-emerald-500"></i>
                <p class="font-bold text-slate-800 text-xs">Product Backlog is Clear</p>
                <p class="text-[11px] text-slate-400">All work items are currently planned into sprints, or add new tickets below.</p>
              </div>
            ` : backlogIssues.map(issue => this.renderIssueRow(issue, null)).join("")}
          </div>

          <!-- Inline Quick Ticket Creator -->
          <div class="px-3 pb-3">
            <div class="flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl transition">
              <i data-lucide="plus" class="w-3.5 h-3.5 text-slate-400 shrink-0"></i>
              <input 
                type="text" 
                id="quickAddBacklog" 
                placeholder="Type new ticket title for Product Backlog (Press Enter)..." 
                onkeydown="if(event.key==='Enter') { BacklogSprintsView.handleQuickCreateTicket(null, this.value, '${project.id}'); this.value=''; }" 
                class="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
              />
              <button 
                onclick="const el = document.getElementById('quickAddBacklog'); if(el && el.value.trim()) { BacklogSprintsView.handleQuickCreateTicket(null, el.value, '${project.id}'); el.value=''; }" 
                class="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-bold shrink-0 transition cursor-pointer"
              >
                Add Ticket
              </button>
            </div>
          </div>

        </div>

        <!-- =========================================================================
             6. COMPLETED SPRINTS ARCHIVE
             ========================================================================= -->
        ${completedSprints.length > 0 ? `
          <div class="space-y-2">
            <details class="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-3.5 cursor-pointer group">
              <summary class="font-bold text-slate-700 text-xs flex items-center justify-between select-none">
                <span class="flex items-center gap-2">
                  <i data-lucide="archive" class="w-4 h-4 text-slate-400"></i>
                  <span>Completed Sprints History (${completedSprints.length})</span>
                </span>
                <span class="text-slate-500 group-hover:text-slate-900 font-semibold text-xs flex items-center gap-1">
                  <span>View Archive</span>
                  <i data-lucide="chevron-down" class="w-3.5 h-3.5 group-open:rotate-180 transition-transform"></i>
                </span>
              </summary>

              <div class="mt-3 pt-3 border-t border-slate-100 space-y-2">
                ${completedSprints.map(s => {
                  const sIssues = allIssues.filter(i => (i.sprintId === s.id || i.sprint_id === s.id));
                  const sDone = sIssues.filter(i => i.status === "Done" || i.status === "Closed" || i.qaStatus === "Passed").length;
                  const sPts = sIssues.reduce((sum, i) => sum + Number(i.storyPoints || i.story_points || 0), 0);

                  return `
                    <div class="p-2.5 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center justify-between text-xs">
                      <div>
                        <span class="font-bold text-slate-900">${s.name}</span>
                        <span class="text-slate-400 ml-2 font-mono text-[10px]">${s.startDate || s.start_date || '—'} → ${s.endDate || s.end_date || '—'}</span>
                        ${s.goal ? `<p class="text-[11px] text-slate-500 mt-0.5">${s.goal}</p>` : ''}
                      </div>
                      <span class="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                        ${sDone}/${sIssues.length} Done (${sPts} SP)
                      </span>
                    </div>
                  `;
                }).join("")}
              </div>
            </details>
          </div>
        ` : ''}

        <!-- Global Modal Container for Sprints -->
        <div id="sprintModalContainer"></div>

      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  filterIssues(issues, activeUser) {
    let list = [...issues];

    if (this.searchQuery && this.searchQuery.trim() !== "") {
      const q = this.searchQuery.toLowerCase().trim();
      list = list.filter(
        i =>
          (i.title && i.title.toLowerCase().includes(q)) ||
          (i.key && i.key.toLowerCase().includes(q)) ||
          (i.description && i.description.toLowerCase().includes(q))
      );
    }

    if (this.quickFilter === "my_issues" && activeUser) {
      list = list.filter(
        i =>
          i.assigneeId === activeUser.id ||
          i.assignee_id === activeUser.id ||
          i.developerId === activeUser.id
      );
    } else if (this.quickFilter === "bugs_only") {
      list = list.filter(i => i.type === "Bug" || i.type === "Defect");
    } else if (this.quickFilter === "critical") {
      list = list.filter(i => (i.priority || "").toLowerCase() === "critical");
    } else if (this.quickFilter === "unestimated") {
      list = list.filter(i => Number(i.storyPoints || i.story_points || 0) === 0);
    }

    return list;
  },

  renderIssueRow(issue, currentSprintId) {
    const devId = issue.developerId || issue.developer_id || issue.assigneeId || issue.assignee_id;
    const dev = (devId && store.getUserById(devId)) || { name: "Unassigned", initials: "UA" };
    const project = store.getActiveProject();
    const sprints = (store.getSprints(project.id) || []).filter(s => s.status !== "completed" && s.status !== "Completed");
    const isSelected = this.selectedIssueIds.has(issue.id);
    const storyPoints = Number(issue.storyPoints || issue.story_points || 0);
    const qaStatus = issue.qaStatus || issue.qa_status || "Not Tested";

    return `
      <div 
        draggable="true" 
        ondragstart="event.dataTransfer.setData('text/plain', '${issue.id}')"
        class="group px-3.5 py-2.5 bg-white hover:bg-slate-50 border ${isSelected ? 'border-indigo-400 bg-indigo-50/20' : 'border-slate-200/80'} rounded-xl shadow-2xs transition flex items-center justify-between gap-3 select-none cursor-grab active:cursor-grabbing"
      >
        <!-- Left Section: Drag, Checkbox, Key, Title -->
        <div class="flex items-center gap-2.5 min-w-0 flex-1">
          <i data-lucide="grip-vertical" class="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 transition shrink-0" title="Drag to reorder or move to sprint"></i>
          
          <input 
            type="checkbox" 
            ${isSelected ? 'checked' : ''} 
            onchange="BacklogSprintsView.toggleIssueSelection('${issue.id}', this.checked)"
            class="w-3.5 h-3.5 rounded text-slate-900 border-slate-300 focus:ring-slate-900 cursor-pointer shrink-0"
          />

          <span class="px-2 py-0.5 rounded-md font-mono font-bold text-[10px] shrink-0 inline-flex items-center gap-1 ${
            issue.type === 'Bug' || issue.type === 'Defect' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
            issue.type === 'Story' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
            'bg-blue-50 text-blue-700 border border-blue-200'
          }">
            <i data-lucide="${issue.type === 'Bug' || issue.type === 'Defect' ? 'bug' : issue.type === 'Story' ? 'bookmark' : 'check-square'}" class="w-3 h-3"></i>
            ${issue.key}
          </span>

          <span 
            onclick="window.app.openIssueDetails('${issue.id}')" 
            class="font-bold text-slate-900 hover:text-indigo-600 cursor-pointer transition text-xs truncate max-w-md sm:max-w-xl" 
            title="${issue.title}"
          >
            ${issue.title}
          </span>

          ${issue.priority === 'Critical' ? `
            <span class="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 text-[9px] font-black shrink-0">P0 Critical</span>
          ` : ''}
        </div>

        <!-- Right Section: Clean Aligned Metadata -->
        <div class="flex items-center gap-2 shrink-0">
          
          <!-- QA Quality Gate Status Indicator -->
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${
            qaStatus === 'Passed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
            qaStatus === 'Failed' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
            qaStatus === 'Testing' || qaStatus === 'QA Testing' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
            qaStatus === 'Ready for QA' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
            'bg-slate-100 text-slate-600 border border-slate-200'
          }" title="QA Verification Gate">
            ${qaStatus === 'Passed' ? '✓ Passed' : qaStatus}
          </span>

          <!-- Story Points Quick Estimator -->
          <select 
            onchange="BacklogSprintsView.handleQuickSP('${issue.id}', this.value)"
            class="appearance-none px-2 py-0.5 rounded-md font-mono font-bold text-[10px] cursor-pointer transition focus:outline-none ${storyPoints > 0 ? 'bg-[#bef264] text-slate-950 font-black' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}"
            title="Story Points Estimation"
          >
            <option value="0" ${storyPoints === 0 ? 'selected' : ''}>0 SP</option>
            <option value="1" ${storyPoints === 1 ? 'selected' : ''}>1 SP</option>
            <option value="2" ${storyPoints === 2 ? 'selected' : ''}>2 SP</option>
            <option value="3" ${storyPoints === 3 ? 'selected' : ''}>3 SP</option>
            <option value="5" ${storyPoints === 5 ? 'selected' : ''}>5 SP</option>
            <option value="8" ${storyPoints === 8 ? 'selected' : ''}>8 SP</option>
            <option value="13" ${storyPoints === 13 ? 'selected' : ''}>13 SP</option>
          </select>

          <!-- Workflow Status Badge -->
          <span class="px-2 py-0.5 rounded text-[10px] font-semibold ${
            issue.status === 'Done' || issue.status === 'Closed' ? 'bg-emerald-50 text-emerald-700' :
            issue.status === 'In Progress' ? 'bg-amber-50 text-amber-800' :
            issue.status === 'Ready for QA' ? 'bg-purple-50 text-purple-700' :
            'bg-slate-100 text-slate-600'
          }">
            ${issue.status}
          </span>

          <!-- Assignee Avatar -->
          <div class="w-5 h-5 rounded-full bg-slate-900 text-white text-[9px] font-bold flex items-center justify-center shrink-0" title="Assignee: ${dev.name}">
            ${dev.initials || 'U'}
          </div>

          <!-- Sprint Mover Dropdown -->
          <select 
            onchange="BacklogSprintsView.handleMoveSprint('${issue.id}', this.value)" 
            class="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-700 focus:outline-none cursor-pointer"
            title="Move ticket to sprint"
          >
            <option value="" ${!issue.sprintId && !issue.sprint_id ? 'selected' : ''}>Backlog</option>
            ${sprints.map(s => `
              <option value="${s.id}" ${(issue.sprintId === s.id || issue.sprint_id === s.id) ? 'selected' : ''}>
                ${s.name} ${s.status === 'active' || s.status === 'Active' ? '(Active)' : ''}
              </option>
            `).join("")}
          </select>

          <!-- Open Drawer Action -->
          <button onclick="window.app.openIssueDetails('${issue.id}')" class="p-1 text-slate-400 hover:text-slate-800 transition cursor-pointer" title="View details">
            <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </div>
    `;
  },

  handleSearch(val) {
    this.searchQuery = val;
    this.render(document.getElementById("mainContent"));
  },

  setQuickFilter(filter) {
    this.quickFilter = filter;
    this.render(document.getElementById("mainContent"));
  },

  toggleIssueSelection(issueId, isChecked) {
    if (isChecked) {
      this.selectedIssueIds.add(issueId);
    } else {
      this.selectedIssueIds.delete(issueId);
    }
    this.render(document.getElementById("mainContent"));
  },

  clearSelection() {
    this.selectedIssueIds.clear();
    this.render(document.getElementById("mainContent"));
  },

  toggleSprintCollapse(sprintId) {
    if (this.collapsedSprints.has(sprintId)) {
      this.collapsedSprints.delete(sprintId);
    } else {
      this.collapsedSprints.add(sprintId);
    }
    this.render(document.getElementById("mainContent"));
  },

  async handleQuickSP(issueId, points) {
    if (store.quickUpdateStoryPoints) {
      await store.quickUpdateStoryPoints(issueId, points);
    }
    this.render(document.getElementById("mainContent"));
  },

  handleDropToSprint(e, targetSprintId) {
    e.preventDefault();
    const issueId = e.dataTransfer.getData("text/plain");
    if (!issueId) return;
    this.handleMoveSprint(issueId, targetSprintId || "");
  },

  async handleMoveSprint(issueId, targetSprintId) {
    const sprintId = targetSprintId ? targetSprintId : null;
    await store.moveIssueToSprint(issueId, sprintId);
    
    const issue = store.getIssueById(issueId);
    const targetName = sprintId ? (store.getSprintById(sprintId)?.name || "Sprint") : "Product Backlog";
    if (window.app && window.app.toast) {
      window.app.toast("Sprint Updated", `Moved ${issue ? issue.key : 'Ticket'} to ${targetName}`, "info");
    }

    this.render(document.getElementById("mainContent"));
  },

  async handleBulkMove(targetSprintId) {
    const ids = Array.from(this.selectedIssueIds);
    if (ids.length === 0) return;

    if (store.bulkMoveIssuesToSprint) {
      await store.bulkMoveIssuesToSprint(ids, targetSprintId);
    } else {
      for (const id of ids) {
        await store.moveIssueToSprint(id, targetSprintId);
      }
    }

    const targetName = targetSprintId ? (store.getSprintById(targetSprintId)?.name || "Sprint") : "Product Backlog";
    if (window.app && window.app.toast) {
      window.app.toast("Bulk Updated", `Moved ${ids.length} tickets to ${targetName}`, "success");
    }

    this.selectedIssueIds.clear();
    this.render(document.getElementById("mainContent"));
  },

  /* =========================================================================
     SPRINT MANAGEMENT MODALS (Streamlined & Frictionless)
     ========================================================================= */

  openStartSprintModal(sprintId) {
    const sprint = store.getSprintById(sprintId);
    if (!sprint) return;

    const project = store.getActiveProject();
    const allIssues = store.getIssues(project.id) || [];
    const sprintIssues = allIssues.filter(i => (i.sprintId === sprint.id || i.sprint_id === sprint.id));
    const totalPoints = sprintIssues.reduce((sum, i) => sum + Number(i.storyPoints || i.story_points || 0), 0);

    const container = document.getElementById("sprintModalContainer");
    if (!container) return;

    container.innerHTML = `
      <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 animate-fade-in text-xs space-y-4 font-sans">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 class="text-sm font-bold text-slate-900 flex items-center gap-2">
              <i data-lucide="play" class="w-4 h-4 text-emerald-600"></i> Start Sprint
            </h3>
            <button onclick="document.getElementById('sprintModalContainer').innerHTML=''" class="text-slate-400 hover:text-slate-600 cursor-pointer">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>

          <div class="space-y-3">
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div class="font-bold text-slate-900">${sprint.name}</div>
              <div class="text-slate-500 text-[11px] mt-0.5">${sprintIssues.length} tickets ready • <strong class="text-slate-800 font-mono">${totalPoints} Story Points</strong></div>
            </div>

            <div>
              <label class="block font-medium text-slate-600 mb-1">Sprint Goal <span class="text-slate-400 font-normal">(Optional)</span></label>
              <input type="text" id="startSprintGoal" value="${sprint.goal || ''}" placeholder="e.g. Complete core checkout and bug fixes" class="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 focus:outline-none" />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-medium text-slate-600 mb-1">Start Date <span class="text-slate-400 font-normal">(Optional)</span></label>
                <input type="date" id="startSprintStartDate" value="${sprint.startDate || sprint.start_date || new Date().toISOString().split('T')[0]}" class="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 focus:outline-none" />
              </div>
              <div>
                <label class="block font-medium text-slate-600 mb-1">End Date <span class="text-slate-400 font-normal">(Optional)</span></label>
                <input type="date" id="startSprintEndDate" value="${sprint.endDate || sprint.end_date || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]}" class="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 focus:outline-none" />
              </div>
            </div>
          </div>

          <div class="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button onclick="document.getElementById('sprintModalContainer').innerHTML=''" class="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer">
              Cancel
            </button>
            <button onclick="BacklogSprintsView.confirmStartSprint('${sprint.id}')" class="px-4 py-1.5 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 font-bold rounded-xl shadow-2xs transition cursor-pointer">
              Start Sprint
            </button>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  async confirmStartSprint(sprintId) {
    const goal = document.getElementById("startSprintGoal")?.value?.trim() || "";
    const startDate = document.getElementById("startSprintStartDate")?.value || "";
    const endDate = document.getElementById("startSprintEndDate")?.value || "";

    await store.updateSprint(sprintId, { goal, startDate, endDate });
    await store.startSprint(sprintId);

    document.getElementById("sprintModalContainer").innerHTML = "";
    if (window.app && window.app.toast) {
      window.app.toast("Sprint Started", "Sprint is now active.", "success");
    }
    this.render(document.getElementById("mainContent"));
  },

  openCompleteSprintModal(sprintId) {
    const sprint = store.getSprintById(sprintId);
    if (!sprint) return;

    const project = store.getActiveProject();
    const allIssues = store.getIssues(project.id) || [];
    const sprintIssues = allIssues.filter(i => (i.sprintId === sprint.id || i.sprint_id === sprint.id));
    const completedIssues = sprintIssues.filter(i => i.status === 'Done' || i.status === 'Closed' || i.qaStatus === 'Passed');
    const incompleteIssues = sprintIssues.filter(i => i.status !== 'Done' && i.status !== 'Closed' && i.qaStatus !== 'Passed');
    const futureSprints = (store.getSprints(project.id) || []).filter(s => s.id !== sprint.id && s.status !== 'completed' && s.status !== 'Completed');

    const container = document.getElementById("sprintModalContainer");
    if (!container) return;

    container.innerHTML = `
      <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 animate-fade-in text-xs space-y-4 font-sans">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 class="text-sm font-bold text-slate-900 flex items-center gap-2">
              <i data-lucide="check-check" class="w-4 h-4 text-emerald-600"></i> Complete Sprint
            </h3>
            <button onclick="document.getElementById('sprintModalContainer').innerHTML=''" class="text-slate-400 hover:text-slate-600 cursor-pointer">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>

          <div class="space-y-3">
            <div class="grid grid-cols-2 gap-2.5 text-center">
              <div class="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200">
                <span class="text-[10px] font-bold text-emerald-700 uppercase block">Completed</span>
                <span class="text-lg font-black text-emerald-800 font-mono">${completedIssues.length}</span>
              </div>
              <div class="p-2.5 bg-amber-50 rounded-xl border border-amber-200">
                <span class="text-[10px] font-bold text-amber-700 uppercase block">Incomplete</span>
                <span class="text-lg font-black text-amber-800 font-mono">${incompleteIssues.length}</span>
              </div>
            </div>

            ${incompleteIssues.length > 0 ? `
              <div>
                <label class="block font-medium text-slate-700 mb-1">Move incomplete tickets to:</label>
                <select id="completeSprintDestination" class="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none">
                  <option value="backlog">Product Backlog</option>
                  ${futureSprints.map(fs => `
                    <option value="${fs.id}">${fs.name} (Planned)</option>
                  `).join('')}
                </select>
              </div>
            ` : `
              <p class="text-emerald-700 font-medium text-center py-2">All tickets in this sprint are verified and completed!</p>
            `}
          </div>

          <div class="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button onclick="document.getElementById('sprintModalContainer').innerHTML=''" class="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer">
              Cancel
            </button>
            <button onclick="BacklogSprintsView.confirmCompleteSprint('${sprint.id}')" class="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-2xs transition cursor-pointer">
              Complete Sprint
            </button>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  async confirmCompleteSprint(sprintId) {
    const dest = document.getElementById("completeSprintDestination")?.value || "backlog";
    await store.completeSprint(sprintId, dest);

    document.getElementById("sprintModalContainer").innerHTML = "";
    if (window.app && window.app.toast) {
      window.app.toast("Sprint Completed", "Sprint closed successfully.", "success");
    }
    this.render(document.getElementById("mainContent"));
  },

  async handleDeleteSprint(sprintId) {
    const sprint = store.getSprintById(sprintId);
    if (!sprint) return;

    if (!confirm(`Delete "${sprint.name}"? Assigned tickets will roll over to the Backlog.`)) {
      return;
    }

    await store.deleteSprint(sprintId);
    if (window.app && window.app.toast) {
      window.app.toast("Sprint Deleted", `${sprint.name} removed.`, "info");
    }
    this.render(document.getElementById("mainContent"));
  },

  openCreateSprintModal(projectId) {
    const project = store.getProjectById(projectId) || store.getActiveProject();
    const container = document.getElementById("sprintModalContainer") || document.getElementById("globalModalContainer");
    if (!container) return;

    const today = new Date().toISOString().split("T")[0];
    const twoWeeksLater = new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0];

    container.innerHTML = `
      <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 animate-fade-in text-xs space-y-4 font-sans">
          
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 class="text-sm font-bold text-slate-900 flex items-center gap-2">
              <i data-lucide="flag" class="w-4 h-4 text-slate-900"></i> Create Sprint
            </h3>
            <button onclick="document.getElementById('sprintModalContainer').innerHTML=''" class="text-slate-400 hover:text-slate-600 cursor-pointer">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>

          <form onsubmit="BacklogSprintsView.handleCreateSprintSubmit(event, '${project.id}')" class="space-y-3">
            <div>
              <label class="block font-medium text-slate-700 mb-1">Sprint Name *</label>
              <input type="text" id="newSprintName" required placeholder="e.g. Sprint 12 - Performance & QA" class="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 focus:outline-none" />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-medium text-slate-700 mb-1">Start Date <span class="text-slate-400 font-normal">(Optional)</span></label>
                <input type="date" id="newSprintStart" value="${today}" class="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 focus:outline-none" />
              </div>
              <div>
                <label class="block font-medium text-slate-700 mb-1">End Date <span class="text-slate-400 font-normal">(Optional)</span></label>
                <input type="date" id="newSprintEnd" value="${twoWeeksLater}" class="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 focus:outline-none" />
              </div>
            </div>

            <div>
              <label class="block font-medium text-slate-700 mb-1">Sprint Goal <span class="text-slate-400 font-normal">(Optional)</span></label>
              <input type="text" id="newSprintGoal" placeholder="Key delivery or testing target..." class="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 focus:outline-none" />
            </div>

            <div class="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button type="button" onclick="document.getElementById('sprintModalContainer').innerHTML=''" class="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer">
                Cancel
              </button>
              <button type="submit" class="px-4 py-1.5 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 font-bold rounded-xl shadow-2xs transition cursor-pointer">
                Create Sprint
              </button>
            </div>
          </form>

        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  async handleCreateSprintSubmit(e, projectId) {
    e.preventDefault();
    const name = document.getElementById("newSprintName").value.trim();
    const startDate = document.getElementById("newSprintStart")?.value || "";
    const endDate = document.getElementById("newSprintEnd")?.value || "";
    const goal = document.getElementById("newSprintGoal")?.value?.trim() || "";

    await store.createSprint({
      projectId,
      name,
      startDate,
      endDate,
      goal,
      status: "future"
    });

    document.getElementById("sprintModalContainer").innerHTML = "";
    if (window.app && window.app.toast) {
      window.app.toast("Sprint Created", `Created ${name}`, "success");
    }
    this.render(document.getElementById("mainContent"));
  },

  openEditSprintModal(sprintId) {
    const sprint = store.getSprintById(sprintId);
    if (!sprint) return;

    const container = document.getElementById("sprintModalContainer") || document.getElementById("globalModalContainer");
    if (!container) return;

    container.innerHTML = `
      <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 animate-fade-in text-xs space-y-4 font-sans">
          
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 class="text-sm font-bold text-slate-900 flex items-center gap-2">
              <i data-lucide="edit-2" class="w-4 h-4 text-slate-900"></i> Edit Sprint
            </h3>
            <button onclick="document.getElementById('sprintModalContainer').innerHTML=''" class="text-slate-400 hover:text-slate-600 cursor-pointer">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>

          <form onsubmit="BacklogSprintsView.handleEditSprintSubmit(event, '${sprint.id}')" class="space-y-3">
            <div>
              <label class="block font-medium text-slate-700 mb-1">Sprint Name *</label>
              <input type="text" id="editSprintName" required value="${sprint.name}" class="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 focus:outline-none" />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-medium text-slate-700 mb-1">Start Date <span class="text-slate-400 font-normal">(Optional)</span></label>
                <input type="date" id="editSprintStart" value="${sprint.startDate || sprint.start_date || ''}" class="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 focus:outline-none" />
              </div>
              <div>
                <label class="block font-medium text-slate-700 mb-1">End Date <span class="text-slate-400 font-normal">(Optional)</span></label>
                <input type="date" id="editSprintEnd" value="${sprint.endDate || sprint.end_date || ''}" class="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 focus:outline-none" />
              </div>
            </div>

            <div>
              <label class="block font-medium text-slate-700 mb-1">Sprint Goal <span class="text-slate-400 font-normal">(Optional)</span></label>
              <input type="text" id="editSprintGoal" value="${sprint.goal || ''}" class="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 focus:outline-none" />
            </div>

            <div class="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button type="button" onclick="document.getElementById('sprintModalContainer').innerHTML=''" class="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer">
                Cancel
              </button>
              <button type="submit" class="px-4 py-1.5 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 font-bold rounded-xl shadow-2xs transition cursor-pointer">
                Save Changes
              </button>
            </div>
          </form>

        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  async handleEditSprintSubmit(e, sprintId) {
    e.preventDefault();
    const name = document.getElementById("editSprintName").value.trim();
    const startDate = document.getElementById("editSprintStart")?.value || "";
    const endDate = document.getElementById("editSprintEnd")?.value || "";
    const goal = document.getElementById("editSprintGoal")?.value?.trim() || "";

    await store.updateSprint(sprintId, {
      name,
      startDate,
      endDate,
      goal
    });

    document.getElementById("sprintModalContainer").innerHTML = "";
    if (window.app && window.app.toast) {
      window.app.toast("Sprint Updated", `Saved changes for ${name}`, "success");
    }
    this.render(document.getElementById("mainContent"));
  },

  async handleQuickCreateTicket(sprintId, title, projectId) {
    if (!title || !title.trim()) return;
    const project = (store.getProjectById && store.getProjectById(projectId)) || store.getActiveProject();
    if (!project) return;

    await store.createIssue({
      projectId: project.id,
      sprintId: sprintId || null,
      title: title.trim(),
      type: "Task",
      priority: "Medium",
      status: sprintId ? "To Do" : "Backlog",
      storyPoints: 0
    });

    if (window.app && window.app.toast) {
      window.app.toast("Ticket Created", `Added "${title.trim()}"`, "success");
    }
    this.render(document.getElementById("mainContent"));
  }
};

if (typeof window !== "undefined") window.BacklogSprintsView = BacklogSprintsView;
if (typeof global !== "undefined") global.BacklogSprintsView = BacklogSprintsView;
if (typeof module !== "undefined" && module.exports) module.exports = BacklogSprintsView;
