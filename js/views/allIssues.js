/**
 * All-in-One Software Project & QA Management Platform (V1)
 * All Issues Cross-Project Comprehensive Table View with QA Filters & Saved Views
 */

const AllIssuesView = {
  searchQuery: "",
  filterProject: "all",
  filterType: "all",
  filterPriority: "all",
  filterStatus: "all",
  filterDeveloper: "all",
  filterQA: "all",
  filterSprint: "all",
  filterEnvironment: "all",
  filterQualityGate: "all",
  sortBy: "updated", // 'updated', 'key', 'priority', 'title'
  activeSavedView: "all", // 'all', 'open_bugs', 'ready_for_qa', 'reopened', 'active_sprint'

  render(container) {
    const activeProject = store.getActiveProject();
    if (this.filterProject === "all" && activeProject) {
      this.filterProject = activeProject.id;
    }
    const issues = store.getIssues();
    const projects = store.getProjects();
    const users = store.getUsers();
    const sprints = store.getSprints(activeProject ? activeProject.id : null);
    const filteredIssues = this.filterAndSortIssues(issues);

    container.innerHTML = `
      <div class="space-y-5 animate-fade-in pb-10 text-xs">
        
        <!-- Header & Top Actions -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <h1 class="text-xl font-bold text-slate-900 tracking-tight">All Issues & Quality Repository</h1>
              <span class="px-2 py-0.5 rounded-full bg-slate-900 text-[#bef264] font-bold font-mono text-[10px]">${issues.length} Total</span>
            </div>
            <p class="text-slate-500 text-xs">Cross-project issue index with deep QA verification status, release environments, and defect tracking.</p>
          </div>

          <div class="flex flex-wrap items-center gap-2.5">
            <!-- Saved Views Dropdown (Section 19) -->
            <select onchange="AllIssuesView.applySavedView(this.value)" class="bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] cursor-pointer">
              <option value="all" ${this.activeSavedView === 'all' ? 'selected' : ''}>📁 Saved View: All Issues</option>
              <option value="open_bugs" ${this.activeSavedView === 'open_bugs' ? 'selected' : ''}>🐛 Saved View: Open Bugs</option>
              <option value="ready_for_qa" ${this.activeSavedView === 'ready_for_qa' ? 'selected' : ''}>⏳ Saved View: Ready for QA</option>
              <option value="reopened" ${this.activeSavedView === 'reopened' ? 'selected' : ''}>⚠ Saved View: Reopened Defects</option>
              <option value="active_sprint" ${this.activeSavedView === 'active_sprint' ? 'selected' : ''}>⚡ Saved View: Current Sprint Scope</option>
            </select>

            <button onclick="window.app.openCreateIssueModal()" class="px-4 py-2 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 rounded-xl font-bold shadow-xs shadow-[#bef264]/25 transition flex items-center gap-1.5 cursor-pointer">
              <i data-lucide="plus" class="w-4 h-4"></i>
              <span>Create Issue</span>
            </button>
          </div>
        </div>

        <!-- Filters Toolbar (Section 19) -->
        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          
          <!-- Top Row: Full Search & Sorter -->
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="relative min-w-[240px] max-w-md flex-1">
              <i data-lucide="search" class="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400"></i>
              <input 
                type="text" 
                value="${this.searchQuery}" 
                oninput="AllIssuesView.handleSearch(this.value)" 
                placeholder="Search by key, title, environment, error logs, or acceptance criteria..." 
                class="w-full pl-9.5 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] focus:outline-none text-xs font-medium" 
              />
            </div>

            <div class="flex items-center gap-2">
              <span class="text-slate-400 font-semibold">Sort by:</span>
              <select onchange="AllIssuesView.setSort(this.value)" class="border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] text-slate-800 font-bold bg-white cursor-pointer">
                <option value="updated" ${this.sortBy === 'updated' ? 'selected' : ''}>Recently Updated</option>
                <option value="key" ${this.sortBy === 'key' ? 'selected' : ''}>Issue ID</option>
                <option value="priority" ${this.sortBy === 'priority' ? 'selected' : ''}>Priority (Critical First)</option>
                <option value="reopen" ${this.sortBy === 'reopen' ? 'selected' : ''}>Reopened Count</option>
                <option value="title" ${this.sortBy === 'title' ? 'selected' : ''}>Title (A-Z)</option>
              </select>

              <button onclick="AllIssuesView.resetFilters()" class="px-3 py-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg font-bold transition">
                Reset
              </button>
            </div>
          </div>

          <!-- Bottom Row: Multi-Dimension Filters (Section 19) -->
          <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 pt-2.5 border-t border-slate-100">
            
            <!-- Project -->
            <select onchange="AllIssuesView.setFilter('project', this.value)" class="border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-700 bg-white">
              <option value="all" ${this.filterProject === 'all' ? 'selected' : ''}>All Projects</option>
              ${projects.map(p => `<option value="${p.id}" ${this.filterProject === p.id ? 'selected' : ''}>${p.name}</option>`).join("")}
            </select>

            <!-- Type -->
            <select onchange="AllIssuesView.setFilter('type', this.value)" class="border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-700 bg-white">
              <option value="all" ${this.filterType === 'all' ? 'selected' : ''}>All Types</option>
              <option value="Bug" ${this.filterType === 'Bug' ? 'selected' : ''}>Bug</option>
              <option value="Story" ${this.filterType === 'Story' ? 'selected' : ''}>Story</option>
              <option value="Task" ${this.filterType === 'Task' ? 'selected' : ''}>Task</option>
            </select>

            <!-- Priority -->
            <select onchange="AllIssuesView.setFilter('priority', this.value)" class="border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-700 bg-white">
              <option value="all" ${this.filterPriority === 'all' ? 'selected' : ''}>All Priorities</option>
              <option value="Critical" ${this.filterPriority === 'Critical' ? 'selected' : ''}>Critical</option>
              <option value="High" ${this.filterPriority === 'High' ? 'selected' : ''}>High</option>
              <option value="Medium" ${this.filterPriority === 'Medium' ? 'selected' : ''}>Medium</option>
              <option value="Low" ${this.filterPriority === 'Low' ? 'selected' : ''}>Low</option>
            </select>

            <!-- Status -->
            <select onchange="AllIssuesView.setFilter('status', this.value)" class="border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-700 bg-white">
              <option value="all" ${this.filterStatus === 'all' ? 'selected' : ''}>All Statuses</option>
              <option value="Backlog" ${this.filterStatus === 'Backlog' ? 'selected' : ''}>Backlog / Open</option>
              <option value="To Do" ${this.filterStatus === 'To Do' ? 'selected' : ''}>To Do</option>
              <option value="In Progress" ${this.filterStatus === 'In Progress' ? 'selected' : ''}>In Progress</option>
              <option value="Ready for QA" ${this.filterStatus === 'Ready for QA' ? 'selected' : ''}>Ready for QA</option>
              <option value="QA Testing" ${this.filterStatus === 'QA Testing' ? 'selected' : ''}>QA Testing</option>
              <option value="Done" ${this.filterStatus === 'Done' ? 'selected' : ''}>Done / Closed</option>
              <option value="Reopened" ${this.filterStatus === 'Reopened' ? 'selected' : ''}>Reopened</option>
            </select>

            <!-- Developer -->
            <select onchange="AllIssuesView.setFilter('developer', this.value)" class="border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-700 bg-white">
              <option value="all" ${this.filterDeveloper === 'all' ? 'selected' : ''}>All Devs</option>
              ${users.map(u => `<option value="${u.id}" ${this.filterDeveloper === u.id ? 'selected' : ''}>Dev: ${u.name.split(" ")[0]}</option>`).join("")}
            </select>

            <!-- QA Engineer -->
            <select onchange="AllIssuesView.setFilter('qa', this.value)" class="border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-700 bg-white">
              <option value="all" ${this.filterQA === 'all' ? 'selected' : ''}>All QA</option>
              ${users.map(u => `<option value="${u.id}" ${this.filterQA === u.id ? 'selected' : ''}>QA: ${u.name.split(" ")[0]}</option>`).join("")}
            </select>

            <!-- Environment -->
            <select onchange="AllIssuesView.setFilter('environment', this.value)" class="border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-700 bg-white">
              <option value="all" ${this.filterEnvironment === 'all' ? 'selected' : ''}>All Envs</option>
              <option value="Staging" ${this.filterEnvironment === 'Staging' ? 'selected' : ''}>Staging</option>
              <option value="Production" ${this.filterEnvironment === 'Production' ? 'selected' : ''}>Production</option>
              <option value="UAT" ${this.filterEnvironment === 'UAT' ? 'selected' : ''}>UAT</option>
              <option value="Development" ${this.filterEnvironment === 'Development' ? 'selected' : ''}>Development</option>
            </select>

            <!-- Quality Gate -->
            <select onchange="AllIssuesView.setFilter('qualityGate', this.value)" class="border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-700 bg-white">
              <option value="all" ${this.filterQualityGate === 'all' ? 'selected' : ''}>All Gates</option>
              <option value="passed" ${this.filterQualityGate === 'passed' ? 'selected' : ''}>✓ Verified</option>
              <option value="failed" ${this.filterQualityGate === 'failed' ? 'selected' : ''}>✕ Failed</option>
              <option value="pending" ${this.filterQualityGate === 'pending' ? 'selected' : ''}>⏳ Pending</option>
            </select>

          </div>

          <div class="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span>Filter results updated automatically</span>
            <span>Showing <strong>${filteredIssues.length}</strong> of ${issues.length} issues</span>
          </div>

        </div>

        <!-- Issues Master Table (Section 19) -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-slate-700 min-w-[950px]">
              <thead class="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-400">
                <tr>
                  <th class="py-3.5 px-4">ID</th>
                  <th class="py-3.5 px-4">Project</th>
                  <th class="py-3.5 px-4">Type</th>
                  <th class="py-3.5 px-4">Summary</th>
                  <th class="py-3.5 px-4">Quality Gate</th>
                  <th class="py-3.5 px-4">Priority</th>
                  <th class="py-3.5 px-4">Developer</th>
                  <th class="py-3.5 px-4">QA Lead</th>
                  <th class="py-3.5 px-4">Env / Build</th>
                  <th class="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${filteredIssues.length === 0 ? `
                  <tr>
                    <td colspan="10" class="text-center py-12 text-slate-400">
                      <i data-lucide="search-x" class="w-8 h-8 mx-auto mb-2 text-slate-300"></i>
                      <p class="font-bold text-slate-700">No issues match the selected criteria</p>
                      <p class="text-[11px] text-slate-400 mt-0.5">Try resetting filters or changing the search keyword.</p>
                    </td>
                  </tr>
                ` : filteredIssues.map(i => {
                  const proj = store.getProjectById(i.projectId);
                  const dev = store.getUserById(i.developerId || i.assigneeId);
                  const qa = store.getUserById(i.qaId || "u-qa-1");
                  const gate = store.getQualityGate(i);

                  return `
                    <tr class="hover:bg-slate-50 transition cursor-pointer group" onclick="window.app.openIssueDetails('${i.id}')">
                      <td class="py-3.5 px-4 font-mono font-bold text-slate-900">${i.key}</td>
                      <td class="py-3.5 px-4">
                        <span class="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px] font-bold">${proj ? proj.key : 'PRJ'}</span>
                      </td>
                      <td class="py-3.5 px-4">
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase ${i.type === 'Bug' ? 'type-bug' : i.type === 'Story' ? 'type-story' : 'type-task'}">${i.type}</span>
                      </td>
                      <td class="py-3.5 px-4">
                        <div class="font-semibold text-slate-900 group-hover:text-[#4d7c0f] transition max-w-sm truncate">
                          ${i.title}
                        </div>
                        ${i.reopenCount > 0 ? `
                          <span class="px-1.5 py-0.2 rounded bg-red-100 text-red-700 font-bold text-[9px] mt-0.5 inline-block">
                            Reopened ${i.reopenCount}x
                          </span>
                        ` : ''}
                      </td>
                      <td class="py-3.5 px-4">
                        ${gate.isPassed ? `
                          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 w-fit">
                            <i data-lucide="check" class="w-3 h-3 text-emerald-600"></i> Verified
                          </span>
                        ` : gate.status === 'failed' ? `
                          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200 flex items-center gap-1 w-fit">
                            <i data-lucide="alert-triangle" class="w-3 h-3 text-red-600"></i> QA Failed
                          </span>
                        ` : `
                          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1 w-fit">
                            <i data-lucide="clock" class="w-3 h-3 text-purple-600"></i> ${i.status}
                          </span>
                        `}
                      </td>
                      <td class="py-3.5 px-4">
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold ${
                          i.priority === 'Critical' ? 'priority-critical' :
                          i.priority === 'High' ? 'priority-high' :
                          i.priority === 'Medium' ? 'priority-medium' : 'priority-low'
                        }">${i.priority}</span>
                      </td>
                      <td class="py-3.5 px-4 font-medium text-slate-800">${dev.name.split(" ")[0]}</td>
                      <td class="py-3.5 px-4 font-semibold text-purple-700">${qa.name.split(" ")[0]}</td>
                      <td class="py-3.5 px-4 text-[11px] text-slate-500 font-mono">
                        ${i.environment || 'Staging'} <span class="text-slate-300">•</span> ${i.buildVersion || 'v2.4.1'}
                      </td>
                      <td class="py-3.5 px-4 text-right" onclick="event.stopPropagation()">
                        <button onclick="window.app.openIssueDetails('${i.id}')" class="px-3 py-1 bg-slate-100 hover:bg-slate-950 hover:text-[#bef264] text-slate-700 rounded-lg font-bold text-[11px] transition">
                          Inspect →
                        </button>
                      </td>
                    </tr>
                  `;
                }).join("")}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  filterAndSortIssues(issues) {
    return issues.filter(i => {
      // Search text
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        const titleMatch = i.title.toLowerCase().includes(q);
        const keyMatch = i.key.toLowerCase().includes(q);
        const descMatch = (i.description || "").toLowerCase().includes(q);
        const envMatch = (i.environment || "").toLowerCase().includes(q);
        if (!titleMatch && !keyMatch && !descMatch && !envMatch) return false;
      }

      // Dropdown filters
      if (this.filterProject !== "all" && i.projectId !== this.filterProject && i.project_id !== this.filterProject) return false;
      if (this.filterType !== "all" && i.type !== this.filterType) return false;
      if (this.filterPriority !== "all" && i.priority !== this.filterPriority) return false;
      if (this.filterStatus !== "all") {
        if (this.filterStatus === "Backlog" && (i.status !== "Backlog" && i.status !== "Open")) return false;
        if (this.filterStatus === "Ready for QA" && (i.status !== "Ready for QA" && i.status !== "Fixed")) return false;
        if (this.filterStatus === "QA Testing" && (i.status !== "QA Testing" && i.status !== "QA")) return false;
        if (this.filterStatus === "Done" && (i.status !== "Done" && i.status !== "Closed")) return false;
        if (this.filterStatus === "Reopened" && i.status !== "Reopened") return false;
        if (this.filterStatus !== "Backlog" && this.filterStatus !== "Ready for QA" && this.filterStatus !== "QA Testing" && this.filterStatus !== "Done" && this.filterStatus !== "Reopened" && i.status !== this.filterStatus) return false;
      }
      if (this.filterDeveloper !== "all" && (i.developerId !== this.filterDeveloper && i.assigneeId !== this.filterDeveloper)) return false;
      if (this.filterQA !== "all" && i.qaId !== this.filterQA) return false;
      if (this.filterEnvironment !== "all" && i.environment !== this.filterEnvironment) return false;
      if (this.filterQualityGate !== "all") {
        const gate = store.getQualityGate(i);
        if (this.filterQualityGate === "passed" && !gate.isPassed) return false;
        if (this.filterQualityGate === "failed" && gate.status !== "failed") return false;
        if (this.filterQualityGate === "pending" && (gate.isPassed || gate.status === "failed")) return false;
      }

      return true;
    }).sort((a, b) => {
      if (this.sortBy === "key") return a.key.localeCompare(b.key);
      if (this.sortBy === "priority") {
        const score = { "Critical": 4, "High": 3, "Medium": 2, "Low": 1 };
        return (score[b.priority] || 0) - (score[a.priority] || 0);
      }
      if (this.sortBy === "reopen") return (b.reopenCount || 0) - (a.reopenCount || 0);
      if (this.sortBy === "title") return a.title.localeCompare(b.title);
      return (b.id || "").localeCompare(a.id || "");
    });
  },

  applySavedView(view) {
    this.activeSavedView = view;
    this.resetFilters(false);

    if (view === "open_bugs") {
      this.filterType = "Bug";
      this.filterStatus = "all";
    } else if (view === "ready_for_qa") {
      this.filterStatus = "Ready for QA";
    } else if (view === "reopened") {
      this.filterStatus = "Reopened";
      this.filterQualityGate = "failed";
    } else if (view === "active_sprint") {
      this.filterStatus = "In Progress";
    }

    this.render(document.getElementById("mainContent"));
  },

  setFilter(type, value) {
    if (type === "project") this.filterProject = value;
    if (type === "type") this.filterType = value;
    if (type === "priority") this.filterPriority = value;
    if (type === "status") this.filterStatus = value;
    if (type === "developer") this.filterDeveloper = value;
    if (type === "qa") this.filterQA = value;
    if (type === "environment") this.filterEnvironment = value;
    if (type === "qualityGate") this.filterQualityGate = value;
    this.render(document.getElementById("mainContent"));
  },

  setSort(value) {
    this.sortBy = value;
    this.render(document.getElementById("mainContent"));
  },

  handleSearch(value) {
    this.searchQuery = value;
    this.render(document.getElementById("mainContent"));
  },

  resetFilters(shouldRender = true) {
    this.searchQuery = "";
    this.filterProject = "all";
    this.filterType = "all";
    this.filterPriority = "all";
    this.filterStatus = "all";
    this.filterDeveloper = "all";
    this.filterQA = "all";
    this.filterSprint = "all";
    this.filterEnvironment = "all";
    this.filterQualityGate = "all";
    this.sortBy = "updated";
    if (shouldRender) {
      this.activeSavedView = "all";
      this.render(document.getElementById("mainContent"));
    }
  }
};

window.AllIssuesView = AllIssuesView;
