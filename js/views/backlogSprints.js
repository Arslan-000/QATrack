/**
 * All-in-One Software Project & QA Management Platform (V1)
 * Dedicated Backlog & Sprints Planning & Execution View
 */

const BacklogSprintsView = {
  activeSprintTab: "all", // 'all', 'current', 'future', 'backlog'

  render(container) {
    const project = store.getActiveProject();
    if (!project) {
      container.innerHTML = `<div class="p-8 text-center text-slate-500">Project not found.</div>`;
      return;
    }

    const sprints = store.getSprints(project.id);
    const activeSprint = sprints.find(s => s.status === "active") || sprints[0];
    const futureSprints = sprints.filter(s => s.status === "future");
    const completedSprints = sprints.filter(s => s.status === "completed");

    const allIssues = store.getIssues(project.id);
    const backlogIssues = allIssues.filter(i => !i.sprintId);
    const activeSprintIssues = activeSprint ? allIssues.filter(i => i.sprintId === activeSprint.id) : [];

    // Active sprint breakdown
    const doneCount = activeSprintIssues.filter(i => i.status === "Done" || i.status === "Closed" || i.qaStatus === "Passed").length;
    const qaCount = activeSprintIssues.filter(i => i.status === "QA" || i.status === "Ready for QA" || i.status === "QA Testing" || i.qaStatus === "Testing").length;
    const inDevCount = activeSprintIssues.filter(i => i.status === "In Progress" || i.status === "In Development").length;
    const blockedCount = activeSprintIssues.filter(i => i.qaStatus === "Blocked").length;
    const todoCount = activeSprintIssues.filter(i => i.status === "To Do" || i.status === "Backlog" || i.status === "Open").length;

    const progressPct = activeSprintIssues.length > 0 ? Math.round((doneCount / activeSprintIssues.length) * 100) : 0;

    container.innerHTML = `
      <div class="space-y-6 animate-fade-in pb-12 text-xs">
        
        <!-- =========================================================================
             1. HEADER: CONTEXT & ACTIONS
             ========================================================================= -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-slate-100 text-slate-700">${project.key}</span>
              <h1 class="text-xl font-bold text-slate-900 tracking-tight">Backlog & Sprints Planning</h1>
            </div>
            <p class="text-slate-500 text-xs">Manage product backlog, groom sprint cycles, and transition work items through QA quality gates.</p>
          </div>

          <div class="flex flex-wrap items-center gap-2.5">
            <button onclick="BacklogSprintsView.openCreateSprintModal('${project.id}')" class="px-4 py-2 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 rounded-xl font-black shadow-xs shadow-[#bef264]/25 transition flex items-center gap-1.5 cursor-pointer">
              <i data-lucide="flag" class="w-4 h-4 text-slate-950"></i>
              <span>Create Sprint</span>
            </button>

            <button onclick="window.app.openCreateIssueModal('${project.id}')" class="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white rounded-xl font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer">
              <i data-lucide="plus" class="w-4 h-4 text-[#bef264]"></i>
              <span>Create Issue</span>
            </button>

            <button onclick="window.app.openProjectWorkspace('${project.id}', 'board')" class="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition flex items-center gap-1.5 cursor-pointer" title="Open Kanban Board">
              <i data-lucide="kanban" class="w-4 h-4 text-slate-600"></i>
              <span class="hidden sm:inline">Open Board</span>
            </button>
          </div>
        </div>

        <!-- =========================================================================
             2. CURRENT SPRINT HERO CARD
             ========================================================================= -->
        ${activeSprint ? `
          <div class="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden" id="sprint-${activeSprint.id}">
            
            <!-- Active Sprint Header -->
            <div class="p-5 bg-gradient-to-r from-slate-50/90 via-[#f7fee7]/40 to-white border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              
              <div class="space-y-1.5">
                <div class="flex items-center gap-2.5 flex-wrap">
                  <span class="px-2.5 py-0.5 rounded-full bg-[#f7fee7] border border-[#d9f99d] text-[#4d7c0f] font-extrabold text-[10px] uppercase tracking-wider shadow-2xs">
                    Current Active Sprint
                  </span>
                  <h2 class="text-base font-bold text-slate-900">${activeSprint.name}</h2>
                  <span class="text-slate-400 font-medium text-xs">•</span>
                  <span class="text-slate-600 font-semibold flex items-center gap-1 text-xs">
                    <i data-lucide="calendar" class="w-3.5 h-3.5 text-slate-400"></i>
                    ${activeSprint.startDate} – ${activeSprint.endDate}
                  </span>
                  <span class="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold font-mono text-[10px]">
                    ${activeSprintIssues.length} Issues
                  </span>
                </div>

                ${activeSprint.goal ? `
                  <p class="text-xs text-slate-600 font-medium flex items-center gap-1.5 pt-0.5">
                    <i data-lucide="target" class="w-3.5 h-3.5 text-indigo-600 shrink-0"></i>
                    <span><strong>Sprint Goal:</strong> ${activeSprint.goal}</span>
                  </p>
                ` : ''}
              </div>

              <!-- Sprint Action Buttons -->
              <div class="flex items-center gap-2 shrink-0">
                <button onclick="BacklogSprintsView.openEditSprintModal('${activeSprint.id}')" class="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg font-semibold transition flex items-center gap-1">
                  <i data-lucide="edit-3" class="w-3.5 h-3.5 text-slate-500"></i> Edit
                </button>
                <button onclick="BacklogSprintsView.handleCompleteSprint('${activeSprint.id}')" class="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-2xs transition flex items-center gap-1">
                  <i data-lucide="check-check" class="w-3.5 h-3.5"></i> Complete Sprint
                </button>
              </div>

            </div>

            <!-- Sprint Telemetry Breakdown Strip -->
            <div class="p-4 bg-slate-50/60 border-b border-slate-100 grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
              <div class="p-2 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                <span class="text-[10px] uppercase font-bold text-slate-400 block">Done / Verified</span>
                <span class="text-base font-bold text-emerald-600">${doneCount}</span>
              </div>
              <div class="p-2 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                <span class="text-[10px] uppercase font-bold text-purple-600 block">QA Testing</span>
                <span class="text-base font-bold text-purple-700">${qaCount}</span>
              </div>
              <div class="p-2 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                <span class="text-[10px] uppercase font-bold text-amber-600 block">In Development</span>
                <span class="text-base font-bold text-amber-600">${inDevCount}</span>
              </div>
              <div class="p-2 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                <span class="text-[10px] uppercase font-bold text-red-600 block">Blocked / Flaky</span>
                <span class="text-base font-bold text-red-600">${blockedCount}</span>
              </div>
              <div class="p-2 bg-white rounded-xl border border-slate-200/80 shadow-2xs col-span-2 sm:col-span-1">
                <span class="text-[10px] uppercase font-bold text-slate-900 block">Progress</span>
                <span class="text-base font-bold text-slate-900">${progressPct}%</span>
              </div>
            </div>

            <!-- Active Sprint Issues List -->
            <div class="p-4 space-y-2 max-h-[500px] overflow-y-auto" ondragover="event.preventDefault()" ondrop="BacklogSprintsView.handleDropToSprint(event, '${activeSprint.id}')">
              ${activeSprintIssues.length === 0 ? `
                <div class="p-8 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                  <i data-lucide="layers" class="w-8 h-8 mx-auto mb-2 text-slate-300"></i>
                  <p class="font-bold text-slate-700">Sprint is Empty</p>
                  <p class="text-[11px] text-slate-400 mt-0.5">Drag issues from Product Backlog below or click 'Move to Sprint'.</p>
                </div>
              ` : activeSprintIssues.map(issue => this.renderIssueRow(issue, activeSprint.id)).join("")}
            </div>

          </div>
        ` : ''}

        <!-- =========================================================================
             3. FUTURE SPRINTS SECTION
             ========================================================================= -->
        ${futureSprints.length > 0 ? `
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <h3 class="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <i data-lucide="calendar-plus" class="w-4 h-4 text-indigo-600"></i>
                <span>Future Sprints (${futureSprints.length})</span>
              </h3>
            </div>

            ${futureSprints.map(s => {
              const sprintIssues = allIssues.filter(i => i.sprintId === s.id);
              return `
                <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" id="sprint-${s.id}">
                  <div class="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div class="flex items-center gap-2.5 flex-wrap">
                      <span class="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-bold text-[10px] uppercase">Planned</span>
                      <h4 class="font-bold text-slate-900">${s.name}</h4>
                      <span class="text-slate-400 text-xs">•</span>
                      <span class="text-slate-500 font-medium text-xs">${s.startDate} – ${s.endDate}</span>
                      <span class="px-1.5 py-0.2 bg-slate-100 text-slate-700 font-mono font-bold text-[10px] rounded">${sprintIssues.length} Issues</span>
                    </div>

                    <div class="flex items-center gap-2">
                      <button onclick="BacklogSprintsView.handleStartSprint('${s.id}')" class="px-3 py-1 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 rounded-lg font-bold text-[11px] shadow-xs shadow-[#bef264]/25 transition flex items-center gap-1">
                        <i data-lucide="play" class="w-3 h-3"></i> Start Sprint
                      </button>
                      <button onclick="BacklogSprintsView.openEditSprintModal('${s.id}')" class="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 transition">
                        <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                      </button>
                    </div>
                  </div>

                  <div class="p-3 space-y-2 max-h-64 overflow-y-auto" ondragover="event.preventDefault()" ondrop="BacklogSprintsView.handleDropToSprint(event, '${s.id}')">
                    ${sprintIssues.length === 0 ? `
                      <p class="py-4 text-center text-slate-400 text-xs">No issues assigned to this planned sprint yet.</p>
                    ` : sprintIssues.map(issue => this.renderIssueRow(issue, s.id)).join("")}
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        ` : ''}

        <!-- =========================================================================
             4. PRODUCT BACKLOG SECTION
             ========================================================================= -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          
          <!-- Backlog Header -->
          <div class="p-4 bg-slate-50/90 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="flex items-center gap-2.5">
              <div class="p-1.5 rounded-lg bg-amber-50 text-amber-600 font-bold">
                <i data-lucide="inbox" class="w-4 h-4"></i>
              </div>
              <div>
                <h3 class="font-bold text-slate-900 text-sm">Product Backlog</h3>
                <p class="text-[11px] text-slate-500">Unassigned issues ready for sprint planning and estimation</p>
              </div>
              <span class="px-2 py-0.5 rounded-full font-mono font-bold text-[10px] bg-amber-100 text-amber-800 ml-1">
                ${backlogIssues.length} Issues
              </span>
            </div>

            <button onclick="window.app.openCreateIssueModal('${project.id}')" class="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg font-bold text-[11px] transition flex items-center gap-1">
              <i data-lucide="plus" class="w-3.5 h-3.5 text-slate-900"></i> Add to Backlog
            </button>
          </div>

          <!-- Backlog Issues List -->
          <div class="p-4 space-y-2 max-h-96 overflow-y-auto" ondragover="event.preventDefault()" ondrop="BacklogSprintsView.handleDropToSprint(event, null)">
            ${backlogIssues.length === 0 ? `
              <div class="p-8 text-center text-slate-400">
                <i data-lucide="check-circle" class="w-8 h-8 mx-auto mb-2 text-emerald-400"></i>
                <p class="font-bold text-slate-700">Backlog Groomed Clean</p>
                <p class="text-[11px] text-slate-400">All work items are currently assigned to active or future sprints.</p>
              </div>
            ` : backlogIssues.map(issue => this.renderIssueRow(issue, null)).join("")}
          </div>

        </div>

        <!-- =========================================================================
             5. COMPLETED SPRINTS ARCHIVE (Collapsible)
             ========================================================================= -->
        ${completedSprints.length > 0 ? `
          <div class="space-y-2">
            <details class="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 cursor-pointer group">
              <summary class="font-bold text-slate-700 text-xs flex items-center justify-between select-none">
                <span class="flex items-center gap-2">
                  <i data-lucide="archive" class="w-4 h-4 text-slate-400"></i>
                  <span>Completed Sprints Archive (${completedSprints.length})</span>
                </span>
                <span class="text-slate-900 hover:text-[#4d7c0f] font-semibold text-[11px]">View History</span>
              </summary>

              <div class="mt-3.5 pt-3 border-t border-slate-100 space-y-2.5">
                ${completedSprints.map(s => {
                  const sIssues = allIssues.filter(i => i.sprintId === s.id);
                  return `
                    <div class="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                      <div>
                        <span class="font-bold text-slate-900">${s.name}</span>
                        <span class="text-slate-400 ml-2">${s.startDate} – ${s.endDate}</span>
                        <p class="text-[11px] text-slate-500 mt-0.5">${s.goal || 'Completed sprint cycles.'}</p>
                      </div>
                      <span class="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                        100% QA Signed
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

  renderIssueRow(issue, currentSprintId) {
    const devId = issue.developerId || issue.developer_id || issue.assigneeId || issue.assignee_id;
    const qaId = issue.qaId || issue.qa_id;
    const dev = (devId && store.getUserById(devId)) || { name: "Unassigned", initials: "UA" };
    const qa = (qaId && store.getUserById(qaId)) || { name: "Unassigned", initials: "QA" };
    const project = store.getActiveProject();
    const sprints = store.getSprints(project.id);
    const gate = store.getQualityGate(issue);

    return `
      <div 
        draggable="true" 
        ondragstart="event.dataTransfer.setData('text/plain', '${issue.id}')"
        class="p-3 bg-white hover:bg-slate-50/80 border border-slate-200 rounded-xl shadow-2xs transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 group select-none cursor-grab active:cursor-grabbing"
      >
        <!-- Left: Key, Type, Title & Criteria -->
        <div class="flex items-start gap-2.5 min-w-0 flex-1">
          <span class="px-1.5 py-0.5 rounded font-mono font-bold text-[10px] shrink-0 mt-0.5 ${issue.type === 'Bug' ? 'type-bug' : issue.type === 'Story' ? 'type-story' : 'type-task'}">
            ${issue.key}
          </span>

          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2 flex-wrap">
              <h4 onclick="window.app.openIssueDetails('${issue.id}')" class="font-bold text-slate-900 hover:text-[#4d7c0f] cursor-pointer transition text-xs truncate">
                ${issue.title}
              </h4>
              ${issue.storyPoints ? `<span class="sp-pill">${issue.storyPoints} SP</span>` : ''}
            </div>

            <!-- Sub-meta: Environment, Release, Assignees -->
            <div class="flex items-center gap-2 mt-1 text-[10px] text-slate-500 flex-wrap">
              <span class="font-semibold text-slate-700">Dev: ${(dev.name || 'Unassigned').split(" ")[0]}</span>
              <span>•</span>
              <span class="font-semibold text-purple-700">QA: ${(qa.name || 'Unassigned').split(" ")[0]}</span>
              <span>•</span>
              <span class="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono">${issue.environment || 'Staging'}</span>
              <span>•</span>
              <span class="text-slate-400">${issue.releaseVersion || 'v2.4.1'}</span>
            </div>
          </div>
        </div>

        <!-- Right: Status, Quality Gate & Sprint Selector -->
        <div class="flex items-center gap-2 shrink-0 self-end sm:self-center">
          
          <!-- Quality Gate Indicator Badge (Section 9) -->
          <div class="hidden md:inline-flex">
            ${gate.isPassed ? `
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <i data-lucide="check" class="w-3 h-3 text-emerald-600"></i> QA Verified
              </span>
            ` : gate.status === 'failed' ? `
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200 flex items-center gap-1">
                <i data-lucide="alert-triangle" class="w-3 h-3 text-red-600"></i> QA Failed (${issue.reopenCount || 1}x)
              </span>
            ` : `
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                <i data-lucide="clock" class="w-3 h-3 text-purple-600"></i> QA Pending
              </span>
            `}
          </div>

          <!-- Priority Badge -->
          <span class="px-2 py-0.5 rounded text-[10px] font-bold ${
            issue.priority === 'Critical' ? 'priority-critical' :
            issue.priority === 'High' ? 'priority-high' :
            issue.priority === 'Medium' ? 'priority-medium' : 'priority-low'
          }">
            ${issue.priority}
          </span>

          <!-- Sprint Mover Dropdown -->
          <select 
            onchange="BacklogSprintsView.handleMoveSprint('${issue.id}', this.value)" 
            class="bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-700 focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] cursor-pointer"
          >
            <option value="" ${!issue.sprintId ? 'selected' : ''}>Product Backlog</option>
            ${sprints.map(s => `
              <option value="${s.id}" ${issue.sprintId === s.id ? 'selected' : ''}>${s.name} ${s.status === 'active' ? '(Active)' : ''}</option>
            `).join("")}
          </select>

          <!-- Inspect Action -->
          <button onclick="window.app.openIssueDetails('${issue.id}')" class="p-1 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition" title="Inspect Issue">
            <i data-lucide="chevron-right" class="w-4 h-4"></i>
          </button>
        </div>

      </div>
    `;
  },

  handleDropToSprint(e, targetSprintId) {
    e.preventDefault();
    const issueId = e.dataTransfer.getData("text/plain");
    if (!issueId) return;

    this.handleMoveSprint(issueId, targetSprintId || "");
  },

  handleMoveSprint(issueId, targetSprintId) {
    const sprintId = targetSprintId ? targetSprintId : null;
    store.moveIssueToSprint(issueId, sprintId);
    
    const issue = store.getIssueById(issueId);
    const targetName = sprintId ? store.getSprintById(sprintId)?.name : "Product Backlog";
    window.app.showToast("Sprint Updated", `Moved ${issue.key} to ${targetName}`, "info");

    const contentArea = document.getElementById("mainContent");
    this.render(contentArea);
  },

  handleStartSprint(sprintId) {
    store.startSprint(sprintId);
    const sprint = store.getSprintById(sprintId);
    window.app.showToast("Sprint Started", `${sprint.name} is now active!`, "success");
    const contentArea = document.getElementById("mainContent");
    this.render(contentArea);
  },

  handleCompleteSprint(sprintId) {
    const sprint = store.getSprintById(sprintId);
    if (!confirm(`Complete ${sprint.name}? All unverified issues will roll over to Backlog or next Sprint.`)) return;

    store.completeSprint(sprintId);
    window.app.showToast("Sprint Completed", `${sprint.name} has been archived successfully.`, "success");
    const contentArea = document.getElementById("mainContent");
    this.render(contentArea);
  },

  openCreateSprintModal(projectId) {
    const project = store.getProjectById(projectId) || store.getActiveProject();
    const container = document.getElementById("sprintModalContainer") || document.getElementById("globalModalContainer");
    if (!container) return;

    const today = new Date().toISOString().split("T")[0];
    const twoWeeksLater = new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0];

    container.innerHTML = `
      <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-fade-in text-xs">
          
          <div class="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <h3 class="text-sm font-bold text-slate-900 flex items-center gap-2">
              <i data-lucide="flag" class="w-4 h-4 text-slate-900"></i> Create New Sprint
            </h3>
            <button onclick="document.getElementById('sprintModalContainer').innerHTML=''" class="text-slate-400 hover:text-slate-600">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>

          <form onsubmit="BacklogSprintsView.handleCreateSprintSubmit(event, '${project.id}')" class="mt-4 space-y-3.5">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Sprint Name *</label>
              <input type="text" id="newSprintName" required placeholder="e.g. Sprint 10" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none" />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Start Date *</label>
                <input type="date" id="newSprintStart" required value="${today}" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none" />
              </div>
              <div>
                <label class="block font-semibold text-slate-700 mb-1">End Date *</label>
                <input type="date" id="newSprintEnd" required value="${twoWeeksLater}" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none" />
              </div>
            </div>

            <div>
              <label class="block font-semibold text-slate-700 mb-1">Sprint Goal</label>
              <input type="text" id="newSprintGoal" placeholder="e.g. Complete mobile checkout integration & zero critical defects" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none" />
            </div>

            <div>
              <label class="block font-semibold text-slate-700 mb-1">Description</label>
              <textarea id="newSprintDesc" rows="2" placeholder="Key deliverables, testing scopes, and QA verification gates..." class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none"></textarea>
            </div>

            <div class="pt-3.5 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button type="button" onclick="document.getElementById('sprintModalContainer').innerHTML=''" class="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition">
                Cancel
              </button>
              <button type="submit" class="px-5 py-2 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 font-bold rounded-lg shadow-xs shadow-[#bef264]/25 transition">
                Create Sprint
              </button>
            </div>
          </form>

        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  handleCreateSprintSubmit(e, projectId) {
    e.preventDefault();
    const name = document.getElementById("newSprintName").value.trim();
    const startDate = document.getElementById("newSprintStart").value;
    const endDate = document.getElementById("newSprintEnd").value;
    const goal = document.getElementById("newSprintGoal").value.trim();
    const description = document.getElementById("newSprintDesc").value.trim();

    store.createSprint({
      projectId,
      name,
      startDate,
      endDate,
      goal,
      description,
      status: "future"
    });

    document.getElementById("sprintModalContainer").innerHTML = "";
    window.app.showToast("Sprint Created", `Created ${name} successfully`, "success");
    this.render(document.getElementById("mainContent"));
  },

  openEditSprintModal(sprintId) {
    const sprint = store.getSprintById(sprintId);
    if (!sprint) return;

    const container = document.getElementById("sprintModalContainer") || document.getElementById("globalModalContainer");
    if (!container) return;

    container.innerHTML = `
      <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-fade-in text-xs">
          
          <div class="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <h3 class="text-sm font-bold text-slate-900 flex items-center gap-2">
              <i data-lucide="edit" class="w-4 h-4 text-slate-900"></i> Edit Sprint: ${sprint.name}
            </h3>
            <button onclick="document.getElementById('sprintModalContainer').innerHTML=''" class="text-slate-400 hover:text-slate-600">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>

          <form onsubmit="BacklogSprintsView.handleEditSprintSubmit(event, '${sprint.id}')" class="mt-4 space-y-3.5">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Sprint Name *</label>
              <input type="text" id="editSprintName" required value="${sprint.name}" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none" />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Start Date *</label>
                <input type="date" id="editSprintStart" required value="${sprint.startDate}" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none" />
              </div>
              <div>
                <label class="block font-semibold text-slate-700 mb-1">End Date *</label>
                <input type="date" id="editSprintEnd" required value="${sprint.endDate}" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none" />
              </div>
            </div>

            <div>
              <label class="block font-semibold text-slate-700 mb-1">Sprint Goal</label>
              <input type="text" id="editSprintGoal" value="${sprint.goal || ''}" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none" />
            </div>

            <div>
              <label class="block font-semibold text-slate-700 mb-1">Description</label>
              <textarea id="editSprintDesc" rows="2" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none">${sprint.description || ''}</textarea>
            </div>

            <div class="pt-3.5 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button type="button" onclick="document.getElementById('sprintModalContainer').innerHTML=''" class="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition">
                Cancel
              </button>
              <button type="submit" class="px-5 py-2 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 font-bold rounded-lg shadow-xs shadow-[#bef264]/25 transition">
                Save Changes
              </button>
            </div>
          </form>

        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  handleEditSprintSubmit(e, sprintId) {
    e.preventDefault();
    const name = document.getElementById("editSprintName").value.trim();
    const startDate = document.getElementById("editSprintStart").value;
    const endDate = document.getElementById("editSprintEnd").value;
    const goal = document.getElementById("editSprintGoal").value.trim();
    const description = document.getElementById("editSprintDesc").value.trim();

    store.updateSprint(sprintId, {
      name,
      startDate,
      endDate,
      goal,
      description
    });

    document.getElementById("sprintModalContainer").innerHTML = "";
    window.app.showToast("Sprint Updated", `Saved changes for ${name}`, "success");
    this.render(document.getElementById("mainContent"));
  }
};

window.BacklogSprintsView = BacklogSprintsView;
