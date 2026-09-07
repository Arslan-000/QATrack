/**
 * PulseWave QA & Software Engineering Platform
 * Assigned to Me / Personal Execution & Quality Queue View
 * High-End 3D Holographic Design & Full Interactive System Integration
 */

const MyIssuesView = {
  activeTab: "in_flight", // 'in_flight', 'todo', 'in_dev', 'ready_for_qa', 'qa_testing', 'retesting', 'completed', 'all'
  assignmentScope: "assigned_to_me", // 'assigned_to_me', 'reported_by_me', 'qa_queue', 'all_involvement'
  searchQuery: "",
  priorityFilter: "all", // 'all', 'CriticalHigh', 'Critical', 'High', 'Medium', 'Low'
  typeFilter: "all", // 'all', 'Bug', 'Story', 'Task'
  projectFilter: "all", // 'all' or projectId
  sortBy: "priority", // 'priority', 'updated', 'key', 'duedate', 'points'
  viewMode: "grid", // 'grid', 'table'
  animFrameId: null,
  lastFilteredIssues: [],

  render(container) {
    if (!container) return;

    // Clean up any ongoing canvas animations
    if (this.animFrameId && typeof cancelAnimationFrame === "function") {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    const activeUser = store.getActiveUser();
    if (!activeUser) {
      container.innerHTML = `
        <div class="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <i data-lucide="user-x" class="w-10 h-10 text-slate-400 mx-auto mb-3"></i>
          <p class="font-bold text-slate-800 text-sm">Authentication Required</p>
          <p class="text-xs text-slate-400 mt-1">Please sign in to access your personal task queue.</p>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    const allIssues = store.getIssues() || [];
    const projects = store.getProjects() || [];
    const isQA = (activeUser.role || "").toLowerCase().includes("qa") || (activeUser.department || "").toLowerCase().includes("quality");

    const uId = String(activeUser.id || "").toLowerCase();
    const uSupabaseId = String(activeUser.supabase_id || "").toLowerCase();
    const uEmail = String(activeUser.email || "").toLowerCase().trim();
    const uName = String(activeUser.name || "").toLowerCase().trim();

    // Helper: Is issue directly assigned to user?
    const isDirectlyAssigned = (i) => {
      const candidateIds = [
        i.assigneeId,
        i.assignee_id,
        i.developerId,
        i.developer_id,
        i.qaId,
        i.qa_id,
        i.assignee
      ].filter(Boolean).map(x => String(x).toLowerCase().trim());
      return candidateIds.some(c => c === uId || c === uSupabaseId || (uEmail && c === uEmail) || (uName && c === uName));
    };

    // Helper: Is issue reported/logged by user?
    const isReportedByMe = (i) => {
      const reporterIds = [
        i.reporterId,
        i.reporter_id,
        i.author,
        i.createdBy
      ].filter(Boolean).map(x => String(x).toLowerCase().trim());
      return reporterIds.some(c => c === uId || c === uSupabaseId || (uEmail && c === uEmail) || (uName && c === uName));
    };

    // Helper: Is issue in QA queue?
    const isQaQueueItem = (i) => {
      const isQaStatus = (
        i.status === "Ready for QA" || 
        i.status === "QA Testing" || 
        i.status === "QA" || 
        i.status === "Fixed" || 
        i.status === "Reopened" || 
        i.qaStatus === "Ready for QA" || 
        i.qaStatus === "Testing" || 
        i.qaStatus === "Failed"
      );
      return isQaStatus && (isQA || isDirectlyAssigned(i));
    };

    // Helper: Any involvement
    const isAnyInvolvement = (i) => {
      return isDirectlyAssigned(i) || isReportedByMe(i) || isQaQueueItem(i);
    };

    // Filter by selected Scope
    let scopedIssues = [];
    if (this.assignmentScope === "reported_by_me") {
      scopedIssues = allIssues.filter(isReportedByMe);
    } else if (this.assignmentScope === "qa_queue") {
      scopedIssues = allIssues.filter(isQaQueueItem);
    } else if (this.assignmentScope === "all_involvement") {
      scopedIssues = allIssues.filter(isAnyInvolvement);
    } else {
      // Default: 'assigned_to_me'
      scopedIssues = allIssues.filter(isDirectlyAssigned);
    }

    // Projects that have user's issues
    const assignedProjectIds = new Set(scopedIssues.map(i => i.projectId).filter(Boolean));
    const userProjects = projects.filter(p => assignedProjectIds.has(p.id));

    // Metric Calculations
    const totalScoped = scopedIssues.length;
    const inFlightIssues = scopedIssues.filter(i => i.status !== "Done" && i.status !== "Closed");
    const inFlightCount = inFlightIssues.length;
    
    const todoCount = scopedIssues.filter(i => i.status === "To Do" || i.status === "Open" || i.status === "Backlog").length;
    const inDevCount = scopedIssues.filter(i => i.status === "In Progress" || i.status === "In Development").length;
    const readyForQaCount = scopedIssues.filter(i => i.status === "Ready for QA" || i.status === "Fixed" || i.qaStatus === "Ready for QA").length;
    const qaTestingCount = scopedIssues.filter(i => i.status === "QA Testing" || i.status === "QA" || i.qaStatus === "Testing").length;
    const retestingCount = scopedIssues.filter(i => i.status === "Reopened" || i.qaStatus === "Failed" || (i.reopenCount && i.reopenCount > 0)).length;
    const completedCount = scopedIssues.filter(i => i.status === "Done" || i.status === "Closed" || i.qaStatus === "Passed").length;
    
    const criticalHighCount = inFlightIssues.filter(i => i.priority === "Critical" || i.priority === "High").length;
    const inDevPoints = scopedIssues
      .filter(i => i.status === "In Progress" || i.status === "In Development")
      .reduce((acc, i) => acc + Number(i.storyPoints || (i.priority === "Critical" ? 8 : i.priority === "High" ? 5 : i.priority === "Medium" ? 3 : 1)), 0);
    const completionRate = totalScoped > 0 ? Math.round((completedCount / totalScoped) * 100) : 100;

    // Tab Filtering
    let filteredIssues = scopedIssues.filter(i => {
      // 1. Status / Tab Filter
      if (this.activeTab === "in_flight") {
        if (i.status === "Done" || i.status === "Closed") return false;
      } else if (this.activeTab === "todo") {
        if (i.status !== "To Do" && i.status !== "Open" && i.status !== "Backlog") return false;
      } else if (this.activeTab === "in_dev") {
        if (i.status !== "In Progress" && i.status !== "In Development") return false;
      } else if (this.activeTab === "ready_for_qa") {
        if (i.status !== "Ready for QA" && i.status !== "Fixed" && i.qaStatus !== "Ready for QA") return false;
      } else if (this.activeTab === "qa_testing") {
        if (i.status !== "QA Testing" && i.status !== "QA" && i.qaStatus !== "Testing") return false;
      } else if (this.activeTab === "retesting") {
        if (i.status !== "Reopened" && i.qaStatus !== "Failed" && !(i.reopenCount > 0)) return false;
      } else if (this.activeTab === "completed") {
        if (i.status !== "Done" && i.status !== "Closed" && i.qaStatus !== "Passed") return false;
      }
      // 'all' shows everything in scope

      // 2. Type filter
      if (this.typeFilter !== "all" && i.type !== this.typeFilter) return false;

      // 3. Priority filter
      if (this.priorityFilter !== "all") {
        if (this.priorityFilter === "CriticalHigh") {
          if (i.priority !== "Critical" && i.priority !== "High") return false;
        } else if (i.priority !== this.priorityFilter) {
          return false;
        }
      }

      // 4. Project filter
      if (this.projectFilter !== "all" && i.projectId !== this.projectFilter) return false;

      // 5. Search query
      if (this.searchQuery && this.searchQuery.trim()) {
        const q = this.searchQuery.toLowerCase().trim();
        const key = (i.key || "").toLowerCase();
        const title = (i.title || "").toLowerCase();
        const desc = (i.description || "").toLowerCase();
        const proj = (store.getProjectById(i.projectId)?.name || "").toLowerCase();
        const tags = Array.isArray(i.labels) ? i.labels.join(" ").toLowerCase() : "";
        if (!key.includes(q) && !title.includes(q) && !desc.includes(q) && !proj.includes(q) && !tags.includes(q)) {
          return false;
        }
      }

      return true;
    });

    // Sorting
    filteredIssues.sort((a, b) => {
      if (this.sortBy === "priority") {
        const pWeight = { "Critical": 4, "High": 3, "Medium": 2, "Low": 1 };
        const pDiff = (pWeight[b.priority] || 0) - (pWeight[a.priority] || 0);
        if (pDiff !== 0) return pDiff;
      } else if (this.sortBy === "updated") {
        const timeA = new Date(a.updatedAt || a.updated_at || a.createdAt || 0).getTime();
        const timeB = new Date(b.updatedAt || b.updated_at || b.createdAt || 0).getTime();
        return timeB - timeA;
      } else if (this.sortBy === "key") {
        return (a.key || "").localeCompare(b.key || "");
      } else if (this.sortBy === "points") {
        const ptA = Number(a.storyPoints || a.story_points || 0);
        const ptB = Number(b.storyPoints || b.story_points || 0);
        return ptB - ptA;
      } else if (this.sortBy === "duedate") {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      return 0;
    });

    this.lastFilteredIssues = filteredIssues;

    // Render HTML Output
    container.innerHTML = `
      <div class="space-y-6 animate-fade-in pb-16 text-slate-800">
        
        <!-- =========================================================================
             1. 3D HOLOGRAPHIC HERO HEADER & IDENTITY HUB
             ========================================================================= -->
        <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800 text-white p-6 sm:p-7 shadow-2xl shadow-slate-950/40">
          
          <!-- Background Interactive 3D Mesh Canvas -->
          <canvas id="assignedMeshCanvas" class="absolute inset-0 w-full h-full pointer-events-none opacity-45" style="mix-blend-mode: screen;"></canvas>
          
          <!-- Subtle Glow Overlays -->
          <div class="absolute -top-24 -left-24 w-80 h-80 bg-[#bef264]/10 rounded-full blur-3xl pointer-events-none"></div>
          <div class="absolute -bottom-24 -right-24 w-80 h-80 bg-[#bef264]/15 rounded-full blur-3xl pointer-events-none"></div>
          
          <div class="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            
            <!-- User Identity & Persona Card -->
            <div class="flex items-start sm:items-center gap-4">
              <div class="relative shrink-0">
                <div class="w-14 h-14 rounded-2xl ${activeUser.color || 'bg-gradient-to-tr from-slate-900 to-slate-800'} text-white font-black text-xl flex items-center justify-center shadow-lg ring-4 ring-white/10">
                  ${activeUser.initials || "ME"}
                </div>
                <div class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#bef264] ring-2 ring-slate-950 flex items-center justify-center" title="Online & Active">
                  <div class="w-2 h-2 rounded-full bg-slate-950 animate-ping"></div>
                </div>
              </div>

              <div>
                <div class="flex flex-wrap items-center gap-2.5">
                  <h1 class="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                    Assigned to Me
                    <span class="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-white/10 text-slate-300 border border-white/10">
                      Personal Execution Queue
                    </span>
                  </h1>
                </div>

                <div class="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-400">
                  <span class="flex items-center gap-1.5 text-slate-200 font-bold">
                    <i data-lucide="user" class="w-3.5 h-3.5 text-[#bef264]"></i>
                    ${activeUser.name}
                  </span>
                  <span class="text-slate-600">•</span>
                  <span class="px-2 py-0.5 rounded-md text-[11px] font-bold ${isQA ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-slate-800 text-[#bef264] border border-[#bef264]/30'}">
                    ${activeUser.role || 'Member'}
                  </span>
                  <span class="text-slate-600">•</span>
                  <span class="flex items-center gap-1.5 text-slate-300">
                    <i data-lucide="layers" class="w-3.5 h-3.5 text-slate-400"></i>
                    ${activeUser.department || 'Engineering'}
                  </span>
                </div>

                <!-- Dynamic Status Tagline -->
                <div class="mt-2.5 flex items-center gap-2 text-xs font-medium text-slate-300">
                  <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-[11px]">
                    <i data-lucide="activity" class="w-3 h-3 animate-pulse text-emerald-400"></i>
                    ${inFlightCount} Tasks In-Flight
                  </span>
                  ${criticalHighCount > 0 ? `
                    <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 font-bold text-[11px]">
                      <i data-lucide="flame" class="w-3 h-3 text-rose-400"></i>
                      ${criticalHighCount} Critical / Blocker Focus
                    </span>
                  ` : `
                    <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-[11px]">
                      <i data-lucide="shield-check" class="w-3 h-3 text-[#bef264]"></i>
                      Zero Critical Blockers
                    </span>
                  `}
                </div>
              </div>
            </div>

            <!-- Scope Selector & Quick Action CTAs -->
            <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              
              <!-- Assignment Scope Dropdown / Pills -->
              <div class="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-1 flex items-center gap-1 shadow-inner">
                <button onclick="MyIssuesView.setScope('assigned_to_me')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${this.assignmentScope === 'assigned_to_me' ? 'bg-[#bef264] text-slate-950 shadow-md' : 'text-slate-300 hover:text-white hover:bg-slate-800'}">
                  <i data-lucide="check-square" class="w-3.5 h-3.5"></i>
                  <span>Assigned</span>
                </button>
                <button onclick="MyIssuesView.setScope('reported_by_me')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${this.assignmentScope === 'reported_by_me' ? 'bg-[#bef264] text-slate-950 shadow-md' : 'text-slate-300 hover:text-white hover:bg-slate-800'}">
                  <i data-lucide="file-plus" class="w-3.5 h-3.5"></i>
                  <span>Reported</span>
                </button>
                ${isQA ? `
                  <button onclick="MyIssuesView.setScope('qa_queue')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${this.assignmentScope === 'qa_queue' ? 'bg-[#bef264] text-slate-950 shadow-md' : 'text-slate-300 hover:text-white hover:bg-slate-800'}">
                    <i data-lucide="flask-conical" class="w-3.5 h-3.5"></i>
                    <span>QA Queue</span>
                  </button>
                ` : ''}
                <button onclick="MyIssuesView.setScope('all_involvement')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${this.assignmentScope === 'all_involvement' ? 'bg-[#bef264] text-slate-950 shadow-md' : 'text-slate-300 hover:text-white hover:bg-slate-800'}">
                  <i data-lucide="compass" class="w-3.5 h-3.5"></i>
                  <span>All Mine</span>
                </button>
              </div>

              <!-- Main Actions -->
              <div class="flex items-center gap-2">
                <button onclick="MyIssuesView.exportCSV()" class="px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm hover:text-white" title="Download your task queue in CSV format">
                  <i data-lucide="download" class="w-3.5 h-3.5"></i>
                  <span>Export</span>
                </button>

                <button onclick="window.app.openCreateIssueModal()" class="px-4 py-2 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 rounded-xl text-xs font-black shadow-lg shadow-[#bef264]/25 hover:shadow-xl transition flex items-center gap-1.5 cursor-pointer shrink-0">
                  <i data-lucide="plus" class="w-4 h-4 stroke-[3]"></i>
                  <span>New Task / Bug</span>
                </button>
              </div>
            </div>

          </div>
        </div>

        <!-- =========================================================================
             2. 4 EXECUTIVE BENTO METRIC CARDS (3D Interactive Glow)
             ========================================================================= -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <!-- Card 1: In-Flight Assigned -->
          <div onclick="MyIssuesView.setTab('in_flight')" class="group relative overflow-hidden rounded-2xl bg-white p-5 border ${this.activeTab === 'in_flight' ? 'border-slate-950 ring-2 ring-slate-950/20 shadow-md' : 'border-slate-200/90 shadow-2xs hover:border-slate-400'} transition cursor-pointer card-hover">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active In-Flight</span>
              <div class="w-9 h-9 rounded-xl bg-slate-100 text-slate-900 flex items-center justify-center transition group-hover:scale-110">
                <i data-lucide="zap" class="w-4 h-4"></i>
              </div>
            </div>
            <div class="mt-3 flex items-baseline gap-2">
              <span class="text-2xl font-black text-slate-900 tracking-tight">${inFlightCount}</span>
              <span class="text-xs font-semibold text-slate-400">/ ${totalScoped} total</span>
            </div>
            <div class="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
              <span class="font-bold ${criticalHighCount > 0 ? 'text-rose-600' : 'text-emerald-600'}">
                ${criticalHighCount} high-priority
              </span>
              <span>• ${todoCount} pending start</span>
            </div>
            <div class="mt-3 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div class="h-full bg-slate-950 rounded-full transition-all duration-500" style="width: ${totalScoped > 0 ? ((inFlightCount / totalScoped) * 100) : 0}%"></div>
            </div>
          </div>

          <!-- Card 2: In Development / Coding -->
          <div onclick="MyIssuesView.setTab('in_dev')" class="group relative overflow-hidden rounded-2xl bg-white p-5 border ${this.activeTab === 'in_dev' ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-md' : 'border-slate-200/90 shadow-2xs hover:border-amber-300'} transition cursor-pointer card-hover">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold uppercase tracking-wider text-amber-600">In Development</span>
              <div class="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center transition group-hover:scale-110">
                <i data-lucide="code-2" class="w-4 h-4"></i>
              </div>
            </div>
            <div class="mt-3 flex items-baseline gap-2">
              <span class="text-2xl font-black text-amber-600 tracking-tight">${inDevCount}</span>
              <span class="text-xs font-semibold text-slate-400">tasks active</span>
            </div>
            <div class="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
              <span class="font-bold text-amber-700">${inDevPoints} Story Points</span>
              <span>in active coding</span>
            </div>
            <div class="mt-3 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div class="h-full bg-amber-500 rounded-full transition-all duration-500" style="width: ${totalScoped > 0 ? ((inDevCount / totalScoped) * 100) : 0}%"></div>
            </div>
          </div>

          <!-- Card 3: Ready for QA & Testing -->
          <div onclick="MyIssuesView.setTab('ready_for_qa')" class="group relative overflow-hidden rounded-2xl bg-white p-5 border ${this.activeTab === 'ready_for_qa' || this.activeTab === 'qa_testing' ? 'border-purple-500 ring-2 ring-purple-500/20 shadow-md' : 'border-slate-200/90 shadow-2xs hover:border-purple-300'} transition cursor-pointer card-hover">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold uppercase tracking-wider text-purple-600">QA Clearance Gate</span>
              <div class="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center transition group-hover:scale-110">
                <i data-lucide="flask-conical" class="w-4 h-4"></i>
              </div>
            </div>
            <div class="mt-3 flex items-baseline gap-2">
              <span class="text-2xl font-black text-purple-700 tracking-tight">${readyForQaCount + qaTestingCount}</span>
              <span class="text-xs font-semibold text-slate-400">in verification</span>
            </div>
            <div class="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
              <span class="font-bold text-purple-700">${readyForQaCount} ready</span>
              <span>• ${qaTestingCount} under test</span>
              ${retestingCount > 0 ? `<span class="text-rose-600 font-bold">• ${retestingCount} retest</span>` : ''}
            </div>
            <div class="mt-3 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div class="h-full bg-purple-500 rounded-full transition-all duration-500" style="width: ${totalScoped > 0 ? (((readyForQaCount + qaTestingCount) / totalScoped) * 100) : 0}%"></div>
            </div>
          </div>

          <!-- Card 4: Completed & Verified -->
          <div onclick="MyIssuesView.setTab('completed')" class="group relative overflow-hidden rounded-2xl bg-white p-5 border ${this.activeTab === 'completed' ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md' : 'border-slate-200/90 shadow-2xs hover:border-emerald-300'} transition cursor-pointer card-hover">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Gate Verified ✓</span>
              <div class="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center transition group-hover:scale-110">
                <i data-lucide="check-check" class="w-4 h-4"></i>
              </div>
            </div>
            <div class="mt-3 flex items-baseline gap-2">
              <span class="text-2xl font-black text-emerald-600 tracking-tight">${completedCount}</span>
              <span class="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">${completionRate}% done</span>
            </div>
            <div class="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
              <span class="font-bold text-emerald-700">Closed & Verified</span>
              <span>zero regressions</span>
            </div>
            <div class="mt-3 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div class="h-full bg-emerald-500 rounded-full transition-all duration-500" style="width: ${completionRate}%"></div>
            </div>
          </div>

        </div>

        <!-- =========================================================================
             3. ADVANCED CONTROLS & FILTER TOOLBAR
             ========================================================================= -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3.5">
          
          <!-- Top Row: Search Bar, Quick Pills, and View Modes -->
          <div class="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            
            <!-- Live Search Bar -->
            <div class="relative flex-1 max-w-md">
              <i data-lucide="search" class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"></i>
              <input
                type="text"
                placeholder="Search key, title, tags, description..."
                value="${this.searchQuery}"
                oninput="MyIssuesView.setSearch(this.value)"
                class="w-full pl-9 pr-8 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] transition"
              />
              ${this.searchQuery ? `
                <button onclick="MyIssuesView.setSearch('')" class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                  <i data-lucide="x" class="w-3.5 h-3.5"></i>
                </button>
              ` : ''}
            </div>

            <!-- Filter Dropdowns & View Switcher -->
            <div class="flex flex-wrap items-center gap-2">
              
              <!-- Project Filter -->
              <select onchange="MyIssuesView.setProjectFilter(this.value)" class="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] transition cursor-pointer">
                <option value="all" ${this.projectFilter === 'all' ? 'selected' : ''}>All Projects (${projects.length})</option>
                ${projects.map(p => `
                  <option value="${p.id}" ${this.projectFilter === p.id ? 'selected' : ''}>${p.name}</option>
                `).join('')}
              </select>

              <!-- Issue Type Filter -->
              <select onchange="MyIssuesView.setTypeFilter(this.value)" class="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] transition cursor-pointer">
                <option value="all" ${this.typeFilter === 'all' ? 'selected' : ''}>All Types</option>
                <option value="Bug" ${this.typeFilter === 'Bug' ? 'selected' : ''}>🐛 Bugs Only</option>
                <option value="Story" ${this.typeFilter === 'Story' ? 'selected' : ''}>📖 Stories</option>
                <option value="Task" ${this.typeFilter === 'Task' ? 'selected' : ''}>✅ Tasks</option>
              </select>

              <!-- Priority Filter -->
              <select onchange="MyIssuesView.setPriorityFilter(this.value)" class="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] transition cursor-pointer">
                <option value="all" ${this.priorityFilter === 'all' ? 'selected' : ''}>All Priorities</option>
                <option value="CriticalHigh" ${this.priorityFilter === 'CriticalHigh' ? 'selected' : ''}>🔥 Critical & High</option>
                <option value="Critical" ${this.priorityFilter === 'Critical' ? 'selected' : ''}>🔴 Critical (P0)</option>
                <option value="High" ${this.priorityFilter === 'High' ? 'selected' : ''}>🟠 High (P1)</option>
                <option value="Medium" ${this.priorityFilter === 'Medium' ? 'selected' : ''}>🟡 Medium (P2)</option>
                <option value="Low" ${this.priorityFilter === 'Low' ? 'selected' : ''}>🟢 Low (P3)</option>
              </select>

              <!-- Sort Order -->
              <select onchange="MyIssuesView.setSortBy(this.value)" class="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#bef264]/50 focus:border-[#84cc16] transition cursor-pointer">
                <option value="priority" ${this.sortBy === 'priority' ? 'selected' : ''}>Sort: Highest Priority</option>
                <option value="updated" ${this.sortBy === 'updated' ? 'selected' : ''}>Sort: Recently Updated</option>
                <option value="key" ${this.sortBy === 'key' ? 'selected' : ''}>Sort: Issue Key</option>
                <option value="points" ${this.sortBy === 'points' ? 'selected' : ''}>Sort: Story Points</option>
                <option value="duedate" ${this.sortBy === 'duedate' ? 'selected' : ''}>Sort: Due Date</option>
              </select>

              <!-- View Mode Toggle -->
              <div class="bg-slate-100 p-0.5 rounded-xl border border-slate-200 flex items-center">
                <button onclick="MyIssuesView.setViewMode('grid')" class="p-1.5 rounded-lg transition cursor-pointer ${this.viewMode === 'grid' ? 'bg-slate-950 text-[#bef264] shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-900'}" title="Bento Card Grid">
                  <i data-lucide="layout-grid" class="w-4 h-4"></i>
                </button>
                <button onclick="MyIssuesView.setViewMode('table')" class="p-1.5 rounded-lg transition cursor-pointer ${this.viewMode === 'table' ? 'bg-slate-950 text-[#bef264] shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-900'}" title="Enterprise Table">
                  <i data-lucide="table" class="w-4 h-4"></i>
                </button>
              </div>

            </div>

          </div>

          <!-- Bottom Row: Quick Status Tabs -->
          <div class="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
            
            <div class="flex items-center gap-1.5 overflow-x-auto horizontal-scroll-touch pb-1">
              <button onclick="MyIssuesView.setTab('in_flight')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${this.activeTab === 'in_flight' ? 'bg-slate-950 text-[#bef264] shadow-xs' : 'bg-slate-50 hover:bg-slate-100 text-slate-600'}">
                <span>In-Flight</span>
                <span class="px-1.5 py-0.2 rounded-full text-[10px] ${this.activeTab === 'in_flight' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}">${inFlightCount}</span>
              </button>

              <button onclick="MyIssuesView.setTab('todo')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${this.activeTab === 'todo' ? 'bg-slate-800 text-white shadow-xs' : 'bg-slate-50 hover:bg-slate-100 text-slate-600'}">
                <span>To Do / Open</span>
                <span class="px-1.5 py-0.2 rounded-full text-[10px] ${this.activeTab === 'todo' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}">${todoCount}</span>
              </button>

              <button onclick="MyIssuesView.setTab('in_dev')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${this.activeTab === 'in_dev' ? 'bg-amber-600 text-white shadow-xs' : 'bg-slate-50 hover:bg-slate-100 text-slate-600'}">
                <span>In Progress</span>
                <span class="px-1.5 py-0.2 rounded-full text-[10px] ${this.activeTab === 'in_dev' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}">${inDevCount}</span>
              </button>

              <button onclick="MyIssuesView.setTab('ready_for_qa')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${this.activeTab === 'ready_for_qa' ? 'bg-purple-600 text-white shadow-xs' : 'bg-slate-50 hover:bg-slate-100 text-slate-600'}">
                <span>Ready for QA</span>
                <span class="px-1.5 py-0.2 rounded-full text-[10px] ${this.activeTab === 'ready_for_qa' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}">${readyForQaCount}</span>
              </button>

              <button onclick="MyIssuesView.setTab('qa_testing')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${this.activeTab === 'qa_testing' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-50 hover:bg-slate-100 text-slate-600'}">
                <span>QA Testing</span>
                <span class="px-1.5 py-0.2 rounded-full text-[10px] ${this.activeTab === 'qa_testing' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}">${qaTestingCount}</span>
              </button>

              <button onclick="MyIssuesView.setTab('retesting')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${this.activeTab === 'retesting' ? 'bg-rose-600 text-white shadow-xs' : 'bg-slate-50 hover:bg-slate-100 text-slate-600'}">
                <span>Retesting</span>
                <span class="px-1.5 py-0.2 rounded-full text-[10px] ${this.activeTab === 'retesting' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}">${retestingCount}</span>
              </button>

              <button onclick="MyIssuesView.setTab('completed')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${this.activeTab === 'completed' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-50 hover:bg-slate-100 text-slate-600'}">
                <span>Completed</span>
                <span class="px-1.5 py-0.2 rounded-full text-[10px] ${this.activeTab === 'completed' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}">${completedCount}</span>
              </button>

              <button onclick="MyIssuesView.setTab('all')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${this.activeTab === 'all' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-50 hover:bg-slate-100 text-slate-600'}">
                <span>All Scope</span>
                <span class="px-1.5 py-0.2 rounded-full text-[10px] ${this.activeTab === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}">${totalScoped}</span>
              </button>
            </div>

            <!-- Active Filter Summary & Reset -->
            <div class="flex items-center gap-2 text-xs text-slate-400">
              <span>Showing <strong>${filteredIssues.length}</strong> items</span>
              ${(this.searchQuery || this.priorityFilter !== 'all' || this.typeFilter !== 'all' || this.projectFilter !== 'all' || this.activeTab !== 'in_flight') ? `
                <button onclick="MyIssuesView.resetFilters()" class="text-slate-900 hover:text-[#4d7c0f] font-bold underline cursor-pointer ml-1">
                  Reset
                </button>
              ` : ''}
            </div>

          </div>

        </div>

        <!-- =========================================================================
             4. MAIN TASK DISPLAY (Bento Cards or Enterprise Table)
             ========================================================================= -->
        ${filteredIssues.length === 0 ? `
          <!-- High-End Celebratory Empty State -->
          <div class="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-2xs space-y-4">
            <div class="relative w-16 h-16 mx-auto">
              <div class="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner ring-8 ring-emerald-50/50">
                <i data-lucide="check-circle-2" class="w-8 h-8"></i>
              </div>
              <div class="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#bef264] flex items-center justify-center text-slate-950 font-black text-[10px] shadow">
                ✓
              </div>
            </div>

            <div class="max-w-md mx-auto">
              <h3 class="text-base font-bold text-slate-900">You're All Caught Up!</h3>
              <p class="text-xs text-slate-500 mt-1">
                ${this.searchQuery || this.priorityFilter !== 'all' || this.typeFilter !== 'all' || this.projectFilter !== 'all'
                  ? 'No tasks matched your specific filter combination. Try clearing your filters to see more tasks.'
                  : 'Zero pending tasks found in this queue. Great job keeping your delivery pipeline clean!'}
              </p>
            </div>

            <div class="flex flex-wrap items-center justify-center gap-3 pt-2">
              ${(this.searchQuery || this.priorityFilter !== 'all' || this.typeFilter !== 'all' || this.projectFilter !== 'all' || this.activeTab !== 'in_flight') ? `
                <button onclick="MyIssuesView.resetFilters()" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs transition cursor-pointer">
                  Reset All Filters
                </button>
              ` : ''}
              <button onclick="window.app.openCreateIssueModal()" class="px-4 py-2 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 rounded-xl font-bold text-xs shadow-xs shadow-[#bef264]/25 transition flex items-center gap-1.5 cursor-pointer">
                <i data-lucide="plus" class="w-4 h-4"></i>
                <span>Create New Task</span>
              </button>
              <button onclick="window.app.navigate('all-issues')" class="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer">
                <i data-lucide="list-todo" class="w-4 h-4"></i>
                <span>Browse All Project Issues</span>
              </button>
            </div>
          </div>
        ` : this.viewMode === "grid" ? `
          
          <!-- =========================================================================
               4A. 3D BENTO CARDS GRID VIEW (Interactive 1-Click Transitions)
               ========================================================================= -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            ${filteredIssues.map(issue => {
              const proj = store.getProjectById(issue.projectId);
              const sprint = issue.sprintId ? store.getSprintById(issue.sprintId) : null;
              const dev = store.getUserById(issue.developerId || issue.assigneeId);
              const qa = store.getUserById(issue.qaId || "u-qa-1");
              const gate = store.getQualityGate ? store.getQualityGate(issue) : { isPassed: issue.status === "Done" || issue.qaStatus === "Passed", status: issue.qaStatus };
              
              const isBug = issue.type === "Bug";
              const isCritical = issue.priority === "Critical";
              const isHigh = issue.priority === "High";

              return `
                <div onclick="window.app.openIssueDetails('${issue.id}')" class="group relative rounded-2xl bg-white border border-slate-200/90 hover:border-slate-400 shadow-2xs hover:shadow-md transition flex flex-col justify-between p-4 cursor-pointer card-hover overflow-hidden">
                  
                  <!-- Top Bar: Key, Type, Priority & Project -->
                  <div>
                    <div class="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                      <div class="flex items-center gap-1.5 flex-wrap">
                        <span class="font-mono font-black text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                          ${issue.key}
                        </span>
                        <span class="px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${isBug ? 'type-bug' : issue.type === 'Story' ? 'type-story' : 'type-task'}">
                          ${issue.type}
                        </span>
                      </div>

                      <div class="flex items-center gap-1.5">
                        <span class="px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          isCritical ? 'priority-critical ring-1 ring-rose-300' :
                          isHigh ? 'priority-high' :
                          issue.priority === 'Medium' ? 'priority-medium' : 'priority-low'
                        }">
                          ${issue.priority}
                        </span>
                      </div>
                    </div>

                    <!-- Project & Sprint Subtitle -->
                    <div class="mt-2.5 flex items-center justify-between gap-2 text-[11px] text-slate-400">
                      <span class="font-bold text-slate-700 truncate">${proj ? proj.name : 'Unassigned Project'}</span>
                      <span class="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium text-[10px] shrink-0">
                        ${sprint ? sprint.name : 'Backlog'}
                      </span>
                    </div>

                    <!-- Title & Summary -->
                    <h3 class="mt-1.5 font-bold text-slate-900 text-sm leading-snug group-hover:text-[#4d7c0f] transition line-clamp-2">
                      ${issue.title}
                    </h3>

                    <!-- Story Points & Due Date & QA Status -->
                    <div class="mt-3 flex flex-wrap items-center gap-1.5 text-[10px]">
                      
                      <!-- Quality Gate Pill -->
                      ${gate.isPassed ? `
                        <span class="px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <i data-lucide="check" class="w-3 h-3 text-emerald-600"></i> QA Passed
                        </span>
                      ` : gate.status === 'failed' || issue.qaStatus === 'Failed' ? `
                        <span class="px-2 py-0.5 rounded-full font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                          <i data-lucide="alert-triangle" class="w-3 h-3 text-rose-600"></i> QA Failed (${issue.reopenCount || 1}x)
                        </span>
                      ` : issue.status === 'Ready for QA' ? `
                        <span class="px-2 py-0.5 rounded-full font-bold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                          <i data-lucide="clock" class="w-3 h-3 text-purple-600"></i> Ready for QA
                        </span>
                      ` : `
                        <span class="px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-600 flex items-center gap-1">
                          <i data-lucide="circle-dot" class="w-3 h-3 text-slate-400"></i> ${issue.status}
                        </span>
                      `}

                      ${issue.storyPoints ? `
                        <span class="px-2 py-0.5 rounded-full font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          ${issue.storyPoints} SP
                        </span>
                      ` : ''}

                      ${issue.dueDate ? `
                        <span class="px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600 flex items-center gap-1">
                          <i data-lucide="calendar" class="w-3 h-3"></i> ${issue.dueDate}
                        </span>
                      ` : ''}
                    </div>
                  </div>

                  <!-- Bottom Interactive Action Bar -->
                  <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2" onclick="event.stopPropagation()">
                    
                    <!-- Quick 1-Click Action Flow -->
                    <div class="flex items-center gap-1.5 flex-wrap">
                      ${issue.status === 'To Do' || issue.status === 'Open' ? `
                        <button onclick="MyIssuesView.updateStatus('${issue.id}', 'In Progress', event)" class="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-[11px] font-bold transition cursor-pointer flex items-center gap-1">
                          <i data-lucide="play" class="w-3 h-3"></i> Start
                        </button>
                      ` : issue.status === 'In Progress' || issue.status === 'In Development' ? `
                        <button onclick="MyIssuesView.updateStatus('${issue.id}', 'Ready for QA', event)" class="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-[11px] font-bold transition cursor-pointer flex items-center gap-1">
                          <i data-lucide="send" class="w-3 h-3"></i> To QA
                        </button>
                      ` : issue.status === 'Ready for QA' ? `
                        <button onclick="MyIssuesView.updateStatus('${issue.id}', 'QA Testing', event)" class="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-bold transition cursor-pointer flex items-center gap-1">
                          <i data-lucide="flask-conical" class="w-3 h-3"></i> Test
                        </button>
                      ` : issue.status === 'QA Testing' ? `
                        <button onclick="MyIssuesView.updateStatus('${issue.id}', 'Done', event)" class="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[11px] font-bold transition cursor-pointer flex items-center gap-1">
                          <i data-lucide="check" class="w-3 h-3"></i> Pass
                        </button>
                        <button onclick="MyIssuesView.updateStatus('${issue.id}', 'Reopened', event)" class="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold transition cursor-pointer flex items-center gap-1">
                          <i data-lucide="rotate-ccw" class="w-3 h-3"></i> Fail
                        </button>
                      ` : issue.status === 'Reopened' ? `
                        <button onclick="MyIssuesView.updateStatus('${issue.id}', 'In Progress', event)" class="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-[11px] font-bold transition cursor-pointer flex items-center gap-1">
                          <i data-lucide="refresh-cw" class="w-3 h-3"></i> Fix
                        </button>
                      ` : `
                        <span class="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                          ✓ Completed
                        </span>
                      `}

                      <!-- Inline Status Dropdown for Full Flexibility -->
                      <select onchange="MyIssuesView.updateStatus('${issue.id}', this.value, event)" class="py-1 px-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 focus:outline-none focus:ring-1 focus:ring-[#bef264]/50 focus:border-[#84cc16] transition cursor-pointer">
                        <option value="To Do" ${issue.status === 'To Do' || issue.status === 'Open' ? 'selected' : ''}>To Do</option>
                        <option value="In Progress" ${issue.status === 'In Progress' || issue.status === 'In Development' ? 'selected' : ''}>In Progress</option>
                        <option value="Ready for QA" ${issue.status === 'Ready for QA' || issue.status === 'Fixed' ? 'selected' : ''}>Ready for QA</option>
                        <option value="QA Testing" ${issue.status === 'QA Testing' || issue.status === 'QA' ? 'selected' : ''}>QA Testing</option>
                        <option value="Reopened" ${issue.status === 'Reopened' ? 'selected' : ''}>Reopened</option>
                        <option value="Done" ${issue.status === 'Done' || issue.status === 'Closed' ? 'selected' : ''}>Done ✓</option>
                      </select>
                    </div>

                    <!-- Details Inspect Button -->
                    <button onclick="window.app.openIssueDetails('${issue.id}')" class="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-950 hover:text-[#bef264] text-slate-600 transition cursor-pointer font-bold text-xs" title="Open Complete Details">
                      <i data-lucide="chevron-right" class="w-4 h-4"></i>
                    </button>
                  </div>

                </div>
              `;
            }).join('')}
          </div>

        ` : `

          <!-- =========================================================================
               4B. ENTERPRISE TABLE VIEW
               ========================================================================= -->
          <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full text-left text-slate-700 min-w-[920px]">
                <thead class="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <tr>
                    <th class="py-3.5 px-4">Key</th>
                    <th class="py-3.5 px-4">Type</th>
                    <th class="py-3.5 px-4">Project & Sprint</th>
                    <th class="py-3.5 px-4 max-w-sm">Summary</th>
                    <th class="py-3.5 px-4">Quality Gate</th>
                    <th class="py-3.5 px-4">Priority</th>
                    <th class="py-3.5 px-4">Status & Transition</th>
                    <th class="py-3.5 px-4">Dev / QA</th>
                    <th class="py-3.5 px-4 text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 text-xs">
                  ${filteredIssues.map(issue => {
                    const proj = store.getProjectById(issue.projectId);
                    const sprint = issue.sprintId ? store.getSprintById(issue.sprintId) : null;
                    const dev = store.getUserById(issue.developerId || issue.assigneeId);
                    const qa = store.getUserById(issue.qaId || "u-qa-1");
                    const gate = store.getQualityGate ? store.getQualityGate(issue) : { isPassed: issue.status === "Done" || issue.qaStatus === "Passed", status: issue.qaStatus };
                    const isBug = issue.type === "Bug";

                    return `
                      <tr class="hover:bg-slate-50/80 transition cursor-pointer group" onclick="window.app.openIssueDetails('${issue.id}')">
                        <td class="py-3.5 px-4 font-mono font-black text-slate-900">
                          ${issue.key}
                        </td>
                        <td class="py-3.5 px-4">
                          <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase ${isBug ? 'type-bug' : issue.type === 'Story' ? 'type-story' : 'type-task'}">
                            ${issue.type}
                          </span>
                        </td>
                        <td class="py-3.5 px-4">
                          <div class="font-bold text-slate-900 truncate max-w-[140px]">${proj ? proj.name : 'Project'}</div>
                          <span class="text-[10px] text-slate-400">${sprint ? sprint.name : 'Backlog'}</span>
                        </td>
                        <td class="py-3.5 px-4 max-w-sm">
                          <div class="font-semibold text-slate-900 truncate group-hover:text-[#4d7c0f] transition">
                            ${issue.title}
                          </div>
                          ${issue.reopenCount > 0 ? `
                            <span class="inline-block mt-0.5 px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 font-bold text-[9px]">
                              Reopened ${issue.reopenCount}x
                            </span>
                          ` : ''}
                        </td>
                        <td class="py-3.5 px-4">
                          ${gate.isPassed ? `
                            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 w-fit">
                              <i data-lucide="check" class="w-3 h-3 text-emerald-600"></i> QA Passed
                            </span>
                          ` : gate.status === 'failed' || issue.qaStatus === 'Failed' ? `
                            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1 w-fit">
                              <i data-lucide="alert-triangle" class="w-3 h-3 text-rose-600"></i> QA Failed
                            </span>
                          ` : issue.status === 'Ready for QA' ? `
                            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1 w-fit">
                              <i data-lucide="clock" class="w-3 h-3 text-purple-600"></i> Ready
                            </span>
                          ` : `
                            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 flex items-center gap-1 w-fit">
                              <i data-lucide="circle-dot" class="w-3 h-3 text-slate-400"></i> ${issue.status}
                            </span>
                          `}
                        </td>
                        <td class="py-3.5 px-4">
                          <span class="px-2 py-0.5 rounded text-[10px] font-bold ${
                            issue.priority === 'Critical' ? 'priority-critical' :
                            issue.priority === 'High' ? 'priority-high' :
                            issue.priority === 'Medium' ? 'priority-medium' : 'priority-low'
                          }">
                            ${issue.priority}
                          </span>
                        </td>
                        <td class="py-3.5 px-4" onclick="event.stopPropagation()">
                          <select onchange="MyIssuesView.updateStatus('${issue.id}', this.value, event)" class="py-1 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#bef264]/50 focus:border-[#84cc16] transition cursor-pointer">
                            <option value="To Do" ${issue.status === 'To Do' || issue.status === 'Open' ? 'selected' : ''}>To Do</option>
                            <option value="In Progress" ${issue.status === 'In Progress' || issue.status === 'In Development' ? 'selected' : ''}>In Progress</option>
                            <option value="Ready for QA" ${issue.status === 'Ready for QA' || issue.status === 'Fixed' ? 'selected' : ''}>Ready for QA</option>
                            <option value="QA Testing" ${issue.status === 'QA Testing' || issue.status === 'QA' ? 'selected' : ''}>QA Testing</option>
                            <option value="Reopened" ${issue.status === 'Reopened' ? 'selected' : ''}>Reopened</option>
                            <option value="Done" ${issue.status === 'Done' || issue.status === 'Closed' ? 'selected' : ''}>Done ✓</option>
                          </select>
                        </td>
                        <td class="py-3.5 px-4 text-[11px]">
                          <div class="font-medium text-slate-700">Dev: ${dev ? dev.name.split(" ")[0] : 'Unassigned'}</div>
                          <div class="text-purple-700 font-semibold">QA: ${qa ? qa.name.split(" ")[0] : 'Lead'}</div>
                        </td>
                        <td class="py-3.5 px-4 text-right" onclick="event.stopPropagation()">
                          <button onclick="window.app.openIssueDetails('${issue.id}')" class="px-3 py-1 bg-slate-100 hover:bg-slate-950 hover:text-[#bef264] text-slate-700 rounded-lg font-bold text-[11px] transition cursor-pointer">
                            Inspect →
                          </button>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        `}

      </div>
    `;

    // Initialize Lucide Icons
    if (window.lucide) window.lucide.createIcons();

    // Initialize Hero Canvas Animation
    this.initCanvas();
  },

  // ==========================================
  // Interactive State Handlers
  // ==========================================
  setTab(tab) {
    this.activeTab = tab;
    this.render(document.getElementById("mainContent"));
  },

  setScope(scope) {
    this.assignmentScope = scope;
    this.render(document.getElementById("mainContent"));
  },

  setSearch(query) {
    this.searchQuery = query;
    this.render(document.getElementById("mainContent"));
  },

  setPriorityFilter(priority) {
    this.priorityFilter = priority;
    this.render(document.getElementById("mainContent"));
  },

  setTypeFilter(type) {
    this.typeFilter = type;
    this.render(document.getElementById("mainContent"));
  },

  setProjectFilter(projectId) {
    this.projectFilter = projectId;
    this.render(document.getElementById("mainContent"));
  },

  setSortBy(sortBy) {
    this.sortBy = sortBy;
    this.render(document.getElementById("mainContent"));
  },

  setViewMode(mode) {
    this.viewMode = mode;
    this.render(document.getElementById("mainContent"));
  },

  resetFilters() {
    this.searchQuery = "";
    this.priorityFilter = "all";
    this.typeFilter = "all";
    this.projectFilter = "all";
    this.activeTab = "in_flight";
    this.render(document.getElementById("mainContent"));
  },

  async updateStatus(issueId, newStatus, event) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    try {
      const issue = store.getIssueById(issueId);
      if (!issue) return;

      const oldStatus = issue.status;
      await store.updateIssueStatus(issueId, newStatus);

      if (window.app && window.app.toast) {
        window.app.toast("Status Updated", `Task ${issue.key} moved from "${oldStatus}" to "${newStatus}"`, "success");
      }

      const mainContent = document.getElementById("mainContent");
      if (mainContent) {
        this.render(mainContent);
      }
    } catch (err) {
      console.error("Failed to update status:", err);
      if (window.app && window.app.toast) {
        window.app.toast("Update Notice", err.message || "Failed to update status", "error");
      }
    }
  },

  exportCSV() {
    const activeUser = store.getActiveUser();
    const issuesToExport = (this.lastFilteredIssues && this.lastFilteredIssues.length > 0)
      ? this.lastFilteredIssues
      : (store.getIssues() || []).filter(i => (i.assigneeId === activeUser?.id || i.developerId === activeUser?.id));

    const escapeCSV = (val) => {
      if (val === null || val === undefined) return '""';
      const s = String(val).replace(/"/g, '""');
      return `"${s}"`;
    };

    const headers = ["Key", "Type", "Title", "Status", "Priority", "Project", "Sprint", "Assignee", "QA Status", "Story Points", "Due Date", "Updated At"];
    const rows = [headers];

    issuesToExport.forEach(i => {
      const proj = store.getProjectById(i.projectId);
      const sprint = i.sprintId ? store.getSprintById(i.sprintId) : null;
      const assignee = store.getUserById(i.assigneeId || i.developerId);
      rows.push([
        escapeCSV(i.key),
        escapeCSV(i.type),
        escapeCSV(i.title),
        escapeCSV(i.status),
        escapeCSV(i.priority),
        escapeCSV(proj ? proj.name : ""),
        escapeCSV(sprint ? sprint.name : ""),
        escapeCSV(assignee ? assignee.name : "Unassigned"),
        escapeCSV(i.qaStatus || "Not Tested"),
        escapeCSV(i.storyPoints || 0),
        escapeCSV(i.dueDate || ""),
        escapeCSV(i.updatedAt || i.updated_at || "")
      ]);
    });

    const csvContent = "data:text/csv;charset=utf-8," + rows.map(r => r.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `assigned_tasks_${activeUser ? activeUser.name.replace(/\s+/g, "_") : "user"}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (window.app && window.app.toast) {
      window.app.toast("Export Complete", `Exported ${issuesToExport.length} tasks to CSV format.`, "success");
    }
  },

  // ==========================================
  // 3D Holographic Canvas Animator
  // ==========================================
  initCanvas() {
    if (typeof requestAnimationFrame !== "function") return;

    const canvas = document.getElementById("assignedMeshCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement ? canvas.parentElement.clientWidth : 800);
    let height = (canvas.height = canvas.parentElement ? canvas.parentElement.clientHeight : 240);

    const particles = [];
    const count = Math.min(32, Math.floor(width / 30));

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.7,
        vy: (Math.random() - 0.5) * 0.7,
        radius: Math.random() * 2 + 1,
        color: i % 3 === 0 ? "#bef264" : i % 3 === 1 ? "#38bdf8" : "#818cf8"
      });
    }

    let angle = 0;

    const renderFrame = () => {
      if (!document.getElementById("assignedMeshCanvas")) return;

      ctx.clearRect(0, 0, width, height);

      // Rotating Holographic Hexagon in center
      angle += 0.008;
      const cx = width * 0.85;
      const cy = height * 0.5;
      const hexRadius = 45;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      ctx.beginPath();
      for (let s = 0; s < 6; s++) {
        const a = (s * Math.PI) / 3;
        const hx = Math.cos(a) * hexRadius;
        const hy = Math.sin(a) * hexRadius;
        if (s === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.strokeStyle = "rgba(190, 242, 100, 0.25)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Inner Rotating Hexagon
      ctx.rotate(-angle * 2);
      ctx.beginPath();
      for (let s = 0; s < 6; s++) {
        const a = (s * Math.PI) / 3;
        const hx = Math.cos(a) * (hexRadius * 0.55);
        const hy = Math.sin(a) * (hexRadius * 0.55);
        if (s === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.strokeStyle = "rgba(56, 189, 248, 0.3)";
      ctx.stroke();
      ctx.restore();

      // Update & Draw Particles with Interconnecting Laser Links
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw connecting links
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(190, 242, 100, ${(1 - dist / 110) * 0.18})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      this.animFrameId = requestAnimationFrame(renderFrame);
    };

    this.animFrameId = requestAnimationFrame(renderFrame);
  }
};

window.MyIssuesView = MyIssuesView;
window.AssignedToMeView = MyIssuesView;
if (typeof module !== "undefined" && module.exports) {
  module.exports = MyIssuesView;
}
