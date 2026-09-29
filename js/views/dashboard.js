/**
 * All-in-One Software Project & QA Management Platform (V2)
 * Futuristic Executive & Quality Command Center Dashboard
 * Next-Gen 3D Holographic Bento Cards, Topographic Wave Mesh & Particle Vortex Visualizations
 */

const DashboardView = {
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

  render(container) {
    this.destroyAnimationLoops();

    const stats = store.getGlobalStats ? store.getGlobalStats() : { activeProjectsCount: 0, totalIssues: 0, openBugs: 0, criticalBugs: 0, inProgress: 0, readyForQa: 0, completed: 0 };
    const activeUser = (store.getActiveUser && store.getActiveUser()) || { name: "Team Member", initials: "TM", role: "PROJECT_MANAGER", email: "user@pulsewave.io", color: "bg-slate-950 text-[#bef264]" };
    const activeWorkspace = store.getActiveWorkspace ? store.getActiveWorkspace() : (store.getWorkspaces ? store.getWorkspaces()[0] : { name: "PulseWave Workspace", slug: "pulsewave", logo_color: "bg-slate-950 text-[#bef264]" });
    const allWorkspaces = store.getWorkspaces ? store.getWorkspaces() : [];
    const activeProject = store.getActiveProject ? store.getActiveProject() : null;
    const projects = (store.getProjects ? store.getProjects() : []) || [];
    const allIssues = (store.getIssues ? store.getIssues() : []) || [];
    const activities = (store.getActivities ? store.getActivities(8) : []) || [];

    // Compute high-priority & QA queues with robust case-insensitivity
    const openBugs = allIssues.filter(i => {
      const t = (i.type || i.issue_type || '').toLowerCase().trim();
      return (t === "bug" || t === "defect") && i.status !== "Done" && i.status !== "Closed";
    });
    const criticalBugs = openBugs.filter(i => {
      const p = (i.priority || i.severity || '').toLowerCase().trim();
      return p === "critical" || p === "p0";
    });
    const highBugs = openBugs.filter(i => {
      const p = (i.priority || i.severity || '').toLowerCase().trim();
      return p === "high" || p === "p1";
    });
    const mediumBugs = openBugs.filter(i => {
      const p = (i.priority || i.severity || '').toLowerCase().trim();
      return p === "medium" || p === "p2" || p === "normal";
    });
    const lowBugs = openBugs.filter(i => {
      const p = (i.priority || i.severity || '').toLowerCase().trim();
      return p === "low" || p === "p3" || (!["critical", "p0", "high", "p1", "medium", "p2", "normal"].includes(p));
    });

    const criticalWatchlist = openBugs
      .filter(i => {
        const p = (i.priority || i.severity || '').toLowerCase().trim();
        return p === "critical" || p === "p0" || p === "high" || p === "p1";
      })
      .slice(0, 5);

    const qaQueue = allIssues
      .filter(i => {
        const s = (i.status || "").toLowerCase().trim();
        const qs = (i.qaStatus || i.qa_status || "").toLowerCase().trim();
        return s === "ready for qa" || s === "fixed" || s === "qa" || s === "qa testing" || s === "in qa" || s === "testing" || qs === "ready for qa" || qs === "testing" || qs === "in qa";
      })
      .slice(0, 5);

    const isUserAssigned = (i) => {
      if (!activeUser) return false;
      const uId = String(activeUser.id || "").toLowerCase();
      const uSupabaseId = String(activeUser.supabase_id || "").toLowerCase();
      const uEmail = String(activeUser.email || "").toLowerCase().trim();
      const uName = String(activeUser.name || "").toLowerCase().trim();

      const candidateIds = [
        i.assigneeId,
        i.assignee_id,
        i.developerId,
        i.developer_id,
        i.qaId,
        i.qa_id,
        i.assignee
      ].filter(Boolean).map(x => String(x).toLowerCase().trim());

      return candidateIds.some(c => (uId && c === uId) || (uSupabaseId && c === uSupabaseId) || (uEmail && c === uEmail) || (uName && c === uName));
    };

    const myAssignedIssues = allIssues
      .filter(i => isUserAssigned(i) && i.status !== "Done" && i.status !== "Closed")
      .slice(0, 5);

    // Aggregate Story Points & Velocity
    let totalStoryPoints = 0;
    let completedStoryPoints = 0;
    allIssues.forEach(i => {
      const sp = Number(i.storyPoints || i.story_points || i.points || 0) || (i.priority === "Critical" ? 8 : i.priority === "High" ? 5 : i.priority === "Medium" ? 3 : 1);
      totalStoryPoints += sp;
      if (i.status === "Done" || i.status === "Closed" || (i.qaStatus && i.qaStatus.toLowerCase() === 'passed')) {
        completedStoryPoints += sp;
      }
    });

    const completionRate = stats.totalIssues > 0 ? Math.round((stats.completed / stats.totalIssues) * 100) : 0;
    const avgHealth = Math.round(projects.reduce((acc, p) => acc + (p.health || 85), 0) / (projects.length || 1));

    container.innerHTML = `
      <div class="space-y-6 animate-fade-in pb-12">
        
        <!-- =========================================================================
             1. LOGGED-IN USER & WORKSPACE PROFILE BANNER
             ========================================================================= -->
        <div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
          <div class="absolute -top-12 -right-12 w-36 h-36 bg-[#bef264]/20 rounded-full blur-2xl pointer-events-none"></div>

          <div class="flex items-center gap-3.5 min-w-0 relative z-10">
            <div class="w-12 h-12 rounded-2xl bg-slate-950 text-[#bef264] border-2 border-[#bef264]/80 font-black text-base flex items-center justify-center shadow-xs shrink-0 uppercase">
              ${activeUser.initials || (activeUser.name ? activeUser.name.substring(0, 2).toUpperCase() : 'PW')}
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <h2 class="text-base sm:text-lg font-black text-slate-950 tracking-tight truncate">
                  ${activeUser.name || 'User'}
                </h2>
                <span class="px-2.5 py-0.5 rounded-md bg-[#f7fee7] text-[#4d7c0f] border border-[#d9f99d] text-[10px] font-extrabold uppercase tracking-wider">
                  ${activeUser.role || 'PROJECT_MANAGER'}
                </span>
                <span class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px]">
                  ● Authenticated User
                </span>
              </div>
              <p class="text-xs text-slate-500 font-medium flex items-center gap-2 mt-1 truncate">
                <span class="flex items-center gap-1"><i data-lucide="mail" class="w-3.5 h-3.5 text-slate-400"></i> ${activeUser.email || 'user@pulsewave.io'}</span>
                <span class="text-slate-300">•</span>
                <span class="font-bold text-slate-800 flex items-center gap-1"><i data-lucide="building" class="w-3.5 h-3.5 text-slate-400"></i> Workspace: ${activeWorkspace ? activeWorkspace.name : 'Primary Workspace'}</span>
              </p>
            </div>
          </div>

          <!-- Workspace Actions -->
          <div class="flex items-center gap-2.5 shrink-0 relative z-10">
            <button onclick="window.app.openCreateWorkspaceModal()" class="px-4 py-2 bg-[#bef264] hover:bg-[#a3e635] text-slate-950 font-black text-xs rounded-xl shadow-xs shadow-[#bef264]/25 transition flex items-center gap-1.5 cursor-pointer hover:shadow">
              <i data-lucide="plus" class="w-4 h-4 text-slate-950"></i>
              <span>Create Workspace</span>
            </button>
          </div>
        </div>

        <!-- =========================================================================
             2. THE 4 ADVANCED 3D BENTO CARDS (Animated Holographic Micro-Visuals)
             ========================================================================= -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-4.5">
          
          <!-- Card 1: Workspaces & 3D Rotating Node Lattice -->
          <div class="dash-bento-card p-4 sm:p-4.5 cursor-pointer group flex flex-col justify-between relative overflow-hidden bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:border-slate-300 hover:shadow-md transition-all duration-200" onclick="window.app.navigate('projects')">
            <!-- 3D Canvas Visual in Upper Right Background -->
            <canvas id="bentoNodeLatticeCanvas" class="dash-canvas-bg absolute top-1 right-1 w-24 h-20 opacity-30 group-hover:opacity-70 transition-opacity pointer-events-none z-0" width="120" height="80"></canvas>
            
            <div class="relative z-10">
              <div class="flex items-center justify-between">
                <span class="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">WORKSPACES</span>
                <span class="px-1.5 py-0.5 rounded-md bg-slate-950 text-[#bef264] font-mono text-[9px] font-bold shadow-2xs">3D</span>
              </div>
              <div class="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight font-mono mt-2 mb-0.5">
                ${stats.activeProjectsCount}
              </div>
              <div class="text-xs text-slate-500 font-medium truncate">
                Active project workspaces
              </div>
            </div>

            <!-- Health Sine Wave Bottom Strip -->
            <div class="mt-3 pt-2.5 border-t border-slate-100 relative z-10 space-y-1.5">
              <div class="flex items-center justify-between text-[11px]">
                <span class="text-slate-500 font-medium">System Health</span>
                <span class="font-bold text-emerald-700 font-mono">${avgHealth}% Optimal</span>
              </div>
              <div class="w-full h-1.5 rounded-full overflow-hidden relative bg-slate-100">
                <canvas id="bentoHealthWaveCanvas" class="w-full h-full block" width="220" height="6"></canvas>
              </div>
            </div>
          </div>

          <!-- Card 2: Delivery Pipeline -->
          <div class="dash-bento-card p-4 sm:p-4.5 cursor-pointer group flex flex-col justify-between relative overflow-hidden bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:border-slate-300 hover:shadow-md transition-all duration-200" onclick="window.app.navigate('all-issues')">
            <div class="relative z-10">
              <div class="flex items-center justify-between">
                <span class="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">DELIVERY PIPELINE</span>
                <div class="w-6 h-6 rounded-lg bg-slate-950 text-white flex items-center justify-center shadow-2xs group-hover:scale-105 transition">
                  <i data-lucide="layers" class="w-3.5 h-3.5"></i>
                </div>
              </div>
              <div class="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight font-mono mt-2 mb-0.5">
                ${stats.totalIssues}
              </div>
              <div class="text-xs text-slate-500 font-medium truncate">
                ${stats.completed} delivered • ${stats.inProgress} in dev
              </div>
            </div>

            <div class="mt-3 pt-2.5 border-t border-slate-100 relative z-10 space-y-1.5">
              <div class="flex items-center justify-between text-[11px]">
                <span class="text-slate-500 font-medium">Sprint Resolution</span>
                <span class="font-bold text-slate-900 font-mono">${completionRate}% (${totalStoryPoints} SP)</span>
              </div>
              <div class="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div class="h-full bg-slate-950 rounded-full" style="width: ${completionRate}%"></div>
              </div>
            </div>
          </div>

          <!-- Card 3: QA Defects & 3D Glass Laser Prism -->
          <div class="dash-bento-card p-4 sm:p-4.5 cursor-pointer group flex flex-col justify-between relative overflow-hidden bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:border-slate-300 hover:shadow-md transition-all duration-200" onclick="window.app.navigate('all-issues')">
            <!-- 3D Glass Laser Prism Canvas in Upper Right Background -->
            <canvas id="bentoLaserPrismCanvas" class="dash-canvas-bg absolute top-1 right-1 w-24 h-20 opacity-30 group-hover:opacity-70 transition-opacity pointer-events-none z-0" width="120" height="80"></canvas>
            
            <div class="relative z-10">
              <div class="flex items-center justify-between">
                <span class="text-[11px] font-extrabold uppercase tracking-wider text-red-600 flex items-center gap-1">
                  QA DEFECTS
                </span>
                <div class="w-6 h-6 rounded-full bg-red-50 text-red-500 flex items-center justify-center border border-red-100">
                  <i data-lucide="sparkles" class="w-3 h-3 laser-beam-pulse"></i>
                </div>
              </div>
              <div class="text-2xl sm:text-3xl font-black text-red-600 tracking-tight font-mono mt-2 mb-0.5">
                ${openBugs.length}
              </div>
              <div class="text-xs text-slate-500 font-medium truncate">
                ${criticalBugs.length} Critical • ${highBugs.length} High priority
              </div>
            </div>

            <div class="mt-3 pt-2.5 border-t border-slate-100 relative z-10 space-y-1.5">
              <div class="flex items-center justify-between text-[11px]">
                <span class="text-slate-500 font-medium">QA Testing Queue</span>
                <span class="font-bold text-purple-700 font-mono">${stats.readyForQa || 0} Ready for QA</span>
              </div>
              <div class="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div class="h-full bg-red-500 rounded-full transition-all" style="width: ${Math.min(100, openBugs.length * 20)}%"></div>
              </div>
            </div>
          </div>

          <!-- Card 4: Quality Gate & 3D Holographic Verified Orb -->
          <div class="dash-bento-card p-4 sm:p-4.5 cursor-pointer group flex flex-col justify-between relative overflow-hidden bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:border-slate-300 hover:shadow-md transition-all duration-200" onclick="window.app.navigate('reports')">
            <!-- 3D Holographic Orb Canvas in Upper Right Background -->
            <canvas id="bentoQualityOrbCanvas" class="dash-canvas-bg absolute top-1 right-1 w-24 h-20 opacity-30 group-hover:opacity-70 transition-opacity pointer-events-none z-0" width="120" height="80"></canvas>

            <div class="relative z-10">
              <div class="flex items-center justify-between">
                <span class="text-[11px] font-extrabold uppercase tracking-wider text-[#4d7c0f]">QUALITY GATE</span>
                <div class="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                  <i data-lucide="shield-check" class="w-3 h-3"></i>
                </div>
              </div>
              <div class="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight font-mono mt-2 mb-0.5">
                ${stats.totalIssues > 0 ? Math.round((stats.completed / stats.totalIssues) * 100) : 100}%
              </div>
              <div class="text-xs text-slate-500 font-medium truncate">
                ${stats.completed} Verified ✓ • Release Ready
              </div>
            </div>

            <div class="mt-3 pt-2.5 border-t border-slate-100 relative z-10 space-y-1.5">
              <div class="flex items-center justify-between text-[11px]">
                <span class="text-slate-500 font-medium">Release Clearance</span>
                <span class="font-bold text-[#4d7c0f] font-mono flex items-center gap-1">Gate Passed</span>
              </div>
              <div class="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div class="h-full bg-[#84cc16] rounded-full transition-all" style="width: ${stats.totalIssues > 0 ? Math.round((stats.completed / stats.totalIssues) * 100) : 100}%"></div>
              </div>
            </div>
          </div>

        </div>

        <!-- =========================================================================
             3. ADVANCED VISUAL CHARTS (3D Topographic Sine Wave Mesh & Particle Vortex)
             ========================================================================= -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <!-- Left Visual: 3D Topographic Sine Wave Mesh Flow (2 Columns wide) -->
          <div class="dash-panel bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all p-5 sm:p-5.5 lg:col-span-2 flex flex-col justify-between relative overflow-hidden mesh-container">
            <div>
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
                <div class="flex items-center gap-2.5">
                  <div class="p-1.5 rounded-xl bg-[#f7fee7] text-[#4d7c0f] font-bold border border-[#d9f99d]">
                    <i data-lucide="activity" class="w-4 h-4"></i>
                  </div>
                  <div>
                    <h2 class="text-sm font-bold text-slate-950 tracking-tight">Sprint Velocity & Pipeline Activity</h2>
                    <p class="text-[11px] text-slate-400">Created, QA Verified, and Completed issues over sprint cycles</p>
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <span class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-mono text-[10px] font-bold border border-slate-200/80">All Sprints</span>
                  <span class="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono text-[10px] font-bold flex items-center gap-1">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Telemetry Live
                  </span>
                </div>
              </div>

              <!-- Interactive Topographic Wave Canvas -->
              <div class="mt-4 relative" style="height: 230px;">
                <canvas id="dashboardTopographyCanvas" class="w-full h-full block rounded-xl" width="680" height="230"></canvas>
              </div>
            </div>

            <!-- Chart Bottom Legend / Highlights -->
            <div class="mt-3 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
              <div class="p-3 rounded-xl bg-slate-50/90 border border-slate-200 shadow-2xs hover:bg-slate-100/70 transition">
                <span class="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">Total Work Items</span>
                <span class="font-bold text-slate-900 text-sm mt-0.5 block">${stats.totalIssues} Items</span>
              </div>
              <div class="p-3 rounded-xl bg-purple-50/80 border border-purple-200 shadow-2xs hover:bg-purple-100/50 transition">
                <span class="text-[10px] font-semibold text-purple-700 block uppercase tracking-wider">QA Verified</span>
                <span class="font-bold text-purple-950 text-sm mt-0.5 block">${stats.readyForQa + stats.completed} Signed</span>
              </div>
              <div class="p-3 rounded-xl bg-[#f7fee7] border border-[#d9f99d] shadow-2xs hover:bg-[#ecfccb] transition">
                <span class="text-[10px] font-semibold text-[#4d7c0f] block uppercase tracking-wider">Sprint Delivered</span>
                <span class="font-bold text-slate-950 text-sm mt-0.5 block">${completedStoryPoints} Story Points</span>
              </div>
            </div>
          </div>

          <!-- Right Visual: Swirling Particle Nebula / Vortex Donut -->
          <div class="dash-panel bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all p-5 sm:p-5.5 flex flex-col justify-between relative overflow-hidden">
            <div>
              <div class="flex items-center justify-between pb-3.5 border-b border-slate-100">
                <div class="flex items-center gap-2">
                  <div class="p-1.5 rounded-xl bg-red-50 text-red-600 font-bold border border-red-100">
                    <i data-lucide="clock" class="w-4 h-4"></i>
                  </div>
                  <div>
                    <h2 class="text-sm font-bold text-slate-950 tracking-tight">Defect Severity Ratio</h2>
                    <p class="text-[11px] text-slate-400">${openBugs.length} Active Defects</p>
                  </div>
                </div>
                <span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 font-mono border border-slate-200/80">QA Gates</span>
              </div>

              <!-- Animated Particle Vortex Canvas Container -->
              <div class="mt-4 relative flex items-center justify-center" style="height: 200px;">
                <canvas id="dashboardParticleVortexCanvas" class="w-full h-full block" width="320" height="200"></canvas>
              </div>
            </div>

            <!-- Severity 4-Grid -->
            <div class="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
              <div class="flex items-center justify-between p-2.5 rounded-xl bg-red-50/80 border border-red-200 shadow-2xs">
                <div class="flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-red-600"></span>
                  <span class="text-[11px] font-bold text-red-900">Critical</span>
                </div>
                <span class="font-bold text-red-700 font-mono">${criticalBugs.length}</span>
              </div>

              <div class="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 shadow-2xs">
                <div class="flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span class="text-[11px] font-bold text-amber-900">High</span>
                </div>
                <span class="font-bold text-amber-700 font-mono">${highBugs.length}</span>
              </div>

              <div class="flex items-center justify-between p-2.5 rounded-xl bg-slate-100/90 border border-slate-200/80 shadow-2xs">
                <div class="flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-slate-600"></span>
                  <span class="text-[11px] font-bold text-slate-900">Medium</span>
                </div>
                <span class="font-bold text-slate-800 font-mono">${mediumBugs.length}</span>
              </div>

              <div class="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 shadow-2xs">
                <div class="flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-slate-400"></span>
                  <span class="text-[11px] font-bold text-slate-700">Low</span>
                </div>
                <span class="font-bold text-slate-900 font-mono">${lowBugs.length}</span>
              </div>
            </div>
          </div>

        </div>

        <!-- =========================================================================
             4. SPLIT INTELLIGENCE: CRITICAL WATCHLIST & QA VERIFICATION QUEUE
             ========================================================================= -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <!-- Left Column: Critical Defect Watchlist -->
          <div class="dash-panel bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all p-5 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between pb-3.5 border-b border-slate-100">
                <div class="flex items-center gap-2">
                  <div class="p-1.5 rounded-lg bg-red-50 text-red-600 font-bold border border-red-100">
                    <i data-lucide="alert-octagon" class="w-4 h-4"></i>
                  </div>
                  <div>
                    <h2 class="text-sm font-bold text-slate-900 tracking-tight">Critical Defect Watchlist</h2>
                    <p class="text-[11px] text-slate-400">Highest severity blockers requiring immediate dev resolution</p>
                  </div>
                </div>
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                  ${criticalWatchlist.length} Blockers
                </span>
              </div>

              <!-- List of Blockers -->
              <div class="mt-3.5 space-y-2.5">
                ${criticalWatchlist.length === 0 ? `
                  <div class="p-8 text-center text-slate-400 text-xs">
                    <i data-lucide="check-circle" class="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80"></i>
                    <p class="font-bold text-slate-700">No Critical Blockers Found</p>
                    <p class="text-[11px] text-slate-400">All high severity defects are currently resolved.</p>
                  </div>
                ` : criticalWatchlist.map(bug => {
                  const assignee = (store.getUserById && store.getUserById(bug.assigneeId || bug.assignee_id)) || (bug.assignee ? { name: bug.assignee } : { name: "Unassigned" });
                  const project = (store.getProjectById && store.getProjectById(bug.projectId || bug.project_id)) || (bug.projectId ? { name: bug.projectId } : { name: "General" });
                  return `
                    <div onclick="window.app.openIssueDetails('${bug.id}')" class="p-3 rounded-xl bg-slate-50/80 hover:bg-red-50/50 border border-slate-200 hover:border-red-200 transition cursor-pointer flex items-center justify-between gap-3 group shadow-2xs">
                      <div class="flex items-start gap-2.5 min-w-0">
                        <span class="px-1.5 py-0.5 rounded font-mono font-bold text-[10px] type-bug shrink-0 mt-0.5">
                          ${bug.key}
                        </span>
                        <div class="min-w-0">
                          <h4 class="text-xs font-bold text-slate-900 group-hover:text-red-700 transition truncate">${bug.title}</h4>
                          <div class="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                            <span>${project ? project.name : ''}</span>
                            <span>•</span>
                            <span class="text-slate-500 font-medium">Assigned: ${assignee.name || 'Unassigned'}</span>
                          </div>
                        </div>
                      </div>

                      <div class="flex items-center gap-2 shrink-0">
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold ${bug.priority === 'Critical' ? 'priority-critical' : 'priority-high'}">
                          ${bug.priority || 'High'}
                        </span>
                        <i data-lucide="chevron-right" class="w-4 h-4 text-slate-400 group-hover:text-red-600 transition"></i>
                      </div>
                    </div>
                  `;
                }).join("")}
              </div>
            </div>

            <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Automatic priority escalation based on QA severity rating</span>
              <button onclick="window.app.navigate('all-issues')" class="text-red-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer">
                View All Bugs <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
              </button>
            </div>
          </div>

          <!-- Right Column: QA Verification Pipeline -->
          <div class="dash-panel bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all p-5 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between pb-3.5 border-b border-slate-100">
                <div class="flex items-center gap-2">
                  <div class="p-1.5 rounded-lg bg-purple-50 text-purple-600 font-bold border border-purple-100">
                    <i data-lucide="clipboard-check" class="w-4 h-4"></i>
                  </div>
                  <div>
                    <h2 class="text-sm font-bold text-slate-900 tracking-tight">QA Verification Queue</h2>
                    <p class="text-[11px] text-slate-400">Fixed items awaiting QA execution and sign-off</p>
                  </div>
                </div>
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                  ${qaQueue.length} Ready
                </span>
              </div>

              <!-- List of QA Queue Items -->
              <div class="mt-3.5 space-y-2.5">
                ${qaQueue.length === 0 ? `
                  <div class="p-8 text-center text-slate-400 text-xs">
                    <i data-lucide="inbox" class="w-8 h-8 text-purple-400 mx-auto mb-2 opacity-80"></i>
                    <p class="font-bold text-slate-700">QA Queue Empty</p>
                    <p class="text-[11px] text-slate-400">No issues are currently pending testing sign-off.</p>
                  </div>
                ` : qaQueue.map(item => {
                  const qaUser = (store.getUserById && store.getUserById(item.qaId || item.qa_id)) || (item.qaOwner ? { name: item.qaOwner } : { name: "QA Team" });
                  const project = (store.getProjectById && store.getProjectById(item.projectId || item.project_id)) || (item.projectId ? { name: item.projectId } : { name: "Project" });
                  return `
                    <div onclick="window.app.openIssueDetails('${item.id}')" class="p-3 rounded-xl bg-slate-50/80 hover:bg-purple-50/50 border border-slate-200 hover:border-purple-200 transition cursor-pointer flex items-center justify-between gap-3 group shadow-2xs">
                      <div class="flex items-start gap-2.5 min-w-0">
                        <span class="px-1.5 py-0.5 rounded font-mono font-bold text-[10px] ${item.type === 'Bug' || item.type === 'Defect' ? 'type-bug' : 'type-task'} shrink-0 mt-0.5">
                          ${item.key}
                        </span>
                        <div class="min-w-0">
                          <h4 class="text-xs font-bold text-slate-900 group-hover:text-purple-700 transition truncate">${item.title}</h4>
                          <div class="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                            <span class="font-medium text-slate-600">${project ? project.name : ''}</span>
                            <span>•</span>
                            <span class="text-purple-600 font-semibold">Env: ${item.environment || 'Staging'}</span>
                          </div>
                        </div>
                      </div>

                      <div class="flex items-center gap-2 shrink-0">
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold badge-qa">
                          QA Ready
                        </span>
                        <button class="px-2 py-1 bg-purple-600 text-white rounded-lg text-[10px] font-bold group-hover:bg-purple-700 transition">
                          Verify
                        </button>
                      </div>
                    </div>
                  `;
                }).join("")}
              </div>
            </div>

            <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Issues ready for QA lifecycle verification</span>
              <button onclick="window.app.navigate('all-issues')" class="text-purple-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer">
                Open All Issues <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
              </button>
            </div>
          </div>

        </div>

        <!-- =========================================================================
             4.5 EXECUTIVE RELEASE RISK OVERVIEW (Quality Gates Across Projects)
             ========================================================================= -->
        <div class="dash-panel bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all p-5">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
            <div class="flex items-center gap-2.5">
              <div class="p-1.5 rounded-xl bg-purple-50 text-purple-600 font-bold border border-purple-100">
                <i data-lucide="shield-alert" class="w-4 h-4"></i>
              </div>
              <div>
                <h2 class="text-sm font-bold text-slate-950 tracking-tight">Executive Release Risk Overview</h2>
                <p class="text-[11px] text-slate-400">Intelligent quality gate status across active software projects</p>
              </div>
            </div>
            <button onclick="window.app.navigate('projects')" class="text-xs text-slate-900 font-bold hover:underline cursor-pointer flex items-center gap-1">
              View All Projects <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
            </button>
          </div>

          <!-- Project Release Risk Grid / Table -->
          <div class="mt-4 overflow-x-auto">
            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr class="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-bold text-[10px] uppercase tracking-wider">
                  <th class="py-2.5 px-3">Project</th>
                  <th class="py-2.5 px-3">Active Release</th>
                  <th class="py-2.5 px-3 text-center">Quality Score</th>
                  <th class="py-2.5 px-3 text-center">Gate Status</th>
                  <th class="py-2.5 px-3 text-center">Critical Blockers</th>
                  <th class="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 font-medium">
                ${projects.length === 0 ? `
                  <tr>
                    <td colspan="6" class="text-center py-8 text-slate-400 text-xs font-medium">
                      No software projects found. Create a project to start tracking quality gates.
                    </td>
                  </tr>
                ` : projects.slice(0, 6).map(p => {
                  const qualityData = store.getOrComputeProjectQualityAssessment 
                    ? store.getOrComputeProjectQualityAssessment(p.id) 
                    : null;
                  
                  const activeRel = qualityData?.activeRelease || (store.getReleases ? store.getReleases(p.id)[0] : null);
                  const assessment = qualityData?.assessment || (activeRel ? store.getLatestReleaseAssessment(activeRel.id) : null);
                  const gate = assessment ? assessment.status : (activeRel ? 'READY' : 'NO_DATA');
                  const score = assessment && assessment.score !== null ? assessment.score : (activeRel ? 85 : null);
                  const pIssues = store.getIssues(p.id) || [];
                  const critCount = pIssues.filter(i => {
                    const pLevel = (i.priority || i.severity || '').toLowerCase();
                    return (pLevel === 'critical' || pLevel === 'p0') && i.status !== 'Done' && i.status !== 'Closed';
                  }).length;

                  return `
                    <tr class="hover:bg-slate-50/80 transition cursor-pointer" onclick="window.app.openProjectWorkspace('${p.id}'); setTimeout(() => ProjectWorkspaceView.switchTab('releases'), 50);">
                      <td class="py-3 px-3">
                        <div class="flex items-center gap-2">
                          <span class="w-2 h-2 rounded-full ${p.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-500'}"></span>
                          <span class="font-bold text-slate-900 hover:text-[#4d7c0f] transition">${p.name}</span>
                          <span class="font-mono text-[10px] text-slate-400">(${p.key})</span>
                        </div>
                      </td>

                      <td class="py-3 px-3">
                        ${activeRel ? `
                          <div class="flex items-center gap-1.5 font-bold text-slate-800">
                            <span>${activeRel.name}</span>
                            ${activeRel.version ? `<span class="px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 font-mono text-[9px] border border-purple-200">${activeRel.version}</span>` : ''}
                          </div>
                        ` : `<span class="text-slate-400 italic text-[11px]">Active Stream (${p.buildVersion || 'v1.0.0'})</span>`}
                      </td>

                      <td class="py-3 px-3 text-center font-mono">
                        ${score !== null ? `
                          <span class="px-2 py-0.5 rounded-lg font-bold text-xs ${
                            score >= 80 ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                            score >= 60 ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                            'bg-rose-50 text-rose-800 border border-rose-200'
                          }">${score} / 100</span>
                        ` : `<span class="text-slate-400 text-[11px]">N/A</span>`}
                      </td>

                      <td class="py-3 px-3 text-center">
                        ${typeof ReleasesView !== 'undefined' && ReleasesView.renderGateBadge 
                          ? ReleasesView.renderGateBadge(gate) 
                          : `<span class="px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              gate === 'READY' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                              gate === 'AT_RISK' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                              gate === 'NOT_READY' ? 'bg-rose-50 text-rose-800 border border-rose-200' :
                              'bg-slate-100 text-slate-600'
                            }">${gate === 'NOT_READY' ? '🔴 NOT READY' : gate === 'AT_RISK' ? '🟡 AT RISK' : gate === 'READY' ? '🟢 READY' : gate}</span>`}
                      </td>

                      <td class="py-3 px-3 text-center font-mono">
                        ${critCount > 0 ? `
                          <span class="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-bold border border-rose-200 text-xs">${critCount} Open</span>
                        ` : `<span class="text-emerald-600 font-bold">0</span>`}
                      </td>

                      <td class="py-3 px-3 text-right">
                        <button onclick="event.stopPropagation(); window.app.openProjectWorkspace('${p.id}'); setTimeout(() => ProjectWorkspaceView.switchTab('releases'), 50);" class="px-2.5 py-1 bg-slate-100 hover:bg-[#f7fee7] hover:text-[#4d7c0f] text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer">
                          View Gate &rarr;
                        </button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- =========================================================================
             5. PERSONAL FOCUS & LIVE AUDIT ACTIVITY FEED
             ========================================================================= -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <!-- Left: My Assigned Focus (1 Column) -->
          <div class="dash-panel bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all p-5 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between pb-3.5 border-b border-slate-100">
                <div class="flex items-center gap-2">
                  <div class="w-6 h-6 rounded-full ${activeUser.color || 'bg-slate-950 text-[#bef264]'} font-bold text-[10px] flex items-center justify-center shadow-2xs">
                    ${activeUser.initials || 'ME'}
                  </div>
                  <div>
                    <h2 class="text-sm font-bold text-slate-950 tracking-tight">Assigned to You</h2>
                    <p class="text-[11px] text-slate-400">Personalized focus for ${activeUser.name}</p>
                  </div>
                </div>
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${myAssignedIssues.length > 0 ? 'bg-[#f7fee7] text-[#4d7c0f] border border-[#d9f99d]' : 'bg-slate-100 text-slate-600'}">
                  ${myAssignedIssues.length} In Flight
                </span>
              </div>

              <!-- List of My Issues -->
              <div class="mt-3.5 space-y-2">
                ${myAssignedIssues.length === 0 ? `
                  <div class="p-6 text-center text-slate-400 text-xs space-y-2">
                    <div class="w-10 h-10 rounded-full bg-[#f7fee7] text-[#4d7c0f] border border-[#d9f99d] flex items-center justify-center mx-auto">
                      <i data-lucide="coffee" class="w-5 h-5"></i>
                    </div>
                    <div>
                      <p class="font-bold text-slate-800">All Caught Up!</p>
                      <p class="text-[11px] text-slate-400">No pending tasks or bugs assigned to you.</p>
                    </div>
                    ${store.canCreateIssue && store.canCreateIssue() ? `
                      <button onclick="window.app.openCreateTaskModal ? window.app.openCreateTaskModal() : window.app.openCreateIssueModal()" class="mt-2 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#bef264] hover:bg-[#a3e635] text-slate-950 font-bold text-xs transition cursor-pointer shadow-xs shadow-[#bef264]/25">
                        <i data-lucide="plus" class="w-3.5 h-3.5"></i> Create Task
                      </button>
                    ` : ''}
                  </div>
                ` : myAssignedIssues.map(issue => `
                  <div onclick="window.app.openIssueDetails('${issue.id}')" class="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 hover:border-slate-300 transition cursor-pointer flex items-center justify-between gap-2 group shadow-2xs">
                    <div class="flex items-center gap-2 min-w-0">
                      <span class="px-1.5 py-0.5 rounded font-mono font-bold text-[9px] ${issue.type === 'Bug' ? 'type-bug' : 'type-task'} shrink-0">${issue.key}</span>
                      <span class="text-xs font-semibold text-slate-800 group-hover:text-slate-950 transition truncate">${issue.title}</span>
                    </div>
                    <div class="flex items-center gap-1.5 shrink-0">
                      <span class="text-[9px] font-bold px-1.5 py-0.5 rounded ${issue.priority === 'Critical' ? 'priority-critical' : issue.priority === 'High' ? 'priority-high' : 'priority-medium'}">${issue.priority}</span>
                      <span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">${issue.status}</span>
                    </div>
                  </div>
                `).join("")}
              </div>
            </div>

            <div class="mt-3 pt-3 border-t border-slate-100">
              <button onclick="window.app.navigate('my-issues')" class="w-full py-2 bg-slate-950 hover:bg-slate-900 text-[#bef264] rounded-xl text-xs font-bold transition text-center block cursor-pointer shadow-2xs">
                View My Workspace
              </button>
            </div>
          </div>

          <!-- Right: Live Activity Audit Feed (2 Columns wide) -->
          <div class="dash-panel bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all p-5 lg:col-span-2 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-3.5">
                <div class="flex items-center gap-2">
                  <div class="p-1.5 rounded-lg bg-slate-950 text-[#bef264] font-bold">
                    <i data-lucide="activity" class="w-4 h-4"></i>
                  </div>
                  <div>
                    <h2 class="text-sm font-bold text-slate-950 tracking-tight">Live Project & Quality Stream</h2>
                    <p class="text-[11px] text-slate-400">Real-time team activity, defect updates, and lifecycle transitions</p>
                  </div>
                </div>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 font-mono">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Live Telemetry
                </span>
              </div>

              <div class="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                ${activities.length === 0 ? `
                  <div class="p-8 text-center text-slate-400 text-xs">
                    <i data-lucide="activity" class="w-8 h-8 text-slate-300 mx-auto mb-2"></i>
                    <p class="font-bold text-slate-700">No Activity Logged Yet</p>
                    <p class="text-[11px] text-slate-400">Team project and QA events will stream here in real-time.</p>
                  </div>
                ` : activities.map(act => {
                  const userInitials = act.user ? store.getInitials(act.user) : "PW";
                  const isIssue = act.issueKey && (act.issueKey.startsWith("BUG") || act.issueKey.startsWith("TSK") || act.issueKey.startsWith("STY") || act.issueId);
                  const clickHandler = isIssue && act.issueId ? `onclick="window.app.openIssueDetails('${act.issueId}')"` :
                                       act.projectId ? `onclick="window.app.openProjectWorkspace('${act.projectId}')"` : '';
                  return `
                    <div class="flex items-center justify-between p-2 rounded-xl bg-slate-50/50 hover:bg-slate-100/80 border border-slate-200/60 hover:border-slate-300 transition gap-3 text-xs group ${clickHandler ? 'cursor-pointer' : ''}" ${clickHandler}>
                      <div class="flex items-center gap-2.5 min-w-0">
                        <div class="w-6 h-6 rounded-full bg-slate-950 text-[#bef264] font-bold text-[9px] flex items-center justify-center shrink-0 shadow-2xs uppercase">
                          ${userInitials}
                        </div>
                        <span class="px-2 py-0.5 rounded bg-slate-100 group-hover:bg-[#f7fee7] group-hover:text-[#4d7c0f] text-slate-700 font-mono text-[10px] font-bold shrink-0 transition">
                          ${act.issueKey || 'SYS'}
                        </span>
                        <p class="text-slate-700 truncate min-w-0">
                          <strong class="text-slate-900">${act.user}</strong>: <span class="text-slate-600">${act.action}</span>
                        </p>
                      </div>
                      <span class="text-[10px] text-slate-400 shrink-0 font-mono font-medium">${act.time}</span>
                    </div>
                  `;
                }).join("")}
              </div>
            </div>

            <div class="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Streams all issues, defect clearances, sprints & quality gates</span>
              <button onclick="window.app.navigate('all-issues')" class="text-slate-900 hover:text-black font-bold flex items-center gap-1 cursor-pointer">
                View All Stream <i data-lucide="arrow-right" class="w-3.5 h-3.5 text-slate-900"></i>
              </button>
            </div>
          </div>

        </div>

      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    // Launch all interactive 3D and canvas animation loops
    setTimeout(() => {
      this.initBento3DCanvases(avgHealth, openBugs, stats);
      this.initTopographyWaveCanvas(stats, completedStoryPoints);
      this.initParticleVortexCanvas(openBugs, criticalBugs, highBugs, mediumBugs, lowBugs);
    }, 40);
  },

  // =========================================================================
  // 1. BENTO 3D CANVAS ANIMATIONS (Node Lattice, Health Sine, Prism, Orb)
  // =========================================================================
  initBento3DCanvases(avgHealth, openBugs, stats) {
    if (typeof requestAnimationFrame !== "function") return;

    // --- A. 3D Rotating Node Lattice Mesh Canvas ---
    const latticeCanvas = document.getElementById("bentoNodeLatticeCanvas");
    if (latticeCanvas && typeof latticeCanvas.getContext === "function") {
      const ctx = latticeCanvas.getContext("2d");
      if (ctx && typeof ctx.clearRect === "function") {
        let angleX = 0;
        let angleY = 0;
        
        // 3D Icosahedron Vertices
        const phi = (1 + Math.sqrt(5)) / 2;
        const rawVertices = [
          [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
          [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
          [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1]
        ].map(v => {
          const mag = Math.sqrt(v[0]**2 + v[1]**2 + v[2]**2);
          return [v[0] / mag * 30, v[1] / mag * 30, v[2] / mag * 30];
        });

        const drawLattice = () => {
          ctx.clearRect(0, 0, latticeCanvas.width, latticeCanvas.height);
          const cx = latticeCanvas.width / 2 + 10;
          const cy = latticeCanvas.height / 2;

          angleX += 0.008;
          angleY += 0.012;

          // Rotate and project points
          const projected = rawVertices.map(v => {
            // Rotate Y
            let x1 = v[0] * Math.cos(angleY) + v[2] * Math.sin(angleY);
            let z1 = -v[0] * Math.sin(angleY) + v[2] * Math.cos(angleY);
            // Rotate X
            let y2 = v[1] * Math.cos(angleX) - z1 * Math.sin(angleX);
            let z2 = v[1] * Math.sin(angleX) + z1 * Math.cos(angleX);
            // Perspective
            const scale = 120 / (120 + z2);
            return { x: cx + x1 * scale, y: cy + y2 * scale, z: z2 };
          });

          // Draw connecting lattice lines
          ctx.lineWidth = 0.85;
          for (let i = 0; i < projected.length; i++) {
            for (let j = i + 1; j < projected.length; j++) {
              const dx = projected[i].x - projected[j].x;
              const dy = projected[i].y - projected[j].y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < 36) {
                const alpha = Math.max(0.1, 1 - dist / 36) * 0.45;
                ctx.strokeStyle = `rgba(59, 130, 246, ${alpha})`;
                ctx.beginPath();
                ctx.moveTo(projected[i].x, projected[i].y);
                ctx.lineTo(projected[j].x, projected[j].y);
                ctx.stroke();
              }
            }
          }

          // Draw Glowing Nodes
          projected.forEach(p => {
            const nodeAlpha = Math.max(0.3, (p.z + 30) / 60);
            ctx.fillStyle = `rgba(37, 99, 235, ${nodeAlpha})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = `rgba(147, 197, 253, ${nodeAlpha * 0.8})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 1, 0, Math.PI * 2);
            ctx.fill();
          });

          const animId = requestAnimationFrame(drawLattice);
          this.animationFrameIds.push(animId);
        };
        drawLattice();
      }
    }

    // --- B. Glowing Health Sine Wave Bottom Strip ---
    const healthCanvas = document.getElementById("bentoHealthWaveCanvas");
    if (healthCanvas && typeof healthCanvas.getContext === "function") {
      const ctx = healthCanvas.getContext("2d");
      if (ctx && typeof ctx.clearRect === "function") {
        let waveOffset = 0;
        const drawWave = () => {
          ctx.clearRect(0, 0, healthCanvas.width, healthCanvas.height);
          waveOffset += 0.05;

          ctx.beginPath();
          ctx.moveTo(0, healthCanvas.height / 2);
          for (let x = 0; x < healthCanvas.width; x++) {
            const y = healthCanvas.height / 2 + Math.sin(x * 0.06 + waveOffset) * 2.5;
            ctx.lineTo(x, y);
          }
          const grad = ctx.createLinearGradient(0, 0, healthCanvas.width, 0);
          grad.addColorStop(0, '#10b981');
          grad.addColorStop(0.5, '#bef264');
          grad.addColorStop(1, '#84cc16');
          ctx.strokeStyle = grad;
          ctx.lineWidth = 2.5;
          ctx.stroke();

          const animId = requestAnimationFrame(drawWave);
          this.animationFrameIds.push(animId);
        };
        drawWave();
      }
    }

    // --- C. 3D Glass Laser Prism & Dispersion Beams ---
    const prismCanvas = document.getElementById("bentoLaserPrismCanvas");
    if (prismCanvas && typeof prismCanvas.getContext === "function") {
      const ctx = prismCanvas.getContext("2d");
      if (ctx && typeof ctx.clearRect === "function") {
        let t = 0;
        const drawPrism = () => {
          ctx.clearRect(0, 0, prismCanvas.width, prismCanvas.height);
          t += 0.02;

          const cx = prismCanvas.width / 2 + 15;
          const cy = prismCanvas.height / 2;

          // Glowing laser beam entering prism
          const laserY = cy + Math.sin(t * 1.5) * 3;
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
          ctx.lineWidth = 2;
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.moveTo(0, laserY);
          ctx.lineTo(cx - 20, cy);
          ctx.stroke();
          ctx.shadowBlur = 0;

          // 3D Glass Triangular Prism Faces
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.strokeStyle = 'rgba(203, 213, 225, 0.9)';
          ctx.lineWidth = 1.5;

          // Front triangle
          ctx.beginPath();
          ctx.moveTo(cx, cy - 35);
          ctx.lineTo(cx - 30, cy + 25);
          ctx.lineTo(cx + 30, cy + 25);
          ctx.closePath();
          ctx.fillStyle = 'rgba(254, 226, 226, 0.25)';
          ctx.fill();
          ctx.stroke();

          // Prism Reflection / Dispersion Beams
          const dispersionAlpha = 0.4 + Math.sin(t * 2) * 0.2;
          const beamGrad = ctx.createLinearGradient(cx + 10, cy, prismCanvas.width, cy);
          beamGrad.addColorStop(0, `rgba(239, 68, 68, ${dispersionAlpha})`);
          beamGrad.addColorStop(0.5, `rgba(249, 115, 22, ${dispersionAlpha * 0.7})`);
          beamGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

          ctx.fillStyle = beamGrad;
          ctx.beginPath();
          ctx.moveTo(cx + 10, cy - 10);
          ctx.lineTo(prismCanvas.width, cy - 30);
          ctx.lineTo(prismCanvas.width, cy + 30);
          ctx.lineTo(cx + 15, cy + 15);
          ctx.closePath();
          ctx.fill();

          const animId = requestAnimationFrame(drawPrism);
          this.animationFrameIds.push(animId);
        };
        drawPrism();
      }
    }

    // --- D. 3D Holographic Verified Shield Orb Canvas ---
    const orbCanvas = document.getElementById("bentoQualityOrbCanvas");
    if (orbCanvas && typeof orbCanvas.getContext === "function") {
      const ctx = orbCanvas.getContext("2d");
      if (ctx && typeof ctx.clearRect === "function") {
        let pulse = 0;
        const drawOrb = () => {
          ctx.clearRect(0, 0, orbCanvas.width, orbCanvas.height);
          pulse += 0.025;

          const cx = orbCanvas.width / 2 + 10;
          const cy = orbCanvas.height / 2;
          const r = 30;

          // Radiating Concentric Holographic Rings
          for (let i = 0; i < 3; i++) {
            const ringR = r + ((pulse * 15 + i * 14) % 36);
            const ringAlpha = Math.max(0, 1 - (ringR - r) / 36) * 0.35;
            ctx.strokeStyle = `rgba(132, 204, 22, ${ringAlpha})`;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
            ctx.stroke();
          }

          // Glass Orb Sphere Gradient
          const orbGrad = ctx.createRadialGradient(cx - 10, cy - 10, 4, cx, cy, r);
          orbGrad.addColorStop(0, '#ffffff');
          orbGrad.addColorStop(0.3, '#d9f99d');
          orbGrad.addColorStop(0.7, '#84cc16');
          orbGrad.addColorStop(1, '#4d7c0f');

          ctx.fillStyle = orbGrad;
          ctx.shadowColor = 'rgba(132, 204, 22, 0.4)';
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;

          // Verified Checkmark in Center
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 3.5;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.beginPath();
          ctx.moveTo(cx - 11, cy);
          ctx.lineTo(cx - 3, cy + 8);
          ctx.lineTo(cx + 12, cy - 7);
          ctx.stroke();

          const animId = requestAnimationFrame(drawOrb);
          this.animationFrameIds.push(animId);
        };
        drawOrb();
      }
    }
  },

  // =========================================================================
  // 2. 3D TOPOGRAPHIC SINE WAVE MESH (Sprint Velocity & Activity)
  // =========================================================================
  initTopographyWaveCanvas(stats, completedSP) {
    if (typeof requestAnimationFrame !== "function") return;
    const canvas = document.getElementById("dashboardTopographyCanvas");
    if (!canvas || typeof canvas.getContext !== "function") return;
    const ctx = canvas.getContext("2d");
    if (!ctx || typeof ctx.clearRect !== "function") return;

    let time = 0;
    const totalIss = stats.totalIssues || 1;
    const totalDone = stats.completed || 0;

    const drawMesh = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 0.015;

      const w = canvas.width;
      const h = canvas.height;
      const baselineY = h - 35;

      // Draw Grid Axes
      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 1;
      for (let y = 30; y < baselineY; y += 40) {
        ctx.beginPath();
        ctx.moveTo(30, y);
        ctx.lineTo(w - 20, y);
        ctx.stroke();
      }

      // X-Axis Labels (Sprint 1 to Sprint 5)
      const sprintCols = [w * 0.1, w * 0.3, w * 0.5, w * 0.7, w * 0.9];
      const sprintNames = ['Sprint 1', 'Sprint 2', 'Sprint 3', 'Sprint 4 (Active)', 'Sprint 5 (Projected)'];

      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'center';
      sprintCols.forEach((x, idx) => {
        ctx.fillText(sprintNames[idx], x, h - 10);
      });

      // --- Wave 1: Delivered / Done (Radiant Lime Wave Mesh) ---
      const waveGrad = ctx.createLinearGradient(0, 0, 0, baselineY);
      waveGrad.addColorStop(0, 'rgba(190, 242, 100, 0.35)');
      waveGrad.addColorStop(1, 'rgba(190, 242, 100, 0.0)');

      ctx.beginPath();
      ctx.moveTo(30, baselineY);
      for (let x = 30; x <= w - 20; x += 4) {
        const norm = (x - 30) / (w - 50);
        const y = baselineY - (Math.sin(norm * Math.PI * 3.2 + time) * 35 + Math.cos(norm * Math.PI * 2 + time * 0.8) * 20 + 55);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w - 20, baselineY);
      ctx.closePath();
      ctx.fillStyle = waveGrad;
      ctx.fill();

      // Topography Wireframe Mesh Columns
      ctx.strokeStyle = 'rgba(132, 204, 22, 0.25)';
      ctx.lineWidth = 0.75;
      for (let x = 30; x <= w - 20; x += 18) {
        const norm = (x - 30) / (w - 50);
        const y = baselineY - (Math.sin(norm * Math.PI * 3.2 + time) * 35 + Math.cos(norm * Math.PI * 2 + time * 0.8) * 20 + 55);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, baselineY);
        ctx.stroke();
      }

      // --- Wave 2: Issues Created (Deep Dark Wave Line & Nodes) ---
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let x = 30; x <= w - 20; x += 4) {
        const norm = (x - 30) / (w - 50);
        const y = baselineY - (Math.sin(norm * Math.PI * 2.8 + time * 1.1) * 45 + 65);
        if (x === 30) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // --- Wave 3: QA Verified (Cyan/Teal Dashed Wave) ---
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      for (let x = 30; x <= w - 20; x += 4) {
        const norm = (x - 30) / (w - 50);
        const y = baselineY - (Math.cos(norm * Math.PI * 2.5 + time * 0.9) * 38 + 50);
        if (x === 30) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Top Key Indicators
      sprintCols.forEach((x, idx) => {
        const norm = (x - 30) / (w - 50);
        const y1 = baselineY - (Math.sin(norm * Math.PI * 2.8 + time * 1.1) * 45 + 65);
        ctx.fillStyle = '#020617';
        ctx.beginPath();
        ctx.arc(x, y1, 3.5, 0, Math.PI * 2);
        ctx.fill();

        const y2 = baselineY - (Math.sin(norm * Math.PI * 3.2 + time) * 35 + Math.cos(norm * Math.PI * 2 + time * 0.8) * 20 + 55);
        ctx.fillStyle = '#84cc16';
        ctx.beginPath();
        ctx.arc(x, y2, 3.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Canvas Legend inside graph
      ctx.textAlign = 'right';
      ctx.font = '10px Inter, sans-serif';
      
      ctx.fillStyle = '#020617';
      ctx.beginPath(); ctx.arc(w - 210, 16, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillText('Issues Created', w - 145, 19);

      ctx.fillStyle = '#84cc16';
      ctx.beginPath(); ctx.arc(w - 130, 16, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillText('Delivered / Done', w - 60, 19);

      ctx.fillStyle = '#06b6d4';
      ctx.beginPath(); ctx.arc(w - 45, 16, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillText('QA Verified', w - 5, 19);

      const animId = requestAnimationFrame(drawMesh);
      this.animationFrameIds.push(animId);
    };
    drawMesh();
  },

  // =========================================================================
  // 3. SWIRLING PARTICLE NEBULA / VORTEX DONUT (Defect Severity Ratio)
  // =========================================================================
  initParticleVortexCanvas(openBugs, criticalBugs, highBugs, mediumBugs, lowBugs) {
    if (typeof requestAnimationFrame !== "function") return;
    const canvas = document.getElementById("dashboardParticleVortexCanvas");
    if (!canvas || typeof canvas.getContext !== "function") return;
    const ctx = canvas.getContext("2d");
    if (!ctx || typeof ctx.clearRect !== "function") return;

    const numParticles = 420;
    const particles = [];
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    const colors = [
      '#dc2626', // Critical Red
      '#ea580c', // High Orange
      '#2563eb', // Medium Indigo/Blue
      '#84cc16'  // Low Lime
    ];

    for (let i = 0; i < numParticles; i++) {
      const radius = 22 + Math.random() * 52;
      const angle = Math.random() * Math.PI * 2;
      const speed = (0.012 + Math.random() * 0.018) * (radius > 45 ? 1 : 1.25);
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = 1.2 + Math.random() * 1.8;
      particles.push({ radius, angle, speed, color, size });
    }

    const drawVortex = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Render Swirling Particle Spiral Nebula
      particles.forEach(p => {
        p.angle += p.speed;
        const spiralR = p.radius + Math.sin(p.angle * 2) * 4;
        const x = cx + Math.cos(p.angle) * spiralR;
        const y = cy + Math.sin(p.angle) * (spiralR * 0.85);

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Central Dark Eye / Core
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.beginPath();
      ctx.arc(cx, cy, 18, 0, Math.PI * 2);
      ctx.fill();

      // Floating Callout Badges
      // 1. Critical Label Pill
      ctx.fillStyle = 'rgba(254, 242, 242, 0.95)';
      ctx.strokeStyle = '#fecaca';
      ctx.lineWidth = 1;
      ctx.beginPath();
      if (typeof ctx.roundRect === "function") {
        ctx.roundRect(cx - 75, cy - 65, 45, 18, 6);
      } else {
        ctx.rect(cx - 75, cy - 65, 45, 18);
      }
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#dc2626';
      ctx.font = 'bold 9px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Critical', cx - 52, cy - 53);

      // 2. Medium Label Pill
      ctx.fillStyle = 'rgba(239, 246, 255, 0.95)';
      ctx.strokeStyle = '#bfdbfe';
      ctx.beginPath();
      if (typeof ctx.roundRect === "function") {
        ctx.roundRect(cx + 35, cy - 65, 45, 18, 6);
      } else {
        ctx.rect(cx + 35, cy - 65, 45, 18);
      }
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#2563eb';
      ctx.fillText('Medium', cx + 58, cy - 53);

      const animId = requestAnimationFrame(drawVortex);
      this.animationFrameIds.push(animId);
    };
    drawVortex();
  }
};

if (typeof window !== "undefined") window.DashboardView = DashboardView;
if (typeof global !== "undefined") global.DashboardView = DashboardView;
if (typeof module !== "undefined" && module.exports) module.exports = DashboardView;
